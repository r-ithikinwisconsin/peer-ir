-- DecIQ — public vote aggregate
-- Voting goes public: per-decision voter lists with profile fields, plus
-- optional filters (role, practice_setting, years_out_of_training range).
-- Still SECURITY DEFINER so the RPC can read voter_id even though the
-- case_votes SELECT policy is own-only — callers only get fields this
-- function chooses to return.

create or replace function public.get_case_vote_aggregate(
  p_case_id uuid,
  p_filters jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_roles text[];
  v_settings text[];
  v_years_min integer;
  v_years_max integer;
  v_total_unfiltered integer;
  v_total integer;
  v_distribution jsonb;
  v_other_texts jsonb;
  v_own jsonb;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  v_roles := case
    when jsonb_typeof(p_filters -> 'roles') = 'array'
      then array(select jsonb_array_elements_text(p_filters -> 'roles'))
    else null
  end;
  v_settings := case
    when jsonb_typeof(p_filters -> 'practice_settings') = 'array'
      then array(select jsonb_array_elements_text(p_filters -> 'practice_settings'))
    else null
  end;
  v_years_min := nullif(p_filters ->> 'years_min', '')::int;
  v_years_max := nullif(p_filters ->> 'years_max', '')::int;

  select count(*)::int into v_total_unfiltered
  from public.case_votes
  where case_id = p_case_id;

  with filtered as (
    select
      v.id,
      v.decision_id,
      v.other_text,
      v.created_at,
      v.voter_id,
      p.display_name,
      p.role,
      p.years_out_of_training,
      p.practice_setting
    from public.case_votes v
    join public.profiles p on p.id = v.voter_id
    where v.case_id = p_case_id
      and (v_roles is null or array_length(v_roles, 1) is null
           or p.role::text = any(v_roles))
      and (v_settings is null or array_length(v_settings, 1) is null
           or p.practice_setting::text = any(v_settings))
      and (v_years_min is null or p.years_out_of_training is null
           or p.years_out_of_training >= v_years_min)
      and (v_years_max is null or p.years_out_of_training is null
           or p.years_out_of_training <= v_years_max)
  ),
  totals as (
    select count(*)::int as n from filtered
  ),
  grouped as (
    select
      f.decision_id,
      count(*)::int as n,
      round((count(*)::numeric / nullif((select n from totals), 0)) * 100, 1) as pct,
      jsonb_agg(
        jsonb_build_object(
          'id', f.voter_id,
          'name', coalesce(nullif(f.display_name, ''), 'Anonymous'),
          'role', f.role,
          'years_out_of_training', f.years_out_of_training,
          'practice_setting', f.practice_setting
        )
        order by coalesce(f.display_name, '')
      ) as voters
    from filtered f
    group by f.decision_id
  )
  select
    (select n from totals),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'decision_id', g.decision_id,
            'count', g.n,
            'pct', g.pct,
            'voters', g.voters
          ) order by g.n desc
        )
        from grouped g
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select jsonb_agg(f.other_text order by f.created_at)
        from filtered f
        where f.decision_id = 'other'
          and f.other_text is not null
          and length(f.other_text) > 0
      ),
      '[]'::jsonb
    )
  into v_total, v_distribution, v_other_texts;

  select jsonb_build_object(
    'decision_id', v.decision_id,
    'other_text', v.other_text
  )
  into v_own
  from public.case_votes v
  where v.case_id = p_case_id and v.voter_id = v_user;

  return jsonb_build_object(
    'total', v_total,
    'total_unfiltered', v_total_unfiltered,
    'distribution', v_distribution,
    'other_texts', v_other_texts,
    'own_vote', v_own
  );
end;
$$;

revoke all on function public.get_case_vote_aggregate(uuid, jsonb) from public;
grant execute on function public.get_case_vote_aggregate(uuid, jsonb) to authenticated;

drop function if exists public.get_case_vote_aggregate(uuid);

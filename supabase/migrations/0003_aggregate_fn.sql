-- DecIQ — RPCs
-- create_case: inserts a case + the submitter's own vote atomically.
-- get_case_vote_aggregate: returns the poll distribution for a case plus
--   the caller's own vote so the UI can highlight it.

-- ------------------------------------------------------------
-- create_case
-- Both inserts run inside one transaction so a case never exists without
-- its submitter's vote. SECURITY DEFINER bypasses the RLS gate on cases
-- so the server can set submitter_id = auth.uid() in one step.
-- ------------------------------------------------------------
create or replace function public.create_case(
  p_age integer,
  p_gender public.patient_gender,
  p_case_variables jsonb,
  p_decision_id text,
  p_other_text text default null,
  p_reason_ids text[] default '{}'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_case_id uuid;
  v_case_number integer;
  v_template_id uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select id into v_template_id
  from public.case_templates
  where slug = 'pulmonary-embolism' and is_active
  limit 1;

  if v_template_id is null then
    raise exception 'case template not found';
  end if;

  insert into public.cases (
    submitter_id, case_template_id,
    patient_age, patient_gender,
    case_variables,
    submitter_decision_id, submitter_other_text, submitter_reason_ids
  )
  values (
    v_user, v_template_id,
    p_age, p_gender,
    coalesce(p_case_variables, '{}'::jsonb),
    p_decision_id,
    nullif(p_other_text, ''),
    coalesce(p_reason_ids, '{}')
  )
  returning id, case_number into v_case_id, v_case_number;

  insert into public.case_votes (case_id, voter_id, decision_id, other_text)
  values (v_case_id, v_user, p_decision_id, nullif(p_other_text, ''));

  return jsonb_build_object(
    'case_id', v_case_id,
    'case_number', v_case_number
  );
end;
$$;

revoke all on function public.create_case(
  integer, public.patient_gender, jsonb, text, text, text[]
) from public;
grant execute on function public.create_case(
  integer, public.patient_gender, jsonb, text, text, text[]
) to authenticated;

-- ------------------------------------------------------------
-- get_case_vote_aggregate
-- Returns: { total, distribution[{decision_id,count,pct}], other_texts[],
--            own_vote?: {decision_id, other_text} }
-- Never returns voter identifiers.
-- ------------------------------------------------------------
create or replace function public.get_case_vote_aggregate(p_case_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_total integer;
  v_distribution jsonb;
  v_other_texts jsonb;
  v_own jsonb;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select count(*)::int into v_total
  from public.case_votes
  where case_id = p_case_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'decision_id', decision_id,
        'count', n,
        'pct', pct
      ) order by n desc
    ),
    '[]'::jsonb
  )
  into v_distribution
  from (
    select
      decision_id,
      count(*)::int as n,
      round((count(*)::numeric / nullif(v_total, 0)) * 100, 1) as pct
    from public.case_votes
    where case_id = p_case_id
    group by decision_id
  ) r;

  select coalesce(jsonb_agg(other_text order by created_at), '[]'::jsonb)
  into v_other_texts
  from public.case_votes
  where case_id = p_case_id
    and decision_id = 'other'
    and other_text is not null
    and length(other_text) > 0;

  select jsonb_build_object(
    'decision_id', decision_id,
    'other_text', other_text
  )
  into v_own
  from public.case_votes
  where case_id = p_case_id and voter_id = v_user;

  return jsonb_build_object(
    'total', v_total,
    'distribution', v_distribution,
    'other_texts', v_other_texts,
    'own_vote', v_own
  );
end;
$$;

revoke all on function public.get_case_vote_aggregate(uuid) from public;
grant execute on function public.get_case_vote_aggregate(uuid) to authenticated;

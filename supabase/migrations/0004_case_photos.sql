-- DecIQ — Case photos
-- Adds an immutable photo_paths array to cases. The storage bucket and its
-- RLS policies live in docker/migrator/storage-init.sql, which runs after
-- supabase/storage-api has applied its own schema migrations.

alter table public.cases
  add column if not exists photo_paths text[] not null default '{}';

alter table public.cases
  drop constraint if exists cases_photo_paths_limit;
alter table public.cases
  add constraint cases_photo_paths_limit
  check (array_length(photo_paths, 1) is null or array_length(photo_paths, 1) <= 5);

-- Rewrite create_case to accept photo paths. Signature change → drop first.
drop function if exists public.create_case(
  integer, public.patient_gender, jsonb, text, text, text[]
);

create or replace function public.create_case(
  p_age integer,
  p_gender public.patient_gender,
  p_case_variables jsonb,
  p_decision_id text,
  p_other_text text default null,
  p_reason_ids text[] default '{}',
  p_photo_paths text[] default '{}'
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
    submitter_decision_id, submitter_other_text, submitter_reason_ids,
    photo_paths
  )
  values (
    v_user, v_template_id,
    p_age, p_gender,
    coalesce(p_case_variables, '{}'::jsonb),
    p_decision_id,
    nullif(p_other_text, ''),
    coalesce(p_reason_ids, '{}'),
    coalesce(p_photo_paths, '{}')
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
  integer, public.patient_gender, jsonb, text, text, text[], text[]
) from public;
grant execute on function public.create_case(
  integer, public.patient_gender, jsonb, text, text, text[], text[]
) to authenticated;

-- DecIQ — Row Level Security
-- Aggregate reads of votes go through the SECURITY DEFINER RPC in 0003.
-- All other reads/writes flow through per-table policies.

alter table public.profiles enable row level security;
alter table public.case_templates enable row level security;
alter table public.cases enable row level security;
alter table public.case_votes enable row level security;

-- ------------------------------------------------------------
-- Admin self-check — used by case_templates write policy.
-- SECURITY DEFINER bypasses RLS for the self-lookup (prevents recursion).
-- ------------------------------------------------------------
create or replace function public.is_admin_self()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin_self() to authenticated;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create policy profiles_select_all
  on public.profiles
  for select
  to authenticated
  using (true);

create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id or public.is_admin_self())
  with check (auth.uid() = id or public.is_admin_self());

create policy profiles_insert_self
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- case_templates
-- Read-only for regular users. Admin writes (not currently exposed in UI).
-- ------------------------------------------------------------
create policy case_templates_select_active
  on public.case_templates
  for select
  to authenticated
  using (is_active or public.is_admin_self());

create policy case_templates_admin_write
  on public.case_templates
  for all
  to authenticated
  using (public.is_admin_self())
  with check (public.is_admin_self());

-- ------------------------------------------------------------
-- cases
-- All authenticated users can read all cases. Each case is already
-- de-identified (only age/gender/clinical variables, no PHI).
-- Insert goes through the create_case RPC which enforces submitter_id.
-- ------------------------------------------------------------
create policy cases_select_all
  on public.cases
  for select
  to authenticated
  using (true);

create policy cases_insert_self
  on public.cases
  for insert
  to authenticated
  with check (auth.uid() = submitter_id);

-- No UPDATE/DELETE — cases are append-only once submitted.

-- ------------------------------------------------------------
-- case_votes
-- Users see only their own votes through the table. Aggregate reads go
-- through public.get_case_vote_aggregate (see 0003) which returns counts
-- and (for "other" picks) the free-text list — never voter_id.
-- ------------------------------------------------------------
create policy case_votes_select_own
  on public.case_votes
  for select
  to authenticated
  using (auth.uid() = voter_id);

create policy case_votes_insert_own
  on public.case_votes
  for insert
  to authenticated
  with check (auth.uid() = voter_id);

-- No UPDATE/DELETE — votes are append-only.

-- ------------------------------------------------------------
-- Grants
-- ------------------------------------------------------------
grant usage on schema public to authenticated, anon;
grant usage, select on sequence public.cases_number_seq to authenticated;
grant select on public.profiles to authenticated;
grant insert, update on public.profiles to authenticated;
grant select on public.case_templates to authenticated;
grant insert, update, delete on public.case_templates to authenticated;
grant select, insert on public.cases to authenticated;
grant select, insert on public.case_votes to authenticated;

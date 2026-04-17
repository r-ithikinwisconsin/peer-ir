-- DecIQ — initial schema
-- Users post real cases. Peers answer "what would you pick?" on each case.
-- The submitter's own pick is recorded as the first vote; other users add more.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type public.user_role as enum (
  'attending', 'fellow', 'resident', 'medical_student', 'other'
);

create type public.practice_setting as enum (
  'academic', 'community', 'hybrid', 'private_practice', 'other'
);

create type public.case_category as enum (
  'oncology', 'vascular', 'gi_bleed', 'venous', 'biliary', 'other'
);

create type public.patient_gender as enum (
  'male', 'female', 'other'
);

-- ------------------------------------------------------------
-- updated_at trigger helper
-- ------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- profiles
-- One row per auth user. Professional metadata only — no PHI.
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role,
  years_out_of_training integer,
  practice_setting public.practice_setting,
  display_name text,
  is_anonymous_public boolean not null default true,
  is_admin boolean not null default false,
  disclaimer_acked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_years_check
    check (years_out_of_training is null
           or (years_out_of_training >= 0 and years_out_of_training <= 60))
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- case_templates
-- Defines the schema (fields, decisions, reasons) for a case type.
-- POC has a single row: acute pulmonary embolism.
-- ------------------------------------------------------------
create table public.case_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category public.case_category not null,
  clinical_vignette_structured jsonb not null default '[]'::jsonb,
  decision_options jsonb not null default '[]'::jsonb,
  reason_options jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger case_templates_set_updated_at
  before update on public.case_templates
  for each row execute function public.tg_set_updated_at();

-- ------------------------------------------------------------
-- cases
-- One row per submitted case. case_number is a monotonic user-visible id.
-- ------------------------------------------------------------
create sequence public.cases_number_seq;

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  case_number integer not null unique
    default nextval('public.cases_number_seq'),
  submitter_id uuid not null references public.profiles(id) on delete cascade,
  case_template_id uuid not null references public.case_templates(id) on delete cascade,
  patient_age integer not null,
  patient_gender public.patient_gender not null,
  case_variables jsonb not null default '{}'::jsonb,
  submitter_decision_id text not null,
  submitter_other_text text,
  submitter_reason_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cases_age_check check (patient_age >= 0 and patient_age <= 120),
  constraint cases_other_requires_text check (
    submitter_decision_id <> 'other'
    or length(coalesce(submitter_other_text, '')) > 0
  )
);

alter sequence public.cases_number_seq owned by public.cases.case_number;

create trigger cases_set_updated_at
  before update on public.cases
  for each row execute function public.tg_set_updated_at();

create index cases_created_idx on public.cases (created_at desc);
create index cases_submitter_idx on public.cases (submitter_id, created_at desc);
create index cases_template_idx on public.cases (case_template_id, created_at desc);

-- ------------------------------------------------------------
-- case_votes
-- One vote per (case, voter). Submitter's own pick is inserted as a vote
-- in the same transaction that creates the case (see create_case RPC).
-- ------------------------------------------------------------
create table public.case_votes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  decision_id text not null,
  other_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_votes_other_requires_text check (
    decision_id <> 'other' or length(coalesce(other_text, '')) > 0
  ),
  unique (case_id, voter_id)
);

create trigger case_votes_set_updated_at
  before update on public.case_votes
  for each row execute function public.tg_set_updated_at();

create index case_votes_case_idx on public.case_votes (case_id);
create index case_votes_voter_idx on public.case_votes (voter_id, created_at desc);

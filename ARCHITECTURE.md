# Architecture

This document is a technical walkthrough of the DecIQ codebase. It assumes familiarity with Next.js 15 App Router and Supabase.

## Data model

Four tables in the `public` schema. Enums and the canonical-hash helper live alongside them in `supabase/migrations/0001_init.sql`.

### `profiles`

One row per authenticated user, created automatically by the `handle_new_user` trigger on `auth.users`. Contains only non-PHI professional metadata used for filtering aggregates.

Key columns:

- `id` — FK to `auth.users.id`, PK.
- `role` — `user_role` enum (attending / fellow / resident / medical_student / other).
- `years_out_of_training` — integer, nullable, bounded `[0, 60]`.
- `practice_setting` — `practice_setting` enum.
- `display_name`, `is_anonymous_public` — how the user is shown to peers.
- `is_admin` — boolean, default false. Flipped manually in SQL.
- `disclaimer_acked_at` — gates entry into the authed shell.

### `case_templates`

Admin-authored. A template is the unit that peers compare themselves to.

Key columns:

- `slug` — unique, URL-safe identifier (e.g. `hcc-solitary-4cm`).
- `clinical_vignette_structured`, `decision_options`, `reason_options`, `outcome_fields` — JSONB arrays that the UI renders and that `buildCaseVariablesSchema` validates against.
- `is_active` — RLS hides inactive templates from non-admins.
- `min_n_for_display` — threshold below which the aggregate RPC hides the distribution. Defaults to 5.

### `case_responses`

One row per (user, template, variable set). Append-only.

Key columns:

- `user_id`, `case_template_id`.
- `case_variables` — JSONB flat map of `field_id -> scalar | scalar[]`.
- `case_variables_hash` — **generated column**, `md5(canonical_jsonb_text(case_variables))`. Stored and backed by a unique index on `(user_id, case_template_id, case_variables_hash)`.
- `decision_id`, `reason_ids`.

The generated column is the point of the design: a user who answers the same scenario twice is stopped by a Postgres uniqueness violation, regardless of what the client sends. Duplicate detection is a DB guarantee, not a client convention.

### `case_outcomes`

One row per response (unique on `case_response_id`). Append-only. Captures technique performed, technical success, complications, and short-term status.

## RLS model

All four tables have RLS enabled. Policies live in `supabase/migrations/0002_rls.sql`.

- `profiles`
  - `SELECT` — any authenticated user can read any row. Rows contain no PHI; peer transparency is a product requirement.
  - `UPDATE` — self or admin. Checked both in `USING` and `WITH CHECK`.
  - `INSERT` — self only. Normally handled by the trigger, but kept as a fallback.
  - No `DELETE`.
- `case_templates`
  - `SELECT` — `is_active OR is_admin_self()`. Non-admins never see inactive drafts.
  - Full write access via `FOR ALL` — admins only.
- `case_responses`
  - `SELECT` — own rows only. Aggregates never flow through this policy; they flow through the RPC (see below).
  - `INSERT` — own rows only.
  - No `UPDATE`, no `DELETE`. Responses are append-only so the aggregate view cannot be retroactively rewritten.
- `case_outcomes`
  - `SELECT` / `INSERT` — gated on owning the parent response.
  - No `UPDATE`, no `DELETE`, for the same integrity reason.

### `is_admin_self()`

A `SECURITY DEFINER`, `STABLE` SQL function that reads the caller's own `profiles.is_admin`. It exists for two reasons:

1. RLS policies cannot select from a table they are protecting without risking recursion. `SECURITY DEFINER` lets the function bypass RLS to read a single row by `auth.uid()`.
2. `STABLE` lets Postgres cache the result within a statement, so each policy evaluation does not re-query.

The function is scoped to `search_path = public` to prevent search-path hijacking, and `EXECUTE` is granted only to `authenticated`.

## Aggregate function: why an RPC, not a view

`public.get_case_aggregate(p_template_id uuid, p_filters jsonb)` in `supabase/migrations/0003_aggregate_fn.sql` is the only mechanism by which clients read peer data. It is `SECURITY DEFINER` and returns a single JSONB object:

```jsonc
// Above threshold
{ "total": 42, "min_n": 5, "below_min_n": false, "distribution": [...] }
// Below threshold — distribution omitted
{ "total": 3,  "min_n": 5, "below_min_n": true }
```

A view was considered and rejected. A view runs under the caller's privileges, which means any RLS exposure of per-user rows becomes an exposure of the aggregate. An RPC with `SECURITY DEFINER`:

- Guarantees no per-user rows ever cross the wire. The function returns only counts and percentages; there is no code path that can leak a `user_id` or `submitted_at`.
- Enforces `min_n_for_display` **server-side**, including for admins. The product requirement is that thin slices are hidden from everyone, full stop.
- Enforces the `auth.uid() IS NOT NULL` gate at the top of the function, so anonymous callers cannot invoke it even though it is `SECURITY DEFINER`.

`EXECUTE` is revoked from `public` and granted only to `authenticated`.

## Canonical hash strategy

`canonical_jsonb_text(payload jsonb) returns text` (immutable) is the authoritative serializer. For object payloads it emits keys in sorted order and values via the default JSONB text representation. `case_variables_hash` is computed as `md5(canonical_jsonb_text(case_variables))` in a generated column — the database, not the client, decides what a hash is.

`lib/hash.ts` mirrors the algorithm for the client:

- Sorted keys (`Object.keys().sort()`).
- `JSON.stringify` each key and value.
- `md5` over the resulting string.

The client mirror exists only for UX — previewing "you have already answered this scenario" before a round trip — and is explicitly documented as non-authoritative. If the mirror and the DB ever disagree, the DB wins via the unique-index violation on insert.

Multi-select arrays are committed in a canonical order by Zod on the submit path, so element order does not change the hash across retries.

## Route groups

The `app/` directory is split into three groups:

- `app/(marketing)` — not currently a physical group; `app/page.tsx` serves as the logged-out landing page. The middleware redirects authenticated users away from `/` to `/feed`.
- `app/(app)` — the authed shell. Its `layout.tsx` gates on both `auth.getUser()` and `profile.role && disclaimer_acked_at`, bouncing unfinished users to `/profile/setup`. It renders the bottom tab bar (Feed / My Cases / Outcomes / Profile).
- `app/admin` — a separate top-level route group with its own layout that gates on `is_admin`. This is kept separate from `(app)` so admin pages do not inherit the mobile tab bar and so the guard can be stricter.

There are two layers of guarding:

- **Middleware** (`middleware.ts` + `lib/supabase/middleware.ts`) — runs on every request, redirects unauthenticated users away from authed root paths and authenticated users away from `/` and `/login`. It is the cheap, first-line guard.
- **Layout** — runs on the server for each render, performs the profile-completion check and the admin check. This is where the role-level logic lives, because the middleware does not touch the DB on every request.

`/api/test/*` is excluded from public-path rules in the middleware so the e2e login bypass can function when enabled.

## Case flow state management

The URL flow `/cases/[slug]` → `/decision` → `/reason` → `/review` → `/results` all share a client-side `CaseFlowContext` mounted in `app/(app)/cases/[slug]/layout.tsx`. The context holds:

- `variables` — the `CaseVariables` object built on the entry page.
- `decisionId` — chosen on the decision page.
- `reasonIds` — chosen on the reason page.

State is persisted to `sessionStorage` under a per-slug key so a full page reload does not wipe a half-completed case. sessionStorage is used deliberately instead of localStorage: starting a different case, closing the tab, or submitting should not resurrect stale entries in a different session.

Mutations (submit response, submit outcome, create/toggle admin templates) all run through Next.js Server Actions in `app/(app)/cases/[slug]/actions.ts` and `app/admin/cases/actions.ts`. The server action re-validates the full payload with Zod against the live template before insert — the client-side schema is for UX, the server-side parse is the contract.

## Zod as the single source of truth

Zod schemas in `lib/schemas/` mirror the DB shapes:

- `variable-field.ts` — structural schema for template fields.
- `case-response.ts` — `caseVariablesSchema`, `caseResponseSubmitSchema`, and the dynamic `buildCaseVariablesSchema(fields)` factory.
- `case-template.ts`, `case-outcome.ts`, `filters.ts`, `profile.ts`, `enums.ts` — the remaining shapes.

`buildCaseVariablesSchema` is the important one. It takes a template's field list and returns a Zod schema that:

- rejects any key not declared by the template,
- requires every `required` field to be present,
- enforces `select` options, `multi_select` option membership and `minSelected`, and `number_range` min/max,
- caps the payload at 32 fields.

That means per-template validation rules are computed from the template definition at runtime, rather than hardcoded. Admins can add a new template without touching the validator.

## Design tokens

Colors, radii, and shadows live as CSS variables in `app/globals.css`. `tailwind.config.ts` declares Tailwind utilities that resolve from those variables (`bg-primary`, `text-text-muted`, etc.). The palette uses pure hex — no opacity tricks — so the surfaces render predictably on both desktop and mobile Safari.

Motion is intentionally minimal:

- Transitions default to `180ms cubic-bezier(0.2, 0.8, 0.2, 1)` via `transitionDuration.DEFAULT` and `transitionTimingFunction.DEFAULT`.
- Named animations (`fade-in`, `slide-up`, `bar-grow`) stay in the 150–400ms range with `ease-out` feel.

The product is a clinical tool used in transient moments between cases; longer or more decorative motion has been avoided on purpose.

## Analytics

PostHog is wired via `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`. Both are optional. When `NEXT_PUBLIC_POSTHOG_KEY` is unset (as in the default `.env.example`) analytics is a no-op: no network calls, no client SDK initialisation, no cookies. This keeps the local dev loop and the test suite free of external calls without conditional wrapping at every callsite.

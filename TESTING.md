# Testing

This document covers automated tests and the manual QA checklist for DecIQ. The app is a clinical tool, so "automated green" is necessary but not sufficient — the end-to-end walkthrough of every seeded template matters.

## Running automated tests

### Vitest (unit)

```bash
npm test            # one-shot
npm run test:watch  # watch mode
```

Covered:

- `lib/hash.ts` — canonical serialisation and `caseVariablesHash`. Must match the Postgres `canonical_jsonb_text` + `md5` pipeline for the same payload.
- `lib/schemas/*` — `caseResponseSubmitSchema`, `buildCaseVariablesSchema(fields)` against all four seed templates, profile and filter schemas.
- Aggregate-function mirror — a pure-JS reimplementation of `get_case_aggregate` used to assert that the RPC and the client-visible results use the same rounding and `below_min_n` rules.

Vitest runs under `jsdom` with `tests/unit/setup.ts` loading `@testing-library/jest-dom`.

### Playwright (end-to-end)

First-time setup:

```bash
npx playwright install --with-deps chromium
```

Then:

```bash
npm run test:e2e
```

Covered:

- `auth.spec.ts` — magic-link flow via the local Inbucket mailbox; redirect to `/profile/setup` on first login.
- `case-flow.spec.ts` — full walkthrough of `hcc-solitary-4cm`: entry, decision, reason, review, submit, results.
- `filters.spec.ts` — role / years-out / practice-setting filters on `/cases/[slug]/results` change the distribution.
- `low-n.spec.ts` — a template with fewer than `min_n_for_display` matching responses renders the insufficient-data state.
- `admin-guard.spec.ts` — non-admin accessing `/admin/*` is redirected.
- `rls.spec.ts` — a second user cannot read the first user's `case_responses` row through the table, only aggregates through the RPC.

The Playwright suite uses the test-only login bypass at `/api/test/login`, which is gated by `TEST_LOGIN_SECRET` and refuses to run unless `NODE_ENV !== "production"`.

## Manual clinical-QA checklist

Run this before every release. Sign in as a freshly seeded user, or create a new account via magic link, and complete profile setup (role, years out, practice setting, disclaimer).

Repeat for each of the four seeded templates:

- `hcc-solitary-4cm`
- `lower-gi-bleed`
- `massive-pe`
- `ivc-filter-retrieval`

For each template:

- [ ] Navigate from `/feed` into the template.
- [ ] Fill every required variable. Confirm the Continue button is disabled until the form validates.
- [ ] Advance through Decision and Reason.
- [ ] Verify Review screen displays the full variable summary, decision, and reasons accurately.
- [ ] Submit. Confirm the browser advances to `/cases/[slug]/results`.
- [ ] Re-enter the same case with the same variables from `/feed`. Confirm submission is blocked (duplicate hash) and the user is sent to the existing result.
- [ ] On the results screen, confirm the user's own chosen decision is highlighted in the bar chart.
- [ ] Apply at least one Role filter, one Years-out filter, and one Practice-setting filter. Confirm `total` decreases and the distribution changes.
- [ ] Clear filters. Confirm the chart returns to the baseline distribution.
- [ ] From results, go to `/cases/[slug]/outcome` and log an outcome (technique, technical success, complications, short-term status). Confirm success.
- [ ] Visit `/outcomes`. Confirm the case has moved from "Awaiting" to "Logged".
- [ ] Visit `/my-cases`. Confirm the response is listed.

## Admin QA

Admin promotion has no UI. From a psql session against the local Postgres:

```sql
update profiles set is_admin = true where id = '<auth-user-uuid>';
```

Then sign in as that user and:

- [ ] Visit `/admin/cases`. Confirm existing templates are listed with an active toggle.
- [ ] Create a new template at `/admin/cases/new`: slug, title, category, vignette fields, decision options, reason options, outcome fields.
- [ ] Toggle the new template to active. Confirm it appears in `/feed`.
- [ ] Toggle it inactive. Confirm it disappears from `/feed` for non-admin users (sign in as a different seeded user to verify) but remains visible in `/admin/cases`.
- [ ] Walk the full case flow through the new template as a non-admin user to confirm the validator accepts the new field definitions.

## Privacy and RLS manual checks

These confirm the policies enforced in `supabase/migrations/0002_rls.sql` and the aggregate RPC in `0003_aggregate_fn.sql`.

- [ ] Call `get_case_aggregate(<template_id>, '{}'::jsonb)` from the Supabase Studio SQL editor as `authenticated`. Confirm the response has only `total`, `min_n`, `below_min_n`, and `distribution` fields — no `user_id`, no `submitted_at`, no free-text leakage.
- [ ] From the browser as User A (anon key, JWT), attempt `select * from case_responses where user_id = '<User B id>'`. Confirm zero rows.
- [ ] From the browser as User A, attempt `update profiles set display_name = 'x' where id = '<User B id>'`. Confirm zero rows affected and no error that leaks the existence of B's row.
- [ ] In psql, delete `case_responses` rows until a template has fewer than 5 matching responses for some filter combination. From the app, apply that filter and confirm the results screen renders the insufficient-data state and never exposes a breakdown.

## Performance targets

Measured with Chrome DevTools Lighthouse in mobile emulation (Moto G Power, Slow 4G, cleared cache), production build (`npm run build && npm run start`):

- `/feed` — Accessibility ≥ 95, Performance ≥ 90.
- `/cases/hcc-solitary-4cm/results` (signed in with a seeded account) — Accessibility ≥ 95, Performance ≥ 90.

Regressions below these thresholds should block a release.

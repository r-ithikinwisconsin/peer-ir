# DecIQ

A mobile-first web app for interventional radiologists. An IR enters the de-identified variables of a case they are managing, commits to a management decision, and then sees a filtered percentage distribution of how their peers managed the same scenario. The goal is trust at a glance: a clinician who has just committed to an approach wants to know, immediately, whether they are in the mainstream or the minority of their specialty for this specific case.

The app is built with Next.js 15 (App Router), Supabase (Postgres, Auth, RLS), TypeScript, and Tailwind.

## Requirements

- Node 20+
- Docker (required by the Supabase CLI to boot the local stack)
- npm

A Vercel account is optional and only needed for hosted deploys.

## Local setup

Run these commands in order from the repo root.

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create a local environment file.

   ```bash
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The anon and service-role keys are printed by `supabase start` (next step) — paste them in once you see them.

3. Boot the local Supabase stack. The first run pulls several Docker images and can take a few minutes.

   ```bash
   npm run db:start
   ```

4. Apply migrations. This resets the local database and replays `supabase/migrations/*`.

   ```bash
   npm run db:reset
   ```

5. Seed synthetic data (300 users, 4 templates, ~320 responses, ~128 outcomes). Idempotent and deterministic.

   ```bash
   npm run seed
   ```

6. Regenerate the TypeScript types for the database. Run this after any migration change.

   ```bash
   npm run db:types
   ```

7. Start the dev server and visit [http://localhost:3000](http://localhost:3000).

   ```bash
   npm run dev
   ```

8. Magic-link emails are captured by the local mail inbox (Inbucket / Mailpit) at [http://127.0.0.1:54324](http://127.0.0.1:54324). Sign in there rather than a real inbox.

## Scripts reference

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server on port 3000. |
| `npm run build` | Production build. |
| `npm run start` | Serve a built app. |
| `npm run lint` | ESLint over `app/`, `components/`, `lib/`. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Vitest unit tests (one-shot). |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run test:e2e` | Playwright end-to-end tests. |
| `npm run seed` | Populate the local DB with synthetic users, responses, and outcomes. Guards against non-local URLs unless `SEED_ALLOW_REMOTE=1`. |
| `npm run db:start` | Boot the local Supabase Docker stack. |
| `npm run db:stop` | Shut the local stack down. |
| `npm run db:reset` | Drop the local DB and re-apply all migrations. |
| `npm run db:types` | Regenerate `lib/types/database.ts` from the live local schema. |

## One-command Docker

Prefer to skip the Supabase CLI and run the whole stack from a single `docker compose up`? Everything you need is checked in:

```bash
cp docker/.env.example docker/.env
docker compose --env-file docker/.env up --build
```

This boots seven services on a private network:

| Service | Purpose | Exposed |
| --- | --- | --- |
| `db` | Supabase Postgres (roles, `auth` schema, JWT helpers pre-baked) | `54322` |
| `auth` | GoTrue — email auth | via Kong |
| `rest` | PostgREST — REST access to the `public` schema | via Kong |
| `kong` | API gateway mounting `/auth/v1`, `/rest/v1` | `8000` |
| `inbucket` | Catches magic-link emails | `9000` (web UI) |
| `migrator` | One-shot: applies `supabase/migrations/*` once auth is ready, then exits | — |
| `app` | Next.js (standalone build) | `3000` |

Open [http://localhost:3000](http://localhost:3000), pick up magic links from [http://localhost:9000](http://localhost:9000).

Seed the synthetic dataset (idempotent) without reshaping the stack:

```bash
docker compose --env-file docker/.env --profile seed run --rm seed
```

Reset everything (including the Postgres volume):

```bash
docker compose --env-file docker/.env down -v
```

The demo JWT values in `docker/.env.example` are the same ones Supabase publishes for self-host dev; rotate them before any deployment.

## Testing

```bash
npm test          # Vitest: hash canonicalization, Zod schemas, aggregate-fn mirror
npm run test:e2e  # Playwright: auth, case flow, filters, low-n, admin guard, RLS
```

Playwright browsers must be installed once per machine:

```bash
npx playwright install --with-deps chromium
```

See `TESTING.md` for the full manual QA checklist.

## Deploying

1. Create a hosted Supabase project at [supabase.com](https://supabase.com).
2. Link the local repo to it and push the migrations.

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

3. In the Vercel project dashboard, set the same environment variables listed in `.env.example` using the hosted Supabase credentials and your production site URL.
4. Push to GitHub and connect the repo to Vercel. Vercel will detect Next.js automatically.
5. Admins are promoted manually. After a user signs up at least once, flip their flag directly against the hosted Postgres:

   ```sql
   update profiles set is_admin = true where id = '<auth-user-uuid>';
   ```

   There is no UI for admin promotion by design.

## Project layout

| Path | Purpose |
| --- | --- |
| `app/` | Next.js App Router routes, including `(app)` authed shell, `admin/`, `auth/`, and `login/`. |
| `components/` | UI primitives (`ui/`), case flow components (`case/`), admin widgets (`admin/`). |
| `lib/` | Supabase clients, Zod schemas, hash utilities, generated DB types. |
| `scripts/` | Seed script and canonical template definitions. |
| `supabase/` | Local CLI config and SQL migrations. |
| `tests/` | Vitest unit tests and Playwright e2e suites. |
| `public/` | Static assets and `robots.txt`. |

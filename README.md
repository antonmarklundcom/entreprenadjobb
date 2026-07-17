# Entreprenadjobb.se

Free Swedish job- and assignment board for construction trades (el, tak,
solceller). See [`PLAN.md`](./PLAN.md) for the full architecture, schema, and
phased build plan — read that first.

## Stack

Next.js (App Router) · Tailwind CSS v4 · Prisma ORM 7 · Neon Postgres ·
Auth.js v5 (email magic links via Resend) · deployed on Hostinger managed
Node.js hosting from this GitHub repo.

## Local development

```bash
npm install
cp .env.example .env   # fill in real values, see below
npx prisma generate
npm run dev
```

Open http://localhost:3000. Without a configured database the home page
still renders (trade cards fall back to an empty list) and
`/api/health` reports `503` with a clear "can't reach database" message —
that's expected until `DATABASE_URL`/`DIRECT_URL` point at a real Neon
database.

## Database — read this before touching Prisma

This project has **two separate connection strings**, and mixing them up
will break things in confusing ways:

| Env var | Points to | Used by | Where it runs |
|---|---|---|---|
| `DATABASE_URL` | Neon **pooled** endpoint (hostname contains `-pooler`) | The running app (`src/lib/db.ts`) | Hostinger (production) and local dev |
| `DIRECT_URL` | Neon **direct** endpoint | The Prisma CLI (`prisma.config.ts`) — migrate, generate, studio, seed | **Local machine only, never Hostinger** |

Why: Hostinger's IPv6 routing to Neon's direct endpoint is broken, so the
deployed app must use the pooled connection string. Migrations, however,
should run against the direct endpoint (pgbouncer's transaction pooling can
interfere with the advisory locks Prisma's migration engine uses). Get both
strings from the Neon dashboard for the same database/branch.

Prisma ORM 7 has no built-in connection engine — every `PrismaClient` is
constructed with a driver adapter (`@prisma/adapter-pg`, i.e. plain `pg`
over TCP). This works fine against Neon's pooled endpoint on a normal
Node.js runtime like Hostinger's; it is a different thing from the Neon
*serverless* HTTP/WebSocket driver, which we don't need here.

### Running migrations (local machine, Windows)

```powershell
npx prisma migrate dev --name <change-name>
npx prisma generate
```

**Never run `prisma migrate` on Hostinger.** Deploy only ships the already-
generated Prisma Client and applies no schema changes at deploy time; run
`prisma migrate deploy` locally against `DIRECT_URL` before pushing, if a
migration needs to reach production.

### Windows encoding gotcha

PowerShell's default redirection (`>`, `Out-File`) writes **UTF-16**, which
breaks `.env` files and `schema.prisma` in ways that produce confusing
Prisma errors (garbled connection strings, "unexpected token" schema
errors). Edit these files in VS Code or Git Bash, or if you must write them
from a PowerShell script, force UTF-8 explicitly:

```powershell
Set-Content -Path .env -Value $content -Encoding utf8
```

### Seeding

`prisma/seed.ts` populates the three initial trades (el, tak, solceller)
and ~25 SEO-target Swedish cities with their SCB kommunkod (used later to
map aggregated JobTech ads to a city). Run it with:

```bash
npx prisma db seed
```

## Project structure

See `PLAN.md` §8 for the full folder-structure rationale. Swedish UI copy
lives centrally in `src/copy/sv.ts`; code, comments, and commit messages are
in English.

## Deployment

Hostinger's Node.js hosting pulls from this repo's connected branch and
runs `npm run build` / `npm start`. The app and its API routes are a single
deployable — there is no separate backend service. Required production env
vars are the same as `.env.example` (`DATABASE_URL` pooled, `AUTH_SECRET`,
`AUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, plus Phase 2+
vars as they come online). `DIRECT_URL` is not needed on Hostinger — it is
only read by the Prisma CLI, which never runs there.

# PLAN.md — Entreprenadjobb.se

> **Authored by Fable 5 — handoff to Sonnet 4.6 / Opus 4.8**
> Status: Phase 0 (spec approved, no code yet) · Last updated: 2026-07-17

---

## 1. What this is

Entreprenadjobb.se is a Swedish niche job-and-assignment board for the
construction trades (initially **el**, **tak**, **solceller** — extensible).
It is a **two-sided marketplace**:

1. **Jobs (jobb)** — companies post employment listings (anställning,
   lärlingsplats) that individuals apply to.
2. **Assignments (uppdrag)** — companies *or individuals* post full jobs/
   projects that **other companies** (or solo tradesmen with F-skatt) can
   take on as underentreprenör.

Everything is **free** for both sides in every planned phase. The product
goal is to become the obvious niche destination for these trades in Sweden,
carried by a best-in-class front end (fast, beautiful, effortless filtering
and sorting) and programmatic SEO.

**Explicitly removed from scope (owner decision 2026-07-17):** all
GoHighLevel / CRM sync. No lead webhooks, no nurture automation, no external
funnel integration. Employer contact data lives in our own Postgres only.

### Actors

| Actor | What they do |
|---|---|
| Company (hiring) | Posts jobs for employees/apprentices; has public profile |
| Company (outsourcing) | Posts assignments for other companies to take |
| Company (seeking work) | Browses assignments, presents profile to win work |
| Person — job seeker | Browses/applies to jobs; optional public profile; may hold **F-skatt** (can also take assignments as a solo contractor) |
| Person — company rep | Acts on behalf of a company (posting, editing, profile) |
| Admin (owner) | Moderates listings, monitors aggregator, views stats |

A company can hold **any combination** of the three statuses (hiring /
outsourcing / seeking work) — they are independent flags, not one enum.

---

## 2. Model tiering

| Model | Responsibility |
|---|---|
| **Fable 5** | Architecture, Prisma schema changes, this document, review gate at the end of every phase, launch gate sign-off |
| **Sonnet 4.6** | Default builder for all routine phase work (UI, routes, forms, aggregator plumbing, SEO pages) |
| **Opus 4.8** | Escalation only, for the hardest problems: aggregator dedup/matching logic, search/filter query performance, auth edge cases, anything Sonnet fails at twice |

Rule of thumb: Sonnet starts every task. If a task is failed twice or is
listed as an Opus task in a phase table, escalate. Schema migrations are
always drafted/reviewed by Fable before being run.

---

## 3. Hard constraints (do not relitigate)

1. **Stack:** Next.js (App Router) + Prisma + Neon Postgres. Deployed on
   **Hostinger managed Node.js hosting** via GitHub integration. Front end
   and API live on the **same domain / same Next.js app** — no separate
   backend service.
2. **Hostinger ↔ Neon has broken IPv6 routing.** Runtime must use Neon's
   **pooled** connection string (`...-pooler...`). All
   `prisma migrate` / `prisma generate` / `prisma db seed` commands run
   **LOCALLY on the owner's Windows machine**, never on the Hostinger box.
3. **PowerShell writes UTF-16 by default.** Any docs/scripts that tell the
   owner to write files from PowerShell must use
   `Out-File -Encoding utf8` / `Set-Content -Encoding utf8`, or prefer
   editing in VS Code / Git Bash. A stray UTF-16 `.env` or `schema.prisma`
   will break Prisma with confusing errors.
4. **`trade` and `employment_type` are separate fields.** Lärling is an
   employment type, never a trade category.
5. **MVP stores no applications and no CVs** (GDPR data-controller
   avoidance for applicant data). "Apply" forwards to the employer
   (mailto / external URL / phone). Hosted applications are a later,
   explicitly gated phase (see §12). Note: user accounts + public seeker
   profiles (Phase 3) *do* make us a data controller for profile data the
   user volunteers — that is accepted and covered by a privacy page; CVs
   and application flows remain out.
6. **All UI copy in Swedish (du-form).** Code, comments, commit messages,
   and this document in English.

---

## 4. Architecture overview

```
Browser ──► Next.js App Router on Hostinger (Node.js, same domain)
              ├─ Server Components (feed, detail, SEO pages — ISR/cached)
              ├─ Route Handlers /api/* (mutations, aggregator, auth)
              ├─ Auth.js v5 (email magic-link only, Prisma adapter)
              └─ Prisma Client ──► Neon Postgres (POOLED string)

Resend (free tier) ──► transactional email from @entreprenadjobb.se
GitHub Actions (cron schedule) ──► POST /api/aggregator/run (secret header)
JobTech JobSearch API ──► aggregator ──► external listings in Postgres
```

Key decisions (Fable, final):

- **One Next.js app** serves everything: pages, API, sitemap, OG images.
  No separate backend, satisfying "backend hosted on same domain".
- **Auth: passwordless email magic links only** (Auth.js v5 + Prisma
  adapter + Resend). No passwords ever. This unifies three needs with one
  mechanism: account login, post-a-job email verification, and
  edit-your-listing links.
- **Posting requires no pre-existing account.** The multistep form creates
  a `DRAFT` listing + company + user in one transaction, then emails a
  magic link. Clicking it verifies the email, publishes the listing, and
  signs the user in (their account now exists with zero extra friction).
- **Filtering/sorting is URL-state driven** (`nuqs` or hand-rolled
  searchParams). Every filter combination is a shareable, crawlable URL —
  this is also the foundation of the programmatic SEO pages.
- **Styling:** Tailwind CSS v4 + shadcn/ui + lucide-react. Design tokens in
  §9. Light + dark mode from day one.
- **External listings are display-only**: feed cards + a thin detail page
  with `noindex` and a prominent link out to Platsbanken. Only NATIVE
  listings get indexable detail pages and JSON-LD (avoids duplicate-content
  penalties and keeps us clean on republication terms).
- **Scheduled jobs via GitHub Actions cron** hitting an authenticated
  route handler (Hostinger cron availability is uncertain; GH Actions is
  free, already integrated, and observable). Secret in `CRON_SECRET` env.
- **Analytics:** GA4 (free) + Google Search Console. Nothing self-hosted.

---

## 5. Email strategy (owner question, answered)

**Decision: Resend free tier, sending as `Entreprenadjobb
<noreply@entreprenadjobb.se>`. Cost: 0 kr. Using the custom domain is
free and absolutely worth it.**

- **Resend free tier:** 3,000 emails/month, 100/day, 1 custom domain,
  SPF/DKIM/DMARC included. Setup = add 3–4 DNS records in Hostinger hPanel
  (domain is already there). Volume is ample: MVP sends only magic links
  and listing notifications. If we ever exceed 100/day we are successful
  enough to pay $20/month.
- **Do NOT send from a Gmail address.** Gmail SMTP caps at ~500/day, can't
  DKIM-align with entreprenadjobb.se (mail lands in spam or shows "via
  gmail.com"), looks amateur on a B2B product, and violates the spirit of
  bulk-sending policies for app mail.
- **Receiving mail** (kontakt@entreprenadjobb.se): Hostinger hosting plans
  include free email hosting (first year, 1 GB mailboxes) — create
  `kontakt@` there, or simply set up a **free forwarder** to the owner's
  Gmail and reply from Gmail with a configured "send as" alias. Reading in
  Gmail is fine; *sending app mail through* Gmail is not.
- Env vars: `RESEND_API_KEY`, `EMAIL_FROM="Entreprenadjobb <noreply@entreprenadjobb.se>"`.

---

## 6. Prisma schema draft

Full draft — Phase 0 turns this into `prisma/schema.prisma` verbatim, then
Fable reviews before the first local `prisma migrate dev`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Neon POOLED string (runtime, Hostinger-safe)
  directUrl = env("DIRECT_URL")     // Neon direct string (LOCAL migrations only)
}

// ── Enums ────────────────────────────────────────────────────────────

enum EmploymentType {
  ANSTALLNING       // regular employment
  LARLING           // apprenticeship
  UNDERENTREPRENOR  // B2B assignment (uppdrag) — companies / F-skatt solos apply
}

enum ListingSource {
  NATIVE   // posted on entreprenadjobb.se
  JOBTECH  // aggregated from Arbetsförmedlingen JobSearch API
}

enum ListingStatus {
  DRAFT                 // created by form, email not yet verified
  PENDING_VERIFICATION  // reserved for future moderation queue
  PUBLISHED
  CLOSED                // closed by owner
  EXPIRED               // passed expiresAt / disappeared from JobTech
  REMOVED               // removed by admin
}

enum CompanyMemberRole {
  OWNER
  MEMBER
}

enum TokenPurpose {
  VERIFY_PUBLISH  // publish listing + verify email + sign in
  EDIT_LISTING    // one-click manage link in emails
}

enum RunStatus {
  RUNNING
  SUCCESS
  FAILED
}

// ── Auth.js v5 standard models (Prisma adapter) ──────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  phone         String?
  image         String?
  isAdmin       Boolean   @default(false)

  memberships   CompanyMember[]
  seekerProfile JobSeekerProfile?
  accounts      Account[]
  sessions      Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ── Marketplace core ─────────────────────────────────────────────────

model Company {
  id           String  @id @default(cuid())
  slug         String  @unique
  name         String
  orgNumber    String? @unique // Swedish org.nr, optional at creation, required to verify
  description  String?
  logoUrl      String?
  website      String?
  contactEmail String?
  phone        String?
  cityId       String?
  city         City?   @relation(fields: [cityId], references: [id])

  // Marketplace intent — independent flags, any combination
  isHiring      Boolean @default(false) // looking for people (anställning/lärling)
  isOutsourcing Boolean @default(false) // posts assignments for other companies
  isSeekingWork Boolean @default(false) // wants to take assignments posted by others

  verifiedAt DateTime? // set when org.nr checked by admin (Phase 4)

  trades   Trade[]         @relation("CompanyTrades")
  members  CompanyMember[]
  listings Listing[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CompanyMember {
  id        String            @id @default(cuid())
  userId    String
  companyId String
  role      CompanyMemberRole @default(OWNER)
  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  company   Company           @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([userId, companyId])
}

model JobSeekerProfile {
  id       String  @id @default(cuid())
  userId   String  @unique
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  slug     String  @unique
  headline String? // "Certifierad elektriker, 8 års erfarenhet"
  bio      String?
  hasFSkatt Boolean @default(false) // can invoice as solo contractor → sees uppdrag too
  cityId   String?
  city     City?   @relation(fields: [cityId], references: [id])
  openTo   EmploymentType[] // what they're looking for
  isPublic Boolean @default(false) // profile hidden until user opts in

  trades Trade[] @relation("SeekerTrades")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ── Taxonomy ─────────────────────────────────────────────────────────

model Trade {
  id        String  @id @default(cuid())
  slug      String  @unique // "el", "tak", "solceller"
  nameSv    String  // "El", "Tak", "Solceller"
  icon      String? // lucide icon name for the bento grid
  sortOrder Int     @default(0)
  isActive  Boolean @default(true)

  // JobTech taxonomy concept IDs used by the aggregator for this trade
  // (occupation-group/field IDs resolved via taxonomy.api.jobtechdev.se in Phase 2)
  jobtechConceptIds String[] @default([])

  listings Listing[]
  companies Company[]          @relation("CompanyTrades")
  seekers   JobSeekerProfile[] @relation("SeekerTrades")
}

model City {
  id               String  @id @default(cuid())
  slug             String  @unique // "stockholm"
  name             String  // "Stockholm"
  county           String  // "Stockholms län"
  municipalityCode String? @unique // SCB kommunkod — maps JobTech ads to cities
  lat              Float?
  lng              Float?
  population       Int?
  isSeoTarget      Boolean @default(false) // include in programmatic SEO generation

  listings Listing[]
  companies Company[]
  seekers   JobSeekerProfile[]
}

// ── Listings ─────────────────────────────────────────────────────────

model Listing {
  id     String        @id @default(cuid())
  slug   String        @unique
  title  String
  description String   // markdown-lite / plain text

  source ListingSource @default(NATIVE)
  status ListingStatus @default(DRAFT)

  employmentType EmploymentType
  tradeId        String
  trade          Trade   @relation(fields: [tradeId], references: [id])
  cityId         String?
  city           City?   @relation(fields: [cityId], references: [id])
  locationText   String? // fallback for external ads without a mapped city

  companyId    String?
  company      Company? @relation(fields: [companyId], references: [id])
  employerName String   // denormalized display name (required for JOBTECH ads)

  // Apply-forwarding (MVP stores no applications)
  applyEmail String?
  applyUrl   String?
  applyPhone String?

  // Employment fields
  salaryText String?
  startDate  DateTime?

  // Assignment (uppdrag) fields — meaningful when employmentType = UNDERENTREPRENOR
  scopeText        String? // e.g. "Takomläggning 400 m², totalentreprenad"
  durationText     String? // e.g. "6 veckor, start augusti"
  openToSoloFSkatt Boolean @default(true) // solo F-skatt tradesmen may apply too

  // Reserved for a possible future paid tier — no UI in any planned phase
  isFeatured    Boolean   @default(false)
  featuredUntil DateTime?

  publishedAt DateTime?
  expiresAt   DateTime?
  closedAt    DateTime?

  // Aggregator / seed-source tracking
  externalId  String?  @unique // JobTech ad id
  externalUrl String?          // link to Platsbanken ad
  fetchedAt   DateTime?
  lastSeenAt  DateTime?        // ad missing from source N runs → EXPIRED
  raw         Json?            // original API payload for debugging/re-mapping

  tokens ListingToken[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status, publishedAt(sort: Desc)])
  @@index([tradeId, cityId, employmentType, status])
  @@index([source, lastSeenAt])
}

model ListingToken {
  id        String       @id @default(cuid())
  tokenHash String       @unique // sha256 of the emailed token — never store raw
  listingId String
  listing   Listing      @relation(fields: [listingId], references: [id], onDelete: Cascade)
  purpose   TokenPurpose
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime     @default(now())
}

// ── Aggregator run log ───────────────────────────────────────────────

model AggregatorRun {
  id         String    @id @default(cuid())
  source     ListingSource @default(JOBTECH)
  status     RunStatus @default(RUNNING)
  startedAt  DateTime  @default(now())
  finishedAt DateTime?
  adsFetched Int       @default(0)
  adsCreated Int       @default(0)
  adsUpdated Int       @default(0)
  adsExpired Int       @default(0)
  error      String?
}
```

Schema notes:

- One **primary trade per listing** (keeps filters, bento counts, and SEO
  pages unambiguous). Companies and seekers are many-to-many with trades.
- `Trade.jobtechConceptIds` keeps aggregator taxonomy mapping in data, not
  code — adding a trade (vvs, bygg…) requires no deploy for the aggregator.
- `ListingToken` is separate from Auth.js `VerificationToken`: listing
  tokens are long-lived manage links scoped to one listing; auth tokens are
  short-lived sign-in codes. Don't merge them.
- `isFeatured`/`featuredUntil` exist so a future paid tier needs no
  migration, but **no phase builds UI for them**.

---

## 7. API route inventory

### Pages (App Router, server components)

| Route | Purpose |
|---|---|
| `/` | Home: hero + **bento grid of trade categories** (live counts), latest listings, dual CTAs ("Publicera jobb", "Publicera uppdrag") |
| `/jobb` | Employment feed (ANSTALLNING + LARLING) with filters/sort |
| `/uppdrag` | Assignment feed (UNDERENTREPRENOR) with filters/sort |
| `/annons/[slug]` | Listing detail (native: full page + JSON-LD; external: summary + noindex + link out) |
| `/publicera` | Multistep post form (step 1 picks jobb vs uppdrag) |
| `/foretag` | Company directory (filter by trade, city, intent flags) |
| `/foretag/[slug]` | Public company profile: about, trades, statuses, active listings |
| `/personer` | Public job seeker directory (only `isPublic` profiles) — Phase 3 |
| `/personer/[slug]` | Public seeker profile — Phase 3 |
| `/konto` | Dashboard: my listings, company profile editor, seeker profile editor |
| `/logga-in` | Magic-link sign-in |
| **pSEO** `/jobb/[trade]` `/jobb/[trade]/[city]` | e.g. `/jobb/el/stockholm` — "Elektrikerjobb i Stockholm" |
| **pSEO** `/larlingsplatser/[trade]` `/larlingsplatser/[trade]/[city]` | apprentice variants |
| **pSEO** `/uppdrag/[trade]` `/uppdrag/[trade]/[city]` | assignment variants |
| `/om`, `/integritetspolicy`, `/villkor` | Static: about, privacy (GDPR), terms |
| `/admin` | Admin: moderation queue, aggregator runs, basic stats (isAdmin only) |

### Route handlers

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | * | Auth.js magic-link flow |
| `/api/listings` | POST | Create DRAFT listing (+ company + user upsert), send verify email |
| `/api/listings/[id]` | PATCH | Edit listing (session or valid EDIT token) |
| `/api/listings/[id]/close` | POST | Close listing |
| `/api/listings/verify` | GET | Consume VERIFY_PUBLISH token → publish + sign in → redirect |
| `/api/companies/[id]` | PATCH | Edit company profile (member only) |
| `/api/profile` | PUT | Upsert seeker profile |
| `/api/aggregator/run` | POST | Run JobTech sync (requires `x-cron-secret` header) — called by GitHub Actions cron |
| `/api/og/[slug]` | GET | Dynamic OG image per listing (`next/og`) |
| `/sitemap.xml` (+ `generateSitemaps` shards) | GET | All native listings + pSEO pages |
| `/robots.txt` | GET | Standard + sitemap ref |

---

## 8. Folder structure (git-ready)

```
entreprenadjobb/
├── PLAN.md
├── README.md                    # local dev + Windows/Prisma workflow
├── .env.example                 # every env var documented, no secrets
├── next.config.ts
├── package.json
├── tailwind.config.ts           # (or CSS-first Tailwind v4 config)
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                  # trades + ~30 SEO-target cities (kommunkod)
│   └── migrations/
├── public/
├── src/
│   ├── app/
│   │   ├── (marketing)/         # /, /om, /integritetspolicy, /villkor
│   │   ├── (board)/
│   │   │   ├── jobb/            # feed + pSEO [trade]/[city]
│   │   │   ├── uppdrag/
│   │   │   ├── larlingsplatser/
│   │   │   └── annons/[slug]/
│   │   ├── (directory)/
│   │   │   ├── foretag/
│   │   │   └── personer/
│   │   ├── (account)/
│   │   │   ├── konto/
│   │   │   ├── logga-in/
│   │   │   └── publicera/
│   │   ├── admin/
│   │   ├── api/                 # route handlers per §7
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── listing/             # ListingCard, ListingFilters, SortSelect, BentoGrid
│   │   ├── forms/               # multistep post-a-job wizard
│   │   └── layout/              # Header, Footer, ThemeToggle
│   ├── lib/
│   │   ├── db.ts                # Prisma singleton (pooled)
│   │   ├── auth.ts              # Auth.js config
│   │   ├── email.ts             # Resend wrapper + templates (react-email)
│   │   ├── tokens.ts            # ListingToken create/verify (sha256)
│   │   ├── slugs.ts
│   │   ├── seo.ts               # metadata + JSON-LD JobPosting builders
│   │   └── validators.ts        # zod schemas shared client/server
│   ├── aggregator/
│   │   ├── jobtech.ts           # API client (search, ad detail)
│   │   ├── mapper.ts            # JobTech ad → Listing fields, kommunkod → City
│   │   └── sync.ts              # upsert/expire pipeline + AggregatorRun log
│   └── copy/
│       └── sv.ts                # all Swedish UI strings in one module
├── .github/
│   └── workflows/
│       └── aggregator-cron.yml  # scheduled POST /api/aggregator/run
└── scripts/
    └── new-migration.md         # Windows-safe local migration checklist
```

---

## 9. Front-end spec (first-class deliverable)

The front end is the product. Sonnet must treat these as acceptance
criteria, not suggestions.

**Design tokens**
- Palette: warm slate neutrals + **safety-orange/amber accent** (construction
  identity), success green for "Nytt" badges. Full light + dark themes.
- Type: Inter (or Geist) via `next/font`, tight tracking on display sizes.
- Radius 12–16px, soft shadows, generous whitespace. No stock photos —
  iconography (lucide) + subtle gradients.

**Home page bento grid**
- Trade categories as bento cells of mixed sizes: icon, Swedish name, live
  count ("128 jobb"), hover lift. One larger cell for lärlingsplatser and
  one for uppdrag — the grid communicates the whole marketplace at a glance.
- Below: latest listings strip, dual CTA band, trust/"gratis" messaging.

**Feed UX (`/jobb`, `/uppdrag`)**
- Filters: trade (chips), city/län (searchable combobox), employment type
  (segmented control), "endast med F-skatt möjligt" toggle on uppdrag.
- Sort: Nyast (default), Sista ansökningsdag, Företag A–Ö.
- All state in the URL (shareable, back-button-safe, crawlable). Desktop:
  sticky filter sidebar. Mobile: bottom-sheet filter drawer with a result
  count on the apply button ("Visa 43 jobb").
- Instant feel: server components + `<Suspense>` streaming, skeleton cards,
  zero layout shift, active-filter chips with one-tap removal, empty states
  that suggest loosening filters.

**Listing cards**: trade icon, title, employer, city, employment-type badge
(distinct color per type), relative time ("2 dagar sedan"), "via
Platsbanken" badge on external ads, "Nytt" badge < 48h.

**Performance budget**: LCP < 1.8s on 4G, CLS ≈ 0, feed responds to filter
changes < 300ms perceived. Lighthouse ≥ 95 on home + feed before Phase 4
exits.

---

## 10. JobTech aggregator (cold-start seeding)

**Verified via research (2026-07):**
- API: **JobSearch** — `https://jobsearch.api.jobtechdev.se`; endpoints
  `GET /search` (query params incl. `occupation-field`/`occupation-group`,
  `municipality`, `q`, `limit`, `offset`) and `GET /ad/{id}`. JSON.
- Docs state an **API key registered at `apirequest.jobtechdev.se`** (free).
- Data = Platsbanken ads from Arbetsförmedlingen, published as open data.
- Taxonomy concept IDs for occupations come from the separate **Taxonomy
  API** (`taxonomy.api.jobtechdev.se`).

**⚠ MUST VERIFY locally before Phase 2 build** (this environment's proxy
blocks jobtechdev.se, so these could not be confirmed live):
1. Exact license text / republication + attribution terms on
   `data.jobtechdev.se` — confirm displaying ads with a link-out is
   permitted (expected yes, it's open data, but read the terms).
2. Whether the API key is enforced or optional on JobSearch today.
3. Current taxonomy concept IDs for: elektriker, takläggare/takmontör,
   solcellsmontör/solenergiinstallatör — resolve via Taxonomy API and store
   in `Trade.jobtechConceptIds`.

**Pipeline (runs daily via GitHub Actions cron):**
1. For each active trade × its `jobtechConceptIds`: page through `/search`.
2. Map ads → `Listing` (source JOBTECH, status PUBLISHED, kommunkod →
   `City.municipalityCode`, unmapped → `locationText`), upsert on
   `externalId`, stamp `lastSeenAt`, keep `raw`.
3. Ads not seen for 2 consecutive runs → status EXPIRED.
4. Write an `AggregatorRun` row; `/admin` shows the last runs.

**Presentation rules:** external ads are clearly labeled "via Platsbanken",
rank below native listings at equal recency, link out to the original ad,
and their detail pages are `noindex`. Native listings always win placement.

---

## 11. Phased milestones

Session ≈ one focused build session by the named model.

### Phase 0 — Foundations *(Sonnet, 1 session; Fable reviews schema)*
Scaffold Next.js + Tailwind + shadcn/ui; commit `schema.prisma` from §6;
`.env.example`; README with the **Windows workflow** (local `prisma migrate
dev` against `DIRECT_URL`, UTF-8 file-writing notes, pooled string for
Hostinger); seed script (3 trades, ~30 largest kommuner with kommunkod,
`isSeoTarget` on top ~25); deploy pipeline Hostinger↔GitHub proven with a
styled placeholder page; Resend domain verified (DNS in hPanel).
**DONE =** app boots on entreprenadjobb.se from `main`, `/api/health`
returns DB roundtrip via pooled string, migrations run clean locally,
a test email from noreply@entreprenadjobb.se lands in an inbox.

### Phase 1 — Core board *(Sonnet, 3–4 sessions; Opus on call for auth edge cases)*
Home with bento grid (live counts); `/jobb` + `/uppdrag` feeds with full
filter/sort UX per §9; listing detail; multistep `/publicera` wizard
(type → details → company info → contact/apply method → preview) with zod
validation; DRAFT → magic-link verify → PUBLISHED flow; Auth.js sign-in;
`/konto` with my-listings edit/close; EDIT_LISTING token links in email.
**DONE =** a stranger can post a job with zero prior account, verify via
email, see it live, edit it, and close it — all on production; filters/
sort meet the §9 UX spec; all copy Swedish du-form.

### Phase 2 — Aggregator + programmatic SEO *(Sonnet, 2–3 sessions; Opus for dedup/mapping if needed)*
Verify JobTech terms/key (§10 checklist) **first**; build client + mapper +
sync + GH Actions cron; external-ad presentation rules; pSEO routes
(`/jobb|larlingsplatser|uppdrag/[trade]/[city]`) with unique Swedish
intro copy per combination, ISR, internal linking (footer/related);
JSON-LD `JobPosting` on native detail pages; sharded sitemap; robots; GSC
verified and sitemap submitted.
**DONE =** feeds show fresh Platsbanken ads for all 3 trades refreshed
daily (visible in `/admin` run log); every trade×city×type page renders
with real content and valid JSON-LD (Rich Results test passes); sitemap
accepted in GSC.

### Phase 3 — Profiles & directory *(Sonnet, 2 sessions)*
Company profile pages + directory with intent-flag filters ("Söker
personal" / "Lägger ut uppdrag" / "Söker uppdrag"); company editor in
`/konto`; job seeker profiles (headline, trades, city, F-skatt badge,
`openTo`) with explicit opt-in publish; `/personer` directory; privacy
page reflecting what we store.
**DONE =** a company can complete its profile and appear in the directory
under correct filters; a person can create, publish, hide, and delete a
seeker profile; deleting an account cascades cleanly (GDPR erasure).

### Phase 4 — Polish, analytics, admin *(Sonnet, 1–2 sessions; Fable reviews pre-launch)*
GA4 + GSC wiring; OG images per listing; `/admin` moderation (remove
listing, verify org.nr, aggregator runs, counts); rate limiting on POST
routes; honeypot + disposable-email blocklist on `/publicera`; empty/error
states; a11y pass (keyboard, contrast, focus); Lighthouse ≥ 95; legal pages
final.
**DONE =** Lighthouse ≥ 95 on home/feed/detail; admin can remove a listing
and see aggregator health; spam submission is demonstrably blocked; owner
sign-off on visual QA (mobile + desktop, light + dark).

### Phase 5 — Launch gate *(owner + Fable)*
Outreach checklist (owner): direct invites to local el/tak/solceller firms,
trade Facebook groups, SEO indexing monitored.
**PROJECT DONE = a real external employer (not the owner) has posted a
native listing AND received at least one genuine applicant/anbud contact
through the site's apply-forwarding.** "Site deployed" is not done.

**Explicitly gated (needs a new Fable plan revision):** hosted
applications/CV storage (GDPR data-controller commitment), paid featured
listings, employer inbox/messaging, more trades (vvs, bygg, mark).

---

## 12. Context capsule (read this first in any fresh session)

**Product:** Entreprenadjobb.se — free Swedish job & assignment board for
construction trades (el, tak, solceller). Two-sided: jobs for people
(anställning/lärling) AND assignments (uppdrag) for companies/F-skatt
solos. All free. No CRM/GoHighLevel — that was removed 2026-07-17. Success
= real employers posting and getting contacts (§11 Phase 5).

**Stack:** Next.js App Router + Tailwind v4 + shadcn/ui, Prisma, Neon
Postgres, Auth.js v5 (email magic links via Resend), deployed on Hostinger
managed Node.js from GitHub `main`. One app, one domain.

**Non-negotiables:**
- Runtime DB = Neon **pooled** string (Hostinger↔Neon IPv6 is broken).
  `directUrl` only for local migrations on the owner's **Windows** machine.
  NEVER run prisma migrate/generate on Hostinger.
- PowerShell writes UTF-16 by default → any file-writing instructions for
  the owner must force UTF-8, or use VS Code/Git Bash.
- `trade` ≠ `employment_type` (lärling is an employment type).
- No stored applications/CVs anywhere in Phases 0–5. Apply = forward
  (email/URL/phone). Seeker *profiles* (opt-in, user-volunteered) are OK.
- UI copy Swedish du-form (centralized in `src/copy/sv.ts`); code/comments/
  docs English.
- External (JOBTECH) listings: labeled "via Platsbanken", link out,
  `noindex` detail pages, never outrank native listings.
- Free product — no payments code; `isFeatured` fields are dormant.

**Key files:** schema §6 → `prisma/schema.prisma`; routes §7; folders §8;
front-end acceptance criteria §9; aggregator spec + verify-checklist §10.

**Env vars:** `DATABASE_URL` (pooled), `DIRECT_URL` (local only),
`AUTH_SECRET`, `AUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`,
`JOBTECH_API_KEY` (Phase 2), `NEXT_PUBLIC_GA_ID` (Phase 4).

**Working agreement:** Sonnet builds phase by phase; each phase's DONE
definition is the exit test; Fable reviews at phase exits and owns schema
changes; Opus only for problems Sonnet failed twice. Commit messages in
English. Never push to branches other than the designated feature branch.

**Current state (2026-07-17):** repo contains only `.gitignore` + this
PLAN.md. Nothing built. Next step = Phase 0.

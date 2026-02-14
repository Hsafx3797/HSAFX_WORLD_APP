# HSAFX WORLD — Project Q&A Assessment

> Date: February 14, 2026  
> Status: Honest audit of current codebase state

---

## Q1: Do we have a single script to install all dependencies and build the entire project at once?

### Answer: YES (partially) — install is covered, build is covered, but no single "setup from scratch" script.

**What exists:**

| Command                                      | What it does                                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                               | Installs ALL Node.js dependencies across the entire monorepo (web, admin, all packages) in one shot — thanks to pnpm workspaces. |
| `pnpm build`                                 | Builds ALL packages and apps via Turborepo (`turbo run build`).                                                                  |
| `pnpm dev`                                   | Starts ALL dev servers at once via Turborepo.                                                                                    |
| `pnpm test:all`                              | Runs all Node.js + Python tests.                                                                                                 |
| `pnpm db:generate` → `pnpm db:migrate`       | Generates and runs database migrations.                                                                                          |
| `infra/scripts/db-setup.sh` / `db-setup.ps1` | Database migration + seed (Bash and PowerShell).                                                                                 |

**What does NOT exist:**

- **No single `setup.sh` / `setup.ps1` bootstrap script** that does everything end-to-end (install Node deps + install Python deps + build WASM + run DB migrations + seed).
- Python (FastAPI) dependencies must be installed separately: `cd backend/fastapi && pip install -r requirements.txt`
- Rust/WASM tools must be built separately: `cd packages/wasm/text-tools && wasm-pack build`

### What's needed:

A single `scripts/setup.sh` (and `scripts/setup.ps1` for Windows) that:

1. Checks prerequisites (Node 20+, pnpm 9+, Python 3.11+, Rust)
2. Runs `pnpm install`
3. Sets up Python venv + installs requirements
4. Copies `.env.example` → `.env` if not exists
5. Runs `pnpm db:generate && pnpm db:migrate`
6. Optionally seeds database
7. Optionally builds WASM tools
8. Prints a "setup complete" summary

---

## Q2: Does the UI have a "User Dropdown Menu" in the top right corner?

### Answer: YES — fully implemented with guest/authenticated states.

**Location:** `apps/web/src/components/layout.tsx` — `Header` component.

**Guest (unauthenticated) users see:**

- "Sign In" button (ghost variant)
- "Get Started" button (primary variant, links to `/register`)
- No dropdown menu — just the two buttons

**Authenticated users see:**

- Avatar button (shows user photo or initials) → triggers dropdown
- Dropdown contains:
  - **User info header**: Name + email + Pro/Advance badge (if subscribed)
  - Dashboard (`/dashboard`)
  - History (`/dashboard/history`)
  - Coins (`/dashboard/coins`)
  - API Keys (`/settings/api-keys`)
  - Settings (`/settings`)
  - **Sign Out** (red/destructive)
- **Notification Bell** (separate component, next to avatar)
- **Search button** (opens Command Palette — Ctrl+K)

**Mobile menu:** Fully responsive — hamburger menu shows same nav items + user info on mobile.

### What could be improved:

- Guest dropdown: Currently shows only Sign In + Get Started buttons (no dropdown). Could add a dropdown with: Sign In, Register, Pricing, API Docs.
- Missing from dropdown: "Profile" link, "Analytics" (if Pro), "Billing" shortcut.

---

## Q3: Does a user dashboard/profile UI exist for account management?

### Answer: YES — both exist and are comprehensive.

**User Dashboard** (`/dashboard` → `apps/web/src/app/dashboard/page.tsx`):

- Welcome message with Pro badge
- Stats grid: Coin Balance (with daily bonus claim), Login Streak, Subscription status, Tools Available, Executions Today
- Onboarding Wizard + Checklist (for new users)
- Coin Event Banner (active multiplier events)
- Referral Card (referral program)
- Quick Actions: Use a Tool, Favorites, History, API Keys, Settings, Upgrade
- Recent Activity feed (last 10 executions)

**Settings Page** (`/settings` → `apps/web/src/app/settings/page.tsx`):

- **Profile**: Avatar, display name, email, bio
- **Preferences**: Theme (system/light/dark), language, auto-copy toggle
- **Notifications**: Email notifications, marketing emails toggles
- **Security**: Change password, 2FA enable/disable, active sessions
- **API Access**: API key management (view, copy, reveal, generate)
- **Billing**: Current plan display, upgrade link
- **Privacy & Data**: GDPR data export button
- **Danger Zone**: Account deletion

**Other dashboard pages:**

- `/dashboard/history` — Execution history
- `/dashboard/favorites` — Saved tools
- `/dashboard/coins` — Coin balance & transactions
- `/dashboard/api-keys` — API key CRUD + rate limit info
- `/dashboard/analytics` — Pro-only analytics page

### What could be improved:

- Settings page forms are currently **static HTML** — they render the UI but most fields don't actually save via tRPC (e.g., display name, bio, email fields are not wired to mutations). The structure is there but needs backend wiring.
- No dedicated `/profile` public profile page yet.

---

## Q4: Does registration have password strength validation?

### Answer: NO — only basic `minLength={8}` HTML attribute exists.

**Current state** (`apps/web/src/app/auth/signup/page.tsx`):

- Password field has `minLength={8}` HTML attribute (browser-enforced)
- Text hint: "Must be at least 8 characters"
- **No real-time password strength indicator**
- **No uppercase/lowercase/number/special character requirements in the UI**
- **No visual strength meter** (weak/medium/strong/very strong)
- No max length enforcement (should be 8-128 characters)

**Server-side:** Better Auth handles password hashing but doesn't enforce complexity rules by default. No custom password validation middleware exists.

### What's needed:

1. **Password strength validator** (client-side + server-side):
   - Minimum 8 characters, maximum 128 characters
   - Must contain: 1 uppercase, 1 lowercase, 1 number, 1 special character
   - Real-time validation as user types
2. **Visual strength indicator**:
   - Color-coded bar (red → orange → yellow → green)
   - Text label: Weak / Fair / Strong / Very Strong
   - Checklist showing which requirements are met (✓/✗)
3. **Server-side enforcement**:
   - Better Auth `password.validate` hook or custom middleware
   - Same rules enforced on Change Password in settings

---

## Q5: What's the best approach for storing environment variables?

### Answer: Currently using `.env` files (standard approach). A hybrid approach is recommended.

**Current state:**

- 5 `.env.example` files exist (root, web, admin, fastapi, docker)
- All secrets stored in `.env` files, loaded at build/runtime
- Feature flags partially in `.env` (e.g., `FEATURE_TOOLS_GROUP_1_ENABLED=true`)
- Feature flag service exists (`packages/shared/src/flags/service.ts`) using DB + Redis

**Recommended hybrid approach:**

| Variable Type                                                                                    | Where to Store                                                                    | Why                                                                                                                         |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Infrastructure secrets** (DB URL, Redis URL, API keys, OAuth secrets, Stripe keys, Sentry DSN) | `.env` files / cloud secrets manager (AWS Secrets Manager, Vercel env vars, etc.) | These don't change at runtime. Redeployment is expected when these change.                                                  |
| **Feature flags** (tool group toggles, kill switches, experiments)                               | **Database + Redis cache** (already implemented!)                                 | Can be toggled from admin panel without redeployment.                                                                       |
| **Plan limits** (executions/day, file size, API calls)                                           | **Database** (plans table) or **Code constants**                                  | Currently hardcoded in `packages/shared/src/permissions/plan-access.ts`. Move to DB if you want admin-editable plan limits. |
| **Coin costs, reward amounts**                                                                   | **Database**                                                                      | Already partially in DB (coin packs). Tool coin costs should also be admin-editable.                                        |
| **App configuration** (site name, support email, maintenance mode)                               | **Database** (`system_settings` table) → editable from admin                      | Allows runtime changes without deploy.                                                                                      |

**DO NOT store in database:**

- Database connection strings (chicken-and-egg problem)
- Encryption keys / auth secrets
- Third-party API keys (security risk if DB is compromised)

**What to build for MVP:**

- Keep `.env` for all infra secrets (standard, works everywhere)
- Use existing feature flag system (DB + Redis) for toggleable features
- Add a `system_settings` DB table for admin-editable config (site name, maintenance mode, default coin rewards)

---

## Q6: What's the best approach for MVP deployment?

### Answer: Single VPS with Docker Compose is the most practical MVP approach.

**Current deployment infrastructure prepared:**

- Docker configs exist in `infra/docker/`
- Kubernetes configs exist in `infra/k8s/`
- Both are ready but not battle-tested

**Recommended MVP deployment strategy:**

### Option A: Single VPS + Docker Compose (RECOMMENDED for MVP)

```
Single VPS (e.g., Hetzner CX31 or DigitalOcean $24/mo)
├── Docker Compose
│   ├── next-web (Next.js web app — port 3000)
│   ├── next-admin (Next.js admin — port 3001)
│   ├── fastapi (Python backend — port 8000)
│   └── nginx (reverse proxy + SSL via Let's Encrypt)
├── External Services (managed)
│   ├── Neon PostgreSQL (free tier → $19/mo)
│   ├── Upstash Redis (free tier → $10/mo)
│   ├── Cloudflare R2 (free 10GB)
│   ├── Resend email (free 100/day)
│   └── Sentry (free tier)
```

**Why single VPS:**

- **Cost:** ~$24-48/mo total (VPS + managed DB) vs $100+/mo on Vercel/Railway
- **Simplicity:** One server to manage, one `docker-compose up`
- **Performance:** Co-located services = low latency between Next.js ↔ FastAPI
- **Control:** Full control over resources, no vendor lock-in

### Option B: Managed platforms (faster to deploy, higher cost)

| Service  | Platform               | Cost                 |
| -------- | ---------------------- | -------------------- |
| Web app  | Vercel (free → $20/mo) | Easy Next.js deploys |
| Admin    | Vercel (same project)  | Same                 |
| FastAPI  | Railway ($5/mo)        | Docker deploys       |
| Database | Neon (free tier)       | Managed PostgreSQL   |
| Redis    | Upstash (free tier)    | Managed Redis        |

### Recommendation:

**Start with Option A (single VPS)** for MVP. It's cheaper, simpler, and you control everything. Move to Option B or Kubernetes only when you hit scaling limits.

---

## Q7: Is everything managed from the admin dashboard, or are permissions/tiers hardcoded?

### Answer: HYBRID — Admin panel exists for management, but core limits are currently hardcoded in code.

**What IS manageable from admin panel (14 admin pages):**

| Admin Page                               | What it manages                                                      |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `/dashboard`                             | Real-time metrics: users, subscriptions, executions, revenue, charts |
| `/users` + `/users/[id]`                 | User list, user details, ban/unban, role changes                     |
| `/tools` + `/tools/[id]`                 | Tool list, enable/disable tools, edit tool details                   |
| `/categories`                            | Tool category management                                             |
| `/plans`                                 | Subscription plan management                                         |
| `/subscriptions` + `/subscriptions/[id]` | Active subscriptions, cancellation, refunds                          |
| `/billing`                               | Billing overview                                                     |
| `/coin-packs`                            | Coin pack pricing/management                                         |
| `/feature-flags`                         | Feature flags + kill switches (toggle without deploy)                |
| `/activity`                              | User activity logs                                                   |
| `/api-keys`                              | API key management                                                   |
| `/admins`                                | Admin user management + role assignment                              |
| `/settings`                              | System settings                                                      |

**What IS hardcoded in code (not admin-editable):**

| What                       | Where                                            | Hardcoded Values                                              |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| Plan feature access        | `packages/shared/src/permissions/plan-access.ts` | guest/free/pro/advance feature sets                           |
| Usage limits per plan      | Same file                                        | guest: 10/day, free: 50/day, pro: 500/day, advance: unlimited |
| File size limits           | Same file                                        | guest: 5MB, free: 25MB, pro: 100MB, advance: 500MB            |
| API call limits            | Same file                                        | free: 0, pro: 1000, advance: 10000                            |
| Admin roles & permissions  | `packages/shared/src/permissions/admin-rbac.ts`  | 7 roles with 41 permissions                                   |
| Rate limit rules           | `apps/web/src/lib/auth.ts`                       | Sign-in: 5/min, Sign-up: 3/min, etc.                          |
| Streak tiers & multipliers | Likely in rewards service                        | Streak day thresholds and multipliers                         |
| Coin costs per tool        | Tool definitions                                 | Per-tool coin consumptions                                    |

### What should be migrated to admin-editable (post-MVP):

1. **Plan limits** → Store in `plans` DB table, editable from admin `/plans` page
2. **Tool coin costs** → Store in `tools` DB table (already have `coinCost` column)
3. **Rate limits** → Store in `system_settings`, editable from admin `/settings`
4. **Streak tiers** → Store in DB table, editable from admin
5. **Referral reward amounts** → Store in DB, editable from admin

---

## Q8: Which API keys, account credentials, and secret keys are required for deployment?

### Answer: Here's the complete list from `.env.example`:

### REQUIRED (app won't work without these):

| Variable                             | Service         | How to get                                                          |
| ------------------------------------ | --------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`                       | Neon PostgreSQL | [neon.tech](https://neon.tech) → Create project → Connection string |
| `DATABASE_URL_UNPOOLED`              | Neon (direct)   | Same project, unpooled connection                                   |
| `UPSTASH_REDIS_REST_URL`             | Upstash Redis   | [upstash.com](https://upstash.com) → Create database                |
| `UPSTASH_REDIS_REST_TOKEN`           | Upstash Redis   | Same dashboard                                                      |
| `AUTH_SECRET` / `BETTER_AUTH_SECRET` | Better Auth     | Generate: `openssl rand -hex 32`                                    |
| `NEXT_PUBLIC_APP_URL`                | Your domain     | e.g., `https://hsafx.world`                                         |
| `RESEND_API_KEY`                     | Resend (email)  | [resend.com](https://resend.com) → API Keys                         |
| `EMAIL_FROM`                         | Resend          | e.g., `noreply@hsafx.world` (must verify domain)                    |
| `INTERNAL_SERVICE_SECRET`            | Internal        | Generate: `openssl rand -hex 32`                                    |
| `CRON_SECRET`                        | Internal        | Generate: `openssl rand -hex 32`                                    |

### REQUIRED FOR BILLING (won't charge users without these):

| Variable                 | Service               | How to get                                               |
| ------------------------ | --------------------- | -------------------------------------------------------- |
| `POLAR_ACCESS_TOKEN`     | Polar (subscriptions) | [polar.sh](https://polar.sh) → Settings → API            |
| `POLAR_WEBHOOK_SECRET`   | Polar                 | Webhook configuration                                    |
| `POLAR_ORGANIZATION_ID`  | Polar                 | Organization settings                                    |
| `STRIPE_SECRET_KEY`      | Stripe (coin packs)   | [stripe.com](https://stripe.com) → Developers → API keys |
| `STRIPE_PUBLISHABLE_KEY` | Stripe                | Same page (pk*test*... / pk*live*...)                    |
| `STRIPE_WEBHOOK_SECRET`  | Stripe                | Developers → Webhooks                                    |

### OPTIONAL — OAuth providers (app works without these, just no social login):

| Variable                                    | Service             | How to get                                                                 |
| ------------------------------------------- | ------------------- | -------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google OAuth        | [console.cloud.google.com](https://console.cloud.google.com) → Credentials |
| `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | GitHub OAuth        | [github.com/settings/developers](https://github.com/settings/developers)   |
| `META_CLIENT_ID` + `META_CLIENT_SECRET`     | Meta/Facebook OAuth | [developers.facebook.com](https://developers.facebook.com)                 |

### OPTIONAL — Enhanced features:

| Variable                                                                      | Service       | Purpose              |
| ----------------------------------------------------------------------------- | ------------- | -------------------- |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Cloudflare R2 | File uploads/storage |
| `SENTRY_DSN`                                                                  | Sentry        | Error tracking       |
| `PLAUSIBLE_DOMAIN`, `PLAUSIBLE_API_KEY`                                       | Plausible     | Web analytics        |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`                                    | Inngest       | Background jobs      |
| `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`                                     | Meilisearch   | Full-text search     |

### Total accounts needed for full deployment: **10 services**

### Minimum for MVP: **5 services** (Neon, Upstash, Resend, Polar, Stripe)

---

## Q9: How much analytics and reporting does the admin panel have?

### Answer: SOLID foundation — real-time dashboard with charts, but limited deep-dive analytics.

**Admin Dashboard (`/dashboard`) has:**

- **4 Key Metric Cards** (with trend indicators):
  - Total Users (+ growth %)
  - Active Subscriptions (+ growth %)
  - Today's Executions (+ growth %)
  - Today's Revenue (+ growth %)

- **6 Secondary Metric Cards:**
  - Free Users count
  - Paid Users count
  - Active Tools count
  - Total Tools count
  - Error Rate (%)
  - Average Response Time (ms)

- **4 Interactive Charts** (using Recharts):
  - User Growth (30-day area chart)
  - Tool Executions (daily bar chart — executions vs errors)
  - Revenue Trend (daily area chart)
  - User Breakdown (pie chart — free vs paid + conversion rate)

- **Top 5 Tools** ranked list
- **Recent Errors** feed (last 5 execution failures)
- **Alerts system** (critical/warning/info banners with dismiss)

**Admin Activity Logs (`/activity`):**

- User activity log page exists

**What's missing for comprehensive analytics:**

| Missing Feature                                       | Impact                                |
| ----------------------------------------------------- | ------------------------------------- |
| Date range picker on all charts                       | Can't view custom periods             |
| Export reports (CSV/PDF)                              | Can't share reports with stakeholders |
| Cohort analysis                                       | Can't track user retention            |
| Funnel visualization (signup → first tool use → paid) | Can't optimize conversion             |
| Geographic distribution                               | Don't know where users are            |
| Individual user analytics deep-dive                   | Limited per-user investigaion         |
| Subscription churn analysis                           | Can't predict/prevent churn           |
| API usage breakdown per user/key                      | No API-specific analytics             |
| Real-time websocket updates                           | Dashboard requires manual refresh     |
| Scheduled email reports                               | No automated reporting                |

---

## Q10: Do we have automated testing, backup strategy, and admin-managed disaster recovery?

### Answer: Testing — YES (partial). Backup — NO. Disaster recovery — MINIMAL (kill switch only).

### Automated Testing:

**What exists:**

- **Vitest** configured across 8 workspace packages (shared, schemas, tools, tool-definitions, api, ui, theme, db)
- **Python tests**: `pytest` configured for FastAPI backend
- **OWASP ZAP**: Security scanning script (`infra/scripts/zap-scan.ps1`) for DAST
- **Coverage**: V8 coverage provider configured, thresholds set for `packages/shared` (15% statements, 10% branches, 20% functions)
- **Test commands**:
  - `pnpm test` — Run all Node.js tests
  - `pnpm test:watch` — Watch mode
  - `pnpm test:coverage` — Coverage report
  - `pnpm test:python` — Python tests
  - `pnpm test:all` — All tests combined

**What's missing:**

- No E2E tests (Playwright/Cypress not configured)
- No CI/CD pipeline (no `.github/workflows/` or similar)
- Test coverage thresholds are very low (15% statements)
- No integration tests for tRPC routes
- No load/performance testing

### Backup & Disaster Recovery:

**What exists:**

- **Kill switch system** (`packages/shared/src/flags/service.ts`):
  - `activateKillSwitch(flagName)` — Instantly disables a feature across all users (5-second Redis propagation)
  - `deactivateKillSwitch(flagName)` — Restores the feature
  - Manageable from admin panel via `/feature-flags` page
- **Database**: Neon PostgreSQL provides automatic daily backups + point-in-time recovery (PITR) on paid plans. This is infrastructure-level, not application-level.

**What does NOT exist:**

| Missing                          | Description                                                 |
| -------------------------------- | ----------------------------------------------------------- |
| Application-level backup scripts | No `pg_dump` automation, no scheduled exports               |
| Backup management in admin panel | No UI to view/trigger/restore backups                       |
| Backup logging                   | No audit trail of backup operations                         |
| R2/storage backup                | No file storage backup strategy                             |
| Redis data backup                | No Redis snapshot management                                |
| Disaster recovery runbook        | No documented recovery procedures                           |
| Health monitoring alerts         | No automated alerts for downtime                            |
| Database restore UI              | No admin-panel restore capability                           |
| Maintenance mode toggle          | Kill switch exists but no dedicated "maintenance mode" page |
| Emergency data export            | No bulk data export for migration                           |

### What's needed for production readiness:

1. **Backup:**
   - Automated daily `pg_dump` to R2/S3 (cron job)
   - Neon PITR enabled (paid plan)
   - R2 versioning enabled for file storage
   - Admin panel page: `/backups` — view backup history, trigger manual backup, download backups

2. **Disaster Recovery:**
   - Maintenance mode page (already have kill switch — just need a UI toggle in admin `/settings`)
   - Health check monitoring with alerts (Uptime Robot, Better Stack, or custom)
   - Documented runbook for common scenarios (DB restore, service restart, rollback)

3. **Testing:**
   - E2E tests with Playwright (critical user flows: signup → login → use tool → pay)
   - CI/CD pipeline (GitHub Actions: lint → typecheck → test → build → deploy)
   - Increase coverage thresholds to meaningful levels (60%+ statements)

---

## Summary Matrix

| #   | Question                     | Status                         | Priority to Fix                    |
| --- | ---------------------------- | ------------------------------ | ---------------------------------- |
| 1   | Single setup script          | ⚠️ Partial                     | Low (SETUP.md covers steps)        |
| 2   | User dropdown menu           | ✅ Done                        | —                                  |
| 3   | Dashboard & profile UI       | ✅ Done                        | Low (wire save mutations)          |
| 4   | Password strength validation | ❌ Missing                     | **HIGH** (security)                |
| 5   | Variable storage strategy    | ✅ Good (.env + feature flags) | Medium (add system_settings table) |
| 6   | MVP deployment approach      | ✅ Infra exists                | Medium (test Docker Compose)       |
| 7   | Admin panel management       | ⚠️ Hybrid                      | Medium (move limits to DB)         |
| 8   | Required API keys            | ✅ Documented                  | — (reference only)                 |
| 9   | Admin analytics              | ⚠️ Basic                       | Low (sufficient for MVP)           |
| 10  | Testing + backup + DR        | ❌ Incomplete                  | **HIGH** (no backups, no CI/CD)    |

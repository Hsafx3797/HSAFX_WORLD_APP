# SOLUTION ROADMAP — Step-by-Step Recovery Strategy

> **Date**: February 10, 2026
> **Companion Document**: [MASTER_CODEBASE_ANALYSIS.md](./MASTER_CODEBASE_ANALYSIS.md)
> **Purpose**: Actionable, prioritized recovery plan to bring the codebase to production readiness
> **Method**: Each step has explicit actions, acceptance criteria, estimated effort, and dependency chain

---

## Table of Contents

1. [Recovery Overview](#recovery-overview)
2. [Sprint 1: Emergency Cleanup (Days 1–2)](#sprint-1-emergency-cleanup-days-12)
3. [Sprint 2: Critical Security & CI/CD (Days 3–7)](#sprint-2-critical-security--cicd-days-37)
4. [Sprint 3: Data Layer Completion (Days 8–12)](#sprint-3-data-layer-completion-days-812)
5. [Sprint 4: API & Admin Completion (Days 13–19)](#sprint-4-api--admin-completion-days-1319)
6. [Sprint 5: Operational Infrastructure (Days 20–26)](#sprint-5-operational-infrastructure-days-2026)
7. [Sprint 6: Testing & Quality (Days 27–35)](#sprint-6-testing--quality-days-2735)
8. [Sprint 7: Performance & Finalization (Days 36–42)](#sprint-7-performance--finalization-days-3642)
9. [Post-Launch Backlog](#post-launch-backlog)
10. [Risk Register](#risk-register)
11. [Dependency Graph](#dependency-graph)

---

## Recovery Overview

### Current State → Target State

| Dimension | Current | Target |
|-----------|---------|--------|
| Backend compliance | 9 ownership violations | 0 violations |
| Deprecated code | 4,404 lines in 17 files | 0 deprecated files |
| Database schema | 24/35 planned tables | 28/35 (+ 4 critical additions) |
| tRPC procedures | 45/52 | 52/52 |
| Admin features | 36/58 complete | 48/58 (deferred: 10 low-pri) |
| CI/CD pipelines | 0/4 | 4/4 |
| Test coverage | 0% | >60% for critical paths |
| Security headers | Missing CSP, HSTS | Full header set |
| Scheduled jobs | 0/4 reconciliation jobs | 4/4 |
| Monitoring | None | Basic (error alerting + health) |

### Total Estimated Duration: **6 weeks (42 days)**

### Weekly Burn Rate Summary

| Sprint | Duration | Focus | Risk Level |
|--------|----------|-------|------------|
| Sprint 1 | 2 days | Emergency cleanup | Low (deletions only) |
| Sprint 2 | 5 days | Security + CI/CD | Medium |
| Sprint 3 | 5 days | Database + schema | Medium |
| Sprint 4 | 7 days | API + admin UI | Low |
| Sprint 5 | 7 days | Infra + operations | Medium |
| Sprint 6 | 9 days | Testing | Low |
| Sprint 7 | 7 days | Performance + launch prep | High |

---

## Sprint 1: Emergency Cleanup (Days 1–2)

**Goal**: Eliminate all ownership matrix violations and dead code. Zero new features.

### Step 1.1 — Delete Deprecated Files (1 hour)

**Action**: Delete all 15 `_*_DEPRECATED.py` files from `backend/fastapi/src/`.

```
Files to delete:
  src/api/v1/_admin_DEPRECATED.py        (660 lines)
  src/api/v1/_ads_DEPRECATED.py          (381 lines)
  src/api/v1/_auth_DEPRECATED.py         (290 lines)
  src/api/v1/_billing_DEPRECATED.py      (153 lines)
  src/api/v1/_categories_DEPRECATED.py   (183 lines)
  src/api/v1/_subscriptions_DEPRECATED.py (243 lines)
  src/api/v1/_users_DEPRECATED.py        (229 lines)
  src/api/v1/_webhooks_DEPRECATED.py     (195 lines)
  src/services/_auth_DEPRECATED.py       (246 lines)
  src/services/_auth2_DEPRECATED.py      (246 lines)
  src/services/_billing_DEPRECATED.py    (281 lines)
  src/services/_coins_DEPRECATED.py      (205 lines)
  src/services/_subscriptions_DEPRECATED.py (219 lines)
  src/services/_usage_DEPRECATED.py      (152 lines)
  src/services/_users_DEPRECATED.py      (405 lines)
```

**Acceptance Criteria**:
- [ ] All 15 files deleted
- [ ] `git status` shows only deletions
- [ ] `python -c "import src.main"` still works
- [ ] No active file imports any `_DEPRECATED` module

### Step 1.2 — Delete Ownership-Violating Files (30 minutes)

**Action**: Delete the 2 files that should never have existed.

```
Files to delete:
  src/core/database.py   (52 lines)  — Full SQLAlchemy ORM setup
  src/models/__init__.py (264 lines) — 12 SQLAlchemy ORM models
```

**Post-deletion fix**: Update `src/core/__init__.py` to remove `get_db`, `init_db`, `close_db` exports.

**Acceptance Criteria**:
- [ ] Both files deleted
- [ ] `core/__init__.py` updated — no DB exports
- [ ] No active file imports `database`, `get_db`, `init_db`, `close_db`, or any model

### Step 1.3 — Clean `jobs.py` DB Imports (30 minutes)

**Action**: Remove SQLAlchemy/DB imports from `src/api/v1/jobs.py`.

```python
# REMOVE these imports:
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db

# REMOVE this parameter from create_job():
db: AsyncSession = Depends(get_db)

# REMOVE coin-related fields from job models:
coins_used, coins_reserved, and any coin refund TODO comments
```

**Acceptance Criteria**:
- [ ] Zero `sqlalchemy` imports in `jobs.py`
- [ ] Zero `get_db` references in `jobs.py`
- [ ] Job creation works without DB dependency

### Step 1.4 — Clean `config.py` (30 minutes)

**Action**: Remove settings that violate the ownership matrix.

```python
# REMOVE from Settings class:
DATABASE_URL: str = ...
DATABASE_POOL_SIZE: int = ...
DATABASE_MAX_OVERFLOW: int = ...
STRIPE_SECRET_KEY: str = ...
DAILY_COIN_REWARD: int = ...
REFERRAL_COIN_REWARD: int = ...
AD_WATCH_COIN_REWARD: int = ...
```

**Acceptance Criteria**:
- [ ] config.py has zero DB, Stripe, or coin settings
- [ ] `Settings()` instantiates cleanly
- [ ] `.env.example` updated to remove these variables

### Step 1.5 — Clean `schemas/__init__.py` (30 minutes)

**Action**: Remove auth, billing, subscription, and coin schemas from `src/schemas/__init__.py`.

Keep only: `ToolExecuteRequest`, `ToolExecuteResponse`, `ToolCapability`, `JobStatus`, `TrackingRequest`, `TrackingResponse`.

**Acceptance Criteria**:
- [ ] No auth/billing/subscription/coin Pydantic schemas remain
- [ ] Remaining schemas serve tools, jobs, and tracking only

### Step 1.6 — Clean `requirements.txt` (30 minutes)

**Action**: Remove 10 packages that should not be dependencies.

```
# REMOVE:
sqlalchemy==2.0.44
asyncpg==0.30.0
alembic==1.14.0
greenlet==3.2.4
stripe==7.10.0
passlib[bcrypt]==1.7.4
pyotp==2.9.0
celery[redis]==5.3.6
flower==2.0.1
aioredis==2.0.1
```

**Acceptance Criteria**:
- [ ] All 10 packages removed from `requirements.txt`
- [ ] `pip install -r requirements.txt` succeeds
- [ ] `python -m uvicorn src.main:app` starts successfully
- [ ] All tool endpoints still function

### Step 1.7 — Verification (1 hour)

**Action**: Full smoke test of the cleaned backend.

```bash
# 1. Fresh install
pip install -r requirements.txt

# 2. Start server
uvicorn src.main:app --port 8000

# 3. Health check
curl http://localhost:8000/health

# 4. Capabilities check
curl http://localhost:8000/api/v1/tools/server-capabilities

# 5. Tool execution test
curl -X POST http://localhost:8000/api/v1/tools/image-to-png/execute \
  -H "X-Internal-Secret: test" \
  -F "file=@test.jpg"
```

**Acceptance Criteria**:
- [ ] Server starts with zero import errors
- [ ] Health endpoint returns 200
- [ ] Capabilities endpoint lists 121 tool IDs
- [ ] At least one tool execution works end-to-end
- [ ] Zero references to `database`, `models`, `sqlalchemy`, `stripe`, `passlib`, `pyotp`, `celery` in active code

**Sprint 1 Deliverable**: Backend reduced from ~10,700 lines (active + deprecated + violating) to ~5,700 lines of clean, ownership-compliant code. 17 files deleted, 5 files cleaned.

---

## Sprint 2: Critical Security & CI/CD (Days 3–7)

**Goal**: Foundation for safe deployments and security hardening. No feature work.

### Step 2.1 — Security Headers (4 hours)

**Action**: Add security headers to both Next.js apps.

**File**: `apps/web/next.config.js` and `apps/admin/next.config.js`

```javascript
// Add to next.config.js
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.upstash.io https://*.polar.sh https://*.stripe.com" },
    ],
  },
],
```

**Acceptance Criteria**:
- [ ] `curl -I https://localhost:3000` returns all 7 headers
- [ ] Application still renders correctly (CSP not too restrictive)
- [ ] Admin panel also has headers

### Step 2.2 — Login Security (1 day)

**Files**: `apps/web/src/lib/auth.ts`, new `apps/web/src/lib/login-security.ts`

**Action**:
1. Add Redis-based failed login counter per IP + email combo
2. After 5 failures → require CAPTCHA (hCaptcha or Cloudflare Turnstile)
3. After 10 failures → 15-minute lockout
4. Track failed logins for admin visibility

```typescript
// Key schema
`${env}:login:fails:${ipHash}:${emailHash}` → TTL 15min, increment on fail

// Integration points
- Better-Auth hook: afterPasswordVerification → if failed, increment
- Better-Auth hook: beforeEmailPassword → check counter, enforce CAPTCHA/lockout
```

**Acceptance Criteria**:
- [ ] Failed login counter increments in Redis
- [ ] 6th attempt returns CAPTCHA requirement error
- [ ] 11th attempt returns lockout error with retry-after header
- [ ] Counter resets after successful login
- [ ] Admin can see failed login counts (activity log)

### Step 2.3 — CI Pipeline: Lint + Typecheck + Build (1 day)

**File**: `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build

  fastapi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r backend/fastapi/requirements.txt
      - run: cd backend/fastapi && python -c "import src.main"
```

**Acceptance Criteria**:
- [ ] PR checks pass on a clean branch
- [ ] Failed typecheck blocks merge
- [ ] Build artifacts cached between runs

### Step 2.4 — Deploy Pipelines (1 day)

**Files**: `.github/workflows/deploy-web.yml`, `deploy-admin.yml`, `deploy-fastapi.yml`

**Web + Admin**: Vercel deploys (or `vercel.json` config).
**FastAPI**: Build Docker image → push to registry → deploy to Cloud Run (or fly.io).

**Acceptance Criteria**:
- [ ] Push to `main` triggers deployments
- [ ] Each deployment has environment-specific secrets
- [ ] Rollback mechanism documented

### Step 2.5 — Fix Admin Session Duration (5 minutes)

**File**: `apps/admin/src/lib/auth.ts`

**Action**: Change `expiresIn: 60 * 60 * 8` → `expiresIn: 60 * 60 * 24`

**Acceptance Criteria**:
- [ ] Admin session lasts 24 hours per spec

### Step 2.6 — Fix Executor Docstring (5 minutes)

**File**: `backend/fastapi/src/tools/executor.py`

**Action**: Update docstring from "81 canonical tool IDs" to "121 tool IDs across 9 handlers".

**Sprint 2 Deliverable**: Security headers, login hardening, full CI/CD pipeline, 2 quick fixes.

---

## Sprint 3: Data Layer Completion (Days 8–12)

**Goal**: Add missing critical database tables and complete the tRPC API surface.

### Step 3.1 — Add Missing Critical Tables (2 days)

**File**: `packages/db/src/schema/` — add to existing schema files

**Priority tables to add:**

```typescript
// packages/db/src/schema/audit.ts (new file)
export const apiRequestLogs = pgTable('api_request_logs', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }),
  apiKeyId: varchar('api_key_id', { length: 36 }),
  method: varchar('method', { length: 10 }).notNull(),
  path: varchar('path', { length: 500 }).notNull(),
  statusCode: integer('status_code').notNull(),
  responseTimeMs: integer('response_time_ms'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  requestBody: jsonb('request_body'),
  errorCode: varchar('error_code', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const permissionAuditLogs = pgTable('permission_audit_logs', {
  id: serial('id').primaryKey(),
  adminId: varchar('admin_id', { length: 36 }).notNull(),
  targetUserId: varchar('target_user_id', { length: 36 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // 'assign_role', 'remove_role', 'override_permission'
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// packages/db/src/schema/auth.ts (add to existing)
export const userPermissionOverrides = pgTable('user_permission_overrides', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  permissionId: integer('permission_id').notNull(),
  granted: boolean('granted').notNull(), // true = grant, false = revoke
  reason: text('reason'),
  grantedBy: varchar('granted_by', { length: 36 }).notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// packages/db/src/schema/misc.ts (add to existing)
export const adminSettings = pgTable('admin_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: text('description'),
  updatedBy: varchar('updated_by', { length: 36 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Post-addition**:
1. Update `schema/index.ts` barrel exports
2. Update `schema/relations.ts` with new table relations
3. Run `pnpm db:generate` to create migration
4. Run `pnpm db:migrate` to apply

**Acceptance Criteria**:
- [ ] 4 new tables created in database
- [ ] Drizzle migration runs cleanly
- [ ] Relations defined and query-able
- [ ] Schema barrel exports updated

### Step 3.2 — Complete Missing tRPC Procedures (2 days)

Add 7 missing procedures:

#### `user.changePassword`
```typescript
// packages/api/src/routers/user.ts
changePassword: protectedProcedure
  .input(z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8).max(128),
  }))
  .mutation(async ({ ctx, input }) => {
    // Verify current password via Better-Auth
    // Update password
    // Invalidate other sessions
  }),
```

#### `billing.resumeSubscription`
```typescript
// packages/api/src/routers/billing.ts
resumeSubscription: protectedProcedure
  .mutation(async ({ ctx }) => {
    // Call Polar API to resume paused/canceled subscription
    // Update DB subscription record
  }),
```

#### `billing.changePlan`
```typescript
changePlan: protectedProcedure
  .input(z.object({ newPlanId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Create Polar checkout for new plan
    // Handle proration per billing spec
  }),
```

#### `billing.getInvoices`
```typescript
getInvoices: protectedProcedure
  .input(z.object({ limit: z.number().default(10), cursor: z.string().optional() }))
  .query(async ({ ctx, input }) => {
    // Query invoices table with pagination
  }),
```

#### `admin.deleteCategory`
```typescript
// packages/api/src/routers/admin.ts
deleteCategory: adminProcedure
  .input(z.object({ categoryId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Check no tools reference this category
    // Soft-delete or hard-delete
    // Audit log
  }),
```

#### `ads.getConfig`
```typescript
// packages/api/src/routers/ads.ts
getConfig: protectedProcedure
  .query(async ({ ctx }) => {
    // Return ad reward configuration for current user's plan
  }),
```

**Acceptance Criteria**:
- [ ] All 7 procedures added and typed
- [ ] TypeScript compiles with zero errors
- [ ] Each procedure has input validation
- [ ] Each mutation writes an audit log entry
- [ ] Total procedure count: 52+

### Step 3.3 — Redis Key Namespacing (1 day)

**Action**: Add environment prefix to all Redis keys.

**File**: `backend/fastapi/src/core/redis.py`
```python
# Change hsafx: prefix to {env}: prefix
class RedisCache:
    def __init__(self, env: str = "dev"):
        self.prefix = f"{env}:"
```

**File**: `apps/web/src/lib/redis.ts`
```typescript
// Ensure all Upstash keys use env prefix
const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
```

**File**: `backend/fastapi/src/middleware/rate_limit.py`
```python
# Change rate:user: to {env}:ratelimit:user:
# Change rate:ip: to {env}:ratelimit:ip:
```

**Acceptance Criteria**:
- [ ] All Redis keys start with `dev:` / `staging:` / `prod:`
- [ ] FastAPI and Next.js use same prefix convention
- [ ] Existing data migration plan documented (or fresh start)

**Sprint 3 Deliverable**: 4 new DB tables, 7 new tRPC procedures, standardized Redis keys.

---

## Sprint 4: API & Admin Completion (Days 13–19)

**Goal**: Complete the admin panel to ≥83% feature coverage and activate stubs.

### Step 4.1 — Admin Detail Pages (3 days)

Create 4 missing pages:

#### `/users/[id]/page.tsx`
- User profile header (avatar, email, plan, status)
- Subscription card
- Coin wallet + transaction history table
- Usage statistics (tools used, requests made)
- Activity log timeline
- Action buttons: ban, reset password, adjust coins, force logout

#### `/subscriptions/[id]/page.tsx`
- Subscription details card
- Plan info
- Payment history table
- Usage vs limits gauge
- Action buttons: upgrade, downgrade, cancel, pause, resume, refund

#### `/tools/[id]/page.tsx`
- Tool metadata card
- Execution statistics (daily/weekly/monthly charts)
- Error rate chart
- User breakdown pie chart
- Recent executions table
- Action buttons: edit, enable/disable, force execution mode

#### `/admins/page.tsx`
- Admin list with DataTable
- Role badges
- Invite admin modal
- Change role modal
- Remove admin modal (with 2FA)
- Activity filter to show admin-only actions

**Acceptance Criteria**:
- [ ] All 4 pages render and load data
- [ ] Navigation links from list pages work (`router.push` targets exist)
- [ ] RBAC permissions enforced per page
- [ ] Destructive actions require 2FA confirmation

### Step 4.2 — Activate User Frontend Stubs (1 day)

**Files in `apps/web/`:**

1. `useSubscription.reactivate()` — Wire to `billing.resumeSubscription` tRPC
2. `manageBilling()` — Wire to Stripe Customer Portal URL
3. `useCoins.claimDailyBonus()` — Wire to daily coin bonus logic (if available per plan)

**Acceptance Criteria**:
- [ ] All "coming soon" markers removed
- [ ] Each function either works or throws a meaningful error
- [ ] No user-facing "coming soon" text remains

### Step 4.3 — Webhook Log Table (4 hours)

**File**: `apps/admin/src/app/(admin)/billing/page.tsx`

**Action**: The webhook tab exists but has no DataTable. Wire the `getWebhooks` API hook to render:
- Timestamp
- Provider (Polar/Stripe)
- Event type
- Status (success/failed)
- Retry button

**Acceptance Criteria**:
- [ ] Webhook tab shows a paginated DataTable
- [ ] Retry button calls `retryWebhook` API
- [ ] Failed webhooks highlighted in red

### Step 4.4 — Admin Settings: Anonymous Limits (4 hours)

**File**: `apps/admin/src/app/(admin)/settings/page.tsx`

**Action**: Add section for anonymous rate limits using existing `anonymousLimits` type in `SystemConfig`.

**Acceptance Criteria**:
- [ ] Settings page has "Anonymous Limits" section
- [ ] Can configure max daily uses, file size limits, cooldown period
- [ ] Values persist via system config API

### Step 4.5 — Tool Analytics Charts (4 hours)

**File**: `apps/admin/src/app/(admin)/tools/page.tsx`

**Action**: Wire `getToolAnalytics` response to time-series chart in the analytics modal.

**Acceptance Criteria**:
- [ ] Analytics modal shows daily execution count chart (7/30/90 day)
- [ ] Error rate displayed as percentage
- [ ] Top users list included

**Sprint 4 Deliverable**: 4 new admin pages, 3 stubs activated, 3 partial features completed. Admin moves from 62% to ~83%.

---

## Sprint 5: Operational Infrastructure (Days 20–26)

**Goal**: Scheduled jobs, local dev orchestration, monitoring foundation, feature flags.

### Step 5.1 — Scheduled Reconciliation Jobs (3 days)

Implement 4 cron jobs per `21_BILLING_LOGIC.md`:

**Technology choice**: Vercel Cron (if on Vercel) or QStash (Upstash) triggers.

**File**: `apps/web/src/app/api/cron/` (4 new route handlers)

#### `cron/wallet-reconciliation/route.ts` (02:00 UTC daily)
- Compare wallet balances vs sum of transactions
- Auto-fix drift < 100 coins
- Alert admin for drift ≥ 100 coins
- Log all corrections

#### `cron/anonymous-cleanup/route.ts` (03:00 UTC daily)
- Delete `anonymous_usage` records > 90 days
- Log count of deleted records

#### `cron/subscription-sync/route.ts` (04:00 UTC daily)
- Check each ACTIVE subscription against Polar API
- Update stale statuses
- Handle PAST_DUE → EXPIRED transitions (3-day grace)

#### `cron/stale-job-cleanup/route.ts` (hourly)
- Cancel jobs in PROCESSING state for > 1 hour
- Delete expired job results from Redis
- Clean R2 temp files > 24 hours old

**Acceptance Criteria**:
- [ ] All 4 cron endpoints work when called manually
- [ ] Vercel cron config or QStash schedule configured
- [ ] Each job logs its actions to audit_logs
- [ ] Wallet drift alerts fire correctly

### Step 5.2 — Docker-Compose for Local Dev (1 day)

**File**: `infra/docker/docker-compose.yml`

```yaml
services:
  fastapi:
    build:
      context: ../../
      dockerfile: infra/docker/Dockerfile.fastapi
    ports:
      - "8000:8000"
    env_file: ../../backend/fastapi/.env
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hsafx_dev
    volumes:
      - pg-data:/var/lib/postgresql/data

volumes:
  redis-data:
  pg-data:
```

**Also create**: `.dockerignore` for FastAPI context.

**Acceptance Criteria**:
- [ ] `docker-compose up` starts all 3 services
- [ ] FastAPI connects to local Redis
- [ ] PostgreSQL accessible for Next.js dev server
- [ ] Hot reload works for FastAPI (mount volume)

### Step 5.3 — Basic Monitoring Setup (1 day)

**Action**: Choose between Sentry, Axiom, or Betterstack for error tracking.

**Minimum requirements**:
1. Capture unhandled exceptions in both Next.js apps
2. Capture unhandled exceptions in FastAPI
3. Alert on 500 error rate > 10/min
4. Alert on payment webhook failures > 5

**Files**:
- `apps/web/src/lib/monitoring.ts`
- `apps/admin/src/lib/monitoring.ts`
- `backend/fastapi/src/middleware/error_tracking.py`

**Acceptance Criteria**:
- [ ] Errors appear in external dashboard within 5 seconds
- [ ] Alert rules configured for critical thresholds
- [ ] Source maps uploaded for Next.js (readable stack traces)

### Step 5.4 — Kill Switch Infrastructure (2 days)

**Minimal implementation** from `03_FEATURE_FLAGS.md`:

**Action**: Enhance existing `feature_flags` table with:
- `flag_type` column: `toggle | kill_switch | experiment | rollout`
- `scope` column: `global | plan | user | percentage`
- `rollout_percentage` column
- `kill_switch_activated_at` timestamp

**Server-side service**:
```typescript
// packages/shared/src/flags/service.ts
export class FlagService {
  async evaluate(flagKey: string, context: FlagContext): Promise<boolean>;
  async activateKillSwitch(flagKey: string): Promise<void>;
  async deactivateKillSwitch(flagKey: string): Promise<void>;
}
```

**Kill switch check**: Redis hash with 5-second TTL. Bypass normal resolution chain.

**Acceptance Criteria**:
- [ ] Kill switch activates across all instances within 30 seconds
- [ ] Kill switch UI toggle works in admin panel
- [ ] Feature flags support percentage rollout
- [ ] Flag evaluation logged to audit

**Sprint 5 Deliverable**: 4 cron jobs, local dev Docker, monitoring, kill switches.

---

## Sprint 6: Testing & Quality (Days 27–35)

**Goal**: Establish testing infrastructure and cover critical paths. Target: 60%+ on critical modules.

### Step 6.1 — Testing Infrastructure Setup (1 day)

**Packages to install**:
- `vitest` — test runner (TypeScript-native)
- `@testing-library/react` — component testing
- `msw` — API mocking
- `supertest` — API integration testing
- `playwright` — E2E testing (optional, Sprint 7)

**Files**:
- `vitest.workspace.ts` — workspaces for packages, web, admin
- `packages/*/vitest.config.ts` — per-package config
- `packages/shared/src/__tests__/setup.ts` — test utilities

**Acceptance Criteria**:
- [ ] `pnpm test` runs across all packages
- [ ] Test coverage reporting works
- [ ] CI pipeline includes test step

### Step 6.2 — Tool Execution Unit Tests (3 days)

**Target**: `@hsafx/tool-execution` — the largest package (16,969 lines).

**Strategy**: 3 tests per tool category, covering:
1. Happy path (valid input → expected output)
2. Edge case (empty/null/boundary input)
3. Error case (invalid input → proper error)

**Priority order**:
1. `text/` — 191 tools, most commonly used
2. `calculators/` — financial and health tools need precision
3. `validators/` — must be correct by definition
4. `data-converters/` — JSON/YAML/CSV conversion integrity
5. `encoders/` — Base64, URL, hash correctness
6. `generators/` — UUID uniqueness, password strength
7. `converters/` — color/datetime/number accuracy
8. `formatters/` — SQL/JSON/CSS prettify correctness

**Acceptance Criteria**:
- [ ] ≥200 test cases for tool execution
- [ ] All calculator tests use precise decimal comparison
- [ ] All validator tests include positive and negative cases
- [ ] >80% line coverage for `@hsafx/tool-execution`

### Step 6.3 — API Integration Tests (2 days)

**Target**: tRPC routers and B2B REST API.

**Test files**:
- `packages/api/src/__tests__/user.test.ts`
- `packages/api/src/__tests__/billing.test.ts`
- `packages/api/src/__tests__/tools.test.ts`
- `packages/api/src/__tests__/admin.test.ts`
- `apps/web/src/__tests__/api-v1.test.ts` (B2B REST)

**Strategy**: Mock database with in-memory Drizzle + SQLite.

**Acceptance Criteria**:
- [ ] All 52+ tRPC procedures have at least 1 test
- [ ] Auth middleware tested (unauthenticated → 401)
- [ ] Rate limiting tested (exceed limit → 429)
- [ ] Coin deduction tested (insufficient → error, sufficient → deduction)
- [ ] B2B API key auth tested

### Step 6.4 — Billing Logic Tests (2 days)

**Target**: `@hsafx/shared/billing/` + `apps/web/src/server/coin-service.ts`

**Critical paths**:
1. Coin reservation → commit flow
2. Coin reservation → rollback flow
3. Concurrent coin deduction (race condition test)
4. Subscription state transitions
5. Webhook idempotency
6. Plan feature gating
7. BA weight calculation per tool class

**Acceptance Criteria**:
- [ ] Reservation pattern tested with concurrent requests
- [ ] All 12 tool classes have correct BA weight
- [ ] Plan upgrade/downgrade logic tested
- [ ] Webhook replay does not double-charge

### Step 6.5 — Shared Package Tests (1 day)

**Target**: `@hsafx/shared` — permissions, RBAC, CASL abilities, error codes.

**Key tests**:
- CASL ability builder: verify each plan tier's allowed actions
- Admin RBAC: role hierarchy enforcement
- Error codes: all 52 codes exist and have messages
- Utility functions: formatBytes, slugify, retry logic

**Acceptance Criteria**:
- [ ] Permission checks tested for all 4 plan tiers
- [ ] RBAC tested for all 6 admin roles
- [ ] Error code catalog complete (52 codes)
- [ ] >80% line coverage for `@hsafx/shared`

**Sprint 6 Deliverable**: Testing infrastructure, 200+ tool tests, API integration tests, billing logic tests, shared package tests. Total test count: ~400+.

---

## Sprint 7: Performance & Finalization (Days 36–42)

**Goal**: Performance optimization, load testing, security audit, launch checklist.

### Step 7.1 — Lighthouse Optimization (2 days)

**Target**: Score > 90 on all 4 categories (Performance, Accessibility, Best Practices, SEO).

**Common fixes**:
- Image optimization (Next.js `<Image>` component)
- Font preloading (Inter)
- Code splitting (dynamic imports for tool executors)
- Minimize JavaScript bundle size
- WASM lazy loading
- Proper `<meta>` tags for SEO

**Acceptance Criteria**:
- [ ] Homepage Lighthouse > 90 (all categories)
- [ ] Tool page Lighthouse > 85
- [ ] Admin dashboard Lighthouse > 80

### Step 7.2 — WASM Bundle Optimization (1 day)

**Target**: WASM modules < 3MB gzipped per `44_IMPLEMENTATION_ROADMAP.md`.

**Actions**:
- Measure current WASM bundle size
- Enable wasm-opt optimization
- Code-split WASM modules by tool category
- Lazy-load WASM only when tool is used

**Acceptance Criteria**:
- [ ] Each WASM module < 3MB gzipped
- [ ] Total WASM payload on initial page load = 0 (lazy)
- [ ] First tool execution with WASM < 1 second load time

### Step 7.3 — Load Testing (2 days)

**Tool**: k6, Artillery, or Grafana k6 Cloud.

**Scenarios per `44_IMPLEMENTATION_ROADMAP.md`**:
1. **1000 concurrent users** browsing tool pages
2. **100 concurrent tool executions** (client-side WASM)
3. **50 concurrent file conversions** (FastAPI)
4. **200 concurrent API requests** (B2B endpoint)

**Target metrics**:
- p95 response time < 500ms for API
- p95 execution time < 150ms for server tools
- Zero 5xx errors under load
- FastAPI memory per worker < 500MB

**Acceptance Criteria**:
- [ ] Load test scripts committed to `infra/scripts/`
- [ ] All 4 scenarios pass targets
- [ ] Results documented with screenshots

### Step 7.4 — Security Audit Checklist (1 day)

Run through OWASP Top 10 for the application:

| # | OWASP Category | Check | Status |
|---|---------------|-------|--------|
| A01 | Broken Access Control | RBAC enforcement, plan gating | ☐ |
| A02 | Cryptographic Failures | HTTPS everywhere, Argon2id, HMAC | ☐ |
| A03 | Injection | SQL injection (Drizzle parameterized), XSS (React auto-escapes) | ☐ |
| A04 | Insecure Design | Threat modeling for billing/auth flows | ☐ |
| A05 | Security Misconfiguration | Security headers, error messages don't leak | ☐ |
| A06 | Vulnerable Components | `pnpm audit`, `pip audit` | ☐ |
| A07 | Auth Failures | Session management, token rotation, 2FA bypass | ☐ |
| A08 | Data Integrity Failures | Webhook HMAC verification, JWT tamper check | ☐ |
| A09 | Logging Failures | Audit logs for all admin actions, sensitive data redacted | ☐ |
| A10 | SSRF | FastAPI URL fetching restricted to allowed domains | ☐ |

**Acceptance Criteria**:
- [ ] All 10 categories reviewed
- [ ] All CRITICAL findings fixed
- [ ] HIGH findings documented with mitigations
- [ ] `pnpm audit` shows 0 critical/high vulnerabilities
- [ ] `pip audit` shows 0 critical/high vulnerabilities

### Step 7.5 — Launch Checklist (2 days)

| Category       | Item                                                     | Status |
|----------------|----------------------------------------------------------|--------|
| **DNS**        | Domain configured                                        | ☐     |
| **SSL**        | HTTPS certificate active                                 | ☐     |
| **CDN**        | Static assets cached                                     | ☐     |
| **Database**   | Production Neon database provisioned                     | ☐     |
| **Database**   | Read replicas configured (if needed)                     | ☐     |
| **Database**   | Backup schedule verified                                 | ☐     |
| **Redis**      | Production Upstash Redis provisioned                     | ☐     |
| **Redis**      | `prod:` key prefix verified                              | ☐     |
| **Auth**       | OAuth providers configured (Google, GitHub, Facebook)    | ☐     |
| **Auth**       | Email provider configured (verification, password reset) | ☐     |
| **Payments**   | Polar production keys configured                         | ☐     |
| **Payments**   | Stripe production keys configured                        | ☐     |
| **Payments**   | Webhook URLs registered and verified                     | ☐     |
| **Storage**    | R2 production bucket created                             | ☐     |
| **Storage**    | R2 CORS policy configured                                | ☐     |
| **Monitoring** | Error tracking active                                    | ☐     |
| **Monitoring** | Uptime monitoring active                                 | ☐     |
| **Monitoring** | Alert notifications configured                           | ☐     |
| **CI/CD**      | All pipelines tested with staging deploy                 | ☐     |
| **Legal**      | Terms of Service published                               | ☐     |
| **Legal**      | Privacy Policy published                                 | ☐     |
| **Legal**      | Cookie consent banner                                    | ☐     |
| **SEO**        | Sitemap.xml generated                                    | ☐     |
| **SEO**        | robots.txt configured                                    | ☐     |
| **SEO**        | OpenGraph images for tool pages                          | ☐     |

**Sprint 7 Deliverable**: Performance optimization, load test results, security audit report, launch checklist completed.

---

## Post-Launch Backlog

Items deferred from the recovery sprints:

| #     | Item                                                       | Priority | Estimated Effort |
|-------|------------------------------------------------------------|----------|------------------|
| PL-1  | Full feature flag system (A/B experiments, user overrides) | Medium   | 1–2 weeks        |
| PL-2  | Shared UI component library (`@hsafx/ui`)                  | Medium   | 1–2 weeks        |
| PL-3  | Named BullMQ job queues (image/pdf/document/scraping)      | Low      | 1 day            |
| PL-4  | WebSocket real-time updates (admin + premium users)        | Medium   | 3–5 days         |
| PL-5  | Kubernetes manifests                                       | Low      | 3–5 days         |
| PL-6  | Impersonation system                                       | Medium   | 2–3 days         |
| PL-7  | Email template management (admin)                          | Low      | 2–3 days         |
| PL-8  | Theme management page (admin)                              | Low      | 1–2 days         |
| PL-9  | Security incidents dashboard (admin)                       | Medium   | 2–3 days         |
| PL-10 | API abuse detection (admin)                                | Medium   | 3–5 days         |
| PL-11 | Centralized Zod schemas (`@hsafx/schemas`)                 | Low      | 2–3 days         |
| PL-12 | Database seeding script                                    | Low      | 1 day            |
| PL-13 | i18n framework (English, Urdu, Arabic)                     | Low      | 1–2 weeks        |
| PL-14 | Remaining 5 missing DB tables (low-priority ones)          | Low      | 2–3 days         |
| PL-15 | Remaining admin features (bulk ops, reports, health)       | Low      | 1–2 weeks        |
| PL-16 | Dependency update automation (Renovate/Dependabot)         | Low      | 2 hours          |

---

## Risk Register

| Risk                                                   | Impact   | Likelihood  | Mitigation                                             |
|--------------------------------------------------------|----------|-------------|--------------------------------------------------------|
| Sprint 1 cleanup breaks FastAPI imports                | Medium   | Medium      | Run full import check after each deletion              |
| New DB tables require migration on production          | High     | Certain     | Apply during maintenance window; test on staging first |
| CI/CD pipeline setup delays (credentials, permissions) | Medium   | High        | Pre-provision GitHub secrets and service accounts      |
| Load testing reveals p95 > 500ms                       | High     | Medium      | Profile with flamegraphs; consider caching layer       |
| WASM bundle > 3MB                                      | Medium   | Low         | Code-split by category; use wasm-opt level 3           |
| Security audit reveals critical vulnerabilities        | High     | Medium      | Allocate 2 buffer days in Sprint 7                     |
| Better-Auth Argon2id not default                       | Medium   | Low         | Verify before launch; switch algorithm if needed       |
| Coin deduction race conditions under load              | Critical | Medium      | Sprint 6 concurrent tests will validate                |

---

## Dependency Graph

```
Sprint 1 (Cleanup) ─── no dependencies ───> Sprint 2 (Security + CI/CD)
                                                    │
                                                    ├──> Sprint 3 (Data Layer)
                                                    │         │
                                                    │         └──> Sprint 4 (API + Admin)
                                                    │
                                                    └──> Sprint 5 (Infrastructure)
                                                              │
                                                              ▼
                                                    Sprint 6 (Testing)
                                                              │
                                                              ▼
                                                    Sprint 7 (Performance + Launch)
```

**Critical path**: Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4 → Sprint 6 → Sprint 7

**Parallel work possible**: Sprint 4 + Sprint 5 can run concurrently if resources allow.

---

*End of Solution Roadmap*

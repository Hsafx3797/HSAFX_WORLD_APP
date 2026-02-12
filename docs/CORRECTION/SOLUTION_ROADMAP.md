# SOLUTION ROADMAP — HSAFX WORLD APP

> **Date:** 2026-02-12
> **Commit:** `93846cc` on `master`
> **Based on:** CORRECTION docs 01–05
> **Status:** Phases 1–6 COMPLETE, entering Phase 7

---

## OVERVIEW

This roadmap translates the remaining work items (from [03_REMAINING_WORK.md](03_REMAINING_WORK.md)) into an actionable sequence. All 5 owner decisions are resolved. All 10 planning conflicts are locked.

**Progress:** 38/44 items complete (~86% items, ~217 hours done). ~37 hours remaining.
**No CRITICAL blockers remain** — staging deployment is safe. **Schema-complete milestone achieved. FTS search operational. Feature-complete for v1.0 achieved. Phase 6 Admin & Polish complete. Phase 7 #42 (remaining DB tables) complete.**

---

## DECISION GATES — ALL RESOLVED ✅

| #    | Decision            | Answer                                    | Locked |
|------|---------------------|-------------------------------------------|--------|
| D-01 | Deployment strategy | Self-hosted VPS                           | ✅     |
| D-02 | Background jobs     | Simple queue (no BullMQ)                  | ✅     |
| D-03 | Email provider      | Resend + Self SMTP dual                   | ✅     |
| D-04 | Search engine       | Skip Meilisearch for MVP (PostgreSQL FTS) | ✅     |
| D-05 | Admin real-time     | Both WebSocket + SSE                      | ✅     |

### Planning Conflicts — ALL LOCKED ✅

| #   | Conflict                   | Decision                         |
|-----|----------------------------|----------------------------------|
| #1  | Starter plan price         | $4.99                            |
| #2  | Ad system vs login rewards | Login rewards (ads removed)      |
| #3  | Daily coin cap             | 50 coins/day                     |
| #4  | API key limit              | Max 5 per user                   |
| #5  | Rate limits                | Free=100, Pro=500 req/hr         |
| #6  | Pro plan price             | $10/mo                           |
| #7  | Over-limit error code      | HTTP 402 with B001               |
| #8  | Coins per reward           | 10 coins                         |
| #9  | Status column type         | varchar (not pgEnum)             |
| #10 | Payment provider           | Polar(subs) + Stripe(coins) dual |

---

## PHASE PLAN

### ✅ Phase 1 — Security & Billing Fixes — COMPLETE
> Sprints P0-01 through P0-08, P1-07

**Completed:**
- ✅ Wire coin deduction into B2B REST route
- ✅ Call `confirmReservation()` after async job completion
- ✅ Wire CASL `can()` checks into API routes and UI (full stack)
- ✅ Implement refund clawback webhook handler
- ✅ Add `processed_webhooks` table + idempotency
- ✅ Invoke session rate limit in middleware
- ✅ Server-enforce admin 2FA on all sensitive routes
- ✅ Restrict impersonation actions (scoped middleware)

**Result:** All 12 CRITICAL deviations resolved or partially resolved. Zero blocking items remain.

---

### ✅ Phase 2 — Schema & Logging — COMPLETE
> Sprint P2-01 (logging), Sprint P2-02–P2-05 (schema quality)

**Completed:**
- ✅ Structured logging with pino (`createLogger()` in `@hsafx/shared/logger`)
- ✅ ~75+ `console.*` calls migrated across apps and packages
- ✅ All 13 pgEnums defined (was 4 → 13)
- ✅ `invoice_status` enum fixed (added `partially_paid`)
- ✅ Login reward tables added (`login_reward_claims`)
- ✅ `processed_webhooks` table added
- ✅ `inngest_job_id` renamed to `external_job_id`
- ✅ Ad tables + dead code removed
- ✅ 5 critical indexes added
- ✅ 7 unique constraints verified/added

---

### ✅ Phase 3 — Schema Completion — COMPLETE
> Commit `f1e7900`

**Completed:**
- ✅ 9 pgEnums added: `billing_interval`, `plan_limit_type`, `reset_period`, `plan_change_type`, `audit_action`, `permission_target`, `admin_role_type`, `identifier_type`, `email_provider`
- ✅ `invoice_status` enum — added `partially_paid` value
- ✅ 4 unique constraints added: `planLimits(planId,limitKey)`, `planFeatures(planId,featureKey)`, `planCoinRules(planId,toolClass)`, `userPermissionOverrides(userId,permissionId)`
- ✅ 5 indexes added: `apiRequestLogs(userId)`, `apiRequestLogs(createdAt)`, `permissionAuditLogs(actorId)`, `permissionAuditLogs(createdAt)`, `usageCounters(userId,resourceType,periodStart)` unique
- ✅ `tools.tool_class` — already existed
- ✅ `api_keys.scopes` text[] — already existed

**Exit Criteria:** ✅ Schema matches DBML. All enums, critical indexes, and constraints present. Build passes (5/5).

---

### ✅ Phase 4A — Frontend Stores + Components — COMPLETE
> Commit `71ebaec`

**Completed:**
- ✅ `useBillingStore` — checkout flow, plan selection, coin purchase UI state
- ✅ `useNotificationStore` — notification list, unread count, bell state
- ✅ `useExecutionStore` — execution lifecycle, history (50/tool), undo/redo
- ✅ `ExecutionPanel` — status badges, output display, copy/download, history
- ✅ `UsageCard` — monthly executions, coins spent, balance with progress
- ✅ `BillingCard` — current plan, subscription status, upgrade CTA
- ✅ `TransactionList` — grouped by date, type icons, +/- coin coloring
- ✅ `ActivityFeed` — timeline with status dots, duration, coin badges
- ✅ `NotificationBell` — bell icon with unread badge, dropdown list
- ✅ All components include Skeleton loading variants
- ✅ Barrel exports updated in `components/index.ts`

---

### ✅ Phase 4B — Search + Billing API — COMPLETE
> Commit `d92267a`

**Completed:**
- ✅ GIN expression index on tools table (`to_tsvector('english', name || description || tags)`)
- ✅ Rewrote `tools.list` tRPC — working `plainto_tsquery` search + `categoryId` + `group` filters + pagination count
- ✅ `useToolSearch` hook — debounced (300ms) server-side FTS via tRPC, `placeholderData: keepPreviousData`
- ✅ Hybrid server/client search in `/tools/all` — server FTS when query present, client registry otherwise, loading skeletons
- ✅ 3 B2B billing REST endpoints: `GET /api/v1/billing/balance`, `/transactions` (paginated, type filter), `/subscription`
- ✅ All endpoints use `authenticateApiKey` + `requireScope('billing:read')`

**Exit Criteria:** ✅ FTS search works. B2B billing endpoints available. Build passes (5/5).

---

### ✅ Phase 5 — Tool Execution Completion — COMPLETE
> Commit `c0c1541`

**Completed:**
- ✅ All 16 stub tools resolved — zero stubs remaining
- ✅ 11 JS converters in `packages/tools/src/data-converters/specialized.ts` (~750 lines): Avro→JSON Schema, OpenAPI 2→3, OpenAPI→TypeScript, OpenAPI→GraphQL, GraphQL→OpenAPI, GraphQL→TypeScript, Helm→Kubernetes, Terraform→CloudFormation, Terraform→Pulumi, Dart→JavaScript, ReasonML→JavaScript
- ✅ 3 new FastAPI binary handlers: BSON (`pymongo`), MessagePack (`msgspec`), Protobuf (custom wire-format decoder)
- ✅ 5 text-input tools reclassified from `server`→`client` in registry
- ✅ 2 dead stubs removed (Avro/Parquet already had server handlers)
- ✅ `process_job` implemented in `jobs.py` — 5-min `asyncio.wait_for` timeout, status tracking, webhook notification, coin refund on cancellation
- ✅ Redis `RedisCache` extended with 6 new methods (`zadd`, `zrank`, `zrem`, `sadd`, `smembers`, `lpush`)

**Exit Criteria:** ✅ All 454+ tools execute (zero stubs). FastAPI processes Python jobs. Build passes (5/5).

---

### ✅ Phase 6 — Admin & Polish — COMPLETE
> Commit `ccfc034`

**Sprint A — Admin Features:** Already pre-existing (discovered during Phase 6 planning)
- ✅ Admin analytics dashboard (4 StatCards, 6 metrics, 4 Recharts charts, skeleton loading)
- ✅ Admin audit log viewer (DataTable, 6 action filters, date range, CSV export, details modal)

**Sprint B — Infrastructure Polish:**
- ✅ 16 shared UI components migrated to `@hsafx/ui` (alert, badge, button, card, checkbox, dialog, dropdown-menu, input, label, progress, select, skeleton, switch, tabs, textarea, tooltip)
- ✅ Web app UI files converted to thin re-exports from `@hsafx/ui`
- ✅ Redis session caching via Better-Auth `secondaryStorage` (Upstash Redis)
- ✅ Rolling sessions (`session.updateAge: 3600` — 1h refresh interval)
- ✅ Session cookie renamed to `__hsafx.session_token` via `advanced.cookiePrefix: '__hsafx'`
- ✅ CSRF Origin → Referer fallback → reject in both web + admin middleware
- ✅ Rate limit 429 responses include `Retry-After` header

**Exit Criteria:** ✅ All Phase 6 items resolved. Build passes (5/5).

---

### Phase 7 — Alignment & Remaining (IN PROGRESS)

**What:** Naming alignment, pub/sub, remaining DB tables. (Impersonation reason: pre-existing. Admin billing: pre-existing.)

**Completed:**
- ✅ #42 — 11 new DB tables added across 5 schema files:
  - `toolClassPolicy` (tools.ts) — BA weight per tool class
  - `usageCoinFallbacks` (billing.ts) — over-limit fallback discount rates
  - `invoicePayments` (billing.ts) — partial payment support
  - `paymentMethods` (billing.ts) — stored payment methods
  - `coinPurchasePayments` (billing.ts) — coin pack→payment linkage
  - `planMetadata` (billing.ts) — extensible plan properties
  - `planUpgradeRules` (billing.ts) — automated upgrade conditions
  - `planAuditLogs` (billing.ts) — plan change history
  - `auditLogs` (audit.ts) — system-wide audit trail
  - `permissionGroups` (auth.ts) — permission categorization
  - `emailUsageTracking` (misc.ts) — email volume per provider/period
- ✅ All tables include InferSelectModel/InferInsertModel types + createInsertSchema Zod schemas
- ✅ TypeScript compiles clean (0 errors)

**Remaining:**
- #38 — Naming alignment (update planning docs to match code)
- #41 — Pub/sub channels

---

### Phase 8 — Final Polish (P3)

**What:** Money column migration, E2E testing, cleanup.

- Money columns to integer cents
- Facebook OAuth resolution
- Docker/K8s end-to-end testing

---

## TIMELINE SUMMARY

| Phase                          | Focus | Hours | Cumulative | Status |
|--------------------------------|-------|-------|------------|--------|
| 1. Security & Billing          | 28h   | 28h   | ✅ DONE             |
| 2. Schema & Logging            | 30h   | 58h   | ✅ DONE             |
| 3. Schema Completion           | 12h   | 70h   | ✅ DONE             |
| 4A. Frontend Stores+Components | 22h   | 92h   | ✅ DONE             |
| 4B. Search + Billing API       | 12h   | 104h  | ✅ DONE             |
| 5. Tool Execution              | 15h   | 119h  | ✅ DONE             |
| 6. Admin & Polish              | 22h   | 141h  | ✅ DONE             |
| 7. Alignment + Remaining       | 5h    | 146h  | **IN PROGRESS**         |
| 8. Final Polish                | 16h   | 162h  | Not started         |

**Total remaining: ~37 hours** (from original ~254)

---

## RISK REGISTER

| Risk                                    | Likelihood | Mitigation                                   |
|-----------------------------------------|------------|----------------------------------------------|
| Schema migration breaks existing data   | Low        | Take DB snapshot before migration batch      |
| Frontend rebuild exceeds estimates      | Medium     | Prioritize tool execution page; defer search |
| Stub tool implementation quality        | ~~Medium~~ | ✅ All 16 stubs resolved (Phase 5)           |
| ~~Planning doc conflicts cause rework~~ | ~~High~~   | ✅ All 10 conflicts resolved and locked      |
| ~~Decision gates block progress~~       | ~~High~~   | ✅ All 5 decisions resolved                  |

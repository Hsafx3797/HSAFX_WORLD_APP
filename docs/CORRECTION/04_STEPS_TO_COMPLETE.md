# 04 — STEPS TO COMPLETE (Sprint Execution Plan)

> **Last updated:** 2026-02-12
> **Commit:** `6f7519c` on `master`
> **Based on:** Doc 03 remaining work items
> **Philosophy:** P0 first → P1 next → P2/P3 after

---

## ✅ PHASE 1: SECURITY & BILLING CRITICAL FIXES (P0) — COMPLETED
**All 8 P0 items done across Sprints P0-01 through P0-08, P1-07**

### Sprint 6A — Billing Integrity ✅

| # | Task                                                                      | Ref   | Status  |
|---|---------------------------------------------------------------------------|-------|---------|
| 1 | Wire coin deduction into B2B REST execute route                           | P0-01 | ✅ Done |
| 2 | Call `confirmReservation()` after async job completion                    | P0-02 | ✅ Done |
| 3 | Implement Stripe refund coin clawback                                     | P0-04 | ✅ Done |
| 4 | Add `processed_webhooks` table + wire into both webhook handlers          | P0-05 | ✅ Done |
| 5 | Fix daily bonus race condition (replaced with login rewards + FOR UPDATE) | P1-13 | ✅ Done |

### Sprint 6B — Security Hardening ✅

| #  | Task                                                                                  | Ref   | Status  |
|----|---------------------------------------------------------------------------------------|-------|---------|
| 6  | Invoke `checkUserRateLimit()` in web middleware                                       | P0-06 | ✅ Done |
| 7  | Server-enforce admin 2FA in middleware                                                | P0-07 | ✅ Done |
| 8  | Add impersonation scoped-action middleware                                            | P0-08 | ✅ Done |
| 9  | Add impersonation `reason` field                                                      | P1-12 | ✅ Pre-existing |
| 10 | Wire CASL into web app — `@casl/ability`, `PlanAccessProvider`, `withPlan` middleware | P0-03 | ✅ Done |

---

## ✅ PHASE 2: DATA INTEGRITY & LOGGING — COMPLETED
**Logging COMPLETED. Schema quality COMPLETED.**

### Sprint 7A — Schema Quality ✅

| #  | Task                                            | Ref   | Status                 |
|----|-------------------------------------------------|-------|------------------------|
| 11 | Add remaining 9 pgEnum types (total 13 now)     | P1-01 | ✅ Done (Sprint P2-02) |
| 12 | Add 5 critical database indexes                 | P1-02 | ✅ Done (Sprint P2-05) |
| 13 | Add missing unique constraints on 7 join tables | P1-08 | ✅ Done (Sprint P2-04) |
| 14 | `tools.tool_class` column already exists        | P1-09 | ✅ Pre-existing        |

**Exit criteria:** `drizzle-kit push` succeeds. All enums + indexes in place. No duplicate join-table rows.

### Sprint 7B — Structured Logging ✅

| #  | Task                                                         | Ref   | Status  |
|----|--------------------------------------------------------------|-------|---------|
| 15 | `createLogger()` factory in `@hsafx/shared/logger` with pino | P1-03 | ✅ Done |
| 16 | Replace all `console.*` in `apps/web/`                       | P1-03 | ✅ Done |
| 17 | Replace all `console.*` in `apps/admin/`                     | P1-03 | ✅ Done |
| 18 | Replace all `console.*` in `packages/`                       | P1-03 | ✅ Done |

---

## ✅ PHASE 3: SCHEMA COMPLETION + API KEYS — COMPLETED
**Commit:** `f1e7900` — All enum, index, and constraint gaps closed.

| #  | Task                                            | Ref   | Status          |
|----|-------------------------------------------------|-------|-----------------|
| 11 | Add remaining 9 pgEnums                         | P1-01 | ✅ Done (P2-02) |
| 12 | Add 5 critical database indexes                 | P1-02 | ✅ Done (P2-05) |
| 13 | Add missing unique constraints on 7 join tables | P1-08 | ✅ Done (P2-04) |
| 14 | `tools.tool_class` column                       | P1-09 | ✅ Pre-existing |
| 15 | `api_keys.scopes` text[] column                 | P1-10 | ✅ Pre-existing |

**Exit criteria:** ✅ Schema matches DBML. All 13 enums, 5 critical indexes, 7 unique constraints in place. Build passes (5/5).

---

## ✅ PHASE 4A: FRONTEND STORES + COMPONENTS — COMPLETED
**Commit:** `71ebaec` — 3 stores + 6 components + barrel exports. Build passes (5/5).

### Sprint A — Missing Stores + Components ✅

| #  | Task                                              | Ref   | Status  |
|----|---------------------------------------------------|-------|---------|
| 16 | Build `useBillingStore`                           | P1-05 | ✅ Done |
| 17 | Build `useNotificationStore`                      | P1-05 | ✅ Done |
| 18 | Separate execution state into `useExecutionStore` | P1-05 | ✅ Done |
| 19 | Build `ExecutionPanel` component                  | P1-06 | ✅ Done |
| 20 | Build `UsageCard` component                       | P1-06 | ✅ Done |
| 21 | Build `BillingCard` component                     | P1-06 | ✅ Done |
| 22 | Build `TransactionList` component                 | P1-06 | ✅ Done |
| 23 | Build `ActivityFeed` component                    | P1-06 | ✅ Done |
| 24 | Build `NotificationBell` component                | P1-06 | ✅ Done |

---

## ✅ PHASE 4B: SEARCH + BILLING API — COMPLETED
**Commit:** `d92267a` — FTS search + billing REST. Build passes (5/5).

| #  | Task                                                                   | Ref   | Status  |
|----|------------------------------------------------------------------------|-------|---------|
| 25 | Add GIN expression index on tools (name/description/tags tsvector)     | P1-07 | ✅ Done |
| 26 | Fix `tools.list` tRPC with `plainto_tsquery` search + filters          | P1-07 | ✅ Done |
| 27 | Create `useToolSearch` hook + hybrid server/client search UI           | P1-07 | ✅ Done |
| 28 | Add billing REST endpoints (`balance`, `transactions`, `subscription`) | P1-11 | ✅ Done |

---

## ✅ PHASE 5: TOOL EXECUTION COMPLETION — COMPLETED
**Commit:** `c0c1541` — All stubs resolved + job processing enabled. Build passes (5/5).

| #  | Task                            | Ref   | Status  |
|----|---------------------------------|-------|---------|
| 29 | Complete ~15 stub tool handlers | P1-14 | ✅ Done |
| 30 | Enable FastAPI job processing   | P1-15 | ✅ Done |

**Implementation details:**
- 11 JS converters in `packages/tools/src/data-converters/specialized.ts` (~750 lines)
- 3 new FastAPI binary handlers (BSON, MessagePack, Protobuf) in `python_tools.py`
- 5 text-input tools reclassified from server→client in registry
- `process_job` with 5-min timeout, webhook notification, coin refund
- Redis extended with `zadd`/`zrank`/`zrem`/`sadd`/`smembers`/`lpush`

**Exit criteria:** ✅ All tools execute (zero stubs). FastAPI processes Python jobs.

---

## ✅ PHASE 6: ADMIN & POLISH (P2) — COMPLETED
**Commit:** `ccfc034` — Sprint A pre-existing + Sprint B security/UI polish. Build passes (5/5).
**Duration: ~22 hours**

### Sprint A — Admin Features ✅ ALREADY COMPLETE

| #  | Task                      | Ref   | Hours | Status                           |
|----|---------------------------|-------|-------|----------------------------------|
| 31 | Admin analytics dashboard | P2-03 | 20    | ✅ Pre-existing (310-line page)  |
| 32 | Admin audit log viewer    | P2-04 | 8     | ✅ Pre-existing (~300-line page) |

### Sprint B — Infrastructure Polish (22 hours) ✅

| #  | Task                                           | Ref          | Hours | Status  |
|----|------------------------------------------------|--------------|-------|---------|
| 33 | Move shared UI components to `@hsafx/ui`       | P2-02        | 12    | ✅ Done |
| 34 | Add Redis session caching                      | P2-05        | 4     | ✅ Done |
| 35 | Configure rolling sessions + absolute timeout  | P2-06        | 1     | ✅ Done |
| 36 | Rename session cookie to `__hsafx_session`     | P2-07        | 2     | ✅ Done |
| 37 | Add CSRF Referer fallback + Retry-After header | P2-13, P2-14 | 3     | ✅ Done |

**Implementation details:**
- 16 Shadcn components migrated to `packages/ui/src/components/` (alert, badge, button, card, checkbox, dialog, dropdown-menu, input, label, progress, select, skeleton, switch, tabs, textarea, tooltip)
- Web app UI files converted to thin re-exports from `@hsafx/ui` — zero import-path changes needed
- Better-Auth `secondaryStorage` via Upstash Redis for session caching
- `session.updateAge: 3600` (1h rolling), `advanced.cookiePrefix: '__hsafx'`
- CSRF: Origin → Referer fallback → reject in both web + admin middleware
- Rate limit 429 responses include `Retry-After` header

**Exit criteria:** ✅ All Phase 6 items resolved. Build passes (5/5).

---

## ✅ PHASE 7: NAMING ALIGNMENT + REMAINING (P2 + P3) — COMPLETED
**Duration: ~0 hours remaining** (#38, #39, #40, #41, #42 done)

| #  | Task                                                            | Ref   | Hours | Status                           |
|----|-----------------------------------------------------------------|-------|-------|----------------------------------|
| 38 | Resolve table/column naming: update planning docs to match code | P2-08 | 4     | ✅ Done (DBML aligned, 15 deviations resolved) |
| 39 | Add admin billing management                                    | P2-10 | 12    | ✅ Pre-existing (~300-line page) |
| 40 | Add impersonation `reason` field                                | P1-12 | 1     | ✅ Pre-existing (min 10 chars, audit logged) |
| 41 | Add pub/sub channels                                            | P2-12 | 8     | ✅ Done (event bus + SSE upgrade + publisher wiring) |
| 42 | Add remaining ~7 DB tables                                      | P3-01 | 8     | ✅ Done (11 tables across 5 schema files) |

---

## ✅ PHASE 8: FINAL POLISH (P3) — COMPLETED
**Duration: ~16 hours**

| #  | Task                                          | Ref   | Hours | Status |
|----|-----------------------------------------------|-------|-------|--------|
| 43 | Migrate money columns to integer cents        | P3-02 | 4     | ✅ Done (commit `b2c3e63`) |
| 44 | Resolve Facebook OAuth (doc-update) | P3-05 | 0.5   | ✅ Done (updated `15_SECURITY_MODEL.md`) |
| 45 | Docker/K8s end-to-end testing                 | P3-07 | 8     | ✅ Done |

**#43 Implementation details:**
- Schema: `decimal(10,2)` → `bigint` cents for plans, invoices, payments
- Schema: `integer` → `bigint` for coin_transactions, user_coin_wallets, coin_packs
- Shared: `CoinPack.price` (USD float) → `priceInCents` (integer cents)
- Admin: Plan types updated, formatPrice converts cents→dollars for display
- API routes: plans + subscriptions routes updated
- Seed data: plan prices as integer cents
- DBML + 02_DEVIATIONS M-17 resolved

**#45 Implementation details:**
- Docker: `Dockerfile.web` + `Dockerfile.admin` — multi-stage builds (base→deps→builder→runner), `node:20-alpine`, pnpm 9, standalone output, non-root user, healthcheck
- Docker: `docker-compose.prod.yml` — 6 services (postgres 16, redis 7, fastapi, web, admin, nginx), memory limits, healthchecks, required env vars
- Docker: `nginx.conf` — HTTP→HTTPS redirect, TLS 1.2/1.3, rate limiting (30r/s general, 10r/s API), SSE proxy, WebSocket upgrade, static asset caching
- Docker: `.env.prod.example` — full production env template
- K8s: Kustomize base — namespace, 3 deployments (web 2 replicas, admin 1, fastapi 2), resource limits/requests, readiness/liveness probes, ClusterIP services
- K8s: Staging overlay — 1 replica each, lower resources, staging URLs
- K8s: Production overlay — production URLs, nginx ingress with cert-manager TLS, host-based routing
- Next.js: `output: 'standalone'` enabled in both web + admin `next.config.js`
- Root `.dockerignore` created
- `infra/README.md` + `infra/k8s/README.md` fully rewritten

---

## TIMELINE SUMMARY

| Phase | Focus                        | Hours | Cumulative | Status      |
|-------|------------------------------|-------|------------|-------------|
| 1     | Security + Billing Critical  | 28    | 28         | ✅ DONE     |
| 2     | Schema + Logging             | 30    | 58         | ✅ DONE     |
| 3     | Schema Completion + API Keys | 12    | 70         | ✅ DONE     |
| 4A    | Frontend Stores + Components | 22    | 92         | ✅ DONE     |
| 4B    | Search + Billing API         | 12    | 104        | ✅ DONE     |
| 5     | Tool Execution Completion    | 15    | 119        | ✅ DONE     |
| 6     | Admin Features + Polish      | 22    | 141        | ✅ DONE     |
| 7     | Naming + Remaining           | 1     | 150h  | ✅ DONE             |
| 8     | Final Polish                 | 16    | 162        | Not started |

### Critical Milestones

| Milestone                     | After Phase | Status      |
|-------------------------------|-------------|-------------|
| **Safe to deploy staging**    | Phase 1     | ✅ ACHIEVED |
| **Schema-complete**           | Phase 3     | ✅ ACHIEVED |
| **Feature-complete for v1.0** | Phase 5     | ✅ ACHIEVED |
| **Full product**              | Phase 7     | ✅ ACHIEVED |
| **Planning-aligned**          | Phase 8     | ✅ ACHIEVED |

---

## DECISION POINTS — ALL RESOLVED

### D-01: Deployment Strategy ✅
**Decision:** Self-hosted VPS. Single VPS initially, split later.

### D-02: Background Jobs ✅
**Decision:** Simple queue system. No BullMQ, no Inngest. Custom lightweight queue with Redis.

### D-03: Email Provider ✅
**Decision:** Resend + Self SMTP dual provider. Admin-configurable from panel.

### D-04: Search Engine ✅
**Decision:** Skip Meilisearch for MVP. PostgreSQL FTS sufficient.

### D-05: Admin Real-time ✅
**Decision:** Both WebSocket AND SSE. SSE for metrics/notifications, WebSocket for bidirectional communication.

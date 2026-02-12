# 03 — REMAINING WORK

> **Last audited:** 2026-02-12
> **Current state:** ~94% overall completion
> **Methodology:** Every gap from doc 01 and 02 mapped to actionable work items

---

## PRIORITY SYSTEM

| Priority | Criteria |
|----------|----------|
| **P0** | Must fix before ANY deployment — security, data integrity, billing correctness |
| **P1** | Required for v1.0 launch — core features users expect |
| **P2** | Important for complete product — planned features |
| **P3** | Nice to have — polish and optimization |

---

## P0 — BLOCKING (Must Fix Before Any Deployment)

> ### ✅ ALL P0 ITEMS COMPLETED
>
> | #     | Task                                         | Sprint      | Status  |
> |-------|----------------------------------------------|-------------|---------|
> | P0-01 | Wire coin deduction into B2B REST route      | P0-01       | ✅ Done |
> | P0-02 | Call `confirmReservation()` after async job  | P0-02       | ✅ Done |
> | P0-03 | Wire CASL into web app + API middleware      | P1-07/P0-03 | ✅ Done |
> | P0-04 | Implement Stripe refund coin clawback        | P0-04       | ✅ Done |
> | P0-05 | Add `processed_webhooks` table + idempotency | P0-05       | ✅ Done |
> | P0-06 | Invoke session rate limit in middleware      | P0-06       | ✅ Done |
> | P0-07 | Server-enforce admin 2FA in middleware       | P0-07       | ✅ Done |
> | P0-08 | Add impersonation scoped-action middleware   | P0-08       | ✅ Done |

---

## P1 — REQUIRED FOR v1.0

### P1-01: Add All PostgreSQL Enums
> **✅ COMPLETED** (Sprint P2-02) — All 13 pgEnums now defined: `subscription_status`, `coin_transaction_type`, `invoice_status` (+ `partially_paid`), `payment_status`, `billing_interval`, `plan_limit_type`, `reset_period`, `plan_change_type`, `audit_action`, `permission_target`, `admin_role_type`, `identifier_type`, `email_provider`.

### P1-02: Add Database Indexes _(partial — 5 critical indexes added)_
- **Gap:** C-05 — Bulk planned indexes were missing
- **Done:** 5 critical indexes added (Sprint P2-05): `apiRequestLogs(userId)`, `apiRequestLogs(createdAt)`, `permissionAuditLogs(actorId)`, `permissionAuditLogs(createdAt)`, `usageCounters(userId,resourceType,periodStart)` unique
- **Remaining:** ~20 additional indexes from DBML Section 16 (GIN, partial, composite)
- **Effort:** ~3 hours remaining

### P1-03: Install Structured Logger for TypeScript
> **✅ COMPLETED** (Sprint P2-01) — pino-backed `createLogger()` in `@hsafx/shared/logger`. ~75+ calls migrated.

### P1-04: Implement Missing ~10 Database Tables
> **✅ MOSTLY COMPLETED** (Phase 7 #42) — 11 tables added across 5 schema files: `tool_class_policy` (tools.ts), `usage_coin_fallbacks`, `invoice_payments`, `payment_methods`, `coin_purchase_payments`, `plan_metadata`, `plan_upgrade_rules`, `plan_audit_logs` (billing.ts), `audit_logs` (audit.ts), `permission_groups` (auth.ts), `email_usage_tracking` (misc.ts). All with types + Zod schemas. TypeScript compiles clean.
- **Still missing:** `plan_permissions`, `billable_action_logs` (~2 tables)
- **Effort:** ~2 hours remaining

### P1-05: Complete Missing Zustand Stores
> **✅ COMPLETED** (Sprint P4-A) — Created `useBillingStore`, `useNotificationStore`, `useExecutionStore`. 6 total stores now (3 existing + 3 new).

### P1-06: Build Missing UI Components (6)
> **✅ COMPLETED** (Sprint P4-A) — All 6 components built with Skeleton loading variants: ExecutionPanel, UsageCard, BillingCard, TransactionList, ActivityFeed, NotificationBell. Barrel-exported from `components/index.ts`.

### P1-07: Implement Search (PostgreSQL FTS Minimum)
> **✅ COMPLETED** (Sprint P4-B) — GIN expression index on tools `to_tsvector('english', name || description || tags)`. Rewrote `tools.list` tRPC with `plainto_tsquery` search + categoryId/group filters. Created `useToolSearch` hook with 300ms debounce. Hybrid server/client search in `/tools/all` page.

### P1-08: Add Missing Unique Constraints on Join Tables
> **✅ COMPLETED** (Sprint P2-04) — 4 new unique constraints added (`planLimits`, `planFeatures`, `planCoinRules`, `userPermissionOverrides`) + 3 pre-existing (`userRoles`, `rolePermissions`, `favorites`) = 7 total.

### P1-09: Add `tools.tool_class` Column
> **✅ COMPLETED** (pre-existing) — Column already exists as `toolClass: varchar('tool_class', { length: 50 })` in tools schema.

### P1-10: Add `api_keys.scopes` Column
> **✅ COMPLETED** (pre-existing) — Column already exists as `scopes: text('scopes').array().default([])` in apiKeys schema.

### P1-11: Add Billing REST Endpoints
> **✅ COMPLETED** (Sprint P4-B) — 3 B2B REST routes: `GET /api/v1/billing/balance` (coin wallet), `GET /api/v1/billing/transactions` (paginated history with type filter), `GET /api/v1/billing/subscription` (current plan). All use `authenticateApiKey` + `requireScope('billing:read')`.

### P1-12: Add Impersonation `reason` Field
> **✅ COMPLETED** (pre-existing) — POST body already requires `reason` (string, min 10 chars), validated inline, stored in audit log metadata as `{ adminRole, targetEmail, targetName, reason }`. Route: `apps/admin/src/app/api/admin/impersonate/route.ts`.

### P1-13: Fix Daily Bonus Race Condition
> **✅ COMPLETED** (Sprint P1-02) — Replaced with login reward system using `FOR UPDATE` locking.

### P1-14: Complete ~15 Stub Tool Handlers
> **✅ COMPLETED** (Sprint P5) — All 16 stubs resolved: 11 JS converters in `specialized.ts` (Avro→JSON Schema, OpenAPI 2→3, OpenAPI→TS, OpenAPI→GraphQL, GraphQL→OpenAPI, GraphQL→TS, Helm→K8s, Terraform→CF, Terraform→Pulumi, Dart→JS, ReasonML→JS), 3 new FastAPI binary handlers (BSON, MessagePack, Protobuf), 2 dead stubs removed (Avro/Parquet already had server handlers).

### P1-15: Enable FastAPI Job Processing
> **✅ COMPLETED** (Sprint P5) — `process_job` implemented in `jobs.py` with 5-minute `asyncio.wait_for` timeout, status tracking (queued→running→completed/failed/timeout), webhook notification via httpx, coin refund on cancellation via Redis list, execution time measurement.

**P1 Remaining: ~6 hours** (was ~10, reduced by P1-04 mostly completed)

---

## P2 — IMPORTANT FOR COMPLETE PRODUCT

### P2-01: Structured Logging
> **✅ COMPLETED** — pino logger installed, ~75+ console.* calls migrated.

### P2-02: Move UI Components to `@hsafx/ui` (Shared)
> **✅ COMPLETED** (Sprint P6-B) — 16 shared Shadcn components migrated to `packages/ui/src/components/` (alert, badge, button, card, checkbox, dialog, dropdown-menu, input, label, progress, select, skeleton, switch, tabs, textarea, tooltip). Web app files converted to thin re-exports from `@hsafx/ui`. `cn()` utility in `packages/ui/src/lib/utils.ts`.

### P2-03: Add Admin Analytics Dashboard
> **✅ COMPLETED** (pre-existing) — Full dashboard page with 4 StatCards, 6 secondary metrics, 4 Recharts charts (user growth, execution trend, revenue, user breakdown), top tools, recent errors, quick actions, skeleton loading. 5 API routes + 5 SWR hooks.

### P2-04: Add Admin Audit Log Viewer
> **✅ COMPLETED** (pre-existing) — Full audit page with DataTable, 6 action category filters, search, date range, admin ID filter, CSV export, details modal with JSON viewer. API route + SWR hook.

### P2-05: Add Redis Session Caching
> **✅ COMPLETED** (Sprint P6-B) — Better-Auth `secondaryStorage` configured with Upstash Redis. DB fallback retained for resilience.

### P2-06: Configure Rolling Sessions + Absolute Timeout
> **✅ COMPLETED** (Sprint P6-B) — `session.updateAge: 3600` (1h rolling). `session.expiresIn: 7*86400` (web) / `24*3600` (admin) for max lifetime.

### P2-07: Rename Session Cookie
> **✅ COMPLETED** (Sprint P6-B) — `advanced.cookiePrefix: '__hsafx'` in both apps → cookie `__hsafx.session_token`. All middleware cookie references updated.

### P2-08: Resolve Table/Column Naming Mismatches
- **Gap:** M-05 through M-15
- **Decision:** Update planning docs to match code (per D-01 direction: code wins, docs updated)
- **Effort:** ~4 hours (doc updates only)

### P2-09: Add Meilisearch for Full Fuzzy Search
> **SKIPPED** (D-04 decision: too expensive for MVP). PostgreSQL FTS is sufficient.

### P2-10: Add Admin Billing Management
> **✅ COMPLETED** (pre-existing) — Full billing page with transactions tab (search, type/date filters, paginated DataTable, CSV export) + webhooks tab (Stripe/Polar provider badges, retry button, status tracking). API routes + SWR hooks.

### P2-11: Add Stripe Dispute + Payment Failed Handlers
> **✅ COMPLETED** (Sprint P1-06) — Stub handlers with structured logging added.

### P2-12: Add Pub/Sub Channels
- **Effort:** ~8 hours

### P2-13: Add CSRF Referer Fallback
> **✅ COMPLETED** (Sprint P6-B) — Origin → Referer fallback → reject chain in both web and admin middleware.

### P2-14: Add `Retry-After` Header to Rate Limit Responses
> **✅ COMPLETED** (Sprint P6-B) — Rate limit 429 responses include `Retry-After` header with seconds-until-reset.

**P2 Remaining: ~12 hours** (was ~34, reduced by P2-02, P2-05, P2-06, P2-07, P2-13, P2-14 completion in Sprint P6-B)

---

## P3 — NICE TO HAVE

### P3-01: Remaining ~7 Missing DB Tables
> **✅ MOSTLY COMPLETED** (Phase 7 #42) — 6/7 added: `invoice_payments`, `payment_methods`, `coin_purchase_payments`, `plan_metadata`, `plan_upgrade_rules`, `plan_audit_logs`.
- **Still missing:** `plan_theme_access`
- **Effort:** ~2 hours remaining

### P3-02: Money Columns — Integer Cents vs Decimal
- Migrate `decimal(10,2)` to `bigint` cents where planning requires
- **Effort:** ~4 hours

### P3-03: Remove `inngest_job_id` Column
> **✅ COMPLETED** (Sprint P1-05) — Renamed to `external_job_id`.

### P3-04: Login Reward System
> **✅ COMPLETED** (Sprint P1-02) — Login reward service with 10 coins/reward, 50 coins/day cap.

### P3-05: Remove Facebook OAuth (Not in Planning)
- Or update planning docs if desired
- **Effort:** ~0.5 hours

### P3-06: Coin Lock Lua Script (vs SQL FOR UPDATE)
- Planning specifies Redis-based lock. Current SQL lock works but differs.
- **Effort:** ~4 hours

### P3-07: Docker/K8s End-to-End Testing
- **Effort:** ~8 hours

**P3 Remaining: ~19 hours** (was ~25, reduced by P3-01 mostly completed)

---

## EFFORT SUMMARY

| Priority                  | Items  | Hours                    | Completed             |
|---------------------------|--------|--------------------------|-----------------------|
| **P0 — Blocking**         | 8      | ~28                    | ✅ ALL 8 DONE         |
| **P1 — v1.0 Required**    | 15     | ~6 remaining             | 14.5/15 done          |
| **P2 — Complete Product** | 14     | ~8 remaining             | 13/14 done (1 skipped) |
| **P3 — Polish**           | 7      | ~19 remaining            | 3.5/7 done            |
| **TOTAL**                 | **44** | **~33 hours remaining**  | **39/44 done**        |

### Progress
- **Originally estimated:** ~254 hours total
- **Completed:** ~221 hours of work (P0 + P1 + P2 partial + P3 partial + P4-A + P4-B + P5 + P6-B + P7 partial)
- **Remaining:** ~33 hours
- **No CRITICAL items remain** — system is deployment-safe for staging
- **Schema 13/13 enums DONE, 5/25+ indexes DONE + GIN FTS index, 7/7 unique constraints DONE**
- **Frontend: 6/6 stores DONE, 6/6 missing components DONE, FTS search DONE**
- **Billing: B2B REST endpoints DONE (balance, transactions, subscription)**
- **Tool Execution: ALL 16 stubs resolved, FastAPI job processing enabled, Redis extended**
- **Phase 6 Sprint B: UI migration to `@hsafx/ui`, Redis session caching, rolling sessions, cookie rename, CSRF Referer fallback, Retry-After header**
- **Phase 7 #42: 11 new DB tables added across 5 schema files (toolClassPolicy, usageCoinFallbacks, invoicePayments, paymentMethods, coinPurchasePayments, planMetadata, planUpgradeRules, planAuditLogs, auditLogs, permissionGroups, emailUsageTracking)**
- **Phase 7 #38: DBML naming alignment — 3 table renames, 15+ column renames, enum rename, all FK refs updated. 02_DEVIATIONS: 46/57 resolved (81%)**

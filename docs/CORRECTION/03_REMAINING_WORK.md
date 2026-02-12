# 03 — REMAINING WORK

> **Last audited:** 2026-02-12
> **Current state:** ~82% overall completion
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
> | # | Task | Sprint | Status |
> |---|------|--------|--------|
> | P0-01 | Wire coin deduction into B2B REST route | P0-01 | ✅ Done |
> | P0-02 | Call `confirmReservation()` after async job | P0-02 | ✅ Done |
> | P0-03 | Wire CASL into web app + API middleware | P1-07/P0-03 | ✅ Done |
> | P0-04 | Implement Stripe refund coin clawback | P0-04 | ✅ Done |
> | P0-05 | Add `processed_webhooks` table + idempotency | P0-05 | ✅ Done |
> | P0-06 | Invoke session rate limit in middleware | P0-06 | ✅ Done |
> | P0-07 | Server-enforce admin 2FA in middleware | P0-07 | ✅ Done |
> | P0-08 | Add impersonation scoped-action middleware | P0-08 | ✅ Done |

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
- **Done:** `processed_webhooks`, `login_reward_claims`
- **Remaining:** `tool_class_policy`, `plan_permissions`, `usage_coin_fallbacks`, `billable_action_logs`, `permission_groups` + others
- **Effort:** ~6 hours (reduced)

### P1-05: Complete Missing Zustand Stores
> **✅ COMPLETED** (Sprint P4-A) — Created `useBillingStore`, `useNotificationStore`, `useExecutionStore`. 6 total stores now (3 existing + 3 new).

### P1-06: Build Missing UI Components (6)
> **✅ COMPLETED** (Sprint P4-A) — All 6 components built with Skeleton loading variants: ExecutionPanel, UsageCard, BillingCard, TransactionList, ActivityFeed, NotificationBell. Barrel-exported from `components/index.ts`.

### P1-07: Implement Search (PostgreSQL FTS Minimum)
- **Gap:** H-01
- **Work:** Add tsvector column to `tools` table + GIN index. Create search API route with `plainto_tsquery`. Replace client-side filtering.
- **Effort:** ~8 hours

### P1-08: Add Missing Unique Constraints on Join Tables
> **✅ COMPLETED** (Sprint P2-04) — 4 new unique constraints added (`planLimits`, `planFeatures`, `planCoinRules`, `userPermissionOverrides`) + 3 pre-existing (`userRoles`, `rolePermissions`, `favorites`) = 7 total.

### P1-09: Add `tools.tool_class` Column
> **✅ COMPLETED** (pre-existing) — Column already exists as `toolClass: varchar('tool_class', { length: 50 })` in tools schema.

### P1-10: Add `api_keys.scopes` Column
> **✅ COMPLETED** (pre-existing) — Column already exists as `scopes: text('scopes').array().default([])` in apiKeys schema.

### P1-11: Add Billing REST Endpoints
- **Gap:** H-10
- **Work:** REST wrappers for: `/api/v1/billing/balance`, `/api/v1/billing/transactions`, `/api/v1/billing/subscription`
- **Effort:** ~4 hours

### P1-12: Add Impersonation `reason` Field
- **Gap:** H-05
- **Work:** Require `reason` in POST body, store in audit log
- **Effort:** ~1 hour

### P1-13: Fix Daily Bonus Race Condition
> **✅ COMPLETED** (Sprint P1-02) — Replaced with login reward system using `FOR UPDATE` locking.

### P1-14: Complete ~15 Stub Tool Handlers
- **Gap:** H-08
- **Work:** Implement actual logic for BSON, MessagePack, Avro, Protobuf, Parquet, etc. tools
- **Effort:** ~12 hours

### P1-15: Enable FastAPI Job Processing
- **Gap:** H-09
- **Work:** Uncomment `process_job` in `jobs.py`, implement job completion callback
- **Effort:** ~3 hours

**P1 Remaining: ~38 hours** (was ~60, reduced by P1-05 and P1-06 completion)

---

## P2 — IMPORTANT FOR COMPLETE PRODUCT

### P2-01: Structured Logging
> **✅ COMPLETED** — pino logger installed, ~75+ console.* calls migrated.

### P2-02: Move UI Components to `@hsafx/ui` (Shared)
- **Gap:** H-04
- **Work:** Migrate reusable components from `apps/web/src/components/` to `packages/ui/src/`
- **Effort:** ~12 hours

### P2-03: Add Admin Analytics Dashboard
- **Gap:** H-12
- **Work:** API routes for usage metrics, revenue, user growth. Admin dashboard page with charts.
- **Effort:** ~20 hours

### P2-04: Add Admin Audit Log Viewer
- **Gap:** H-13
- **Work:** Admin page with searchable/filterable audit log table. API route to query `activity_logs` + `permission_audit_logs`.
- **Effort:** ~8 hours

### P2-05: Add Redis Session Caching
- **Gap:** H-14
- **Work:** Configure Better-Auth to use Redis as session cache layer
- **Effort:** ~4 hours

### P2-06: Configure Rolling Sessions + Absolute Timeout
- **Gap:** M-02
- **Work:** Add `rolling: true` and `absoluteTimeout` to Better-Auth config
- **Effort:** ~1 hour

### P2-07: Rename Session Cookie
- **Gap:** M-01
- **Work:** Set `cookie.name: '__hsafx_session'` in Better-Auth config + update all cookie references
- **Effort:** ~2 hours

### P2-08: Resolve Table/Column Naming Mismatches
- **Gap:** M-05 through M-15
- **Decision:** Update planning docs to match code (per D-01 direction: code wins, docs updated)
- **Effort:** ~4 hours (doc updates only)

### P2-09: Add Meilisearch for Full Fuzzy Search
> **SKIPPED** (D-04 decision: too expensive for MVP). PostgreSQL FTS is sufficient.

### P2-10: Add Admin Billing Management
- **Effort:** ~12 hours

### P2-11: Add Stripe Dispute + Payment Failed Handlers
> **✅ COMPLETED** (Sprint P1-06) — Stub handlers with structured logging added.

### P2-12: Add Pub/Sub Channels
- **Effort:** ~8 hours

### P2-13: Add CSRF Referer Fallback
- **Effort:** ~2 hours

### P2-14: Add `Retry-After` Header to Rate Limit Responses
- **Effort:** ~1 hour

**P2 Remaining: ~74 hours** (was ~110, reduced by completed + skipped items)

---

## P3 — NICE TO HAVE

### P3-01: Remaining ~7 Missing DB Tables
`plan_theme_access`, `invoice_payments`, `payment_methods`, `coin_purchase_payments`, `plan_metadata`, `plan_upgrade_rules`, `plan_audit_logs`
- **Effort:** ~8 hours

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

**P3 Remaining: ~25 hours** (was ~28, reduced by completed items)

---

## EFFORT SUMMARY

| Priority | Items | Hours | Completed |
|----------|-------|-------|-----------|
| **P0 — Blocking** | 8 | ~28 | ✅ ALL 8 DONE |
| **P1 — v1.0 Required** | 15 | ~38 remaining | 9/15 done |
| **P2 — Complete Product** | 14 | ~74 remaining | 3/14 done (1 skipped) |
| **P3 — Polish** | 7 | ~25 remaining | 2/7 done |
| **TOTAL** | **44** | **~137 hours remaining** | **22/44 done** |

### Progress
- **Originally estimated:** ~254 hours total
- **Completed:** ~117 hours of work (P0 + partial P1/P2/P3 + P4-A stores/components)
- **Remaining:** ~137 hours
- **No CRITICAL items remain** — system is deployment-safe for staging
- **Schema 13/13 enums DONE, 5/25+ indexes DONE, 7/7 unique constraints DONE**
- **Frontend: 6/6 stores DONE, 6/6 missing components DONE**

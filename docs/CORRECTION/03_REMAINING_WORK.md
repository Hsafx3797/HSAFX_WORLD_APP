# 03 — REMAINING WORK

> **Last audited:** 2025-07-15
> **Current state:** ~58% overall completion
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

### P0-01: Wire Coin Deduction into B2B REST Route
- **Gap:** C-01 — API key users execute tools for free
- **Work:** Call `reserveCoins()`/`deductCoins()` in `/api/v1/tools/[toolKey]/execute/route.ts` before `createJob()`
- **Files:** `apps/web/src/app/api/v1/tools/[toolKey]/execute/route.ts`
- **Effort:** ~2 hours

### P0-02: Call `confirmReservation()` After Async Job Completion
- **Gap:** C-02 — Reservations stay pending forever
- **Work:** In `job-worker.ts`, after successful `processJob()`, call `confirmReservation()`. On failure, call `releaseReservation()`.
- **Files:** `apps/web/src/server/jobs/job-worker.ts`
- **Effort:** ~2 hours

### P0-03: Wire CASL Into Web App + API Middleware
- **Gap:** C-03 — No plan-based access control
- **Work:**
  1. Install `@casl/react`
  2. Create `CASLProvider` that builds ability from user's plan
  3. Add tRPC middleware that calls `buildUserAbility()` and checks before tool execution
  4. Add REST middleware equivalent for B2B routes
- **Files:** `apps/web/src/providers/`, `packages/api/src/middleware/`, all tool execution routes
- **Effort:** ~8 hours

### P0-04: Implement Stripe Refund Coin Clawback
- **Gap:** C-08 — Users keep coins after refund
- **Work:** In `charge.refunded` handler, look up original coin transaction by `stripeEventId`, create negative coin transaction, deduct from wallet
- **File:** `apps/web/src/app/api/webhooks/stripe/route.ts`
- **Effort:** ~3 hours

### P0-05: Add `processed_webhooks` Table + Idempotency
- **Gap:** C-11 — Non-coin events reprocessed
- **Work:**
  1. Add `processed_webhooks` table to schema
  2. Check `(provider, eventId)` before processing any webhook
  3. Insert after successful processing
- **Files:** `packages/db/src/schema/billing.ts`, both webhook routes
- **Effort:** ~4 hours

### P0-06: Invoke Session Rate Limit in Middleware
- **Gap:** C-06 — Authenticated users have no rate limit
- **Work:** Call `checkUserRateLimit()` in web middleware for authenticated non-API-key requests
- **File:** `apps/web/src/middleware.ts`
- **Effort:** ~1 hour

### P0-07: Server-Enforce Admin 2FA
- **Gap:** C-12 — 2FA bypassable via crafted requests
- **Work:** In admin middleware, make a DB/Redis call to verify `admin_2fa_session` cookie signature + recency. Deny state-changing requests without valid 2FA.
- **File:** `apps/admin/src/middleware.ts`
- **Effort:** ~4 hours

### P0-08: Add Impersonation Scoped-Action Middleware
- **Gap:** H-06 — All actions allowed during impersonation
- **Work:** Create middleware that detects impersonation cookie and blocks: billing, password change, account deletion, 2FA changes, API key operations
- **Files:** New middleware, wire into relevant routes
- **Effort:** ~4 hours

**P0 Total: ~28 hours**

---

## P1 — REQUIRED FOR v1.0

### P1-01: Add PostgreSQL Enums
- **Gap:** C-04 — Free text in enum columns
- **Work:** Define all 13 planned pgEnums. Migrate existing text columns.
- **Files:** `packages/db/src/schema/*.ts`, new migration
- **Effort:** ~6 hours

### P1-02: Add Database Indexes
- **Gap:** C-05 — Zero performance/integrity indexes
- **Work:** Add all 25+ planned indexes including partial unique, composite
- **Files:** `packages/db/src/schema/*.ts`, new migration
- **Effort:** ~4 hours

### P1-03: Install Structured Logger for TypeScript
- **Gap:** C-07 — All console.* usage
- **Work:**
  1. Create `@hsafx/logger` package (or add to `@hsafx/shared`) with pino
  2. Add `sanitizeForLogging()` PII redactor
  3. Replace all `console.*` calls across `apps/web/`, `apps/admin/`, `packages/`
- **Effort:** ~12 hours (large surface area)

### P1-04: Implement Missing 13 Database Tables
- **Gap:** C-09
- **Work:** Add tables incrementally:
  - Immediate: `processed_webhooks` (P0-05), `tool_class_policy`, `plan_permissions`
  - v1.0: `usage_coin_fallbacks`, `billable_action_logs`, `permission_groups`
  - Later: remaining 7
- **Effort:** ~8 hours

### P1-05: Complete Missing Zustand Stores
- **Gap:** H-03
- **Work:** Create `useBillingStore`, `useNotificationStore`. Separate execution state from `useToolStore`.
- **Effort:** ~6 hours

### P1-06: Build Missing UI Components (6)
- **Gap:** H-02
- **Work:** ExecutionPanel, UsageCard, BillingCard, TransactionList, ActivityFeed, NotificationBell
- **Effort:** ~16 hours

### P1-07: Implement Search (PostgreSQL FTS Minimum)
- **Gap:** H-01
- **Work:** Add tsvector column to `tools` table + GIN index. Create search API route with `plainto_tsquery`. Replace client-side filtering.
- **Effort:** ~8 hours

### P1-08: Add Missing Unique Constraints on Join Tables
- **Gap:** M-20
- **Work:** Add unique constraints on 7 join tables
- **Effort:** ~2 hours

### P1-09: Add `tools.tool_class` Column
- **Gap:** H-15
- **Work:** Add column, populate from `DEFAULT_BA_WEIGHTS` map, update `coin-service.ts` to read from DB
- **Effort:** ~3 hours

### P1-10: Add `api_keys.scopes` Column
- **Gap:** H-11
- **Work:** Add `text[]` column, migrate from metadata JSONB, update `hasScope()` to read from column
- **Effort:** ~2 hours

### P1-11: Add Billing REST Endpoints
- **Gap:** H-10
- **Work:** REST wrappers for: `/api/v1/billing/balance`, `/api/v1/billing/transactions`, `/api/v1/billing/subscription`
- **Effort:** ~4 hours

### P1-12: Add Impersonation `reason` Field
- **Gap:** H-05
- **Work:** Require `reason` in POST body, store in audit log
- **Effort:** ~1 hour

### P1-13: Fix Daily Bonus Race Condition
- **Gap:** H-07
- **Work:** Add `FOR UPDATE` on wallet query in `claimDailyBonus`
- **Effort:** ~1 hour

### P1-14: Complete ~15 Stub Tool Handlers
- **Gap:** H-08
- **Work:** Implement actual logic for BSON, MessagePack, Avro, Protobuf, Parquet, etc. tools
- **Effort:** ~12 hours

### P1-15: Enable FastAPI Job Processing
- **Gap:** H-09
- **Work:** Uncomment `process_job` in `jobs.py`, implement job completion callback
- **Effort:** ~3 hours

**P1 Total: ~88 hours**

---

## P2 — IMPORTANT FOR COMPLETE PRODUCT

### P2-01: Install BullMQ + Job Queue Infrastructure
- **Gap:** C-10
- **Work:** Install BullMQ, create queue workers, set up 4 queues (default/priority/scheduled/dead-letter), add Redis connection for queue, migrate from inline to queue-based job processing
- **Effort:** ~16 hours

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
- **Decision needed:** Either update planning docs to match code OR rename in code. Requires migration.
- **Effort:** ~8 hours (if code changes) or ~4 hours (if docs updated)

### P2-09: Add Meilisearch for Full Fuzzy Search
- **Planning requires** Meilisearch (doc 11, 16). P1-07 does PostgreSQL FTS as minimum.
- **Effort:** ~12 hours

### P2-10: Add Admin Billing Management
- **Effort:** ~12 hours

### P2-11: Add Stripe Dispute + Payment Failed Handlers
- **Effort:** ~4 hours

### P2-12: Add Pub/Sub Channels
- **Effort:** ~8 hours

### P2-13: Add CSRF Referer Fallback
- **Effort:** ~2 hours

### P2-14: Add `Retry-After` Header to Rate Limit Responses
- **Effort:** ~1 hour

**P2 Total: ~110 hours**

---

## P3 — NICE TO HAVE

### P3-01: Remain 7 Missing DB Tables
`plan_theme_access`, `invoice_payments`, `payment_methods`, `coin_purchase_payments`, `plan_metadata`, `plan_upgrade_rules`, `plan_audit_logs`
- **Effort:** ~8 hours

### P3-02: Money Columns — Integer Cents vs Decimal
- Migrate `decimal(10,2)` to `bigint` cents where planning requires
- **Effort:** ~4 hours

### P3-03: Remove `inngest_job_id` Column
- Vestigial from Inngest replacement
- **Effort:** ~1 hour

### P3-04: Add Missing `roles` Table Columns
- `role_type`, `is_default`, `is_active`, `sort_order`, `deleted_at`, `updated_at`
- **Effort:** ~2 hours

### P3-05: Remove Facebook OAuth (Not in Planning)
- Or update planning docs if desired
- **Effort:** ~0.5 hours

### P3-06: Coin Lock Lua Script (vs SQL FOR UPDATE)
- Planning specifies Redis-based lock. Current SQL lock works but differs.
- **Effort:** ~4 hours

### P3-07: Docker/K8s End-to-End Testing
- **Effort:** ~8 hours

**P3 Total: ~28 hours**

---

## EFFORT SUMMARY

| Priority | Items | Hours |
|----------|-------|-------|
| **P0 — Blocking** | 8 | ~28 |
| **P1 — v1.0 Required** | 15 | ~88 |
| **P2 — Complete Product** | 14 | ~110 |
| **P3 — Polish** | 7 | ~28 |
| **TOTAL** | **44** | **~254 hours** |

### Critical Path to MVP
P0 items MUST be done first: **~28 hours of security + billing fixes** before any new features.

Then P1 items bring the product to launchable state: **~88 more hours**.

**Minimum viable deployment: P0 + P1 = ~116 hours of work.**

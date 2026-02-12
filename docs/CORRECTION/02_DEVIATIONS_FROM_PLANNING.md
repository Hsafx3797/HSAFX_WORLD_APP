# 02 — DEVIATIONS FROM PLANNING

> **Last audited:** 2026-02-12
> **Commit:** `5394975`
> **Source:** All planning docs (01–74) cross-referenced against actual source code

---

## SEVERITY DEFINITIONS

| Level | Meaning |
|-------|---------|
| **CRITICAL** | Blocks core functionality, data corruption risk, or security vulnerability |
| **HIGH** | Feature entirely missing or broken — user-visible impact |
| **MEDIUM** | Works differently than planned — may cause confusion or partial feature gaps |
| **LOW** | Naming/cosmetic differences or minor spec deviations |

---

## CRITICAL DEVIATIONS (12) — STATUS UPDATE

### C-01: B2B REST Execute Route Bypasses Coin Deduction
> **✅ RESOLVED** (Sprint P0-01) — `reserveCoins()` now called in `/api/v1/tools/[toolKey]/execute/route.ts` before job creation.

### C-02: Coin Reservation Never Confirmed After Async Jobs
> **✅ RESOLVED** (Sprint P0-02) — `job-worker.ts` calls `confirmReservation()` on success and `releaseReservation()` on failure.

### C-03: CASL Completely Unwired in Web App
> **✅ RESOLVED** (Sprint P1-07/P0-03) — Full stack wiring:
> - `getUserPlan()` helper resolves plan from subscriptions JOIN plans
> - `withPlan` middleware + `planGatedProcedure` in tRPC
> - CASL ability checks in API v1 execute route
> - `PlanAccessProvider` → `trpc.user.getMyPlan.useQuery()` in React

### C-04: Zero PostgreSQL Enums in Schema
> **⚠️ PARTIALLY RESOLVED** (Sprint P1-01) — 4 pgEnums defined: `subscription_status`, `coin_transaction_type`, `invoice_status`, `payment_status`. **9 remaining:** `billing_interval`, `audit_action`, `permission_target`, `admin_role_type`, `plan_change_type`, `plan_limit_type`, `reset_period`, `identifier_type`, `email_provider`.

### C-05: Zero Explicit Database Indexes
> **⚠️ PARTIALLY RESOLVED** — Some indexes added (e.g. `async_jobs` user_id + status). **Bulk planned indexes still needed** (25+ from DBML).

### C-06: Session Rate Limiting Never Invoked
> **✅ RESOLVED** (Sprint P0-06) — `checkUserRateLimit()` invoked in web middleware for authenticated non-API-key requests.

### C-07: No Structured Logging in TypeScript
> **✅ RESOLVED** (Sprint P2-01) — pino-backed `createLogger()` in `@hsafx/shared/logger`. ~75+ `console.*` calls migrated across ~28 server-side files. Client-side and CLI scripts intentionally use `console.*`.

### C-08: Stripe Refund Webhook Does Not Claw Back Coins
> **✅ RESOLVED** (Sprint P0-04) — `charge.refunded` handler now deducts coins from wallet.

### C-09: 13 Planned Database Tables Missing
> **⚠️ PARTIALLY RESOLVED** — `processed_webhooks` and `login_reward_claims` added. **~10 tables still missing** (see doc 01 §2).

### C-10: BullMQ Not Installed — No Job Queue
> **✅ RESOLVED BY DECISION** (D-02) — Decision: simple queue, no BullMQ. `job-manager.ts` + `job-worker.ts` use custom lightweight approach with Redis. `inngest_job_id` column renamed to `external_job_id`.

### C-11: Non-Coin Webhook Events Have Zero Idempotency
> **✅ RESOLVED** (Sprint P0-05) — `processed_webhooks` table with `(provider, eventId)` unique constraint. All webhook events checked before processing.

### C-12: Admin 2FA Not Server-Enforced
> **✅ RESOLVED** (Sprint P0-07) — Admin middleware verifies 2FA session server-side. State-changing requests denied without valid 2FA.

**CRITICAL SUMMARY: 9/12 fully resolved, 3/12 partially resolved (enums, indexes, tables). Zero critical deviations remain blocking.**

---

## HIGH DEVIATIONS (15) — STATUS UPDATE

### H-01: No Search Infrastructure
> **OPEN** — Client-side `String.includes()` only. PostgreSQL FTS planned but not yet implemented.

### H-02: 6/10 Planned UI Components Missing
> **OPEN** — ExecutionPanel, UsageCard, BillingCard, TransactionList, ActivityFeed, NotificationBell still missing.

### H-03: 3/6 Zustand Stores Missing
> **OPEN** — `useBillingStore`, `useNotificationStore` missing. `useExecutionStore` merged into `useToolStore`.

### H-04: `@hsafx/ui` Package Is Theme-Only
> **OPEN** — All UI components in `apps/web/src/components/` (app-local, not shared).

### H-05: Impersonation Missing Mandatory `reason` Field
> **OPEN** — POST body still only validates `userId`. No `reason` parameter.

### H-06: Impersonation Missing Scoped-Action Enforcement
> **✅ RESOLVED** (Sprint P0-08) — Middleware blocks billing, password change, 2FA, API key, and account deletion during impersonation.

### H-07: Daily Bonus Race Condition
> **✅ RESOLVED** (Sprint P1-02) — Replaced with login reward system with proper `FOR UPDATE` locking (10 coins/reward, 50 coins/day cap).

### H-08: ~15 Node.js Tool Handlers Return Stubs
> **OPEN** — Still ~15 stub handlers in `executor.ts`.

### H-09: FastAPI Job Processing Disabled
> **OPEN** — `process_job` in `jobs.py` still commented out.

### H-10: No Billing REST Endpoints for B2B
> **OPEN** — All billing tRPC-only. Missing: `/api/v1/billing/balance`, `/api/v1/billing/transactions`, etc.

### H-11: API Key Scopes Not in Database Column
> **OPEN** — Scopes still in `metadata` JSONB. No dedicated `text[]` column.

### H-12: No Admin Analytics Dashboard
> **OPEN** — No analytics routes or components.

### H-13: No Admin Audit Log Viewer
> **OPEN** — Audit tables exist but no admin UI.

### H-14: No Redis Session Cache
> **OPEN** — Better-Auth uses database-backed sessions only.

### H-15: Missing `tools.tool_class` Column
> **OPEN** — Tool class still determined by `DEFAULT_BA_WEIGHTS` map in `coin-service.ts`.

**HIGH SUMMARY: 2/15 resolved (H-06, H-07). 13/15 open.**

---

## MEDIUM DEVIATIONS (20) — STATUS UPDATE

### M-01: Session Cookie Name — **OPEN**
### M-02: No Rolling Sessions — **OPEN**
### M-03: Facebook OAuth Added Without Planning — **OPEN**
### M-04: tRPC Router Structure Differs — **OPEN** (but ads router removed, rewards router added)
### M-05: Table Name — `plans` vs `subscription_plans` — **OPEN**
### M-06: Table Name — `oauth_connections` vs `social_auths` — **OPEN**
### M-07: Table Name — `activity_logs` vs `audit_logs` — **OPEN**
### M-08: Table Name — `permissions` vs `permissions_catalog` — **OPEN**
### M-09: Column — `plans.slug` vs `subscription_plans.code` — **OPEN**
### M-10: Column — `plans.price_monthly/yearly` vs `subscription_plans.price_cents` — **OPEN**
### M-11: Column — `plans.polar_product_id` vs `subscription_plans.stripe_price_id` — **OPEN** (dual provider resolved by D-10)
### M-12: Column — `coin_transactions.type` vs `coin_transactions.txn_type` — **OPEN**
### M-13: Column — `coin_transactions.resource_type/id` vs `reference_type/id` — **OPEN**
### M-14: Column — `api_keys.rate_limit_tier` (text) vs `rate_limit_per_hour` (integer) — **OPEN**
### M-15: Column — `admin_settings.key/value` vs `setting_key/setting_value` — **OPEN**
### M-16: `api_rate_limits` Keyed Differently — **OPEN**
### M-17: Money Stored as `decimal(10,2)` Not `bigint` Cents — **OPEN**
### M-18: `async_jobs` Still Has `inngest_job_id` Column
> **✅ RESOLVED** (Sprint P1-05) — Column renamed from `inngest_job_id` to `external_job_id` (simple queue reference).

### M-19: `roles` Table Missing Columns — **OPEN**
### M-20: Missing Unique Constraints On Join Tables — **OPEN**

**MEDIUM SUMMARY: 1/20 resolved (M-18). 19/20 open (mostly naming/cosmetic — will be batch-resolved via doc update per D-01 decision).**

---

## LOW DEVIATIONS (10) — STATUS UPDATE

### L-01: CSRF Only Checks Origin, No Referer Fallback — **OPEN**
### L-02: No `Retry-After` Header in Rate Limit Responses — **OPEN**
### L-03: CASL Functions Named `buildUserAbility`/`buildAdminAbility` — **OPEN** (cosmetic only)
### L-04: Permission Check Uses Role Membership Not Granular Permission — **OPEN**
### L-05: `password_reset_tokens.used_at` (timestamp) vs Planning's `used` (boolean) — **OPEN**
### L-06: `email_verification_tokens.used_at` (timestamp) vs Planning's `verified` (boolean) — **OPEN**
### L-07: `user_roles.assigned_at` vs Planning's `created_at` — **OPEN**
### L-08: `role_permissions.granted_at` vs Planning's `created_at` + Missing `granted` Boolean — **OPEN**
### L-09: Impersonation Banner Says "Read-only session" — Planning Says Scoped Read+Execute
> **⚠️ PARTIALLY RESOLVED** — Scoped actions now enforced (P0-08), but banner text may still say "Read-only".

### L-10: `user_preferences`/`user_settings` Missing `created_at`/`updated_at` Columns — **OPEN**

**LOW SUMMARY: 0/10 fully resolved. 1/10 partially resolved.**

---

## DEVIATION COUNT SUMMARY

| Severity | Total | Resolved | Partial | Open |
|----------|-------|----------|---------|------|
| CRITICAL | 12 | 9 | 3 | 0 |
| HIGH | 15 | 2 | 0 | 13 |
| MEDIUM | 20 | 1 | 0 | 19 |
| LOW | 10 | 0 | 1 | 9 |
| **TOTAL** | **57** | **12** | **4** | **41** |

### Progress: 12 fully resolved + 4 partially = **28% fully resolved, 7% partial**
### Remaining: 41 open deviations (13 HIGH, 19 MEDIUM, 9 LOW) — no CRITICAL items blocking

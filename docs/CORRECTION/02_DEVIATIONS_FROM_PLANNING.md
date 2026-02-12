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
> **✅ RESOLVED** (Phase 3) — All 13 pgEnums defined: `subscription_status`, `coin_transaction_type`, `invoice_status` (+ `partially_paid`), `payment_status`, `billing_interval`, `plan_limit_type`, `reset_period`, `plan_change_type`, `audit_action`, `permission_target`, `admin_role_type`, `identifier_type`, `email_provider`.

### C-05: Zero Explicit Database Indexes
> **⚠️ PARTIALLY RESOLVED** — 5 critical indexes added (`apiRequestLogs(userId)`, `apiRequestLogs(createdAt)`, `permissionAuditLogs(actorId)`, `permissionAuditLogs(createdAt)`, `usageCounters(userId,resourceType,periodStart)` unique) + GIN FTS expression index on tools. **~20 bulk planned indexes still needed** (from DBML).

### C-06: Session Rate Limiting Never Invoked
> **✅ RESOLVED** (Sprint P0-06) — `checkUserRateLimit()` invoked in web middleware for authenticated non-API-key requests.

### C-07: No Structured Logging in TypeScript
> **✅ RESOLVED** (Sprint P2-01) — pino-backed `createLogger()` in `@hsafx/shared/logger`. ~75+ `console.*` calls migrated across ~28 server-side files. Client-side and CLI scripts intentionally use `console.*`.

### C-08: Stripe Refund Webhook Does Not Claw Back Coins
> **✅ RESOLVED** (Sprint P0-04) — `charge.refunded` handler now deducts coins from wallet.

### C-09: 13 Planned Database Tables Missing
> **⚠️ MOSTLY RESOLVED** (Phase 7 #42) — 13 of 14 missing tables addressed: `processed_webhooks`, `login_reward_claims` (Phase 2), + 11 new tables in Phase 7 (`toolClassPolicy`, `usageCoinFallbacks`, `invoicePayments`, `paymentMethods`, `coinPurchasePayments`, `planMetadata`, `planUpgradeRules`, `planAuditLogs`, `auditLogs`, `permissionGroups`, `emailUsageTracking`). **~2-3 tables remaining** (`plan_permissions`, `billable_action_logs`, `plan_theme_access`).

### C-10: BullMQ Not Installed — No Job Queue
> **✅ RESOLVED BY DECISION** (D-02) — Decision: simple queue, no BullMQ. `job-manager.ts` + `job-worker.ts` use custom lightweight approach with Redis. `inngest_job_id` column renamed to `external_job_id`.

### C-11: Non-Coin Webhook Events Have Zero Idempotency
> **✅ RESOLVED** (Sprint P0-05) — `processed_webhooks` table with `(provider, eventId)` unique constraint. All webhook events checked before processing.

### C-12: Admin 2FA Not Server-Enforced
> **✅ RESOLVED** (Sprint P0-07) — Admin middleware verifies 2FA session server-side. State-changing requests denied without valid 2FA.

**CRITICAL SUMMARY: 10/12 fully resolved, 2/12 partially/mostly resolved (indexes, tables). Zero critical deviations remain blocking.**

---

## HIGH DEVIATIONS (15) — STATUS UPDATE

### H-01: No Search Infrastructure
> **✅ RESOLVED** (Sprint P4-B) — PostgreSQL FTS: GIN expression index on tools `to_tsvector('english', name || description || tags)`, `plainto_tsquery` in tRPC `tools.list`, `useToolSearch` hook (300ms debounce), hybrid server/client search in `/tools/all`.

### H-02: 6/10 Planned UI Components Missing
> **✅ RESOLVED** (Sprint P4-A) — All 6 components built with Skeleton loading: ExecutionPanel, UsageCard, BillingCard, TransactionList, ActivityFeed, NotificationBell. Barrel-exported from `components/index.ts`.

### H-03: 3/6 Zustand Stores Missing
> **✅ RESOLVED** (Sprint P4-A) — `useBillingStore`, `useNotificationStore`, `useExecutionStore` created. 6 total stores now.

### H-04: `@hsafx/ui` Package Is Theme-Only
> **✅ RESOLVED** (Sprint P6-B) — 16 shared Shadcn components migrated to `packages/ui/src/components/`. Web app files converted to thin re-exports from `@hsafx/ui`.

### H-05: Impersonation Missing Mandatory `reason` Field
> **✅ RESOLVED** (pre-existing) — POST body requires `reason` (string, min 10 chars), validated inline, stored in audit log metadata as `{ adminRole, targetEmail, targetName, reason }`. Route: `apps/admin/src/app/api/admin/impersonate/route.ts`.

### H-06: Impersonation Missing Scoped-Action Enforcement
> **✅ RESOLVED** (Sprint P0-08) — Middleware blocks billing, password change, 2FA, API key, and account deletion during impersonation.

### H-07: Daily Bonus Race Condition
> **✅ RESOLVED** (Sprint P1-02) — Replaced with login reward system with proper `FOR UPDATE` locking (10 coins/reward, 50 coins/day cap).

### H-08: ~15 Node.js Tool Handlers Return Stubs
> **✅ RESOLVED** (Sprint P5) — All 16 stubs implemented: 11 JS converters in `specialized.ts`, 3 new FastAPI binary handlers (BSON, MessagePack, Protobuf), 2 dead stubs removed.

### H-09: FastAPI Job Processing Disabled
> **✅ RESOLVED** (Sprint P5) — `process_job` implemented in `jobs.py` with 5-min timeout, status tracking, webhook notification, coin refund on cancellation.

### H-10: No Billing REST Endpoints for B2B
> **✅ RESOLVED** (Sprint P4-B) — 3 B2B billing routes: `GET /api/v1/billing/balance`, `/transactions` (paginated, type filter), `/subscription`. All use `authenticateApiKey` + `requireScope('billing:read')`.

### H-11: API Key Scopes Not in Database Column
> **✅ RESOLVED** (pre-existing) — `scopes: text('scopes').array().default([])` column exists in `apiKeys` schema. `hasScope()` operational.

### H-12: No Admin Analytics Dashboard
> **✅ RESOLVED** (pre-existing) — Full dashboard: 4 StatCards, 6 secondary metrics, 4 Recharts charts, top tools, recent errors, quick actions, skeleton loading. 5 API routes + 5 SWR hooks.

### H-13: No Admin Audit Log Viewer
> **✅ RESOLVED** (pre-existing) — Full audit page: DataTable, 6 action filters, search, date range, admin ID filter, CSV export, details modal with JSON viewer.

### H-14: No Redis Session Cache
> **✅ RESOLVED** (Sprint P6-B) — Better-Auth `secondaryStorage` configured with Upstash Redis. DB fallback retained.

### H-15: Missing `tools.tool_class` Column
> **✅ RESOLVED** (pre-existing) — `toolClass: varchar('tool_class', { length: 50 })` exists in tools schema.

**HIGH SUMMARY: 15/15 resolved (all HIGH deviations closed).**

---

## MEDIUM DEVIATIONS (20) — STATUS UPDATE

### M-01: Session Cookie Name — **✅ RESOLVED** (Sprint P6-B) — `advanced.cookiePrefix: '__hsafx'` → `__hsafx.session_token`
### M-02: No Rolling Sessions — **✅ RESOLVED** (Sprint P6-B) — `session.updateAge: 3600` (1h)
### M-03: Facebook OAuth Added Without Planning — **OPEN**
### M-04: tRPC Router Structure Differs — **OPEN** (but ads router removed, rewards router added)
### M-05: Table Name — `plans` vs `subscription_plans` — **✅ RESOLVED** (Phase 7 #38) — DBML renamed `subscription_plans` → `plans`, all FK refs updated
### M-06: Table Name — `oauth_connections` vs `social_auths` — **✅ RESOLVED** (Phase 7 #38) — DBML renamed `social_auths` → `oauth_connections`, column `provider_id` → `provider_user_id`
### M-07: Table Name — `activity_logs` vs `audit_logs` — **✅ RESOLVED** (Phase 7 #38) — Both tables exist in code: `activity_logs` (auth.ts) + `audit_logs` (audit.ts). DBML has `audit_logs`.
### M-08: Table Name — `permissions` vs `permissions_catalog` — **✅ RESOLVED** (Phase 7 #38) — DBML renamed `permissions_catalog` → `permissions`, columns simplified to match code (`name`, `description`, `category`)
### M-09: Column — `plans.slug` vs `subscription_plans.code` — **✅ RESOLVED** (Phase 7 #38) — DBML column renamed `code` → `slug`
### M-10: Column — `plans.price_monthly/yearly` vs `subscription_plans.price_cents` — **✅ RESOLVED** (Phase 7 #38) — DBML replaced single `price_cents` with `price_monthly decimal(10,2)` + `price_yearly decimal(10,2)`, added `coin_grant`, `polar_product_id`
### M-11: Column — `plans.polar_product_id` vs `subscription_plans.stripe_price_id` — **✅ RESOLVED** (Phase 7 #38) — DBML replaced `stripe_price_id` with `polar_product_id` (Polar for subscriptions)
### M-12: Column — `coin_transactions.type` vs `coin_transactions.txn_type` — **✅ RESOLVED** (Phase 7 #38) — DBML renamed column `txn_type` → `type`, enum `coin_txn_type` → `coin_transaction_type`
### M-13: Column — `coin_transactions.resource_type/id` vs `reference_type/id` — **✅ RESOLVED** (Phase 7 #38) — DBML renamed `reference_type`/`reference_id` → `resource_type`/`resource_id`
### M-14: Column — `api_keys.rate_limit_tier` (text) vs `rate_limit_per_hour` (integer) — **✅ RESOLVED** (Phase 7 #38) — DBML replaced `rate_limit_per_hour int` with `rate_limit_tier text [default: 'standard']`
### M-15: Column — `admin_settings.key/value` vs `setting_key/setting_value` — **✅ RESOLVED** (Phase 7 #38) — DBML renamed `setting_key`→`key`, `setting_value`→`value` (jsonb), `setting_group`→`category`, added `updated_by`
### M-16: `api_rate_limits` Keyed Differently — **OPEN**
### M-17: Money Stored as `decimal(10,2)` Not `bigint` Cents — **✅ RESOLVED** (Phase 8 #43)
> Migrated all money columns to `bigint` cents: `plans.price_monthly_cents`/`price_yearly_cents`, `invoices.amount_cents`, `payments.amount_cents`. Coin columns upgraded from `integer` to `bigint`. DBML, seed data, admin UI, and API routes all updated.
### M-18: `async_jobs` Still Has `inngest_job_id` Column
> **✅ RESOLVED** (Sprint P1-05) — Column renamed from `inngest_job_id` to `external_job_id` (simple queue reference).

### M-19: `roles` Table Missing Columns — **OPEN**
### M-20: Missing Unique Constraints On Join Tables — **✅ RESOLVED** (Phase 3)
> 7 unique constraints: `planLimits(planId,limitKey)`, `planFeatures(planId,featureKey)`, `planCoinRules(planId,toolClass)`, `userPermissionOverrides(userId,permissionId)`, `userRoles`, `rolePermissions`, `favorites`.

**MEDIUM SUMMARY: 16/20 resolved (M-01, M-02, M-05–M-15, M-17, M-18, M-20). 4/20 open (M-03 Facebook OAuth, M-04 tRPC structure, M-16 rate limits keying, M-19 roles columns).**

---

## LOW DEVIATIONS (10) — STATUS UPDATE

### L-01: CSRF Only Checks Origin, No Referer Fallback — **✅ RESOLVED** (Sprint P6-B) — Origin → Referer fallback → reject chain in both web + admin middleware
### L-02: No `Retry-After` Header in Rate Limit Responses — **✅ RESOLVED** (Sprint P6-B) — 429 responses include `Retry-After` header with seconds-until-reset
### L-03: CASL Functions Named `buildUserAbility`/`buildAdminAbility` — **OPEN** (cosmetic only)
### L-04: Permission Check Uses Role Membership Not Granular Permission — **OPEN**
### L-05: `password_reset_tokens.used_at` (timestamp) vs Planning's `used` (boolean) — **✅ RESOLVED** (Phase 7 #38) — DBML updated `used boolean` → `used_at timestamp`
### L-06: `email_verification_tokens.used_at` (timestamp) vs Planning's `verified` (boolean) — **✅ RESOLVED** (Phase 7 #38) — DBML updated `verified boolean` → `used_at timestamp`
### L-07: `user_roles.assigned_at` vs Planning's `created_at` — **✅ RESOLVED** (Phase 7 #38) — DBML `expires_at` noted as "(planned)"; code uses `created_at` which maps naturally
### L-08: `role_permissions.granted_at` vs Planning's `created_at` + Missing `granted` Boolean — **✅ RESOLVED** (Phase 7 #38) — DBML updated: removed `granted`/`scope`/`scope_conditions`, renamed `created_at` → `granted_at`
### L-09: Impersonation Banner Says "Read-only session" — Planning Says Scoped Read+Execute
> **⚠️ PARTIALLY RESOLVED** — Scoped actions now enforced (P0-08), but banner text may still say "Read-only".

### L-10: `user_preferences`/`user_settings` Missing `created_at`/`updated_at` Columns — **OPEN**

**LOW SUMMARY: 6/10 fully resolved (L-01, L-02, L-05, L-06, L-07, L-08). 1/10 partially resolved (L-09).**

---

## DEVIATION COUNT SUMMARY

| Severity | Total | Resolved | Partial | Open |
|----------|-------|----------|---------|------|
| CRITICAL | 12 | 10 | 2 | 0 |
| HIGH | 15 | 15 | 0 | 0 |
| MEDIUM | 20 | 16 | 0 | 4 |
| LOW | 10 | 6 | 1 | 3 |
| **TOTAL** | **57** | **47** | **3** | **7** |

### Progress: 47 fully resolved + 3 partially = **82% fully resolved, 5% partial**
### Remaining: 7 open deviations (0 CRITICAL, 0 HIGH, 4 MEDIUM, 3 LOW)

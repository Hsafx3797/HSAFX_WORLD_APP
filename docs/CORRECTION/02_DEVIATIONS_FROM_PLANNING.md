# 02 — DEVIATIONS FROM PLANNING

> **Last audited:** 2025-07-15
> **Commit:** `2234bb7`
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

## CRITICAL DEVIATIONS (12)

### C-01: B2B REST Execute Route Bypasses Coin Deduction
- **Planning:** Every tool execution must go through coin deduction (doc 21, 22)
- **Actual:** `POST /api/v1/tools/:key/execute` calls `createJob()` directly, skipping `reserveCoins()`/`deductCoins()` entirely
- **Impact:** API key users can execute tools for free — revenue loss
- **File:** `apps/web/src/app/api/v1/tools/[toolKey]/execute/route.ts`

### C-02: Coin Reservation Never Confirmed After Async Jobs
- **Planning:** Reserve → Execute → Confirm lifecycle (doc 21 §4.1)
- **Actual:** `confirmReservation()` is imported but **never called** in any code path. After `job-worker.ts` completes a job, the reservation stays `pending` forever.
- **Impact:** Wallet balance becomes inconsistent over time
- **Files:** `apps/web/src/server/jobs/job-worker.ts`, `apps/web/src/server/tool-execution/index.ts`

### C-03: CASL Completely Unwired in Web App
- **Planning:** `defineUserAbility()` enforces plan-based tool access; backend re-verifies (doc 01 §6, doc 15 §5)
- **Actual:** `buildUserAbility()` exists in `packages/shared` but is **never imported** in `apps/web/`. No tRPC middleware, no API route, no React provider uses CASL. `@casl/react` is not installed.
- **Impact:** Any user can access any tool regardless of plan. No plan-based access control exists.
- **Files:** `packages/shared/src/permissions/ability.ts` (defined), `apps/web/` (never consumed)

### C-04: Zero PostgreSQL Enums in Schema
- **Planning:** 13 pgEnum types required (doc 13 DBML): `payment_status`, `invoice_status`, `billing_interval`, `coin_txn_type`, `audit_action`, `permission_target`, `admin_role_type`, `plan_change_type`, `plan_limit_type`, `reset_period`, `identifier_type`, `email_provider`, `permission_type`
- **Actual:** All enum-typed columns use free `text`. No `pgEnum()` calls in any schema file.
- **Impact:** No type safety at database level. Invalid values can be inserted.
- **Files:** `packages/db/src/schema/*.ts`

### C-05: Zero Explicit Database Indexes
- **Planning:** 25+ indexes specified in DBML (doc 13) including partial unique, composite, and performance
- **Actual:** Only inline `.unique()` constraints exist. No composite indexes, no partial indexes, no performance indexes.
- **Impact:** Query performance degrades with scale. Missing idempotency index on `coin_transactions` allows duplicate charges.
- **Files:** `packages/db/src/schema/*.ts`

### C-06: Session Rate Limiting Never Invoked
- **Planning:** 3-layer rate limiting: IP → Session/User → API Key (doc 15 §4)
- **Actual:** `checkUserRateLimit` is exported from `rate-limit.ts` but **never called** in middleware. Only IP and API key layers are active.
- **Impact:** Authenticated users have no per-session rate limits — can hammer endpoints
- **Files:** `apps/web/src/middleware.ts`, `apps/web/src/lib/rate-limit.ts`

### C-07: No Structured Logging in TypeScript
- **Planning:** Structured JSON logging with PII redaction is invariant #7 (doc 15 §1.1)
- **Actual:** **Every** TypeScript file uses `console.log`/`console.error`/`console.warn`. No pino, winston, or any structured logger. No `sanitizeForLogging()` utility.
- **Impact:** No queryable logs in production. Potential PII leakage.
- **Files:** `apps/admin/src/**`, `apps/web/src/**`, `packages/**`

### C-08: Stripe Refund Webhook Does Not Claw Back Coins
- **Planning:** On `charge.refunded`, reverse the coin grant (doc 21 §6.2)
- **Actual:** Handler marks the payment record as refunded but does NOT deduct coins from the user's wallet. User gets money back AND keeps coins.
- **Impact:** Financial loss on every refund
- **File:** `apps/web/src/app/api/webhooks/stripe/route.ts`

### C-09: 13 Planned Database Tables Missing
- **Planning:** 60+ tables across 6 schema areas (doc 13)
- **Actual:** 47 tables exist. 13 completely absent (see doc 01 §2).
- **Key missing:** `processed_webhooks` (webhook idempotency), `tool_class_policy` (billing core), `plan_permissions` (CASL), `usage_coin_fallbacks`, `billable_action_logs`

### C-10: BullMQ Not Installed — No Job Queue
- **Planning:** 4 BullMQ queues (default, priority, scheduled, dead-letter) with Redis-backed processing (doc 73 §AsyncJobSpec, doc 11)
- **Actual:** BullMQ is NOT in any `package.json`. `job-manager.ts` explicitly comments: "Phase 3 inline, Phase 4+ BullMQ."
- **Impact:** No priority, no retries, no dead-letter, no scheduled jobs. All async work is inline.
- **Files:** `apps/web/src/server/jobs/job-manager.ts`

### C-11: Non-Coin Webhook Events Have Zero Idempotency
- **Planning:** Dedicated `processed_webhooks` table checks `(provider, eventId)` before processing any webhook (doc 21 §6)
- **Actual:** Idempotency check uses `coinTransactions.metadata` JSONB — only works for events that create coin transactions. Events like `subscription.canceled` or `charge.dispute.created` have NO idempotency protection.
- **Impact:** Reprocessed webhooks create duplicate side effects
- **Files:** `apps/web/src/app/api/webhooks/stripe/route.ts`, `apps/web/src/app/api/webhooks/polar/route.ts`

### C-12: Admin 2FA Not Server-Enforced
- **Planning:** 2FA is mandatory for admin operations (doc 01 §8, doc 15 §2.3)
- **Actual:** Admin middleware has a comment: "We can't definitively check 2FA status here (would need a DB call), so we rely on session API + client cooperation." A crafted request can bypass 2FA.
- **File:** `apps/admin/src/middleware.ts` L100-103

---

## HIGH DEVIATIONS (15)

### H-01: No Search Infrastructure
- **Planning:** Meilisearch for fuzzy search + PostgreSQL tsvector for FTS (doc 11, 16)
- **Actual:** Client-side `String.includes()` on tool names. No Meilisearch, no tsvector, no fuzzy matching.
- **Files:** `apps/web/src/app/api/v1/tools/route.ts` (in-memory filter)

### H-02: 6/10 Planned UI Components Missing
- **Planning:** 10 domain components (doc 60–62): ToolCard, ToolGrid, ToolFilterBar, ExecutionPanel, ResultDisplay, UsageCard, BillingCard, TransactionList, ActivityFeed, NotificationBell
- **Actual:** ExecutionPanel, UsageCard, BillingCard, TransactionList, ActivityFeed, NotificationBell do not exist. 4 others are partial.

### H-03: 3/6 Zustand Stores Missing
- **Planning:** 6 stores (doc 72): tool, execution, billing, UI, notification, user
- **Actual:** `useBillingStore`, `useNotificationStore` missing. `useExecutionStore` merged into `useToolStore`.

### H-04: `@hsafx/ui` Package Is Theme-Only
- **Planning:** Shared reusable component library (doc 12, 60)
- **Actual:** Only exports `ThemeProvider` + theme utilities. All UI components live in `apps/web/src/components/` (app-local, not shared).
- **Impact:** Admin app cannot reuse web components without duplication

### H-05: Impersonation Missing Mandatory `reason` Field
- **Planning:** Every impersonation requires a documented `reason` for audit trail (doc 01 §8)
- **Actual:** POST body only validates `userId`. No `reason` parameter.
- **File:** `apps/admin/src/app/api/admin/impersonate/route.ts`

### H-06: Impersonation Missing Scoped-Action Enforcement
- **Planning:** Impersonated sessions block billing, account deletion, password change, and other sensitive operations (doc 01 §8)
- **Actual:** No middleware checks for impersonation context on any route. All actions allowed.
- **File:** No middleware exists for this

### H-07: Daily Bonus Race Condition
- **Planning:** Coin operations require `SELECT ... FOR UPDATE` locking (doc 21 §4)
- **Actual:** `claimDailyBonus` does NOT use `FOR UPDATE`. Concurrent requests can double-claim.
- **File:** `packages/api/src/routers/billing.ts`

### H-08: ~15 Node.js Tool Handlers Return Stubs
- **Planning:** All 454+ tools should execute (doc 00, 73)
- **Actual:** ~15 handlers in `executor.ts` return placeholder text like "requires X library" or "coming soon"
- **File:** `apps/web/src/lib/tools/executor.ts`

### H-09: FastAPI Job Processing Disabled
- **Planning:** FastAPI processes native Python jobs from queue (doc 11, 22)
- **Actual:** `process_job` function in `jobs.py` is **commented out** with a TODO. Job processing routes through Next.js instead.
- **File:** `backend/fastapi/src/api/v1/jobs.py`

### H-10: No Billing REST Endpoints for B2B
- **Planning:** REST API for balance, transactions, purchases (doc 14, 25)
- **Actual:** All billing is tRPC-only (session-based B2C). Missing: `GET /api/v1/billing/balance`, `GET /api/v1/billing/transactions`, `POST /api/v1/billing/purchase`, etc.

### H-11: API Key Scopes Not in Database Column
- **Planning:** `api_keys.scopes text[]` column for scope-based authorization (doc 13)
- **Actual:** Scopes stored in `metadata` JSONB. No dedicated column, no database-level enforcement.
- **File:** `packages/db/src/schema/tools.ts`

### H-12: No Admin Analytics Dashboard
- **Planning:** Admin dashboard with usage analytics, revenue metrics, user growth (doc 01 §9)
- **Actual:** No analytics routes or components in admin app

### H-13: No Admin Audit Log Viewer
- **Planning:** Admin can browse and search audit logs (doc 01 §9)
- **Actual:** Audit tables exist but no admin UI to view them

### H-14: No Redis Session Cache
- **Planning:** Sessions cached in Redis for performance (doc 15 §2.2)
- **Actual:** Better-Auth uses database-backed sessions only

### H-15: Missing `tools.tool_class` Column
- **Planning:** `tool_class` on tools table links to `tool_class_policy` for billing (doc 13, 21)
- **Actual:** Column doesn't exist. Tool class determined by `DEFAULT_BA_WEIGHTS` map in `coin-service.ts`
- **Impact:** Cannot manage BA weights per tool class from admin

---

## MEDIUM DEVIATIONS (20)

### M-01: Session Cookie Name
- **Planning:** `__hsafx_session` (doc 15 §2.2)
- **Actual:** `better-auth.session_token` (Better-Auth default)

### M-02: No Rolling Sessions
- **Planning:** Rolling sessions with `absoluteTimeout` (doc 15 §2.2)
- **Actual:** Not configured in auth config

### M-03: Facebook OAuth Added Without Planning
- **Actual:** `apps/web/src/lib/auth.ts` includes Facebook provider. Planning specifies Google + GitHub only.

### M-04: tRPC Router Structure Differs
- **Planning:** Separate `subscription`, `coins`, `usage` tRPC routers (doc 14)
- **Actual:** Single `billing` router combines all

### M-05: Table Name — `plans` vs `subscription_plans`
- **Actual** uses `plans`. Planning DBML says `subscription_plans`.

### M-06: Table Name — `oauth_connections` vs `social_auths`
### M-07: Table Name — `activity_logs` vs `audit_logs`
### M-08: Table Name — `permissions` vs `permissions_catalog`
### M-09: Column — `plans.slug` vs `subscription_plans.code`
### M-10: Column — `plans.price_monthly/yearly` vs `subscription_plans.price_cents`
### M-11: Column — `plans.polar_product_id` vs `subscription_plans.stripe_price_id`
### M-12: Column — `coin_transactions.type` vs `coin_transactions.txn_type`
### M-13: Column — `coin_transactions.resource_type/id` vs `reference_type/id`
### M-14: Column — `api_keys.rate_limit_tier` (text) vs `rate_limit_per_hour` (integer)
### M-15: Column — `admin_settings.key/value` vs `setting_key/setting_value`

### M-16: `api_rate_limits` Keyed Differently
- **Planning:** FK on `(tool_id, plan_id)` — per-tool per-plan limits
- **Actual:** FK on `api_key_id` — per-API-key limits

### M-17: Money Stored as `decimal(10,2)` Not `bigint` Cents
- Affects: `plans`, `invoices`, `payments`
- **Risk:** Floating point issues with decimal math

### M-18: `async_jobs` Still Has `inngest_job_id` Column
- Inngest was replaced. Column name is vestigial.

### M-19: `roles` Table Missing Columns
- Missing: `role_type`, `is_default`, `is_active`, `sort_order`, `deleted_at`, `updated_at`

### M-20: Missing Unique Constraints On Join Tables
- `user_roles(user_id, role_id)` — no unique constraint
- `role_permissions(role_id, permission_id)` — no unique constraint
- `user_permission_overrides(user_id, permission_id)` — no unique constraint
- `oauth_connections(provider, provider_user_id)` — no unique constraint
- `plan_features(plan_id, feature_key)` — no unique constraint
- `plan_limits(plan_id, limit_key)` — no unique constraint
- `plan_coin_rules(plan_id, tool_class)` — no unique constraint

---

## LOW DEVIATIONS (10)

### L-01: CSRF Only Checks Origin, No Referer Fallback
### L-02: No `Retry-After` Header in Rate Limit Responses
### L-03: CASL Functions Named `buildUserAbility`/`buildAdminAbility` Not `defineUserAbility`/`defineAdminAbility`
### L-04: Permission Check Uses Role Membership Not `admin:impersonate` Granular Permission
### L-05: `password_reset_tokens.used_at` (timestamp) vs Planning's `used` (boolean)
### L-06: `email_verification_tokens.used_at` (timestamp) vs Planning's `verified` (boolean)
### L-07: `user_roles.assigned_at` vs Planning's `created_at`
### L-08: `role_permissions.granted_at` vs Planning's `created_at` + Missing `granted` Boolean
### L-09: Impersonation Banner Says "Read-only session" — Planning Says Scoped Read+Execute
### L-10: `user_preferences`/`user_settings` Missing `created_at`/`updated_at` Columns

---

## DEVIATION COUNT SUMMARY

| Severity | Count |
|----------|-------|
| CRITICAL | 12 |
| HIGH | 15 |
| MEDIUM | 20 |
| LOW | 10 |
| **TOTAL** | **57** |

### Previous Assessment (old doc): 36 deviations (4 critical, 18 medium, 14 low)
### Current Assessment: 57 deviations (12 critical, 15 high, 20 medium, 10 low)

The increase reflects a **much deeper audit** — many issues existed before but were not identified.

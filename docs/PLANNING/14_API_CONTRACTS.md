# 14 — API Contracts

> Compacted. Aspirational code samples removed. Only invariants, actual surface, and rules kept.

---

## 1. API Surfaces (Verified)

| Surface          | Transport                           | Auth                                    | Status   |
| ---------------- | ----------------------------------- | --------------------------------------- | -------- |
| tRPC (user)      | HTTP/WS via `@trpc/client`          | Session cookie (Better-Auth)            | ✅ Built |
| tRPC (admin)     | HTTP via `@trpc/client`             | Session + RBAC                          | ✅ Built |
| REST B2B         | `GET/POST /api/v1/*`                | `Authorization: Bearer hsafx_live_sk_*` | ✅ Built |
| Webhooks inbound | `POST /api/webhooks/{polar,stripe}` | HMAC signature                          | ✅ Built |
| Internal         | `POST /api/internal/job-complete`   | `X-Internal-Secret` header              | ✅ Built |
| Cron             | `GET /api/cron/*`                   | Internal (Vercel cron)                  | ✅ Built |

---

## 2. Actual tRPC Router Structure (Verified)

```
appRouter = { user, billing, tools, admin, rewards, apiKeys }
```

**Doc vs Reality:**

- ❌ Doc claimed `auth, subscription, coins, usage` routers — **don't exist**
- ✅ `auth` is handled by Better-Auth catch-all (`/api/auth/[...all]`), not tRPC
- ✅ `subscription` + `coins` merged into `billing` router
- ✅ `usage` merged into `tools` router

**Actual procedures per router:**

- **user**: me, getMyPlan, getProfile, updateProfile, updatePreferences, updateSettings, deleteAccount, changePassword + admin: listUsers, getUserDetails
- **billing**: getPlans, getMySubscription, createCheckout, cancel, getBalance, getTransactions, getPacks, purchasePack + admin billing procedures
- **tools**: getCategories, getCategoryBySlug, list (with FTS via `to_tsvector`), get, execute, getJobStatus + admin tool CRUD
- **admin**: getDashboardStats, getRecentActivity, plan CRUD, feature flag CRUD, role/permission mgmt, category CRUD, plan limit CRUD + more
- **rewards**: getStats, getStreak, claim (daily/hourly login rewards)
- **apiKeys**: list, generate (limit 5 per user), revoke

---

## 3. Actual REST API Routes (Verified)

```
/api/v1/
├── engine/execute      POST    Engine-first execution (any engine + options)
├── engine/list         GET     Engine discovery (all 19 engines + schemas)
├── text/               GET     List text engines + presets
├── text/               POST    Execute text engine (case/wrap/comment/markup/filter/transform/encode/hash/counter/unicode)
├── data/               GET     List data engines + presets
├── data/               POST    Execute data engine (convert/format/schema/diff/api)
├── generate/           GET     List generate engine presets
├── generate/           POST    Execute generate engine
├── validate/           GET     List validate engine presets
├── validate/           POST    Execute validate engine
├── calculate/          GET     List calculate engine presets
├── calculate/          POST    Execute calculate engine
├── convert/            GET     List unit conversion presets
├── convert/            POST    Execute unit conversion engine
├── tools/              GET     List tools (legacy)
├── tools/:toolKey      GET     Get tool details (legacy)
├── tools/:toolKey/execute POST Execute tool by slug (legacy, always async → job)
├── tools/batch         POST    Batch execution
├── jobs/:jobId         GET     Job status
├── jobs/:jobId/result  GET     Job result
├── account/            GET     Account info
├── account/usage       GET     Usage statistics
├── account/webhooks    GET/POST/DELETE  Webhook management
├── billing/balance     GET     Coin balance
├── billing/transactions GET    Transaction history
├── billing/subscription GET    Subscription info
├── keys/rotate         POST    API key rotation
├── health/             GET     Health check
└── openapi.json        GET     OpenAPI spec
```

### Admin B2B Routes (apps/admin)

```
/api/admin/b2b/
├── plans/              GET/POST/PATCH   B2B plan CRUD
├── subscriptions/      GET/POST/PATCH   B2B subscription management (with user/plan joins)
├── suites/             GET/POST/PATCH   Suite CRUD (with category mappings)
├── quotas/             GET/POST/PATCH   Per-plan per-suite quota management (upsert)
├── usage/              GET              Read-only usage stats (with user/suite joins, date filters)
├── suite-categories/   GET/POST/DELETE  Category→suite mapping management
└── tool-overrides/     GET/POST/DELETE  Per-tool suite override management
```

**API layers:**

- **Category endpoints** (`/text`, `/data`, `/generate`, `/validate`, `/calculate`, `/convert`): Primary B2B surface. Each scopes engines by category. Supports preset, custom, and preset+override modes.
- **Engine endpoint** (`/engine/execute`): Generic — any engine name + any options, no category scoping.
- **Legacy slug endpoint** (`/tools/:key/execute`): Backward-compatible, maps slug → engine via preset lookup.

---

## 4. Invariants (MUST PRESERVE)

### 4.1 REST API Always Async

REST `/api/v1/tools/:key/execute` **always returns 202 + jobId**, regardless of tool speed.
tRPC `tools.execute` may return client/server/async depending on strategy.

### 4.2 API Key Security

- Keys are opaque secrets (`hsafx_live_sk_*` / `hsafx_test_sk_*`), NOT JWTs
- Only SHA-256 hash stored; raw key returned once at creation
- Max 5 active keys per user

### 4.3 Tool Execution Idempotency

- `idempotencyKey` required for async (FastAPI) executions
- Auto-generated for sync executions
- Duplicates within 24h return cached response, no re-charge
- Coin deduction atomic with job creation (single DB transaction)

### 4.4 Impersonation Constraints

- Max 1 hour, non-renewable
- Cannot modify billing, passwords, email, or 2FA
- `ctx.isImpersonating = true` set for all handlers
- Every action audit-logged with original admin ID

### 4.5 Subscription Status Derived

Status calculated at read-time from `trialEndsAt`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `canceledAt` — never stored as enum.

### 4.6 Webhook Idempotency

Both Polar and Stripe webhooks use `processedWebhooks` table for dedup (C-11 invariant).

---

## 5. Authentication Methods

| Method            | Used By         | Mechanism                                                   |
| ----------------- | --------------- | ----------------------------------------------------------- |
| Session cookie    | tRPC (web app)  | Better-Auth `getSession()` from headers                     |
| API key           | REST B2B        | `Authorization: Bearer hsafx_*_sk_*` → hash lookup          |
| Webhook signature | Polar           | HMAC-SHA256 via Svix (`webhook-id.timestamp.body`)          |
| Webhook signature | Stripe          | HMAC-SHA256 (`timestamp.body`, `stripe-signature` header)   |
| Internal secret   | FastAPI↔Next.js | `X-Internal-Secret` static header (v1; HMAC planned for v2) |

---

## 6. Naming Conventions

| Element               | Style        | Example                         |
| --------------------- | ------------ | ------------------------------- |
| tRPC procedures       | `camelCase`  | `user.getProfile`               |
| REST endpoints        | `kebab-case` | `/api/v1/tools/image-converter` |
| Query params          | `snake_case` | `?limit=20&sort_by=created_at`  |
| Request/response body | `camelCase`  | `{ "toolId": "..." }`           |

---

## 7. Pagination

- **Default**: Offset pagination (`limit`/`offset` + `meta.total`, `meta.hasMore`)
- **High-volume**: Cursor pagination for append-only ledgers (transactions, audit logs)
- All endpoints use `limit` (max 100, default 20)

---

## 8. Error Codes

| HTTP | Code                                                                                 | When               |
| ---- | ------------------------------------------------------------------------------------ | ------------------ |
| 400  | `BAD_REQUEST` / `VALIDATION_ERROR`                                                   | Invalid input      |
| 401  | `UNAUTHORIZED` / `SESSION_EXPIRED` / `INVALID_API_KEY`                               | Auth failure       |
| 403  | `FORBIDDEN` / `PLAN_LIMIT_EXCEEDED` / `INSUFFICIENT_COINS` / `FEATURE_NOT_AVAILABLE` | Access denied      |
| 404  | `NOT_FOUND`                                                                          | Resource missing   |
| 409  | `CONFLICT`                                                                           | Duplicate          |
| 429  | `RATE_LIMITED`                                                                       | Throttled          |
| 500  | `INTERNAL_ERROR`                                                                     | Server error       |
| 502  | `UPSTREAM_ERROR`                                                                     | Downstream failure |

Error response shape: `{ error: { code, message, details?, requestId } }`

---

## 9. Rate Limiting

| Context              | Limit    | Window | Scope   |
| -------------------- | -------- | ------ | ------- |
| tRPC unauthenticated | 20 req   | 1 min  | IP      |
| tRPC authenticated   | 100 req  | 1 min  | User    |
| REST API (default)   | 60 req   | 1 min  | API key |
| REST API (Pro)       | 300 req  | 1 min  | API key |
| REST API (Advance)   | 1000 req | 1 min  | API key |
| Webhook inbound      | 100 req  | 1 min  | IP      |

Effective limit = `min(key.rateLimit, planTier.maxRateLimit)`.
Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.
Implementation: `@upstash/ratelimit` sliding window with Redis.

---

## 10. Job Result Retention

| Resource           | TTL      | Storage          |
| ------------------ | -------- | ---------------- |
| Job metadata       | 72 hours | Redis            |
| Job result payload | 72 hours | Redis            |
| Output files       | 24 hours | R2 (signed URLs) |
| Job audit log      | 30 days  | Postgres         |

---

## 11. Webhook Contracts

### Inbound (✅ Built)

- **Polar** (`/api/webhooks/polar`): Svix HMAC-SHA256 verification, handles `subscription.created/updated/canceled`, `checkout.created`
- **Stripe** (`/api/webhooks/stripe`): Stripe HMAC-SHA256 verification, handles `checkout.session.completed`, `payment_intent.succeeded/failed`, `invoice.paid/payment_failed`
- Both use `processedWebhooks` table for idempotency

### Outbound (✅ Built)

- Job completion webhooks dispatched via `dispatchJobWebhooks()` in `/api/internal/job-complete`
- Retry policy: 10 attempts, exponential backoff (2^n seconds, cap 1 hour), DLQ after 10 failures (30-day retention)

---

## 12. Cron Jobs (Verified)

| Route                             | Purpose                        |
| --------------------------------- | ------------------------------ |
| `/api/cron/anonymous-cleanup`     | Clean expired anonymous usage  |
| `/api/cron/cleanup-deleted-users` | Hard-delete soft-deleted users |
| `/api/cron/stale-job-cleanup`     | Clean stale async jobs         |
| `/api/cron/streak-warnings`       | Send streak expiry warnings    |
| `/api/cron/subscription-sync`     | Sync with payment providers    |
| `/api/cron/wallet-reconciliation` | Reconcile coin wallets         |

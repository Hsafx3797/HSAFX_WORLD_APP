# 22 — Backend Ownership Matrix

> Compacted. Code samples removed. Only rules, matrices, and flow descriptions kept.
> ⚠️ **Note (April 2026)**: Originally wrote "2 services" but now 3: Next.js + FastAPI + Rust HTTP service.
> Rust service handles 9 text/data engines (case, wrap, filter, transform, encode, hash, counter, unicode, generate-data).
> FastAPI handles 10 media engines (image, video, audio, pdf, document, archive, file, font, tracking, cheque).
> The core principle (state → Next.js, compute → Rust/FastAPI) still holds.

---

## 1. Core Principle

> **State belongs to Next.js. Compute belongs to FastAPI.**

**Non-negotiable invariant:** All PostgreSQL reads+writes owned exclusively by Next.js. FastAPI is a stateless compute service and MUST NEVER write to the database.

Applies equally to B2C (Web UI) and B2B (Public Tools API).

---

## 2. Service Ownership Matrix

| Domain            | Owns Endpoints | DB Write | Tables                                                   |
| ----------------- | -------------- | -------- | -------------------------------------------------------- |
| Authentication    | Next.js        | ✅       | users, sessions, oauth_accounts                          |
| User Management   | Next.js        | ✅       | users, user_profiles                                     |
| Permissions       | Next.js        | ✅       | permissions, role_permissions, user_permission_overrides |
| Subscriptions     | Next.js        | ✅       | subscriptions, subscription_plans, plan_limits           |
| Billing & Coins   | Next.js        | ✅       | payments, invoices, coin_transactions, user_coin_wallets |
| Tools Metadata    | Next.js        | ✅       | tools, tool_coin_costs, tool_class_policy                |
| Usage Tracking    | Next.js        | ✅       | usage_counters, billable_action_logs                     |
| Tool Execution    | FastAPI        | ❌       | None                                                     |
| Job Orchestration | FastAPI        | ❌       | None                                                     |
| File Storage      | FastAPI        | ❌       | None (blob only)                                         |
| Rate Limiting     | Both           | N/A      | Redis / Upstash                                          |

---

## 3. FastAPI Hard Rules

**MUST NOT:** Have DATABASE_URL, include ORM/SQL clients, validate user JWTs, deduct coins, write usage/billing logs, own long-lived state.

**MAY:** Execute tools, perform CPU/GPU workloads, upload outputs to blob, return execution metrics, use Redis for rate limiting, call internal Next.js APIs for metadata.

---

## 4. Execution Flow

```
Client → Next.js (auth, rate limit, coin check, create job)
       → FastAPI (execute tool, upload output to R2, return metrics)
       → Next.js (deduct coins, log usage, finalize job, return result)
```

All state transitions happen in Next.js.

---

## 5. Job Status Storage

| Storage    | Owner   | Purpose                  | TTL       | Authority          |
| ---------- | ------- | ------------------------ | --------- | ------------------ |
| PostgreSQL | Next.js | Permanent job record     | Permanent | Billing truth      |
| Redis      | FastAPI | Real-time status updates | 72h       | Ephemeral progress |
| R2         | FastAPI | Temporary output files   | 24h       | User download      |

**Rules:** FastAPI writes to Redis (`job:{jobId}` status only), Next.js reads Redis and finalizes to PostgreSQL.

---

## 6. API Key System

**Format:** `hsafx_live_<random_52_chars>` (64 chars total)
**Storage:** SHA256 hash in DB, prefix for display (`hsafx_live_a3f...`)
**Limit:** Max 5 per user

### Scopes

| Scope           | Permissions                         |
| --------------- | ----------------------------------- |
| `tools:read`    | List tools, read metadata           |
| `tools:execute` | Execute tools, consume coins        |
| `billing:read`  | View usage, balance, subscription   |
| `billing:write` | Purchase coins, change subscription |
| `admin:*`       | Full access (super admin only)      |

Default: `['tools:execute', 'billing:read']`

**Implementation:** ✅ Built — `apiKeys` tRPC router (list, generate, revoke)

### Rate Limit Tiers

| Tier       | Req/hour | Req/day | Concurrent | Plan     |
| ---------- | -------- | ------- | ---------- | -------- |
| Basic      | 100      | 1,000   | 2          | Free     |
| Pro        | 1,000    | 10,000  | 10         | Pro      |
| Business   | 5,000    | 50,000  | 50         | Advance  |
| Enterprise | Custom   | Custom  | Custom     | Contract |

---

## 7. File Upload Flow

```
User → Uploadthing (virus scan via ClamAV)
  → If infected: delete, notify user, log
  → If clean: Next.js creates job in PostgreSQL
    → FastAPI downloads from Uploadthing
    → Processes file (temp /tmp)
    → Uploads output to R2 (24h auto-delete lifecycle)
    → Updates Redis with result_url
    → Deletes Uploadthing source file
  → Next.js detects completion (Redis poll)
    → Generates signed R2 URL (1h expiry)
    → Finalizes job, deducts coins
    → Returns signed URL to user
```

**Rules:** Never process without virus scan, never store permanently, all uploads go through Uploadthing first.

---

## 8. Redis Usage Matrix

**Provider:** Upstash Redis (single instance)

| Use Case        | Writer  | Reader            | TTL             | Key Pattern       |
| --------------- | ------- | ----------------- | --------------- | ----------------- |
| Rate limiting   | Next.js | Next.js + FastAPI | 1 min           | `ratelimit:{id}`  |
| Session storage | Next.js | Next.js           | 7 days          | `session:{token}` |
| Job status      | FastAPI | Next.js + FastAPI | 72h             | `job:{jobId}`     |
| Job queue       | Next.js | FastAPI           | Until processed | `queue:jobs`      |
| Theme cache     | Next.js | Next.js           | 7 days          | `theme:{userId}`  |
| API key cache   | Next.js | Next.js           | 1h              | `apikey:{hash}`   |

---

## 9. Internal APIs (Service-to-Service)

FastAPI accesses metadata only via internal Next.js endpoints:

- Route: `/api/internal/tools/[id]`
- Auth: service key (shared secret)
- Rate limited and logged
- Not public

---

## 10. Security Model

- Single JWT issuer (Next.js via better-auth)
- Single billing authority (Next.js)
- Single audit trail
- No cross-service money writes
- HTTPS everywhere, rotate service keys, rate-limit internal APIs

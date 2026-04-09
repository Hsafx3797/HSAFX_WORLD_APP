# 25 — API Authentication Guide (B2B) (Compacted)

> Customer-facing guide for B2B API key authentication.

---

## Overview

API keys enable programmatic access to all tools without user login. Server-to-server only.

| Aspect      | Session Auth (B2C)     | API Keys (B2B)              |
| ----------- | ---------------------- | --------------------------- |
| Use Case    | Web users              | Programmatic access         |
| Auth        | Login + session cookie | API key in header           |
| Lifetime    | 7 days (auto-refresh)  | Until revoked               |
| Storage     | Redis (ephemeral)      | PostgreSQL (SHA-256 hashed) |
| Rate Limits | User plan              | API key tier                |

**✅ Built** — `packages/api/src/routers/apiKeys.ts`, key creation/revocation/scope validation.

---

## API Key Format

```
hsafx_{env}_{52_random_chars}
  - live_ = production
  - test_ = sandbox
```

SHA-256 hashed in database. Shown only once at creation.

## Authentication Headers

**Primary:** `Authorization: Bearer hsafx_live_YOUR_KEY`
**Alternative:** `X-HSAFX-API-Key: hsafx_live_YOUR_KEY`

---

## Scopes

| Scope           | Description                                    |
| --------------- | ---------------------------------------------- |
| `tools:read`    | List engines, view schemas (GET /api/v1/engines, /engine/{name}/schema) |
| `tools:execute` | Execute engines (POST /api/v1/engine/{name})   |
| `billing:read`  | View balance/transactions                      |
| `billing:write` | Purchase coins                                 |
| `admin:*`       | Full admin access (admin accounts only)        |

**Typical B2B combo:** `tools:read` + `tools:execute` + `billing:read`

---

## Rate Limits

| Tier       | Plan                   | Req/Hour | Req/Day | Burst   |
| ---------- | ---------------------- | -------- | ------- | ------- |
| Basic      | B2B Basic ($10/mo)     | 100      | 2,000   | 10/min  |
| Enterprise | B2B Enterprise ($20/mo)| 5,000    | 100,000 | 200/min |
| Custom     | Custom                 | Custom   | Custom  | Custom  |

Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
429 response includes `Retry-After` header.

---

## Common Errors

| Code | HTTP | Description         |
| ---- | ---- | ------------------- |
| A001 | 401  | Missing API key     |
| A002 | 401  | Invalid API key     |
| A003 | 401  | API key revoked     |
| A004 | 403  | Account suspended   |
| A005 | 403  | Insufficient scopes |
| R004 | 429  | Rate limit exceeded |

---

## Security Best Practices

- Store keys in environment variables, never in client-side code
- Separate keys for dev/staging/production
- Rotate every 90 days
- Use minimal scopes (least privilege)
- Revoke immediately if compromised

## Key Facts

- Unlimited keys per account
- B2B API executions consume **suite ops quotas** (NOT coins — B2B and B2C billing are separate systems)
- If no active B2B subscription, falls back to B2C coin billing
- Keys are account-bound, non-transferable
- Revocation is instant (immediate 401)
- IP restriction: ❌ Not yet implemented (planned)
- OAuth: ❌ Not implemented — API keys only (simpler for B2B)

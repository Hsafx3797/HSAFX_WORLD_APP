# 15 — Security Model

> Compacted. Code samples reduced to essential patterns. Aspirational code removed.

---

## 1. Security Invariants

| #   | Invariant                  | Notes                                                       |
| --- | -------------------------- | ----------------------------------------------------------- |
| 1   | Never trust client         | All validation server-side; CASL is UI-only                 |
| 2   | Defense in depth           | Edge → rate limit → auth → authz → validation → data access |
| 3   | Least privilege            | Minimum permissions by default                              |
| 4   | Fail secure                | Deny on error; never fail open                              |
| 5   | Audit everything sensitive | Admin actions, auth events, billing ops → `activityLogs`    |
| 6   | Secrets never in code      | Env vars only; rotatable                                    |
| 7   | Zero PII in logs           | Structured logging with PII redaction                       |
| 8   | Session integrity          | Server-side sessions; tokens are opaque references          |

---

## 2. Security Layers (All ✅ Built)

1. **Edge** (Vercel/Cloudflare): DDoS, WAF, TLS 1.3
2. **Rate Limiting** (`@upstash/ratelimit`): IP/user/key-based sliding window
3. **Authentication** (`better-auth`): Session cookies, API key hash lookup, OAuth
4. **Authorization**: Plan-based feature gates + Admin RBAC (`roles`/`permissions` tables)
5. **Input Validation** (Zod): Schema validation on all tRPC inputs + REST bodies
6. **Data Access** (Drizzle): Parameterized queries, row-level user_id filtering, soft-delete

---

## 3. Authentication (✅ Built)

| Method                         | Provider      | Token Type                        |
| ------------------------------ | ------------- | --------------------------------- |
| Email + Password               | Better-Auth   | Session cookie                    |
| OAuth (Google/GitHub/Facebook) | Better-Auth   | Session cookie                    |
| API Key                        | Custom        | Opaque bearer (`hsafx_live_sk_*`) |
| Inter-service                  | Static secret | `X-Internal-Secret` header        |

**Session config:** `better-auth` with cookie (`__hsafx_session`, httpOnly, secure, sameSite=lax, 7-day rolling, 30-day absolute max)

**Key rule:** IP and User-Agent are **advisory signals only** — never used for hard session invalidation (mobile users change IPs frequently).

**Password:** Min 12 chars, 1 uppercase + 1 lowercase + 1 number, Argon2id hashing, 5 attempts per 15 min per IP.

---

## 4. Authorization

### Two Systems

| System         | Scope                | Storage                                                          |
| -------------- | -------------------- | ---------------------------------------------------------------- |
| **Plan-Based** | User features/limits | Derived from `subscriptions` + `planLimits` table                |
| **Admin RBAC** | Admin panel          | `roles` + `permissions` + `userRoles` + `rolePermissions` tables |

**Invariant:** CASL on frontend is for **UI hints only**. Backend MUST re-verify.

**Admin role hierarchy:** super_admin(100) > admin(80) > billing_admin(60) > support_lead(50) > support_agent(40) > content_manager(30) > viewer(10). Lower roles can't modify higher.

**Resource ownership:** Every query for user-owned data MUST include `eq(table.userId, currentUserId)`.

---

## 5. Rate Limiting (✅ Built with @upstash/ratelimit)

| Tier           | Scope     | Limit        | Window |
| -------------- | --------- | ------------ | ------ |
| Anonymous      | IP        | 100 req      | 1 min  |
| Free           | User      | 300 req      | 1 min  |
| Pro            | User      | 1,000 req    | 1 min  |
| Advance        | User      | 5,000 req    | 1 min  |
| API Key        | Per-key   | Configurable | 1 min  |
| Auth endpoints | IP        | 10 req       | 15 min |
| Webhooks       | Source IP | 1,000 req    | 1 min  |

Implementation: Sliding window via `@upstash/ratelimit` + Upstash Redis.

---

## 6. Security Headers (✅ Built in next.config.js)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CSP with `unsafe-eval` (required by Next.js dev tooling — review for prod hardening)

---

## 7. Input Validation Rules

- **All inputs**: Zod schemas (tRPC inputs, REST body/query/params)
- **SQL injection**: Prevented by Drizzle parameterized queries; use `sql` template tag for raw SQL
- **File uploads**: Magic byte detection (don't trust Content-Type), extension allowlist, 50MB max, virus scan mandatory if retention > 24h or file is shareable

---

## 8. Data Protection

| Classification | Examples                   | Protection                          |
| -------------- | -------------------------- | ----------------------------------- |
| Public         | Tool names, categories     | None                                |
| Internal       | Usage stats, tool configs  | Access control                      |
| Confidential   | User emails, file metadata | Encryption at rest (Neon automatic) |
| Restricted     | Passwords, payment tokens  | Hashed/tokenized + audit logged     |

**Encryption:** All at-rest via provider (Neon AES-256, Upstash, R2 AES-256). All in-transit TLS 1.3.

**OAuth tokens:** Stored plaintext, protected by Neon encryption at rest. Rationale: tokens are short-lived, revocable by provider, and app-level encryption would require key management of equal vulnerability surface.

**Data retention:** User accounts (soft delete + 30-day purge), processed files (24h R2 lifecycle), audit logs (2 years), sessions (30 days Redis TTL), payment records (7 years legal).

---

## 9. Secrets Management

| Secret                                        | Storage        | Rotation  |
| --------------------------------------------- | -------------- | --------- |
| `BETTER_AUTH_SECRET`                          | Vercel env var | 90 days   |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Vercel env var | Quarterly |
| `POLAR_ACCESS_TOKEN` / `POLAR_WEBHOOK_SECRET` | Vercel env var | Quarterly |
| `DATABASE_URL` / `REDIS_URL`                  | Vercel env var | On breach |
| `INTERNAL_SERVICE_SECRET`                     | Vercel env var | On breach |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`   | Vercel env var | On breach |

**Note:** No `JWT_SECRET` — Better-Auth uses `BETTER_AUTH_SECRET` for session signing.

**Rotation procedure:** Zero-downtime dual-key validation (old + new accepted simultaneously, monitor 24h, then remove old).

---

## 10. Impersonation Security

Built in admin router. Rules:

- Requires `admin:impersonate` permission
- Max 1 hour, auto-expires
- Cannot impersonate other admins
- Blocked actions: billing, password, email, 2FA, API keys, delete account
- Allowed: read profile/files/usage/history, execute tools
- Full audit trail with `originalAdminId` + reason
- UI banner visible to impersonating admin

---

## 11. Abuse Prevention

| Vector              | Mitigation                                     |
| ------------------- | ---------------------------------------------- |
| Credential stuffing | Rate limit + CAPTCHA after 3 fails             |
| Account enumeration | Same response for valid/invalid email          |
| Free tier abuse     | Device fingerprinting + email domain checks    |
| API abuse           | Per-key rate limits + anomaly detection        |
| File upload abuse   | Type validation + size limits + virus scanning |
| Refund fraud        | FIFO attribution (billing doc)                 |

Anomaly signals: multiple failed logins, impossible travel, usage spike (>10x average), rapid coin spending (>500 in 5 min).

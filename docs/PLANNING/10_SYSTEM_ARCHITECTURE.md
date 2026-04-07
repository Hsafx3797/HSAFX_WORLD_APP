# 10 — System Architecture

> Compacted. Original ~1560 lines → key decisions, verified against codebase.

---

## High-Level Architecture

```
Clients (Browser/API) → Edge/CDN (Cloudflare/Vercel)
  → Next.js Backend (Primary: auth, billing, orchestration, tRPC)
  → FastAPI (Secondary: media processing, binary tools, scraping)
  → Data Layer (Neon PG, Upstash Redis, Cloudflare R2, Meilisearch)
```

**Principles:** Edge-first, shared monorepo backend, polyglot (TS + Python + Rust→WASM), stateless services, event-driven async.

## Tech Stack (Verified ✅)

| Layer    | Tech                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------- |
| Frontend | Next.js 15, React 19, Tailwind v4                                                                  |
| API      | tRPC + Zod                                                                                         |
| Backend  | FastAPI (Python)                                                                                   |
| WASM     | Rust → wasm-pack (text/calc tools)                                                                 |
| Native   | FFmpeg, libvips, Poppler, Tesseract                                                                |
| DB       | Neon PostgreSQL (Drizzle ORM)                                                                      |
| Cache    | Upstash Redis                                                                                      |
| Storage  | Cloudflare R2                                                                                      |
| Search   | Meilisearch                                                                                        |
| Jobs     | ❌ Inngest planned but NOT integrated (0 TS references; `inngestJobId` renamed to `externalJobId`) |
| Auth     | Better-Auth                                                                                        |
| Billing  | Polar + Stripe                                                                                     |

## Service Topology

### Next.js Backend Responsibilities

- Auth & session management, RBAC, billing, coin ledger, usage tracking
- API key management, webhook handling (Polar, Stripe)
- Tool orchestration (dispatch to WASM/FastAPI), audit logging, admin endpoints

### FastAPI Responsibilities

- Media processing (video/audio/image), document conversion, OCR
- Native binary orchestration (FFmpeg, libvips, Poppler)
- Async scraping (container tracking)
- **Does NOT:** touch PostgreSQL, handle auth, face clients directly
- **Job status:** writes to Redis only → Next.js notified via callback webhook

### WASM (Client-Side)

- Text transformations, pure calculations, validation, real-time previews
- No network/filesystem/sensitive ops

## Actual Router/File Structure (Verified)

### tRPC Routers (`packages/api/src/routers/`)

Actual: `admin.ts`, `api-keys.ts`, `billing.ts`, `index.ts`, `rewards.ts`, `tools.ts`, `user.ts`
(Doc claimed auth.ts, coins.ts — those don't exist)

### FastAPI Structure (`backend/fastapi/src/`)

Actual: `api/v1/{jobs.py, tools.py, tracking.py}`, `api/internal.py`, `core/`, `middleware/`, `schemas/`, `scrapers/`, `services/`, `tools/`
(Doc claimed routers/media.py, documents.py, ocr.py — different layout)

## Inter-Service Communication

| From → To              | Protocol        | Auth                   |
| ---------------------- | --------------- | ---------------------- |
| Client → Next.js       | tRPC (HTTP)     | Session cookie         |
| Admin → Next.js        | tRPC (HTTP)     | Session cookie         |
| API Users → Next.js    | REST (HTTP)     | API key                |
| Next.js → FastAPI      | HTTP (internal) | Shared secret          |
| Polar/Stripe → Next.js | Webhook (HTTP)  | Signature verification |
| FastAPI → R2           | S3 API          | Access keys            |

**FastAPI URL:** `process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'` (in executor.ts)

## State Management (Frontend)

| Type         | Solution                |
| ------------ | ----------------------- |
| Server state | TanStack Query via tRPC |
| Client state | Zustand                 |
| Form state   | React Hook Form + Zod   |
| URL state    | Next.js searchParams    |
| Auth state   | Better-Auth hooks       |
| Permissions  | CASL                    |

## Tool Execution Flow (Client-Side)

```
User Input → Check Tool Type
  → WASM Tool → execute locally → return result
  → Server Tool → Check plan/limit
    → Allowed → Execute on Server/FastAPI → return result + update usage
    → Limit Reached → Coin Prompt → Pay or Cancel
```

## Webhook Processing Flow

```
Provider → Verify signature → Parse event → Idempotency check (provider event ID) → Process → Update DB → Record webhook log → ACK 200
```

**Idempotency key:** Stripe `event.id`, Polar `id` → stored in `webhook_logs.provider_event_id`

## Caching Architecture

```
Client (React Query) → CDN/Edge (static + metadata) → Redis (sessions, rate limits, usage, permissions) → Database (source of truth)
```

### Cache Invalidation

| Cache          | Trigger                | Strategy        |
| -------------- | ---------------------- | --------------- |
| Session        | Logout/password change | Explicit delete |
| Rate limits    | Window expires         | TTL             |
| Usage counters | Daily/monthly reset    | Scheduled job   |
| Plan features  | Config update          | Pub/sub         |
| Permissions    | Role change            | Explicit delete |

### Redis Key Convention

`{namespace}:{entity}:{id}:{subkey}` — e.g., `session:{id}`, `ratelimit:{ip}:{endpoint}`, `usage:{userId}:{resource}:daily:{date}`, `cache:plan:{id}:features`, `lock:coins:{userId}`

## Invariants

1. **Coin Lock Order:** Acquire Redis lock → Begin DB tx → Insert immutable ledger entry → Commit → Release lock (prevents double-spend)
2. **Lock TTL:** 10s (prevents deadlock on crash), unique token per acquisition, Lua script for atomic check-and-delete release
3. **Webhook Idempotency:** Provider event ID checked before processing
4. **Analytics Separation:** Plausible/Umami are passive observers only — never participate in rate limiting, billing, or access control
5. **Backend Authority:** Edge limits are best-effort; backend limits are authoritative for billing/coins

## Security Layers

1. **Edge:** DDoS (Cloudflare/Vercel), WAF, TLS
2. **Rate Limiting:** IP-based + user-based + endpoint-specific
3. **Authentication:** Better-Auth sessions, API keys, OAuth
4. **Authorization:** Plan-based access + RBAC (CASL)
5. **Input Validation:** Zod schemas, file type verification, size limits
6. **Data Protection:** Encryption at rest/transit, PII policies, audit logs

**Security headers:** ✅ Built in both web and admin next.config.js (X-Content-Type-Options, X-Frame-Options: DENY, etc.)

## Deployment

- **Production:** Vercel (Next.js web + admin), Fly.io/Railway (FastAPI), Neon (DB), Upstash (Redis), R2 (storage), Meilisearch Cloud
- **Staging:** Vercel Preview per PR, shared FastAPI staging, Neon branch DB
- **Dev:** Local Next.js + FastAPI + Docker PG/Redis
- **Target region (MVP):** Asia Pacific (Singapore/Mumbai) — primary audience Pakistan + South Asia

## Scalability Path

- **Phase 1 (MVP):** Single region, single instances
- **Phase 2 (Growth):** Vercel Edge Functions, multi FastAPI (Fly auto-scale), Neon read replica, dedicated Redis
- **Phase 3 (Scale):** Multi-region, DB sharding, CDN for processed files
- **Expansion triggers:** 10k users → review traffic; >20% non-Asia → add US; >10% EU → add EU; revenue >$5k/mo → multi-region justified

## External Services

| Service     | SDK                        |
| ----------- | -------------------------- |
| Polar       | `@polar-sh/sdk`            |
| Stripe      | `stripe`                   |
| Neon        | `@neondatabase/serverless` |
| Upstash     | `@upstash/redis`           |
| R2          | `@aws-sdk/client-s3`       |
| Meilisearch | `meilisearch`              |
| Better-Auth | `better-auth`              |

## Monitoring (Planned, NOT built)

- Logs: Vercel Logs / Axiom
- Errors: Sentry
- Uptime: Better Uptime
- Analytics: Plausible + Umami
- Alert rules: >1% errors=critical, p95>2s=warning, webhook failures>3/hr=critical

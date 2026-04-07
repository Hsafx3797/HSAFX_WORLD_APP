# 49 — Deployment Guide

> Reference for deployment architecture, env vars, and service config. AI generates configs; user deploys manually.

---

## Deployment Services

| Service           | Provider        | Config File                       | Status                                    |
| ----------------- | --------------- | --------------------------------- | ----------------------------------------- |
| Frontend (web)    | Vercel          | `apps/web/vercel.json`            | ✅ Config exists                          |
| Frontend (admin)  | Vercel          | `apps/admin/vercel.json`          | ✅ Config exists                          |
| Backend (FastAPI) | GHCR + Railway  | `infra/docker/Dockerfile.fastapi` | ✅ Config exists                          |
| Database          | Neon PostgreSQL | — (Web UI)                        | Setup reference below                     |
| Redis             | Upstash         | — (Web UI)                        | Setup reference below                     |
| Storage           | Cloudflare R2   | — (Web UI)                        | ✅ `packages/shared/src/storage.ts` built |
| Payments          | Stripe          | — (Dashboard)                     | ✅ Webhook handler built                  |

## CI/CD Workflows (all ✅ built in `.github/workflows/`)

- `deploy-web.yml` — Vercel deploy on push to `apps/web/**` or `packages/**`
- `deploy-admin.yml` — Vercel deploy on push to `apps/admin/**` or `packages/**`
- `deploy-fastapi.yml` — Docker build → GHCR push on push to `backend/fastapi/**`

## Dockerfiles (all ✅ in `infra/docker/`)

- `Dockerfile.web` — Node 20 Alpine, pnpm monorepo multi-stage build
- `Dockerfile.admin` — Same pattern as web
- `Dockerfile.fastapi` — Python 3.12, includes ffmpeg/libvips/poppler/tesseract

## Environment Variables

Reference: `infra/docker/.env.prod.example` ✅ exists

**Key groups:**

- **Database**: `DATABASE_URL` (Neon PostgreSQL connection string with `?sslmode=require`)
- **Auth**: `BETTER_AUTH_SECRET` (64-char hex), OAuth client IDs/secrets (Google, GitHub, Facebook)
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **R2 Storage**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- **Redis**: `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`
- **FastAPI**: `SECRET_KEY`, `INTERNAL_SECRET`, `ALLOWED_ORIGINS`
- **Internal**: `CRON_SECRET`, `NODE_ENV`

## External Service Setup (manual steps)

### Neon PostgreSQL

- Create project in same region as Vercel (US East)
- Run migrations: `pnpm db:push` (Drizzle ORM)

### Upstash Redis

- Create database in US-East-1, enable TLS
- Policy: `allkeys-lru`

### Cloudflare R2

- Create bucket `hsafx-world`
- Lifecycle rule: auto-delete after 24 hours (matches Redis TTL)
- Generate R/W API token scoped to bucket

### Stripe Products

- **B2C**: Pro ($10/mo or $96/yr), Advance ($20/mo or $180/yr)
- **B2B**: Basic ($10/mo), Enterprise ($20/mo)
- **Coins**: 50/$2, 150/$5 (requires paid sub)
- Webhook endpoint: `https://domain.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

### DNS (Cloudflare)

- `@` → A record to Vercel (76.76.21.21)
- `www` → CNAME to `cname.vercel-dns.com`
- `api` → CNAME to backend host
- SSL: auto (Let's Encrypt) on both Vercel and backend

## Post-Deployment Checklist

1. Verify endpoints: `curl https://domain.com`, `curl https://api.domain.com/health`
2. Test auth flows: email signup, OAuth (Google/GitHub), login, logout
3. Test tool execution: WASM text tool, Node.js formatter, FastAPI media tool
4. Test billing: subscribe to Pro (test mode), verify webhook, purchase coins
5. Test rate limiting: rapid API requests → expect 429 on limit
6. Enable monitoring: Vercel Analytics, Neon Dashboard, Upstash Metrics
7. Verify backups: Neon daily backups (7-day retention free tier)

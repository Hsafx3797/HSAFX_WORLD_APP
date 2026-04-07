# 45 — Integration Contracts

> Third-party service integration contracts and configuration requirements.

## Philosophy

- AI builds generic integration code for test mode
- Human provides production secrets via env vars
- All integrations work in dev mode without external deps

## Service Status

| Service        | Purpose                   | Status                 | Package                                     |
| -------------- | ------------------------- | ---------------------- | ------------------------------------------- |
| Stripe         | Payments, subscriptions   | ✅ Built               | `packages/api`, `apps/web` (stripe ^20.3.1) |
| Cloudflare R2  | Temporary file storage    | ✅ Built               | `packages/shared/src/storage.ts` (S3Client) |
| Upstash Redis  | Caching, rate limiting    | ✅ Built               | `@upstash/ratelimit`, `@upstash/redis`      |
| Uploadthing    | File uploads, virus scan  | ❌ Not installed       | Planning only                               |
| BullMQ         | Job queue for async tools | ❌ Not installed       | Planning only                               |
| Email Service  | Transactional emails      | ⬜ Deferred (post-MVP) | —                                           |
| Analytics      | Usage tracking            | ⬜ Deferred (post-MVP) | —                                           |
| Error Tracking | Sentry/Rollbar            | ⬜ Deferred (post-MVP) | —                                           |

## Stripe Integration (Built)

- Webhook handler: `apps/web/src/app/api/webhooks/stripe/`
- Events: `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`, `invoice.payment_{succeeded,failed}`, `charge.{succeeded,failed}`
- Idempotency: stripe_events table tracks processed events
- Plans: Free/$0, Pro/$10/mo, Advance/$20/mo + B2B Basic/$10/mo, Enterprise/$20/mo
- Coin packs: 5 packages (Starter/$1.99 through Enterprise/$199.99)
- Local testing: Stripe CLI `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## R2 Storage (Built)

- Client: `packages/shared/src/storage.ts` — S3Client wrapper
- Bucket: `hsafx-world`
- File key pattern: `{userId}/{toolId}/{jobId}/{filename}`
- Lifecycle: Auto-delete after 24h via R2 lifecycle rule
- Presigned URLs for downloads (24h expiry)

## Rate Limiting (Built)

- Per-user: `@upstash/ratelimit` sliding window
- Per-IP: Anonymous users get stricter limits
- Prefix schema: `ratelimit:api:user:`, `ratelimit:api:ip:`, `ratelimit:tool:{toolId}:`

## File Upload Limits (Plan-Based, Admin-Configurable)

| Category | Guest | Free | Pro   | Advance |
| -------- | ----- | ---- | ----- | ------- |
| Image    | 5MB   | 10MB | 100MB | 100MB   |
| Audio    | 5MB   | 10MB | 50MB  | 100MB   |
| Video    | 15MB  | 30MB | 100MB | 100MB   |
| Document | 5MB   | 10MB | 50MB  | 100MB   |

## Environment Variables (Complete Template)

```bash
# Database
DATABASE_URL=postgresql://...
# Auth
BETTER_AUTH_SECRET=...
GOOGLE_CLIENT_ID= / GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID= / GITHUB_CLIENT_SECRET=
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
# Storage (R2)
R2_ACCOUNT_ID= / R2_ACCESS_KEY_ID= / R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=hsafx-world
# Redis
UPSTASH_REDIS_URL=https://...upstash.io
UPSTASH_REDIS_TOKEN=...
# Internal
CRON_SECRET=...
NODE_ENV=development
```

## TODO (Not Yet Integrated)

- **Uploadthing**: File upload with virus scanning — not installed, needs package + API route + file router
- **BullMQ**: Job queue for async file processing tools — not installed, needs queue config + worker processes
- **Email**: Transactional emails (welcome, password reset, payment failure) — deferred post-MVP
- **Analytics**: PostHog/Plausible — deferred post-MVP
- **Error Tracking**: Sentry — deferred post-MVP

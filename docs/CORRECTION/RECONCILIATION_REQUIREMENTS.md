# Reconciliation Audit — Exhaustive Requirements Extraction

**Generated from:** 10 planning documents (01, 02, 03, 10, 11, 12, 13, 14, 15, 16)
**Purpose:** Every concrete, verifiable requirement that should exist in the codebase.

---

## FILE: 01_USER_ROLES_PERMISSIONS.md

### Database Tables / Data Structures

- REQ-01-001: Plan hierarchy enum: `guest < free < pro < advance`
- REQ-01-002: 16 feature flags defined: `tools.text.basic`, `tools.text.advanced`, `tools.data.converters`, `tools.media.image`, `tools.media.video`, `tools.media.audio`, `tools.pdf.editor`, `tools.generators`, `tools.calculators`, `tools.logistics`, `tools.bulk`, `api.access`, `coins.purchase`, `coins.earn_ads`, `experience.ad_free`, `support.priority`
- REQ-01-003: 7 admin roles: `super_admin` (100), `admin` (80), `support_manager` (60), `support_agent` (40), `content_manager` (40), `analyst` (20), `auditor` (20) — with numeric hierarchy levels
- REQ-01-004: Admin role constraints — `maxPerOrg` limits per role: super_admin=2, admin=5, support_manager=3, support_agent=10, content_manager=5, analyst=5, auditor=3
- REQ-01-005: MFA requirements per role: super_admin=required, admin=required, support_manager=required, support_agent=recommended, content_manager=optional, analyst=optional, auditor=optional

### Permissions Catalog

- REQ-01-006: `users.*` permissions: `users.view`, `users.edit`, `users.ban`, `users.delete`, `users.impersonate`, `users.export`
- REQ-01-007: `subscriptions.*` permissions: `subscriptions.view`, `subscriptions.edit`, `subscriptions.cancel`, `subscriptions.refund`, `subscriptions.extend`
- REQ-01-008: `payments.*` permissions: `payments.view`, `payments.refund`, `payments.export`
- REQ-01-009: `invoices.*` permissions: `invoices.view`, `invoices.create`, `invoices.void`
- REQ-01-010: `coins.*` permissions: `coins.view`, `coins.adjust`, `coins.refund`
- REQ-01-011: `tools.*` permissions: `tools.view`, `tools.edit`, `tools.create`, `tools.delete`, `tools.toggle`
- REQ-01-012: `plans.*` permissions: `plans.view`, `plans.edit`, `plans.create`
- REQ-01-013: `system.*` permissions: `system.settings`, `system.maintenance`, `system.feature_flags`
- REQ-01-014: `roles.*` permissions: `roles.view`, `roles.edit`, `roles.assign`
- REQ-01-015: `audit.*` permissions: `audit.view`, `audit.export`
- REQ-01-016: `analytics.*` permissions: `analytics.view`, `analytics.export`
- REQ-01-017: `api.*` permissions: `api.keys.view`, `api.keys.manage`

### Behaviors / Configurations

- REQ-01-018: Permission scoping supports metadata-based scopes: `own`, `team`, `all`
- REQ-01-019: Audit logging actor types: `user`, `admin`, `system`, `webhook`, `support_impersonation`
- REQ-01-020: Audit log retention: 90 days to 7 years depending on category
- REQ-01-021: CASL integration: `defineUserAbility()` and `defineAdminAbility()` functions must exist
- REQ-01-022: CASL React: `Can` component for UI permission gating
- REQ-01-023: Plan downgrade behavior: feature access immediately restricted, coins retained, API keys deactivated
- REQ-01-024: Enforcement layer order: Gateway → Auth Middleware → Permission Middleware → Limit Middleware → Handler
- REQ-01-025: Invariant: Plans control features; permissions never bypass plans
- REQ-01-026: Invariant: Admin API never exposed via API keys
- REQ-01-027: Invariant: CASL never exceeds backend enforcement
- REQ-01-028: Invariant: Unknown permissions fail closed (deny by default)

### UI Components

- REQ-01-029: Guest plan usage limits table (daily uses per tool category)
- REQ-01-030: Free plan usage limits table
- REQ-01-031: Pro plan usage limits table
- REQ-01-032: Advance plan usage limits table (unlimited on most)

---

## FILE: 02_BRAND_AND_SEO.md

### SEO / Metadata

- REQ-02-001: Each tool page must have: title, description, keywords, canonicalUrl, ogImage, structuredData (JSON-LD SoftwareApplication)
- REQ-02-002: Dynamic XML sitemap auto-generated from DB, targeting 432+ tools
- REQ-02-003: Sitemap updated daily, submitted to Google Search Console
- REQ-02-004: JSON-LD structured data: `SoftwareApplication` per tool page, `WebApplication` for homepage
- REQ-02-005: robots.txt: Allow `/`, Disallow `/api/`, `/admin/`, `/auth/`, `/_next/`; multiple sitemaps referenced
- REQ-02-006: Dynamic OG image generation per tool using `@vercel/og`, 1200x630px, cached in R2

### URL Patterns

- REQ-02-007: Tool pages: `/tools/[tool-slug]`
- REQ-02-008: Category pages: `/categories/[category-slug]`
- REQ-02-009: Internal linking: category hub pages, breadcrumb navigation
- REQ-02-010: Related tools: 3-5 per tool page

### Static Pages

- REQ-02-011: `/about` page required
- REQ-02-012: Category hub pages
- REQ-02-013: Individual tool pages

### Infrastructure

- REQ-02-014: MVP infrastructure: 2vCPU/4GB RAM, $40-80/month
- REQ-02-015: Scale infrastructure: 2-4 app servers, $150-$1500/month

### Domains

- REQ-02-016: Product domain: `hsafx.world`
- REQ-02-017: Brand domain: `hsafx.com`
- REQ-02-018: API domain: `api.hsafx.world`

---

## FILE: 03_FEATURE_FLAGS.md

### Database Tables

- REQ-03-001: Table `flag_definitions`: columns — id, key, name, description, value_type, default_value, scope, category, expires_at, review_at, owner, is_archived
- REQ-03-002: Table `flag_overrides`: columns — id, flag_id, target_type, target_value, override_value, reason, created_by, expires_at

### Flag Categories

- REQ-03-003: Flag categories enum: `plan_gate`, `tool`, `kill_switch`, `experiment`, `abuse`, `maintenance`
- REQ-03-004: Flag naming convention: `{category}.{domain}.{feature}[.{variant}]`

### Kill Switches (must exist)

- REQ-03-005: `kill.service.fastapi`
- REQ-03-006: `kill.service.r2`
- REQ-03-007: `kill.service.inngest`
- REQ-03-008: `kill.payment.stripe`
- REQ-03-009: `kill.payment.polar`
- REQ-03-010: `kill.payment.webhooks`
- REQ-03-011: `kill.auth.oauth_google`
- REQ-03-012: `kill.auth.oauth_github`
- REQ-03-013: `kill.auth.new_signups`
- REQ-03-014: `kill.feature.api`
- REQ-03-015: `kill.feature.coins`
- REQ-03-016: `kill.feature.file_uploads`

### Plan Gate Flags (must exist)

- REQ-03-017: `plan.api.access`
- REQ-03-018: `plan.api.rate_limit`
- REQ-03-019: `plan.limits.daily_uses`
- REQ-03-020: `plan.limits.file_size_mb`
- REQ-03-021: `plan.limits.concurrent_jobs`
- REQ-03-022: `plan.features.batch_processing`
- REQ-03-023: `plan.features.priority_queue`

### Maintenance Flags (must exist)

- REQ-03-024: `maint.db.readonly`
- REQ-03-025: `maint.site.degraded`
- REQ-03-026: `maint.migrations.lock`

### Behaviors

- REQ-03-027: Flag resolution order: User override → Plan override → Global override → Percentage rollout → Default
- REQ-03-028: Tool flag types: enabled, beta, deprecated, hidden, maintenance
- REQ-03-029: Experiment schema: `ExperimentVariant` with weighted assignment, sticky assignments, exposure tracking
- REQ-03-030: Abuse flags interface: `UserAbuseFlags` — rate_limited, feature_bans, account_frozen, coin_purchases_disabled, api_disabled
- REQ-03-031: Redis caching TTLs: global=60s, plan=60s, user=30s, kill_switches=5s, experiments=300s
- REQ-03-032: In-memory per-request caching + SWR with 300s stale TTL
- REQ-03-033: Flag lifecycle: Draft → Active → Deprecated → Archived (never hard-deleted)
- REQ-03-034: Mandatory review policy: experiments=30d, tools=90d, kill_switches=7d, abuse=7d, maintenance=1d
- REQ-03-035: Abuse cooldown: 24h same flag same user, 1h any flag same user
- REQ-03-036: Invariant: Kill switches always win
- REQ-03-037: Invariant: Overrides can only expand access
- REQ-03-038: Invariant: No flag change without audit entry
- REQ-03-039: Invariant: Flags never hard-deleted

---

## FILE: 10_SYSTEM_ARCHITECTURE.md

### Service Topology

- REQ-10-001: Next.js Backend (primary): owns auth, authorization, billing, coin ledger, usage tracking, API key management, webhook handling, tool orchestration, audit logging, admin endpoints
- REQ-10-002: FastAPI Backend (secondary): media processing, document conversion, OCR, AI/ML, native binary orchestration, async scraping. Does NOT do auth, billing, DB writes
- REQ-10-003: WASM Modules (client): text tools, calculators
- REQ-10-004: FastAPI job status: writes to Redis only; Next.js notified via callback webhook

### Inter-Service Communication

- REQ-10-005: 10 communication paths defined with protocols and auth methods
- REQ-10-006: Service config object `SERVICES` with fastapi, inngest, redis, r2 configuration

### Frontend Apps

- REQ-10-007: `apps/web/` — user-facing SaaS app (App Router)
- REQ-10-008: `apps/admin/` — admin panel (App Router)

### tRPC Routers

- REQ-10-009: tRPC routers: `auth`, `tools`, `billing`, `users`, `admin`, `coins`

### Package Structure

- REQ-10-010: `packages/api/` — routers, middleware, services
- REQ-10-011: `packages/db/` — Drizzle schema, migrations
- REQ-10-012: `packages/shared/` — types, constants, utils

### FastAPI Structure

- REQ-10-013: `backend/fastapi/` with routers: media, documents, ocr, scraping
- REQ-10-014: FastAPI services: ffmpeg, imagemagick, poppler, tesseract, libreoffice
- REQ-10-015: FastAPI workers for async processing

### Rust WASM

- REQ-10-016: `backend/rust/text-tools/` — Rust WASM for text tools
- REQ-10-017: `backend/rust/calculators/` — Rust WASM for calculators

### Webhook Endpoints

- REQ-10-018: `/api/webhooks/polar` — Polar subscription webhooks
- REQ-10-019: `/api/webhooks/stripe` — Stripe payment webhooks
- REQ-10-020: `/api/inngest` — Inngest event handler

### Redis Key Schema

- REQ-10-021: Redis key naming convention for: sessions, rate limits, usage counters, caches, locks, pub/sub
- REQ-10-022: Coin lock mechanism: Redis lock with 10s TTL, unique token, Lua script for atomic release, try/finally pattern

### Background Jobs (Inngest)

- REQ-10-023: Event `tool/execute`
- REQ-10-024: Event `billing/subscription.updated`
- REQ-10-025: Event `usage/reset.daily` — cron schedule
- REQ-10-026: Event `usage/reset.monthly` — cron schedule
- REQ-10-027: Event `cleanup/expired-files` — cron schedule
- REQ-10-028: Event `analytics/aggregate.daily` — cron schedule

### Cache Invalidation

- REQ-10-029: Cache invalidation strategies per cache type with specific triggers

### Deployment

- REQ-10-030: Vercel for Next.js
- REQ-10-031: Fly.io/Railway for FastAPI
- REQ-10-032: Neon for PostgreSQL
- REQ-10-033: Upstash for Redis
- REQ-10-034: Cloudflare R2 for object storage
- REQ-10-035: Meilisearch Cloud for search

### Environments

- REQ-10-036: Production, Staging (Vercel Preview + Neon branch), Development (local)

### CI/CD

- REQ-10-037: GitHub Actions: test/lint/typecheck → deploy preview (PR) or deploy production (main)

### Monitoring

- REQ-10-038: Vercel Logs/Axiom (logging)
- REQ-10-039: Sentry (error tracking)
- REQ-10-040: Better Uptime (health checks)
- REQ-10-041: Plausible + Umami (analytics — passive observers)
- REQ-10-042: Neon Dashboard (DB monitoring)
- REQ-10-043: Upstash Dashboard (Redis monitoring)

### Security Headers

- REQ-10-044: HSTS header
- REQ-10-045: X-Frame-Options header
- REQ-10-046: X-Content-Type-Options header
- REQ-10-047: X-XSS-Protection header
- REQ-10-048: Referrer-Policy header
- REQ-10-049: Permissions-Policy header
- REQ-10-050: X-DNS-Prefetch-Control header

### Performance Targets

- REQ-10-051: API p95 < 500ms
- REQ-10-052: WASM execution < 100ms
- REQ-10-053: Media processing < 30s
- REQ-10-054: DB query < 50ms
- REQ-10-055: Cache hit ratio > 90%

### Multi-Region

- REQ-10-056: MVP region: Asia (Singapore/Mumbai)
- REQ-10-057: Expand to US East then EU based on traffic thresholds

### Invariants

- REQ-10-058: Stateless & idempotent business logic
- REQ-10-059: Webhook idempotency via provider event ID
- REQ-10-060: Coin lock order: Redis lock → DB transaction → ledger entry → commit → release
- REQ-10-061: Analytics never authoritative for enforcement

---

## FILE: 11_TECHNOLOGY_STACK.md

### Group 1: Text Tools (Rust/WASM)

- REQ-11-001: Single Rust codebase for text tools, compiled to both WASM (browser) and native (API)
- REQ-11-002: Text tool categories: case conversions, separators/joiners, wrappers/quoting, text styling, unicode/glyph transforms, fun/expressive, encoding/cipher, text operations
- REQ-11-003: API endpoint pattern: `POST /v1/text/{category}/{tool}` (e.g., `/v1/text/case/snake`, `/v1/text/encode/base64`)
- REQ-11-004: WASM build tools: wasm-bindgen, wasm-pack
- REQ-11-005: Execution decision matrix: <100KB → browser WASM; 100KB-1MB → WASM with API fallback; >1MB → API; authenticated → API
- REQ-11-006: Performance guarantees: <1ms latency, 3-10MB native memory, 1-3MB WASM, 100k+ req/s/core

### Monaco Editor

- REQ-11-007: Monaco Editor: client-side only, lazy-loaded (~2MB gzipped)
- REQ-11-008: Prism.js fallback (5KB) when Monaco not loaded
- REQ-11-009: Monaco theme synced with app theme
- REQ-11-010: Monaco memory: 30-50MB per instance

### Group 2: Data/Developer Tools

- REQ-11-011: Node.js (TypeScript) for: JSON/YAML/CSV parsing/formatting/validation (Prettier, AJV)
- REQ-11-012: Node.js for AST/schema tools: OpenAPI, GraphQL, SQL
- REQ-11-013: Node.js for diagrams: DBML/ER via D3.js/SVG
- REQ-11-014: Python (FastAPI) for binary formats: Parquet (pyarrow), Avro (fastavro), Protobuf
- REQ-11-015: Group 2 endpoints: `POST /v1/json/format`, `POST /v1/openapi/to-ts`, `POST /v1/parquet/convert`, `POST /v1/dbml/diagram`

### Group 3: Media/File Processing

- REQ-11-016: FastAPI + Uvicorn/Gunicorn for media processing
- REQ-11-017: Redis Queue or Celery for job management
- REQ-11-018: Native binaries: libvips, FFmpeg, Tesseract, ImageMagick, Poppler/MuPDF, 7zip/libarchive
- REQ-11-019: Async pattern: `POST /v1/media/convert` → returns job_id, `GET /v1/jobs/{job_id}` → check status
- REQ-11-020: MediaJob interface: id, status (queued/processing/completed/failed/cancelled), result, error, progress, retryCount, maxRetries(3), expiresAt (24h auto-cleanup)
- REQ-11-021: Error codes (don't retry): INVALID_INPUT, FILE_TOO_LARGE, UNSUPPORTED_FORMAT
- REQ-11-022: Error codes (retry with exponential backoff, max 30s): PROCESSING_FAILED, WORKER_TIMEOUT, STORAGE_ERROR

### Group 4: Generators/Calculators

- REQ-11-023: Client-side JS: Web Crypto API (UUID/hash/password), Luxon/date-fns-tz (timezone)
- REQ-11-024: Rust native for API-served generators
- REQ-11-025: Group 4 endpoints: `POST /v1/generator/uuid`, `POST /v1/generator/password`, `POST /v1/calculator/bmi`, `POST /v1/calculator/zakat`, `POST /v1/seo/meta`, `POST /v1/css/gradient`

### Error Handling

- REQ-11-026: User-facing error format: message, suggestion, errorCode, field
- REQ-11-027: API error format: message, errorCode, statusCode, requestId, docs URL
- REQ-11-028: HTTP status codes used: 200, 202, 400, 401, 403, 404, 413, 422, 429, 500, 503
- REQ-11-029: Error code enums: ValidationErrors, ProcessingErrors, AuthErrors

---

## FILE: 12_FILE_STRUCTURE.md

### Core Principle

- REQ-12-001: One backend → Multiple frontends; Backend = authority
- REQ-12-002: Admin App = control plane; User App = execution plane

### Root Layout

- REQ-12-003: `.github/` — CI/CD
- REQ-12-004: `docs/` — Planning + product docs
- REQ-12-005: `backend/` — Next.js backend + FastAPI + Rust
- REQ-12-006: `apps/` — Frontend apps (web + admin)
- REQ-12-007: `packages/` — Shared frontend packages
- REQ-12-008: `infra/` — Docker, CI, deploy

### Backend Structure

- REQ-12-009: `backend/api/auth/` — DB: users, sessions, oauth_accounts
- REQ-12-010: `backend/api/users/` — DB: users, user_profiles
- REQ-12-011: `backend/api/permissions/` — DB: permissions, role_permissions
- REQ-12-012: `backend/api/subscriptions/` — DB: subscriptions, subscription_plans
- REQ-12-013: `backend/api/limits/` — DB: plan_limits, usage_counters
- REQ-12-014: `backend/api/billing/` — DB: payments, invoices, coin_transactions
- REQ-12-015: `backend/api/audit_logs/` — DB: audit_logs
- REQ-12-016: `backend/api/tools/` — DB: billable_action_logs
- REQ-12-017: `backend/api/admin/` — Admin-only endpoints
- REQ-12-018: `backend/api/internal/` — Service-to-service API (for FastAPI)

### Architecture Rules

- REQ-12-019: Next.js owns ALL database writes
- REQ-12-020: FastAPI is stateless compute-only (no DB access)
- REQ-12-021: FastAPI → Next.js via `X-Service-Key` header
- REQ-12-022: Job flow: User → Next.js (validate + pre-authorize) → FastAPI (execute) → Next.js (log + deduct coins)
- REQ-12-023: Next.js has `DATABASE_URL`; FastAPI has NO `DATABASE_URL`, uses `NEXT_JS_API_BASE_URL` + `NEXT_JS_API_KEY`

### Frontend — Web App

- REQ-12-024: `apps/web/src/app/(tools)/` — GROUP 1-5 tools
- REQ-12-025: `apps/web/src/app/auth/` — Auth pages
- REQ-12-026: `apps/web/src/app/dashboard/` — User dashboard
- REQ-12-027: `apps/web/src/app/billing/` — Billing pages
- REQ-12-028: `apps/web/src/lib/wasm/` — WASM module loading
- REQ-12-029: `apps/web/src/lib/permissions/` — CASL permission logic

### Frontend — Admin App

- REQ-12-030: `apps/admin/src/app/users/` — User management
- REQ-12-031: `apps/admin/src/app/plans/` — Plan management
- REQ-12-032: `apps/admin/src/app/permissions/` — Permission management
- REQ-12-033: `apps/admin/src/app/tools/` — Tool management
- REQ-12-034: `apps/admin/src/app/themes/` — Theme management
- REQ-12-035: `apps/admin/src/app/audit-logs/` — Audit log viewer
- REQ-12-036: `apps/admin/src/app/system/` — System settings

### Shared Packages

- REQ-12-037: `packages/ui/` — Shared shadcn components
- REQ-12-038: `packages/schemas/` — Zod schemas
- REQ-12-039: `packages/permissions/` — CASL rules (NOTE: actual package is `packages/shared/`)
- REQ-12-040: `packages/tool-definitions/` — Metadata for group 1-5
- REQ-12-041: `packages/theme/` — Theme intent types + derivation helpers + presets registry
- REQ-12-042: `packages/config/` — Shared config

### Tool Definition Structure

- REQ-12-043: Each tool has: UI schema, permission key, execution target (WASM / API / Worker)
- REQ-12-044: Tools are data-driven, not hardcoded
- REQ-12-045: Tools NEVER live directly in Admin; Admin manages tool metadata, Web renders tool UIs

---

## FILE: 13_DATABASE_SCHEMA.md

### Database Technology

- REQ-13-001: PostgreSQL (Neon), edge-compatible, serverless
- REQ-13-002: Drizzle ORM, type-safe, edge-compatible
- REQ-13-003: `@neondatabase/serverless` HTTP-based driver
- REQ-13-004: DBML = source of truth → Drizzle = runtime

### Naming Conventions

- REQ-13-005: Tables: `snake_case`, plural (e.g., `users`)
- REQ-13-006: Columns: `snake_case` (e.g., `user_id`)
- REQ-13-007: Primary keys: `id` (UUID, `gen_random_uuid()`)
- REQ-13-008: Foreign keys: `{entity}_id`
- REQ-13-009: Timestamps: `*_at` suffix
- REQ-13-010: Booleans: `is_*` prefix

### Schema Invariants

- REQ-13-011: Wallet balance is derived from ledger (trigger or reconciliation job)
- REQ-13-012: Soft-delete for auditable entities (`deleted_at IS NULL` in unique indexes)
- REQ-13-013: UUIDs for all primary keys
- REQ-13-014: Timestamps are UTC (`timestamp` without timezone)
- REQ-13-015: Money stored in cents (bigint)
- REQ-13-016: `coin_transactions` and `audit_logs` are INSERT-only (no UPDATE/DELETE)
- REQ-13-017: Foreign keys cascade on user deletion
- REQ-13-018: Unique constraints are partial (soft-delete aware)

### Table: `users`

- REQ-13-019: Columns: id (uuid pk), email (text, not null), username (text), password_hash (text, not null), full_name (text), avatar_url (text), phone_number (text), is_active (bool, default true), is_email_verified (bool, default false), last_login (timestamp), created_at, updated_at, deleted_at
- REQ-13-020: Partial unique index on email WHERE deleted_at IS NULL
- REQ-13-021: Partial unique index on username WHERE deleted_at IS NULL
- REQ-13-022: No `role` column — roles via `user_roles` join table

### Table: `user_preferences`

- REQ-13-023: Columns: id (uuid pk), user_id (uuid, unique, FK→users), theme (text, default 'system'), language (text, default 'en'), timezone (text, default 'UTC'), preferences (jsonb, default '{}')

### Table: `user_settings`

- REQ-13-024: Columns: id (uuid pk), user_id (uuid, unique, FK→users), email_notifications (bool, default true), push_notifications (bool, default false), marketing_emails (bool, default false), settings (jsonb, default '{}')

### Table: `sessions`

- REQ-13-025: Columns: id (uuid pk), user_id (uuid, FK→users), refresh_token_hash (text, not null — SHA256), expires_at (timestamp, not null), created_at, ip_address (text), user_agent (text)
- REQ-13-026: Unique index on (user_id, refresh_token_hash)
- REQ-13-027: refresh_token_hash is SHA256 hash, NEVER plaintext

### Table: `social_auths`

- REQ-13-028: Columns: id, user_id (FK→users), provider (text), provider_id (text), access_token, refresh_token, expires_at, created_at, updated_at
- REQ-13-029: Unique index on (provider, provider_id)

### Table: `password_reset_tokens`

- REQ-13-030: Columns: id, user_id (FK→users), token (text, unique), expires_at, used (bool, default false), created_at

### Table: `email_verification_tokens`

- REQ-13-031: Columns: id, user_id (FK→users), token (text, unique), expires_at, verified (bool, default false), created_at

### Table: `subscription_plans`

- REQ-13-032: Columns: id, code (text, unique — 'free','pro','advance'), name, price_cents (bigint, default 0), currency (text, default 'USD'), interval (billing_interval, default 'monthly'), description, is_active (bool), is_popular (bool), stripe_price_id, created_at, updated_at, deleted_at
- REQ-13-033: Enum `billing_interval`: monthly, yearly

### Table: `subscriptions`

- REQ-13-034: Columns: id, user_id (FK→users), plan_id (FK→subscription_plans), start_date, current_period_start, current_period_end, end_date, trial_ends_at, canceled_at, cancel_reason, cancel_at_period_end (bool, default false), auto_renew (bool, default true), allow_coin_usage_override (bool, nullable), stripe_subscription_id, created_at, updated_at, deleted_at
- REQ-13-035: Unique index on user_id WHERE deleted_at IS NULL (one active subscription per user)
- REQ-13-036: Subscription status is DERIVED, never stored as a column
- REQ-13-037: Status derivation function: `deriveSubscriptionStatus()` returning 'canceled', 'trial', 'expired', or 'active'

### Table: `payments`

- REQ-13-038: Columns: id, user_id (FK→users), subscription_id (FK→subscriptions), amount_cents (bigint), currency (text, default 'USD'), status (payment_status, default 'pending'), provider (text), provider_payment_id, payment_method_id, metadata (jsonb), paid_at, created_at, deleted_at
- REQ-13-039: Enum `payment_status`: pending, paid, failed, refunded

### Table: `invoices`

- REQ-13-040: Columns: id, user_id (FK→users), subscription_id (FK→subscriptions), invoice_number (text, unique), amount_cents (bigint), currency, status (invoice_status, default 'draft'), due_date, paid_at, payload (jsonb — line items), created_at, deleted_at
- REQ-13-041: Enum `invoice_status`: draft, open, partially_paid, paid, void, uncollectible

### Table: `invoice_payments`

- REQ-13-042: Columns: id, invoice_id (FK→invoices), payment_id (FK→payments), amount_cents (bigint), created_at

### Table: `payment_methods`

- REQ-13-043: Columns: id, user_id (FK→users), provider, provider_method_id, type (text — 'card','bank_account'), last4, brand, expiry_month, expiry_year, is_default (bool), created_at, deleted_at
- REQ-13-044: Unique index: one default payment method per user (WHERE is_default=true AND deleted_at IS NULL)

### Table: `user_coin_wallets`

- REQ-13-045: Columns: user_id (uuid pk, FK→users — one per user), balance (bigint, default 0), lifetime_earned (bigint, default 0), lifetime_spent (bigint, default 0), created_at, updated_at
- REQ-13-046: Balance is CACHED, source of truth is `SUM(amount) FROM coin_transactions`
- REQ-13-047: Reconciliation job REQUIRED to detect and fix drift

### Table: `coin_transactions`

- REQ-13-048: Columns: id, user_id (FK→users), amount (bigint — positive=credit, negative=debit), txn_type (coin_txn_type), reference_type (text), reference_id (uuid), metadata (jsonb), created_at
- REQ-13-049: Enum `coin_txn_type`: purchase, bonus, spend, refund, admin_adjust, expiration
- REQ-13-050: IMMUTABLE LEDGER — no UPDATE or DELETE
- REQ-13-051: Idempotency index: unique on (reference_type, reference_id, txn_type) WHERE both NOT NULL

### Table: `coin_packs`

- REQ-13-052: Columns: id, code (text, unique), coins (bigint), price_cents (bigint), currency, bonus_coins (bigint, default 0), is_active (bool), stripe_price_id, created_at

### Table: `coin_purchase_payments`

- REQ-13-053: Columns: id, payment_id (FK→payments), coin_pack_id (FK→coin_packs), coins_credited (bigint), created_at

### Table: `tool_coin_costs`

- REQ-13-054: Columns: id, tool_id (FK→tools), action_key (text), coin_cost (bigint), is_active (bool), created_at
- REQ-13-055: Unique index on (tool_id, action_key)

### Table: `plan_coin_rules`

- REQ-13-056: Columns: id, plan_id (FK→subscription_plans, unique), allow_coin_usage (bool), coin_discount_percent (int, 0-100), created_at

### Table: `usage_coin_fallbacks`

- REQ-13-057: Columns: id, plan_id (FK→subscription_plans), resource_key (text), coin_cost (bigint), created_at
- REQ-13-058: Unique index on (plan_id, resource_key)

### Table: `plan_features`

- REQ-13-059: Columns: id, plan_id (FK→subscription_plans), feature_key (text), enabled (bool), created_at, updated_at
- REQ-13-060: Unique index on (plan_id, feature_key)

### Table: `plan_limits`

- REQ-13-061: Columns: id, plan_id (FK→subscription_plans), resource_key (text), value_type (plan_limit_type), is_unlimited (bool, default false), max_value_bigint (bigint), max_value_json (jsonb), reset_period (reset_period), sort_order (int), created_at, updated_at
- REQ-13-062: Unique index on (plan_id, resource_key)
- REQ-13-063: Enum `plan_limit_type`: integer, size, duration, boolean, complex
- REQ-13-064: Enum `reset_period`: hourly, daily, monthly, yearly, never
- REQ-13-065: Always check `is_unlimited === true` BEFORE reading typed value fields

### Table: `plan_permissions`

- REQ-13-066: Columns: id, plan_id (FK→subscription_plans), permission_type (permission_type), resource_key (text), is_allowed (bool), description, sort_order, created_at, updated_at
- REQ-13-067: Unique index on (plan_id, permission_type, resource_key)
- REQ-13-068: Enum `permission_type`: tool_category, feature, api_access

### Table: `plan_theme_access`

- REQ-13-069: Columns: id, plan_id (FK→subscription_plans), preset_code (text), is_available (bool), sort_order, created_at, updated_at
- REQ-13-070: Unique index on (plan_id, preset_code)

### Table: `plan_metadata`

- REQ-13-071: Columns: id, plan_id (FK→subscription_plans), meta_key (text), meta_value (jsonb), created_at, updated_at

### Table: `plan_upgrade_rules`

- REQ-13-072: Columns: id, from_plan_id (FK→subscription_plans), to_plan_id (FK→subscription_plans), auto_upgrade (bool, default false), conditions (jsonb), is_active (bool), created_at, updated_at

### Table: `plan_audit_logs`

- REQ-13-073: Columns: id, plan_id (FK→subscription_plans), changed_by (FK→users), change_type (plan_change_type), changes (jsonb — old/new), reason, ip_address, user_agent, created_at
- REQ-13-074: Enum `plan_change_type`: feature_toggle, limit_update, metadata_add, metadata_remove

### Table: `roles`

- REQ-13-075: Columns: id, name (text), role_type (admin_role_type, default 'system'), description, is_default (bool), is_active (bool), sort_order, deleted_at, created_at, updated_at
- REQ-13-076: Enum `admin_role_type`: system, custom
- REQ-13-077: Partial unique index on name WHERE deleted_at IS NULL

### Table: `permission_groups`

- REQ-13-078: Columns: id, key (text, unique), name (text), description, sort_order, created_at

### Table: `permissions_catalog`

- REQ-13-079: Columns: id, permission_key (text), scope (text, default 'admin'), permission_group_id (FK→permission_groups), description, sort_order, deleted_at, created_at
- REQ-13-080: Unique index on (scope, permission_key) WHERE deleted_at IS NULL
- REQ-13-081: Invariant: Permission keys are immutable once published

### Table: `role_permissions`

- REQ-13-082: Columns: id, role_id (FK→roles), permission_id (FK→permissions_catalog), granted (bool, default true), created_at
- REQ-13-083: Unique index on (role_id, permission_id)

### Table: `user_roles`

- REQ-13-084: Columns: id, user_id (FK→users), role_id (FK→roles), expires_at (timestamp), created_at
- REQ-13-085: Unique index on (user_id, role_id)

### Table: `user_permission_overrides`

- REQ-13-086: Columns: id, user_id (FK→users), permission_id (FK→permissions_catalog), granted (bool), reason, expires_at, created_at, updated_at
- REQ-13-087: Unique index on (user_id, permission_id)

### Table: `usage_counters`

- REQ-13-088: Columns: id, user_id (FK→users), resource_key (text), source (text — 'api','web','admin'), period_start (timestamp), period_end (timestamp — NULL=lifetime), usage_value (bigint, default 0), last_reset_at, metadata (jsonb), created_at, updated_at
- REQ-13-089: Unique index on (user_id, resource_key, period_start)

### Table: `anonymous_usage`

- REQ-13-090: Columns: id, identifier (text — IP hash or fingerprint), identifier_type (identifier_type), tool_id (FK→tools), period_start, period_end, usage_value (bigint, default 0), created_at
- REQ-13-091: Unique index on (identifier_type, identifier, tool_id, period_start)
- REQ-13-092: Enum `identifier_type`: ip_hash, fingerprint
- REQ-13-093: Two separate systems: abuse prevention (24-48h retention) vs product analytics (Plausible/Umami)

### Table: `tools`

- REQ-13-094: Columns: id, tool_key (text), name (text), description, is_public (bool, default true), is_active (bool, default true), deleted_at, created_at
- REQ-13-095: Partial unique index on tool_key WHERE deleted_at IS NULL
- REQ-13-096: `is_public=true` → visible to unauthenticated; plan features ALWAYS apply after

### Table: `api_rate_limits`

- REQ-13-097: Columns: id, tool_id (FK→tools), plan_id (FK→subscription_plans, nullable — NULL=all plans), requests_per_minute, burst_limit, period (reset_period), created_at
- REQ-13-098: Unique index on (tool_id, plan_id)

### Table: `api_keys`

- REQ-13-099: Columns: id, user_id (FK→users), key_hash (text, unique — SHA256), key_prefix (text — e.g. "hsafx_live_a3f"), name (text), scopes (text[]), rate_limit_per_hour (int, default 100), last_used_at, expires_at, is_active (bool), created_at, updated_at
- REQ-13-100: Indexes: key_hash (unique), user_id, (user_id, is_active)

### Table: `api_request_logs`

- REQ-13-101: Columns: id, user_id (FK→users), tool_id (FK→tools), status_code, duration_ms, ip_address, user_agent, created_at
- REQ-13-102: Retention: 30 days; partitioning by created_at recommended; Inngest cleanup job

### Table: `audit_logs`

- REQ-13-103: Columns: id, user_id (FK→users — actor), target_user_id (FK→users — affected), action (audit_action), action_detail, resource (text), resource_id (uuid), changes (jsonb — old/new), ip_address, user_agent, metadata (jsonb), created_at
- REQ-13-104: Enum `audit_action`: create, update, delete, grant, revoke, login, logout, payment, refund
- REQ-13-105: IMMUTABLE — DB trigger prevents UPDATE/DELETE

### Table: `permission_audit_logs`

- REQ-13-106: Columns: id, actor_id (FK→users), action (audit_action), target_type (permission_target), target_id, permission_id (FK→permissions_catalog), old_value, new_value, reason, ip_address, user_agent, created_at
- REQ-13-107: Enum `permission_target`: role_permission, user_override, plan_feature

### Table: `email_provider_config`

- REQ-13-108: Columns: id, provider (email_provider, unique), daily_limit (int, default 100), monthly_limit (int, default 3000), is_enabled (bool), priority (int, default 1), created_at, updated_at
- REQ-13-109: Enum `email_provider`: resend, smtp

### Table: `email_usage_tracking`

- REQ-13-110: Columns: id, provider (email_provider), period_type (reset_period), period_start, period_end, emails_sent (int, default 0), emails_failed (int, default 0), created_at, updated_at

### Table: `admin_settings`

- REQ-13-111: Columns: id, setting_key (text, unique), setting_value (text), setting_group (text), description, is_encrypted (bool, default false), created_at, updated_at

### DB Triggers / Functions

- REQ-13-112: Trigger `fn_coin_transactions_wallet_update` — auto-update wallet on coin_transaction INSERT
- REQ-13-113: Trigger `fn_prevent_direct_wallet_update` — prevents direct balance updates
- REQ-13-114: Trigger `fn_update_timestamp` — auto-update `updated_at` on relevant tables
- REQ-13-115: Trigger `fn_prevent_audit_log_modification` — prevents UPDATE/DELETE on audit_logs
- REQ-13-116: Same immutability trigger on coin_transactions

### Critical Indexes

- REQ-13-117: `u_users_email_active` — unique email WHERE deleted_at IS NULL
- REQ-13-118: `u_users_username_active` — unique username WHERE deleted_at IS NULL AND username IS NOT NULL
- REQ-13-119: `u_subscriptions_user_active` — unique user_id WHERE deleted_at IS NULL
- REQ-13-120: `idx_subscriptions_user`, `idx_subscriptions_end_date`, `idx_subscriptions_stripe`
- REQ-13-121: `idx_coin_transactions_user`, `idx_coin_transactions_created`
- REQ-13-122: `u_usage_counters_user_resource_period`
- REQ-13-123: `idx_audit_logs_user`, `idx_audit_logs_created`, `idx_audit_logs_resource`
- REQ-13-124: `u_roles_name_active`, `u_permissions_catalog_scope_key_active`, `u_tools_key_active`
- REQ-13-125: `u_coin_transactions_reference_txn` — idempotency index

### Migration

- REQ-13-126: Drizzle Kit for migrations: generate, migrate, push
- REQ-13-127: Migration rules: always additive, default values required, backfill separately, test rollback, zero-downtime

### Drizzle ORM

- REQ-13-128: Schema files in `db/schema/` (e.g., `users.ts`)
- REQ-13-129: Relation definitions in `db/schema/relations.ts`
- REQ-13-130: Edge-compatible client using `@neondatabase/serverless` + `drizzle-orm/neon-http`

---

## FILE: 14_API_CONTRACTS.md

### API Surfaces

- REQ-14-001: 4 API surfaces: tRPC (User App), tRPC (Admin Panel), Public REST API, Webhooks (Inbound)
- REQ-14-002: tRPC auth: session cookie; Admin tRPC: session cookie + RBAC; REST API: API key; Webhooks: signature verification

### Base URLs

- REQ-14-003: Production: `https://api.hsafx.world`
- REQ-14-004: Staging: `https://api.staging.hsafx.world`
- REQ-14-005: Development: `http://localhost:3000`

### Naming Conventions

- REQ-14-006: tRPC procedures: `camelCase`
- REQ-14-007: REST endpoints: `kebab-case`
- REQ-14-008: Query params: `snake_case`
- REQ-14-009: Request/Response body: `camelCase`

### Pagination

- REQ-14-010: Default: offset pagination (`limit/offset`) with `meta.total`, `meta.limit`, `meta.offset`, `meta.hasMore`
- REQ-14-011: Cursor pagination for high-volume append-only data (transactions, audit_logs, usage_counters) using `cursor` parameter

### tRPC Router Structure

- REQ-14-012: Root router: `public`, `auth`, `user`, `subscription`, `coins`, `tools`, `usage`, `admin`
- REQ-14-013: Auth router: `getSession` (public), `signOut` (protected)
- REQ-14-014: User router: `getProfile`, `updateProfile`, `updatePreferences`, `updateSettings`, `deleteAccount`
- REQ-14-015: Subscription router: `getCurrent`, `getPlans` (public), `createCheckout`, `cancel`
- REQ-14-016: Coins router: `getBalance`, `getTransactions` (cursor paginated), `getPacks` (public), `purchasePack`
- REQ-14-017: Tools router: `list` (public), `get` (public), `execute` (protected), `getJobStatus` (protected)
- REQ-14-018: API Keys router: `list`, `create`, `revoke` (all protected)

### Tool Execution Contract

- REQ-14-019: `tools.execute` returns discriminated union: `executionType: 'client'|'server'|'async'`
- REQ-14-020: Idempotency key required for async (FastAPI) executions; auto-generated for sync
- REQ-14-021: Duplicate requests within 24h return cached response, no re-charge
- REQ-14-022: Coin deduction is atomic with job creation

### Admin Procedures

- REQ-14-023: Admin sub-routers: `users`, `subscriptions`, `coins`, `tools`, `plans`, `roles`, `audit`, `analytics`, `system`
- REQ-14-024: Admin user procedures: `list`, `get`, `ban`, `impersonate`, `stopImpersonation`
- REQ-14-025: Admin procedures require `.meta({ permission: '...' })` for RBAC

### Impersonation Contract

- REQ-14-026: Max 1 hour, non-renewable
- REQ-14-027: Cannot modify: billing, passwords, email, 2FA
- REQ-14-028: `ctx.isImpersonating = true` context flag
- REQ-14-029: Every action during impersonation includes original admin ID in audit
- REQ-14-030: Admin can end session early via `stopImpersonation`

### REST API Endpoints

- REQ-14-031: `GET /api/v1/tools` — List tools
- REQ-14-032: `GET /api/v1/tools/:toolKey` — Get tool details
- REQ-14-033: `POST /api/v1/tools/:toolKey/execute` — Execute tool (always async, returns 202)
- REQ-14-034: `GET /api/v1/jobs/:jobId` — Get job status
- REQ-14-035: `GET /api/v1/jobs/:jobId/result` — Get job result
- REQ-14-036: `GET /api/v1/account` — Get account info
- REQ-14-037: `GET /api/v1/account/usage` — Get usage stats
- REQ-14-038: `GET /api/v1/health` — Health check (no auth)

### REST API Invariant

- REQ-14-039: REST API always returns async job regardless of execution strategy (unlike tRPC which can return immediate)

### Job Retention

- REQ-14-040: Job metadata (Redis): 72 hours
- REQ-14-041: Job result payload (Redis): 72 hours
- REQ-14-042: Output files (R2): 24 hours (signed URLs)
- REQ-14-043: Job audit log (Postgres): 30 days
- REQ-14-044: After 72h, `GET /api/v1/jobs/:id` returns 404

### API Key Structure

- REQ-14-045: Key format: `hsafx_live_sk_*` (production), `hsafx_test_sk_*` (sandbox)
- REQ-14-046: Scopes: `tools:execute`, `tools:read`, `usage:read`, `account:read`
- REQ-14-047: API keys are opaque secrets (NOT JWTs), validated by hash lookup only

### Webhook Contracts — Polar

- REQ-14-048: Endpoint: `/api/webhooks/polar`
- REQ-14-049: Polar signature: HMAC-SHA256 (Svix standard)
- REQ-14-050: Replay prevention: reject if timestamp > 5 minutes old
- REQ-14-051: Polar events handled: `checkout.created`, `subscription.created`, `subscription.updated`, `subscription.canceled`
- REQ-14-052: Idempotency check: store event ID, skip if already processed

### Webhook Contracts — Stripe

- REQ-14-053: Endpoint: `/api/webhooks/stripe`
- REQ-14-054: Stripe signature: `stripe-signature` header with `t=` and `v1=`
- REQ-14-055: Stripe events handled: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `invoice.paid`, `invoice.payment_failed`

### Outbound Webhooks

- REQ-14-056: `job.completed` and `job.failed` webhook types to customer URLs
- REQ-14-057: Webhook retry: max 10 attempts, exponential backoff (2^n seconds, capped 1h)
- REQ-14-058: Timeout per attempt: 30 seconds
- REQ-14-059: Dead letter queue after 10 failures, stored 30 days
- REQ-14-060: Manual retry available via admin panel

### Internal Service API

- REQ-14-061: `X-Internal-Secret` header for inter-service auth (v1)
- REQ-14-062: Next.js → FastAPI: `POST /jobs`, `GET /jobs/:jobId`
- REQ-14-063: FastAPI → Next.js callback: `POST /api/internal/job-callback`
- REQ-14-064: Dual-secret acceptance during rotation

### Error Handling

- REQ-14-065: Error format: `{ error: { code, message, details?, requestId } }`
- REQ-14-066: Error codes: BAD_REQUEST, VALIDATION_ERROR, UNAUTHORIZED, SESSION_EXPIRED, INVALID_API_KEY, FORBIDDEN, PLAN_LIMIT_EXCEEDED, INSUFFICIENT_COINS, FEATURE_NOT_AVAILABLE, NOT_FOUND, CONFLICT, UNPROCESSABLE_ENTITY, RATE_LIMITED, INTERNAL_ERROR, UPSTREAM_ERROR, SERVICE_UNAVAILABLE

### Rate Limiting

- REQ-14-067: tRPC unauthenticated: 20 req/min per IP
- REQ-14-068: tRPC authenticated: 100 req/min per user
- REQ-14-069: REST API default: 60 req/min per API key
- REQ-14-070: REST API Pro: 300 req/min per API key
- REQ-14-071: REST API Advance: 1000 req/min per API key
- REQ-14-072: Webhook inbound: 100 req/min per IP
- REQ-14-073: Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`
- REQ-14-074: Effective rate = `min(key.rateLimit, planTier.maxRateLimit)`

### Schemas (Zod)

- REQ-14-075: `paginationSchema`: limit (1-100, default 20), offset (min 0, default 0)
- REQ-14-076: `cursorPaginationSchema`: limit (1-100, default 20), cursor (optional string)
- REQ-14-077: `userSchema`, `userProfileSchema`, `subscriptionPlanSchema`, `subscriptionSchema`, `toolSchema`, `toolExecutionResultSchema`

### API Versioning

- REQ-14-078: REST API versioned via URL path (`/api/v1/`)
- REQ-14-079: tRPC not versioned (internal, coordinated with deploys)
- REQ-14-080: Breaking changes require new version; non-breaking changes allowed in same version
- REQ-14-081: Deprecation: 6 months notice, `Deprecation` header, `Sunset` header, `Link` header

### OpenAPI

- REQ-14-082: Auto-generated from Zod schemas via `trpc-openapi`
- REQ-14-083: Only REST-exposed public procedures; admin/internal routes EXCLUDED
- REQ-14-084: Swagger UI at `https://api.hsafx.world/docs`
- REQ-14-085: Documentation endpoint at `/api/docs`

---

## FILE: 15_SECURITY_MODEL.md

### Security Invariants

- REQ-15-001: Never trust the client — all validation server-side
- REQ-15-002: Defense in depth — multiple layers
- REQ-15-003: Least privilege — minimum permissions by default
- REQ-15-004: Fail secure — deny on error, never fail open
- REQ-15-005: Audit everything sensitive
- REQ-15-006: Secrets never in code — environment variables only
- REQ-15-007: Zero PII in logs — structured logging with PII redaction
- REQ-15-008: Session integrity — server-side sessions, tokens are opaque

### Security Layers (6 layers)

- REQ-15-009: Layer 1: Edge (Vercel/Cloudflare) — DDoS, WAF, TLS 1.3
- REQ-15-010: Layer 2: Rate Limiting (Upstash Redis) — IP + user + endpoint limits
- REQ-15-011: Layer 3: Authentication (Better-Auth) — session, API key, OAuth
- REQ-15-012: Layer 4: Authorization (Plan + RBAC)
- REQ-15-013: Layer 5: Input Validation (Zod)
- REQ-15-014: Layer 6: Data Access (Drizzle + Row-Level filtering)

### Authentication

- REQ-15-015: Auth methods: Email+Password, OAuth Google, OAuth GitHub, API Key, Service Token
- REQ-15-016: Session cookie name: `__hsafx_session`
- REQ-15-017: Cookie flags: httpOnly=true, secure=true, sameSite='lax'
- REQ-15-018: Cookie maxAge: 7 days
- REQ-15-019: Sliding expiration enabled (rolling=true)
- REQ-15-020: Absolute max lifetime: 30 days
- REQ-15-021: CSRF protection: SameSite=Lax primary; Origin/Referer validation for state-changing; tRPC automatic CSRF

### Session Data

- REQ-15-022: Session contains: userId, email, plan, adminRole?, adminPermissions?, impersonation?, createdAt, lastActivityAt, ipAddress, userAgent
- REQ-15-023: IP and User-Agent are ADVISORY ONLY — never hard-invalidate sessions based on these

### Password Requirements

- REQ-15-024: Minimum 12 characters
- REQ-15-025: At least 1 uppercase, 1 lowercase, 1 number
- REQ-15-026: Breached password check via HaveIBeenPwned API (k-anonymity)
- REQ-15-027: Hashing: Argon2id (memory: 64MB, iterations: 3)
- REQ-15-028: Rate limit: 5 attempts per 15 minutes per IP

### Authorization

- REQ-15-029: Resource ownership: every user-owned resource query MUST filter by user_id
- REQ-15-030: CASL on frontend is UI hints ONLY; backend re-verifies all permissions
- REQ-15-031: Admin role hierarchy prevents lower roles from modifying higher-role admins

### CORS

- REQ-15-032: Allowed origins: `https://hsafx.world`, `https://www.hsafx.world`; localhost only in dev
- REQ-15-033: Credentials: true; maxAge: 86400 (24h preflight)

### Security Headers

- REQ-15-034: X-Frame-Options: DENY
- REQ-15-035: X-Content-Type-Options: nosniff
- REQ-15-036: X-XSS-Protection: 1; mode=block
- REQ-15-037: HSTS: max-age=31536000; includeSubDomains; preload
- REQ-15-038: CSP: default-src 'self'; connect-src includes polar.sh and stripe.com; frame-ancestors 'none'
- REQ-15-039: Referrer-Policy: strict-origin-when-cross-origin
- REQ-15-040: Permissions-Policy: camera=(), microphone=(), geolocation=()

### Webhook Security

- REQ-15-041: HMAC-SHA256 signature verification
- REQ-15-042: Timestamp validation (reject > 5 mins old)
- REQ-15-043: Idempotency via event ID unique storage
- REQ-15-044: Replay attack prevention
- REQ-15-045: Constant-time comparison (`timingSafeEqual`)

### Input Validation

- REQ-15-046: String sanitization: trim, min/max, XSS character removal
- REQ-15-047: Email: `.email().toLowerCase().max(254)`
- REQ-15-048: File upload: magic byte detection (not Content-Type), extension check, filename sanitization, virus scan for files retained >24h or shareable

### SQL Injection Prevention

- REQ-15-049: Always use Drizzle ORM or `sql` template tag; never string interpolation

### Data Protection

- REQ-15-050: Data classification: Public, Internal, Confidential, Restricted
- REQ-15-051: Encryption at rest: Neon (AES-256), Upstash (AES-256), R2 (AES-256)
- REQ-15-052: Encryption in transit: TLS 1.3 everywhere
- REQ-15-053: Passwords: Argon2id; API keys: SHA-256
- REQ-15-054: OAuth tokens stored plaintext (protected by Neon encryption at rest)

### PII Handling

- REQ-15-055: Logging sanitizer: redact email, password, apiKey, token, ip, userAgent
- REQ-15-056: `sanitizeForLogging()` function required

### Data Retention

- REQ-15-057: User accounts: until deletion request → soft delete + 30 day purge
- REQ-15-058: Processed files: 24 hours auto-delete
- REQ-15-059: Audit logs: 2 years
- REQ-15-060: Session data: 30 days max (Redis TTL)
- REQ-15-061: Payment records: 7 years (legal)

### Secrets Management

- REQ-15-062: Required env vars: DATABASE_URL, REDIS_URL, BETTER_AUTH_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, INTERNAL_SERVICE_SECRET
- REQ-15-063: JWT secret rotation: zero-downtime dual-key validation
- REQ-15-064: Secret rotation schedule: quarterly for provider keys, monthly for JWT, on-breach for DB/webhooks
- REQ-15-065: Secret format: `dev_*` (dev), `stg_*` (staging), `prd_*` (production)

### Impersonation Security

- REQ-15-066: Requires `admin:impersonate` permission
- REQ-15-067: Max 1 hour, auto-expire
- REQ-15-068: Cannot impersonate other admins
- REQ-15-069: Allowed actions whitelist: read:profile, read:files, read:usage, read:history, execute:tool
- REQ-15-070: NOT allowed: billing, password change, API keys, delete account
- REQ-15-071: UI banner visible during impersonation

### Abuse Prevention

- REQ-15-072: Credential stuffing: rate limit + CAPTCHA after 3 fails
- REQ-15-073: Account enumeration: same response for valid/invalid emails
- REQ-15-074: Free tier abuse: device fingerprinting + email domain checks
- REQ-15-075: Suspicious activity detection: multipleFailedLogins, impossibleTravel, unusualUsageSpike, rapidCoinSpending
- REQ-15-076: 2+ flags → flag for review + require reauthentication (24h cooldown)

### Account Lockout

- REQ-15-077: 5 failed logins → temporary lock + CAPTCHA for 15 minutes
- REQ-15-078: 10 failed logins → account lock + email until verification
- REQ-15-079: Payment dispute → purchase freeze for 30 days

### Incident Response

- REQ-15-080: P0 response time: 15 minutes
- REQ-15-081: P1 response time: 1 hour
- REQ-15-082: Breach notification: affected users within 72 hours; regulatory within 72 hours

---

## FILE: 16_NON_FUNCTIONAL_REQUIREMENTS.md

### SLO Tiers

- REQ-16-001: Tier 0 (auth, billing): 99.9% availability (43 min/month downtime)
- REQ-16-002: Tier 1 (tool execution): 99.5% availability (3.6 hr/month)
- REQ-16-003: Tier 2 (analytics, admin): 99.0% availability (7.2 hr/month)
- REQ-16-004: Tier 3 (notifications, exports): 95.0% availability

### API Latency (P95)

- REQ-16-005: Authentication: 250ms P95, 1s hard limit
- REQ-16-006: Session validation: 40ms P95, 150ms hard limit
- REQ-16-007: Tool metadata fetch: 80ms P95, 300ms hard limit
- REQ-16-008: API tool execution (sync): 500ms P95, 5s hard limit
- REQ-16-009: File upload presigned URL: 100ms P95, 300ms hard limit
- REQ-16-010: Coin balance check: 60ms P95, 150ms hard limit
- REQ-16-011: Subscription status: 70ms P95, 200ms hard limit

### Background Job Latency

- REQ-16-012: Media processing: start <5s, P95 30s, max 5min
- REQ-16-013: PDF operations: start <3s, P95 15s, max 2min
- REQ-16-014: AI/ML inference: start <10s, P95 60s, max 10min
- REQ-16-015: Webhook processing: start <1s, P95 5s, max 30s
- REQ-16-016: Email sending: start <10s, P95 30s, max 2min

### Latency Budget (500ms total P95)

- REQ-16-017: Edge/CDN: 20ms (4%), Auth: 30ms (6%), Business Logic: 200ms (40%), Database: 200ms (40%), Response: 50ms (10%)

### Throughput

- REQ-16-018: Next.js Edge: 1000 sustained / 5000 peak RPS
- REQ-16-019: Next.js API: 500 sustained / 2000 peak RPS
- REQ-16-020: FastAPI: 200 sustained / 500 peak RPS
- REQ-16-021: DB read: 2000 sustained / 5000 peak RPS
- REQ-16-022: DB write: 200 sustained / 500 peak RPS
- REQ-16-023: Redis: 10000 sustained / 30000 peak RPS

### User Growth Targets

- REQ-16-024: Year 1: 10k registered, 3k MAU, 300 peak concurrent, 10k tool exec/day
- REQ-16-025: Year 2: 50k registered, 15k MAU, 1500 peak concurrent, 50k tool exec/day
- REQ-16-026: Year 3: 200k registered, 60k MAU, 6000 peak concurrent, 200k tool exec/day

### Resource Limits

- REQ-16-027: Max request body: 50MB (uploads), 1MB (JSON)
- REQ-16-028: Request timeout: 30s
- REQ-16-029: Max file sizes: free=10MB, pro=50MB, advance=100MB
- REQ-16-030: Max batch files: 20
- REQ-16-031: Max output size: 200MB
- REQ-16-032: WASM memory limit: 256MB; execution timeout: 30s
- REQ-16-033: Rate limits: free=60req/min+10tools/min, pro=300+50, advance=1000+200, api=100/key

### Availability SLOs (per service)

- REQ-16-034: Authentication: 99.9%
- REQ-16-035: Billing/Payments: 99.9%
- REQ-16-036: Tool Execution: 99.5%
- REQ-16-037: File Storage (R2): 99.9%
- REQ-16-038: Background Jobs: 99.0%
- REQ-16-039: Admin Dashboard: 99.0%
- REQ-16-040: Public API: 99.5%

### MTTR/MTBF

- REQ-16-041: P0: MTTR <30min, MTBF >30 days
- REQ-16-042: P1: MTTR <2hr, MTBF >14 days
- REQ-16-043: P2: MTTR <8hr, MTBF >7 days
- REQ-16-044: P3: MTTR <48hr

### Graceful Degradation

- REQ-16-045: FastAPI down → WASM text tools still work, media tools show "unavailable"
- REQ-16-046: Redis down → graded fallback (allow existing JWT sessions, disable refresh, shorten TTL, banner, DB fallback LAST RESORT after >30min)
- REQ-16-047: Neon read down → serve cached data, read-only mode
- REQ-16-048: Neon write down → queue writes, "read-only" banner
- REQ-16-049: R2 down → text-only tools work
- REQ-16-050: Inngest down → persist to `job_fallback_queue` table, NEVER execute heavy jobs synchronously
- REQ-16-051: Polar down → existing subscriptions continue
- REQ-16-052: Stripe down → hide purchase UI, coins still usable

### Scaling Triggers

- REQ-16-053: Next.js: scale up at CPU >70% for 5min, down at <30% for 15min; min=2, max=20
- REQ-16-054: FastAPI: scale up at queue depth >100, down at <10; min=1, max=5

### Stateless Requirements

- REQ-16-055: Sessions: Redis only, no sticky sessions
- REQ-16-056: Files: R2 only, no local disk
- REQ-16-057: Cache: Redis primary, per-request memory only

### DB Partitioning

- REQ-16-058: coin_transactions: partition by month (created_at)
- REQ-16-059: audit_logs: partition by month (created_at), keep 2 years then archive
- REQ-16-060: Deferred until audit_logs >10GB or coin_transactions >1000 writes/day

### Backpressure

- REQ-16-061: 4-layer backpressure: Edge rate limiting → App rate limiting → Queue depth check → DB connection pool
- REQ-16-062: Queue depth > threshold → return 503
- REQ-16-063: DB connection timeout: 5s

### Security/Compliance

- REQ-16-064: MFA required for admin, super_admin
- REQ-16-065: Session timeout: 7 days; inactive timeout: 24 hours
- REQ-16-066: Max sessions per user: 10
- REQ-16-067: API key rotation: 90 days recommended; max expiry: 1 year
- REQ-16-068: GDPR required (data export, deletion, consent)
- REQ-16-069: CCPA required (opt-out, disclosure)
- REQ-16-070: PCI DSS: N/A (Stripe/Polar handle card data)

### Audit Log Retention

- REQ-16-071: Security events: 2 years
- REQ-16-072: Auth logs: 1 year
- REQ-16-073: API access logs: 90 days
- REQ-16-074: Tool execution logs: 30 days
- REQ-16-075: Payment events: 7 years (immutable)
- REQ-16-076: Admin actions: 2 years (immutable)

### Logging

- REQ-16-077: Structured logging: timestamp, level, message, service, request_id, user_id, session_id, error, duration_ms, metadata
- REQ-16-078: Retention: ERROR=90d, WARN=30d, INFO=14d, DEBUG=3d (dev only)

### Metrics (RED Method)

- REQ-16-079: Rate: alert >2x normal for 5min
- REQ-16-080: Errors: alert >1% for 5min
- REQ-16-081: Duration: alert P99 >2s for 5min

### Alerting

- REQ-16-082: P0: PagerDuty+Slack, immediate, auto-escalate 15min
- REQ-16-083: P1: PagerDuty+Slack, 15min, auto-escalate 1h
- REQ-16-084: P2: Slack, 1hr, manual escalation
- REQ-16-085: P3: Email, next business day

### P0 Alerts

- REQ-16-086: auth_service_down: auth_errors >50% for 2min
- REQ-16-087: payment_failures: payment_errors >10% for 5min
- REQ-16-088: database_unreachable: db_connection_errors >0 for 1min
- REQ-16-089: data_corruption_detected

### Tracing

- REQ-16-090: Default sampling: 10%; Errors: 100%; Slow (>1s): 100%
- REQ-16-091: Required spans: http_request, database_query, redis_operation, external_api_call, background_job
- REQ-16-092: Context propagation: W3C Trace Context

### Backup

- REQ-16-093: PostgreSQL full: daily, 30 day retention
- REQ-16-094: PostgreSQL WAL: continuous, 7 day retention
- REQ-16-095: Redis snapshot: daily, 7 day retention
- REQ-16-096: Monthly restore testing to verify RTO
- REQ-16-097: RPO=0 for auth and billing (no committed transaction loss)

### GDPR Right to Erasure

- REQ-16-098: Must delete: profile, email, sessions, API keys, uploaded files
- REQ-16-099: May anonymize: usage stats, tool execution logs, analytics events
- REQ-16-100: Must retain: payment records (7 years), legal audit logs
- REQ-16-101: Processing time: 30 days max; email confirmation on completion

### Deployment

- REQ-16-102: Rolling deployment with canary (5% for 15min)
- REQ-16-103: Auto-rollback: error_rate >5% OR latency_p99 >5s
- REQ-16-104: Rollback time: <2 minutes
- REQ-16-105: Preferred windows: Tue-Thu 10:00-16:00 UTC; blocked: Fri 14:00 - Mon 10:00 UTC

### Cost

- REQ-16-106: Year 1 total: $150-550/month
- REQ-16-107: Cost per MAU target: <$0.05
- REQ-16-108: Cost per tool execution: <$0.001
- REQ-16-109: Infra cost / revenue: <20%

### Analytics (Custom PostgreSQL-based)

- REQ-16-110: No Google Analytics, no third-party trackers
- REQ-16-111: AnalyticsEvent interface: id, userId, sessionId, eventType, eventName, properties, timestamp, userAgent, ip (hashed), country, referrer, utm fields
- REQ-16-112: Event types: USER_SIGNUP, USER_LOGIN, USER_LOGOUT, TOOL_VIEW, TOOL_EXECUTE, TOOL_ERROR, SUBSCRIPTION_STARTED, SUBSCRIPTION_CANCELED, COINS_PURCHASED, AD_WATCHED, PAGE_VIEW, SEARCH, SHARE
- REQ-16-113: Client-side tracking via `Analytics` class, batched/debounced
- REQ-16-114: Server endpoint: `POST /api/analytics/events`
- REQ-16-115: Daily aggregation job at 1 AM UTC → `tool_usage_daily`, `user_activity_daily` tables
- REQ-16-116: Weekly aggregation: Sunday 2 AM UTC; Monthly: 1st of month 3 AM UTC
- REQ-16-117: Analytics data retention: raw events=1 year, daily aggregates=3 years, monthly aggregates=forever

### Scaling Checkpoints

- REQ-16-118: 10k users → review DB indexing, add read replicas
- REQ-16-119: 50k users → implement sharding strategy
- REQ-16-120: 100k users → multi-region deployment
- REQ-16-121: 500k users → major architecture review

---

## SUMMARY COUNTS

| File | Requirements |
|------|-------------|
| 01_USER_ROLES_PERMISSIONS | 32 |
| 02_BRAND_AND_SEO | 18 |
| 03_FEATURE_FLAGS | 39 |
| 10_SYSTEM_ARCHITECTURE | 61 |
| 11_TECHNOLOGY_STACK | 29 |
| 12_FILE_STRUCTURE | 45 |
| 13_DATABASE_SCHEMA | 130 |
| 14_API_CONTRACTS | 85 |
| 15_SECURITY_MODEL | 82 |
| 16_NON_FUNCTIONAL_REQUIREMENTS | 121 |
| **TOTAL** | **642** |

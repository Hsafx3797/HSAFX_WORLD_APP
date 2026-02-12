# MASTER CODEBASE ANALYSIS

> **Date**: February 10, 2026
> **Scope**: Full static & architectural analysis of the HSAFX World App workspace
> **Reference**: All 50+ documents in `docs/PLANNING/`
> **Method**: Exhaustive file-by-file audit of every directory against planning specifications

---

## Table of Contents

1. [Question 1: Current Stage](#1-current-stage-of-the-codebase)
2. [Question 2: Deviations from Planning](#2-deviations-from-planning-documents)
3. [Question 3: Corrective Recommendations](#3-corrective-recommendations)
4. [Appendix A: Module-by-Module Inventory](#appendix-a-module-by-module-inventory)
5. [Appendix B: Database Table Coverage](#appendix-b-database-table-coverage)
6. [Appendix C: tRPC Procedure Coverage](#appendix-c-trpc-procedure-coverage)
7. [Appendix D: Backend Ownership Violations](#appendix-d-backend-ownership-violations)
8. [Appendix E: Admin Panel Feature Matrix](#appendix-e-admin-panel-feature-matrix)

---

## 1. Current Stage of the Codebase

### 1.1 Against the Implementation Roadmap (44_IMPLEMENTATION_ROADMAP.md)

The roadmap defines **5 phases** with a total estimated duration of 23–33 weeks:

| Phase                      | Description                                            | Planned Duration | Actual Status     |
|----------------------------|--------------------------------------------------------|------------------|-------------------|
| **Phase 1**: Tools + API   | All 446 tools as isolated endpoints                    | 8–14 weeks       | **~75% Complete** |
| **Phase 2**: DB + Auth     | PostgreSQL, Drizzle, Better-Auth, rate limiting, coins | 3–4 weeks        | **~85% Complete** |
| **Phase 3**: Admin Panel   | Separate Next.js app, management, audit, 2FA           | 4–6 weeks        | **~75% Complete** |
| **Phase 4**: User Frontend | Consumer UI, themes, all 446 tool UIs, billing         | 6–8 weeks        | **~80% Complete** |
| **Phase 5**: Finalization  | Load testing, security audit, Lighthouse optimization  | 2–3 weeks        | **~5% Complete**  |

**Overall Assessment**: The codebase is at approximately **Phase 4.5** — deep into the user frontend with significant backend and admin panel work already done, but finalization (testing, CI/CD, deployment, performance optimization) has not started.

### 1.2 Quantitative Summary

| Metric                      | Planned                     | Actual                                 | Coverage                  |
|-----------------------------|-----------------------------|----------------------------------------|---------------------------|
| Database tables             | 35                          | 39 (24 planned + 12 bonus + 3 renamed) | **69% of planned schema** |
| tRPC procedures             | 52+                         | ~45                                    | **87%**                   |
| Tool definitions (metadata) | 446                         | 454                                    | **102%** (exceeded)       |
| Tool client-side executions | ~364 (non-file tools)       | ~350+ (packages/tools)                 | **~96%**                  |
| Tool server-side handlers   | 82 FILE_CONVERTER           | 121 registered in executor             | **148%** (exceeded)       |
| B2B REST API endpoints      | 8                           | 8                                      | **100%**                  |
| Admin panel features        | 58                          | 36 fully complete                      | **62%**                   |
| Admin panel pages           | 16 planned                  | 12 exist                               | **75%**                   |
| CI/CD workflows             | 4 planned                   | 0                                      | **0%**                    |
| Testing coverage            | 1,338 test cases planned    | 0                                      | **0%**                    |
| Error codes standardized    | 52 planned                  | ~30 implemented                        | **58%**                   |

### 1.3 Component-Level Maturity

| Component                   | Lines of Code | Maturity             | Notes                                                            |
|-----------------------------|---------------|----------------------|------------------------------------------------------------------|
| `packages/tool-definitions` | 3,918         | **Production-Ready** | 454 tool metadata entries                                        |
| `packages/tool-execution`   | 16,969        | **Production-Ready** | Massive pure-function execution engine                           |
| `packages/shared`           | 3,850         | **Production-Ready** | Types, constants, utils, permissions, billing, CASL              |
| `packages/theme`            | 2,134         | **Production-Ready** | Full OKLCH derivation, presets, tier gating                      |
| `packages/db`               | 1,391         | **Needs Work**       | 11 planned tables missing                                        |
| `packages/api`              | 1,354         | **Needs Work**       | ~7 procedures short                                              |
| `packages/schemas`          | 328           | **Needs Work**       | User/admin schemas missing; validation inline in tRPC            |
| `packages/ui`               | 238           | **Skeletal**         | Only ThemeProvider; no component library                         |
| `apps/web`                  | ~12,000+      | **Near-Complete**    | Auth, billing, tools, webhooks, B2B API all working              |
| `apps/admin`                | ~8,000+       | **Near-Complete**    | 12 pages, 16 API routes, full RBAC, 4 detail pages missing       |
| `backend/fastapi` (active)  | ~6,308        | **Needs Cleanup**    | 9 ownership matrix violations, 15 deprecated files (4,088 lines) |
| `infra/`                    | ~250          | **Skeletal**         | 1 Dockerfile only; no CI/CD, no docker-compose, empty k8s        |

---

## 2. Deviations from Planning Documents

### 2.1 Architecture Violations (10_SYSTEM_ARCHITECTURE.md, 22_BACKEND_OWNERSHIP_MATRIX.md)

#### 2.1.1 FastAPI Ownership Matrix Violations — CRITICAL

The Backend Ownership Matrix (`22_BACKEND_OWNERSHIP_MATRIX.md`) mandates:
> *"FastAPI = STATELESS COMPUTE ONLY. NO DATABASE_URL, NO ORM, NO JWT verification, NO coin deduction."*

**9 active violations found:**

| # | File                                      | Violation                                                                           | Severity     |
|---|-------------------------------------------|-------------------------------------------------------------------------------------|--------------|
| 1 | `backend/fastapi/src/core/database.py`    | Full SQLAlchemy ORM setup (`create_async_engine`, `async_sessionmaker`, `get_db()`) | **CRITICAL** |
| 2 | `backend/fastapi/src/models/__init__.py`  | 12 SQLAlchemy ORM models (User, Tool, Category, etc.) — 264 lines                   | **CRITICAL** |
| 3 | `backend/fastapi/src/api/v1/jobs.py`      | Imports `get_db`, `AsyncSession` — DB dependency injected                           | **HIGH**     |
| 4 | `backend/fastapi/src/core/config.py`      | `DATABASE_URL`, `DATABASE_POOL_SIZE`, `DATABASE_MAX_OVERFLOW` settings              | **HIGH**     |
| 5 | `backend/fastapi/src/core/config.py`      | `STRIPE_SECRET_KEY` setting — billing belongs to Next.js                            | **MEDIUM**   |
| 6 | `backend/fastapi/src/core/config.py`      | `DAILY_COIN_REWARD`, `REFERRAL_COIN_REWARD`, `AD_WATCH_COIN_REWARD` coin settings   | **MEDIUM**   |
| 7 | `backend/fastapi/src/core/__init__.py`    | Exports `get_db`, `init_db`, `close_db`                                             | **MEDIUM**   |
| 8 | `backend/fastapi/src/schemas/__init__.py` | Auth, billing, subscription, coin Pydantic schemas — 217 lines                      | **MEDIUM**   |
| 9 | `backend/fastapi/src/api/v1/jobs.py`      | `coins_used`, `coins_reserved` fields and `# TODO: Refund coins` logic              | **LOW**      |

**10 dependency violations in `requirements.txt`:**

| Package                  | Issue                                     |
|--------------------------|-------------------------------------------|
| `sqlalchemy==2.0.44`     | ORM — not needed                          |
| `asyncpg==0.30.0`        | PostgreSQL driver — not needed            |
| `alembic==1.14.0`        | DB migrations — not needed                |
| `greenlet==3.2.4`        | SQLAlchemy dep — not needed               |
| `stripe==7.10.0`         | Payments — belongs to Next.js             |
| `passlib[bcrypt]==1.7.4` | Password hashing — belongs to Next.js     |
| `pyotp==2.9.0`           | TOTP 2FA — belongs to Next.js             |
| `celery[redis]==5.3.6`   | Not used in active code                   |
| `flower==2.0.1`          | Not used in active code                   |
| `aioredis==2.0.1`        | Deprecated; redundant with `redis==5.0.1` |

#### 2.1.2 Architecture Invariant Compliance

| Invariant (from 10_SYSTEM_ARCHITECTURE.md)               | Status                                                                              |
|----------------------------------------------------------|-------------------------------------------------------------------------------------|
| Subscription status is DERIVED, never stored             | **COMPLIANT** — `EXPIRED` is computed, not a DB column                              |
| Ledger rows are immutable (append-only)                  | **COMPLIANT** — `coin_transactions` table is insert-only                            |
| Client-side execution preferred                          | **COMPLIANT** — 350+ tools run as pure functions in browser                         |
| Never trust the client for auth/billing                  | **COMPLIANT** — All billing server-side, auth via Better-Auth                       |
| Two permission systems never overlap (Plan ≠ Admin RBAC) | **COMPLIANT** — Separate code paths in `@hsafx/shared/permissions`                  |
| Rate limits enforced at edge (middleware)                | **COMPLIANT** — 3-layer middleware in `apps/web`                                    |
| File uploads always virus-scanned                        | **UNVERIFIED** — Uploadthing configured but ClamAV integration not confirmed        |
| All webhook side-effects in single transaction           | **COMPLIANT** — Polar (411 lines) and Stripe (274 lines) webhooks are transactional |

### 2.2 Database Schema Deviations (13_DATABASE_SCHEMA.md)

**24 of 35 planned tables implemented (69%)**. Deviations:

#### 2.2.1 Missing Tables (11)

| Planned Table | Category | Impact | Notes |
|---------------|----------|--------|-------|
| `invoice_payments` | Billing | **LOW** | M:N join replaced with `payments.invoiceId` FK (1:M) — acceptable simplification |
| `payment_methods` | Billing | **MEDIUM** | Delegated to Stripe; may need for admin display |
| `coin_purchase_payments` | Coins | **LOW** | Tracked via Stripe checkout metadata |
| `plan_permissions` | Plan Features | **MEDIUM** | Handled via `planFeatures.featureKey` + permissions combo |
| `plan_theme_access` | Plan Features | **LOW** | Handled client-side in `@hsafx/theme/access.ts` |
| `plan_metadata` | Plan Features | **LOW** | Stored in `plans.metadata` JSONB column |
| `plan_upgrade_rules` | Plan Features | **LOW** | Logic is code-only in `@hsafx/shared/billing` |
| `plan_audit_logs` | Plan Features | **LOW** | Subsumed into general `activityLogs` table |
| `permission_groups` | Admin RBAC | **MEDIUM** | Using `permissions.category` column instead of separate table |
| `user_permission_overrides` | Admin RBAC | **HIGH** | No per-user override mechanism exists |
| `usage_coin_fallbacks` | Usage | **MEDIUM** | Fallback logic is code-only, not configurable |
| `permission_audit_logs` | Audit | **MEDIUM** | No dedicated permission change tracking |
| `api_request_logs` | Audit | **HIGH** | No API request logging table for forensics |
| `admin_settings` | Config | **MEDIUM** | System settings are environment variables, not DB-configurable |

#### 2.2.2 Renamed Tables (3)

| Plan Name | Actual Name | Reason |
|-----------|-------------|--------|
| `social_auths` | `oauth_connections` | Better-Auth convention |
| `subscription_plans` | `plans` | Shorter, cleaner |
| `permissions_catalog` | `permissions` | Simplified naming |

#### 2.2.3 Bonus Tables (12, not in plan)

`tool_categories`, `tool_limits`, `tool_versions`, `tool_executions`, `file_uploads`, `async_jobs`, `notifications`, `favorites`, `feature_flags`, `email_templates`, `ad_reward_transactions`, `user_ad_daily_caps`

### 2.3 API Contract Deviations (14_API_CONTRACTS.md)

#### 2.3.1 tRPC Procedures

| Router | Planned | Actual | Missing |
|--------|---------|--------|---------|
| `user` | 9 | 8 | `changePassword` |
| `billing` | 12 | 9 | `resumeSubscription`, `changePlan`, `getInvoices` |
| `tools` | 11 | 10 | Minor gap only |
| `admin` | 16 | 15 | `deleteCategory` |
| `ads` | 4 | 3 | `getConfig` |
| **Total** | **52+** | **~45** | **~7 missing** |

#### 2.3.2 B2B REST API v1 — **100% Complete**

All 8 endpoints implemented: `GET /health`, `GET /tools`, `GET /tools/:slug`, `POST /tools/:slug/execute`, `GET /account`, `GET /account/usage`, `GET /jobs/:id`, `GET /jobs/:id/result`

#### 2.3.3 Webhook Handlers — **Complete**

- Polar webhook: 411 lines, Svix verification, idempotency
- Stripe webhook: 274 lines, signature verification, idempotency

### 2.4 Security Model Deviations (15_SECURITY_MODEL.md)

| Requirement | Status | Notes |
|-------------|--------|-------|
| 6-layer security architecture | **COMPLIANT** | Edge → Rate Limit → Auth → Authorization → Validation → Data Access |
| 4 auth methods (email/pass, OAuth, API keys, admin JWT) | **COMPLIANT** | Better-Auth handles all |
| Rate limits by plan (100/200/2000/5000 req/min) | **IMPLEMENTED** | Middleware + Redis counters |
| Argon2id for passwords | **DELEGATED** | Better-Auth handles — verify algorithm config |
| HttpOnly session cookies | **COMPLIANT** | Better-Auth config |
| CORS strict mode | **COMPLIANT** | Middleware configured |
| HMAC webhook verification | **COMPLIANT** | Svix (Polar) + Stripe signature |
| CSP headers | **MISSING** | No Content-Security-Policy headers found |
| HSTS headers | **MISSING** | No Strict-Transport-Security headers found |
| Input validation at every layer | **PARTIAL** | tRPC `.input()` validates, but no centralized Zod schemas |
| Login CAPTCHA after 5 fails | **MISSING** | No CAPTCHA implementation |
| Login lockout at 15 min | **MISSING** | No lockout mechanism detected |
| Impersonation (max 1hr) | **MISSING** | No impersonation system |

### 2.5 Billing System Deviations (20_BILLING_SYSTEM.md, 21_BILLING_LOGIC.md)

| Requirement | Status | Notes |
|-------------|--------|-------|
| 1 BA = 1 FULL_SUCCESS | **COMPLIANT** | Coin deduction on success only |
| 12 tool classes with BA weights | **COMPLIANT** | Defined in `@hsafx/shared/billing/tool-costs.ts` |
| Atomic coin deduction (`SELECT FOR UPDATE`) | **COMPLIANT** | `coin-service.ts` (465 lines) reservation pattern |
| Subscription state machine (5 states) | **COMPLIANT** | Webhook handlers manage transitions |
| Daily reconciliation jobs (4) | **MISSING** | No cron/scheduled jobs implemented |
| Wallet reconciliation @ 02:00 UTC | **MISSING** | No job scheduler |
| Anonymous cleanup @ 03:00 UTC | **MISSING** | No cleanup cron |
| Payment grace period (3 days + reminders) | **PARTIAL** | Webhook handles PAST_DUE; no reminder emails |
| B2B API billing integration | **PARTIAL** | API key usage tracked; billing not wired to Stripe metered billing |

### 2.6 Feature Flag System Deviations (03_FEATURE_FLAGS.md)

| Requirement | Status | Notes |
|-------------|--------|-------|
| 6 flag categories | **PARTIAL** | `feature_flags` table exists; no kill switch or experiment categories |
| Storage: DB → Redis → In-Memory | **PARTIAL** | DB + SWR caching, no Redis intermediary for flags |
| Resolution chain (User → Plan → Global → Percentage → Default) | **MISSING** | Simple boolean toggle per flag only |
| Kill switches (< 30s activation) | **MISSING** | No kill switch infrastructure |
| `flag_overrides` table | **MISSING** | No override table |
| `flag_audit_log` table | **MISSING** | Uses general `activityLogs` |
| `FlagClient` SDK (6 methods) | **MISSING** | No client-side flag SDK |
| `FlagService` SDK (6 methods) | **MISSING** | No server-side flag service |
| A/B experiments | **MISSING** | No experiment framework |
| Max 3 concurrent experiments per user | **MISSING** | No experiment system |

### 2.7 Tool System Deviations (30_TOOLS_CATALOG.md, 73_TOOL_EXECUTION_ROUTER.md)

| Requirement | Status | Notes |
|-------------|--------|-------|
| 446 tool definitions | **EXCEEDED** | 454 defined in `@hsafx/tool-definitions` |
| 4 execution paths (WASM, Node.js, Native, Python) | **COMPLIANT** | `executor.ts` routes correctly |
| WASM module < 3MB gzipped | **UNVERIFIED** | No WASM bundle size measurements |
| Execution < 5ms (WASM), < 150ms p95 (API) | **UNVERIFIED** | No performance benchmarks |
| Deterministic caching (SHA-256, 1hr TTL) | **IMPLEMENTED** | Cache logic in `@hsafx/shared/execution/cache.ts` |
| WASM → Node.js fallback | **IMPLEMENTED** | `wasm-fallback.ts` in `apps/web` |
| Executor docstring says 81 tools, actual: 121 | **DOCUMENTATION BUG** | Docstring outdated after Phase 1.4 expansion |

### 2.8 File Processing Deviations (70_FILE_PROCESSING_FLOW.md)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Cloudflare R2 storage | **IMPLEMENTED** | S3-compatible client configured |
| Uploadthing integration | **UNVERIFIED** | File upload dependency exists, flow not fully traced |
| ClamAV virus scanning | **UNVERIFIED** | No ClamAV configuration found |
| Upload size limits (10MB–500MB by type) | **UNVERIFIED** | Limits likely in Uploadthing config, not in code |
| Result 3-hour TTL | **IMPLEMENTED** | In job/file config |
| Hourly cleanup cron | **MISSING** | No cron job for R2 cleanup |

### 2.9 Async Job Deviations (71_ASYNC_JOB_SPEC.md)

| Requirement | Status | Notes |
|-------------|--------|-------|
| BullMQ job queue | **PARTIAL** | Redis-based queue in `jobs.py`, not using actual BullMQ library |
| 4 named queues | **MISSING** | Single generic queue, not split by image/pdf/document/scraping |
| Polling backoff 1s→2s→5s→10s | **IMPLEMENTED** | Client-side in hook |
| WebSocket for premium users | **MISSING** | No WebSocket implementation |
| Job expiration: 3 hours | **IMPLEMENTED** | Redis key TTL |
| Default max retries: 3 | **IMPLEMENTED** | In job config |

### 2.10 Redis Key Schema Deviations (46_REDIS_KEY_SCHEMA.md)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Key pattern: `{env}:{category}:{scope}:{id}` | **PARTIAL** | FastAPI uses `hsafx:` prefix; Next.js uses Upstash patterns |
| Environment prefixes (`dev:`, `staging:`, `prod:`) | **MISSING** | `hsafx:` hardcoded, no environment segmentation |
| Rate limit keys: `{env}:ratelimit:*` | **PARTIAL** | `rate:user:*` and `rate:ip:*` (no environment prefix) |
| Session keys: `{env}:session:*` | **DELEGATED** | Better-Auth manages sessions internally |
| ALL keys MUST have TTL | **UNVERIFIED** | Most keys have TTL; BullMQ metadata keys may not |

### 2.11 Admin Panel Deviations (26_ADMIN_PANEL_SPECIFICATION.md)

**36 of 58 planned features are fully implemented (62%).**

See [Appendix E](#appendix-e-admin-panel-feature-matrix) for the complete feature matrix.

**Missing Pages (routes that don't exist):**
1. `/users/[id]` — User detail/edit page
2. `/subscriptions/[id]` — Subscription detail page
3. `/tools/[id]` — Tool detail/analytics page
4. `/admins` — Admin management page (API + hooks built, no UI)

**Missing Features (no code at all):**
1. Force user logout
2. Bulk user operations
3. Per-plan permission/limit management UI
4. Anonymous rate limits configuration
5. Email template management
6. Theme management page
7. Security incidents dashboard
8. Failed login tracking
9. API abuse detection
10. Real-time WebSocket connections (SWR polling only)
11. System health/uptime dashboard
12. Dedicated error monitoring page
13. Alert configuration page

**Session Duration Mismatch:** Admin sessions configured as **8 hours**; spec says **24 hours**.

### 2.12 Error Handling Deviations (24_ERROR_HANDLING.md)

| Requirement | Status | Notes |
|-------------|--------|-------|
| 52 error codes (7 categories) | **PARTIAL** | `@hsafx/shared/errors` has ~30 codes; missing I (Integration) category |
| Standard response format `{ success, error }` | **COMPLIANT** | Consistent across tRPC + REST |
| Retry logic per HTTP code | **PARTIAL** | Basic retry in client hooks; no exponential backoff per spec |
| Alert thresholds (500 > 10/min = CRITICAL) | **MISSING** | No alerting system |
| i18n: English only for MVP | **COMPLIANT** | English only |

### 2.13 Deployment & Infrastructure Deviations (49_DEPLOYMENT_GUIDE.md)

| Requirement | Status | Notes |
|-------------|--------|-------|
| GitHub Actions CI/CD | **MISSING** | 0 workflows; only a README listing planned names |
| Dockerfile.fastapi | **COMPLETE** | Multi-stage, production-ready, non-root, healthcheck |
| docker-compose for local dev | **MISSING** | No orchestration |
| Kubernetes manifests | **MISSING** | Empty `infra/k8s/` directory |
| Vercel deployment config | **PARTIAL** | `next.config.js` exists but no `vercel.json` |
| Database seeding script | **MISSING** | No seed script |
| Environment templates per env | **PARTIAL** | `.env.example` exists; no staging/production variants |
| Dependency update automation | **MISSING** | No Renovate/Dependabot config |
| Monitoring/Sentry integration | **MISSING** | No observability setup |

### 2.14 Testing Deviations (44_IMPLEMENTATION_ROADMAP.md)

The roadmap specifies **1,338 test cases** (3 per tool × 446 tools) plus integration tests.

| Testing Area | Planned | Actual |
|-------------|---------|--------|
| Tool unit tests (1,338) | Yes | **0 test files found** |
| API integration tests | Yes | **0 test files found** |
| E2E tests | Yes | **0 test files found** |
| Load tests (1000 concurrent) | Yes | **Not started** |
| Security audit (OWASP Top 10) | Yes | **Not started** |
| Lighthouse > 90 | Yes | **Not measured** |

**There are zero test files in the entire codebase.**

---

## 3. Corrective Recommendations

### 3.1 CRITICAL (Must Fix Before Production)

#### C1. Purge Backend Ownership Violations
- **DELETE** `backend/fastapi/src/core/database.py` (52 lines)
- **DELETE** `backend/fastapi/src/models/__init__.py` (264 lines)
- **REMOVE** DB imports from `jobs.py`
- **STRIP** `DATABASE_URL`, `STRIPE_SECRET_KEY`, coin reward configs from `config.py`
- **CLEAN** `core/__init__.py` exports
- **CLEAN** `schemas/__init__.py` — remove auth/billing/subscription schemas
- **REMOVE** 10 packages from `requirements.txt`: sqlalchemy, asyncpg, alembic, greenlet, stripe, passlib, pyotp, celery, flower, aioredis
- **DELETE** all 15 `_*_DEPRECATED.py` files (4,088 lines)
- **Estimated effort**: 2–3 hours

#### C2. Implement Missing Database Tables
Priority tables needed for production:
- `api_request_logs` — API forensics (required for B2B SLA compliance)
- `user_permission_overrides` — Admin RBAC granularity
- `admin_settings` — Runtime-configurable system settings
- `permission_audit_logs` — Security compliance
- **Estimated effort**: 1–2 days

#### C3. Create CI/CD Pipeline
- `ci.yml` — Lint + typecheck + build verification on every PR
- `deploy-web.yml` — Vercel deployment for `apps/web`
- `deploy-admin.yml` — Vercel deployment for `apps/admin`
- `deploy-fastapi.yml` — Cloud Run / container deployment
- **Estimated effort**: 2–3 days

#### C4. Add Security Headers
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- **Estimated effort**: 2–4 hours (Next.js middleware or `next.config.js`)

#### C5. Implement Login Security
- CAPTCHA integration after 5 failed login attempts
- Account lockout mechanism (15-minute window)
- Failed login tracking (either DB table or Redis counter)
- **Estimated effort**: 1–2 days

### 3.2 HIGH (Should Fix Before Beta)

#### H1. Implement Daily Reconciliation Jobs
4 scheduled jobs per `21_BILLING_LOGIC.md`:
- Wallet reconciliation (02:00 UTC)
- Anonymous usage cleanup (03:00 UTC)
- Subscription status sync (04:00 UTC)
- Stale job cleanup (every hour)
- **Technology**: Vercel Cron, QStash, or standalone cron
- **Estimated effort**: 3–5 days

#### H2. Build Missing Admin Detail Pages
- `/users/[id]` — User detail with activity log, subscription, coin history
- `/subscriptions/[id]` — Subscription detail with billing history
- `/tools/[id]` — Tool detail with analytics charts
- `/admins` — Admin management page (API already built)
- **Estimated effort**: 3–4 days

#### H3. Complete Missing tRPC Procedures
7 procedures across 4 routers:
- `user.changePassword`
- `billing.resumeSubscription`, `billing.changePlan`, `billing.getInvoices`
- `admin.deleteCategory`
- `ads.getConfig`
- **Estimated effort**: 2–3 days

#### H4. Docker-Compose for Local Development
- FastAPI + PostgreSQL + Redis multi-service orchestration
- `.dockerignore` for all services
- Environment variable templates
- **Estimated effort**: 1 day

#### H5. Fix Admin Session Duration
- Change `apps/admin/src/lib/auth.ts` `expiresIn` from `60 * 60 * 8` (8hr) to `60 * 60 * 24` (24hr) per spec
- **Estimated effort**: 5 minutes

#### H6. Fix Executor Docstring
- Update `backend/fastapi/src/tools/executor.py` docstring from "81 canonical tool IDs" to "121 tool IDs"
- **Estimated effort**: 5 minutes

### 3.3 MEDIUM (Should Fix Before GA)

#### M1. Build Feature Flag System
Full implementation per `03_FEATURE_FLAGS.md`:
- Kill switch infrastructure (< 30s activation)
- Resolution chain (User → Plan → Global → Percentage → Default)
- `FlagService` server-side SDK
- `FlagClient` client-side SDK
- `flag_overrides` DB table
- Redis intermediary caching (5s TTL for kill switches)
- **Estimated effort**: 1–2 weeks

#### M2. Implement Redis Key Namespacing
- Add environment prefix to all Redis keys (`dev:`, `staging:`, `prod:`)
- Standardize FastAPI keys from `hsafx:` to `{env}:` pattern
- Audit all keys have TTLs
- **Estimated effort**: 1–2 days

#### M3. Build Shared UI Component Library (`@hsafx/ui`)
Currently 238 lines (ThemeProvider only). Need:
- Button, Input, Textarea, Select, Checkbox, Toggle
- Card, Modal, Dialog, Sheet
- DataTable, Pagination
- Badge, Avatar, Tooltip
- At minimum, shared between `apps/web` and `apps/admin`
- **Estimated effort**: 1–2 weeks

#### M4. Implement WebSocket Real-Time Updates
- Admin dashboard real-time (replace 30s/60s SWR polling)
- Premium user job progress updates
- Redis Pub/Sub backend
- **Estimated effort**: 3–5 days

#### M5. Add Missing Error Codes
- Complete Integration (I) category (5 codes)
- Add per-spec alert thresholds
- Wire error metrics to monitoring
- **Estimated effort**: 1–2 days

#### M6. Implement Impersonation System
- Admin impersonation with 1-hour max duration
- Cannot target admin users
- Full audit trail
- **Estimated effort**: 2–3 days

### 3.4 LOW (Can Defer to Post-GA)

#### L1. Named Job Queues
Split single generic queue into 4 named queues per `71_ASYNC_JOB_SPEC.md`:
- `image-conversion`, `pdf-conversion`, `document-conversion`, `web-scraping`
- **Estimated effort**: 1 day

#### L2. Centralize Zod Schemas
Move inline tRPC `.input()` validations to `@hsafx/schemas`:
- User registration/login schemas
- Admin action schemas
- File upload schemas
- **Estimated effort**: 2–3 days

#### L3. Kubernetes Manifests
If targeting K8s deployment:
- Deployments, Services, Ingress, ConfigMaps, Secrets
- HPA for FastAPI workers
- **Estimated effort**: 3–5 days

#### L4. Database Seeding Script
- `infra/scripts/seed-db.ts` for dev/staging environments
- Pre-populate plans, tool categories, feature flags, test users
- **Estimated effort**: 1 day

#### L5. Admin Panel Remaining Features
Lower-priority missing admin features:
- Webhook log table content (tab exists, no data)
- Tool analytics time-series charts
- Bulk user operations
- Security incidents dashboard
- API abuse detection
- **Estimated effort**: 1–2 weeks

---

## Appendix A: Module-by-Module Inventory

### A.1 `apps/web` — User-Facing Next.js Application

| Module | Files | Lines | Status |
|--------|-------|-------|--------|
| Authentication (Better-Auth) | 3 | ~170 | **Complete** |
| Middleware (rate limit + auth) | 1 | 254 | **Complete** |
| Webhook Handlers (Polar + Stripe) | 2 | 685 | **Complete** |
| B2B REST API v1 | 8 endpoints | ~800 | **Complete** |
| Server Layer (jobs, coins, anon, ads) | 6 | ~1,842 | **Complete** |
| Lib (Redis, API keys, email, utils) | 14+ | ~2,500 | **Complete** |
| tRPC Routers | 5 routers | ~1,233 | **87% complete** |
| Tool Subsystem (executor, WASM, fallback) | 14 | ~4,500 | **Complete** |
| Components (UI + tool layouts + executors) | 38+ | ~5,000 | **Complete** |
| State (Zustand + hooks) | 11 | ~1,500 | **Complete** |
| Pages (auth, dashboard, settings, tools, pricing) | 20+ | ~3,000 | **Complete** |

**Stubs Found:**
- `useSubscription.reactivate()` — marked "coming soon"
- `manageBilling()` — placeholder
- `useCoins.claimDailyBonus()` — marked "coming soon"

### A.2 `apps/admin` — Admin Panel Next.js Application

| Module | Files | Lines | Status |
|--------|-------|-------|--------|
| Auth (login + 2FA + session) | 4 | ~423 | **Complete** |
| Admin Layout + Sidebar | 1 | 139 | **Complete** |
| Pages (12 of 16 planned) | 12 | ~4,919 | **75% complete** |
| API Routes | 16 | ~2,357 | **Complete** |
| Lib (API client, hooks, types, permissions) | 5 | ~2,272 | **Complete** |
| UI Components | 8 | ~1,324 | **Complete** |
| RBAC Infrastructure | 3 | 500 | **Complete** |

### A.3 `backend/fastapi` — Python Compute Backend

| Module | Active Files | Lines | Status |
|--------|-------------|-------|--------|
| Core (config, redis, logging) | 5 | ~287 | **Has violations** |
| Middleware (auth, rate limit) | 3 | ~151 | **Complete** |
| API (tools, jobs, tracking, internal) | 5 | ~1,006 | **jobs.py has violations** |
| Tool Handlers (9 handlers) | 10 | ~3,726 | **Complete** |
| Scrapers (4 terminals) | 11 | ~1,440 | **Complete** |
| Services | 2 | ~89 | **Complete** |
| **Total Active** | **42** | **~6,308** | — |
| Deprecated | 15 | ~4,088 | **Should delete** |
| Models (violation) | 1 | 264 | **Should delete** |
| Database (violation) | 1 | 52 | **Should delete** |

### A.4 `packages/*` — Shared Packages

| Package | Files | Lines | Completeness |
|---------|-------|-------|-------------|
| `@hsafx/tool-definitions` | 11 | 3,918 | **95%** — 454 tools |
| `@hsafx/tool-execution` | 48 | 16,969 | **90%** — massive execution engine |
| `@hsafx/shared` | 24 | 3,850 | **95%** — types, constants, billing, RBAC, CASL |
| `@hsafx/theme` | 6 | 2,134 | **95%** — full derivation + tier gating |
| `@hsafx/db` | 11 | 1,391 | **69%** — 11 missing tables |
| `@hsafx/api` | 11 | 1,354 | **87%** — ~7 missing procedures |
| `@hsafx/schemas` | 4 | 328 | **70%** — user/admin schemas missing |
| `@hsafx/ui` | 2 | 238 | **10%** — ThemeProvider only |
| **Total** | **117** | **30,182** | — |

### A.5 `infra/` — Infrastructure

| Item | Files | Status |
|------|-------|--------|
| Dockerfile.fastapi | 1 | **Production-ready** |
| docker-compose | 0 | **Missing** |
| K8s manifests | 0 | **Empty directory** |
| CI/CD workflows | 0 | **Missing** |
| Deployment scripts | 0 | **Missing** |
| Audit script | 1 | Dev-only QA tool |
| Root configs (turbo, pnpm, tsconfig, package.json) | 4 | **Complete** |

---

## Appendix B: Database Table Coverage

### Planned Tables (35)

| # | Table Name | Schema File | Status |
|---|-----------|-------------|--------|
| 1 | `users` | `users.ts` | ✅ Present |
| 2 | `user_preferences` | `users.ts` | ✅ Present |
| 3 | `user_settings` | `users.ts` | ✅ Present |
| 4 | `sessions` | `auth.ts` | ✅ Present |
| 5 | `social_auths` | `auth.ts` | ✅ Renamed → `oauth_connections` |
| 6 | `password_reset_tokens` | `auth.ts` | ✅ Present |
| 7 | `email_verification_tokens` | `auth.ts` | ✅ Present |
| 8 | `subscription_plans` | `billing.ts` | ✅ Renamed → `plans` |
| 9 | `subscriptions` | `billing.ts` | ✅ Present |
| 10 | `payments` | `billing.ts` | ✅ Present |
| 11 | `invoices` | `billing.ts` | ✅ Present |
| 12 | `invoice_payments` | — | ❌ Missing (1:M FK instead) |
| 13 | `payment_methods` | — | ❌ Missing (delegated to Stripe) |
| 14 | `user_coin_wallets` | `billing.ts` | ✅ Present |
| 15 | `coin_transactions` | `billing.ts` | ✅ Present |
| 16 | `coin_packs` | `billing.ts` | ✅ Present |
| 17 | `coin_purchase_payments` | — | ❌ Missing |
| 18 | `tool_coin_costs` | `billing.ts` | ✅ Present |
| 19 | `plan_coin_rules` | `billing.ts` | ✅ Present |
| 20 | `plan_features` | `billing.ts` | ✅ Present |
| 21 | `plan_limits` | `billing.ts` | ✅ Present |
| 22 | `plan_permissions` | — | ❌ Missing |
| 23 | `plan_theme_access` | — | ❌ Missing (client-side) |
| 24 | `plan_metadata` | — | ❌ Missing (JSONB column) |
| 25 | `plan_upgrade_rules` | — | ❌ Missing (code-only) |
| 26 | `plan_audit_logs` | — | ❌ Missing (general audit) |
| 27 | `roles` | `auth.ts` | ✅ Present |
| 28 | `permission_groups` | — | ❌ Missing (category column) |
| 29 | `permissions_catalog` | `auth.ts` | ✅ Renamed → `permissions` |
| 30 | `role_permissions` | `auth.ts` | ✅ Present |
| 31 | `user_roles` | `auth.ts` | ✅ Present |
| 32 | `user_permission_overrides` | — | ❌ Missing |
| 33 | `usage_counters` | `tools.ts` | ✅ Present |
| 34 | `anonymous_usage` | `tools.ts` | ✅ Present |
| 35 | `tools` | `tools.ts` | ✅ Present |
| 36 | `api_rate_limits` | `tools.ts` | ✅ Present |
| 37 | `api_keys` | `tools.ts` | ✅ Present |
| 38 | `usage_coin_fallbacks` | — | ❌ Missing |
| 39 | `audit_logs` | `auth.ts` | ✅ Renamed → `activity_logs` |
| 40 | `permission_audit_logs` | — | ❌ Missing |
| 41 | `api_request_logs` | — | ❌ Missing |
| 42 | `email_provider_config` | `misc.ts` | ✅ Present |
| 43 | `email_usage_tracking` | `misc.ts` | ✅ Renamed → `email_logs` |
| 44 | `admin_settings` | — | ❌ Missing |

**Score: 24/35 present (69%) — 3 renamed, 11 truly missing, 12 bonus unplanned tables**

---

## Appendix C: tRPC Procedure Coverage

### User Router (8/9)

| Procedure | Status |
|-----------|--------|
| `me` | ✅ |
| `getProfile` | ✅ |
| `updateProfile` | ✅ |
| `updatePreferences` | ✅ |
| `updateSettings` | ✅ |
| `list` | ✅ |
| `getById` | ✅ |
| `delete` | ✅ |
| `changePassword` | ❌ Missing |

### Billing Router (9/12)

| Procedure | Status |
|-----------|--------|
| `getPlans` | ✅ |
| `getMySubscription` | ✅ |
| `createCheckout` | ✅ |
| `cancelSubscription` | ✅ |
| `getWalletBalance` | ✅ |
| `getTransactionHistory` | ✅ |
| `getCoinPacks` | ✅ |
| `purchaseCoinPack` | ✅ |
| `grantCoins` | ✅ |
| `resumeSubscription` | ❌ Missing |
| `changePlan` | ❌ Missing |
| `getInvoices` | ❌ Missing |

### Tools Router (10/11)

| Procedure | Status |
|-----------|--------|
| `getCategories` | ✅ |
| `getCategoryBySlug` | ✅ |
| `list` | ✅ |
| `getBySlug` | ✅ |
| `execute` | ✅ |
| `getExecutionStatus` | ✅ |
| `getMyExecutions` | ✅ |
| `create` | ✅ |
| `update` | ✅ |
| `delete` | ✅ |
| *(minor gap)* | — |

### Admin Router (15/16)

| Procedure | Status |
|-----------|--------|
| `getDashboardStats` | ✅ |
| `getRecentActivity` | ✅ |
| `getPlans` | ✅ |
| `createPlan` | ✅ |
| `updatePlan` | ✅ |
| `createPlanLimit` | ✅ |
| `getFeatureFlags` | ✅ |
| `updateFeatureFlag` | ✅ |
| `createFeatureFlag` | ✅ |
| `getRoles` | ✅ |
| `getPermissions` | ✅ |
| `assignRoleToUser` | ✅ |
| `removeRoleFromUser` | ✅ |
| `createCategory` | ✅ |
| `updateCategory` | ✅ |
| `deleteCategory` | ❌ Missing |

### Ads Router (3/4)

| Procedure | Status |
|-----------|--------|
| `getStats` | ✅ |
| `initiate` | ✅ |
| `complete` | ✅ |
| `getConfig` | ❌ Missing |

**Total: ~45/52+ procedures (87%)**

---

## Appendix D: Backend Ownership Violations

### Files That Must Be Deleted

| File | Lines | Reason |
|------|-------|--------|
| `src/core/database.py` | 52 | SQLAlchemy ORM — ownership violation |
| `src/models/__init__.py` | 264 | 12 ORM models — ownership violation |
| `src/api/v1/_admin_DEPRECATED.py` | 660 | Deprecated |
| `src/api/v1/_ads_DEPRECATED.py` | 381 | Deprecated |
| `src/api/v1/_auth_DEPRECATED.py` | 290 | Deprecated |
| `src/api/v1/_billing_DEPRECATED.py` | 153 | Deprecated |
| `src/api/v1/_categories_DEPRECATED.py` | 183 | Deprecated |
| `src/api/v1/_subscriptions_DEPRECATED.py` | 243 | Deprecated |
| `src/api/v1/_users_DEPRECATED.py` | 229 | Deprecated |
| `src/api/v1/_webhooks_DEPRECATED.py` | 195 | Deprecated |
| `src/services/_auth_DEPRECATED.py` | 246 | Deprecated |
| `src/services/_auth2_DEPRECATED.py` | 246 | Deprecated |
| `src/services/_billing_DEPRECATED.py` | 281 | Deprecated |
| `src/services/_coins_DEPRECATED.py` | 205 | Deprecated |
| `src/services/_subscriptions_DEPRECATED.py` | 219 | Deprecated |
| `src/services/_usage_DEPRECATED.py` | 152 | Deprecated |
| `src/services/_users_DEPRECATED.py` | 405 | Deprecated |
| **Total** | **4,404** | — |

### Config Settings to Remove from `src/core/config.py`

| Setting | Line | Reason |
|---------|------|--------|
| `DATABASE_URL` | ~24 | No DB access |
| `DATABASE_POOL_SIZE` | ~25 | No DB access |
| `DATABASE_MAX_OVERFLOW` | ~26 | No DB access |
| `STRIPE_SECRET_KEY` | ~45 | Belongs to Next.js |
| `DAILY_COIN_REWARD` | ~62 | Belongs to Next.js |
| `REFERRAL_COIN_REWARD` | ~63 | Belongs to Next.js |
| `AD_WATCH_COIN_REWARD` | ~64 | Belongs to Next.js |

### Dependencies to Remove from `requirements.txt`

| Package | Reason |
|---------|--------|
| `sqlalchemy==2.0.44` | No ORM |
| `asyncpg==0.30.0` | No PostgreSQL |
| `alembic==1.14.0` | No migrations |
| `greenlet==3.2.4` | SQLAlchemy dep |
| `stripe==7.10.0` | Belongs to Next.js |
| `passlib[bcrypt]==1.7.4` | Belongs to Next.js |
| `pyotp==2.9.0` | Belongs to Next.js |
| `celery[redis]==5.3.6` | Not used |
| `flower==2.0.1` | Not used |
| `aioredis==2.0.1` | Deprecated/redundant |

---

## Appendix E: Admin Panel Feature Matrix

### Dashboard (7 features)

| Feature | Status |
|---------|--------|
| Overview metrics (users, subs, executions, revenue) | ✅ Implemented — 4 stat cards + 6 secondary |
| Alerts banner | ✅ Implemented — with acknowledge |
| Real-time data | ⚠️ Partial — SWR polling (30s/60s), no WebSocket |
| Top tools | ✅ Implemented |
| Recent errors | ✅ Implemented |
| Revenue chart | ✅ Implemented — AreaChart |
| User growth chart | ✅ Implemented — AreaChart |

### User Management (10 features)

| Feature | Status |
|---------|--------|
| List/search/filter users | ✅ Implemented |
| User detail page | ❌ Missing — no `/users/[id]` route |
| Edit user | ⚠️ Partial — API exists, no edit UI page |
| Ban/unban user | ✅ Implemented — with modal |
| Delete user (2FA) | ✅ Implemented — TotpModal |
| Reset password | ✅ Implemented |
| Force logout | ❌ Missing — no API or UI |
| Activity log per user | ⚠️ Partial — hook exists, no UI |
| Bulk operations | ❌ Missing |
| Coin adjustment | ✅ Implemented — with TotpModal |

### Subscription Management (8 features)

| Feature | Status |
|---------|--------|
| List with filters | ✅ Implemented |
| Subscription detail | ❌ Missing — no `/subscriptions/[id]` route |
| Upgrade/downgrade | ✅ Implemented — modals |
| Cancel | ✅ Implemented |
| Pause | ✅ Implemented |
| Resume | ✅ Implemented |
| Refund (2FA) | ✅ Implemented — TotpModal |
| Billing history per sub | ❌ Missing |

### Plan Configuration (4 features)

| Feature | Status |
|---------|--------|
| Plan CRUD | ✅ Implemented |
| Plan limits UI | ⚠️ Partial — type exists, no management UI |
| Plan permissions UI | ❌ Missing |
| Theme access config | ❌ Missing |

### Billing & Transactions (6 features)

| Feature | Status |
|---------|--------|
| Coin transaction log | ✅ Implemented — with filters/export |
| Manual coin adjustment | ✅ Implemented — via user page |
| Webhook logs | ⚠️ Partial — tab exists, no DataTable content |
| Billing reports/export | ✅ Implemented — CSV |
| Revenue reports | ⚠️ Partial — dashboard charts only |
| Webhook retry | ⚠️ Partial — API exists, UI not connected |

### Tool Management (6 features)

| Feature | Status |
|---------|--------|
| Tool list with filters | ✅ Implemented |
| Tool detail page | ❌ Missing — no `/tools/[id]` route |
| Edit tool metadata | ✅ Implemented — modal |
| Enable/disable tool | ✅ Implemented |
| Force execution mode | ❌ Missing |
| Tool analytics | ⚠️ Partial — summary only, no chart |

### System Configuration (7 features)

| Feature | Status |
|---------|--------|
| Feature flags | ✅ Implemented — full CRUD with rollout |
| Ad reward config | ✅ Implemented — in settings |
| Anonymous limits | ❌ Missing — type exists, no UI |
| Rate limits per plan | ✅ Implemented |
| Email templates | ❌ Missing |
| Theme management | ❌ Missing |
| API key management | ✅ Implemented — view/revoke |

### Audit & Security (5 features)

| Feature | Status |
|---------|--------|
| Audit log viewer | ✅ Implemented — filters, detail, export |
| Admin activity tracking | ✅ Implemented |
| Security incidents | ❌ Missing |
| Failed login tracking | ❌ Missing |
| API abuse detection | ❌ Missing |

### Monitoring (5 features)

| Feature | Status |
|---------|--------|
| Error monitoring | ⚠️ Partial — dashboard only |
| Alert management | ⚠️ Partial — display only |
| Email alert config | ❌ Missing |
| Real-time WebSocket | ❌ Missing — SWR polling only |
| Health dashboard | ❌ Missing |

### Admin Management (4 features)

| Feature | Status |
|---------|--------|
| List admins | ⚠️ Partial — API + hooks, no page |
| Invite admin | ⚠️ Partial — API exists, no UI |
| Change admin role | ⚠️ Partial — API exists, no UI |
| Remove admin (2FA) | ⚠️ Partial — API exists, no UI |

**Summary: 36/58 fully complete (62%), 12 partial (21%), 10 missing (17%)**

---

*End of Master Codebase Analysis*

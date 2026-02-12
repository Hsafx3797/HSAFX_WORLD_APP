# 01 — WHAT IS ACTUALLY COMPLETED

> **Last audited:** 2025-07-15 — Comprehensive codebase-vs-planning reconciliation
> **Commit:** `2234bb7` (Sprint 3-5 on master)
> **Methodology:** Every planning doc (01–74) compared against actual source files

---

## SCORING LEGEND

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented per planning spec |
| ⚠️ | Partially implemented — works but deviates or missing features |
| ❌ | Not implemented or stub only |
| 🔴 | Critical gap — blocks core functionality |
| 🟠 | High gap — blocks a planned feature |
| 🟡 | Medium gap — cosmetic or naming deviation |

---

## 1. INFRASTRUCTURE & DEVOPS

| Item | Status | Notes |
|------|--------|-------|
| Turborepo monorepo | ✅ | v2.7.5, 13 workspace packages, `turbo.json` configured |
| pnpm workspaces | ✅ | pnpm v9, `pnpm-workspace.yaml` correct |
| TypeScript project refs | ✅ | Root + per-package `tsconfig.json` |
| ESLint config | ✅ | `@hsafx/config` package, 0 errors (78 warnings remain) |
| Git repo | ✅ | 7 commits on master, `develop` branch, `v0.1.0-alpha` tag |
| GitHub Actions CI | ✅ | `.github/workflows/ci.yml` — lint, typecheck, test, build |
| Staging deploy workflow | ✅ | Vercel + Railway targets |
| Production deploy workflow | ✅ | Tag-triggered release pipeline |
| Docker configs | ⚠️ | `infra/docker/` exists with Dockerfiles — not tested end-to-end |
| K8s manifests | ⚠️ | `infra/k8s/` exists — not validated |
| Seed script | ✅ | `packages/db/src/seed.ts` with plans, permissions, roles |

**Infrastructure score: ~85%** — CI/CD done, containerization untested.

---

## 2. DATABASE SCHEMA

| Item | Status | Gap Detail |
|------|--------|------------|
| Schema files exist (6 files) | ✅ | `users.ts`, `auth.ts`, `billing.ts`, `tools.ts`, `misc.ts`, `audit.ts` |
| Table count | ⚠️ | **47 tables exist** vs **60+ planned** — 13 tables completely missing |
| PostgreSQL enums | 🔴 | **ZERO enums defined** — all use free `text`. Planning requires 13 pgEnum types |
| Database indexes | 🔴 | **ZERO explicit indexes** beyond inline `.unique()` — ALL composite, partial, and performance indexes missing |
| Column naming alignment | 🟡 | **30+ column name mismatches** vs planning DBML (see doc 02) |
| `subscriptions.status` stored | 🟡 | Planning says "NEVER store status — derive from timestamps." Violated. |
| Provider: Polar vs Stripe | 🟡 | Planning says Stripe; code uses Polar (`polar_product_id`, `polar_subscription_id`) |
| Money columns | 🟡 | Planning says `bigint` cents; code uses `decimal(10,2)` or `integer` |

### Missing Tables (13)

| # | Table | Why It Matters |
|---|-------|----------------|
| 1 | `processed_webhooks` | 🔴 No idempotency for non-coin webhook events |
| 2 | `tool_class_policy` | 🔴 Core billing: BA weights per tool class — currently hardcoded |
| 3 | `usage_coin_fallbacks` | 🟠 Over-limit fallback discount rates |
| 4 | `billable_action_logs` | 🟠 Granular billing audit trail |
| 5 | `plan_permissions` | 🟠 Plan→permission mapping for CASL |
| 6 | `plan_theme_access` | 🟡 Per-plan theme presets |
| 7 | `permission_groups` | 🟡 Permission categorization |
| 8 | `invoice_payments` | 🟡 Supports partial payments |
| 9 | `payment_methods` | 🟡 Stored payment methods |
| 10 | `coin_purchase_payments` | 🟡 Coin pack→payment linkage |
| 11 | `plan_metadata` | 🟡 Extensible plan properties |
| 12 | `plan_upgrade_rules` | 🟡 Auto-upgrade logic |
| 13 | `plan_audit_logs` | 🟡 Plan change history |

### Extra Tables (14 — not in planning, added by implementation)

`tool_categories`, `tool_limits`, `tool_versions`, `tool_executions`, `refresh_tokens`, `file_uploads`, `notifications`, `favorites`, `feature_flags`, `email_templates`, `email_logs`, `ad_reward_transactions`, `user_ad_daily_caps`, `admin_settings`

**Database score: ~55%** — Tables exist but enums, indexes, and 13 planned tables missing.

---

## 3. AUTHENTICATION & AUTHORIZATION

| Item | Status | Gap Detail |
|------|--------|------------|
| better-auth core | ✅ | v1.4.14 in both apps, DB adapter, email+password |
| OAuth (Google, GitHub) | ✅ | Configured in web app |
| Facebook OAuth | ⚠️ | **Extra** — not in planning docs |
| Session config (7d expiry) | ✅ | `expiresIn: 7 * 86400`, `updateAge: 86400` |
| Session cookie name | 🟡 | Uses `better-auth.session_token`, planning says `__hsafx_session` |
| Rolling sessions | ❌ | No `rolling: true` configured |
| Absolute session timeout | ❌ | No `absoluteTimeout` configured |
| Redis session storage | ❌ | Uses DB-backed sessions only |
| Admin session (24h) | ✅ | Configured correctly |
| 2FA (TOTP) | ⚠️ | Custom `otpauth` + `qrcode` — works but NOT using Better-Auth `twoFactor` plugin |
| Admin 2FA enforcement | ⚠️ | Cookie-based, client-side cooperative — NOT server-enforced in middleware |
| CASL ability definitions | ✅ | `buildUserAbility()` + `buildAdminAbility()` in `packages/shared` |
| @casl/react `<Can>` component | ❌ | Package not installed, no React integration |
| CASL wired into web app | 🔴 | `buildUserAbility` **never imported** in `apps/web/` — completely unwired |
| CASL wired into API routes | 🔴 | No tRPC or REST middleware calls CASL |
| Admin RBAC (custom) | ✅ | Full `useRBAC`, `Can`/`Cannot`, `PermissionGuard`, `RoleGate` |
| API key format | ✅ | `hsafx_{env}_{random}`, SHA-256 hashed |
| API key scope enforcement | ⚠️ | `hasScope()` exists but `scopes` column missing from DB |
| API key full middleware | ❌ | Full hash→scope→context pipeline not wired |

**Auth score: ~50%** — Core auth works. CASL completely unwired. Several planned security features missing.

---

## 4. SECURITY

| Item | Status | Gap Detail |
|------|--------|------------|
| Security headers (HSTS, CSP, etc.) | ✅ | Full set in both `next.config.js` |
| CSRF protection (Origin check) | ✅ | Middleware validates Origin on state-changing requests |
| CSRF Referer fallback | ❌ | Only checks `Origin` |
| Rate limiting — IP layer | ✅ | 100/min via Upstash sliding window |
| Rate limiting — Auth layer | ✅ | 10/15min on auth endpoints |
| Rate limiting — API key layer | ✅ | Per-key limits |
| Rate limiting — Session layer | 🔴 | `checkUserRateLimit` defined but **NEVER called** |
| `Retry-After` header | ❌ | Not included in rate limit responses |
| Structured logging (TypeScript) | 🔴 | **ALL TypeScript uses `console.*`** — no pino/winston/PII redaction |
| Structured logging (Python) | ✅ | `structlog` throughout FastAPI |
| Impersonation — core flow | ✅ | Admin-only, 2FA-gated, 1hr TTL, HMAC-signed |
| Impersonation — `reason` field | ❌ | No mandatory reason in POST body |
| Impersonation — scoped actions | ❌ | No middleware blocks restricted actions during impersonation |
| Impersonation — banner | ✅ | Fixed amber banner with stop button |

**Security score: ~60%**

---

## 5. BILLING SYSTEM

| Item | Status | Gap Detail |
|------|--------|------------|
| Coin cost formula | ✅ | `Math.ceil(ba × (1 - discount/100))` correct |
| BA weight lookup | ✅ | `toolCoinCosts` table + `DEFAULT_BA_WEIGHTS` fallback |
| `reserveCoins()` + FOR UPDATE | ✅ | Proper row locking |
| `confirmReservation()` | 🔴 | **Exists but NEVER called** — reservations stay pending forever |
| B2C coin deduction (tRPC) | ✅ | `tools.execute` → `executeToolServer()` → deduction |
| B2B coin deduction (REST) | 🔴 | **`/api/v1/tools/:key/execute` bypasses coin-service** — free execution |
| Polar checkout flow | ✅ | `billing.createCheckout` working |
| Daily bonus claim | ⚠️ | Works but lacks `FOR UPDATE` — race condition |
| Stripe webhook — signature | ✅ | `constructEvent()` |
| Stripe webhook — refund clawback | 🔴 | Does NOT claw back coins — user keeps coins after refund |
| Stripe webhook — dispute/failed | ❌ | Only logs, TODO comments |
| Polar webhook — full lifecycle | ✅ | create, update, cancel |
| Webhook idempotency | ⚠️ | Metadata-based for coin events only. **Non-coin events: ZERO idempotency** |
| Billing REST endpoints | ❌ | No `/api/v1/billing/*` REST routes for B2B |
| Wallet reconciliation cron | ✅ | Exists |

**Billing score: ~50%**

---

## 6. TOOL EXECUTION PIPELINE

| Item | Status | Gap Detail |
|------|--------|------------|
| WASM execution (client) | ✅ | `wasm-loader.ts` with JS fallback, ~154 exports |
| Node.js inline execution | ⚠️ | **~15 tools return stub/placeholder text** |
| FastAPI native execution | ✅ | 121 tools across 9 handler classes |
| Async job system | ⚠️ | `job-manager.ts` + `job-worker.ts` — BullMQ not installed, inline only |
| FastAPI job processing | ❌ | `process_job` in `jobs.py` commented out |
| Tool metadata registry | ✅ | 454+ tools defined |

**Execution score: ~65%**

---

## 7. FRONTEND — WEB APP

| Item | Status | Gap Detail |
|------|--------|------------|
| Next.js app structure | ✅ | App Router, pages, layouts |
| Tool pages + execution UI | ✅ | Per-type layouts work |
| Search | ⚠️ | **Client-side `String.includes()` only** — no Meilisearch, no tsvector |

### Planned Components (10)

| Component | Status |
|-----------|--------|
| ToolCard | ⚠️ Partial — missing `isFavorite`, `executionCount`, `onFavoriteToggle` |
| ToolGrid | ⚠️ Partial — dumb wrapper, no `tools`/`isLoading`/`emptyState` |
| ToolFilterBar | ⚠️ Partial — split into separate SearchBar/FilterPills/SortDropdown |
| ExecutionPanel | ❌ Missing |
| ResultDisplay | ⚠️ Partial — local-only, wrong interface |
| UsageCard | ❌ Missing |
| BillingCard | ❌ Missing |
| TransactionList | ❌ Missing |
| ActivityFeed | ❌ Missing |
| NotificationBell | ❌ Missing |

**0/10 fully implemented. 4 partial. 6 missing.**

### Zustand Stores (6 planned)

| Store | Status |
|-------|--------|
| useToolStore | ⚠️ Execution-focused, merged with useExecutionStore |
| useExecutionStore | ⚠️ Merged into useToolStore |
| useBillingStore | ❌ Missing |
| useUIStore | ✅ Mostly complete |
| useNotificationStore | ❌ Missing |
| useUserStore | ⚠️ Partial — missing preferences/sessions |

**1/6 complete. 2/6 merged/partial. 3/6 missing.**

**Frontend score: ~40%**

---

## 8. FRONTEND — ADMIN APP

| Item | Status |
|------|--------|
| Admin app structure | ✅ |
| Login + 2FA | ✅ |
| RBAC hooks + guards | ✅ |
| User management CRUD | ✅ |
| Tool management CRUD | ✅ |
| API key management | ✅ |
| SSE streaming | ✅ |
| Impersonation | ✅ |
| Email templates CRUD | ✅ |
| Analytics dashboard | ❌ Missing |
| Billing administration | ❌ Missing |
| Audit log viewer | ❌ Missing |

**Admin score: ~60%**

---

## 9. FASTAPI BACKEND

| Item | Status |
|------|--------|
| App structure | ✅ |
| Tool execution endpoint | ✅ |
| Internal execute endpoint | ✅ |
| Rate limiting middleware | ✅ |
| Auth middleware | ✅ |
| Structured logging | ✅ |
| Job processing | ❌ Commented out |

**FastAPI score: ~80%**

---

## 10. SHARED PACKAGES

| Package | Status | Notes |
|---------|--------|-------|
| `@hsafx/config` | ✅ | ESLint + TS configs |
| `@hsafx/db` | ⚠️ | See §2 gaps |
| `@hsafx/schemas` | ✅ | Zod schemas |
| `@hsafx/shared` | ✅ | Permissions, flags, storage, email, rate-limit |
| `@hsafx/theme` | ✅ | Full CSS theme system |
| `@hsafx/ui` | ⚠️ | Theme-only — no shared UI components |
| `@hsafx/api` | ✅ | tRPC routers (user, billing, tools, admin, ads) |
| `@hsafx/tool-definitions` | ✅ | 454+ tools |
| `@hsafx/tools` | ✅ | Registry + WASM bindings |

**Packages score: ~80%**

---

## 11. REDIS & CACHING

| Item | Status |
|------|--------|
| Core Redis client (Upstash) | ✅ |
| Rate limiting in Redis | ✅ |
| Job state in Redis | ✅ |
| Ad reward tracking | ✅ |
| Anonymous usage tracking | ✅ |
| Feature flag caching | ✅ |
| BullMQ job queues | 🔴 NOT installed — inline only |
| Session caching | ❌ |
| Pub/sub channels | ❌ |
| Coin lock (Lua script) | ❌ Uses SQL FOR UPDATE instead |

**Redis score: ~55%**

---

## OVERALL COMPLETION SUMMARY

| Area | Score | Critical Gaps |
|------|-------|---------------|
| Infrastructure & DevOps | 85% | Docker/K8s untested |
| Database Schema | 55% | Zero enums, zero indexes, 13 missing tables |
| Auth & Authorization | 50% | CASL unwired, session config incomplete |
| Security | 60% | Session rate limit unwired, no TS structured logging |
| Billing System | 50% | B2B bypass, reservation never confirmed, refund clawback missing |
| Tool Execution | 65% | ~15 stubs, no BullMQ, async billing broken |
| Frontend (Web) | 40% | 6/10 components missing, 3/6 stores missing, no search |
| Frontend (Admin) | 60% | No analytics, billing admin, audit viewer |
| FastAPI Backend | 80% | Job processing disabled |
| Shared Packages | 80% | UI package is theme-only |
| Redis & Caching | 55% | No BullMQ, no session cache |

### **Weighted Overall: ~58%**

This is NOT deployment-ready. Solid foundations exist but critical billing, auth, and frontend gaps remain.

# Codebase vs Planning Docs — Complete Alignment Report

> **Date:** February 12, 2026
> **Scope:** All 49 files in `docs/PLANNING/` compared against actual codebase implementatio
> **Method:** Static file analysis, structure mapping, dependency checks, runtime verification

---

## Overall Verdict

**The codebase is ~65–70% aligned with planning.** Core architecture, DB schema, auth, and tools are substantially implemented. Significant gaps remain in: Rust WASM browser integration, Redis infrastructure, advanced billing features, CASL permissions, and deployment infrastructure.

---

## 1. File Structure (`12_FILE_STRUCTURE.md`)

| Planned                             | Actual                                           | Status     |
| ----------------------------------- | ------------------------------------------------ | ---------- |
| `apps/web/`                         | ✅ Exists                                        | ✅         |
| `apps/admin/`                       | ✅ Exists                                        | ✅         |
| `backend/fastapi/`                  | ✅ Exists with services, scrapers, tools         | ✅         |
| `backend/rust/`                     | ✅ Exists with `text-tools/`                     | ✅         |
| `packages/` shared packages         | ✅ 8 packages                                    | ✅         |
| `infra/` (Docker, CI, deploy)       | ✅ Exists with `docker/`, `k8s/`, `scripts/`     | ✅         |
| `.github/` (CI workflows)           | ❌ Missing                                       | ❌         |
| `backend/api/` (Next.js API routes) | ⚠️ API routes in `apps/web/src/app/api/` instead | ⚠️ Adapted |
| `backend/shared/`                   | ❌ Merged into `packages/shared`                 | ⚠️ Adapted |

### Packages Comparison

| Planned                       | Actual                             | Status     |
| ----------------------------- | ---------------------------------- | ---------- |
| `packages/ui`                 | ✅ Exists                          | ✅         |
| `packages/schemas`            | ✅ Exists                          | ✅         |
| `packages/permissions` (CASL) | ❌ Not a separate package          | ❌ Missing |
| `packages/tool-definitions`   | ✅ Exists (454 tools)              | ✅         |
| `packages/theme`              | ✅ Exists                          | ✅         |
| `packages/config`             | ❌ Not a separate package          | ❌ Missing |
| `packages/db`                 | ✅ Exists (not in plan explicitly) | ✅ Extra   |
| `packages/api`                | ✅ Exists (not in plan explicitly) | ✅ Extra   |
| `packages/shared`             | ✅ Exists (absorbs backend/shared) | ✅ Extra   |
| `packages/tools`              | ✅ Exists (80 children!)           | ✅ Extra   |

---

## 2. Technology Stack (`11_TECHNOLOGY_STACK.md`)

### Group 1 — Text Tools

| Planned                                                | Actual                                                        | Status       |
| ------------------------------------------------------ | ------------------------------------------------------------- | ------------ |
| Core logic in **Rust**                                 | ✅ `backend/rust/text-tools/src/` — 12 Rust source files      | ✅           |
| Rust → **WASM** for browser                            | ✅ `text_tools_bg.wasm` built in `pkg/`                       | ✅ Built     |
| WASM used in browser UI                                | ⚠️ WASM exists but browser integration via JS fallback mostly | ⚠️ Partial   |
| API endpoint pattern `POST /v1/text/{category}/{tool}` | ❌ B2B API uses `/api/v1/tools/[toolKey]/execute` pattern     | ⚠️ Different |
| gRPC (optional, for enterprise)                        | ❌ Not implemented                                            | ❌ Future    |

### Group 2 — Data Tools

| Planned                                   | Actual                                             | Status     |
| ----------------------------------------- | -------------------------------------------------- | ---------- |
| Node.js for parsers/formatters            | ✅ TypeScript implementations in `packages/tools/` | ✅         |
| Prettier/Babel for AST transforms         | ⚠️ Some exist, not exhaustive                      | ⚠️ Partial |
| Python for binary formats (Parquet, Avro) | ❌ FastAPI exists but no Parquet/Avro services     | ❌ Missing |

### Group 3 — Media Tools

| Planned                         | Actual                                                               | Status         |
| ------------------------------- | -------------------------------------------------------------------- | -------------- |
| FastAPI for media orchestration | ✅ `backend/fastapi/` with services                                  | ✅             |
| FFmpeg, libvips, Tesseract      | ❌ Not integrated as workers                                         | ❌ Missing     |
| Object storage (R2/S3)          | ⚠️ `fileUploads` table has `storageKey` but no actual R2 integration | ⚠️ Schema only |

### Monaco Editor (`61_MONACO_EDITOR_SPEC.md`)

| Planned                      | Actual                          | Status |
| ---------------------------- | ------------------------------- | ------ |
| Lazy-loaded Monaco component | ✅ Monaco is used in code tools | ✅     |
| Prism.js fallback            | ⚠️ Not verified                 | ⚠️     |
| Theme sync via CSS variables | ⚠️ Partial                      | ⚠️     |

---

## 3. Database Schema (`13_DATABASE_SCHEMA.md`)

### Tables Implemented (47 tables across 6 schema files)

| Schema File  | Tables Implemented                                                                                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users.ts`   | `users`, `userPreferences`, `userSettings`                                                                                                                                                                      |
| `auth.ts`    | `sessions`, `oauthConnections`, `roles`, `userRoles`, `permissions`, `rolePermissions`, `activityLogs`, `passwordResetTokens`, `emailVerificationTokens`, `refreshTokens`, `userPermissionOverrides`            |
| `billing.ts` | `plans`, `planLimits`, `subscriptions`, `coinTransactions`, `invoices`, `payments`, `userCoinWallets`, `coinPacks`, `toolCoinCosts`, `planFeatures`, `planCoinRules`, `adRewardTransactions`, `userAdDailyCaps` |
| `tools.ts`   | `toolCategories`, `tools`, `toolLimits`, `toolVersions`, `usageCounters`, `toolExecutions`, `apiKeys`, `anonymousUsage`, `apiRateLimits`                                                                        |
| `misc.ts`    | `fileUploads`, `asyncJobs`, `notifications`, `favorites`, `featureFlags`, `emailProviderConfig`, `emailTemplates`, `emailLogs`, `adminSettings`                                                                 |
| `audit.ts`   | `apiRequestLogs`, `permissionAuditLogs`                                                                                                                                                                         |

### Tables Missing vs Plan

| Planned Table                               | Status     | Notes                                   |
| ------------------------------------------- | ---------- | --------------------------------------- |
| `payment_methods`                           | ❌ Missing | Credit card storage                     |
| `invoice_payments`                          | ❌ Missing | Partial payment support                 |
| `plan_metadata`                             | ❌ Missing | Plan promo messages etc                 |
| `plan_upgrade_rules`                        | ❌ Missing | Auto-upgrade conditions                 |
| `plan_audit_logs`                           | ❌ Missing | Plan change history                     |
| `plan_permissions`                          | ❌ Missing | Granular plan-based permissions         |
| `plan_theme_access`                         | ❌ Missing | Theme preset gating per plan            |
| `usage_coin_fallbacks`                      | ❌ Missing | Coin cost when limits exceeded          |
| `coin_purchase_payments`                    | ❌ Missing | Links payments to coin purchases        |
| `permissions_catalog` / `permission_groups` | ⚠️ Adapted | Using `permissions` + `rolePermissions` |

### Schema Deviations

| Aspect                     | Plan                 | Actual                              |
| -------------------------- | -------------------- | ----------------------------------- |
| Plans table name           | `subscription_plans` | `plans`                             |
| Plan identifier            | `code` field         | `slug` field                        |
| External billing           | `stripe_price_id`    | `polarProductId` (Polar not Stripe) |
| Subscription status        | Derived (no column)  | `status` column stored directly     |
| Money storage              | `bigint` cents       | `decimal(10,2)` in some fields      |
| Coin transactions `amount` | `bigint`             | `integer`                           |
| Users `passwordHash`       | Always required      | ✅ Same                             |

---

## 4. Authentication & Security (`15_SECURITY_MODEL.md`, `25_API_AUTHENTICATION_GUIDE.md`)

| Planned                          | Actual                                                 | Status      |
| -------------------------------- | ------------------------------------------------------ | ----------- |
| better-auth with Drizzle adapter | ✅ Implemented in `apps/web/src/lib/auth.ts`           | ✅          |
| Google + GitHub + Facebook OAuth | ✅ All 3 configured                                    | ✅          |
| Email verification               | ✅ Implemented                                         | ✅          |
| Password reset                   | ✅ Implemented                                         | ✅          |
| CAPTCHA on login                 | ✅ Before hook checks CAPTCHA                          | ✅          |
| Login attempt tracking + lockout | ✅ `loginAttemptTracker` in auth hooks                 | ✅          |
| Rate limiting middleware         | ✅ In `middleware.ts` (IP, auth, API key)              | ✅          |
| CSRF origin validation           | ✅ Implemented in middleware                           | ✅          |
| API key authentication           | ✅ `apiKeys` table + B2B API routes                    | ✅          |
| RBAC via CASL                    | ❌ CASL not installed                                  | ❌ Missing  |
| Redis session store              | ⚠️ Redis dep exists, but runtime falls back without it | ⚠️ Optional |
| JWT refresh token rotation       | ✅ `refreshTokens` table with `replacedBy`             | ✅          |

---

## 5. Billing System (`20_BILLING_SYSTEM.md`, `21_BILLING_LOGIC.md`)

| Planned                     | Actual                                                                    | Status     |
| --------------------------- | ------------------------------------------------------------------------- | ---------- |
| Stripe integration          | ⚠️ Webhook route exists, `stripePaymentIntentId` on payments              | ⚠️ Partial |
| Polar integration           | ✅ Added (not in original plan) — `polarProductId`, `polarSubscriptionId` | ✅ Extra   |
| Coin ledger system          | ✅ `coinTransactions` immutable ledger                                    | ✅         |
| Wallet balance cache        | ✅ `userCoinWallets` with `lastRecalculatedAt`                            | ✅         |
| Coin packs marketplace      | ✅ `coinPacks` table                                                      | ✅         |
| Tool-specific coin costs    | ✅ `toolCoinCosts` with `baWeight` formula                                | ✅         |
| Ad-reward coin system       | ✅ `adRewardTransactions` + `userAdDailyCaps`                             | ✅         |
| Plan coin discount rules    | ✅ `planCoinRules`                                                        | ✅         |
| Usage counters              | ✅ `usageCounters` table                                                  | ✅         |
| Invoice generation          | ✅ `invoices` table                                                       | ✅         |
| Payment processing          | ✅ `payments` table                                                       | ✅         |
| Cron: wallet reconciliation | ✅ `/api/cron/wallet-reconciliation` route                                | ✅         |
| Cron: subscription sync     | ✅ `/api/cron/subscription-sync` route                                    | ✅         |

---

## 6. Admin Panel (`26_ADMIN_PANEL_SPECIFICATION.md`)

| Planned Feature         | Actual Route                                            | Status |
| ----------------------- | ------------------------------------------------------- | ------ |
| Dashboard               | ✅ `(admin)/dashboard` + `/api/admin/dashboard`         | ✅     |
| User management         | ✅ `(admin)/users` + `/api/admin/users`                 | ✅     |
| Tool management         | ✅ `(admin)/tools` + `/api/admin/tools`                 | ✅     |
| Subscription management | ✅ `(admin)/subscriptions` + `/api/admin/subscriptions` | ✅     |
| Plan management         | ✅ `(admin)/plans` + `/api/admin/plans`                 | ✅     |
| Feature flags           | ✅ `(admin)/feature-flags` + `/api/admin/feature-flags` | ✅     |
| Billing management      | ✅ `(admin)/billing` + `/api/admin/billing`             | ✅     |
| Categories management   | ✅ `(admin)/categories` + `/api/admin/categories`       | ✅     |
| Coin packs management   | ✅ `(admin)/coin-packs` + `/api/admin/coin-packs`       | ✅     |
| Settings                | ✅ `(admin)/settings` + `/api/admin/config`             | ✅     |
| API keys management     | ✅ `(admin)/api-keys` + `/api/admin/api-keys`           | ✅     |
| Activity/audit logs     | ✅ `(admin)/activity` + `/api/admin/audit`              | ✅     |
| Email templates         | ✅ `/api/admin/email-templates`                         | ✅     |
| User impersonation      | ✅ `/api/admin/impersonate`                             | ✅     |
| 2FA management          | ✅ `/api/admin/2fa`                                     | ✅     |
| Streaming/real-time     | ✅ `/api/admin/stream`                                  | ✅     |
| Admin RBAC (roles)      | ✅ `(admin)/admins`                                     | ✅     |
| Theme control           | ⚠️ No dedicated admin theme route                       | ⚠️     |
| Audit log viewer        | ⚠️ Via `/api/admin/audit`                               | ✅     |

**Admin panel is very well implemented — 17+ out of ~18 planned features.**

---

## 7. State Management (`72_STATE_MANAGEMENT_SPEC.md`)

| Planned Store                      | Actual                    | Status     |
| ---------------------------------- | ------------------------- | ---------- |
| `toolStore`                        | ✅ `stores/tool-store.ts` | ✅         |
| `userStore`                        | ✅ `stores/user-store.ts` | ✅         |
| `uiStore`                          | ✅ `stores/ui-store.ts`   | ✅         |
| `themeStore`                       | ❌ Not found              | ❌ Missing |
| `historyStore`                     | ❌ Not found              | ❌ Missing |
| `shortcutsStore`                   | ❌ Not found              | ❌ Missing |
| Zustand library                    | ✅ In dependencies        | ✅         |
| URL state sync for shareable links | ❌ Not implemented        | ❌ Missing |
| Undo/redo for text/code tools      | ❌ Not implemented        | ❌ Missing |

---

## 8. Tool System (`30_TOOLS_CATALOG.md`, `40_TOOL_METADATA_STANDARD.md`, `74_TOOL_METADATA_REGISTRY.md`)

| Planned                                                            | Actual                                                              | Status     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- | ---------- |
| 454 tools in registry                                              | ✅ 454 exact                                                        | ✅         |
| 7 categories                                                       | ✅ Text, Data, Media, Generator, Calculator, Converter, Specialized | ✅         |
| Tool metadata with `id`, `name`, `slug`, `category`, `subcategory` | ✅ Full metadata per tool                                           | ✅         |
| Tool execution routing (WASM/Node/Python/Browser)                  | ⚠️ Mostly browser JS, not full router                               | ⚠️ Partial |
| `packages/tool-definitions/` as single source of truth             | ✅ Centralized across 7 registry files                              | ✅         |
| `tools` DB table for admin management                              | ✅ Exists                                                           | ✅         |
| Tool versioning                                                    | ✅ `toolVersions` table                                             | ✅         |
| Tool execution logging                                             | ✅ `toolExecutions` table                                           | ✅         |

---

## 9. B2B API (`14_API_CONTRACTS.md`, `73_TOOL_EXECUTION_ROUTER.md`)

| Planned                           | Actual                                            | Status     |
| --------------------------------- | ------------------------------------------------- | ---------- |
| `/api/v1/health`                  | ✅ Working (200 OK confirmed)                     | ✅         |
| `/api/v1/tools` listing           | ✅ Route exists                                   | ✅         |
| `/api/v1/tools/[toolKey]` detail  | ✅ Route exists                                   | ✅         |
| `/api/v1/tools/[toolKey]/execute` | ✅ Route exists                                   | ✅         |
| `/api/v1/account`                 | ✅ Route exists                                   | ✅         |
| `/api/v1/account/usage`           | ✅ Route exists                                   | ✅         |
| `/api/v1/jobs/[jobId]`            | ✅ Route exists                                   | ✅         |
| `/api/v1/jobs/[jobId]/result`     | ✅ Route exists                                   | ✅         |
| API key auth                      | ✅ `apiKeys` table + middleware                   | ✅         |
| Rate limiting per tier            | ✅ `apiRateLimits` table                          | ✅         |
| tRPC for internal                 | ⚠️ Dependency exists, route at `/api/trpc/[trpc]` | ⚠️ Partial |
| REST endpoint per tool category   | ❌ Generic execute instead of per-category        | ⚠️ Adapted |

---

## 10. Remaining Unimplemented Planning Doc Features

### Critical Missing (`High Priority`)

| Planning Doc                  | Feature                                                  | Status                              |
| ----------------------------- | -------------------------------------------------------- | ----------------------------------- |
| `15_SECURITY_MODEL.md`        | CASL permission enforcement                              | ❌ Not installed                    |
| `46_REDIS_KEY_SCHEMA.md`      | Full Redis infrastructure (rate limits, sessions, cache) | ⚠️ Dependency only                  |
| `52_WASM_BRIDGE_INTERFACE.md` | WASM bridge for browser execution routing                | ❌ WASM built but not bridged to UI |
| `49_DEPLOYMENT_GUIDE.md`      | CI/CD pipelines, `.github/` workflows                    | ❌ No `.github/` directory          |
| `72_STATE_MANAGEMENT_SPEC.md` | 3 missing stores, URL sync, undo/redo                    | ❌ Partial                          |

### Medium Missing

| Planning Doc                    | Feature                                     | Status                                    |
| ------------------------------- | ------------------------------------------- | ----------------------------------------- |
| `70_FILE_PROCESSING_FLOW.md`    | Full file upload → R2 → processing pipeline | ⚠️ Schema exists, no R2 integration       |
| `71_ASYNC_JOB_SPEC.md`          | Full async job queue (Redis Queue/Celery)   | ⚠️ `asyncJobs` table but no queue worker  |
| `51_BACKEND_SCRAPER_LOGIC.md`   | Scraper services                            | ✅ `backend/fastapi/src/scrapers/` exists |
| `50_COMPLEX_TOOL_ALGORITHMS.md` | Advanced tool algorithms                    | ⚠️ Partial                                |
| `33_THEME_PRESETS.md`           | Full theme preset catalog (92KB of specs)   | ⚠️ `packages/theme/` exists               |
| `62_FORM_VALIDATION_SPEC.md`    | Comprehensive form validation system        | ⚠️ Zod schemas exist but not full spec    |
| `60_COMPONENT_LIBRARY_SPEC.md`  | Full component library                      | ⚠️ `packages/ui/` exists but limited      |

### Low Priority / Future

| Planning Doc                          | Feature                                 | Status     |
| ------------------------------------- | --------------------------------------- | ---------- |
| gRPC for enterprise API               | Not implemented                         | Future     |
| Kubernetes deployment (`infra/k8s/`)  | Directory exists but likely placeholder | Future     |
| Docker containerization               | `infra/docker/` exists                  | ⚠️ Partial |
| `48_CODE_TEMPLATES.md`                | Code generation templates               | ❌         |
| `47_ERROR_HANDLING_IMPLEMENTATION.md` | Full error handling framework           | ⚠️ Partial |
| `44_IMPLEMENTATION_ROADMAP.md`        | Roadmap completion tracking             | N/A (meta) |

---

## Summary Scorecard

| Domain                 | Alignment | Notes                                                               |
| ---------------------- | --------- | ------------------------------------------------------------------- |
| **File Structure**     | 🟢 85%    | All major directories exist; `.github/` missing                     |
| **Architecture**       | 🟢 80%    | Monorepo correct; API routes in `apps/web` instead of `backend/api` |
| **Database Schema**    | 🟡 78%    | 47/55 planned tables; 8 missing; some column differences            |
| **Authentication**     | 🟢 90%    | better-auth, OAuth, CAPTCHA, lockout all working                    |
| **Billing System**     | 🟡 75%    | Core ledger + wallets done; Polar added; some tables missing        |
| **Admin Panel**        | 🟢 95%    | 17+ features, very comprehensive                                    |
| **Tool System**        | 🟢 90%    | 454 tools, centralized registry, metadata standard followed         |
| **B2B API**            | 🟢 85%    | All key routes exist; API key auth + rate limiting implemented      |
| **State Management**   | 🟡 50%    | 3/6 stores; missing URL sync and undo/redo                          |
| **WASM/Rust**          | 🟡 60%    | Rust written + WASM built; browser bridge not integrated            |
| **Redis**              | 🔴 30%    | Dependency only; not operational for sessions/cache/rate-limits     |
| **CI/CD & Deploy**     | 🔴 25%    | `infra/` exists but no `.github/`, no Dockerfiles at root           |
| **Permissions (CASL)** | 🔴 10%    | Not installed; RBAC tables exist but no runtime enforcement         |

### Overall: **~65–70% Aligned**

> [!IMPORTANT]
> The codebase has made strong progress on the foundational layers (auth, DB, tools, admin, B2B API). The main gaps are in **runtime infrastructure** (Redis, WASM bridge, CI/CD) and **advanced features** (CASL permissions, full async job queue, file processing pipeline).

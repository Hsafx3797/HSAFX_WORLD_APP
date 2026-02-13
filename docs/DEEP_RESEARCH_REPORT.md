# Deep Codebase Research & Gap Analysis Report

> **Date**: 2026-02-13  
> **Scope**: Full monorepo analysis — `apps/web`, `apps/admin`, `packages/*`, `backend/*`, `infra/*`  
> **Method**: Systematic comparison of 49 planning docs against actual implementation

---

## A. Critical Bugs & Issues Found

### 🔴 Category 1: Broken Pages & Dead Links

| Issue                                                                     | Location                                                                                                                                | Impact                                  |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Dashboard links to `/dashboard/favorites`** — page doesn't exist        | [dashboard/page.tsx](file:///c:/Users/HSAFX/Desktop/VS_Code_Copilot/HSAFX_WORLD_APP/apps/web/src/app/dashboard/page.tsx#L144)           | Users clicking "Favorites" get 404      |
| **Dashboard "448+" hardcoded** — should be dynamic from registry          | [dashboard/page.tsx](file:///c:/Users/HSAFX/Desktop/VS_Code_Copilot/HSAFX_WORLD_APP/apps/web/src/app/dashboard/page.tsx#L99)            | Misleading count (actual: 454)          |
| **Dashboard "Executions Today: 0" hardcoded** — not fetched from API      | [dashboard/page.tsx](file:///c:/Users/HSAFX/Desktop/VS_Code_Copilot/HSAFX_WORLD_APP/apps/web/src/app/dashboard/page.tsx#L114)           | Always shows 0 regardless of real usage |
| **Tool detail page breadcrumb "Todo remaining"** — unfinished placeholder | [tools/[slug]/page.tsx](file:///c:/Users/HSAFX/Desktop/VS_Code_Copilot/HSAFX_WORLD_APP/apps/web/src/app/tools/%5Bslug%5D/page.tsx#L113) | Visible TODO in UI                      |

### 🔴 Category 2: Stub/Non-Functional Features

| Feature                         | Status                                                                    | File                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Profile update**              | Returns `{ success: false, error: 'Profile update not yet implemented' }` | [use-auth.tsx](file:///c:/Users/HSAFX/Desktop/VS_Code_Copilot/HSAFX_WORLD_APP/apps/web/src/hooks/use-auth.tsx#L108-L111)                           |
| **Avatar upload**               | Button exists but has no handler — no backend API for file upload         | [settings/profile/page.tsx](file:///c:/Users/HSAFX/Desktop/VS_Code_Copilot/HSAFX_WORLD_APP/apps/web/src/app/settings/profile/page.tsx#L96-L101)    |
| **Security settings page**      | UI exists with TODO markers for 2FA, active sessions, account deletion    | [settings/security/page.tsx](file:///c:/Users/HSAFX/Desktop/VS_Code_Copilot/HSAFX_WORLD_APP/apps/web/src/app/settings/security/page.tsx)           |
| **Notifications settings page** | UI shell exists, no backend wiring                                        | [settings/notifications/page.tsx](file:///c:/Users/HSAFX/Desktop/VS_Code_Copilot/HSAFX_WORLD_APP/apps/web/src/app/settings/notifications/page.tsx) |
| **Billing settings page**       | Links to billing page but no payment method management                    | [settings/billing/page.tsx](file:///c:/Users/HSAFX/Desktop/VS_Code_Copilot/HSAFX_WORLD_APP/apps/web/src/app/settings/billing/page.tsx)             |

### 🔴 Category 3: Database Schema ↔ Actual DB Misalignment

The Drizzle schema defines **30+ tables** across 6 schema files. From the previous session, we know only a handful exist in the actual Neon database. **Drizzle migrations have never been pushed.**

> [!CAUTION]
> Running `drizzle-kit push` blindly will fail because Better Auth created its own tables (user, session, account, verification) that may conflict with the Drizzle `users` table.

**Tables defined in Drizzle schema but likely missing from DB:**

| Schema File              | Tables Defined                                                                                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `billing.ts` (534 lines) | plans, plan_limits, subscriptions, coin_transactions, invoices, payments, user_coin_wallets, coin_packs, tool_coin_costs, plan_features, plan_coin_rules, login_reward_claims, user_daily_reward_caps, processed_webhooks, usage_coin_fallbacks, invoice_payments |
| `tools.ts`               | tools, tool_executions, api_keys                                                                                                                                                                                                                                  |
| `users.ts`               | users, user_preferences, user_settings                                                                                                                                                                                                                            |
| `auth.ts`                | sessions, accounts, verifications                                                                                                                                                                                                                                 |
| `misc.ts`                | file_uploads, async_jobs, notifications, favorites, feature_flags, email_provider_config, email_templates, email_logs, admin_settings, email_usage_tracking                                                                                                       |
| `audit.ts`               | activity_logs, admin_audit_logs                                                                                                                                                                                                                                   |

### 🟡 Category 4: Missing Environment Variables

| Variable                | Required By                             | Status                                |
| ----------------------- | --------------------------------------- | ------------------------------------- |
| `RESEND_API_KEY`        | Email service (`lib/email.ts`)          | ❌ Not configured — emails will throw |
| `STRIPE_SECRET_KEY`     | Stripe webhooks, coin purchase flow     | ❌ Not in `.env.local`                |
| `STRIPE_WEBHOOK_SECRET` | Stripe signature verification           | ❌ Not in `.env.local`                |
| `POLAR_WEBHOOK_SECRET`  | Polar subscription webhooks             | ❌ Not configured                     |
| `CRON_SECRET`           | Cron job authentication (4 cron routes) | ❌ Not configured                     |

---

## B. Features NOT in Planning Docs (Gaps in Planning)

These features are commonly expected in a production SaaS application but **have no corresponding planning document**:

### 🏗️ Missing from Planning AND Implementation

| Feature                         | Description                                                                                                    | Priority |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| **User Onboarding Flow**        | Welcome wizard, guided setup after signup (choose interests, import data, etc.)                                | High     |
| **User Analytics Dashboard**    | Charts/graphs showing personal usage over time (tools used, coins spent, execution trends)                     | High     |
| **Favorites/Bookmarks System**  | Dashboard links to favorites but no page exists, no API, no DB integration despite `favorites` table in schema | High     |
| **Notification Center**         | In-app notification bell/sidebar for real-time notifications (table exists but no frontend)                    | High     |
| **Feedback/Bug Report System**  | In-app way for users to report bugs or request features                                                        | Medium   |
| **API Docs Live Playground**    | Interactive API testing UI (Swagger/Postman-like) — current `/api-docs` page is static                         | Medium   |
| **Search History**              | Persisted recently-searched tools for each user                                                                | Medium   |
| **Tool Execution History**      | Detailed log of past executions with re-run capability (dashboard link exists, page likely stub)               | High     |
| **Export Data**                 | Ability to export tool results, history, or billing data as CSV/JSON                                           | Medium   |
| **Legal Pages**                 | Terms of Service, Privacy Policy, Cookie Policy — required for production                                      | High     |
| **Contact/Support Page**        | Way for users to reach support (help center, FAQ, ticket system)                                               | Medium   |
| **Public User Profiles**        | Optional public-facing profile for sharing work, tool configurations                                           | Low      |
| **Tool Sharing**                | Short links to share tool configurations/results with others                                                   | Low      |
| **Mobile Responsive Audit**     | Systematic verification that all 454 tools work on mobile viewports                                            | Medium   |
| **Accessibility (a11y)**        | WCAG 2.1 compliance audit — ARIA labels, keyboard navigation, screen reader support                            | Medium   |
| **Internationalization (i18n)** | Multi-language support (planning mentions `language` in user_preferences but no i18n framework)                | Low      |

---

## C. TODO/FIXME/HACK Markers (120+ Files)

### High-Impact TODOs

| File                         | TODO Content                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `use-auth.tsx:108`           | `// TODO (Phase 5): Wire to tRPC user.updateProfile mutation` — **Profile editing broken** |
| `settings/security/page.tsx` | 2FA setup, active sessions management, password change, account deletion — all TODO        |
| `settings/profile/page.tsx`  | Avatar upload handler not implemented                                                      |
| `middleware.ts`              | Rate limiting imports functions that depend on Redis availability                          |
| `tools/[slug]/page.tsx:113`  | `{/* Todo remaining make this dynamic */}` — visible in UI                                 |

### Widespread Pattern Issues (TODO in packages)

- `packages/tools/src/generators/*.ts` — Multiple CSS generators have placeholder calculations
- `packages/tools/src/data-converters/*.ts` — Several converters have temporary fallback logic
- `packages/tools/src/calculators/*.ts` — Unit conversion accuracy flagged as temporary

---

## D. Admin Panel Status

The admin panel has **19 pages** and appears well-structured:

| Page                             | Status                                            |
| -------------------------------- | ------------------------------------------------- |
| Dashboard, Users, Tools          | ✅ Implemented (with TODO markers for API wiring) |
| API Keys, Billing, Subscriptions | ✅ UI exists, needs backend API routes            |
| Feature Flags, Coin Packs, Plans | ✅ UI shells exist                                |
| Categories, Activity, Admins     | ✅ UI shells, need backend                        |
| Settings                         | ✅ Basic UI                                       |

> [!WARNING]  
> Almost every admin page has `// TODO` or `// PLACEHOLDER` markers. The admin API routes at `apps/admin/src/app/api/admin/` exist but many return mock data.

---

## E. Backend Services Status

### FastAPI Backend

- **4 scrapers** implemented (Pakistan terminals: KGTL, KICT, QICT, SAPT)
- Connection pool, caching service, bulk service present
- **Not currently connected** to the web app (rewrite rule disabled in `next.config.js`)

### Rust Backend

- Directory exists at `backend/rust/` with basic project structure
- **Empty/scaffold only** — no functional code

---

## F. Prioritized Remediation Plan

### Phase 1: Critical Fixes (Blocking Issues)

1. **Push Drizzle schema to Neon DB** — Reconcile with Better Auth tables first
2. **Fix dashboard: remove `/dashboard/favorites` dead link** or create the page
3. **Fix dashboard: dynamic tool count** from registry instead of hardcoded "448+"
4. **Fix dashboard: dynamic execution count** from API/tRPC
5. **Remove visible TODO text** from tool detail page breadcrumb

### Phase 2: Core Feature Completion

1. **Wire profile update** to tRPC mutation (currently returns "not implemented")
2. **Implement avatar upload** with file storage (S3/R2 or Neon blob)
3. **Build favorites page** — schema exists, needs API + UI
4. **Build notification center** — schema exists, needs WebSocket/SSE + UI
5. **Implement execution history page** with real data from `tool_executions` table

### Phase 3: Production Readiness

1. **Configure all env vars** (Stripe, Resend, Polar, Cron secrets)
2. **Create legal pages** (Terms, Privacy Policy, Cookie Policy)
3. **Create contact/support page** or integrate help widget
4. **Security page completion** (2FA, active sessions, password change)
5. **Mobile responsive audit** across all tools

### Phase 4: Enhanced Features

1. **Analytics dashboard** with usage charts
2. **API docs playground** with interactive testing
3. **Onboarding flow** for new users
4. **Search history** persistence
5. **Data export** functionality

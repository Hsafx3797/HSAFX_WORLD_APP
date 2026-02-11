# HSAFX World App — Advanced Testing Roadmap

> **Date:** February 11, 2026
> **Status:** Planning document — industry-level test coverage blueprint
> **Prerequisites:** Node.js 20+, PostgreSQL 15+, Redis 7+, Python 3.12+, Docker, Playwright

---

## Table of Contents

1. [Overview & Testing Pyramid](#1-overview--testing-pyramid)
2. [Phase 1 — Integration Tests (Database + API)](#2-phase-1--integration-tests-database--api)
3. [Phase 2 — API Route Testing (Web + Admin)](#3-phase-2--api-route-testing-web--admin)
4. [Phase 3 — Authentication & Authorization Testing](#4-phase-3--authentication--authorization-testing)
5. [Phase 4 — Billing & Payment Testing](#5-phase-4--billing--payment-testing)
6. [Phase 5 — E2E Browser Testing (Playwright)](#6-phase-5--e2e-browser-testing-playwright)
7. [Phase 6 — Admin Panel E2E Testing](#7-phase-6--admin-panel-e2e-testing)
8. [Phase 7 — UI Component Testing](#8-phase-7--ui-component-testing)
9. [Phase 8 — Theme & Design System Testing](#9-phase-8--theme--design-system-testing)
10. [Phase 9 — FastAPI Backend Integration Testing](#10-phase-9--fastapi-backend-integration-testing)
11. [Phase 10 — Performance & Load Testing](#11-phase-10--performance--load-testing)
12. [Phase 11 — Security Testing](#12-phase-11--security-testing)
13. [Phase 12 — Accessibility (a11y) Testing](#13-phase-12--accessibility-a11y-testing)
14. [Phase 13 — SEO & Lighthouse Testing](#14-phase-13--seo--lighthouse-testing)
15. [Phase 14 — Error Handling & Resilience Testing](#15-phase-14--error-handling--resilience-testing)
16. [Phase 15 — CI/CD Pipeline Testing](#16-phase-15--cicd-pipeline-testing)
17. [Tools & Dependencies Needed](#17-tools--dependencies-needed)
18. [Estimated Effort](#18-estimated-effort)

---

## 1. Overview & Testing Pyramid

```
                    ┌─────────────┐
                    │   E2E (13%) │  ← Playwright browser tests
                   ┌┴─────────────┴┐
                   │ Integration    │  ← API routes, DB, Redis, webhooks
                  ┌┴───────────────┴┐
                  │  Unit (DONE ✅)  │  ← 2,631 tests passing
                  └─────────────────┘
```

**Current state:** We have a solid base layer (unit tests). Everything below is what's needed to reach industry-grade coverage.

**Target:** ~5,000+ total tests across all layers when complete.

---

## 2. Phase 1 — Integration Tests (Database + API)

> **Requires:** PostgreSQL test database, Drizzle migrations, test seed data
> **Framework:** Vitest + drizzle-orm + pg test container (or test DB)

### 2.1 Database Schema Validation

- [ ] All tables create successfully via migration
- [ ] Foreign key constraints are enforced
- [ ] Unique constraints work (duplicate email, duplicate slug)
- [ ] Default values populate correctly (createdAt, isActive, etc.)
- [ ] Cascade deletes propagate (user → preferences, settings, sessions)
- [ ] Index performance is acceptable (EXPLAIN ANALYZE on key queries)

### 2.2 Database CRUD Operations

#### Users Table
- [ ] Create user with valid data
- [ ] Create user — duplicate email rejected
- [ ] Read user by ID
- [ ] Read user by email
- [ ] Update user profile fields
- [ ] Soft delete user (set deletedAt)
- [ ] Query excludes soft-deleted users
- [ ] User preferences created on first access
- [ ] User settings created on first access

#### Tools Table
- [ ] Create tool with all required fields
- [ ] Create tool — duplicate slug rejected
- [ ] Read tool by slug
- [ ] Read tool by category
- [ ] Update tool (isActive, coinCost, tier)
- [ ] Soft delete tool (set deletedAt)
- [ ] Tool categories CRUD
- [ ] Tool limits per tool
- [ ] Tool execution logging

#### Billing Tables
- [ ] Create subscription
- [ ] Update subscription status transitions (active → canceled → expired)
- [ ] Create coin transaction (grant, spend, refund)
- [ ] Wallet balance updates atomically
- [ ] Payment record creation
- [ ] Coin pack purchase flow
- [ ] Subscription plan changes

#### Auth Tables (better-auth managed)
- [ ] Session creation
- [ ] Session expiry
- [ ] Account linking
- [ ] Verification tokens

### 2.3 tRPC Router Integration Tests

#### Admin Router (`packages/api/src/routers/admin.ts`)
- [ ] List tool categories — returns paginated results
- [ ] Create category — requires admin role
- [ ] Update category — validates input
- [ ] Delete category — soft deletes + writes audit log
- [ ] Non-admin user gets FORBIDDEN

#### Billing Router (`packages/api/src/routers/billing.ts`)
- [ ] Get current plan — returns user's active subscription
- [ ] Create checkout — calls Polar API correctly
- [ ] Cancel subscription — sets cancelAtPeriodEnd
- [ ] Resume subscription — unsets cancelAtPeriodEnd
- [ ] Change plan — creates new checkout with correct product
- [ ] Claim daily bonus — enforces once per day
- [ ] Claim daily bonus — creates wallet if not exists
- [ ] Purchase coin pack — validates pack exists
- [ ] Get transaction history — paginated, sorted by date

#### Tools Router (`packages/api/src/routers/tools.ts`)
- [ ] List tools — respects pagination
- [ ] List tools — filters by category
- [ ] List tools — search by name
- [ ] Get tool by slug — returns full tool data
- [ ] Execute tool — deducts coins
- [ ] Execute tool — respects rate limits
- [ ] Execute tool — checks plan access
- [ ] Execute tool — anonymous user limits

#### User Router (`packages/api/src/routers/user.ts`)
- [ ] Get profile — returns current user data
- [ ] Update profile — validates email format
- [ ] Change password — requires current password
- [ ] Change password — invalidates other sessions
- [ ] Delete account — requires confirmation

#### Ads Router (`packages/api/src/routers/ads.ts`)
- [ ] Record ad impression
- [ ] Record ad click
- [ ] Claim ad reward — validates eligibility
- [ ] Claim ad reward — enforces cooldown
- [ ] Claim ad reward — enforces daily limits

---

## 3. Phase 2 — API Route Testing (Web + Admin)

> **Requires:** Next.js test environment, supertest or fetch mocking
> **Framework:** Vitest + next/test-utils or MSW (Mock Service Worker)

### 3.1 Web App API Routes (16 routes)

#### Authentication
- [ ] `POST /api/auth/[...all]` — Sign up with email/password
- [ ] `POST /api/auth/[...all]` — Sign in with email/password
- [ ] `POST /api/auth/[...all]` — Sign out (clears session)
- [ ] `POST /api/auth/[...all]` — OAuth flow (Google, GitHub)
- [ ] `GET /api/auth/[...all]` — Get session
- [ ] `POST /api/auth/[...all]` — Forgot password
- [ ] `POST /api/auth/[...all]` — Reset password
- [ ] `POST /api/auth/[...all]` — Verify email

#### Cron Jobs
- [ ] `POST /api/cron/anonymous-cleanup` — Removes expired anon data
- [ ] `POST /api/cron/stale-job-cleanup` — Cleans stale background jobs
- [ ] `POST /api/cron/subscription-sync` — Syncs with Polar
- [ ] `POST /api/cron/wallet-reconciliation` — Reconciles coin balances
- [ ] All cron routes — Reject unauthorized callers (require secret)
- [ ] All cron routes — Idempotent on repeat calls

#### Internal
- [ ] `POST /api/internal/job-complete` — Updates job status
- [ ] Rejects requests without internal auth token

#### tRPC
- [ ] `ANY /api/trpc/[trpc]` — Routes to correct procedure
- [ ] Handles batch requests
- [ ] Returns proper error format

#### Public REST API (v1)
- [ ] `GET /api/v1/health` — Returns 200 with status
- [ ] `GET /api/v1/account` — Returns authenticated user info
- [ ] `GET /api/v1/account` — Returns 401 for unauthenticated
- [ ] `GET /api/v1/account/usage` — Returns usage statistics
- [ ] `GET /api/v1/tools` — Lists available tools
- [ ] `GET /api/v1/tools` — Supports pagination (page, limit)
- [ ] `GET /api/v1/tools` — Supports category filter
- [ ] `GET /api/v1/tools/[toolKey]` — Returns tool details
- [ ] `GET /api/v1/tools/[toolKey]` — Returns 404 for invalid tool
- [ ] `POST /api/v1/tools/[toolKey]/execute` — Executes tool
- [ ] `POST /api/v1/tools/[toolKey]/execute` — Validates input
- [ ] `POST /api/v1/tools/[toolKey]/execute` — Deducts coins
- [ ] `POST /api/v1/tools/[toolKey]/execute` — Returns 402 insufficient coins
- [ ] `POST /api/v1/tools/[toolKey]/execute` — Respects rate limits (429)
- [ ] `GET /api/v1/jobs/[jobId]` — Returns job status
- [ ] `GET /api/v1/jobs/[jobId]/result` — Returns job result
- [ ] `GET /api/v1/jobs/[jobId]` — Returns 404 for invalid job

#### Webhooks
- [ ] `POST /api/webhooks/stripe` — Verifies Stripe signature
- [ ] `POST /api/webhooks/stripe` — Handles `checkout.session.completed`
- [ ] `POST /api/webhooks/stripe` — Handles `charge.refunded`
- [ ] `POST /api/webhooks/stripe` — Handles `charge.dispute.created`
- [ ] `POST /api/webhooks/stripe` — Handles `invoice.payment_succeeded`
- [ ] `POST /api/webhooks/stripe` — Handles `invoice.payment_failed`
- [ ] `POST /api/webhooks/stripe` — Idempotent (duplicate event ID)
- [ ] `POST /api/webhooks/stripe` — Rejects invalid signature (401)
- [ ] `POST /api/webhooks/polar` — Verifies Polar signature
- [ ] `POST /api/webhooks/polar` — Handles subscription.created
- [ ] `POST /api/webhooks/polar` — Handles subscription.updated
- [ ] `POST /api/webhooks/polar` — Handles subscription.canceled
- [ ] `POST /api/webhooks/polar` — Handles checkout.completed
- [ ] `POST /api/webhooks/polar` — Idempotent on duplicate events

### 3.2 Admin App API Routes (20 routes)

#### Admin Session
- [ ] `POST /api/auth/[...all]` — Admin login (separate auth instance)
- [ ] `GET /api/admin/session` — Returns admin session + permissions
- [ ] `GET /api/admin/session` — Returns 401 for non-admin

#### Admin 2FA
- [ ] `POST /api/admin/2fa` — Generate TOTP secret + QR
- [ ] `POST /api/admin/2fa` — Verify TOTP code
- [ ] `POST /api/admin/2fa` — Enable 2FA
- [ ] `POST /api/admin/2fa` — Disable 2FA (requires current code)

#### Admin Users
- [ ] `GET /api/admin/users` — List with pagination
- [ ] `GET /api/admin/users` — Search by email
- [ ] `GET /api/admin/users` — Filter by status (active, banned, deleted)
- [ ] `GET /api/admin/users` — Filter by plan tier
- [ ] `PATCH /api/admin/users` — Update user status
- [ ] `PATCH /api/admin/users` — Ban/unban user
- [ ] `DELETE /api/admin/users` — Soft delete user
- [ ] All user mutations — Require admin permission
- [ ] All user mutations — Write audit log

#### Admin Tools
- [ ] `GET /api/admin/tools` — List with pagination + usage stats
- [ ] `GET /api/admin/tools` — Filter by category, status
- [ ] `POST /api/admin/tools` — Create tool
- [ ] `PATCH /api/admin/tools` — Update tool (coinCost, isActive, tier)
- [ ] `DELETE /api/admin/tools` — Soft delete tool
- [ ] All tool mutations — Require tool_manage permission

#### Admin Categories
- [ ] `GET /api/admin/categories` — List all categories
- [ ] `POST /api/admin/categories` — Create category
- [ ] `PATCH /api/admin/categories` — Update category
- [ ] `DELETE /api/admin/categories` — Delete category (if no tools)

#### Admin Subscriptions
- [ ] `GET /api/admin/subscriptions` — List all subscriptions
- [ ] `GET /api/admin/subscriptions` — Filter by status
- [ ] Subscription detail view includes user info

#### Admin Billing
- [ ] `GET /api/admin/billing/transactions` — List coin transactions
- [ ] `GET /api/admin/coin-packs` — List coin packs
- [ ] `POST /api/admin/coin-packs` — Create/update coin pack
- [ ] `GET /api/admin/plans` — List plans
- [ ] `PATCH /api/admin/plans` — Update plan pricing/features

#### Admin Dashboard
- [ ] `GET /api/admin/dashboard/metrics` — Total users, revenue, tools
- [ ] `GET /api/admin/dashboard/analytics` — Growth charts data
- [ ] `GET /api/admin/dashboard/top-tools` — Most used tools
- [ ] `GET /api/admin/dashboard/recent-errors` — Error log
- [ ] `GET /api/admin/dashboard/alerts` — System alerts

#### Admin Feature Flags
- [ ] `GET /api/admin/feature-flags` — List all flags
- [ ] `POST /api/admin/feature-flags` — Create flag
- [ ] `PATCH /api/admin/feature-flags` — Toggle flag
- [ ] `DELETE /api/admin/feature-flags` — Delete flag

#### Admin API Keys
- [ ] `GET /api/admin/api-keys` — List admin API keys
- [ ] `POST /api/admin/api-keys` — Create API key
- [ ] `DELETE /api/admin/api-keys` — Revoke API key

#### Admin Config
- [ ] `GET /api/admin/config` — Get system config
- [ ] `PATCH /api/admin/config` — Update system config
- [ ] Config changes — Require super_admin permission

#### Admin Audit
- [ ] `GET /api/admin/audit` — List audit log entries
- [ ] `GET /api/admin/audit` — Filter by action, user, date range
- [ ] Audit entries are immutable (no update/delete)

---

## 4. Phase 3 — Authentication & Authorization Testing

> **Requires:** Better-auth test setup, test OAuth providers, test email service
> **Framework:** Vitest + better-auth test utils

### 4.1 Registration Flow
- [ ] Register with valid email + password
- [ ] Register — email already exists → proper error
- [ ] Register — weak password rejected (min 8 chars, complexity)
- [ ] Register — email verification sent
- [ ] Register — verify email token works
- [ ] Register — expired token rejected
- [ ] Register — creates default user preferences
- [ ] Register — creates default user settings
- [ ] Register — assigns 'free' plan
- [ ] Register — initializes coin wallet with 0 balance

### 4.2 Login Flow
- [ ] Login with correct credentials → session created
- [ ] Login with wrong password → error
- [ ] Login with non-existent email → generic error (no enumeration)
- [ ] Login with unverified email → appropriate response
- [ ] Login with banned account → error
- [ ] Login with deleted account → error
- [ ] Login rate limiting (5 attempts → lockout)
- [ ] Login security — progressive delays
- [ ] Login — sets session cookie (httpOnly, secure, sameSite)
- [ ] Login — rotates session token on re-login

### 4.3 OAuth Flow
- [ ] Google OAuth — redirect to consent screen
- [ ] Google OAuth — callback creates account
- [ ] Google OAuth — callback links to existing account (same email)
- [ ] GitHub OAuth — same test matrix
- [ ] OAuth — profile picture extracted
- [ ] OAuth — email pre-verified

### 4.4 Session Management
- [ ] Session persists across requests
- [ ] Session expires after configured timeout
- [ ] Sign out invalidates session
- [ ] Sign out clears cookies
- [ ] Multiple devices — independent sessions
- [ ] Force sign out all sessions (security settings)

### 4.5 Password Management
- [ ] Change password — requires current password
- [ ] Change password — validates new password strength
- [ ] Forgot password — sends reset email
- [ ] Reset password — valid token works
- [ ] Reset password — expired token rejected
- [ ] Reset password — token single-use

### 4.6 Admin Authentication
- [ ] Admin login — separate auth instance
- [ ] Admin login — only admin-flagged users can access
- [ ] Admin 2FA setup — generates TOTP secret
- [ ] Admin 2FA setup — QR code renders correctly
- [ ] Admin 2FA verification — correct code accepted
- [ ] Admin 2FA verification — wrong code rejected
- [ ] Admin 2FA verification — time-based window (30s)
- [ ] Admin — protected routes require 2FA for sensitive actions
- [ ] Admin session — shorter timeout than user session

### 4.7 Middleware
- [ ] Auth middleware — attaches user to request
- [ ] Auth middleware — rejects expired sessions
- [ ] Rate limit middleware — tracks per-IP
- [ ] Rate limit middleware — tracks per-user
- [ ] Rate limit middleware — returns 429 with Retry-After header
- [ ] CORS middleware — allows configured origins
- [ ] CORS middleware — rejects unknown origins
- [ ] CSP headers — set correctly

---

## 5. Phase 4 — Billing & Payment Testing

> **Requires:** Stripe test mode, Polar sandbox, test webhooks (Stripe CLI)
> **Framework:** Vitest + Stripe mock / test mode API keys

### 5.1 Subscription Plans
- [ ] Free plan — correct feature limits
- [ ] Pro plan — correct feature limits
- [ ] Advance plan — correct feature limits
- [ ] Plan comparison — all features listed accurately
- [ ] Plan upgrade — Pro → Advance
- [ ] Plan downgrade — Advance → Pro (at period end)
- [ ] Plan cancel — sets cancelAtPeriodEnd
- [ ] Plan resume — removes cancel flag
- [ ] Plan expired — downgrades to free

### 5.2 Coin System
- [ ] Daily bonus — grants 10 coins
- [ ] Daily bonus — once per day (UTC boundary)
- [ ] Daily bonus — creates wallet if missing
- [ ] Coin deduction on tool execution
- [ ] Coin deduction — insufficient coins → 402
- [ ] Coin refund on failed execution
- [ ] Coin balance never goes negative
- [ ] Transaction history — all types recorded

### 5.3 Coin Pack Purchase (Stripe)
- [ ] Checkout session creation with correct amount
- [ ] Successful payment → coins credited
- [ ] Failed payment → no coins credited
- [ ] Webhook signature verification
- [ ] Duplicate webhook → idempotent (no double credit)
- [ ] Refund webhook → coins deducted
- [ ] Dispute webhook → account flagged

### 5.4 Subscription Purchase (Polar)
- [ ] Checkout creation with correct product ID
- [ ] Successful checkout → subscription created locally
- [ ] Subscription webhook → updates local status
- [ ] Subscription cancel webhook → marks canceled
- [ ] Subscription renewal webhook → extends period
- [ ] Failed payment → grace period logic
- [ ] Proration on plan change

### 5.5 Edge Cases
- [ ] Double-click purchase prevention
- [ ] Currency conversion consistency
- [ ] Expired checkout session handling
- [ ] User deletes account with active subscription
- [ ] Concurrent coin deductions (race condition)
- [ ] Webhook replay attack prevention
- [ ] Price change mid-billing cycle

---

## 6. Phase 5 — E2E Browser Testing (Playwright)

> **Requires:** Playwright, running dev servers (web + admin + FastAPI), test database
> **Framework:** Playwright + @playwright/test

### 6.1 Setup Steps

```bash
# Install Playwright
pnpm add -D @playwright/test
npx playwright install chromium firefox webkit

# Create playwright.config.ts at workspace root
# Configure web project (localhost:3000) + admin project (localhost:3001)
# Set up global setup/teardown for test DB
```

### 6.2 Public Pages (No Auth Required)

#### Homepage
- [ ] Page loads without errors
- [ ] Hero section renders
- [ ] Tool categories display
- [ ] CTA buttons are clickable
- [ ] Footer links work
- [ ] Mobile responsive layout

#### Tools Listing (`/tools`)
- [ ] Page displays tool grid
- [ ] Category filter works
- [ ] Search filters tools
- [ ] Tool cards show name, description, icon
- [ ] Tool card click navigates to tool page
- [ ] Pagination works

#### Tool Category Pages (`/tools/category/[category]`)
- [ ] All 7 categories load (text, converters, media, calculators, generators, data, specialized)
- [ ] Category description shown
- [ ] Only tools in that category displayed
- [ ] Breadcrumb navigation works

#### Pricing Page (`/pricing`)
- [ ] All 3 plans displayed (Free, Pro, Advance)
- [ ] Feature comparison table renders
- [ ] CTA buttons link correctly
- [ ] Monthly/annual toggle works (if applicable)
- [ ] Current plan highlighted for logged-in users

#### Documentation Pages
- [ ] `/docs` loads
- [ ] `/docs/api` loads with API reference
- [ ] `/api-docs` interactive docs load
- [ ] Code samples render correctly

### 6.3 Authentication Flows (E2E)

#### Sign Up
- [ ] Navigate to `/auth/signup`
- [ ] Fill form → submit → account created
- [ ] Redirects to dashboard after signup
- [ ] Shows error for duplicate email
- [ ] Shows error for weak password
- [ ] Email validation works (invalid format)

#### Sign In
- [ ] Navigate to `/auth/signin`
- [ ] Fill form → submit → logged in
- [ ] Redirects to dashboard
- [ ] Shows error for wrong password
- [ ] Shows error for non-existent email
- [ ] "Forgot password" link works

#### Sign Out
- [ ] Logout button visible when logged in
- [ ] Click logout → redirected to homepage
- [ ] Session cleared (revisit dashboard → redirect to login)

### 6.4 Dashboard (Authenticated)

#### Main Dashboard (`/dashboard`)
- [ ] Shows user greeting
- [ ] Displays coin balance
- [ ] Shows current plan
- [ ] Recent tool usage history
- [ ] Quick access tool links

#### Coins Page (`/dashboard/coins`)
- [ ] Coin balance displayed
- [ ] "Claim Daily Bonus" button works
- [ ] Coin pack purchase cards shown
- [ ] Transaction history table loads

#### Subscription Page (`/dashboard/subscription`)
- [ ] Current plan details shown
- [ ] Upgrade/downgrade options
- [ ] Cancel subscription workflow
- [ ] Billing history table

#### History Page (`/dashboard/history`)
- [ ] Tool execution history listed
- [ ] Shows tool name, date, status
- [ ] Pagination works

#### API Keys Page (`/dashboard/api-keys`)
- [ ] Current API keys listed
- [ ] Create new API key works
- [ ] Copy key to clipboard
- [ ] Revoke key confirmation + deletion

### 6.5 Settings Pages (Authenticated)

#### Profile (`/settings/profile`)
- [ ] Form pre-filled with current data
- [ ] Update name → saves successfully
- [ ] Update email → verification required
- [ ] Avatar upload (if supported)

#### Security (`/settings/security`)
- [ ] Change password form works
- [ ] Active sessions listed
- [ ] Revoke session works
- [ ] 2FA setup (if available to users)

#### Preferences (`/settings/preferences`)
- [ ] Theme toggle (light/dark/system)
- [ ] Language selector
- [ ] Timezone selector
- [ ] Settings persist across sessions

#### Notifications (`/settings/notifications`)
- [ ] Email notification toggles
- [ ] Push notification toggles
- [ ] Marketing email opt-in/out

#### Billing (`/settings/billing`)
- [ ] Current plan details
- [ ] Payment method management
- [ ] Invoice history
- [ ] Cancel subscription flow

### 6.6 Tool Execution (E2E)

#### Text Tools
- [ ] `/tools/text-converter` — input text → converted output
- [ ] Case conversion (upper, lower, title, sentence)
- [ ] Character/word count updates live
- [ ] Copy result to clipboard

#### Calculator Tools
- [ ] Expression calculator — type equation → result
- [ ] Financial calculator — input values → computed result
- [ ] Unit converter — select units → convert
- [ ] Health calculators (BMI, BMR) — input → result

#### Code/Data Tools
- [ ] JSON formatter — paste JSON → formatted output
- [ ] JSON↔YAML converter — conversion accurate
- [ ] Code converter — TypeScript to JavaScript
- [ ] CSV parser — paste/upload → table view

#### Generator Tools
- [ ] UUID generator — generates valid UUID
- [ ] Password generator — configurable length/complexity
- [ ] Lorem ipsum — paragraph count works
- [ ] SEO meta tag generator — fills all fields

#### Specialized Tools
- [ ] DB Schema Visualizer — paste schema → diagram renders
- [ ] File Tree Generator — input → tree output
- [ ] Container Number Validator — validates ISO 6346
- [ ] GPA Calculator — grade input → GPA output
- [ ] Cheque Generator — amount → words conversion

#### File-Based Tools (FastAPI Backend)
- [ ] Image conversion — upload → download converted file
- [ ] Video conversion — upload → processing → download
- [ ] PDF operations — upload → processed PDF
- [ ] Document conversion — DOCX↔PDF↔TXT
- [ ] Archive operations — zip/unzip
- [ ] Font conversion — TTF↔WOFF↔WOFF2

---

## 7. Phase 6 — Admin Panel E2E Testing

> **Requires:** Playwright, admin dev server (localhost:3001), admin test account with TOTP

### 7.1 Admin Authentication
- [ ] Admin login page loads
- [ ] Login with admin credentials → redirected to dashboard
- [ ] Non-admin user → rejected
- [ ] 2FA prompt appears for sensitive actions

### 7.2 Admin Dashboard
- [ ] Metrics cards load (users, revenue, tools, executions)
- [ ] User growth chart renders
- [ ] Tool execution chart renders
- [ ] Revenue trend chart renders
- [ ] Top tools list loads
- [ ] Recent errors list loads
- [ ] Quick action buttons work

### 7.3 User Management
- [ ] User list loads with pagination
- [ ] Search by email works
- [ ] Filter by status works
- [ ] Click user → detail page loads
- [ ] User detail shows profile, subscription, activity
- [ ] Ban user → confirms → user banned
- [ ] Delete user → TOTP required → confirms → user soft-deleted
- [ ] Reset password → confirms → email sent
- [ ] Adjust coins → enter amount → TOTP → coins updated

### 7.4 Tool Management
- [ ] Tool list loads with pagination
- [ ] Filter by category works
- [ ] Search by name works
- [ ] Click tool → detail page loads
- [ ] Toggle tool active/inactive
- [ ] Update coin cost
- [ ] Delete tool → TOTP required → soft deleted

### 7.5 Category Management
- [ ] Category list loads
- [ ] Create new category → form → save
- [ ] Edit category → update name/description
- [ ] Delete category → confirm → deleted (if no tools)
- [ ] Delete category with tools → rejection

### 7.6 Subscription Management
- [ ] Subscription list loads
- [ ] Filter by status (active, canceled, expired)
- [ ] Click subscription → detail page
- [ ] Subscription detail shows user info + plan
- [ ] Cancel subscription → TOTP → confirm
- [ ] Refund → TOTP → processed

### 7.7 Billing Management
- [ ] Transaction list loads
- [ ] Coin pack management works
- [ ] Plan editing works

### 7.8 Feature Flags
- [ ] Flag list loads
- [ ] Create new feature flag
- [ ] Toggle flag on/off
- [ ] Delete flag → confirm

### 7.9 Admin Settings
- [ ] Settings page loads
- [ ] Admin list — shows current admins
- [ ] Add admin → TOTP → adds
- [ ] Remove admin → TOTP → removes
- [ ] 2FA setup/teardown works

### 7.10 Activity Log
- [ ] Activity log loads with pagination
- [ ] Filter by action type
- [ ] Filter by date range
- [ ] Filter by user
- [ ] Log detail modal shows full data

---

## 8. Phase 7 — UI Component Testing

> **Requires:** Vitest + happy-dom or @testing-library/react
> **Framework:** Vitest + React Testing Library

### 8.1 Web App Components (`apps/web/src/components/`)

#### Core Components
- [ ] `layout.tsx` — renders header, sidebar, footer
- [ ] `providers.tsx` — wraps children with all providers
- [ ] `theme-provider.tsx` — applies theme correctly
- [ ] `search.tsx` — search input filters results
- [ ] `file-upload.tsx` — drag & drop works, file type validation
- [ ] `code-block.tsx` — syntax highlighting renders
- [ ] `tool-card.tsx` — displays tool info correctly

#### Tool Executor Components
- [ ] `text-executor.tsx` — renders text input/output
- [ ] `calculator-executor.tsx` — renders calculator UI
- [ ] `code-executor.tsx` — renders code editor
- [ ] `file-executor.tsx` — renders file upload + download
- [ ] `generator-executor.tsx` — renders generator controls
- [ ] `unit-executor.tsx` — renders unit converter dropdowns

#### Tool Layout Components
- [ ] `text-converter-layout.tsx` — multi-tool text page
- [ ] `calculator-layout.tsx` — calculator wrapper
- [ ] `file-converter-layout.tsx` — file upload wrapper
- [ ] `generator-layout.tsx` — generator wrapper
- [ ] `unit-converter-layout.tsx` — unit converter wrapper

#### Specialized Tool Components
- [ ] `cheque-generator.tsx` — renders cheque preview
- [ ] `db-schema-visualizer-interactive.tsx` — renders ER diagram
- [ ] `file-tree-visualizer.tsx` — renders tree structure
- [ ] `islamic-calculators.tsx` — renders Islamic calc forms
- [ ] `tool-popup.tsx` — modal for tool quick-access

#### Plan Access Components
- [ ] `feature-gate.tsx` — hides premium features for free users
- [ ] `feature-gate.tsx` — shows upgrade prompt
- [ ] `feature-gate.tsx` — renders content for paid users

#### UI Primitives (`apps/web/src/components/ui/`)
- [ ] `button.tsx` — all variants render (default, outline, destructive, ghost)
- [ ] `button.tsx` — loading state shows spinner
- [ ] `button.tsx` — disabled state prevents clicks
- [ ] `input.tsx` — controlled input works
- [ ] `input.tsx` — error state displays message
- [ ] `select.tsx` — opens dropdown, selects value
- [ ] `dialog.tsx` — opens/closes, traps focus
- [ ] `tabs.tsx` — switches between tab panels
- [ ] `badge.tsx` — all variants render
- [ ] `card.tsx` — renders content
- [ ] `checkbox.tsx` — toggle state
- [ ] `dropdown-menu.tsx` — opens, selects item
- [ ] `progress.tsx` — shows percentage
- [ ] `skeleton.tsx` — renders loading placeholder
- [ ] `switch.tsx` — toggles on/off
- [ ] `textarea.tsx` — controlled textarea
- [ ] `tooltip.tsx` — shows on hover

### 8.2 Admin App Components (`apps/admin/src/components/`)

#### RBAC Components
- [ ] `permission-guard.tsx` — hides content without permission
- [ ] `permission-guard.tsx` — shows content with permission
- [ ] `protected-route.tsx` — redirects unauthenticated users
- [ ] `use-rbac.tsx` hook — returns correct permissions

#### Admin UI Primitives
- [ ] `Badge.tsx` — StatusBadge, PlanBadge, TierBadge, RoleBadge
- [ ] `Button.tsx` — all variants + loading state
- [ ] `Card.tsx` — CardHeader + CardContent
- [ ] `DataTable.tsx` — renders rows, columns, pagination, sorting
- [ ] `Form.tsx` — FormGroup, Input, Select, Textarea, Checkbox
- [ ] `Modal.tsx` — Modal, ConfirmModal, TotpModal
- [ ] `Sheet.tsx` — slide-in panel

### 8.3 Custom Hooks (`apps/web/src/hooks/`)
- [ ] `use-auth.tsx` — returns user, isAuthenticated, login, logout
- [ ] `use-coins.ts` — returns balance, spend, refund, claim daily
- [ ] `use-subscription.ts` — returns plan, upgrade, cancel, resume
- [ ] `use-plan-access.tsx` — returns feature access checks
- [ ] `use-session.ts` — returns session data, refresh
- [ ] `use-file-upload.ts` — returns upload state, progress, handlers
- [ ] `use-code-editor.ts` — returns editor state, execute
- [ ] `use-utils.ts` — returns utility functions (copy, format)

---

## 9. Phase 8 — Theme & Design System Testing

> **Requires:** Vitest + happy-dom, visual regression (Chromatic or Percy)
> **Framework:** Vitest + snapshot tests + visual regression

### 9.1 Theme Package (`packages/theme/`)
- [ ] `presets.ts` — All preset themes load without error
- [ ] `presets.ts` — Each preset has complete color tokens
- [ ] `derive.ts` — Theme derivation produces valid CSS variables
- [ ] `derive.ts` — Light/dark mode derivation correct
- [ ] `access.ts` — Theme access utilities return correct values
- [ ] `utils.ts` — Theme utility functions work correctly
- [ ] `types.ts` — Theme types are comprehensive and correct

### 9.2 Visual Regression Testing
- [ ] Homepage — desktop screenshot matches baseline
- [ ] Homepage — mobile screenshot matches baseline
- [ ] Dashboard — light theme matches baseline
- [ ] Dashboard — dark theme matches baseline
- [ ] Tool page — all tool layouts match baseline
- [ ] Admin dashboard — matches baseline
- [ ] All UI primitives — Storybook-style snapshots

### 9.3 Responsive Design
- [ ] 320px (small mobile) — No horizontal scroll
- [ ] 375px (iPhone) — Proper layout
- [ ] 768px (tablet) — Sidebar collapses
- [ ] 1024px (laptop) — Standard layout
- [ ] 1440px (desktop) — Full width utilized
- [ ] 1920px+ (ultrawide) — No excessive stretching

---

## 10. Phase 9 — FastAPI Backend Integration Testing

> **Requires:** FastAPI TestClient, Redis mock, file system sandbox
> **Framework:** pytest + httpx + pytest-asyncio

### 10.1 Tool Execution Endpoints
- [ ] `POST /api/v1/tools/execute` — Image conversion (PNG→JPEG)
- [ ] `POST /api/v1/tools/execute` — Video conversion (MP4→WebM)
- [ ] `POST /api/v1/tools/execute` — PDF operations (merge, split, compress)
- [ ] `POST /api/v1/tools/execute` — Document conversion (DOCX→PDF)
- [ ] `POST /api/v1/tools/execute` — Archive operations (zip, unzip, tar)
- [ ] `POST /api/v1/tools/execute` — Font conversion (TTF→WOFF2)
- [ ] `POST /api/v1/tools/execute` — File type detection
- [ ] `POST /api/v1/tools/execute` — Python tools (text, data)
- [ ] File upload — size limit enforcement (50MB default)
- [ ] File upload — type validation (allowed extensions)
- [ ] File upload — malicious file detection
- [ ] Result download — correct content-type headers
- [ ] Result download — temp file cleanup after TTL

### 10.2 Job Queue
- [ ] Long-running job → queued → processing → complete
- [ ] Job status polling returns correct state
- [ ] Job result retrieval after completion
- [ ] Job expiration after TTL
- [ ] Failed job — error details available
- [ ] Concurrent job limit enforcement

### 10.3 Middleware
- [ ] Auth middleware — validates API key
- [ ] Auth middleware — validates session token
- [ ] Auth middleware — rejects expired tokens
- [ ] Rate limiter — per-IP limiting
- [ ] Rate limiter — per-user limiting
- [ ] Rate limiter — burst tolerance
- [ ] Error tracking middleware — captures exceptions
- [ ] Request logging — logs method, path, status, duration

### 10.4 Scrapers (if applicable)
- [ ] Terminal scraper — KICT schedule fetch
- [ ] Terminal scraper — KGTL schedule fetch
- [ ] Terminal scraper — QICT schedule fetch
- [ ] Terminal scraper — SAPT schedule fetch
- [ ] Scraper connection pooling works
- [ ] Scraper caching — Redis TTL respected
- [ ] Scraper error handling — graceful degradation

---

## 11. Phase 10 — Performance & Load Testing

> **Requires:** k6, Artillery, or Locust; production-like environment
> **Framework:** k6 (JavaScript-based) or Locust (Python-based)

### 11.1 Load Test Scenarios

#### API Throughput
- [ ] 100 concurrent users — tool list endpoint (target: <200ms p95)
- [ ] 100 concurrent users — tool execution (target: <500ms p95)
- [ ] 500 concurrent users — homepage (target: <300ms p95)
- [ ] 1000 concurrent users — health check (target: <50ms p95)

#### Database Performance
- [ ] 10,000 users table — query performance acceptable
- [ ] 100,000 tool executions — aggregation queries fast
- [ ] 1,000,000 coin transactions — balance queries fast
- [ ] Concurrent write test — 100 simultaneous coin deductions
- [ ] Index effectiveness — all queries use indexes (no seq scan)

#### File Processing
- [ ] 10MB image conversion — completes under 5s
- [ ] 50MB video conversion — completes under 30s
- [ ] 100 concurrent file uploads — no server crash
- [ ] Memory usage under file upload load — no OOM

### 11.2 Stress Testing
- [ ] Ramp from 0 → 1000 users over 5 minutes
- [ ] Sustained 500 users for 30 minutes
- [ ] Spike test — 0 → 2000 → 0 in 30 seconds
- [ ] Server recovery after spike
- [ ] Error rate stays under 1% at target load
- [ ] No memory leaks over sustained load

### 11.3 Soak Testing
- [ ] 100 users for 4 hours — memory stable
- [ ] 100 users for 4 hours — response times stable
- [ ] 100 users for 4 hours — no connection leaks
- [ ] Database connection pool stable
- [ ] Redis connection pool stable

### 11.4 Benchmarks
- [ ] Next.js SSR render time — <100ms per page
- [ ] tRPC query resolution — <50ms for simple queries
- [ ] Drizzle ORM query — <20ms for indexed lookups
- [ ] Redis cache hit — <5ms
- [ ] FastAPI tool dispatch — <10ms overhead

---

## 12. Phase 11 — Security Testing

> **Requires:** OWASP ZAP, Burp Suite, npm audit, snyk
> **Framework:** Manual + automated security scanners

### 12.1 OWASP Top 10 Checks

#### Injection
- [ ] SQL injection — parameterized queries (Drizzle handles this)
- [ ] NoSQL injection — not applicable (PostgreSQL only)
- [ ] XSS — all user input sanitized in React output
- [ ] XSS — Content-Security-Policy headers set
- [ ] Command injection — no shell exec with user input
- [ ] Path traversal — file upload paths validated

#### Authentication Failures
- [ ] Password hashing — bcrypt/argon2 (not MD5/SHA)
- [ ] Session tokens — cryptographically random
- [ ] Session fixation — token rotated on login
- [ ] Brute force — rate limiting on login endpoint
- [ ] Account lockout — after N failed attempts
- [ ] Password complexity — enforced server-side

#### Sensitive Data Exposure
- [ ] Passwords never in logs
- [ ] API keys never in client-side code
- [ ] Stripe secret key server-only
- [ ] Database credentials in env vars (not code)
- [ ] HTTPS enforced (HSTS headers)
- [ ] Cookies — httpOnly, secure, sameSite

#### Broken Access Control
- [ ] Admin routes — require admin role
- [ ] User routes — can only access own data
- [ ] API keys — scoped to owner
- [ ] Subscription — can only modify own
- [ ] Admin RBAC — permissions enforced server-side
- [ ] IDOR — no object ID enumeration

#### Security Misconfiguration
- [ ] Debug mode off in production
- [ ] Stack traces not exposed to users
- [ ] CORS restricted to known origins
- [ ] Unnecessary HTTP methods disabled
- [ ] Server version headers removed

#### Vulnerable Components
- [ ] `npm audit` — no critical vulnerabilities
- [ ] `pip audit` — no critical vulnerabilities
- [ ] Docker images — base images scanned
- [ ] Outdated dependencies flagged

### 12.2 API Security
- [ ] Rate limiting on all endpoints
- [ ] Request body size limits
- [ ] File upload type validation (not just extension)
- [ ] File upload — magic bytes verification
- [ ] Webhook signature verification (Stripe, Polar)
- [ ] CSRF protection on state-changing requests
- [ ] API key rotation mechanism works
- [ ] API versioning prevents breaking changes

### 12.3 Data Privacy
- [ ] User data export (GDPR right to data portability)
- [ ] Account deletion removes PII
- [ ] Cookie consent mechanism
- [ ] Third-party tracking opt-out

---

## 13. Phase 12 — Accessibility (a11y) Testing

> **Requires:** axe-core, Playwright + @axe-core/playwright, Lighthouse
> **Framework:** Playwright a11y assertions + axe-core

### 13.1 Automated a11y Scans (Every Page)
- [ ] Homepage — 0 critical/serious violations
- [ ] Signin page — 0 critical/serious violations
- [ ] Signup page — 0 critical/serious violations
- [ ] Dashboard — 0 critical/serious violations
- [ ] Tools listing — 0 critical/serious violations
- [ ] Tool execution page — 0 critical/serious violations
- [ ] Settings pages — 0 critical/serious violations
- [ ] Pricing page — 0 critical/serious violations
- [ ] Admin dashboard — 0 critical/serious violations
- [ ] Admin user management — 0 critical/serious violations

### 13.2 WCAG 2.1 AA Compliance
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text
- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Focus order is logical (tab navigation)
- [ ] Focus visible on all interactive elements
- [ ] Skip navigation link present
- [ ] Page has proper heading hierarchy (h1 → h2 → h3)
- [ ] ARIA landmarks used (main, nav, aside, footer)
- [ ] Modals trap focus correctly
- [ ] Keyboard-only navigation works on all pages
- [ ] Screen reader announcements for dynamic content

### 13.3 Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys navigate dropdowns/menus
- [ ] No focus traps (except modals)
- [ ] Tool execution controllable via keyboard

---

## 14. Phase 13 — SEO & Lighthouse Testing

> **Requires:** Lighthouse CI, next-sitemap, structured data testing tool
> **Framework:** Lighthouse CI + custom assertions

### 14.1 Lighthouse Scores (Target ≥ 90 each)
- [ ] Homepage — Performance ≥ 90
- [ ] Homepage — Accessibility ≥ 90
- [ ] Homepage — Best Practices ≥ 90
- [ ] Homepage — SEO ≥ 90
- [ ] Tools page — Performance ≥ 90
- [ ] Tool detail page — Performance ≥ 85 (complex UI)
- [ ] Dashboard — Performance ≥ 85
- [ ] Admin — Performance ≥ 85

### 14.2 Core Web Vitals
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] TTFB (Time to First Byte) < 600ms
- [ ] FCP (First Contentful Paint) < 1.8s
- [ ] INP (Interaction to Next Paint) < 200ms

### 14.3 SEO Checks
- [ ] All pages have unique `<title>` tags
- [ ] All pages have `<meta name="description">`
- [ ] Open Graph tags on all public pages
- [ ] Twitter Card meta tags
- [ ] Canonical URLs set
- [ ] robots.txt exists and is correct
- [ ] sitemap.xml generated and valid
- [ ] JSON-LD structured data on tool pages
- [ ] hreflang tags (if multi-language)
- [ ] Mobile-friendly viewport meta tag
- [ ] No broken internal links (404 audit)

---

## 15. Phase 14 — Error Handling & Resilience Testing

> **Requires:** Chaos engineering tools, Sentry test mode
> **Framework:** Custom test scripts + Sentry

### 15.1 Error Boundary Testing
- [ ] React Error Boundary catches component crashes
- [ ] Error fallback UI renders correctly
- [ ] Error reported to Sentry
- [ ] User can recover (refresh/navigate away)
- [ ] Nested error boundaries work independently

### 15.2 API Error Handling
- [ ] 400 — Returns structured error response
- [ ] 401 — Redirects to login (web), returns JSON (API)
- [ ] 403 — Proper forbidden message
- [ ] 404 — Custom 404 page renders
- [ ] 429 — Rate limit response with Retry-After
- [ ] 500 — Generic error message (no stack trace leak)
- [ ] Network timeout — graceful degradation
- [ ] Database down — returns 503 Service Unavailable
- [ ] Redis down — fallback to direct DB queries
- [ ] Stripe down — queues pending operations
- [ ] Polar down — queues pending operations

### 15.3 Resilience
- [ ] Database connection pool exhaustion — queues or rejects gracefully
- [ ] Redis connection lost — reconnection logic
- [ ] Memory pressure — garbage collection effective
- [ ] Disk full — file upload rejected gracefully
- [ ] Concurrent request spike — no process crash
- [ ] Malformed request body — proper 400 response
- [ ] Oversized request body — rejected before processing
- [ ] Slow client upload — doesn't hold server resources indefinitely

---

## 16. Phase 15 — CI/CD Pipeline Testing

> **Requires:** GitHub Actions (or equivalent CI), Docker, staging environment
> **Framework:** GitHub Actions workflows

### 16.1 Pipeline Configuration
- [ ] Lint job — runs ESLint + Ruff on every PR
- [ ] Unit test job — runs Vitest + pytest on every PR
- [ ] Build job — runs `next build` for both apps
- [ ] Type check job — runs `tsc --noEmit`
- [ ] Integration test job — runs against test DB (on merge)
- [ ] E2E test job — runs Playwright (nightly or on release)
- [ ] Security audit job — runs `npm audit` + `pip audit`
- [ ] Docker build job — builds all images
- [ ] Deploy job — deploys to staging on merge to main
- [ ] Deploy job — deploys to production on tag/release

### 16.2 Pipeline Quality Gates
- [ ] PR blocked if any test fails
- [ ] PR blocked if lint errors > 0
- [ ] PR blocked if type errors > 0
- [ ] PR blocked if build fails
- [ ] PR blocked if security audit has critical vulns
- [ ] Coverage threshold enforced (e.g., ≥ 70%)
- [ ] Bundle size check — alert if JS grows > 10%

### 16.3 Docker Testing
- [ ] `docker build` succeeds for web app
- [ ] `docker build` succeeds for admin app
- [ ] `docker build` succeeds for FastAPI
- [ ] `docker compose up` starts all services
- [ ] Health checks pass in Docker
- [ ] Environment variable injection works
- [ ] Volume mounts work (for persistent data)
- [ ] Inter-service communication works (web → API → DB)

---

## 17. Tools & Dependencies Needed

| Tool                      | Purpose                  | Install Command                                                                            |
|---------------------------|--------------------------|--------------------------------------------------------------------------------------------|
| **Playwright**            | E2E browser testing      | `pnpm add -D @playwright/test && npx playwright install`                                   |
| **React Testing Library** | Component testing        | `pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event` |
| **MSW**                   | API mocking              | `pnpm add -D msw`                                                                          |
| **k6**                    | Load testing             | `brew install k6` or `choco install k6`                                                    |
| **axe-core**              | Accessibility testing    | `pnpm add -D @axe-core/playwright`                                                         |
| **Lighthouse CI**         | Performance testing      | `pnpm add -D @lhci/cli`                                                                    |
| **Stripe CLI**            | Webhook testing          | `stripe listen --forward-to localhost:3000/api/webhooks/stripe`                            |
| **Docker**                | Container testing        | System install                                                                             |
| **testcontainers**        | DB/Redis test containers | `pnpm add -D testcontainers`                                                               |
| **Percy/Chromatic**       | Visual regression        | SaaS — requires account                                                                    |
| **OWASP ZAP**             | Security scanning        | Docker image `owasp/zap2docker-stable`                                                     |

---

## 18. Estimated Effort

| Phase                                  | Test Cases | Estimated Days  | Priority     |
|----------------------------------------|------------|-----------------|--------------|
| **Phase 1** — DB + tRPC Integration    | ~120       | 5-7 days        | 🔴 Critical  |
| **Phase 2** — API Routes (Web + Admin) | ~140       | 5-7 days        | 🔴 Critical  |
| **Phase 3** — Auth & Authorization     | ~80        | 3-5 days        | 🔴 Critical  |
| **Phase 4** — Billing & Payments       | ~70        | 3-5 days        | 🔴 Critical  |
| **Phase 5** — E2E Browser (Web)        | ~150       | 7-10 days       | 🟡 High      |
| **Phase 6** — E2E Browser (Admin)      | ~90        | 4-6 days        | 🟡 High      |
| **Phase 7** — UI Components            | ~100       | 4-6 days        | 🟡 High      |
| **Phase 8** — Theme & Design           | ~30        | 1-2 days        | 🟢 Medium    |
| **Phase 9** — FastAPI Integration      | ~60        | 3-4 days        | 🟡 High      |
| **Phase 10** — Performance & Load      | ~40        | 3-5 days        | 🟢 Medium    |
| **Phase 11** — Security                | ~50        | 3-5 days        | 🔴 Critical  |
| **Phase 12** — Accessibility           | ~40        | 2-3 days        | 🟡 High      |
| **Phase 13** — SEO & Lighthouse        | ~30        | 1-2 days        | 🟢 Medium    |
| **Phase 14** — Error & Resilience      | ~30        | 2-3 days        | 🟡 High      |
| **Phase 15** — CI/CD Pipeline          | ~25        | 2-3 days        | 🔴 Critical  |
| **TOTAL**                              | **~1,055** | **~48-73 days** |              |

### Recommended Execution Order

1. **Phase 1 + 2** — Integration + API routes (foundation for everything else)
2. **Phase 3** — Auth (blocks all authenticated testing)
3. **Phase 4** — Billing (blocks payment flow testing)
4. **Phase 11** — Security (should be done before any public launch)
5. **Phase 5 + 6** — E2E browser testing (comprehensive user journey validation)
6. **Phase 15** — CI/CD (automate everything above)
7. **Phase 7 + 8** — UI + Theme (component-level confidence)
8. **Phase 9** — FastAPI integration (backend operations)
9. **Phase 10** — Performance (optimize before scale)
10. **Phase 12 + 13** — a11y + SEO (polish before launch)
11. **Phase 14** — Resilience (production hardening)

---

*This roadmap covers production-grade, industry-level testing for the complete HSAFX World App platform.*
*Total test cases when fully implemented: ~3,686 (2,631 existing + ~1,055 new)*

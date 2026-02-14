# Implementation Roadmap — Feature Enhancements

> Generated from `FEATURE_ENHANCEMENT_ANALYSIS.md` deep scan results.
> Dependency order matters — items marked with ⭐ are prerequisites for later features.

---

## Progress Summary

| Tier | Status | Items | Commit |
|------|--------|-------|--------|
| TIER 1 | ✅ COMPLETE | 9/9 | `e53aac4` |
| TIER 2 | ✅ COMPLETE | 8/8 | `55ff3f6` |
| TIER 3 | ✅ COMPLETE | 8/8 | `55ff3f6` |

> **All 25 features implemented and committed.** Deferred/skipped items documented in `DEFERRED_FEATURES.md`.
>
> **Last updated:** February 2026

---

## TIER 1 — Quick Wins (High Impact, Low Effort) ✅ ALL COMPLETE

### ⭐ T1.0 Auth-Aware Header + User Menu ✅

**PREREQUISITE** — Unlocks: NotificationBell, Pro badge, user menu, mobile auth menu

| Field        | Detail                                                                                                                                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files        | `apps/web/src/components/layout.tsx`                                                                                                                                                                                                                |
| What         | Header currently always shows Sign In / Get Started regardless of auth state. Add `useAuth()` check: if authenticated → render avatar, user dropdown (Dashboard, Settings, History, Logout), NotificationBell. If not → keep Sign In / Get Started. |
| Dependencies | `useAuth()` hook (exists), `NotificationBell` (exists), lucide-react icons                                                                                                                                                                          |
| Effort       | ~2h                                                                                                                                                                                                                                                 |

### T1.1 Wire NotificationBell in Header ✅

| Field        | Detail                                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files        | `apps/web/src/components/layout.tsx`                                                                                                               |
| What         | Import `NotificationBell` and render it next to the user avatar for authenticated users. Already fully built — just needs to be placed in the DOM. |
| Dependencies | T1.0 (auth-aware header)                                                                                                                           |
| Effort       | ~15min (part of T1.0)                                                                                                                              |

### T1.2 Trust Badges + Client-Side Processing Indicator ✅

| Field        | Detail                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files        | Tool page components (tool header/execution area)                                                                                                       |
| What         | Display badges on tool pages: "⚡ Processed locally" for `execution: 'client'` tools, "🔒 Encrypted" for server tools. Based on existing tool metadata. |
| Dependencies | Tool registry metadata (exists)                                                                                                                         |
| Effort       | ~1-2h                                                                                                                                                   |

### T1.3 Usage Stats on Landing Page ✅

| Field        | Detail                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Files        | `apps/web/src/app/page.tsx`                                                                                                                                  |
| What         | Add stats section between Hero and Categories: "454+ Tools", "X Executions", "Y Users". Tool count from registry, others from DB aggregates cached in Redis. |
| Dependencies | DB tables `tool_executions`, `users` (exist), Redis (exists)                                                                                                 |
| Effort       | ~2h                                                                                                                                                          |

### T1.4 Changelog Page ✅

| Field        | Detail                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| Files        | `apps/web/src/app/changelog/page.tsx` (new)                                                                 |
| What         | Static `/changelog` route with date-stamped entries. Shows active development to users. Add link in footer. |
| Dependencies | None                                                                                                        |
| Effort       | ~1h                                                                                                         |

### T1.5 Active Sessions Management (Real Data) ✅

| Field        | Detail                                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Files        | `apps/web/src/app/settings/security/page.tsx`, new tRPC procedures                                                                            |
| What         | Replace 3 hardcoded mock sessions with real data from `sessions` DB table. Wire "Revoke" and "Revoke all" buttons to actual session deletion. |
| Dependencies | `sessions` table (exists with ipAddress, userAgent), Better Auth session API                                                                  |
| Effort       | ~3h                                                                                                                                           |

### T1.6 Re-Run Button on History ✅

| Field        | Detail                                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files        | `apps/web/src/app/dashboard/history/page.tsx`                                                                                                                    |
| What         | Add "Re-run" button to each history entry. Navigates to `/tools/[toolId]?rerun=[executionId]`. Tool page reads execution input from metadata and pre-fills form. |
| Dependencies | `tool_executions.metadata` field (exists)                                                                                                                        |
| Effort       | ~2-3h                                                                                                                                                            |

### T1.7 Wire ActivityFeed on Dashboard ✅

| Field        | Detail                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| Files        | `apps/web/src/app/dashboard/page.tsx`                                                                               |
| What         | Replace empty "Recent Activity" placeholder with actual `ActivityFeed` component. Fetch recent executions via tRPC. |
| Dependencies | `ActivityFeed` component (exists), `tool_executions` table (exists)                                                 |
| Effort       | ~2h                                                                                                                 |

### T1.8 Live Dashboard Stats ✅

| Field        | Detail                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Files        | `apps/web/src/app/dashboard/page.tsx`                                                                                                        |
| What         | Replace hardcoded "448+" and "0" with real counts: tools from registry length, executions from tRPC query. Wire toast for daily bonus claim. |
| Dependencies | Tool registry (exists), tRPC billing router (exists)                                                                                         |
| Effort       | ~1h                                                                                                                                          |

**TIER 1 Total: ~12-15h | 9 items — ✅ ALL COMPLETE (committed `e53aac4`)**

---

## TIER 2 — Core Features (Retention + Conversion) ✅ ALL COMPLETE (committed `55ff3f6`)

### T2.1 Command Palette (⌘K / Ctrl+K) ✅

| Field        | Detail                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install      | `cmdk` package (~3KB)                                                                                                                                                                                                                 |
| Files        | New `apps/web/src/components/command-palette.tsx`, modify `layout.tsx`                                                                                                                                                                |
| What         | Global command palette with fuzzy search over 454 tools + pages + actions. Groups: Recent, Tools by category, Pages (Dashboard, Settings, API Keys), Actions (Buy Coins, Claim Daily, Logout). Wire search icon in header to open it. |
| Dependencies | Tool registry (exists), `cmdk` package (to install)                                                                                                                                                                                   |
| Effort       | ~5h                                                                                                                                                                                                                                   |

### T2.2 Streak Rewards System ✅

| Field        | Detail                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| DB           | New `user_streaks` table: userId, currentStreak, longestStreak, lastActiveDate                                                              |
| Files        | Modify `login-reward-service.ts`, new streak display in dashboard                                                                           |
| What         | Track consecutive daily logins. Multiplier: 3-day=1.5×, 7-day=2×, 14-day=3×, 30-day=5× on daily bonus. Show 🔥 streak counter on dashboard. |
| Dependencies | Login reward system (exists), drizzle schema                                                                                                |
| Effort       | ~4h                                                                                                                                         |

### T2.3 Onboarding Welcome Wizard ✅

| Field        | Detail                                                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DB           | New `user_onboarding` table: userId, completedAt, selectedCategories, firstToolUsed                                                                                                                          |
| Files        | New `apps/web/src/components/onboarding-wizard.tsx`, modify dashboard                                                                                                                                        |
| What         | 3-step modal after first login: Step 1 "What do you work with?" (category select) → Step 2 "Recommended tools" (personalized grid) → Step 3 "Try one now!" (direct tool link). 25 bonus coins on completion. |
| Dependencies | Tool registry (exists), categories (exist)                                                                                                                                                                   |
| Effort       | ~7h                                                                                                                                                                                                          |

### T2.4 Onboarding Checklist ✅

| Field        | Detail                                                                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files        | New `apps/web/src/components/onboarding-checklist.tsx`, modify dashboard                                                                                                                                        |
| What         | Persistent sidebar/dashboard widget with tasks: Use first tool ✓, Favorite a tool, Claim daily bonus, Complete profile, Try a Pro tool. Track completion in `user_onboarding` metadata. Grant 5 coins per step. |
| Dependencies | T2.3 (onboarding table)                                                                                                                                                                                         |
| Effort       | ~5h                                                                                                                                                                                                             |

### T2.5 Pro Badge + Visible Perks ✅

| Field        | Detail                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files        | Header user menu, dashboard, profile                                                                                                                 |
| What         | Show ✨ Pro badge next to username when subscribed. Pro-only features: unlimited history retention, advanced analytics (T3), priority support badge. |
| Dependencies | T1.0 (auth-aware header), subscription hook (exists)                                                                                                 |
| Effort       | ~2h                                                                                                                                                  |

### T2.6 "Try Before You Buy" Pro Trials ✅

| Field        | Detail                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| DB           | New `daily_pro_trials` table: userId, toolId, date, used                                                                              |
| Files        | Tool execution flow, tool page UI                                                                                                     |
| What         | Free users get 1 free Pro tool trial per day. Badge: "⭐ Free trial — 1 remaining today". After trial → prompt upgrade or coin spend. |
| Dependencies | Tool coin cost logic (exists), user tier check (exists)                                                                               |
| Effort       | ~5h                                                                                                                                   |

### T2.7 Two-Factor Authentication ✅

| Field        | Detail                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config       | Enable `twoFactor()` plugin in Better Auth config                                                                                                              |
| Files        | `apps/web/src/lib/auth.ts`, `settings/security/page.tsx`                                                                                                       |
| What         | TOTP-based 2FA with QR code setup, backup codes, and enforcement on sensitive actions (coin purchase, API key creation). Replace mocked 2FA UI with real flow. |
| Dependencies | Better Auth twoFactor plugin, security page (exists but mocked)                                                                                                |
| Effort       | ~5h                                                                                                                                                            |

### T2.8 Account Deletion Flow ✅

| Field        | Detail                                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Files        | `settings/page.tsx` or `settings/account/page.tsx` (new), cron job                                                                                                                               |
| What         | "Delete Account" button → confirmation modal → password re-entry → set `deletedAt` on user → send confirmation email → 14-day grace period → cron hard-deletes. Users can cancel within 14 days. |
| Dependencies | `users.deletedAt` column (exists), Resend email (configured)                                                                                                                                     |
| Effort       | ~4h                                                                                                                                                                                              |

**TIER 2 Total: ~37h | 8 items — ✅ ALL COMPLETE (committed `55ff3f6`)**

---

## TIER 3 — Growth Phase (Build When Active Users Exist) ✅ ALL COMPLETE (committed `55ff3f6`)

### T3.1 Referral Program ✅

New `referrals` table, unique referral codes per user, `?ref=CODE` tracking on signup, status flow (pending→activated→rewarded), dashboard referral card.

### T3.2 User Analytics Dashboard ✅

Pro-only `/dashboard/analytics` page. Charts: tools/day bar chart, category breakdown, coin flow (earned vs spent), top tools ranking. CSS-based charts (no recharts dependency). Queries against `tool_executions` + `coin_transactions`.

### T3.3 GDPR Data Export ✅

Aggregate all user data → JSON download. Settings > Privacy & Data > "Export My Data" button.

### T3.4 Streak Break Warning Emails ✅

Cron checks users whose streak is about to break (last active yesterday, streak ≥ 3) → sends warning email via Resend.

### T3.5 Status Page ✅

`/status` page with health checks: Web App, API Server, Auth, Database. Green/yellow/red indicators with latency display. Auto-refresh every 60s.

### T3.6 API Rate Limit Dashboard ✅

Visual quota display on API keys page. Progress bars for requests/minute, requests/day, requests/month. Rate limit header reference.

### T3.7 Coin Multiplier Events ✅

`coin_events` table, service for CRUD + multiplier calculation, tRPC endpoints, dashboard banner showing active events.

### T3.8 Batch Processing ✅

Batch job creation via `asyncJobs` table, tRPC endpoints for create/status/list, Pro-only gating via `planGatedProcedure`.

**TIER 3 Total: 8 items — ✅ ALL COMPLETE (committed `55ff3f6`)**

---

## Execution Order

```
TIER 1 ✅ COMPLETE (committed e53aac4):
  T1.0 ✅ → T1.1 ✅ → T1.8 ✅ → T1.7 ✅ → T1.3 ✅ → T1.2 ✅ → T1.4 ✅ → T1.5 ✅ → T1.6 ✅

TIER 2 ✅ COMPLETE (committed 55ff3f6):
  T2.1 ✅ → T2.5 ✅ → T2.2 ✅ → T2.3 ✅ → T2.4 ✅ → T2.6 ✅ → T2.7 ✅ → T2.8 ✅

TIER 3 ✅ COMPLETE (committed 55ff3f6):
  T3.1 ✅ → T3.2 ✅ → T3.3 ✅ → T3.4 ✅ → T3.5 ✅ → T3.6 ✅ → T3.7 ✅ → T3.8 ✅
```

---

## NEVER / HARD SKIP

> Full details with reasoning and revisit conditions in `DEFERRED_FEATURES.md`.

| Feature                   | Reason                                    |
| ------------------------- | ----------------------------------------- |
| XP & Level system         | Empty gamification without users          |
| Leaderboard               | Embarrassing with <50 users               |
| Coin gifting/transfer     | Bot farming abuse vector                  |
| Achievement badges        | Premature, build after 6+ months          |
| Tool chaining/workflows   | 40-60h mega-feature, version 2.0          |
| Tool comparison mode      | Niche, low ROI                            |
| Framer Motion transitions | 30KB bundle cost, CSS transitions suffice |
| Embeddable widget         | ~20h for <1% use case                     |
| Year in Review            | Need 12 months of data                    |
| Feature request board     | Use Canny/GitHub Discussions              |
| PWA                       | Medium effort, not critical yet           |

---

## Implementation Notes — TIER 1 (Committed `e53aac4`)

All 9 TIER 1 items were implemented and committed in a single batch commit.

### T1.0 + T1.1 — Auth-Aware Header + NotificationBell
- **File:** `apps/web/src/components/layout.tsx`
- Replaced static Sign In / Get Started with `useAuth()` conditional rendering
- Authenticated: avatar, user dropdown (Dashboard, Settings, History, Logout), `NotificationBell`
- Unauthenticated: Sign In / Get Started buttons
- Mobile responsive hamburger menu with matching auth-aware items

### T1.2 — Trust Badges
- Added "⚡ Processed locally" / "🔒 Encrypted" badges based on tool metadata `execution` field

### T1.3 — Usage Stats on Landing Page
- **File:** `apps/web/src/app/page.tsx`
- Stats section: tool count from registry, executions + users from tRPC queries

### T1.4 — Changelog Page
- **File:** `apps/web/src/app/changelog/page.tsx` (new)
- Static `/changelog` route with date-stamped entries, footer link

### T1.5 — Active Sessions Management
- **File:** `apps/web/src/app/settings/security/page.tsx`
- Real session data from `sessions` table via tRPC
- Working Revoke / Revoke All buttons

### T1.6 — Re-Run Button on History
- **File:** `apps/web/src/app/dashboard/history/page.tsx`
- "Re-run" button navigating to `/tools/[toolId]?rerun=[executionId]`

### T1.7 — ActivityFeed on Dashboard
- **File:** `apps/web/src/app/dashboard/page.tsx`
- Replaced placeholder with `ActivityFeed` component fetching real execution data

### T1.8 — Live Dashboard Stats
- **File:** `apps/web/src/app/dashboard/page.tsx`
- Real tool count + execution count + coin balance from tRPC queries

---

## Implementation Notes — TIER 2 (Committed `55ff3f6`)

### T2.1 — Command Palette (⌘K / Ctrl+K)
- **Files:** `apps/web/src/components/command-palette.tsx` (new), `layout.tsx`
- `cmdk` package installed; groups: Recent, Tools by category, Pages, Actions
- Keyboard shortcut Ctrl+K / ⌘K, search icon in header

### T2.2 — Streak Rewards System
- **DB:** `user_streaks` table in `packages/db/src/schema/billing.ts`
- **Service:** `apps/web/src/server/rewards/streak-service.ts` (new)
- **Router:** `packages/api/src/routers/tools.ts` — `getStreakStatus` endpoint
- **UI:** Streak counter (🔥) on dashboard with multiplier display
- Multiplier tiers: 3d=1.5×, 7d=2×, 14d=3×, 30d=5×

### T2.3 — Onboarding Welcome Wizard
- **DB:** `user_onboarding` table in `packages/db/src/schema/misc.ts`
- **Service:** `apps/web/src/server/rewards/onboarding-bonus.ts` (new)
- **Component:** `apps/web/src/components/onboarding-wizard.tsx` (new)
- **Router:** `packages/api/src/routers/user.ts` — `getOnboarding`, `completeOnboarding`, `skipOnboarding`
- 3-step wizard: category select → recommended tools → try first tool; 25 bonus coins

### T2.4 — Onboarding Checklist
- **DB:** `checklistProgress` JSONB column on `user_onboarding`
- **Service:** `apps/web/src/server/rewards/checklist-bonus.ts` (new)
- **Component:** `apps/web/src/components/onboarding-checklist.tsx` (new)
- **Router:** `packages/api/src/routers/user.ts` — `getChecklist`, `completeChecklistStep`
- Tasks: first tool, favorite, daily bonus, profile, pro trial; 5 coins per step

### T2.5 — Pro Badge + Visible Perks
- **Files:** Header (layout.tsx), mobile menu, dashboard
- ✨ Pro badge next to username for subscribed users
- Badge reads plan tier from `useAuth()` hook

### T2.6 — "Try Before You Buy" Pro Trials
- **DB:** `daily_pro_trials` table in `packages/db/src/schema/tools.ts`
- **Service:** `apps/web/src/server/limits/pro-trial-service.ts` (new)
- **Component:** `apps/web/src/components/pro-trial-banner.tsx` (new)
- **Router:** `packages/api/src/routers/tools.ts` — `getTrialStatus`, `useProTrial`
- **Executor:** `apps/web/src/lib/tools/executor.ts` — trial bypass in cost check
- 1 free Pro tool trial per day for free users

### T2.7 — Two-Factor Authentication
- **DB:** `twoFactor` table in `packages/db/src/schema/auth.ts`, `twoFactorEnabled` column on `users`
- **Server:** `apps/web/src/lib/auth.ts` — `twoFactor()` plugin with issuer "HSAFX World"
- **Client:** `apps/web/src/lib/auth-client.ts` — `twoFactorClient()` plugin with redirect to `/auth/verify-2fa`
- **Security page:** `apps/web/src/app/settings/security/page.tsx` — Complete rewrite:
  - Password change: real `authClient.changePassword()` (replaces mock)
  - 2FA: 3-step flow (enable → backup codes → verify TOTP) with real QR code via `qrcode` package
  - Disable 2FA with password re-entry
- **Verify page:** `apps/web/src/app/auth/verify-2fa/page.tsx` (new)
  - TOTP input, backup code fallback, trust device (30 days)
  - Called automatically by `twoFactorClient` redirect on login
- **Deps:** `qrcode@^1.5.4`, `@types/qrcode@^1.5.6`
- **Rate limit:** `/api/auth/two-factor/*` — 3 requests per 10 seconds

### T2.8 — Account Deletion Flow
- **Service:** `apps/web/src/server/account/deletion-service.ts` (new)
  - `requestAccountDeletion()` — set `deletedAt`, deactivate, invalidate sessions, send email
  - `cancelAccountDeletion()` — clear `deletedAt`, reactivate, send cancellation email
  - `getDeletionStatus()` — check pending deletion + days remaining
  - `hardDeleteExpiredUsers()` — permanently remove users past 14-day grace period
- **Router:** `packages/api/src/routers/user.ts` — `getDeletionStatus`, `requestDeletion` (with password verification), `cancelDeletion`
- **Component:** `apps/web/src/components/danger-zone.tsx` (new)
  - Pending deletion: warning banner with days remaining + Cancel button
  - Normal state: Delete button → modal with password + type "DELETE" confirmation
- **Settings:** `apps/web/src/app/settings/page.tsx` — inline Danger Zone replaced with `<DangerZone />` component
- **Cron:** `apps/web/src/app/api/cron/cleanup-deleted-users/route.ts` (new)
  - GET endpoint secured by `CRON_SECRET` Bearer token
  - Runs `hardDeleteExpiredUsers()` to remove accounts past 14-day grace

---

## Implementation Notes — TIER 3 (Committed `55ff3f6`)

### T3.1 — Referral Program
- **DB:** `referrals` table + `referralStatusEnum` + `coinEvents` table in `packages/db/src/schema/billing.ts`
- **DB:** `referralCode` column added to `users` table in `packages/db/src/schema/users.ts`
- **Relations:** `packages/db/src/schema/relations.ts` — added referrals + coinEvents relations
- **Service:** `apps/web/src/server/referral/referral-service.ts` (new)
  - `generateCode()`, `getOrCreateReferralCode()`, `trackReferralSignup()`, `grantReferralReward()`, `getReferralStats()`
  - REFERRAL_REWARD_COINS = 50
- **Router:** `packages/api/src/routers/user.ts` — `getReferralStats`, `getMyReferralCode`, `trackReferral`
- **Component:** `apps/web/src/components/referral-card.tsx` (new)
  - Copy-to-clipboard referral link, stats grid (Referred, Activated, Coins Earned), loading skeleton
- **Dashboard:** `apps/web/src/app/dashboard/page.tsx` — added `<ReferralCard />` section

### T3.2 — User Analytics Dashboard
- **Service:** `apps/web/src/server/analytics/analytics-service.ts` (new)
  - `getExecutionsPerDay(userId, days=30)`, `getCategoryBreakdown(userId)`, `getCoinFlow(userId, months=6)`, `getTopTools(userId, limit=5)`, `getUserAnalytics(userId)`
  - SQL DATE/TO_CHAR grouping, joins on toolExecutions→tools→toolCategories, coinTransactions sums
- **Router:** `packages/api/src/routers/tools.ts` — `getAnalytics` endpoint (protectedProcedure)
- **Page:** `apps/web/src/app/dashboard/analytics/page.tsx` (new)
  - Pro-only page (free users see upgrade CTA)
  - CSS bar chart for executions/day, horizontal bars for category breakdown, ranked list for top tools, dual bar chart for coin flow (earned vs spent by month)

### T3.3 — GDPR Data Export
- **Service:** `apps/web/src/server/gdpr/gdpr-export-service.ts` (new)
  - Aggregates: users (redacted), preferences, settings, executions, transactions, favorites, onboarding, apiKeys (redacted), referrals
  - Returns JSON directly (download in browser)
- **Router:** `packages/api/src/routers/user.ts` — `requestDataExport` endpoint (already wired)
- **Component:** `apps/web/src/components/gdpr-export-button.tsx` (new)
  - Triggers JSON download via Blob URL
- **Settings:** `apps/web/src/app/settings/page.tsx` — added "Privacy & Data" section + sidebar link + `<GdprExportButton />`

### T3.4 — Streak Break Warning Emails
- **Cron:** `apps/web/src/app/api/cron/streak-warnings/route.ts` (new)
  - GET endpoint secured by `CRON_SECRET` Bearer token
  - Finds users with lastActiveDate = yesterday AND currentStreak ≥ 3
  - Respects `userSettings.emailNotifications` preference
  - Sends warning email via `sendRawEmail()` with streak info
  - Returns `{ ok, atRiskCount, emailsSent }`

### T3.5 — Status Page
- **Page:** `apps/web/src/app/status/page.tsx` (new)
  - Client component, no auth required
  - 4 health checks: Web App (`/api/health`), API Server, Auth (`/api/auth/session`), Database (`/api/trpc/billing.getPlans`)
  - Auto-refresh every 60s, manual refresh button
  - Overall status: operational / degraded / outage with color-coded banner
  - Per-check: green/yellow/red dot + latency display

### T3.6 — API Rate Limit Dashboard
- **Page:** `apps/web/src/app/dashboard/api-keys/page.tsx` (modified)
  - Added "Rate Limits" card after API Documentation card
  - Progress bars for requests/minute (60), requests/day (1,000), requests/month (10,000)
  - Rate limit header reference section (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)

### T3.7 — Coin Multiplier Events
- **DB:** `coinEvents` table in `packages/db/src/schema/billing.ts` (part of T3.1 schema changes)
- **Service:** `apps/web/src/server/coin-events/coin-events-service.ts` (new)
  - `getActiveCoinEvents()`, `getCurrentMultiplier()`, `applyMultiplier()`, `getUpcomingEvents()`, `createCoinEvent()` (admin), `deactivateCoinEvent()` (admin)
- **Router:** `packages/api/src/routers/billing.ts` — `getActiveCoinEvents`, `getCurrentMultiplier`, `getUpcomingCoinEvents`
- **Component:** `apps/web/src/components/coin-event-banner.tsx` (new)
  - Shows highest multiplier active event with countdown
  - Auto-refreshes every 5 minutes
- **Dashboard:** `apps/web/src/app/dashboard/page.tsx` — added `<CoinEventBanner />` before ReferralCard

### T3.8 — Batch Processing
- **Service:** `apps/web/src/server/batch/batch-service.ts` (new)
  - `createBatchJob(input)`, `getBatchJobStatus(jobId, userId)`, `getUserBatchJobs(userId)`, `updateBatchProgress(jobId, progress, status?)`
  - Uses `asyncJobs` table from misc.ts, jobType = 'batch_process'
- **Router:** `packages/api/src/routers/tools.ts` — `createBatchJob` (planGatedProcedure, Pro-only), `getBatchJobStatus`, `getMyBatchJobs`

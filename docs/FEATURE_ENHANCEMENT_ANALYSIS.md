# Feature Enhancement Analysis — HSAFX WORLD (454 tools, 52 DB tables)

> **⚠️ IMPLEMENTATION STATUS UPDATE (2026-02-14)**
>
> Many features analyzed below have been **implemented**. See `IMPLEMENTATION_ROADMAP.md` for full details.
>
> | Feature                         | Section | Status                |
> | ------------------------------- | ------- | --------------------- |
> | Command Palette (⌘K)            | §1.3    | ✅ IMPLEMENTED (T2.1) |
> | Streak Rewards                  | §2.1    | ✅ IMPLEMENTED (T2.2) |
> | Pro Badge + Visible Perks       | §3.1    | ✅ IMPLEMENTED (T2.5) |
> | "Try Before You Buy" Pro Trials | §3.2    | ✅ IMPLEMENTED (T2.6) |
> | Trust Badges                    | §4.1    | ✅ IMPLEMENTED (T1.2) |
> | Social Proof Counters           | §4.2    | ✅ IMPLEMENTED (T1.3) |
> | Changelog Page                  | §4.3    | ✅ IMPLEMENTED (T1.4) |
> | Onboarding Welcome Wizard       | §5.1    | ✅ IMPLEMENTED (T2.3) |
> | Onboarding Checklist            | §5.2    | ✅ IMPLEMENTED (T2.4) |
> | Auth-Aware Header + User Menu   | §6.1    | ✅ IMPLEMENTED (T1.0) |
> | Active Sessions Management      | §9.2    | ✅ IMPLEMENTED (T1.5) |
> | Two-Factor Authentication       | §9.3    | ✅ IMPLEMENTED (T2.7) |
> | Account Deletion + Grace Period | §9.4    | ✅ IMPLEMENTED (T2.8) |
> | ActivityFeed wiring             | §6.3    | ✅ IMPLEMENTED (T1.7) |
> | Live Dashboard Stats            | §6.4    | ✅ IMPLEMENTED (T1.8) |
> | Re-Run from History             | §7.1    | ✅ IMPLEMENTED (T1.6) |
> | NotificationBell wiring         | §6.2    | ✅ IMPLEMENTED (T1.1) |
> | Referral Program                | §3.3    | ✅ IMPLEMENTED (T3.1) |
> | User Analytics Dashboard        | §6.5    | ✅ IMPLEMENTED (T3.2) |
> | GDPR Data Export                | §9.5    | ✅ IMPLEMENTED (T3.3) |
> | Streak Break Warning Emails     | §2.2    | ✅ IMPLEMENTED (T3.4) |
> | Status Page                     | §4.4    | ✅ IMPLEMENTED (T3.5) |
> | API Rate Limit Dashboard        | §8.1    | ✅ IMPLEMENTED (T3.6) |
> | Coin Multiplier Events          | §3.4    | ✅ IMPLEMENTED (T3.7) |
> | Batch Processing                | §7.2    | ✅ IMPLEMENTED (T3.8) |

## Current State Summary

> **All actionable features have been implemented** (25/25 across T1, T2, T3).
> Skipped/deferred items are documented in `DEFERRED_FEATURES.md`.

| Status | Count | Features |
| ------------ | ----- | ---- |
| ✅ Implemented | 25 | All T1 (9), T2 (8), T3 (8) items — see IMPLEMENTATION_ROADMAP.md |
| ⏭️ Skipped | 11 | XP/levels, leaderboard, coin gifting, achievements, tool chaining, tool comparison, Framer Motion, embeddable widget, year in review, feature request board, PWA |
| 🔵 Pre-existing | 5 | Toast, Skeleton, Search, Notification Bell, Dark/Light toggle |

---

## 1. Intelligent Tool Discovery & Personalization

### 1.1 Smart Search with AI Autocomplete

**Status:** ALREADY EXISTS — tools-page-client.tsx has full client-side search with debouncing + `Ctrl+K` shortcut. A separate reusable `SearchBar` component with suggestions/recent-searches also exists at search.tsx but isn't plugged in.

**Verdict: SKIP for now.**
The search works. The "AI autocomplete" and usage-frequency ranking described here requires a `toolUsageEvents` tracking table + backend ranking algorithm. That's a **P2 optimization** — not needed until you have real users generating usage data. Premature optimization otherwise.

**If you do it later:** ~6-8h. Add `tool_usage_events` table, track per-user frequency, modify search to fetch ranked results from API instead of pure client-side.

---

### 1.2 Personalized Tool Recommendations

**Status:** NONE

**Verdict: SKIP.**
Collaborative filtering ("users who used X also used Y") needs meaningful usage volume (thousands of users). With <100 users, recommendations are noise. The "Related Tools" after execution is simpler but low ROI — users already know what they need.

**Complexity:** HIGH (~20-30h). Needs usage tracking infra + recommendation engine + "Suggested For You" UI + weekly email digest template.

---

### 1.3 Command Palette (⌘K / Ctrl+K)

**Status:** NONE — No `cmdk` dependency. Header has a non-functional search icon.

**Verdict: IMPLEMENT — HIGH VALUE.**
This is the single highest-impact UX feature for a 454-tool platform. Power users expect it. It replaces navigating through categories/pages with instant access to any tool, page, or action. Every modern SaaS has this (Linear, Vercel, Notion).

**Complexity:** LOW-MEDIUM (~4-6h)

- Install `cmdk` (tiny library, 3KB)
- Build `CommandPalette` component with fuzzy search over all 454 tools + pages + actions
- Wire to `Ctrl+K` / `⌘K` global shortcut
- Show recent tools at top, group by category
- Actions: "Go to Settings", "Buy Coins", "View History"

**Alignment:** Perfect. You already have the tool registry and page routes. This is wiring, not building.

---

## 2. Gamification & Engagement Loop

### 2.1 XP & Level System

**Status:** NONE

**Verdict: SKIP for launch / MAYBE later.**
Gamification only works with active users. Adding XP, levels, and badges to an app with few users creates empty, awkward UI ("Level 1, 0 XP"). This is a **growth-phase** feature, not a build-phase feature. Also, your coin system already serves as a soft engagement mechanic.

**Complexity:** MEDIUM (~12-16h). New `user_xp` table, XP grant hooks on every action, level thresholds, UI badges, level-up animations.

**Risk:** If implemented too early, it adds maintenance burden with no user engagement payoff.

---

### 2.2 Streak Rewards & Daily Challenges

**Status:** PARTIAL — Login rewards exist (login-reward-service.ts), daily cap of 50 coins works. But **no streak tracking**, no multiplier, no daily challenges.

**Verdict: IMPLEMENT — MEDIUM VALUE.**
Streak amplification is low-effort since the reward system already exists. Adding a `currentStreak` + `longestStreak` + streak multiplier on top of existing `loginRewardClaims` is straightforward. Proven retention mechanic.

**Complexity:** LOW (~3-5h)

- Add `user_streaks` table (userId, currentStreak, longestStreak, lastActiveDate)
- Modify `claimDailyBonus` to check/update streak and apply multiplier (3-day=2×, 7-day=3×, 30-day=5×)
- Add streak counter to dashboard header (🔥 12)
- Daily challenges are **separate** and more complex — skip those for now

**Alignment:** Builds directly on existing login reward system.

---

### 2.3 Achievement Badges System

**Status:** NONE

**Verdict: DEFER — implement after you have active users.**
Badges without an audience to see them are vanity features. Same issue as XP — needs user volume to be meaningful. The 8 example badges in the doc are well-designed, but the implementation cost (new tables, trigger hooks across 10+ user actions, profile display, toast notifications) is significant.

**Complexity:** HIGH (~15-20h)

- `achievements` definition table + `user_achievements` unlock table
- Trigger logic for each badge condition (first tool use, 10 tools in session, 30-day streak, etc.)
- Achievement toast + profile badge display
- Admin panel for managing achievement definitions

---

### 2.4 Leaderboard

**Status:** NONE

**Verdict: HARD SKIP.**
Leaderboards with <50 active users are embarrassing. Also creates privacy concerns and competitive toxicity. If you ever do this, it should be opt-in and only after 1000+ users.

**Complexity:** LOW (~4h) but pointless without volume.

---

## 3. Coin Economy & Monetization

### 3.1 Coin Multiplier Events

**Status:** NONE

**Verdict: IMPLEMENT LATER — after monetization is live.**
Great mechanic (Double Coin Weekend, Happy Hour) but only valuable when users are actively spending money on coins. Implementing before monetization is live = wasted effort.

**Complexity:** LOW-MEDIUM (~5-7h). New `coin_events` table, backend multiplier check, dashboard banner, admin event creation UI.

**Alignment:** Perfect fit with existing coin system in billing.ts.

---

### 3.2 Coin Gifting / Transfer

**Status:** NONE

**Verdict: SKIP — HIGH RISK.**
Coin transfers create an abuse vector: bots farming daily bonuses across accounts and funneling coins to one account. The 10% fee doesn't prevent this. You'd need anti-abuse systems (cooldowns, verification requirements, transfer limits) that add complexity.

**If you want social features,** referrals (3.8) are safer because they require real signups, not just transfers.

**Complexity:** MEDIUM (~8-10h) + anti-abuse work.

---

### 3.3 Subscription Perks Enhancement

**Status:** PARTIAL — Plans/subscriptions exist (`plans`, `planLimits`, `planFeatures` tables). Pro badge and custom themes are partially there (theme system is tier-gated per appearance-panel.tsx).

**Verdict: IMPLEMENT — HIGH VALUE.**
Visible differentiation drives upgrades. The "Pro" badge next to username, priority queue, and unlimited history are concrete upgrades that justify the subscription price.

**What to actually do:**

- Pro badge in header/profile — ~1h (check user plan, render badge)
- Unlimited history retention for Pro (free = 30 days) — ~2h (add retention policy to history cleanup cron)
- Advanced usage analytics (Pro-only) — ties into the analytics dashboard (Section 7)

**Complexity:** LOW (~3-5h for badge + retention). Analytics is separate.

---

### 3.4 "Try Before You Buy" for Pro Tools

**Status:** NONE

**Verdict: IMPLEMENT — HIGH VALUE.**
This is a proven conversion mechanic. Free users taste a Pro tool, get hooked, and upgrade. Much better than a hard paywall that creates bounce.

**Complexity:** LOW-MEDIUM (~4-6h)

- Track `daily_pro_trials` per user (userId, toolId, date)
- In tool execution flow: if tool is Pro && user is Free → check if trial used today → allow 1 free or prompt upgrade/coin spend
- UI: "⭐ Free trial — 1 remaining today" badge on Pro tools

**Alignment:** Coin cost logic already exists in `toolCoinCosts` and `planCoinRules`.

---

## 4. Trust & Social Proof

### 4.1 Live Activity Feed

**Status:** EXISTS (component built at activity-feed.tsx) but unclear if wired to real data on any page.

**Verdict: WIRE IT UP — LOW EFFORT.**
The component is already built. Just needs to be placed on the landing page or dashboard with real aggregated data from `tool_executions`.

**Complexity:** LOW (~2-3h). Query `tool_executions` for recent anonymized activity, serve via API, render the existing component on landing/dashboard.

---

### 4.2 Trust Badges & Security Indicators

**Status:** NONE

**Verdict: IMPLEMENT — HIGH VALUE, TRIVIAL EFFORT.**
Adding "⚡ Processed locally" badges on client-side tools and "🔒 No data stored" on tools page is pure UI work. Massive trust impact for privacy-conscious developer users.

**Complexity:** VERY LOW (~1-2h). Static badges based on tool metadata (`execution: 'client'` vs `'server'`).

---

### 4.3 Testimonials & Usage Statistics

**Status:** NONE

**Verdict: IMPLEMENT counters only — testimonials need real users.**
"X tools executed", "Y registered users" counters on the landing page are easy and impactful. Testimonials are fake until you have real users, so skip those.

**Complexity:** VERY LOW (~1-2h). Aggregate query from `tool_executions` + `users` count. Cache in Redis.

---

### 4.4 Status Page

**Status:** NONE

**Verdict: IMPLEMENT — MEDIUM VALUE.**
Simple `/status` page hitting health endpoints. Builds trust. Also useful for you during development.

**Complexity:** LOW (~3-4h). Hit `/api/v1/health`, DB ping, auth ping. Green/yellow/red indicators.

---

## 5. Onboarding & Activation

### 5.1 Interactive Welcome Wizard

**Status:** NONE

**Verdict: IMPLEMENT — HIGHEST RETENTION IMPACT.**
With 454 tools across 7 categories, new users are overwhelmed. A 3-step wizard ("What do you work with?" → "Your recommended tools" → "Try one now!") dramatically reduces time-to-value. This is the #1 feature for converting signups into active users.

**Complexity:** MEDIUM (~6-8h)

- `user_onboarding` table (userId, completedAt, selectedCategories, firstToolUsed)
- 3-step modal after first login
- Category selection → personalized tool grid → direct link to a free tool
- 25 bonus coins on completion

**Alignment:** Tool categories already exist. Just need the wizard UI and a one-time DB flag.

---

### 5.2 Onboarding Checklist

**Status:** NONE

**Verdict: IMPLEMENT — pairs perfectly with the wizard.**
The Zeigarnik effect is real. A persistent checklist ("Use your first tool ✓", "Favorite a tool", "Claim daily bonus") drives engagement. Grammarly, Slack, Notion all use this.

**Complexity:** MEDIUM (~5-7h). Track completion state per user, render sidebar/dashboard widget, grant bonus coins per step.

---

### 5.3 Contextual Tooltips

**Status:** NONE

**Verdict: SKIP for now.** Nice polish but low priority. Adds complexity for marginal benefit until you're iterating on UX with real user feedback.

---

## 6. UX Polish & Micro-Interactions

### 6.1 Skeleton Loading

**Status:** ALREADY EXISTS — skeleton.tsx + used in multiple components.

**Verdict: DONE. No action needed.**

---

### 6.2 Toast Notifications

**Status:** ALREADY EXISTS — sonner v2.0.0 in providers.

**Verdict: DONE.** Just ensure all user actions actually trigger toasts (some places might still have `// Show success toast` comments with no implementation).

**Quick audit task:** ~1-2h to grep for un-implemented toast comments and wire them up.

---

### 6.3 Smooth Page Transitions (Framer Motion)

**Status:** NONE — no `framer-motion` dependency.

**Verdict: SKIP — cosmetic only.**
Framer Motion adds ~30KB to bundle. The polish is nice but doesn't affect functionality or retention. Your app already has a theme system with smooth CSS transitions. This is a "version 2.0" polish item.

**Complexity:** MEDIUM (~6-8h) to add meaningful transitions everywhere without breaking SSR.

---

### 6.4 Tool Result Sharing

**Status:** NONE

**Verdict: DEFER — implement when you want viral growth.**
Shared results require a public `/share/[code]` route, result storage with expiration, OG metadata generation. It's a growth feature, not a core feature.

**Complexity:** MEDIUM (~8-10h). New `shared_results` table, short-code generation, public page, OG image generation.

---

### 6.5 Dark/Light Mode

**Status:** ALREADY EXISTS — full theme system with intent-based design, tier-gated presets.

**Verdict: DONE. No action needed.**

---

## 7. Personal Analytics Dashboard

### 7.1 Usage Insights Page

**Status:** NONE — Admin analytics exist but no user-facing analytics.

**Verdict: IMPLEMENT — MEDIUM VALUE (Pro-tier differentiator).**
Users love seeing their own data. "Your most used tool: JSON Formatter (127 times)" creates emotional investment. Make it a **Pro perk** to drive subscription upgrades.

**Complexity:** MEDIUM-HIGH (~10-14h)

- New `/dashboard/analytics` page
- Charts: tools/day line chart, category pie, coin spend/earn bar
- Queries against `tool_executions` and `coin_transactions`
- "Most used tool", "Most active day", streak display
- Chart library needed (Recharts or Chart.js)

**Alignment:** Data already exists in `tool_executions` and `coin_transactions`. This is querying + UI, not new infrastructure.

---

### 7.2 Year/Month in Review

**Status:** NONE

**Verdict: DEFER — growth-phase feature.**
The Spotify Wrapped concept is brilliant but only works with a year of data and a social audience to share with. Build this after 12 months of user data.

---

## 8. Referral & Viral Growth

### 8.1 Referral Program

**Status:** PARTIAL — `referral` is a valid CoinTransactionType, REFERRAL_COIN_REWARD=50 in env. But no tables, no UI, no referral codes.

**Verdict: IMPLEMENT — HIGH VALUE, proven growth mechanic.**
Dropbox's referral program is legendary. For a coin-based platform, giving 50 coins to referrer + 25 to new user costs nothing (virtual currency) but drives organic acquisition.

**Complexity:** MEDIUM (~8-10h)

- `referrals` table (referrerId, referredUserId, status, coinsEarned)
- Generate unique referral code per user (stored in `users` table or separate)
- `?ref=CODE` URL param → track on signup
- Status flow: pending → signed_up → activated (used first tool) → rewarded
- Dashboard card: "Invite friends, earn 50 coins each" with shareable link, copy button

**Alignment:** Coin granting infra already exists. Just need the referral tracking and UI.

---

### 8.2 Social Sharing of Achievements

**Status:** NONE — depends on Achievement system (2.3)

**Verdict: DEFER — requires achievements first.**

---

### 8.3 Embeddable Widget

**Status:** NONE

**Verdict: HARD SKIP.**
Extremely niche. Very few users will embed a tool widget. The development cost (~20h for secure iframe, authentication, styling isolation) far outweighs the benefit.

---

## 9. Security & Account Features

### 9.1 Two-Factor Authentication (2FA)

**Status:** Admin has 2FA. Web app does NOT — auth.ts has no `twoFactor` plugin.

**Verdict: IMPLEMENT — IMPORTANT for users with API keys + coin balances.**
Users who've purchased coins or have active API keys need 2FA. Better Auth has a TOTP plugin that makes this relatively easy.

**Complexity:** LOW-MEDIUM (~4-6h)

- Enable `twoFactor()` plugin in Better Auth config
- Add `/settings/security` → 2FA setup flow (QR code, backup codes)
- Enforce 2FA check on sensitive actions (coin purchase, API key creation)

---

### 9.2 Active Sessions Management

**Status:** PARTIAL — `sessions` table tracks IP + user agent. Security settings page exists at `/settings/security/`.

**Verdict: IMPLEMENT — LOW EFFORT.**
The data is already there. Just render active sessions with "Revoke" buttons on the security page.

**Complexity:** LOW (~2-3h). Query sessions, display device/location/time, add revoke endpoint.

---

### 9.3 Account Data Export (GDPR)

**Status:** NONE

**Verdict: IMPLEMENT — LEGAL REQUIREMENT if serving EU users.**
GDPR mandates "right to data portability". Even if you're not legally required yet, it's a trust feature.

**Complexity:** MEDIUM (~6-8h). Aggregate all user data (profile, executions, transactions, API keys, favorites) → generate JSON/ZIP → email download link.

---

### 9.4 Account Deletion with Grace Period

**Status:** PARTIAL — `users` table has `deletedAt` (soft delete). But no deletion flow, no grace period cron, no UI.

**Verdict: IMPLEMENT — LEGAL REQUIREMENT + trust feature.**
The soft delete column exists. Need the UI flow + 14-day cron cleanup.

**Complexity:** LOW-MEDIUM (~4-5h). Delete button → confirmation → set `deletedAt` → send email → cron job for hard delete after 14 days.

---

## 10. Advanced Tool Features

### 10.1 Tool Chaining / Workflows

**Status:** NONE

**Verdict: DEFER — "version 2.0" power feature.**
This is the marquee feature that would differentiate HSAFX WORLD from competitors. But it's also the most complex: visual step builder, state passing between tools, error handling mid-chain, save/load workflows. Not worth building until core platform is stable with active users.

**Complexity:** VERY HIGH (~40-60h). Visual builder + execution engine + state management + persistence.

---

### 10.2 Batch Processing

**Status:** NONE — `asyncJobs` table exists as infrastructure.

**Verdict: IMPLEMENT AS PRO PERK — HIGH VALUE.**
Users processing 50 images shouldn't repeat the flow 50 times. This is a killer Pro-tier differentiator. The `asyncJobs` table already provides infrastructure.

**Complexity:** HIGH (~15-20h). Multi-file upload UI, batch job creation, progress tracking, parallel execution with rate limiting.

---

### 10.3 Tool Comparison Mode

**Status:** NONE

**Verdict: SKIP — niche use case.**
Side-by-side comparison sounds cool but very few users need it. Low ROI for the implementation cost.

---

### 10.4 Result History with Re-Run

**Status:** PARTIAL — `tool_executions` table logs all executions. `/dashboard/history/` page exists.

**Verdict: ENHANCE — add "Re-run" button.**
The history page and data exist. Adding a "Re-run" button that pre-fills the tool with previous input is low-effort, high-value.

**Complexity:** LOW (~2-3h). Read previous execution input, navigate to tool page with pre-filled params.

---

## 11. Communication & Re-Engagement

### 11.1 In-App Notification Center

**Status:** EXISTS — `NotificationBell` component + zustand store + `notifications` DB table all built. **But NOT wired into the main header.**

**Verdict: WIRE IT UP — it's literally done, just not rendered.**

**Complexity:** VERY LOW (~1h). Import `NotificationBell` into the header layout for authenticated users.

---

### 11.2 Streak Break Warning Email

**Status:** NONE — requires streak system (2.2) first.

**Verdict: IMPLEMENT after streaks — HIGH retention value.**
Duolingo's most effective re-engagement tool. Requires the email system (Resend integration already exists) + streak tracking.

**Complexity:** LOW (~2-3h) after streaks are built. Cron job checks users whose streak is about to break → send email.

---

### 11.3 "What's New" Changelog

**Status:** NONE

**Verdict: IMPLEMENT — TRIVIAL, HIGH TRUST.**
A `/changelog` page is static content. Shows the app is actively maintained. Can be a simple MDX page.

**Complexity:** VERY LOW (~1-2h). Static MDX page with date-stamped entries.

---

### 11.4 Feature Request Board

**Status:** NONE

**Verdict: USE A THIRD-PARTY — don't build it.**
Canny, Nolt, or even GitHub Discussions. Building a voting board from scratch is a waste of engineering time.

---

## 12. Infrastructure & Performance

### 12.1 Client-Side Processing Indicator

**Status:** NONE

**Verdict: IMPLEMENT — TRIVIAL, HIGH TRUST.**
You already have `execution: 'client'` vs `'server'` in tool metadata. Just render a badge: "⚡ Processed locally — your data never leaves your browser."

**Complexity:** VERY LOW (~1h). Conditional badge in tool header based on `tool.execution`.

---

### 12.2 PWA

**Status:** NONE

**Verdict: DEFER.**
PWA requires manifest, service worker, offline caching strategy, icon sets. Medium effort for medium gain. Client-side tools working offline is cool but not critical.

**Complexity:** MEDIUM (~6-8h).

---

### 12.3 API Rate Limit Dashboard

**Status:** PARTIAL — `apiRateLimits` table exists, API key management page exists.

**Verdict: IMPLEMENT — pairs with API key management.**
Show quota usage visually for API key users. Data exists, just needs UI.

**Complexity:** LOW (~3-4h). Query usage against limits, render progress bar on API keys page.

---

## Final Priority Recommendation

### TIER 1 — Do First (Quick wins, high impact, low effort)

| Feature                              | Effort      | Why                                      |
| ------------------------------------ | ----------- | ---------------------------------------- |
| Wire up NotificationBell in header   | ~1h         | Already built, just needs import         |
| Trust badges ("⚡ Local processing") | ~1-2h       | Trivial, high trust impact               |
| Client-side processing indicator     | ~1h         | Same as above                            |
| Usage stats on landing page          | ~1-2h       | "X tools executed" counter, social proof |
| Changelog page                       | ~1-2h       | Static MDX, shows active development     |
| Active sessions management           | ~2-3h       | Data exists, just UI                     |
| Re-run button on history             | ~2-3h       | Tool execution data exists               |
| **Subtotal**                         | **~10-14h** |                                          |

### TIER 2 — Do Next (Core features that drive retention + conversion)

| Feature                         | Effort      | Why                                      |
| ------------------------------- | ----------- | ---------------------------------------- |
| Command Palette (⌘K)            | ~4-6h       | The killer UX feature for 454 tools      |
| Streak rewards enhancement      | ~3-5h       | Builds on existing login rewards         |
| Onboarding welcome wizard       | ~6-8h       | #1 retention driver for new users        |
| Onboarding checklist            | ~5-7h       | Pairs with wizard, Zeigarnik effect      |
| "Try Before You Buy" Pro trials | ~4-6h       | Proven conversion mechanic               |
| Pro badge + visible perks       | ~3-5h       | Drives upgrade desire                    |
| 2FA for web users               | ~4-6h       | Security necessity with API keys + coins |
| Account deletion flow           | ~4-5h       | Legal + trust requirement                |
| **Subtotal**                    | **~33-48h** |                                          |

### TIER 3 — Growth Phase (Build when you have active users)

| Feature                     | Effort      | Why                                        |
| --------------------------- | ----------- | ------------------------------------------ |
| Referral program            | ~8-10h      | Organic acquisition, needs user base first |
| User analytics dashboard    | ~10-14h     | Pro perk, needs usage data                 |
| GDPR data export            | ~6-8h       | Legal requirement for EU users             |
| Streak break warning emails | ~2-3h       | After streaks are built                    |
| Status page (/status)       | ~3-4h       | Transparency                               |
| API rate limit dashboard    | ~3-4h       | For API key users                          |
| Coin multiplier events      | ~5-7h       | After monetization is live                 |
| Batch processing (Pro)      | ~15-20h     | Pro differentiator                         |
| **Subtotal**                | **~52-70h** |                                            |

### NEVER / HARD SKIP

> Full details with reasoning and revisit conditions in `DEFERRED_FEATURES.md`.

| Feature                   | Why Not                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| XP & Level system         | Empty gamification without users. Coin system already fills this role. |
| Leaderboard               | Embarrassing with <50 users. Privacy concerns.                         |
| Coin gifting/transfer     | Abuse vector (bot farming). Dangerous to coin economy.                 |
| Achievement badges        | Premature. Build after 6+ months of user data.                         |
| Tool chaining/workflows   | 40-60h mega-feature. "Version 2.0" territory.                          |
| Tool comparison mode      | Niche use case, low ROI.                                               |
| Framer Motion transitions | Cosmetic. 30KB bundle cost. CSS transitions are fine.                  |
| Embeddable widget         | Extremely niche. ~20h for <1% use case.                                |
| Year in Review            | Need 12 months of data first.                                          |
| Feature request board     | Use Canny/GitHub Discussions instead of building custom.               |
| PWA                       | Medium effort, not critical until mobile usage is significant.         |

---

Your call on which tier to tackle. Tier 1 is all quick wins that can be knocked out in a day or two. Tier 2 is the substantial stuff that genuinely moves the product forward.

Completed: _Deliver recommendation report_ (4/4)

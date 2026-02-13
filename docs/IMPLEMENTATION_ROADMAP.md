# Implementation Roadmap — Feature Enhancements

> Generated from `FEATURE_ENHANCEMENT_ANALYSIS.md` deep scan results.
> Dependency order matters — items marked with ⭐ are prerequisites for later features.

---

## TIER 1 — Quick Wins (High Impact, Low Effort)

### ⭐ T1.0 Auth-Aware Header + User Menu
**PREREQUISITE** — Unlocks: NotificationBell, Pro badge, user menu, mobile auth menu

| Field | Detail |
|-------|--------|
| Files | `apps/web/src/components/layout.tsx` |
| What | Header currently always shows Sign In / Get Started regardless of auth state. Add `useAuth()` check: if authenticated → render avatar, user dropdown (Dashboard, Settings, History, Logout), NotificationBell. If not → keep Sign In / Get Started. |
| Dependencies | `useAuth()` hook (exists), `NotificationBell` (exists), lucide-react icons |
| Effort | ~2h |

### T1.1 Wire NotificationBell in Header
| Field | Detail |
|-------|--------|
| Files | `apps/web/src/components/layout.tsx` |
| What | Import `NotificationBell` and render it next to the user avatar for authenticated users. Already fully built — just needs to be placed in the DOM. |
| Dependencies | T1.0 (auth-aware header) |
| Effort | ~15min (part of T1.0) |

### T1.2 Trust Badges + Client-Side Processing Indicator
| Field | Detail |
|-------|--------|
| Files | Tool page components (tool header/execution area) |
| What | Display badges on tool pages: "⚡ Processed locally" for `execution: 'client'` tools, "🔒 Encrypted" for server tools. Based on existing tool metadata. |
| Dependencies | Tool registry metadata (exists) |
| Effort | ~1-2h |

### T1.3 Usage Stats on Landing Page
| Field | Detail |
|-------|--------|
| Files | `apps/web/src/app/page.tsx` |
| What | Add stats section between Hero and Categories: "454+ Tools", "X Executions", "Y Users". Tool count from registry, others from DB aggregates cached in Redis. |
| Dependencies | DB tables `tool_executions`, `users` (exist), Redis (exists) |
| Effort | ~2h |

### T1.4 Changelog Page
| Field | Detail |
|-------|--------|
| Files | `apps/web/src/app/changelog/page.tsx` (new) |
| What | Static `/changelog` route with date-stamped entries. Shows active development to users. Add link in footer. |
| Dependencies | None |
| Effort | ~1h |

### T1.5 Active Sessions Management (Real Data)
| Field | Detail |
|-------|--------|
| Files | `apps/web/src/app/settings/security/page.tsx`, new tRPC procedures |
| What | Replace 3 hardcoded mock sessions with real data from `sessions` DB table. Wire "Revoke" and "Revoke all" buttons to actual session deletion. |
| Dependencies | `sessions` table (exists with ipAddress, userAgent), Better Auth session API |
| Effort | ~3h |

### T1.6 Re-Run Button on History
| Field | Detail |
|-------|--------|
| Files | `apps/web/src/app/dashboard/history/page.tsx` |
| What | Add "Re-run" button to each history entry. Navigates to `/tools/[toolId]?rerun=[executionId]`. Tool page reads execution input from metadata and pre-fills form. |
| Dependencies | `tool_executions.metadata` field (exists) |
| Effort | ~2-3h |

### T1.7 Wire ActivityFeed on Dashboard
| Field | Detail |
|-------|--------|
| Files | `apps/web/src/app/dashboard/page.tsx` |
| What | Replace empty "Recent Activity" placeholder with actual `ActivityFeed` component. Fetch recent executions via tRPC. |
| Dependencies | `ActivityFeed` component (exists), `tool_executions` table (exists) |
| Effort | ~2h |

### T1.8 Live Dashboard Stats
| Field | Detail |
|-------|--------|
| Files | `apps/web/src/app/dashboard/page.tsx` |
| What | Replace hardcoded "448+" and "0" with real counts: tools from registry length, executions from tRPC query. Wire toast for daily bonus claim. |
| Dependencies | Tool registry (exists), tRPC billing router (exists) |
| Effort | ~1h |

**TIER 1 Total: ~12-15h | 9 items**

---

## TIER 2 — Core Features (Retention + Conversion)

### T2.1 Command Palette (⌘K / Ctrl+K)
| Field | Detail |
|-------|--------|
| Install | `cmdk` package (~3KB) |
| Files | New `apps/web/src/components/command-palette.tsx`, modify `layout.tsx` |
| What | Global command palette with fuzzy search over 454 tools + pages + actions. Groups: Recent, Tools by category, Pages (Dashboard, Settings, API Keys), Actions (Buy Coins, Claim Daily, Logout). Wire search icon in header to open it. |
| Dependencies | Tool registry (exists), `cmdk` package (to install) |
| Effort | ~5h |

### T2.2 Streak Rewards System
| Field | Detail |
|-------|--------|
| DB | New `user_streaks` table: userId, currentStreak, longestStreak, lastActiveDate |
| Files | Modify `login-reward-service.ts`, new streak display in dashboard |
| What | Track consecutive daily logins. Multiplier: 3-day=1.5×, 7-day=2×, 14-day=3×, 30-day=5× on daily bonus. Show 🔥 streak counter on dashboard. |
| Dependencies | Login reward system (exists), drizzle schema |
| Effort | ~4h |

### T2.3 Onboarding Welcome Wizard
| Field | Detail |
|-------|--------|
| DB | New `user_onboarding` table: userId, completedAt, selectedCategories, firstToolUsed |
| Files | New `apps/web/src/components/onboarding-wizard.tsx`, modify dashboard |
| What | 3-step modal after first login: Step 1 "What do you work with?" (category select) → Step 2 "Recommended tools" (personalized grid) → Step 3 "Try one now!" (direct tool link). 25 bonus coins on completion. |
| Dependencies | Tool registry (exists), categories (exist) |
| Effort | ~7h |

### T2.4 Onboarding Checklist
| Field | Detail |
|-------|--------|
| Files | New `apps/web/src/components/onboarding-checklist.tsx`, modify dashboard |
| What | Persistent sidebar/dashboard widget with tasks: Use first tool ✓, Favorite a tool, Claim daily bonus, Complete profile, Try a Pro tool. Track completion in `user_onboarding` metadata. Grant 5 coins per step. |
| Dependencies | T2.3 (onboarding table) |
| Effort | ~5h |

### T2.5 Pro Badge + Visible Perks
| Field | Detail |
|-------|--------|
| Files | Header user menu, dashboard, profile |
| What | Show ✨ Pro badge next to username when subscribed. Pro-only features: unlimited history retention, advanced analytics (T3), priority support badge. |
| Dependencies | T1.0 (auth-aware header), subscription hook (exists) |
| Effort | ~2h |

### T2.6 "Try Before You Buy" Pro Trials
| Field | Detail |
|-------|--------|
| DB | New `daily_pro_trials` table: userId, toolId, date, used |
| Files | Tool execution flow, tool page UI |
| What | Free users get 1 free Pro tool trial per day. Badge: "⭐ Free trial — 1 remaining today". After trial → prompt upgrade or coin spend. |
| Dependencies | Tool coin cost logic (exists), user tier check (exists) |
| Effort | ~5h |

### T2.7 Two-Factor Authentication
| Field | Detail |
|-------|--------|
| Config | Enable `twoFactor()` plugin in Better Auth config |
| Files | `apps/web/src/lib/auth.ts`, `settings/security/page.tsx` |
| What | TOTP-based 2FA with QR code setup, backup codes, and enforcement on sensitive actions (coin purchase, API key creation). Replace mocked 2FA UI with real flow. |
| Dependencies | Better Auth twoFactor plugin, security page (exists but mocked) |
| Effort | ~5h |

### T2.8 Account Deletion Flow
| Field | Detail |
|-------|--------|
| Files | `settings/page.tsx` or `settings/account/page.tsx` (new), cron job |
| What | "Delete Account" button → confirmation modal → password re-entry → set `deletedAt` on user → send confirmation email → 14-day grace period → cron hard-deletes. Users can cancel within 14 days. |
| Dependencies | `users.deletedAt` column (exists), Resend email (configured) |
| Effort | ~4h |

**TIER 2 Total: ~37h | 8 items**

---

## TIER 3 — Growth Phase (Build When Active Users Exist)

### T3.1 Referral Program (~8-10h)
New `referrals` table, unique referral codes per user, `?ref=CODE` tracking on signup, status flow (pending→activated→rewarded), dashboard referral card.

### T3.2 User Analytics Dashboard (~10-14h)
Pro-only `/dashboard/analytics` page. Charts: tools/day, category pie, coin spend/earn. Install `recharts`. Queries against `tool_executions` + `coin_transactions`.

### T3.3 GDPR Data Export (~6-8h)
Aggregate all user data → JSON/ZIP → email download link. Settings > Privacy > "Export My Data" button.

### T3.4 Streak Break Warning Emails (~2-3h)
After T2.2 is built. Cron checks users whose streak is about to break → sends Resend email.

### T3.5 Status Page (~3-4h)
`/status` page with health checks: API, DB, Auth, Redis. Green/yellow/red indicators.

### T3.6 API Rate Limit Dashboard (~3-4h)
Visual quota usage on API keys page. Progress bars for requests/day, requests/month.

### T3.7 Coin Multiplier Events (~5-7h)
`coin_events` table, admin creation UI, backend multiplier check, dashboard banner.

### T3.8 Batch Processing (~15-20h)
Multi-file upload, batch job queue (using `asyncJobs` table), progress tracking, Pro-only.

**TIER 3 Total: ~52-70h | 8 items**

---

## Execution Order

```
TIER 1 (implement now, in this order):
  T1.0 → T1.1 → T1.8 → T1.7 → T1.3 → T1.2 → T1.4 → T1.5 → T1.6
         ↑ prerequisite chain

TIER 2 (implement after TIER 1):
  T2.1 → T2.5 → T2.2 → T2.3 → T2.4 → T2.6 → T2.7 → T2.8

TIER 3 (implement after active users):
  T3.1 → T3.2 → T3.3 → T3.4 → T3.5 → T3.6 → T3.7 → T3.8
```

---

## NEVER / HARD SKIP

| Feature | Reason |
|---------|--------|
| XP & Level system | Empty gamification without users |
| Leaderboard | Embarrassing with <50 users |
| Coin gifting/transfer | Bot farming abuse vector |
| Achievement badges | Premature, build after 6+ months |
| Tool chaining/workflows | 40-60h mega-feature, version 2.0 |
| Tool comparison mode | Niche, low ROI |
| Framer Motion transitions | 30KB bundle cost, CSS transitions suffice |
| Embeddable widget | ~20h for <1% use case |
| Year in Review | Need 12 months of data |
| Feature request board | Use Canny/GitHub Discussions |
| PWA | Medium effort, not critical yet |

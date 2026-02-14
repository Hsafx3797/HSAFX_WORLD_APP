# Deferred Features & Skipped Suggestions

> **Purpose**: Consolidated list of all features, improvements, and suggestions that were analyzed but **not implemented**, with clear reasons for each decision.
>
> **Sources**: CODEBASE_REVIEW.md, FEATURE_ENHANCEMENT_ANALYSIS.md, FEATURE_ENHANCEMENT_REPORT.md, IMPLEMENTATION_ROADMAP.md, PROJECT_QA_ASSESSMENT.md

---

## 1. Hard Skip — Will Not Implement

These features were evaluated and rejected. They should **not** be built unless the stated conditions fundamentally change.

| #   | Feature                               | Source                  | Reason                                                                                                                                                                                                                             |
| --- | ------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **XP & Level System**                 | §2.1 Analysis, Roadmap  | Empty gamification without active users. The coin system already provides engagement incentives. Adds maintenance burden with no payoff until 1000+ DAU.                                                                           |
| 2   | **Leaderboard**                       | §2.4 Analysis, Roadmap  | Embarrassing with <50 active users. Privacy concerns. Creates competitive toxicity. Only viable after 1000+ opt-in users.                                                                                                          |
| 3   | **Coin Gifting / Transfer**           | §3.2 Analysis, Roadmap  | High abuse vector — bots can farm daily bonuses across accounts and funnel coins to one. Anti-abuse systems (cooldowns, verification, limits) add significant complexity. Referral program serves the social currency need safely. |
| 4   | **Tool Comparison Mode**              | §10.3 Analysis, Roadmap | Niche use case. Very few users need side-by-side tool output comparison. Low ROI for implementation cost.                                                                                                                          |
| 5   | **Framer Motion Page Transitions**    | §6.3 Analysis, Roadmap  | Cosmetic only. Adds ~30KB to bundle. CSS transitions already provide smooth UX. Risks SSR breakage. "Version 2.0" polish at best.                                                                                                  |
| 6   | **Embeddable Widget**                 | §8.3 Analysis, Roadmap  | ~20h implementation for <1% use case. Requires secure iframe, auth isolation, style scoping. Extremely niche.                                                                                                                      |
| 7   | **Feature Request Board (Custom)**    | §11.4 Analysis, Roadmap | Use third-party solutions (Canny, Nolt, GitHub Discussions) instead of building custom voting/feedback systems.                                                                                                                    |
| 8   | **Smart Search with AI Autocomplete** | §1.1 Analysis           | Existing client-side search with Ctrl+K works well. AI ranking requires `toolUsageEvents` tracking + backend scoring algorithm. Premature optimization — needs real user volume to train on.                                       |
| 9   | **Personalized Tool Recommendations** | §1.2 Analysis           | Collaborative filtering needs thousands of users to produce meaningful results. High complexity (~20-30h). No data to train on yet.                                                                                                |
| 10  | **Contextual Feature Tooltips**       | §5.3 Analysis           | Low-priority polish. Adds UX complexity for marginal discoverability benefit. Better addressed by onboarding wizard (already implemented).                                                                                         |

---

## 2. Deferred to Growth Phase — Build When Conditions Are Met

These features are valuable but require specific prerequisites (user volume, data history, or infrastructure).

| #   | Feature                                                | Prerequisite                                | Estimated Effort | Source         |
| --- | ------------------------------------------------------ | ------------------------------------------- | ---------------- | -------------- |
| 1   | **Achievement Badges** (~30 unlockable)                | 6+ months of user data, active user base    | ~15-20h          | §2.3 Analysis  |
| 2   | **Tool Chaining / Workflows**                          | Stable core platform, active power users    | ~40-60h          | §10.1 Analysis |
| 3   | **Tool Result Sharing** (public `/share/[code]` links) | Viral growth phase                          | ~8-10h           | §6.4 Analysis  |
| 4   | **Year / Month in Review** (Spotify Wrapped style)     | 12 months of user data                      | ~8-10h           | §7.2 Analysis  |
| 5   | **Social Sharing of Achievements**                     | Achievement system (above) must exist first | ~3-4h            | §8.2 Analysis  |
| 6   | **PWA (Progressive Web App)**                          | Significant mobile user traffic             | ~6-8h            | §12.2 Analysis |

---

## 3. Deferred Codebase Improvements — Performance & Infrastructure

These are engineering-quality items identified during the codebase review that don't affect functionality or security but would improve performance or architecture.

### From CODEBASE_REVIEW.md

| #   | Issue ID          | Description                                                 | Status |
| --- | ----------------- | ----------------------------------------------------------- | ------ |
| 1   | **P0-11 / P1-03** | OAuth tokens + TOTP secrets stored in plaintext             | ✅ Done — AES-256-GCM encryption layer (`@hsafx/shared/crypto`, `@hsafx/db/crypto`) |
| 2   | **P1-19**         | N+1 queries in admin routes (150+ queries for 50 users)     | ✅ Done — SQL subqueries replace Promise.all in users/tools/audit routes |
| 3   | **P2-03**         | N+1 in `getPlans` (2 queries per plan)                      | ✅ Done — Batch JOINs in billing.ts |
| 4   | **P2-04**         | `getUserPlan` has no caching (DB query on every gated call) | ✅ Done — 5-min in-memory TTL cache |
| 5   | **P2-05**         | `tool-execution.ts` stub that throws                        | Stub file — implement or remove when tool execution architecture is revisited. |
| 6   | **P2-06**         | Multiple routers use `@/` alias dynamic imports             | ✅ Done — 10 service files moved to `packages/api/src/server/`, 13 `@ts-ignore` removed |
| 7   | **P2-11**         | Seed script has no transaction wrapping                     | ✅ Done — All 7 inserts wrapped in `db.transaction()` |
| 8   | **P2-18**         | In-memory monitoring counters useless in serverless         | ✅ Done — Redis INCR+EXPIRE pipeline via Upstash |
| 9   | **P2-25**         | Dialog/DropdownMenu/Select missing WCAG compliance          | ✅ Done — Focus trap, keyboard nav, ARIA roles for all 4 components |
| 10  | **P2-26**         | Button `asChild` prop silently ignored                      | ✅ Done — `React.cloneElement` Slot pattern |
| 11  | **P3-09**         | In-memory scraper cache not shared across workers           | ✅ Done — Redis-backed async cache with in-memory fallback |

### From PROJECT_QA_ASSESSMENT.md

| #   | Item   | Description                           | Status |
| --- | ------ | ------------------------------------- | ------ |
| 1   | **Q3** | Settings page form save wiring        | ✅ Done — BillingSection wired to `getMySubscription`, ApiAccessSection with full CRUD (`api-keys` router) |
| 2   | **Q7** | Move remaining hardcoded limits to DB | ✅ Done — Rate limits Redis-backed with `syncRateLimitsToRedis()`. Tool limits & file sizes read from `planLimits` table via `getMyPlan` with hardcoded fallbacks. Per-category seed data added. |

### Sprint 5 — Accessibility & Testing (from CODEBASE_REVIEW.md §15)

| Task                                         | Status |
| -------------------------------------------- | ------ |
| Add focus trap + keyboard nav to Dialog      | ✅ Done |
| Add ARIA roles to DropdownMenu, Select, Tabs | ✅ Done |
| Implement `asChild` Slot pattern in Button   | ✅ Done |
| Add tests for admin API routes (auth + RBAC) | ✅ Done — `packages/api/src/__tests__/admin-rbac.test.ts` |
| Add tests for coin reservation lifecycle     | ✅ Done — `apps/web/src/server/limits/__tests__/coin-service.test.ts` |
| Add tests for webhook handlers               | ✅ Done — `apps/web/src/server/webhooks/__tests__/webhook.test.ts` |
| Add `jest-axe` tests for UI components       | ✅ Done — `packages/ui/src/components/__tests__/accessibility.test.tsx` (vitest + SSR rendering) |

---

## 4. Infrastructure Items — Not Code Changes

These require environment/infrastructure setup rather than code:

| #   | Item                                        | Status                  | Notes                                                                  |
| --- | ------------------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| 1   | **P0-17**: K8s staging overlay selector fix | ✅ Fixed                | Removed `namePrefix: staging-` — namespace provides isolation. Added `commonLabels` for instance tagging. |
| 2   | **CI/CD pipeline**                          | ✅ Created at `7900fb0` | `.github/workflows/ci.yml` exists with lint, typecheck, test, E2E jobs |
| 3   | **E2E tests**                               | ✅ Created at `7900fb0` | Playwright config + admin E2E test suite exists                        |
| 4   | **Backup scripts**                          | ✅ Created at `7900fb0` | `pg_backup.sh` with retention pruning + DR_RUNBOOK.md                  |
| 5   | **Docker Compose production testing**       | Not tested              | Configs exist in `infra/docker/`, need real deployment test            |

---

## Decision Framework

When revisiting deferred items, use this criteria:

| Condition                        | Action                                                             |
| -------------------------------- | ------------------------------------------------------------------ |
| **1000+ monthly active users**   | Consider: Achievement Badges, Leaderboard (opt-in), Social Sharing |
| **Active paying customers**      | Consider: Tool Chaining, Premium analytics enhancements            |
| **12+ months of user data**      | Consider: Year in Review, advanced cohort analytics                |
| **Mobile traffic >30%**          | Consider: PWA                                                      |
| **Performance complaints**       | Address: N+1 queries, caching, Redis migration                     |
| **Accessibility audit required** | Address: Sprint 5 WCAG items                                       |
| **EU user base growing**         | Verify: GDPR export (already implemented), data retention policies |

---

_Last updated: February 2026_

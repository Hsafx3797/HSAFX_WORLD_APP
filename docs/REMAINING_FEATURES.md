# Remaining & Deferred Features

> **Purpose**: Single source of truth for all features NOT yet implemented, with clear reasons for each deferral and the conditions under which they should be revisited.
>
> **Last updated**: February 14, 2026

---

## 1. Hard Skip — Will Not Implement

These features were fully analyzed and deliberately rejected. Do **not** build unless the stated conditions fundamentally change.

| #   | Feature                               | Effort  | Reason for Skipping                                                                                                                                                                                                                                     |
| --- | ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **XP & Level System**                 | ~12-16h | Empty gamification without active users. The coin system already provides engagement incentives. Adds maintenance burden (new `user_xp` table, XP grant hooks on every action, level thresholds, badges, animations) with no payoff until 1000+ DAU.    |
| 2   | **Leaderboard**                       | ~4h     | Embarrassing with <50 active users. Privacy concerns. Creates competitive toxicity. Only viable after 1000+ opt-in users with a weekly-reset opt-in model.                                                                                              |
| 3   | **Coin Gifting / Transfer**           | ~8-10h  | High abuse vector — bots can farm daily bonuses across multiple accounts and funnel coins to one. Anti-abuse systems (cooldowns, verification, limits) add significant complexity. The referral program already serves the social currency need safely. |
| 4   | **Tool Comparison Mode**              | ~6-8h   | Niche use case. Very few users need side-by-side tool output comparison. Low ROI for implementation cost.                                                                                                                                               |
| 5   | **Framer Motion Page Transitions**    | ~6-8h   | Cosmetic only. Adds ~30KB to JS bundle. CSS transitions already provide smooth UX. Risks SSR hydration breakage with React 19. "Version 2.0" polish at best.                                                                                            |
| 6   | **Embeddable Widget**                 | ~20h    | <1% use case. Requires secure iframe sandbox, auth isolation, style scoping, and cross-origin messaging. Extremely niche for a tool-platform.                                                                                                           |
| 7   | **Custom Feature Request Board**      | ~15-20h | Use third-party solutions (Canny, Nolt, GitHub Discussions) instead of building a custom voting/feedback system from scratch.                                                                                                                           |
| 8   | **Smart Search with AI Autocomplete** | ~6-8h   | Existing client-side search with Ctrl+K command palette works well for 454 tools. AI ranking requires `toolUsageEvents` tracking + backend scoring algorithm. Premature optimization — needs real user volume to train on.                              |
| 9   | **Personalized Tool Recommendations** | ~20-30h | Collaborative filtering needs thousands of users to produce meaningful results. No data to train on yet. High complexity for zero current value.                                                                                                        |
| 10  | **Contextual Feature Tooltips**       | ~4-6h   | Low-priority polish. Adds UX complexity for marginal discoverability benefit. Better addressed by the onboarding wizard (already implemented).                                                                                                          |

---

## 2. Deferred to Growth Phase — Build When Conditions Are Met

These features are valuable but require specific prerequisites before they become worthwhile.

| #   | Feature                                                | Effort  | Prerequisite                                 | What It Does                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------ | ------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Achievement Badges** (~30 unlockable)                | ~15-20h | 6+ months of user data, active user base     | Unlockable badges (First Steps, Speed Runner, Streak Master, etc.) with coin rewards. Needs `achievements` + `user_achievements` tables, trigger hooks across 10+ user actions, toast notifications, profile display, admin management. |
| 2   | **Tool Chaining / Workflows**                          | ~40-60h | Stable core platform with active power users | Let users chain tools: "Markdown → HTML → Minify HTML → Copy". Visual step builder, state passing between tools, error handling mid-chain, save/load workflows. This is the "version 2.0" marquee feature.                              |
| 3   | **Tool Result Sharing** (public `/share/[code]` links) | ~8-10h  | Viral growth phase                           | After tool execution, generate a public short link to the result. Needs `shared_results` table, short-code generation, public page, OG image generation for social previews.                                                            |
| 4   | **Year / Month in Review** (Spotify Wrapped style)     | ~8-10h  | 12 months of user data                       | Monthly/yearly summary: "This month you used 42 tools, spent 150 coins, saved ~8 hours." Shareable card with social preview.                                                                                                            |
| 5   | **Social Sharing of Achievements**                     | ~3-4h   | Achievement system (above) must exist first  | "Share on X/LinkedIn" button when users unlock a badge. Pre-filled text with branded message.                                                                                                                                           |
| 6   | **PWA (Progressive Web App)**                          | ~6-8h   | Significant mobile user traffic (>30%)       | Manifest, service worker, offline caching for client-side tools, "Add to Home Screen" prompt. Increases repeat visits by ~68% on mobile.                                                                                                |

---

## 3. Minor Technical Debt

| #   | Item                                  | Description                                                                                                                                                                             | Action                                            |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | **P2-05**: `tool-execution.ts` stub   | Stub file that throws — either implement the tool execution abstraction or remove the dead file when tool execution architecture is revisited.                                          | Revisit during next architecture refactor.        |
| 2   | **Docker Compose production testing** | Docker configs exist in `infra/docker/` but haven't been tested against a real deployment.                                                                                              | Test during first production deployment to a VPS. |
| 3   | **Settings form save mutations**      | Some settings fields (display name, bio, email) render UI but don't save via tRPC mutations. `BillingSection` and `ApiAccessSection` are wired, but profile fields need backend wiring. | Wire remaining profile mutation fields.           |
| 4   | **3 remaining `@ts-ignore`**          | Lines 377, 411, 417 in `packages/api/src/routers/user.ts` for deletion-service import.                                                                                                  | Remove when deletion-service types are resolved.  |

---

## Decision Framework

Use this criteria when revisiting deferred items:

| Condition                       | Features to Consider                                      |
| ------------------------------- | --------------------------------------------------------- |
| **1,000+ monthly active users** | Achievement Badges, Leaderboard (opt-in), Social Sharing  |
| **Active paying customers**     | Tool Chaining / Workflows, Premium analytics enhancements |
| **12+ months of user data**     | Year in Review, advanced cohort analytics                 |
| **Mobile traffic > 30%**        | PWA                                                       |
| **Viral growth phase**          | Tool Result Sharing, Social Sharing                       |
| **Version 2.0 planning**        | Framer Motion transitions, XP system, AI search           |

---

_Last updated: February 14, 2026_

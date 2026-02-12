# 04 — STEPS TO COMPLETE (Sprint Execution Plan)

> **Last updated:** 2026-02-12
> **Commit:** `5394975` on `master`
> **Based on:** Doc 03 remaining work items
> **Philosophy:** P0 first → P1 next → P2/P3 after

---

## ✅ PHASE 1: SECURITY & BILLING CRITICAL FIXES (P0) — COMPLETED
**All 8 P0 items done across Sprints P0-01 through P0-08, P1-07**

### Sprint 6A — Billing Integrity ✅

| # | Task | Ref | Status |
|---|------|-----|--------|
| 1 | Wire coin deduction into B2B REST execute route | P0-01 | ✅ Done |
| 2 | Call `confirmReservation()` after async job completion | P0-02 | ✅ Done |
| 3 | Implement Stripe refund coin clawback | P0-04 | ✅ Done |
| 4 | Add `processed_webhooks` table + wire into both webhook handlers | P0-05 | ✅ Done |
| 5 | Fix daily bonus race condition (replaced with login rewards + FOR UPDATE) | P1-13 | ✅ Done |

### Sprint 6B — Security Hardening ✅

| # | Task | Ref | Status |
|---|------|-----|--------|
| 6 | Invoke `checkUserRateLimit()` in web middleware | P0-06 | ✅ Done |
| 7 | Server-enforce admin 2FA in middleware | P0-07 | ✅ Done |
| 8 | Add impersonation scoped-action middleware | P0-08 | ✅ Done |
| 9 | Add impersonation `reason` field | P1-12 | Not yet |
| 10 | Wire CASL into web app — `@casl/ability`, `PlanAccessProvider`, `withPlan` middleware | P0-03 | ✅ Done |

---

## ✅ PHASE 2 (partial): DATA INTEGRITY & LOGGING
**Logging COMPLETED. Schema quality items remain.**

### Sprint 7A — Schema Quality (remaining ~12h)

| # | Task | Ref | Status |
|---|------|-----|--------|
| 11 | Add remaining 9 pgEnum types + migrate existing text columns | P1-01 | Partial (4/13 done) |
| 12 | Add all 25+ planned database indexes | P1-02 | Not yet |
| 13 | Add missing unique constraints on 7 join tables | P1-08 | Not yet |
| 14 | Add `tools.tool_class` column + populate from BA weights map | P1-09 | Not yet |

**Exit criteria:** `drizzle-kit push` succeeds. All enums + indexes in place. No duplicate join-table rows.

### Sprint 7B — Structured Logging ✅

| # | Task | Ref | Status |
|---|------|-----|--------|
| 15 | `createLogger()` factory in `@hsafx/shared/logger` with pino | P1-03 | ✅ Done |
| 16 | Replace all `console.*` in `apps/web/` | P1-03 | ✅ Done |
| 17 | Replace all `console.*` in `apps/admin/` | P1-03 | ✅ Done |
| 18 | Replace all `console.*` in `packages/` | P1-03 | ✅ Done |

---

## PHASE 3: SCHEMA COMPLETION + API KEYS (NEXT)
**Duration: ~12 hours | Next Sprint**

> Combines remaining Schema Quality (Phase 2 leftover) + small P1 items.

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 11 | Add remaining 9 pgEnums | P1-01 | 3 |
| 12 | Add all 25+ planned database indexes | P1-02 | 4 |
| 13 | Add missing unique constraints on 7 join tables | P1-08 | 2 |
| 14 | Add `tools.tool_class` column | P1-09 | 2 |
| 15 | Add `api_keys.scopes` text[] column | P1-10 | 1 |

**Exit criteria:** Schema fully matches DBML. All enums, indexes, unique constraints, and missing columns in place.

---

## PHASE 4: FRONTEND COMPLETENESS
**Duration: ~34 hours**

### Sprint A — Missing Stores + Components (22 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 16 | Build `useBillingStore` | P1-05 | 3 |
| 17 | Build `useNotificationStore` | P1-05 | 2 |
| 18 | Separate execution state into `useExecutionStore` | P1-05 | 1 |
| 19 | Build `ExecutionPanel` component | P1-06 | 4 |
| 20 | Build `UsageCard` component | P1-06 | 2 |
| 21 | Build `BillingCard` component | P1-06 | 3 |
| 22 | Build `TransactionList` component | P1-06 | 3 |
| 23 | Build `ActivityFeed` component | P1-06 | 2 |
| 24 | Build `NotificationBell` component | P1-06 | 2 |

### Sprint B — Search + APIs (12 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 25 | Add tsvector column + GIN index to tools table | P1-07 | 3 |
| 26 | Create search API route with `plainto_tsquery` | P1-07 | 3 |
| 27 | Replace client-side tool filtering with search API | P1-07 | 2 |
| 28 | Add billing REST endpoints for B2B | P1-11 | 4 |

---

## PHASE 5: TOOL EXECUTION COMPLETION
**Duration: ~15 hours**

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 29 | Complete ~15 stub tool handlers | P1-14 | 12 |
| 30 | Enable FastAPI job processing | P1-15 | 3 |

**Exit criteria:** All tools execute (no stubs). FastAPI processes Python jobs.

---

## PHASE 6: ADMIN & POLISH (P2)
**Duration: ~50 hours**

### Sprint A — Admin Features (28 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 31 | Admin analytics dashboard | P2-03 | 20 |
| 32 | Admin audit log viewer | P2-04 | 8 |

### Sprint B — Infrastructure Polish (22 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 33 | Move shared UI components to `@hsafx/ui` | P2-02 | 12 |
| 34 | Add Redis session caching | P2-05 | 4 |
| 35 | Configure rolling sessions + absolute timeout | P2-06 | 1 |
| 36 | Rename session cookie to `__hsafx_session` | P2-07 | 2 |
| 37 | Add CSRF Referer fallback + Retry-After header | P2-13, P2-14 | 3 |

---

## PHASE 7: NAMING ALIGNMENT + REMAINING (P2 + P3)
**Duration: ~26 hours**

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 38 | Resolve table/column naming: update planning docs to match code | P2-08 | 4 |
| 39 | Add admin billing management | P2-10 | 12 |
| 40 | Add impersonation `reason` field | P1-12 | 1 |
| 41 | Add pub/sub channels | P2-12 | 8 |
| 42 | Add remaining ~7 DB tables | P3-01 | 8 |

---

## PHASE 8: FINAL POLISH (P3)
**Duration: ~16 hours**

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 43 | Migrate money columns to integer cents | P3-02 | 4 |
| 44 | Resolve Facebook OAuth (remove or doc-update) | P3-05 | 0.5 |
| 45 | Docker/K8s end-to-end testing | P3-07 | 8 |

---

## TIMELINE SUMMARY

| Phase | Focus | Hours | Cumulative | Status |
|-------|-------|-------|------------|--------|
| 1 | Security + Billing Critical | 28 | 28 | ✅ DONE |
| 2 | Schema + Logging | 30 | 58 | ✅ Logging done; schema partial |
| 3 | Schema Completion + API Keys | 12 | 70 | **NEXT** |
| 4 | Frontend Components + Search | 34 | 104 | Not started |
| 5 | Tool Execution Completion | 15 | 119 | Not started |
| 6 | Admin Features + Polish | 50 | 169 | Not started |
| 7 | Naming + Remaining | 26 | 195 | Not started |
| 8 | Final Polish | 16 | 211 | Not started |

### Critical Milestones

| Milestone | After Phase | Status |
|-----------|-------------|--------|
| **Safe to deploy staging** | Phase 1 | ✅ ACHIEVED |
| **Schema-complete** | Phase 3 | **NEXT** |
| **Feature-complete for v1.0** | Phase 5 | Not yet |
| **Full product** | Phase 7 | Not yet |
| **Planning-aligned** | Phase 8 | Not yet |

---

## DECISION POINTS — ALL RESOLVED

### D-01: Deployment Strategy ✅
**Decision:** Self-hosted VPS. Single VPS initially, split later.

### D-02: Background Jobs ✅
**Decision:** Simple queue system. No BullMQ, no Inngest. Custom lightweight queue with Redis.

### D-03: Email Provider ✅
**Decision:** Resend + Self SMTP dual provider. Admin-configurable from panel.

### D-04: Search Engine ✅
**Decision:** Skip Meilisearch for MVP. PostgreSQL FTS sufficient.

### D-05: Admin Real-time ✅
**Decision:** Both WebSocket AND SSE. SSE for metrics/notifications, WebSocket for bidirectional communication.

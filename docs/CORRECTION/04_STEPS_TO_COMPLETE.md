# 04 — STEPS TO COMPLETE (Sprint Execution Plan)

> **Last updated:** 2025-07-15
> **Based on:** Doc 03 remaining work items
> **Philosophy:** P0 first → P1 next → P2/P3 after

---

## PHASE 1: SECURITY & BILLING CRITICAL FIXES (P0)
**Duration: ~28 hours | Sprint 6**

### Sprint 6A — Billing Integrity (12 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 1 | Wire coin deduction into B2B REST execute route | P0-01 | 2 |
| 2 | Call `confirmReservation()` after async job completion | P0-02 | 2 |
| 3 | Implement Stripe refund coin clawback | P0-04 | 3 |
| 4 | Add `processed_webhooks` table + wire into both webhook handlers | P0-05 | 4 |
| 5 | Fix daily bonus race condition (add FOR UPDATE) | P1-13 | 1 |

**Exit criteria:** Run billing integration test — every execution path deducts coins, refunds claw back, webhooks are idempotent.

### Sprint 6B — Security Hardening (16 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 6 | Invoke `checkUserRateLimit()` in web middleware | P0-06 | 1 |
| 7 | Server-enforce admin 2FA in middleware | P0-07 | 4 |
| 8 | Add impersonation scoped-action middleware | P0-08 | 4 |
| 9 | Add impersonation `reason` field | P1-12 | 1 |
| 10 | Wire CASL into web app — install `@casl/react`, create provider, add tRPC middleware | P0-03 (partial) | 6 |

**Exit criteria:** CASL blocks free users from premium tools. Admin 2FA server-enforced. Impersonation blocks billing/password actions. All rate limit layers active.

---

## PHASE 2: DATA INTEGRITY & LOGGING (P1 partial)
**Duration: ~30 hours | Sprint 7**

### Sprint 7A — Schema Quality (14 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 11 | Add 13 planned pgEnum types + migrate existing text columns | P1-01 | 6 |
| 12 | Add all 25+ planned database indexes | P1-02 | 4 |
| 13 | Add missing unique constraints on 7 join tables | P1-08 | 2 |
| 14 | Add `tools.tool_class` column + populate from BA weights map | P1-09 | 2 |

**Exit criteria:** `drizzle-kit push` succeeds. All enums + indexes in place. No duplicate join-table rows.

### Sprint 7B — Structured Logging (16 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 15 | Create `@hsafx/logger` package with pino + PII redaction | P1-03 (partial) | 4 |
| 16 | Replace all `console.*` in `apps/web/` (~50 files) | P1-03 | 6 |
| 17 | Replace all `console.*` in `apps/admin/` (~30 files) | P1-03 | 4 |
| 18 | Replace all `console.*` in `packages/` | P1-03 | 2 |

**Exit criteria:** `grep -r "console\.\(log\|error\|warn\)" apps/ packages/` returns 0 results (outside test files).

---

## PHASE 3: FRONTEND COMPLETENESS (P1 partial)
**Duration: ~34 hours | Sprint 8**

### Sprint 8A — Missing Stores + Components (22 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 19 | Build `useBillingStore` (balance, plan, transactions, purchase actions) | P1-05 | 3 |
| 20 | Build `useNotificationStore` (items, unread count, mark read) | P1-05 | 2 |
| 21 | Separate execution state from `useToolStore` into `useExecutionStore` | P1-05 | 1 |
| 22 | Build `ExecutionPanel` component (toolKey, schema, onExecute, result, error) | P1-06 | 4 |
| 23 | Build `UsageCard` component | P1-06 | 2 |
| 24 | Build `BillingCard` component | P1-06 | 3 |
| 25 | Build `TransactionList` component | P1-06 | 3 |
| 26 | Build `ActivityFeed` component | P1-06 | 2 |
| 27 | Build `NotificationBell` component | P1-06 | 2 |

### Sprint 8B — Search + APIs (12 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 28 | Add tsvector column + GIN index to tools table | P1-07 | 3 |
| 29 | Create search API route with `plainto_tsquery` | P1-07 | 3 |
| 30 | Replace client-side tool filtering with search API | P1-07 | 2 |
| 31 | Add billing REST endpoints for B2B | P1-11 | 4 |

**Exit criteria:** All 10 planned components exist. 6 stores exist. PostgreSQL FTS works. B2B billing API functional.

---

## PHASE 4: TOOL EXECUTION COMPLETION (P1 + P2)
**Duration: ~31 hours | Sprint 9**

### Sprint 9A — Execution Gaps (15 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 32 | Complete ~15 stub tool handlers | P1-14 | 12 |
| 33 | Enable FastAPI job processing (uncomment + wire) | P1-15 | 3 |

### Sprint 9B — Simple Job Queue (16 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 34 | Create simple Redis-backed job queue with priority support | P2-01 | 8 |
| 35 | Migrate inline job processing to queue-based | P2-01 | 4 |
| 36 | Add dead-letter handling + retry logic | P2-01 | 4 |

**Exit criteria:** All tools execute (no stubs). FastAPI processes Python jobs. Simple queue handles async dispatch with retries.

---

## PHASE 5: ADMIN & POLISH (P2)
**Duration: ~50 hours | Sprint 10**

### Sprint 10A — Admin Features (28 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 37 | Admin analytics dashboard | P2-03 | 20 |
| 38 | Admin audit log viewer | P2-04 | 8 |

### Sprint 10B — Infrastructure Polish (22 hours)

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 39 | Move shared UI components to `@hsafx/ui` | P2-02 | 12 |
| 40 | Add Redis session caching | P2-05 | 4 |
| 41 | Configure rolling sessions + absolute timeout | P2-06 | 1 |
| 42 | Rename session cookie to `__hsafx_session` | P2-07 | 2 |
| 43 | Add CSRF Referer fallback + Retry-After header | P2-13, P2-14 | 3 |

---

## PHASE 6: TABLE/NAMING ALIGNMENT + REMAINING (P2 + P3)
**Duration: ~26 hours | Sprint 11**

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 44 | Resolve table/column naming: update planning docs to match code | P2-08 | 4 |
| 45 | ~~Add Meilisearch for fuzzy search~~ **SKIPPED** (D-04: too expensive for MVP) | P2-09 | 0 |
| 46 | Add admin billing management | P2-10 | 12 |
| 47 | Stripe dispute + payment failed handlers | P2-11 | 4 |
| 48 | Remove `inngest_job_id`, add missing `roles` columns, build login reward system | P3-03, P3-04 | 6 |

---

## PHASE 7: FINAL POLISH (P3)
**Duration: ~20 hours | Sprint 12**

| # | Task | Ref | Hours |
|---|------|-----|-------|
| 49 | Add remaining 7 DB tables | P3-01 | 8 |
| 50 | Migrate money columns to integer cents | P3-02 | 4 |
| 51 | Docker/K8s end-to-end testing | P3-07 | 8 |

---

## TIMELINE SUMMARY

| Phase | Sprint | Focus | Hours | Cumulative |
|-------|--------|-------|-------|------------|
| 1 | Sprint 6 | Security + Billing Critical | 28 | 28 |
| 2 | Sprint 7 | Schema + Logging | 30 | 58 |
| 3 | Sprint 8 | Frontend Components + Search | 34 | 92 |
| 4 | Sprint 9 | Tool Execution + BullMQ | 31 | 123 |
| 5 | Sprint 10 | Admin Features + Polish | 50 | 173 |
| 6 | Sprint 11 | Naming Alignment + Meilisearch | 38 | 211 |
| 7 | Sprint 12 | Final Polish | 20 | 231 |

### Critical Milestones

| Milestone | After Phase | Hours In | Status |
|-----------|-------------|----------|--------|
| **Safe to deploy staging** | Phase 1 | 28h | All P0 security/billing fixed |
| **Feature-complete for v1.0** | Phase 3 | 92h | All P1 done |
| **Full product** | Phase 5 | 173h | All P2 done |
| **Planning-aligned** | Phase 7 | 231h | All deviations resolved |

---

## DECISION POINTS — ALL RESOLVED

### D-01: Deployment Strategy ✅
**Decision:** Self-hosted VPS. Single VPS initially, split to separate VPS per app (web, admin, API) later as needed.

### D-02: Background Jobs ✅
**Decision:** Simple queue system. No BullMQ, no Inngest. Custom lightweight queue with Redis.
**Impact:** Sprint 9B (BullMQ) replaced with simple queue implementation. Dead-letter + retry logic stays but uses simple custom approach.

### D-03: Email Provider ✅
**Decision:** Resend + Self SMTP dual provider. Admin-configurable from panel (NOT hardcoded). Provider switching without code changes.

### D-04: Search Engine ✅
**Decision:** Skip for MVP (too expensive). No Meilisearch, no Algolia. PostgreSQL `tsvector` for basic FTS is sufficient for now.
**Impact:** Phase 6 task 45 (Meilisearch) removed. Phase 3 Sprint 8B task 28-30 (PostgreSQL FTS) still applies.

### D-05: Admin Real-time ✅
**Decision:** Both WebSocket AND SSE depending on situation. SSE for dashboard metrics/notifications, WebSocket for bidirectional admin-to-user communication.

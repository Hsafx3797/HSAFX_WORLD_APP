# SOLUTION ROADMAP — HSAFX WORLD APP

> **Date:** 2025-07-15
> **Based on:** CORRECTION docs 01–05
> **Status:** Pre-Sprint 6

---

## OVERVIEW

This roadmap translates the 44 remaining work items (from [03_REMAINING_WORK.md](03_REMAINING_WORK.md)) into an actionable sequence. It requires **5 decisions from the owner** before Sprint 6 begins.

---

## DECISION GATES (Owner Must Resolve)

These come from [05_PLANNING_DOCUMENT_CONFLICTS.md](05_PLANNING_DOCUMENT_CONFLICTS.md) and deviation analysis:

| # | Decision | Options | Impact |
|---|----------|---------|--------|
| D-01 | **Rename tables/columns to match DBML?** | (a) Rename code to match planning  (b) Update DBML to match code | Migration risk vs doc drift |
| D-02 | **Payment provider: Stripe or Polar?** | (a) Keep Polar  (b) Migrate to Stripe | Polar works but docs say Stripe |
| D-03 | **Add Facebook OAuth?** | (a) Add it  (b) Remove from planning | MVP scope question |
| D-04 | **Pro plan price: $10/mo or $29/mo?** | Doc 20 says $10, doc 21 says $29 | Revenue model |
| D-05 | **Daily ad coin cap: 50 or 1,000?** | Doc 20 says 1,000, doc 21 says 50 | Economics |

**Nothing in Sprint 6 should start until D-01 through D-05 are answered.**

---

## PHASE PLAN

### Phase 1 — Security & Billing Fixes (Sprint 6) — ~28h
> Prerequisite: Decisions D-01 through D-05

**What:** Fix the 12 CRITICAL deviations. No new features.

- Wire coin deduction into B2B REST route
- Call `confirmReservation()` after async job completion
- Wire CASL `can()` checks into API routes and UI
- Implement refund clawback webhook handler
- Add `processed_webhooks` table + idempotency check
- Invoke session rate limit in middleware
- Server-enforce admin 2FA on all sensitive routes
- Restrict impersonation actions (billing, password, 2FA)

**Exit Criteria:** All 8 P0 items pass manual testing. `confirmReservation` verified in job completion path. B2B route deducts coins.

---

### Phase 2 — Schema & Data Integrity (Sprint 7) — ~30h

**What:** Fix database foundation.

- Add all 13 PostgreSQL enums from DBML
- Add all planned indexes (composite, GIN, partial)
- Create 13 missing tables or decide to defer
- Rename columns per D-01 decision
- Add missing foreign keys and constraints
- Generate and run Drizzle migrations

**Exit Criteria:** `drizzle-kit push` succeeds cleanly. Schema matches DBML (or DBML updated to match code per D-01).

---

### Phase 3 — Billing Lifecycle Completion (Sprint 8) — ~32h

**What:** Complete the billing system end-to-end.

- Monthly allowance cron job
- Plan upgrade/downgrade proration
- Usage reporting (weekly aggregation)
- B2B billing dashboard
- Invoice generation
- Grace period enforcement for failed payments
- Free tier daily cap enforcement
- Overage handling logic

**Exit Criteria:** Full subscribe → use → exhaust → refill → upgrade cycle works.

---

### Phase 4 — Frontend Completion (Sprint 9) — ~36h

**What:** Build the missing 60% of web app UI.

- Tool execution page (the core use case)
- User billing dashboard
- Result viewer (export JSON/CSV/PDF)
- Notification system (toast + inbox)
- Search infrastructure (Meilisearch or client-side)
- Missing Zustand stores (`useBillingStore`, `useNotificationStore`, `useExecutionStore`)
- Mobile-responsive layout audit

**Exit Criteria:** User can: discover tool → execute → see result → export → check billing.

---

### Phase 5 — Admin & Observability (Sprint 10) — ~28h

**What:** Admin panel and operational tooling.

- Admin analytics viewer (chart.js or recharts)
- Audit log viewer with filters
- User management CRUD (currently list-only)
- Tool management (enable/disable/adjust pricing)
- Structured logging in TypeScript (pino or winston)
- Error boundary + Sentry integration
- Health check endpoints for all services

**Exit Criteria:** Admin can view analytics, manage users/tools, and debug issues via logs.

---

### Phase 6 — Job Queue & Async Processing (Sprint 11) — ~24h

**What:** Proper background job infrastructure.

- Install and configure BullMQ
- Move FastAPI job dispatch to BullMQ
- Job retry, DLQ, and monitoring
- Email sending via queue
- Scheduled jobs (cleanup, aggregation, allowance)
- Redis queue dashboard in admin

**Exit Criteria:** All async work goes through BullMQ. No inline `setTimeout` processing.

---

### Phase 7 — Testing & Launch Prep (Sprint 12) — ~20h

**What:** Quality gate before staging.

- Integration tests for billing lifecycle
- E2E test for critical user journey
- Load test for /api/v1/tools/:key/execute
- Security audit (OWASP top 10 check)
- Performance budget enforcement
- Documentation update (README, API docs)
- Staging deployment dry run

**Exit Criteria:** CI green. Billing integration test passes. Under 500ms p95 for tool execution.

---

## TIMELINE SUMMARY

| Phase | Sprint | Hours | Running Total |
|-------|--------|-------|---------------|
| 1. Security & Billing Fixes | 6 | 28h | 28h |
| 2. Schema & Data Integrity | 7 | 30h | 58h |
| 3. Billing Lifecycle | 8 | 32h | 90h |
| 4. Frontend Completion | 9 | 36h | 126h |
| 5. Admin & Observability | 10 | 28h | 154h |
| 6. Job Queue & Async | 11 | 24h | 178h |
| 7. Testing & Launch Prep | 12 | 20h | 198h |

**MVP (P0 + P1 only, Phases 1–3): ~90 hours**
**Full Build (all phases): ~198 hours**

---

## RISK REGISTER

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Table rename migration breaks existing data | Medium | Take DB snapshot before D-01 migration |
| Polar → Stripe migration disrupts subscriptions | Low (if staying Polar) | Keep Polar unless owner demands Stripe |
| BullMQ adds operational complexity | Low | Use Upstash Redis (already provisioned) |
| Frontend rebuild exceeds estimates | Medium | Prioritize tool execution page; defer search |
| Planning doc conflicts cause rework | High | **Resolve D-01 through D-05 FIRST** |

# SOLUTION ROADMAP — HSAFX WORLD APP

> **Date:** 2026-02-12
> **Commit:** `5394975` on `master`
> **Based on:** CORRECTION docs 01–05
> **Status:** Phase 1 COMPLETE, Phase 2 partial, entering Phase 3

---

## OVERVIEW

This roadmap translates the remaining work items (from [03_REMAINING_WORK.md](03_REMAINING_WORK.md)) into an actionable sequence. All 5 owner decisions are resolved. All 10 planning conflicts are locked.

**Progress:** 16/44 items complete (~36% items, ~85 hours done). ~169 hours remaining.
**No CRITICAL blockers remain** — staging deployment is safe.

---

## DECISION GATES — ALL RESOLVED ✅

| # | Decision | Answer | Locked |
|---|----------|--------|--------|
| D-01 | Deployment strategy | Self-hosted VPS | ✅ |
| D-02 | Background jobs | Simple queue (no BullMQ) | ✅ |
| D-03 | Email provider | Resend + Self SMTP dual | ✅ |
| D-04 | Search engine | Skip Meilisearch for MVP (PostgreSQL FTS) | ✅ |
| D-05 | Admin real-time | Both WebSocket + SSE | ✅ |

### Planning Conflicts — ALL LOCKED ✅

| # | Conflict | Decision |
|---|----------|----------|
| #1 | Starter plan price | $4.99 |
| #2 | Ad system vs login rewards | Login rewards (ads removed) |
| #3 | Daily coin cap | 50 coins/day |
| #4 | API key limit | Max 5 per user |
| #5 | Rate limits | Free=100, Pro=500 req/hr |
| #6 | Pro plan price | $10/mo |
| #7 | Over-limit error code | HTTP 402 with B001 |
| #8 | Coins per reward | 10 coins |
| #9 | Status column type | varchar (not pgEnum) |
| #10 | Payment provider | Polar(subs) + Stripe(coins) dual |

---

## PHASE PLAN

### ✅ Phase 1 — Security & Billing Fixes — COMPLETE
> Sprints P0-01 through P0-08, P1-07

**Completed:**
- ✅ Wire coin deduction into B2B REST route
- ✅ Call `confirmReservation()` after async job completion
- ✅ Wire CASL `can()` checks into API routes and UI (full stack)
- ✅ Implement refund clawback webhook handler
- ✅ Add `processed_webhooks` table + idempotency
- ✅ Invoke session rate limit in middleware
- ✅ Server-enforce admin 2FA on all sensitive routes
- ✅ Restrict impersonation actions (scoped middleware)

**Result:** All 12 CRITICAL deviations resolved or partially resolved. Zero blocking items remain.

---

### ✅ Phase 2 (partial) — Schema & Logging
> Sprint P2-01 (logging), Sprint P1-01 (partial enums)

**Completed:**
- ✅ Structured logging with pino (`createLogger()` in `@hsafx/shared/logger`)
- ✅ ~75+ `console.*` calls migrated across apps and packages
- ✅ 4 pgEnums created (`subscription_status`, `coin_transaction_type`, `invoice_status`, `payment_status`)
- ✅ Login reward tables added (`login_reward_claims`)
- ✅ `processed_webhooks` table added
- ✅ `inngest_job_id` renamed to `external_job_id`
- ✅ Ad tables + dead code removed

**Remaining in Phase 2:**
- 9 more pgEnums to add
- 25+ database indexes
- Unique constraints on join tables
- Missing columns (`tools.tool_class`, `api_keys.scopes`)

---

### 🔜 Phase 3 — Schema Completion (NEXT)

**What:** Complete all remaining database schema work in one batch.

- Add 9 remaining pgEnums from DBML
- Add all 25+ planned indexes (composite, GIN, partial)
- Add unique constraints on 7 join tables
- Add `tools.tool_class` column
- Add `api_keys.scopes` text[] column
- Generate Drizzle migrations

**Exit Criteria:** Schema matches DBML. All enums, indexes, and constraints present.

---

### Phase 4 — Frontend Completion

**What:** Build missing stores, components, search, and B2B billing API.

- Zustand stores: `useBillingStore`, `useNotificationStore`, `useExecutionStore`
- UI components: ExecutionPanel, UsageCard, BillingCard, TransactionList, ActivityFeed, NotificationBell
- PostgreSQL FTS: tsvector + GIN index on tools table, search API, replace client-side filtering
- Billing REST endpoints for B2B

**Exit Criteria:** User can discover → execute → view results → check billing. FTS search works.

---

### Phase 5 — Tool Execution Completion

**What:** Complete stub tool handlers and enable FastAPI processing.

- Implement ~15 stub tool handlers (BSON, MessagePack, Avro, Protobuf, Parquet, etc.)
- Enable FastAPI job processing with completion callback

**Exit Criteria:** All 454+ tools execute (zero stubs). FastAPI processes Python jobs.

---

### Phase 6 — Admin & Polish (P2)

**What:** Admin panel features and session/infrastructure improvements.

- Admin analytics dashboard (charts, metrics)
- Admin audit log viewer (filterable)
- Move shared UI components to `@hsafx/ui`
- Redis session caching
- Rolling sessions + absolute timeout
- Session cookie rename
- CSRF + Retry-After improvements

---

### Phase 7 — Alignment & Remaining

**What:** Naming alignment, admin billing, pub/sub, remaining DB tables.

- Update planning docs to match code table/column naming
- Admin billing management
- Pub/sub channels
- Remaining ~7 DB tables

---

### Phase 8 — Final Polish (P3)

**What:** Money column migration, E2E testing, cleanup.

- Money columns to integer cents
- Facebook OAuth resolution
- Docker/K8s end-to-end testing

---

## TIMELINE SUMMARY

| Phase | Focus | Hours | Cumulative | Status |
|-------|-------|-------|------------|--------|
| 1. Security & Billing | 28h | 28h | ✅ DONE |
| 2. Schema & Logging | 30h | 58h | ✅ Partial (logging done) |
| 3. Schema Completion | 12h | 70h | **NEXT** |
| 4. Frontend Completion | 34h | 104h | Not started |
| 5. Tool Execution | 15h | 119h | Not started |
| 6. Admin & Polish | 50h | 169h | Not started |
| 7. Alignment + Remaining | 26h | 195h | Not started |
| 8. Final Polish | 16h | 211h | Not started |

**Total remaining: ~169 hours** (from original ~254)

---

## RISK REGISTER

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Schema migration breaks existing data | Low | Take DB snapshot before migration batch |
| Frontend rebuild exceeds estimates | Medium | Prioritize tool execution page; defer search |
| Stub tool implementation quality | Medium | Start with simpler tools, iterate |
| ~~Planning doc conflicts cause rework~~ | ~~High~~ | ✅ All 10 conflicts resolved and locked |
| ~~Decision gates block progress~~ | ~~High~~ | ✅ All 5 decisions resolved |

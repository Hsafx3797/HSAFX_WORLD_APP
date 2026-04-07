# 23 — State Flow Diagrams (Compacted)

> Visual flow reference for critical system paths. Logic details in docs 14, 15, 20, 21, 22.

---

## 1. Auth Flows

### Email/Password Login

User → rate-limit check (Upstash sliding window) → email lookup → password verify (Argon2id) → optional CAPTCHA (hCaptcha after 3 fails) → optional 2FA (TOTP) → session created (better-auth, `__hsafx_session` cookie) → redirect.
**✅ Built** — better-auth handles login, rate-limit in `login-security.ts`, hCaptcha ✅ built. 2FA ❌ not built.

### OAuth Login (Google/GitHub)

User → redirect to provider (PKCE) → callback with code → exchange for tokens → find-or-create user (link by email) → session created → redirect.
**✅ Built** — better-auth social providers.

### API Key Auth

Request with `X-API-Key` header → SHA-256 hash lookup in `apiKeys` table → check: not revoked, not expired → scope check (`tools:read`, `tools:execute`) → rate-limit per key → proceed.
**✅ Built** — `packages/api/src/routers/apiKeys.ts`, key hashing + scope validation.

---

## 2. Subscription State Machine

**Key principle: Subscription status is ALWAYS derived, never stored directly.**

Derived statuses:

- `trialing` — trialEnd > now, no payment yet
- `active` — currentPeriodEnd > now, paid
- `active_canceling` — active + cancelAtPeriodEnd = true
- `past_due` — payment failed, within grace period (3 days)
- `canceled` — user canceled, still within paid period
- `expired` — period ended, no renewal

Transitions: `trialing → active → active_canceling → expired`, `active → past_due → (retry success → active | grace expired → expired)`.
**✅ Built** — Subscription status derivation in billing tRPC router.

---

## 3. Coin Flows

### Purchase

User selects pack → Stripe checkout session → payment success webhook → credit coins to wallet (atomic INSERT into `coinTransactions` + UPDATE `coinWallet.balance`) → display updated balance.
**✅ Built** — `coin-service.ts` with atomic reservation pattern. Actual packs: see seed.ts (5 tiers, $1.99–$199.99).

### Deduction

Tool execution → `calculateCoinCost(toolId, plan)` → `SELECT ... FOR UPDATE` on wallet → verify sufficient balance → deduct (INSERT debit transaction + UPDATE balance) → proceed. Idempotency via `idempotencyKey` on transactions.
**✅ Built** — `coin-service.ts` reserve/confirm/release pattern.

---

## 4. Tool Execution

### Client-Side (WASM)

Load tool metadata (execution_type: 'wasm') → access check (plan gate + usage limit) → load WASM module (lazy, cached) → user inputs data → execute in browser (no server roundtrip, data stays client-side) → background: log usage (fire-and-forget tRPC mutation) → display result.
**✅ Built** — `wasm-loader.ts` → engine architecture (19 engines, 653 presets).

### Server-Side (API/FastAPI)

Load tool metadata (execution_type: 'api') → access check → user inputs data (text or file upload to R2 via presigned URL) → submit job (create record, status: queued) → dispatch to FastAPI (HMAC-signed) → FastAPI processes (download input from R2 → execute → upload output to R2 → callback) → update job status → client polls/SSE → result available.
**⚠️ Correction:** Doc says "Inngest dispatch" but Inngest is ❌ NOT integrated. Job dispatch is direct HTTP to FastAPI.
**✅ Built** — FastAPI backend, job system, R2 file handling.

---

## 5. File Processing Flow

Client-side validation (size, extension) → request presigned upload URL (tRPC) → server validates (auth, plan file size limit, storage quota) → generate presigned URL (R2, 15min TTL) → client PUT to presigned URL → server revalidation (magic bytes MIME check, optional virus scan for retained/shareable/executable files) → create `file_uploads` record → file ready for processing.
**✅ Built** — Uploadthing → R2 flow in `apps/web`.

---

## 6. Admin Impersonation Flow

Admin searches user → clicks "Impersonate" (enters mandatory reason) → permission check (`users:impersonate` permission, target not admin) → create impersonation context (cookie-based, 1-hour TTL) → audit log: `impersonation_start` → UI shows banner with timer + stop button → scoped actions only (restricted actions blocked: password change, delete account, billing, nested impersonation) → auto-terminate on timeout → audit log: `impersonation_end`.
**✅ Built** — `apps/admin/src/app/api/admin/impersonate/route.ts` (POST/DELETE/GET), cookie `admin_impersonation`, 1h TTL. UI wiring ❌ TODO (G16).

---

## 7. Webhook Processing Flow

Receive webhook → HMAC-SHA256 signature verification → timestamp check (< 5 min) → parse event → idempotency check (`processed_webhooks` table) → already seen → 200 no-op. New event → BEGIN TRANSACTION → INSERT into `processed_webhooks` → route by event.type: `subscription.*` → update sub record, `checkout.*` → credit coins, `charge.*` → handle refund/dispute → COMMIT → 200 OK.
**Invariant:** All side effects execute in single transaction for atomicity.
**✅ Built** — Stripe/Polar webhook handlers in `apps/web/src/app/api/webhooks/`.

---

## 8. Error & Recovery

### Payment Failure

Webhook: `subscription.past_due` → mark past_due → 3-day grace period (daily reminder emails) → Day 3: final warning → grace ends without payment → downgrade to Free (keep data, enforce limits, revoke API keys). If payment succeeds (user update or Polar auto-retry) → status: ACTIVE, full access restored.

### Wallet Reconciliation (Cron)

**✅ Built** — `apps/web/src/app/api/cron/wallet-reconciliation/route.ts`
Daily cron → SELECT all wallets → for each: SUM(coin_transactions) vs wallet.balance → match → skip. Drift < 100 coins → auto-fix. Drift ≥ 100 → auto-fix + alert admin.

### Anonymous Usage Cleanup (Cron)

**✅ Built** — `apps/web/src/app/api/cron/anonymous-cleanup/route.ts`
Daily cron → DELETE anonymous_usage records older than 90 days → log count.
**⚠️ Correction:** Doc says Inngest function — actual: Next.js cron route.

### All 6 Cron Jobs (Built)

`wallet-reconciliation`, `anonymous-cleanup`, `subscription-sync`, `cleanup-deleted-users`, `streak-warnings`, `stale-job-cleanup`.

---

## Appendix A: State Enums

| Entity       | States                                                          | Derived?  |
| ------------ | --------------------------------------------------------------- | --------- |
| Subscription | trialing, active, active_canceling, past_due, canceled, expired | ✅ Yes    |
| Payment      | pending, paid, failed, refunded                                 | ❌ Stored |
| Invoice      | draft, open, partially_paid, paid, void, uncollectible          | ❌ Stored |
| Job          | queued, processing, completed, failed                           | ❌ Stored |
| File Upload  | uploading, processing, ready, expired, deleted                  | ❌ Stored |

## Appendix B: Failure Mode Summary

| Flow           | Failure         | Recovery                        |
| -------------- | --------------- | ------------------------------- |
| Payment        | Card declined   | 3-day grace + retry + downgrade |
| Webhook        | Missed delivery | Daily reconciliation job        |
| Coin deduction | Concurrent race | SELECT FOR UPDATE lock          |
| File upload    | Virus detected  | Delete + notify                 |
| Impersonation  | Timeout         | Auto-terminate, audit logged    |
| WASM execution | OOM             | Browser handles, graceful error |
| API job        | Timeout         | Mark failed, allow retry        |

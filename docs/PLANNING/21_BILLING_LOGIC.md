# 21 — Billing Logic

> Compacted. Code samples removed (see coin-service.ts for actual implementation). Only rules, invariants, and design decisions kept. For tool class policies, BA weights, rate limits, and plan pricing, see doc 20.

---

## 1. Provider Architecture

| Concern             | Polar (Source of Truth) | HSAFX (Derived)              |
| ------------------- | ----------------------- | ---------------------------- |
| Subscription status | ✅                      | Cached, derived at read-time |
| Payment processing  | ✅                      | Not involved                 |
| Invoice / tax       | ✅                      | Store reference only         |
| Plan features       | ❌                      | ✅ Source of truth           |
| Usage limits        | ❌                      | ✅ Source of truth           |
| Coin balance        | ❌                      | ✅ Source of truth           |

**Subscriptions:** Polar → Stripe. **Coin purchases:** Stripe directly.

---

## 2. Billing Invariants

| #   | Invariant                                                                        |
| --- | -------------------------------------------------------------------------------- |
| 1   | Subscription status is NEVER stored — derived from timestamps + provider signals |
| 2   | Coin balance = SUM(ledger transactions) — wallet row is cache                    |
| 3   | One active subscription per user (partial unique index)                          |
| 4   | Webhooks are idempotent (`processedWebhooks` table)                              |
| 5   | Money in cents, always bigint — no floating point                                |
| 6   | Provider is source of truth for payments                                         |
| 7   | Coin transactions are immutable (INSERT-only)                                    |
| 8   | Usage checks happen server-side only                                             |
| 9   | 3-day grace period before hard enforcement on payment failure                    |
| 10  | Downgrades preserve data (limits enforced, data not deleted)                     |

---

## 3. Subscription Lifecycle

### Status Derivation (never stored)

```
trialing       → trial_ends_at > now
active         → current_period_end > now && !cancel_at_period_end
active_canceling → current_period_end > now && cancel_at_period_end
past_due       → provider says past_due (payment failed, grace)
canceled       → explicitly canceled
expired        → current_period_end <= now
```

**Rule:** User intent (cancellation) always dominates provider signals to prevent race conditions.

### Plan Transitions

| From → To          | Trigger             | Effect                   |
| ------------------ | ------------------- | ------------------------ |
| Free → Pro/Advance | checkout.completed  | Immediate access upgrade |
| Pro → Advance      | checkout.completed  | Immediate, prorated      |
| Advance → Pro      | User request        | Downgrade at period end  |
| Pro/Advance → Free | Cancel + period end | Downgrade to free limits |

### Proration

- **Upgrade mid-cycle:** Charge prorated difference immediately
- **Downgrade mid-cycle:** Apply at next billing cycle (no refund)
- **Cancel mid-cycle:** Access until period end

---

## 4. Coin Packs

> ⚠️ **Doc vs Code discrepancy.** Doc 20 says "Small 50/$2, Large 150/$5". Actual seed data:

| Pack       | Coins | Bonus | Price   | Per-Coin |
| ---------- | ----- | ----- | ------- | -------- |
| Starter    | 100   | 0     | $1.99   | $0.020   |
| Popular    | 500   | 50    | $7.99   | $0.015   |
| Pro Pack   | 1000  | 150   | $14.99  | $0.013   |
| Mega Pack  | 5000  | 1000  | $59.99  | $0.010   |
| Enterprise | 20000 | 5000  | $199.99 | $0.008   |

**Implementation:** ✅ Built — `coinPacks` table in `packages/db/src/schema/billing.ts`, seeded in `packages/db/src/seed.ts`

---

## 5. Webhook Handling

### Security

- Signature: `polar.webhooks.verify()` / `stripe.webhooks.constructEvent()`
- Idempotency: `processed_webhooks` table with unique index on `(provider, event_id)`
- Replay protection: timestamp within 5 minutes

### Polar Events (Subscriptions)

| Event                   | Effect                           |
| ----------------------- | -------------------------------- |
| `subscription.created`  | Create local subscription record |
| `subscription.updated`  | Update local record              |
| `subscription.canceled` | Mark canceled                    |

### Stripe Events (Coin Purchases Only)

| Event                        | Effect                                       |
| ---------------------------- | -------------------------------------------- |
| `checkout.session.completed` | Credit coins to wallet                       |
| `charge.refunded`            | Deduct coins                                 |
| `charge.dispute.created`     | Flag account, freeze purchases, notify admin |

> **Guard Rule:** All subscription-related Stripe events are IGNORED — Polar is authoritative.

**Implementation:** ✅ Built — `apps/web/src/app/api/webhooks/stripe/route.ts` and `polar/route.ts`

---

## 6. Usage Enforcement

**Enforcement points (in order):**

1. API Gateway → rate limits → 429
2. tRPC Middleware → plan feature access → 403
3. Tool Execution → usage counter → 403 + coin fallback offer
4. File Upload → size limits → 413

### Grace Period

| Scenario             | Grace         | Behavior                           |
| -------------------- | ------------- | ---------------------------------- |
| Payment failed       | 3 days        | Full access, daily reminder emails |
| Subscription expired | 0 days        | Immediate downgrade                |
| Trial ending         | 3 days notice | Email reminders at -3, -1, 0 days  |

During grace: all features work, coin spending allowed, coin purchases allowed, but plan upgrades blocked.

---

## 7. Refunds & Disputes

### Refund Policy

| Product       | Window  | Condition                            |
| ------------- | ------- | ------------------------------------ |
| Subscription  | 7 days  | Pro-rated, no questions              |
| Coin purchase | 14 days | Unused coins only (FIFO attribution) |
| Coin purchase | 0 days  | If coins already spent               |

**FIFO Attribution Rule:** Oldest purchased coins are spent first. Refund requires `(original_purchase - coins_spent_since) >= refund_amount`.

### Dispute Handling

- Account flagged, coin purchases frozen (30-day Redis key)
- **Usage continues** during dispute (revoking escalates disputes)
- Admin notified, audit logged

---

## 8. Edge Cases

| Scenario                        | Prevention/Behavior             |
| ------------------------------- | ------------------------------- |
| Double pay click                | Unique checkout session ID      |
| Webhook delivered twice         | Idempotency by event_id         |
| Concurrent coin deductions      | Transaction + SELECT FOR UPDATE |
| 500 images, downgrade to Free   | Keep images, block new uploads  |
| Has API keys, downgrade to Free | Revoke API keys                 |
| 1000 coins, cancel subscription | Keep coins (paid for them)      |

---

## 9. Reconciliation Jobs

| Job                       | Schedule  | Purpose                      |
| ------------------------- | --------- | ---------------------------- |
| `reconcile-wallets`       | 02:00 UTC | wallet balance vs ledger sum |
| `reconcile-subscriptions` | 03:00 UTC | sync with Polar status       |
| `reconcile-payments`      | 04:00 UTC | verify records match Stripe  |
| `expire-stale-checkouts`  | \*/15 min | clean abandoned checkouts    |

**Safety:** Batch max 100, rate limit 10 req/s to Polar/Stripe, exponential backoff on 429, skip canceled >90 days.

**Implementation:** ✅ Partial — `wallet-reconciliation` and `subscription-sync` cron routes exist in `apps/web/src/app/api/cron/`

---

## 10. Error Codes

| Code                      | HTTP | Description                         |
| ------------------------- | ---- | ----------------------------------- |
| `INSUFFICIENT_COINS`      | 403  | Not enough coins (B2C)              |
| `PLAN_LIMIT_EXCEEDED`     | 403  | Usage limit reached (B2C)           |
| `FEATURE_NOT_AVAILABLE`   | 403  | Requires higher plan                |
| `PAYMENT_FAILED`          | 402  | Payment failed                      |
| `SUBSCRIPTION_REQUIRED`   | 403  | Requires active subscription        |
| `CHECKOUT_EXPIRED`        | 410  | Session expired                     |
| `REFUND_NOT_ELIGIBLE`     | 400  | Coins already spent                 |
| `ACCOUNT_FROZEN`          | 403  | Dispute freeze                      |
| `B2B_QUOTA_EXHAUSTED`     | 403  | B2B suite ops quota exhausted       |
| `B2B_NO_SUBSCRIPTION`     | 403  | No active B2B subscription          |
| `B2B_SUITE_NOT_AVAILABLE` | 403  | Tool has no mapped B2B suite        |

---

## 11. B2B Billing (Separate System)

B2B billing is **completely independent** from B2C coins. They share the same user table but have separate subscription, plan, and usage tracking.

### Architecture

- **Schema:** `packages/db/src/schema/b2b.ts` (7 tables with `b2b_` prefix)
- **Service:** `apps/web/src/server/limits/b2b-quota-service.ts`
- **Admin:** 7 routes under `apps/admin/src/app/api/admin/b2b/`

### Dual-Path Billing Flow

All execution routes (category, tool/slug, engine/execute, batch) detect B2B vs B2C:

```
Request → Auth (API key or session)
  → Has active B2B subscription?
    → YES: resolveB2bSuite(category, toolId) → checkB2bQuota(userId, suiteId)
      → Allowed → Execute → On SUCCESS → incrementB2bUsage(userId, suiteId)
      → Exhausted → 403 B2B_QUOTA_EXHAUSTED (hard block, no fallback)
    → NO: Fall through to B2C coin billing (reserveCoins → execute → confirm/release)
```

### B2B Invariants

| #   | Invariant                                                                          |
| --- | ---------------------------------------------------------------------------------- |
| 1   | B2B and B2C billing never overlap — B2B subscription users bypass coin system      |
| 2   | 1 op = 1 successful execution (FULL_SUCCESS only, failed = free)                   |
| 3   | Hard block (403) when quota exhausted — no coin fallback for B2B users             |
| 4   | Per-suite quotas, not global pool — each suite tracked independently               |
| 5   | Calendar month reset with admin-customizable resetDayOfMonth (1-28)                |
| 6   | 1 user = 1 active B2B subscription (partial unique index)                          |
| 7   | Downgrade mid-period: keep old quota until period end                              |
| 8   | Usage incremented atomically: INSERT ON CONFLICT DO UPDATE WHERE count < limit     |
| 9   | Per-tool suite overrides take precedence over category→suite mapping               |

### Suite Resolution

```
resolveB2bSuite(category, toolId?) →
  1. Check b2bToolSuiteOverrides for toolId (if provided)
  2. If no override, check b2bSuiteCategories for category
  3. Return suiteId or throw B2bSuiteNotAvailableError
```

**Implementation:** ✅ Built — All routes, job-worker, job-complete callback integrated. 20 unit tests passing.

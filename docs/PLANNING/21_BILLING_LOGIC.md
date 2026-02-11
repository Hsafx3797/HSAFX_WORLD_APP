# 21 — Billing Logic

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 4, 2026  
**Status:** ✅ APPROVED — Billing Logic v1 Locked

> **⚠️ Change Control Note**  
> Any modification to this document requires review of:  
> `13_DATABASE_SCHEMA`, `14_API_CONTRACTS`, and `15_SECURITY_MODEL`.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Billing Invariants](#2-billing-invariants)
3. [Subscription Lifecycle](#3-subscription-lifecycle)
4. [Coin System](#4-coin-system)
5. [Payment Processing](#5-payment-processing)
6. [Webhook Handling](#6-webhook-handling)
7. [Usage Enforcement](#7-usage-enforcement)
8. [Refunds & Disputes](#8-refunds--disputes)
9. [Edge Cases & Failure Modes](#9-edge-cases--failure-modes)
10. [Reconciliation](#10-reconciliation)

---

## 1. Overview

### 1.1 Revenue Streams

| Stream | Provider | Description |
|--------|----------|-------------|
| **Subscriptions** | Polar → Stripe | Recurring monthly/yearly plans (Pro, Advance) |
| **Coin Purchases** | Stripe | One-time payments for coin packs |
| **Ad Revenue** | Future | Users earn coins by watching ads |

### 1.2 Provider Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PAYMENT PROVIDER ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Polar     │────────▶│   Stripe    │────────▶│    Bank     │
│ (Merchant   │         │ (Payment    │         │ (Settlement)│
│  of Record) │         │  Processor) │         │             │
└──────┬──────┘         └─────────────┘         └─────────────┘
       │
       │ Handles:
       │ • Tax calculation & remittance
       │ • Invoicing & receipts
       │ • Subscription lifecycle
       │ • Compliance (VAT, sales tax)
       │
       ▼
┌─────────────┐
│  HSAFX      │
│  WORLD      │
│ (Our App)   │
└─────────────┘
  Handles:
  • Feature access
  • Usage tracking
  • Coin ledger
  • Plan enforcement
```

### 1.3 What Polar Manages vs What We Manage

| Concern | Polar (Source of Truth) | HSAFX WORLD (Derived) |
|---------|-------------------------|------------------------|
| Subscription status | ✅ | Cached, derived at read-time |
| Payment processing | ✅ | Not involved |
| Invoice generation | ✅ | Store reference only |
| Tax calculation | ✅ | Not involved |
| Plan features | ❌ | ✅ Source of truth |
| Usage limits | ❌ | ✅ Source of truth |
| Coin balance | ❌ | ✅ Source of truth |

---

## 2. Billing Invariants

> **These rules are non-negotiable and must be enforced at every layer.**

| # | Invariant | Enforcement |
|---|-----------|-------------|
| 1 | **Subscription status is NEVER stored as an enum** | Derived from timestamps + provider signals; no `status` column |
| 2 | **Coin balance = SUM(ledger transactions)** | Wallet is cache; ledger is truth |
| 3 | **One active subscription per user** | Partial unique index on DB |
| 4 | **Webhooks are idempotent** | Check processed before handling |
| 5 | **Money in cents, always bigint** | No floating point anywhere |
| 6 | **Provider is source of truth for payments** | We never modify payment state |
| 7 | **Coin transactions are immutable** | INSERT-only, no UPDATE/DELETE |
| 8 | **Usage checks happen server-side** | Client hints only, server decides |
| 9 | **Grace period before hard enforcement** | 3-day grace on payment failure |
| 10 | **Downgrades preserve data** | Limits enforced, data not deleted |

---

## 3. Subscription Lifecycle

### 3.1 State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SUBSCRIPTION STATE MACHINE                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   NO_SUB     │ (Free plan)
                              │   (default)  │
                              └──────┬───────┘
                                     │ checkout.completed
                                     ▼
                              ┌──────────────┐
              ┌──────────────▶│   TRIALING   │◀─────────────┐
              │               └──────┬───────┘              │
              │                      │ trial ends + payment succeeds
              │                      ▼
              │               ┌──────────────┐
              │    renew ────▶│    ACTIVE    │◀──── payment succeeds
              │               └──────┬───────┘
              │                      │
              │         ┌────────────┼────────────┐
              │         │            │            │
              │         ▼            ▼            ▼
              │  ┌────────────┐ ┌─────────┐ ┌──────────────┐
              │  │  ACTIVE_   │ │ PAST_   │ │   CANCELED   │
              │  │ CANCELING  │ │  DUE    │ │              │
              │  └─────┬──────┘ └────┬────┘ └──────────────┘
              │        │             │               │
              │        │ period ends │ grace ends    │
              │        ▼             ▼               │
              │  ┌──────────────────────┐            │
              └──│       EXPIRED        │◀──────────┘
                 └──────────────────────┘
                           │
                           │ (returns to NO_SUB / Free)
                           ▼
```

### 3.2 Status Derivation Logic

```typescript
// THIS IS THE ONLY PLACE STATUS IS CALCULATED
// Status is NEVER stored in the database

type SubscriptionStatus = 
  | 'trialing'        // trial_ends_at > now
  | 'active'          // current_period_end > now && !cancel_at_period_end
  | 'active_canceling'// current_period_end > now && cancel_at_period_end
  | 'past_due'        // payment failed, within grace period
  | 'canceled'        // explicitly canceled mid-period
  | 'expired';        // current_period_end <= now

function deriveSubscriptionStatus(
  subscription: Subscription | null,
  providerStatus?: string  // From Polar webhook
): SubscriptionStatus {
  // No subscription = free plan (not a status)
  if (!subscription) return null;
  
  const now = new Date();
  
  // IMPORTANT: User intent (cancellation) always dominates provider signals
  // This prevents race conditions where delayed provider events override explicit cancels
  if (subscription.canceledAt && subscription.canceledAt <= now) {
    return 'canceled';
  }
  
  // Provider says past_due (payment failed)
  if (providerStatus === 'past_due') return 'past_due';
  
  // Trial period
  if (subscription.trialEndsAt && subscription.trialEndsAt > now) {
    return 'trialing';
  }
  
  // Period expired
  if (subscription.currentPeriodEnd <= now) {
    return 'expired';
  }
  
  // Active but will cancel at period end
  if (subscription.cancelAtPeriodEnd) {
    return 'active_canceling';
  }
  
  return 'active';
}
```

### 3.3 Plan Transitions

| From | To | Trigger | Effect |
|------|-----|---------|--------|
| Free | Pro/Advance | checkout.completed | Immediate access upgrade |
| Pro | Advance | checkout.completed | Immediate access upgrade, prorated |
| Advance | Pro | User request | Downgrade at period end |
| Pro/Advance | Free | Cancel + period end | Downgrade to free limits |
| Any | Canceled | Immediate cancel | Instant loss of paid features |

### 3.4 Proration Rules

| Scenario | Behavior |
|----------|----------|
| **Upgrade mid-cycle** | Charge prorated difference immediately |
| **Downgrade mid-cycle** | Apply at next billing cycle (no refund) |
| **Cancel mid-cycle** | Access until period end (unless immediate) |

---

## 4. Coin System

### 4.1 Coin Economics

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Base exchange | 100 coins = $1 USD | Simple mental math |
| Minimum purchase | 500 coins ($5) | Stripe minimum viable |
| Bonus tiers | 10-25% bonus at higher tiers | Incentivize larger purchases |
| Expiration | None (MVP) | Simplicity; revisit if abuse |

> **Invariant: Exchange Rate Immutability**  
> The coin-to-currency exchange rate (100 coins = $1 USD) is **immutable for MVP**.  
> Changing this retroactively would break accounting, refund calculations, and user trust.  
> Future rate changes require a migration plan with grandfathering.

### 4.2 Coin Pack Offerings

| Pack Code | Coins | Bonus | Total | Price | Per-Coin |
|-----------|-------|-------|-------|-------|----------|
| `starter_500` | 500 | 0 | 500 | $5 | $0.010 |
| `basic_1000` | 1000 | 100 | 1100 | $10 | $0.009 |
| `value_2500` | 2500 | 375 | 2875 | $25 | $0.0087 |
| `pro_5000` | 5000 | 1000 | 6000 | $50 | $0.0083 |
| `max_10000` | 10000 | 2500 | 12500 | $100 | $0.008 |

### 4.3 Coin Transaction Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COIN PURCHASE FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks "Buy Coins"
        │
        ▼
┌───────────────────┐
│ Create Stripe     │
│ Checkout Session  │
│ (coin pack in     │
│  metadata)        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ User completes    │
│ payment on Stripe │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐      ┌─────────────────────────────────────┐
│ Webhook:          │      │ Handler:                            │
│ checkout.session. │────▶│ 1. Verify idempotency (event.id)    │
│ completed         │      │ 2. Extract pack from metadata       │
│                   │      │ 3. INSERT coin_transaction (+coins) │
│                   │      │ 4. Trigger wallet balance update    │
│                   │      │ 5. INSERT coin_purchase_payment     │
└───────────────────┘      └─────────────────────────────────────┘
```

### 4.4 Coin Deduction Flow

```typescript
// ATOMIC: Must be transactional with idempotency
// INVARIANT: Wallet row MUST be locked during coin deductions to serialize concurrent spends
async function deductCoins(
  userId: string,
  amount: number,
  reference: { type: string; id: string },
  idempotencyKey: string
): Promise<{ success: boolean; newBalance: number }> {
  return await db.transaction(async (tx) => {
    // 0. Lock wallet row to serialize concurrent deductions
    await tx.execute(
      sql`SELECT 1 FROM user_coin_wallets WHERE user_id = ${userId} FOR UPDATE`
    );
    
    // 1. Check idempotency
    const existing = await tx.query.coinTransactions.findFirst({
      where: and(
        eq(coinTransactions.userId, userId),
        eq(coinTransactions.idempotencyKey, idempotencyKey)
      )
    });
    
    if (existing) {
      // Already processed, return current balance
      const wallet = await getWallet(tx, userId);
      return { success: true, newBalance: wallet.balance };
    }
    
    // 2. Get current balance from LEDGER (not wallet cache)
    const ledgerBalance = await tx
      .select({ total: sum(coinTransactions.amount) })
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, userId));
    
    const currentBalance = Number(ledgerBalance[0]?.total ?? 0);
    
    // 3. Check sufficient balance
    if (currentBalance < amount) {
      throw new InsufficientCoinsError(currentBalance, amount);
    }
    
    // 4. INSERT deduction (negative amount)
    await tx.insert(coinTransactions).values({
      userId,
      amount: -amount,  // Negative for deduction
      txnType: 'spend',
      referenceType: reference.type,
      referenceId: reference.id,
      idempotencyKey,
      createdAt: new Date(),
    });
    
    // 5. Update wallet cache (best-effort)
    await tx.update(userCoinWallets)
      .set({
        balance: sql`balance - ${amount}`,
        lifetimeSpent: sql`lifetime_spent + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(userCoinWallets.userId, userId));
    
    return { success: true, newBalance: currentBalance - amount };
  });
}
```

### 4.5 Coin Earning (Ad Rewards)

| Parameter | Value |
|-----------|-------|
| Coins per ad | 5-10 (variable) |
| Daily cap | 50 coins |
| Cooldown | 30 seconds between ads |
| Eligibility | Free plan only (Pro/Advance are ad-free) |

```typescript
// Ad reward validation
async function validateAdReward(userId: string): Promise<boolean> {
  // 1. Check user is on Free plan (Pro/Advance are ad-free)
  const plan = await getUserPlan(userId);
  if (plan !== 'free') return false;
  
  // 2. Check daily cap
  const todayStart = startOfDay(new Date());
  const earnedToday = await db
    .select({ total: sum(coinTransactions.amount) })
    .from(coinTransactions)
    .where(and(
      eq(coinTransactions.userId, userId),
      eq(coinTransactions.txnType, 'bonus'),
      eq(coinTransactions.referenceType, 'ad_reward'),
      gte(coinTransactions.createdAt, todayStart)
    ));
  
  if (Number(earnedToday[0]?.total ?? 0) >= 50) {
    return false; // Daily cap reached
  }
  
  // 3. Check cooldown (Redis)
  const lastAdKey = `ad_cooldown:${userId}`;
  const lastAd = await redis.get(lastAdKey);
  if (lastAd && Date.now() - Number(lastAd) < 30000) {
    return false; // Cooldown active
  }
  
  return true;
}
```

---

## 5. Payment Processing

### 5.1 Payment Methods

| Method | Subscriptions | Coin Purchases | Notes |
|--------|---------------|----------------|-------|
| Credit/Debit Card | ✅ | ✅ | Via Stripe |
| PayPal | Future | Future | Polar supports |
| Apple Pay | ✅ | ✅ | Via Stripe |
| Google Pay | ✅ | ✅ | Via Stripe |

### 5.2 Currency Handling

| Aspect | Rule |
|--------|------|
| Display currency | User's locale preference |
| Storage currency | USD (cents as bigint) |
| Conversion | At checkout time only |
| Provider handling | Stripe/Polar handle FX |

### 5.3 Checkout Session Creation

```typescript
// Subscription checkout (via Polar)
async function createSubscriptionCheckout(
  userId: string,
  planCode: 'pro' | 'advance',
  interval: 'monthly' | 'yearly'
): Promise<{ checkoutUrl: string }> {
  const user = await getUser(userId);
  const priceId = getPolarPriceId(planCode, interval);
  
  const checkout = await polar.checkouts.create({
    productPriceId: priceId,
    successUrl: `${env.APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${env.APP_URL}/subscription/canceled`,
    customerEmail: user.email,
    metadata: {
      userId: userId,
      planCode: planCode,
      interval: interval,
    },
  });
  
  return { checkoutUrl: checkout.url };
}

// Coin purchase checkout (via Stripe directly)
async function createCoinCheckout(
  userId: string,
  packCode: string
): Promise<{ checkoutUrl: string }> {
  const user = await getUser(userId);
  const pack = await getCoinPack(packCode);
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [{
      price: pack.stripePriceId,
      quantity: 1,
    }],
    success_url: `${env.APP_URL}/coins/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/coins`,
    metadata: {
      userId: userId,
      packId: pack.id,
      packCode: pack.code,
      coinsTotal: String(pack.coins + pack.bonusCoins),
    },
  });
  
  return { checkoutUrl: session.url };
}
```

---

## 6. Webhook Handling

### 6.1 Webhook Security

| Check | Implementation |
|-------|----------------|
| Signature verification | `polar.webhooks.verify()` / `stripe.webhooks.constructEvent()` |
| Idempotency | Store `event.id` in `processed_webhooks` table |
| Idempotency race guard | **Unique index on `(provider, event_id)`** — catch conflict on insert |
| Replay protection | Check timestamp within 5 minutes |
| HTTPS only | Enforced by Vercel |

### 6.2 Polar Webhook Events

| Event | Handler | Effect |
|-------|---------|--------|
| `checkout.created` | Log only | Audit trail |
| `subscription.created` | `handleSubscriptionCreated` | Create local subscription record |
| `subscription.updated` | `handleSubscriptionUpdated` | Update local record |
| `subscription.canceled` | `handleSubscriptionCanceled` | Mark canceled |
| `order.created` | Log only | Audit trail |

### 6.3 Stripe Webhook Events (Coin Purchases)

| Event | Handler | Effect |
|-------|---------|--------|
| `checkout.session.completed` | `handleCoinPurchase` | Credit coins to wallet |
| `payment_intent.succeeded` | Log only | Audit trail |
| `payment_intent.payment_failed` | `handlePaymentFailed` | Notify user |
| `charge.refunded` | `handleCoinRefund` | Deduct coins |
| `charge.dispute.created` | `handleDispute` | Flag account, notify admin |

> **⚠️ Guard Rule: Stripe Subscription Events Ignored**  
> Stripe may emit `invoice.payment_failed`, `customer.subscription.updated`, etc.  
> **All subscription-related Stripe events are ignored** — Polar is the authoritative source.  
> Only coin-related Stripe events (checkout, charge, dispute) are processed.

### 6.4 Webhook Handler Pattern

```typescript
// Idempotent webhook handler
async function handleWebhook(
  provider: 'polar' | 'stripe',
  eventId: string,
  eventType: string,
  payload: unknown
): Promise<void> {
  // 1. Idempotency check
  const existing = await db.query.processedWebhooks.findFirst({
    where: and(
      eq(processedWebhooks.provider, provider),
      eq(processedWebhooks.eventId, eventId)
    )
  });
  
  if (existing) {
    console.log(`Webhook ${eventId} already processed`);
    return;
  }
  
  // 2. Process in transaction
  await db.transaction(async (tx) => {
    // Mark as processing (prevents race conditions)
    await tx.insert(processedWebhooks).values({
      provider,
      eventId,
      eventType,
      processedAt: new Date(),
    });
    
    // 3. Route to handler
    switch (eventType) {
      case 'subscription.created':
        await handleSubscriptionCreated(tx, payload);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(tx, payload);
        break;
      // ... other handlers
    }
  });
}
```

---

## 7. Usage Enforcement

### 7.1 Enforcement Points

| Layer | Check | Response |
|-------|-------|----------|
| **API Gateway** | Rate limits | 429 Too Many Requests |
| **tRPC Middleware** | Plan feature access | 403 Forbidden |
| **Tool Execution** | Usage counter | 403 + coin fallback offer |
| **File Upload** | Size limits | 413 Payload Too Large |

### 7.2 Usage Check Flow

```typescript
async function checkToolAccess(
  userId: string,
  toolKey: string
): Promise<AccessCheckResult> {
  // 1. Get user's effective plan
  const plan = await getEffectivePlan(userId);
  
  // 2. Check feature flag
  const tool = await getTool(toolKey);
  const hasFeature = await checkPlanFeature(plan, tool.requiredFeature);
  
  if (!hasFeature) {
    return {
      allowed: false,
      reason: 'FEATURE_NOT_AVAILABLE',
      upgradeRequired: true,
    };
  }
  
  // 3. Check usage limits
  const limit = await getPlanLimit(plan, tool.usageKey);
  const usage = await getCurrentUsage(userId, tool.usageKey, limit.resetPeriod);
  
  if (usage >= limit.maxValue && !limit.isUnlimited) {
    // 4. Check coin fallback
    const coinCost = await getToolCoinCost(toolKey);
    const coinBalance = await getCoinBalance(userId);
    
    return {
      allowed: false,
      reason: 'USAGE_LIMIT_EXCEEDED',
      canPayWithCoins: coinCost !== null && coinBalance >= coinCost,
      coinCost,
      currentUsage: usage,
      limit: limit.maxValue,
      resetAt: getResetTime(limit.resetPeriod),
    };
  }
  
  return { allowed: true };
}
```

### 7.3 Grace Period Rules

| Scenario | Grace Period | Behavior During Grace |
|----------|--------------|----------------------|
| Payment failed | 3 days | Full access, daily reminder emails |
| Subscription expired | 0 days | Immediate downgrade to Free |
| Trial ending | 3 days notice | Email reminders at -3, -1, 0 days |

> **"Full access during grace" means:**
> - ✅ All plan features remain available
> - ✅ Usage limits continue at paid tier
> - ✅ Coin spending is allowed
> - ✅ New coin purchases are allowed
> - ❌ Plan upgrades blocked until payment resolved
> - ❌ New subscription purchases blocked (must fix existing first)

---

## 8. Refunds & Disputes

### 8.1 Refund Policy

| Product | Refund Window | Conditions |
|---------|---------------|------------|
| Subscription | 7 days | Pro-rated, no questions |
| Coin purchase | 14 days | Unused coins only (see attribution rule) |
| Coin purchase | 0 days | If coins spent, no refund |

> **Invariant: Coin Refund Attribution**  
> Coin refunds are only allowed for coins still attributable to the refunded payment.  
> We use **FIFO spending attribution**: oldest purchased coins are spent first.  
> A refund request must verify that `(original_coins_purchased - coins_spent_since_purchase) >= refund_amount`.

### 8.2 Refund Processing

```typescript
// Subscription refund (handled by Polar)
async function requestSubscriptionRefund(
  subscriptionId: string,
  reason: string
): Promise<void> {
  // Polar handles the actual refund
  await polar.subscriptions.cancel(subscriptionId, {
    immediately: true,
    refund: true,
  });
  
  // Update local record
  await db.update(subscriptions)
    .set({
      canceledAt: new Date(),
      cancelReason: reason,
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// Coin refund (deduct coins, Stripe handles money)
// INVARIANT: Refunds only allowed for coins attributable to the refunded payment (FIFO)
async function processCoinRefund(
  userId: string,
  paymentId: string,
  coinsToRefund: number
): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Get original purchase details
    const purchase = await tx.query.coinTransactions.findFirst({
      where: and(
        eq(coinTransactions.userId, userId),
        eq(coinTransactions.referenceId, paymentId),
        eq(coinTransactions.txnType, 'purchase')
      )
    });
    
    if (!purchase) throw new Error('Purchase not found');
    
    // 2. Calculate coins spent since this purchase (FIFO attribution)
    const spentSincePurchase = await calculateSpentSincePurchase(tx, userId, purchase.createdAt);
    const refundableCoins = purchase.amount - spentSincePurchase;
    
    if (refundableCoins < coinsToRefund) {
      throw new Error(`Cannot refund: only ${refundableCoins} coins attributable to this payment`);
    }
    
    // 2. Deduct coins
    await tx.insert(coinTransactions).values({
      userId,
      amount: -coinsToRefund,
      txnType: 'refund',
      referenceType: 'payment_refund',
      referenceId: paymentId,
      createdAt: new Date(),
    });
    
    // 3. Update wallet cache
    await updateWalletCache(tx, userId);
  });
}
```

### 8.3 Dispute Handling

> **Dispute Policy:**  
> - Coin purchases are frozen (prevents further disputes)
> - Account is flagged for admin review
> - **Usage continues** — we do not revoke access during dispute resolution
> - Rationale: Revoking access escalates disputes; resolution is typically 30-60 days

```typescript
async function handleChargeDispute(
  chargeId: string,
  userId: string
): Promise<void> {
  // 1. Flag account
  await db.update(users)
    .set({ hasDispute: true })
    .where(eq(users.id, userId));
  
  // 2. Freeze coin purchases (prevent further disputes)
  await redis.set(`dispute_freeze:${userId}`, 'true', { ex: 86400 * 30 });
  
  // 3. Notify admin
  await sendAdminAlert({
    type: 'charge_dispute',
    userId,
    chargeId,
    severity: 'high',
  });
  
  // 4. Audit log
  await createAuditLog({
    action: 'dispute_created',
    resource: 'payment',
    resourceId: chargeId,
    userId,
  });
}
```

---

## 9. Edge Cases & Failure Modes

### 9.1 Double-Charge Prevention

| Scenario | Prevention |
|----------|------------|
| User clicks "Pay" twice | Checkout session has unique ID |
| Webhook delivered twice | Idempotency by `event.id` |
| Network retry | Idempotency key in request |

### 9.2 Race Conditions

| Scenario | Solution |
|----------|----------|
| Concurrent coin deductions | Transaction + SELECT FOR UPDATE |
| Subscription + coin purchase | Separate flows, no conflict |
| Usage increment race | Redis atomic INCR |

### 9.3 Failure Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Webhook missed | Reconciliation job | Poll provider API daily |
| Coin balance drift | Reconciliation job | Recalculate from ledger |
| Payment stuck | Monitoring alert | Manual review |

### 9.4 Plan Downgrade Edge Cases

| Scenario | Behavior |
|----------|----------|
| User has 500 images, downgrades to Free (100 limit) | Keep images, block new uploads until under limit |
| User has API keys, downgrades to Free | Revoke API keys |
| User has 1000 coins, cancels subscription | Keep coins (they paid for them) |

---

## 10. Reconciliation

### 10.1 Daily Reconciliation Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `reconcile-wallets` | 02:00 UTC | Verify wallet balance = ledger sum |
| `reconcile-subscriptions` | 03:00 UTC | Sync with Polar subscription status |
| `reconcile-payments` | 04:00 UTC | Verify payment records match Stripe |
| `expire-stale-checkouts` | */15 min | Clean up abandoned checkouts |
> **Reconciliation Safety Rules (prevent provider rate limits):**
> - Batch API calls (max 100 per batch)
> - Rate limit: max 10 requests/second to Polar/Stripe
> - Exponential backoff on 429 responses
> - Skip subscriptions canceled/expired > 90 days ago
> - Alert if job takes > 30 minutes (indicates scale issue)
### 10.2 Wallet Reconciliation

```typescript
// Run daily to detect and fix drift
async function reconcileWallets(): Promise<ReconciliationReport> {
  const report = { checked: 0, drifted: 0, fixed: 0 };
  
  // Get all wallets
  const wallets = await db.query.userCoinWallets.findMany();
  
  for (const wallet of wallets) {
    report.checked++;
    
    // Calculate true balance from ledger
    const ledgerBalance = await db
      .select({ total: sum(coinTransactions.amount) })
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, wallet.userId));
    
    const trueBalance = Number(ledgerBalance[0]?.total ?? 0);
    
    if (wallet.balance !== trueBalance) {
      report.drifted++;
      
      // Fix the drift
      await db.update(userCoinWallets)
        .set({ balance: trueBalance, updatedAt: new Date() })
        .where(eq(userCoinWallets.userId, wallet.userId));
      
      // Alert if significant drift
      if (Math.abs(wallet.balance - trueBalance) > 100) {
        await sendAdminAlert({
          type: 'wallet_drift',
          userId: wallet.userId,
          cached: wallet.balance,
          actual: trueBalance,
          severity: 'medium',
        });
      }
      
      report.fixed++;
    }
  }
  
  return report;
}
```

### 10.3 Subscription Reconciliation

```typescript
async function reconcileSubscriptions(): Promise<void> {
  // Get all active subscriptions from our DB
  const localSubs = await db.query.subscriptions.findMany({
    where: isNull(subscriptions.deletedAt),
  });
  
  for (const local of localSubs) {
    // Fetch from Polar
    const remote = await polar.subscriptions.get(local.polarSubscriptionId);
    
    // Check for discrepancies
    if (remote.status === 'canceled' && !local.canceledAt) {
      // Webhook missed, fix it
      await handleSubscriptionCanceled(db, {
        id: remote.id,
        canceledAt: remote.canceledAt,
      });
    }
    
    // Update period dates if different
    if (remote.currentPeriodEnd !== local.currentPeriodEnd) {
      await db.update(subscriptions)
        .set({ currentPeriodEnd: remote.currentPeriodEnd })
        .where(eq(subscriptions.id, local.id));
    }
  }
}
```

---

## Appendix A: Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INSUFFICIENT_COINS` | 403 | Not enough coins for operation |
| `PLAN_LIMIT_EXCEEDED` | 403 | Usage limit reached |
| `FEATURE_NOT_AVAILABLE` | 403 | Feature requires higher plan |
| `PAYMENT_FAILED` | 402 | Payment could not be processed |
| `SUBSCRIPTION_REQUIRED` | 403 | Operation requires active subscription |
| `CHECKOUT_EXPIRED` | 410 | Checkout session expired |
| `REFUND_NOT_ELIGIBLE` | 400 | Coins already spent |
| `ACCOUNT_FROZEN` | 403 | Account frozen due to dispute |

---

## Appendix B: Monitoring Alerts

| Alert | Threshold | Severity |
|-------|-----------|----------|
| Payment failure rate | > 5% in 1 hour | High |
| Wallet drift detected | Any | Medium |
| Webhook processing delay | > 5 minutes | High |
| Reconciliation job failed | Any failure | Critical |
| Dispute created | Any | High |
| High coin deduction rate | > 1000/min per user | Medium |

---

## Document Cross-References

| Document | Relevant Sections |
|----------|-------------------|
| [01_PRODUCT_REQUIREMENTS](01_PRODUCT_REQUIREMENTS.md) | Plan definitions, monetization |
| [13_DATABASE_SCHEMA](13_DATABASE_SCHEMA.md) | All billing tables |
| [14_API_CONTRACTS](14_API_CONTRACTS.md) | Billing endpoints, webhooks |
| 15_SECURITY_MODEL.md | Payment security |
| 08_STATE_FLOW_DIAGRAMS.md | Visual state machines |

---

*This document defines billing logic for HSAFX WORLD. All money handling must follow these specifications exactly.*
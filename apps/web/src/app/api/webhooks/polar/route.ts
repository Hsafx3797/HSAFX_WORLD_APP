/**
 * Polar Webhook Handler
 *
 * Polar is the AUTHORITY for all billing — subscriptions and coin pack orders.
 *
 * Handles:
 * - subscription.created   → B2C: create sub + grant monthly coins | B2B: create b2bSubscription
 * - subscription.updated   → B2C: update sub + renewal coins | B2B: update b2bSubscription
 * - subscription.canceled  → B2C/B2B: mark cancelAtPeriodEnd
 * - subscription.revoked   → B2C: expire immediately | B2B: cancel immediately
 * - order.paid             → coin pack purchase: grant coins to wallet
 * - checkout.completed     → audit log only (activation driven by subscription.created)
 * - refund.created         → coin clawback for coin pack refunds
 *
 * Idempotency: processedWebhooks table.
 * Signature: Svix standard (webhook-id, webhook-timestamp, webhook-signature headers).
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import {
  db,
  subscriptions,
  plans,
  b2bPlans,
  b2bSubscriptions,
  coinTransactions,
  userCoinWallets,
  coinPacks,
  eq,
  and,
  or,
  sql,
} from '@hsafx/db';
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from '@/server/webhooks/idempotency';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('polar-webhook');

// ─── Svix signature verification ─────────────────────────────

interface PolarEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
}

function verifyPolarSignature(
  body: string,
  headers: Headers,
  secret: string,
): PolarEvent | null {
  try {
    const webhookId = headers.get('webhook-id');
    const webhookTimestamp = headers.get('webhook-timestamp');
    const webhookSignature = headers.get('webhook-signature');

    if (!webhookId || !webhookTimestamp || !webhookSignature) return null;

    const wh = new Webhook(secret);
    const verified = wh.verify(body, {
      'webhook-id': webhookId,
      'webhook-timestamp': webhookTimestamp,
      'webhook-signature': webhookSignature,
    }) as PolarEvent;

    if (!verified.id || !verified.type) return null;
    return verified;
  } catch (err) {
    log.error('Signature verification failed', { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

// ─── Webhook route ────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

  if (!webhookSecret) {
    log.error('POLAR_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const event = verifyPolarSignature(body, request.headers, webhookSecret);
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency via processedWebhooks table
  if (await isWebhookProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.id, event.data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(event.id, event.data);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.id, event.data);
        break;

      case 'subscription.revoked':
        await handleSubscriptionRevoked(event.id, event.data);
        break;

      case 'order.paid':
        await handleOrderPaid(event.id, event.data);
        break;

      case 'checkout.completed':
        await handleCheckoutCompleted(event.id, event.data);
        break;

      case 'refund.created':
        await handleRefundCreated(event.id, event.data);
        break;

      default:
        break;
    }

    await markWebhookProcessed(event.id, 'polar', event.type);
    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    log.error('Webhook processing error', { eventType: event.type, error: String(err) });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// ─── Helpers ─────────────────────────────────────────────────

/** Look up a B2C plan by Polar product ID (checks both monthly and yearly columns). */
async function findB2cPlan(polarProductId: string) {
  const [plan] = await db
    .select()
    .from(plans)
    .where(
      or(
        eq(plans.polarProductIdMonthly, polarProductId),
        eq(plans.polarProductIdYearly, polarProductId),
      ),
    )
    .limit(1);
  return plan ?? null;
}

/** Look up a B2B plan by Polar product ID (checks both monthly and yearly columns). */
async function findB2bPlan(polarProductId: string) {
  const [plan] = await db
    .select()
    .from(b2bPlans)
    .where(
      or(
        eq(b2bPlans.polarProductIdMonthly, polarProductId),
        eq(b2bPlans.polarProductIdYearly, polarProductId),
      ),
    )
    .limit(1);
  return plan ?? null;
}

/** Grant coins to a user wallet within a transaction (or plain DB call). */
async function grantCoins(
  executor: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  amount: number,
  reason: string,
  resourceType: string,
  resourceId: string,
  eventId: string,
  extraMeta?: Record<string, unknown>,
): Promise<void> {
  if (amount <= 0) return;

  const [wallet] = await executor
    .select()
    .from(userCoinWallets)
    .where(eq(userCoinWallets.userId, userId))
    .for('update')
    .limit(1);

  const currentBalance = wallet?.balance ?? 0;
  const newBalance = currentBalance + amount;

  await executor.insert(coinTransactions).values({
    userId,
    amount,
    type: 'grant',
    reason,
    resourceType,
    resourceId,
    balanceAfter: newBalance,
    metadata: { polarEventId: eventId, ...extraMeta },
  });

  if (wallet) {
    await executor
      .update(userCoinWallets)
      .set({
        balance: newBalance,
        lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(userCoinWallets.userId, userId));
  } else {
    await executor.insert(userCoinWallets).values({
      userId,
      balance: newBalance,
      lifetimeEarned: amount,
    });
  }
}

// ─── Event handlers ───────────────────────────────────────────

/**
 * subscription.created
 * Detects B2C vs B2B by product ID, then routes accordingly.
 */
async function handleSubscriptionCreated(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const polarSubscriptionId = data.id as string;
  const polarProductId = data.product_id as string;
  const userId = (data.metadata as Record<string, string>)?.userId;

  if (!userId) {
    log.warn('subscription.created: missing userId in metadata', { polarSubscriptionId });
    return;
  }

  const recurringInterval = (data.recurring_interval as string) ?? 'month';
  const billingCycle = recurringInterval === 'year' ? 'yearly' as const : 'monthly' as const;
  const now = new Date();
  const periodEnd = data.current_period_end
    ? new Date(data.current_period_end as string)
    : new Date(now.getTime() + (recurringInterval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000);

  // Check B2C first
  const b2cPlan = await findB2cPlan(polarProductId);
  if (b2cPlan) {
    await db.transaction(async (tx) => {
      await tx
        .insert(subscriptions)
        .values({
          userId,
          planId: b2cPlan.id,
          status: 'active',
          billingCycle,
          polarSubscriptionId,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            planId: b2cPlan.id,
            status: 'active',
            polarSubscriptionId,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            updatedAt: now,
          },
        });

      await grantCoins(
        tx,
        userId,
        b2cPlan.coinGrant ?? 0,
        `Monthly coin grant — ${b2cPlan.name} plan`,
        'subscription',
        polarSubscriptionId,
        eventId,
        { planId: b2cPlan.id },
      );
    });
    return;
  }

  // Check B2B
  const b2bPlan = await findB2bPlan(polarProductId);
  if (b2bPlan) {
    await db
      .insert(b2bSubscriptions)
      .values({
        userId,
        b2bPlanId: b2bPlan.id,
        polarSubscriptionId,
        status: 'active',
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        resetDayOfMonth: now.getDate() <= 28 ? now.getDate() : 1,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: b2bSubscriptions.polarSubscriptionId,
        set: {
          status: 'active',
          billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          updatedAt: now,
        },
      });
    return;
  }

  log.warn('subscription.created: no matching plan for product', { polarProductId });
}

/**
 * subscription.updated
 * Routes to B2C or B2B handler; grants renewal coins for B2C.
 */
async function handleSubscriptionUpdated(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const polarSubscriptionId = data.id as string;
  const polarProductId = data.product_id as string;
  const userId = (data.metadata as Record<string, string>)?.userId;

  if (!userId) {
    log.warn('subscription.updated: missing userId', { polarSubscriptionId });
    return;
  }

  const now = new Date();
  const currentPeriodStart = data.current_period_start
    ? new Date(data.current_period_start as string)
    : now;
  const currentPeriodEnd = data.current_period_end
    ? new Date(data.current_period_end as string)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const b2cPlan = await findB2cPlan(polarProductId);
  if (b2cPlan) {
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.polarSubscriptionId, polarSubscriptionId),
        ),
      )
      .limit(1);

    const isRenewal =
      existingSub?.currentPeriodStart &&
      currentPeriodStart.getTime() > existingSub.currentPeriodStart.getTime();

    await db.transaction(async (tx) => {
      await tx
        .update(subscriptions)
        .set({
          planId: b2cPlan.id,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          updatedAt: now,
        })
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.polarSubscriptionId, polarSubscriptionId),
          ),
        );

      if (isRenewal) {
        await grantCoins(
          tx,
          userId,
          b2cPlan.coinGrant ?? 0,
          `Renewal coin grant — ${b2cPlan.name} plan`,
          'subscription',
          polarSubscriptionId,
          eventId,
          { planId: b2cPlan.id, renewal: true },
        );
      }
    });
    return;
  }

  const b2bPlan = await findB2bPlan(polarProductId);
  if (b2bPlan) {
    await db
      .update(b2bSubscriptions)
      .set({
        b2bPlanId: b2bPlan.id,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      })
      .where(
        and(
          eq(b2bSubscriptions.userId, userId),
          eq(b2bSubscriptions.polarSubscriptionId, polarSubscriptionId),
        ),
      );
  }
}

/**
 * subscription.canceled
 * Mark cancelAtPeriodEnd for B2C or B2B — stays active until period ends.
 */
async function handleSubscriptionCanceled(
  _eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const polarSubscriptionId = data.id as string;
  const userId = (data.metadata as Record<string, string>)?.userId;

  if (!userId) {
    log.warn('subscription.canceled: missing userId', { polarSubscriptionId });
    return;
  }

  const now = new Date();

  // Try B2C first
  const [b2cSub] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.polarSubscriptionId, polarSubscriptionId),
      ),
    )
    .limit(1);

  if (b2cSub) {
    await db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: true, canceledAt: now, updatedAt: now })
      .where(eq(subscriptions.id, b2cSub.id));
    return;
  }

  // Try B2B
  await db
    .update(b2bSubscriptions)
    .set({ cancelAtPeriodEnd: true, canceledAt: now, updatedAt: now })
    .where(
      and(
        eq(b2bSubscriptions.userId, userId),
        eq(b2bSubscriptions.polarSubscriptionId, polarSubscriptionId),
      ),
    );
}

/**
 * subscription.revoked
 * Immediate deactivation — Polar has already terminated the subscription.
 */
async function handleSubscriptionRevoked(
  _eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const polarSubscriptionId = data.id as string;
  const userId = (data.metadata as Record<string, string>)?.userId;

  if (!userId) {
    log.warn('subscription.revoked: missing userId', { polarSubscriptionId });
    return;
  }

  const now = new Date();

  // Deactivate B2C subscription
  await db
    .update(subscriptions)
    .set({ status: 'past_due', canceledAt: now, updatedAt: now })
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.polarSubscriptionId, polarSubscriptionId),
      ),
    );

  // Deactivate B2B subscription
  await db
    .update(b2bSubscriptions)
    .set({ status: 'canceled', canceledAt: now, updatedAt: now })
    .where(
      and(
        eq(b2bSubscriptions.userId, userId),
        eq(b2bSubscriptions.polarSubscriptionId, polarSubscriptionId),
      ),
    );
}

/**
 * order.paid
 * One-time coin pack purchase — grant coins to user wallet.
 */
async function handleOrderPaid(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const orderId = data.id as string;
  const polarProductId = data.product_id as string;
  const userId = (data.metadata as Record<string, string>)?.userId;

  if (!userId) {
    log.warn('order.paid: missing userId in metadata', { orderId });
    return;
  }

  // Look up coin pack by Polar product ID
  const [pack] = await db
    .select()
    .from(coinPacks)
    .where(eq(coinPacks.polarProductId, polarProductId))
    .limit(1);

  if (!pack) {
    // Not a coin pack order — may be a subscription order, already handled
    log.info('order.paid: no matching coin pack for product', { polarProductId, orderId });
    return;
  }

  const totalCoins = pack.coins + pack.bonusCoins;

  await db.transaction(async (tx) => {
    await grantCoins(
      tx,
      userId,
      totalCoins,
      `Coin pack purchase — ${pack.name}`,
      'coin_pack',
      orderId,
      eventId,
      { packId: pack.id, coins: pack.coins, bonusCoins: pack.bonusCoins },
    );
  });
}

/**
 * checkout.completed
 * Audit log — subscription activation is driven by subscription.created.
 */
async function handleCheckoutCompleted(
  _eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const userId = (data.metadata as Record<string, string>)?.userId;
  const totalAmount = data.total_amount as number | undefined;
  const currency = data.currency as string | undefined;
  log.info('checkout.completed', { userId: userId ?? 'unknown', totalAmount, currency });
}

/**
 * refund.created
 * Clawback coins for coin pack refunds.
 */
async function handleRefundCreated(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const orderId = (data.order as Record<string, unknown>)?.id as string | undefined;
  const polarProductId = (data.order as Record<string, unknown>)?.product_id as string | undefined;
  const userId = (data.metadata as Record<string, string>)?.userId;

  if (!userId || !orderId || !polarProductId) {
    log.warn('refund.created: missing required fields', { orderId, polarProductId, userId });
    return;
  }

  // Only clawback if this was a coin pack order
  const [pack] = await db
    .select()
    .from(coinPacks)
    .where(eq(coinPacks.polarProductId, polarProductId))
    .limit(1);

  if (!pack) {
    log.info('refund.created: not a coin pack — no clawback needed', { orderId });
    return;
  }

  const totalCoins = pack.coins + pack.bonusCoins;

  await db.transaction(async (tx) => {
    const [wallet] = await tx
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, userId))
      .for('update')
      .limit(1);

    const currentBalance = wallet?.balance ?? 0;
    const deduction = Math.min(totalCoins, currentBalance); // never go below 0
    const newBalance = currentBalance - deduction;

    await tx.insert(coinTransactions).values({
      userId,
      amount: -deduction,
      type: 'refund',
      reason: `Refund clawback — ${pack.name}`,
      resourceType: 'coin_pack',
      resourceId: orderId,
      balanceAfter: newBalance,
      metadata: { polarEventId: eventId, packId: pack.id, orderId },
    });

    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({
          balance: newBalance,
          lifetimeSpent: sql`${userCoinWallets.lifetimeSpent} + ${deduction}`,
          updatedAt: new Date(),
        })
        .where(eq(userCoinWallets.userId, userId));
    }
  });
}

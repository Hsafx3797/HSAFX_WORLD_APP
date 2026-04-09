/**
 * Stripe Webhook Handler
 * Reference: SOLUTION_ROADMAP Task 4.7, 21_BILLING_LOGIC.md
 *
 * B2C (coin packs):
 * - checkout.session.completed → credit coin pack purchase
 * - charge.refunded → refund coins
 * - charge.dispute.created → flag account
 *
 * B2B (API subscriptions):
 * - customer.subscription.created → create/activate b2bSubscription
 * - customer.subscription.updated → update plan/status/period
 * - customer.subscription.deleted → cancel b2bSubscription
 * - invoice.payment_succeeded → log + renew B2B period if applicable
 * - invoice.payment_failed → mark past_due + alert
 *
 * Idempotency: uses processedWebhooks table (C-11).
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  db,
  coinTransactions,
  userCoinWallets,
  payments,
  coinPacks,
  notifications,
  activityLogs,
  b2bSubscriptions,
  b2bPlans,
  eq,
  and,
  sql,
} from '@hsafx/db';
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from '@/server/webhooks/idempotency';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('stripe-webhook');

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return _stripe;
}

// ─── Stripe signature verification ───────────────────────────

function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string,
): Stripe.Event | null {
  try {
    return getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    log.error('Signature verification failed', { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

// ─── Webhook route ────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const event = verifyStripeSignature(body, signature, webhookSecret);
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const eventId = event.id;
  const eventType = event.type;
  const data = event.data.object as unknown as Record<string, unknown>;

  // Idempotency check via processedWebhooks table
  if (await isWebhookProcessed(eventId)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (eventType) {
      // ── B2C: Coin Packs ────────────────────────────────
      case 'checkout.session.completed':
        await handleCheckoutCompleted(eventId, data);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(eventId, data);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(eventId, data);
        break;

      // ── B2B: API Subscriptions ─────────────────────────
      case 'customer.subscription.created':
        await handleB2bSubscriptionCreated(eventId, data);
        break;

      case 'customer.subscription.updated':
        await handleB2bSubscriptionUpdated(eventId, data);
        break;

      case 'customer.subscription.deleted':
        await handleB2bSubscriptionDeleted(eventId, data);
        break;

      // ── Shared: Invoices ───────────────────────────────
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(eventId, data);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(eventId, data);
        break;

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    // Mark event as processed
    await markWebhookProcessed(eventId, 'stripe', eventType);

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    log.error('Webhook processing error', { eventType, error: String(err) });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}

// ─── Event handlers ───────────────────────────────────────────

/**
 * Coin pack purchase completed via Stripe Checkout.
 * Credits coins to user wallet.
 */
async function handleCheckoutCompleted(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const metadata = data.metadata as Record<string, string> | undefined;
  const userId = metadata?.userId;
  const packId = metadata?.coinPackId;
  const paymentIntentId = data.payment_intent as string | undefined;

  if (!userId || !packId) {
    log.warn('Checkout missing metadata', { sessionId: data.id as string });
    return;
  }

  // Look up coin pack
  const [pack] = await db
    .select()
    .from(coinPacks)
    .where(eq(coinPacks.id, packId))
    .limit(1);

  if (!pack) {
    log.warn('Coin pack not found', { packId });
    return;
  }

  const totalCoins = pack.coins + pack.bonusCoins;

  // Credit coins atomically
  await db.transaction(async (tx) => {
    const [wallet] = await tx
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, userId))
      .for('update')
      .limit(1);

    const currentBalance = wallet?.balance ?? 0;
    const newBalance = currentBalance + totalCoins;

    // Insert payment record so refunds can find it
    await tx.insert(payments).values({
      userId,
      amountCents: (data.amount_total as number) ?? 0,
      currency: (data.currency as string) ?? 'usd',
      status: 'succeeded',
      paymentMethod: 'card',
      stripePaymentIntentId: paymentIntentId ?? null,
      metadata: { stripeEventId: eventId, packId, sessionId: data.id },
    });

    await tx.insert(coinTransactions).values({
      userId,
      amount: totalCoins,
      type: 'purchase',
      reason: `Coin pack purchase: ${pack.name} (${pack.coins} + ${pack.bonusCoins} bonus)`,
      resourceType: 'coin_pack',
      resourceId: packId,
      balanceAfter: newBalance,
      metadata: { stripeEventId: eventId, packId, sessionId: data.id, paymentIntentId },
    });

    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({
          balance: newBalance,
          lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${totalCoins}`,
          updatedAt: new Date(),
        })
        .where(eq(userCoinWallets.userId, userId));
    } else {
      await tx.insert(userCoinWallets).values({
        userId,
        balance: newBalance,
        lifetimeEarned: totalCoins,
      });
    }
  });
}

/**
 * Charge refunded — claw back coins proportionally.
 * Handles both full and partial refunds. Uses FOR UPDATE to prevent race conditions.
 */
async function handleChargeRefunded(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const paymentIntentId = data.payment_intent as string | undefined;
  if (!paymentIntentId) return;

  const chargeAmount = data.amount as number; // total charge in cents
  const amountRefunded = data.amount_refunded as number; // cumulative refunded in cents

  // Find the original payment
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, paymentIntentId))
    .limit(1);

  if (!payment) return;

  const userId = payment.userId;

  // Find the original coin grant for this payment
  const [originalGrant] = await db
    .select()
    .from(coinTransactions)
    .where(
      and(
        eq(coinTransactions.userId, userId),
        eq(coinTransactions.type, 'purchase'),
        sql`${coinTransactions.metadata}->>'paymentIntentId' = ${paymentIntentId}`,
      ),
    )
    .limit(1);

  if (!originalGrant) {
    log.warn('No coin grant found for refund', { paymentIntentId });
    await db
      .update(payments)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(payments.id, payment.id));
    return;
  }

  // Calculate proportional coin clawback
  const totalCoinsGranted = originalGrant.amount;
  const refundProportion = chargeAmount > 0 ? amountRefunded / chargeAmount : 1;
  const totalCoinsToClawBack = Math.round(totalCoinsGranted * refundProportion);

  // Check how many coins have already been clawed back for this payment (partial refund idempotency)
  const [existing] = await db
    .select({ total: sql<number>`COALESCE(SUM(ABS(${coinTransactions.amount})), 0)` })
    .from(coinTransactions)
    .where(
      and(
        eq(coinTransactions.userId, userId),
        eq(coinTransactions.type, 'refund'),
        sql`${coinTransactions.metadata}->>'paymentIntentId' = ${paymentIntentId}`,
      ),
    );

  const alreadyClawedBack = existing?.total ?? 0;
  const coinsToDeduct = totalCoinsToClawBack - alreadyClawedBack;

  if (coinsToDeduct <= 0) {
    await db
      .update(payments)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(payments.id, payment.id));
    return;
  }

  // Deduct coins atomically with row-level lock
  await db.transaction(async (tx) => {
    const [wallet] = await tx
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, userId))
      .for('update')
      .limit(1);

    const currentBalance = wallet?.balance ?? 0;
    // Don't go below 0 — user may have spent some coins already
    const actualDeduction = Math.min(coinsToDeduct, currentBalance);
    const newBalance = currentBalance - actualDeduction;

    await tx.insert(coinTransactions).values({
      userId,
      amount: -actualDeduction,
      type: 'refund',
      reason: `Stripe refund clawback (${amountRefunded}/${chargeAmount} cents refunded)`,
      resourceType: 'coin_pack',
      resourceId: originalGrant.resourceId,
      balanceAfter: newBalance,
      metadata: {
        stripeEventId: eventId,
        paymentIntentId,
        originalTransactionId: originalGrant.id,
      },
    });

    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(userCoinWallets.userId, userId));
    }
  });

  // Update payment status
  await db
    .update(payments)
    .set({ status: 'refunded', updatedAt: new Date() })
    .where(eq(payments.id, payment.id));
}

/**
 * Dispute created — freeze coins and flag the account.
 * Per 24_ERROR_HANDLING.md: freeze wallet until resolved.
 */
async function handleDisputeCreated(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const paymentIntentId = data.payment_intent as string | undefined;

  // Find user from the payment
  const [payment] = paymentIntentId
    ? await db
        .select()
        .from(payments)
        .where(eq(payments.stripePaymentIntentId, paymentIntentId))
        .limit(1)
    : [];

  const userId = payment?.userId;

  log.error('Dispute created', {
    paymentIntentId,
    userId: userId ?? 'unknown',
    eventId,
  });

  if (userId) {
    // Log activity for admin visibility
    await db.insert(activityLogs).values({
      userId,
      action: 'dispute_created',
      resource: 'payment',
      resourceId: paymentIntentId ?? null,
      metadata: { stripeEventId: eventId, reason: (data.reason as string) ?? 'unknown' },
    });

    // Notify admin via notification system
    await db.insert(notifications).values({
      userId,
      type: 'system',
      title: 'Payment Dispute Filed',
      message: `A payment dispute has been filed. Your account is under review.`,
      metadata: { stripeEventId: eventId, paymentIntentId },
    });

    // Freeze wallet to prevent coin spending during dispute
    await db
      .update(userCoinWallets)
      .set({ disputeFrozen: true, updatedAt: new Date() })
      .where(eq(userCoinWallets.userId, userId));
  }
}

/**
 * Invoice payment succeeded — log payment record for coin packs.
 * (Subscription payments are handled by Polar webhook.)
 */
async function handleInvoicePaymentSucceeded(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const stripeInvoiceId = data.id as string;
  const amountPaid = data.amount_paid as number | undefined;
  const customerEmail = data.customer_email as string | undefined;

  log.info('Invoice paid', { stripeInvoiceId, amountPaid, customerEmail });
}

/**
 * Invoice payment failed — log warning and create notification.
 */
async function handleInvoicePaymentFailed(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const stripeInvoiceId = data.id as string;
  const customerEmail = data.customer_email as string | undefined;
  const subscriptionId = data.subscription as string | undefined;

  log.warn('Invoice payment failed', { stripeInvoiceId, customerEmail });

  // B2B: mark subscription as past_due if linked
  if (subscriptionId) {
    const [sub] = await db
      .select()
      .from(b2bSubscriptions)
      .where(eq(b2bSubscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1);

    if (sub) {
      await db
        .update(b2bSubscriptions)
        .set({ status: 'past_due', updatedAt: new Date() })
        .where(eq(b2bSubscriptions.id, sub.id));

      await db.insert(notifications).values({
        userId: sub.userId,
        type: 'billing',
        title: 'API Subscription Payment Failed',
        message: 'Your API subscription payment failed. Please update your payment method to avoid service interruption.',
        metadata: { stripeEventId: eventId, invoiceId: stripeInvoiceId },
      });

      log.warn('B2B subscription marked past_due', { subscriptionId, userId: sub.userId });
      return;
    }
  }

  // B2C fallback: notify user from payment record
  const paymentIntentId = data.payment_intent as string | undefined;
  if (paymentIntentId) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntentId))
      .limit(1);

    if (payment) {
      await db.insert(notifications).values({
        userId: payment.userId,
        type: 'billing',
        title: 'Payment Failed',
        message: 'Your recent payment could not be processed. Please update your payment method.',
        metadata: { stripeEventId: eventId, invoiceId: stripeInvoiceId },
      });
    }
  }
}

// ─── B2B Subscription Handlers ────────────────────────────────

/**
 * Resolve a B2B plan from a Stripe Price ID.
 * The b2bPlans table stores stripe_price_id_monthly and stripe_price_id_yearly.
 */
async function resolveB2bPlanFromPrice(stripePriceId: string): Promise<{
  plan: typeof b2bPlans.$inferSelect;
  billingCycle: 'monthly' | 'yearly';
} | null> {
  // Try monthly first
  const [monthly] = await db
    .select()
    .from(b2bPlans)
    .where(eq(b2bPlans.stripePriceIdMonthly, stripePriceId))
    .limit(1);

  if (monthly) return { plan: monthly, billingCycle: 'monthly' };

  // Try yearly
  const [yearly] = await db
    .select()
    .from(b2bPlans)
    .where(eq(b2bPlans.stripePriceIdYearly, stripePriceId))
    .limit(1);

  if (yearly) return { plan: yearly, billingCycle: 'yearly' };

  return null;
}

/**
 * B2B subscription created in Stripe.
 * Creates or activates a b2bSubscription record.
 *
 * Expects metadata.userId on the Stripe subscription to map to our user.
 * This is set when the subscription is created from our checkout flow.
 */
async function handleB2bSubscriptionCreated(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const stripeSub = data as Record<string, unknown>;
  const stripeSubId = stripeSub.id as string;
  const stripeCustomerId = stripeSub.customer as string;
  const metadata = stripeSub.metadata as Record<string, string> | undefined;
  const userId = metadata?.userId;

  if (!userId) {
    log.warn('B2B subscription.created missing userId in metadata', { stripeSubId });
    return;
  }

  // Extract price ID from first item
  const items = stripeSub.items as { data?: Array<{ price?: { id?: string } }> } | undefined;
  const stripePriceId = items?.data?.[0]?.price?.id;
  if (!stripePriceId) {
    log.warn('B2B subscription.created missing price ID', { stripeSubId });
    return;
  }

  const resolved = await resolveB2bPlanFromPrice(stripePriceId);
  if (!resolved) {
    log.warn('B2B subscription.created: no matching plan for price', { stripePriceId, stripeSubId });
    return;
  }

  const periodStart = new Date((stripeSub.current_period_start as number) * 1000);
  const periodEnd = new Date((stripeSub.current_period_end as number) * 1000);

  // Check if this subscription already exists (idempotency)
  const [existing] = await db
    .select()
    .from(b2bSubscriptions)
    .where(eq(b2bSubscriptions.stripeSubscriptionId, stripeSubId))
    .limit(1);

  if (existing) {
    log.info('B2B subscription already exists', { stripeSubId, existingId: existing.id });
    return;
  }

  // Cancel any existing active subscription for this user
  await db
    .update(b2bSubscriptions)
    .set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(b2bSubscriptions.userId, userId),
      eq(b2bSubscriptions.status, 'active'),
    ));

  // Create new subscription
  await db.insert(b2bSubscriptions).values({
    userId,
    b2bPlanId: resolved.plan.id,
    stripeSubscriptionId: stripeSubId,
    stripeCustomerId,
    status: 'active',
    billingCycle: resolved.billingCycle,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    resetDayOfMonth: periodStart.getUTCDate(),
    metadata: { stripeEventId: eventId, stripePriceId },
  });

  log.info('B2B subscription created', {
    userId,
    planSlug: resolved.plan.slug,
    billingCycle: resolved.billingCycle,
    stripeSubId,
  });
}

/**
 * B2B subscription updated in Stripe.
 * Handles plan changes, period renewals, and status transitions.
 */
async function handleB2bSubscriptionUpdated(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const stripeSub = data as Record<string, unknown>;
  const stripeSubId = stripeSub.id as string;
  const stripeStatus = stripeSub.status as string;

  // Find our subscription
  const [sub] = await db
    .select()
    .from(b2bSubscriptions)
    .where(eq(b2bSubscriptions.stripeSubscriptionId, stripeSubId))
    .limit(1);

  if (!sub) {
    log.warn('B2B subscription.updated: no matching subscription', { stripeSubId });
    return;
  }

  // Map Stripe status to our status
  const statusMap: Record<string, 'active' | 'past_due' | 'canceled' | 'suspended'> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'suspended',
    incomplete: 'suspended',
    incomplete_expired: 'canceled',
    trialing: 'active',
    paused: 'suspended',
  };
  const newStatus = statusMap[stripeStatus] ?? 'suspended';

  // Check for plan change
  const items = stripeSub.items as { data?: Array<{ price?: { id?: string } }> } | undefined;
  const stripePriceId = items?.data?.[0]?.price?.id;

  const updates: Partial<typeof b2bSubscriptions.$inferInsert> = {
    status: newStatus,
    cancelAtPeriodEnd: (stripeSub.cancel_at_period_end as boolean) ?? false,
    currentPeriodStart: new Date((stripeSub.current_period_start as number) * 1000),
    currentPeriodEnd: new Date((stripeSub.current_period_end as number) * 1000),
    updatedAt: new Date(),
  };

  if (stripePriceId) {
    const resolved = await resolveB2bPlanFromPrice(stripePriceId);
    if (resolved && resolved.plan.id !== sub.b2bPlanId) {
      updates.b2bPlanId = resolved.plan.id;
      updates.billingCycle = resolved.billingCycle;
      log.info('B2B subscription plan changed', {
        stripeSubId,
        oldPlanId: sub.b2bPlanId,
        newPlanId: resolved.plan.id,
      });
    }
  }

  if (stripeStatus === 'canceled') {
    updates.canceledAt = new Date();
  }

  await db
    .update(b2bSubscriptions)
    .set(updates)
    .where(eq(b2bSubscriptions.id, sub.id));

  log.info('B2B subscription updated', { stripeSubId, newStatus, userId: sub.userId });
}

/**
 * B2B subscription deleted in Stripe.
 * Mark as canceled in our system.
 */
async function handleB2bSubscriptionDeleted(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const stripeSub = data as Record<string, unknown>;
  const stripeSubId = stripeSub.id as string;

  const [sub] = await db
    .select()
    .from(b2bSubscriptions)
    .where(eq(b2bSubscriptions.stripeSubscriptionId, stripeSubId))
    .limit(1);

  if (!sub) {
    log.warn('B2B subscription.deleted: no matching subscription', { stripeSubId });
    return;
  }

  await db
    .update(b2bSubscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(b2bSubscriptions.id, sub.id));

  await db.insert(notifications).values({
    userId: sub.userId,
    type: 'billing',
    title: 'API Subscription Canceled',
    message: 'Your API subscription has been canceled. Your access will continue until the end of the current billing period.',
    metadata: { stripeEventId: eventId, stripeSubscriptionId: stripeSubId },
  });

  log.info('B2B subscription canceled', { stripeSubId, userId: sub.userId });
}

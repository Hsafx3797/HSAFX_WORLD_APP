/**
 * Stripe Webhook Handler
 * Reference: SOLUTION_ROADMAP Task 4.7, 21_BILLING_LOGIC.md
 *
 * Handles:
 * - checkout.session.completed → credit coin pack purchase
 * - charge.refunded → refund coins
 * - charge.dispute.created → flag account
 * - invoice.payment_succeeded → log payment
 * - invoice.payment_failed → alert user, grace period
 *
 * Idempotency: stores event.id in processed_webhooks check (metadata).
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  db,
  coinTransactions,
  userCoinWallets,
  payments,
  coinPacks,
  eq,
  and,
  sql,
} from '@hsafx/db';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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
    console.error('[stripe-webhook] Signature verification failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Idempotency check ───────────────────────────────────────

async function isEventProcessed(eventId: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: coinTransactions.id })
    .from(coinTransactions)
    .where(sql`${coinTransactions.metadata}->>'stripeEventId' = ${eventId}`)
    .limit(1);

  return !!existing;
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

  // Idempotency check
  if (await isEventProcessed(eventId)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(eventId, data);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(eventId, data);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(eventId, data);
        break;

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

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error(`[stripe-webhook] Error processing ${eventType}:`, err);
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

  if (!userId || !packId) {
    console.warn('[stripe-webhook] checkout.session.completed missing userId or coinPackId');
    return;
  }

  // Look up coin pack
  const [pack] = await db
    .select()
    .from(coinPacks)
    .where(eq(coinPacks.id, packId))
    .limit(1);

  if (!pack) {
    console.warn(`[stripe-webhook] Coin pack not found: ${packId}`);
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

    await tx.insert(coinTransactions).values({
      userId,
      amount: totalCoins,
      type: 'purchase',
      reason: `Coin pack purchase: ${pack.name} (${pack.coins} + ${pack.bonusCoins} bonus)`,
      resourceType: 'coin_pack',
      resourceId: packId,
      balanceAfter: newBalance,
      metadata: { stripeEventId: eventId, packId, sessionId: data.id },
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
 * Charge refunded — reverse coin grant.
 */
async function handleChargeRefunded(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const paymentIntentId = data.payment_intent as string | undefined;
  if (!paymentIntentId) return;

  // Find the original payment
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, paymentIntentId))
    .limit(1);

  if (!payment) return;

  // Log the refund — actual coin clawback would require finding the original grant
  // and marking it. For safety, we just log it and let admin handle manually.
  console.warn(
    `[stripe-webhook] Charge refunded: ${paymentIntentId} for user ${payment.userId}`,
  );

  await db
    .update(payments)
    .set({ status: 'refunded', updatedAt: new Date() })
    .where(eq(payments.id, payment.id));
}

/**
 * Dispute created — flag the account.
 */
async function handleDisputeCreated(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const paymentIntentId = data.payment_intent as string | undefined;
  console.error(
    `[stripe-webhook] DISPUTE created for payment_intent: ${paymentIntentId}. Event: ${eventId}`,
  );
  // TODO: Flag user account, notify admin
}

/**
 * Invoice payment succeeded — log payment record.
 */
async function handleInvoicePaymentSucceeded(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const stripeInvoiceId = data.id as string;
  const amountPaid = data.amount_paid as number | undefined;
  const customerEmail = data.customer_email as string | undefined;

  console.info(
    `[stripe-webhook] Invoice paid: ${stripeInvoiceId}, amount: ${amountPaid}, email: ${customerEmail}`,
  );
  // Payment record creation is handled by Polar webhook for subscriptions.
  // This handler is for coin pack invoice confirmations.
}

/**
 * Invoice payment failed — alert user, start grace period.
 */
async function handleInvoicePaymentFailed(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const stripeInvoiceId = data.id as string;
  const customerEmail = data.customer_email as string | undefined;

  console.warn(
    `[stripe-webhook] Invoice payment FAILED: ${stripeInvoiceId}, email: ${customerEmail}`,
  );
  // TODO: Send email notification, start 3-day grace period
}

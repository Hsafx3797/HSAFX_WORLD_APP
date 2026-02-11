/**
 * Polar Webhook Handler
 * Reference: SOLUTION_ROADMAP Task 4.7, 21_BILLING_LOGIC.md
 *
 * Polar is the AUTHORITY for subscriptions.
 * Stripe subscription events are IGNORED — Polar manages billing cycles.
 *
 * Handles:
 * - subscription.created → create/activate subscription, grant monthly coins
 * - subscription.updated → handle plan changes (upgrade/downgrade)
 * - subscription.canceled → mark cancellation date, no immediate revoke
 * - checkout.completed → log subscription purchase
 *
 * Idempotency: event.id stored in metadata to prevent double processing.
 * Signature: Svix webhook standard via webhook-id, webhook-timestamp, webhook-signature headers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import {
  db,
  subscriptions,
  plans,
  coinTransactions,
  userCoinWallets,
  eq,
  and,
  sql,
} from '@hsafx/db';

// ─── Svix signature verification ────────────────────────────

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
    console.error('[polar-webhook] Signature verification failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Idempotency check ───────────────────────────────────────

async function isEventProcessed(eventId: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: coinTransactions.id })
    .from(coinTransactions)
    .where(sql`${coinTransactions.metadata}->>'polarEventId' = ${eventId}`)
    .limit(1);

  return !!existing;
}

// ─── Webhook route ────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[polar-webhook] POLAR_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const event = verifyPolarSignature(body, request.headers, webhookSecret);
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency
  if (await isEventProcessed(event.id)) {
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

      case 'checkout.completed':
        await handleCheckoutCompleted(event.id, event.data);
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error(`[polar-webhook] Error processing ${event.type}:`, err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}

// ─── Event handlers ───────────────────────────────────────────

/**
 * New subscription created.
 * 1. Look up plan by Polar product ID
 * 2. Create/update subscription record
 * 3. Grant monthly coins
 */
async function handleSubscriptionCreated(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const polarSubscriptionId = data.id as string;
  const polarProductId = data.product_id as string;
  const customerEmail = (data.customer as Record<string, unknown>)?.email as string | undefined;
  const userId = (data.metadata as Record<string, string>)?.userId;

  if (!userId) {
    console.warn('[polar-webhook] subscription.created missing userId in metadata');
    return;
  }

  // Find matching plan by Polar product ID
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.polarProductId, polarProductId))
    .limit(1);

  if (!plan) {
    console.warn(`[polar-webhook] No plan found for polar product: ${polarProductId}`);
    return;
  }

  // Fetch monthly coin grant from plan
  const monthlyCoins = plan.coinGrant ?? 0;

  // Create subscription + grant coins in transaction
  await db.transaction(async (tx) => {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

    // Upsert subscription
    await tx
      .insert(subscriptions)
      .values({
        userId,
        planId: plan.id,
        status: 'active',
        billingCycle: 'monthly',
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
          planId: plan.id,
          status: 'active',
          polarSubscriptionId,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          updatedAt: now,
        },
      });

    if (monthlyCoins > 0) {
      // Lock wallet
      const [wallet] = await tx
        .select()
        .from(userCoinWallets)
        .where(eq(userCoinWallets.userId, userId))
        .for('update')
        .limit(1);

      const currentBalance = wallet?.balance ?? 0;
      const newBalance = currentBalance + monthlyCoins;

      // Record coin grant
      await tx.insert(coinTransactions).values({
        userId,
        amount: monthlyCoins,
        type: 'grant',
        reason: `Monthly coin grant — ${plan.name} plan`,
        resourceType: 'subscription',
        resourceId: polarSubscriptionId,
        balanceAfter: newBalance,
        metadata: { polarEventId: eventId, planId: plan.id },
      });

      // Update or create wallet
      if (wallet) {
        await tx
          .update(userCoinWallets)
          .set({
            balance: newBalance,
            lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${monthlyCoins}`,
            updatedAt: now,
          })
          .where(eq(userCoinWallets.userId, userId));
      } else {
        await tx.insert(userCoinWallets).values({
          userId,
          balance: newBalance,
          lifetimeEarned: monthlyCoins,
        });
      }
    }
  });
}

/**
 * Subscription updated (e.g., plan change, renewal).
 * Handle upgrade/downgrade: adjust plan, optionally grant prorated coins.
 */
async function handleSubscriptionUpdated(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const polarSubscriptionId = data.id as string;
  const polarProductId = data.product_id as string;
  const userId = (data.metadata as Record<string, string>)?.userId;

  if (!userId) {
    console.warn('[polar-webhook] subscription.updated missing userId');
    return;
  }

  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.polarProductId, polarProductId))
    .limit(1);

  if (!plan) return;

  // Check if this is a renewal (new period)
  const currentPeriodStart = data.current_period_start
    ? new Date(data.current_period_start as string)
    : new Date();
  const currentPeriodEnd = data.current_period_end
    ? new Date(data.current_period_end as string)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Get existing subscription to detect renewal
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
    existingSub &&
    existingSub.currentPeriodStart &&
    currentPeriodStart.getTime() > existingSub.currentPeriodStart.getTime();

  await db.transaction(async (tx) => {
    // Update subscription record
    await tx
      .update(subscriptions)
      .set({
        planId: plan.id,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.polarSubscriptionId, polarSubscriptionId),
        ),
      );

    // Grant monthly coins on renewal
    if (isRenewal) {
      const monthlyCoins = plan.coinGrant ?? 0;

      if (monthlyCoins > 0) {
        const [wallet] = await tx
          .select()
          .from(userCoinWallets)
          .where(eq(userCoinWallets.userId, userId))
          .for('update')
          .limit(1);

        const currentBalance = wallet?.balance ?? 0;
        const newBalance = currentBalance + monthlyCoins;

        await tx.insert(coinTransactions).values({
          userId,
          amount: monthlyCoins,
          type: 'grant',
          reason: `Renewal coin grant — ${plan.name} plan`,
          resourceType: 'subscription',
          resourceId: polarSubscriptionId,
          balanceAfter: newBalance,
          metadata: { polarEventId: eventId, planId: plan.id, renewal: true },
        });

        if (wallet) {
          await tx
            .update(userCoinWallets)
            .set({
              balance: newBalance,
              lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${monthlyCoins}`,
              updatedAt: new Date(),
            })
            .where(eq(userCoinWallets.userId, userId));
        } else {
          await tx.insert(userCoinWallets).values({
            userId,
            balance: newBalance,
            lifetimeEarned: monthlyCoins,
          });
        }
      }
    }
  });
}

/**
 * Subscription canceled.
 * Mark cancelAtPeriodEnd — active until current period ends.
 */
async function handleSubscriptionCanceled(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const polarSubscriptionId = data.id as string;
  const userId = (data.metadata as Record<string, string>)?.userId;

  if (!userId) {
    console.warn('[polar-webhook] subscription.canceled missing userId');
    return;
  }

  await db
    .update(subscriptions)
    .set({
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.polarSubscriptionId, polarSubscriptionId),
      ),
    );
}

/**
 * Checkout completed (initial subscription purchase).
 * This fires alongside subscription.created — log it for audit trail.
 */
async function handleCheckoutCompleted(
  eventId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const userId = (data.metadata as Record<string, string>)?.userId;
  const totalAmount = data.total_amount as number | undefined;
  const currency = data.currency as string | undefined;

  console.info(
    `[polar-webhook] Checkout completed for user ${userId ?? 'unknown'}: ${totalAmount} ${currency}`,
  );
  // Subscription activation is handled by subscription.created
}

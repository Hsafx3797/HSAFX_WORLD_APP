import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import {
  plans,
  planLimits,
  planFeatures,
  subscriptions,
  coinTransactions,
  userCoinWallets,
  coinPacks,
  invoices,
  payments,
  eq,
  and,
  desc,
  gte,
  sql,
} from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';
import { getPolar } from '../lib/polar';
import { getStripe } from '../lib/stripe';

export const billingRouter = router({
  // ─── Plans ────────────────────────────────────────────────

  getPlans: protectedProcedure.query(async ({ ctx }) => {
    const allPlans = await ctx.db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true));

    const plansWithLimits = await Promise.all(
      allPlans.map(async (plan) => {
        const limits = await ctx.db
          .select()
          .from(planLimits)
          .where(eq(planLimits.planId, plan.id));

        const features = await ctx.db
          .select()
          .from(planFeatures)
          .where(eq(planFeatures.planId, plan.id));

        return { ...plan, limits, features };
      }),
    );

    return plansWithLimits;
  }),

  // ─── Subscription ─────────────────────────────────────────

  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    const [subscription] = await ctx.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user!.id))
      .limit(1);

    if (!subscription) {
      return null;
    }

    const [plan] = await ctx.db
      .select()
      .from(plans)
      .where(eq(plans.id, subscription.planId))
      .limit(1);

    // Derive status from timestamps (never stored as enum)
    const now = new Date();
    let derivedStatus: string;

    if (subscription.trialEnd && now < subscription.trialEnd) {
      derivedStatus = 'trialing';
    } else if (subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd > now) {
      derivedStatus = 'active_canceling';
    } else if (subscription.canceledAt && subscription.currentPeriodEnd <= now) {
      derivedStatus = 'expired';
    } else if (subscription.status === 'past_due') {
      derivedStatus = 'past_due';
    } else if (subscription.currentPeriodEnd > now) {
      derivedStatus = 'active';
    } else {
      derivedStatus = 'expired';
    }

    return { subscription, plan, derivedStatus };
  }),

  /**
   * Create a Polar checkout session for a subscription plan.
   * No DB write here — the Polar webhook (subscription.created) handles activation.
   */
  createCheckout: protectedProcedure
    .input(z.object({
      planSlug: z.enum(['pro', 'advance']),
      interval: z.enum(['monthly', 'yearly']).default('monthly'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Block if user already has an active subscription
      const [existingSub] = await ctx.db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, ctx.user!.id),
            eq(subscriptions.status, 'active'),
          ),
        )
        .limit(1);

      if (existingSub) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Already has an active subscription. Cancel first to switch plans.',
        });
      }

      // Look up the plan and its Polar product ID
      const [plan] = await ctx.db
        .select()
        .from(plans)
        .where(and(eq(plans.slug, input.planSlug), eq(plans.isActive, true)))
        .limit(1);

      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }

      if (!plan.polarProductId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Plan is not linked to a Polar product. Contact support.',
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

      try {
        const polar = getPolar();
        const checkout = await polar.checkouts.create({
          products: [plan.polarProductId],
          successUrl: `${appUrl}/billing/success?checkout_id={CHECKOUT_ID}`,
          externalCustomerId: ctx.user!.id,
          metadata: {
            userId: ctx.user!.id,
            planSlug: input.planSlug,
            interval: input.interval,
          },
        });

        return { checkoutUrl: checkout.url };
      } catch (err) {
        console.error('[billing.createCheckout] Polar checkout failed:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session. Please try again.',
        });
      }
    }),

  /**
   * Cancel subscription via Polar API (cancel at period end).
   * Polar sends a subscription.canceled webhook which updates local DB.
   * We also update local DB optimistically for instant UI feedback.
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const [subscription] = await ctx.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, ctx.user!.id),
          eq(subscriptions.status, 'active'),
        ),
      )
      .limit(1);

    if (!subscription) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No active subscription found',
      });
    }

    // Call Polar to cancel at period end (if we have a Polar subscription ID)
    if (subscription.polarSubscriptionId) {
      try {
        const polar = getPolar();
        await polar.subscriptions.update({
          id: subscription.polarSubscriptionId,
          subscriptionUpdate: {
            cancelAtPeriodEnd: true,
          },
        });
      } catch (err) {
        console.error('[billing.cancelSubscription] Polar cancel failed:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel subscription with payment provider. Please try again.',
        });
      }
    }

    // Optimistic local update (webhook will also confirm)
    const [updated] = await ctx.db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    return updated;
  }),

  // ─── Wallet & Coins ──────────────────────────────────────

  getWalletBalance: protectedProcedure.query(async ({ ctx }) => {
    // Read from wallet cache (atomic, consistent)
    const [wallet] = await ctx.db
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, ctx.user!.id))
      .limit(1);

    if (wallet) {
      return {
        balance: wallet.balance,
        lifetimeEarned: wallet.lifetimeEarned,
        lifetimeSpent: wallet.lifetimeSpent,
      };
    }

    // Fallback: compute from ledger SUM
    const [result] = await ctx.db
      .select({ total: sql<number>`COALESCE(SUM(${coinTransactions.amount}), 0)` })
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, ctx.user!.id));

    return {
      balance: Number(result?.total ?? 0),
      lifetimeEarned: 0,
      lifetimeSpent: 0,
    };
  }),

  getTransactionHistory: protectedProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      type: z.enum(['grant', 'purchase', 'spend', 'refund', 'adjustment']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const transactions = await ctx.db
        .select()
        .from(coinTransactions)
        .where(
          input.type
            ? and(
                eq(coinTransactions.userId, ctx.user!.id),
                eq(coinTransactions.type, input.type),
              )
            : eq(coinTransactions.userId, ctx.user!.id),
        )
        .orderBy(desc(coinTransactions.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return { items: transactions, page: input.page, pageSize: input.pageSize };
    }),

  // ─── Coin Packs ───────────────────────────────────────────

  getCoinPacks: protectedProcedure.query(async ({ ctx }) => {
    const packs = await ctx.db
      .select()
      .from(coinPacks)
      .where(eq(coinPacks.isActive, true))
      .orderBy(coinPacks.sortOrder);

    return packs;
  }),

  /**
   * Create a Stripe Checkout session for a coin pack purchase.
   * No DB write here — the Stripe webhook (checkout.session.completed) credits coins.
   */
  purchaseCoinPack: protectedProcedure
    .input(z.object({
      packId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [pack] = await ctx.db
        .select()
        .from(coinPacks)
        .where(
          and(eq(coinPacks.id, input.packId), eq(coinPacks.isActive, true)),
        )
        .limit(1);

      if (!pack) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Coin pack not found' });
      }

      // Verify user has Pro/Advance plan (coin packs require subscription)
      const [sub] = await ctx.db
        .select({ planId: subscriptions.planId })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, ctx.user!.id),
            eq(subscriptions.status, 'active'),
          ),
        )
        .limit(1);

      if (!sub) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Active subscription required to purchase coin packs',
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

      try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: pack.name,
                  description: `${pack.coins + pack.bonusCoins} coins`,
                },
                unit_amount: pack.priceInCents,
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId: ctx.user!.id,
            coinPackId: pack.id,
          },
          success_url: `${appUrl}/billing/coins/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/billing/coins`,
        });

        return {
          packId: pack.id,
          name: pack.name,
          coins: pack.coins + pack.bonusCoins,
          priceInCents: pack.priceInCents,
          checkoutUrl: session.url,
        };
      } catch (err) {
        console.error('[billing.purchaseCoinPack] Stripe checkout failed:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session. Please try again.',
        });
      }
    }),

  // ─── Admin: Grant Coins ───────────────────────────────────

  grantCoins: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      amount: z.number().int().positive(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [wallet] = await tx
          .select()
          .from(userCoinWallets)
          .where(eq(userCoinWallets.userId, input.userId))
          .for('update')
          .limit(1);

        const currentBalance = wallet?.balance ?? 0;
        const newBalance = currentBalance + input.amount;

        const [transaction] = await tx
          .insert(coinTransactions)
          .values({
            userId: input.userId,
            amount: input.amount,
            type: 'grant',
            reason: input.reason,
            balanceAfter: newBalance,
          })
          .returning();

        if (wallet) {
          await tx
            .update(userCoinWallets)
            .set({
              balance: newBalance,
              lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${input.amount}`,
              updatedAt: new Date(),
            })
            .where(eq(userCoinWallets.userId, input.userId));
        } else {
          await tx.insert(userCoinWallets).values({
            userId: input.userId,
            balance: newBalance,
            lifetimeEarned: input.amount,
          });
        }

        return { transaction, newBalance };
      });
    }),

  // ─── Invoices ─────────────────────────────────────────────

  getInvoices: protectedProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const items = await ctx.db
        .select()
        .from(invoices)
        .where(eq(invoices.userId, ctx.user!.id))
        .orderBy(desc(invoices.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return { items, page: input.page, pageSize: input.pageSize };
    }),

  // ─── Usage Stats ──────────────────────────────────────────

  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user!.id;

    // Total executions this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [execStats] = await ctx.db
      .select({
        totalExecutions: sql<number>`COUNT(*)`,
        totalCoinsSpent: sql<number>`COALESCE(SUM(${coinTransactions.amount}), 0)`,
      })
      .from(coinTransactions)
      .where(
        and(
          eq(coinTransactions.userId, userId),
          eq(coinTransactions.type, 'spend'),
          sql`${coinTransactions.createdAt} >= ${monthStart}`,
        ),
      );

    const [wallet] = await ctx.db
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, userId))
      .limit(1);

    return {
      monthlyExecutions: Number(execStats?.totalExecutions ?? 0),
      monthlyCoinsSpent: Math.abs(Number(execStats?.totalCoinsSpent ?? 0)),
      currentBalance: wallet?.balance ?? 0,
      lifetimeEarned: wallet?.lifetimeEarned ?? 0,
      lifetimeSpent: wallet?.lifetimeSpent ?? 0,
    };
  }),

  // ─── Subscription Management ──────────────────────────────

  resumeSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user!.id;

    // Get current subscription
    const [sub] = await ctx.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!sub) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No subscription found',
      });
    }

    if (sub.status !== 'canceled' && sub.status !== 'paused') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot resume subscription with status: ${sub.status}`,
      });
    }

    // Resume via Polar API (uncancel subscription set to cancel at period end)
    if (sub.polarSubscriptionId) {
      const polar = getPolar();
      await polar.subscriptions.update({
        id: sub.polarSubscriptionId,
        subscriptionUpdate: { cancelAtPeriodEnd: false },
      });
    }

    // Update local record
    const [updated] = await ctx.db
      .update(subscriptions)
      .set({
        status: 'active',
        canceledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id))
      .returning();

    return updated;
  }),

  changePlan: protectedProcedure
    .input(
      z.object({
        newPlanId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;

      // Verify the target plan exists
      const [newPlan] = await ctx.db
        .select()
        .from(plans)
        .where(eq(plans.id, input.newPlanId))
        .limit(1);

      if (!newPlan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan not found',
        });
      }

      // Get current subscription
      const [currentSub] = await ctx.db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (!currentSub) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active subscription found. Please subscribe first.',
        });
      }

      if (currentSub.planId === input.newPlanId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are already on this plan',
        });
      }

      // Create checkout for the new plan via Polar (handles proration automatically)
      if (newPlan.polarProductId) {
        const polar = getPolar();
        const checkout = await polar.checkouts.create({
          products: [newPlan.polarProductId],
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/billing?upgraded=true`,
          externalCustomerId: userId,
          metadata: {
            userId,
            changePlanFrom: currentSub.planId,
            changePlanTo: input.newPlanId,
          },
        });

        return { checkoutUrl: checkout.url, checkoutId: checkout.id };
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Plan has no payment provider configured',
      });
    }),

  // ─── Daily Bonus ──────────────────────────────────────────

  claimDailyBonus: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user!.id;

    // Check if user already claimed today (UTC day boundary)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [existing] = await ctx.db
      .select({ id: coinTransactions.id })
      .from(coinTransactions)
      .where(
        and(
          eq(coinTransactions.userId, userId),
          eq(coinTransactions.type, 'grant'),
          eq(coinTransactions.reason, 'daily_bonus'),
          gte(coinTransactions.createdAt, todayStart),
        ),
      )
      .limit(1);

    if (existing) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Daily bonus already claimed today. Come back tomorrow!',
      });
    }

    // Daily bonus amount (configurable later via system config)
    const DAILY_BONUS_AMOUNT = 10;

    // Get or create wallet
    let [wallet] = await ctx.db
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, userId))
      .limit(1);

    if (!wallet) {
      [wallet] = await ctx.db
        .insert(userCoinWallets)
        .values({ userId, balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 })
        .returning();
    }

    const newBalance = wallet!.balance + DAILY_BONUS_AMOUNT;

    // Insert transaction
    await ctx.db.insert(coinTransactions).values({
      userId,
      amount: DAILY_BONUS_AMOUNT,
      type: 'grant',
      reason: 'daily_bonus',
      balanceAfter: newBalance,
      metadata: { source: 'daily_bonus' },
    });

    // Update wallet
    await ctx.db
      .update(userCoinWallets)
      .set({
        balance: newBalance,
        lifetimeEarned: wallet!.lifetimeEarned + DAILY_BONUS_AMOUNT,
        updatedAt: new Date(),
      })
      .where(eq(userCoinWallets.userId, userId));

    return { claimed: true, amount: DAILY_BONUS_AMOUNT, newBalance };
  }),
});

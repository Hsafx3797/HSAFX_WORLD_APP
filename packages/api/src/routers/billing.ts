import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import {
  plans,
  planLimits,
  planFeatures,
  subscriptions,
  invoices,
  eq,
  and,
  desc,
  sql,
} from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';
import { getPolar } from '../lib/polar';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('billing');

export const billingRouter = router({
  // ─── Plans ────────────────────────────────────────────────

  getPlans: publicProcedure.query(async ({ ctx }) => {
    const allPlans = await ctx.db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true));

    if (allPlans.length === 0) return [];

    // Batch-fetch all limits and features in 2 queries instead of 2N
    const planIds = allPlans.map((p) => p.id);

    const [allLimits, allFeatures] = await Promise.all([
      ctx.db
        .select()
        .from(planLimits)
        .where(sql`${planLimits.planId} IN ${planIds}`),
      ctx.db
        .select()
        .from(planFeatures)
        .where(sql`${planFeatures.planId} IN ${planIds}`),
    ]);

    // Group by planId in JS
    const limitsMap = new Map<string, typeof allLimits>();
    for (const limit of allLimits) {
      const arr = limitsMap.get(limit.planId) ?? [];
      arr.push(limit);
      limitsMap.set(limit.planId, arr);
    }

    const featuresMap = new Map<string, typeof allFeatures>();
    for (const feature of allFeatures) {
      const arr = featuresMap.get(feature.planId) ?? [];
      arr.push(feature);
      featuresMap.set(feature.planId, arr);
    }

    return allPlans.map((plan) => ({
      ...plan,
      limits: limitsMap.get(plan.id) ?? [],
      features: featuresMap.get(plan.id) ?? [],
    }));
  }),

  // ─── Subscription ─────────────────────────────────────────

  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(plans.id, subscriptions.planId))
      .where(eq(subscriptions.userId, ctx.user!.id))
      .limit(1);

    if (!rows.length) {
      return null;
    }

    const { subscription, plan } = rows[0]!;

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

      const productId = input.interval === 'yearly'
        ? plan.polarProductIdYearly
        : plan.polarProductIdMonthly;

      if (!productId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Plan is not linked to a Polar ${input.interval} product. Contact support.`,
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

      try {
        const polar = getPolar();
        const checkout = await polar.checkouts.create({
          products: [productId],
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
        log.error('Polar checkout failed', { planSlug: input.planSlug, error: String(err) });
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
        log.error('Polar cancel failed', { subscriptionId: subscription.id, error: String(err) });
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
      // Use the current billing cycle to pick the matching product ID
      const productId =
        currentSub.billingCycle === 'yearly'
          ? newPlan.polarProductIdYearly
          : newPlan.polarProductIdMonthly;

      if (productId) {
        const polar = getPolar();
        const checkout = await polar.checkouts.create({
          products: [productId],
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
});

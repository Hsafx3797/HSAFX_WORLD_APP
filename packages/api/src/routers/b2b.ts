import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import {
  b2bPlans,
  b2bSubscriptions,
  b2bSuites,
  b2bPlanQuotas,
  b2bUsage,
  users,
  eq,
  and,
  desc,
  sql,
} from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';
import { getStripe } from '../lib/stripe';

export const b2bRouter = router({
  // ─── Public: Get B2B Plans with Quotas ──────────────────────

  getPlans: publicProcedure.query(async ({ ctx }) => {
    const allPlans = await ctx.db
      .select()
      .from(b2bPlans)
      .where(eq(b2bPlans.isActive, true))
      .orderBy(b2bPlans.priceMonthlyCents);

    const allSuites = await ctx.db
      .select()
      .from(b2bSuites)
      .where(eq(b2bSuites.isActive, true))
      .orderBy(b2bSuites.sortOrder);

    const allQuotas = await ctx.db.select().from(b2bPlanQuotas);

    return allPlans.map((plan) => ({
      ...plan,
      quotas: allSuites.map((suite) => {
        const quota = allQuotas.find(
          (q) => q.b2bPlanId === plan.id && q.b2bSuiteId === suite.id
        );
        return {
          suiteId: suite.id,
          suiteName: suite.name,
          suiteSlug: suite.slug,
          monthlyLimit: quota?.monthlyLimit ?? 0,
        };
      }),
    }));
  }),

  // ─── Public: List B2B Suites ────────────────────────────────

  getSuites: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(b2bSuites)
      .where(eq(b2bSuites.isActive, true))
      .orderBy(b2bSuites.sortOrder);
  }),

  // ─── Protected: Get User's B2B Subscription ────────────────

  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    const [sub] = await ctx.db
      .select({
        id: b2bSubscriptions.id,
        status: b2bSubscriptions.status,
        billingCycle: b2bSubscriptions.billingCycle,
        currentPeriodStart: b2bSubscriptions.currentPeriodStart,
        currentPeriodEnd: b2bSubscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: b2bSubscriptions.cancelAtPeriodEnd,
        canceledAt: b2bSubscriptions.canceledAt,
        planId: b2bPlans.id,
        planName: b2bPlans.name,
        planSlug: b2bPlans.slug,
        priceMonthlyCents: b2bPlans.priceMonthlyCents,
        priceYearlyCents: b2bPlans.priceYearlyCents,
      })
      .from(b2bSubscriptions)
      .innerJoin(b2bPlans, eq(b2bSubscriptions.b2bPlanId, b2bPlans.id))
      .where(
        and(
          eq(b2bSubscriptions.userId, ctx.user!.id),
          eq(b2bSubscriptions.status, 'active')
        )
      )
      .limit(1);

    return sub ?? null;
  }),

  // ─── Protected: Get B2B Usage for Current Period ────────────

  getMyUsage: protectedProcedure.query(async ({ ctx }) => {
    const [sub] = await ctx.db
      .select()
      .from(b2bSubscriptions)
      .where(
        and(
          eq(b2bSubscriptions.userId, ctx.user!.id),
          eq(b2bSubscriptions.status, 'active')
        )
      )
      .limit(1);

    if (!sub) return null;

    const usage = await ctx.db
      .select({
        suiteId: b2bUsage.b2bSuiteId,
        suiteName: b2bSuites.name,
        suiteSlug: b2bSuites.slug,
        usageCount: b2bUsage.usageCount,
        monthlyLimit: b2bPlanQuotas.monthlyLimit,
        periodStart: b2bUsage.periodStart,
        periodEnd: b2bUsage.periodEnd,
      })
      .from(b2bUsage)
      .innerJoin(b2bSuites, eq(b2bUsage.b2bSuiteId, b2bSuites.id))
      .innerJoin(
        b2bPlanQuotas,
        and(
          eq(b2bPlanQuotas.b2bPlanId, sub.b2bPlanId),
          eq(b2bPlanQuotas.b2bSuiteId, b2bUsage.b2bSuiteId)
        )
      )
      .where(eq(b2bUsage.userId, ctx.user!.id))
      .orderBy(b2bSuites.sortOrder);

    return { subscriptionId: sub.id, periodEnd: sub.currentPeriodEnd, usage };
  }),

  // ─── Protected: Create B2B Checkout Session ─────────────────

  createCheckout: protectedProcedure
    .input(z.object({
      planId: z.string().uuid(),
      billingCycle: z.enum(['monthly', 'yearly']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check for existing active subscription
      const [existing] = await ctx.db
        .select({ id: b2bSubscriptions.id })
        .from(b2bSubscriptions)
        .where(
          and(
            eq(b2bSubscriptions.userId, ctx.user!.id),
            eq(b2bSubscriptions.status, 'active')
          )
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You already have an active B2B subscription. Use the billing portal to change plans.',
        });
      }

      const [plan] = await ctx.db
        .select()
        .from(b2bPlans)
        .where(and(eq(b2bPlans.id, input.planId), eq(b2bPlans.isActive, true)))
        .limit(1);

      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }

      const priceId = input.billingCycle === 'yearly'
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly;

      if (!priceId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Stripe price not configured for ${plan.name} ${input.billingCycle} billing`,
        });
      }

      // Get or ensure Stripe customer
      const [user] = await ctx.db
        .select({ stripeCustomerId: users.stripeCustomerId, email: users.email })
        .from(users)
        .where(eq(users.id, ctx.user!.id))
        .limit(1);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

      try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          customer: user?.stripeCustomerId ?? undefined,
          customer_email: user?.stripeCustomerId ? undefined : (user?.email ?? undefined),
          line_items: [{ price: priceId, quantity: 1 }],
          metadata: {
            userId: ctx.user!.id,
            b2bPlanId: plan.id,
            billingCycle: input.billingCycle,
          },
          subscription_data: {
            metadata: {
              userId: ctx.user!.id,
              b2bPlanId: plan.id,
            },
          },
          success_url: `${appUrl}/dashboard/api?checkout=success`,
          cancel_url: `${appUrl}/pricing?tab=api`,
        });

        return { checkoutUrl: session.url };
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session',
        });
      }
    }),

  // ─── Protected: Create Billing Portal Session ───────────────

  createPortalSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      const [user] = await ctx.db
        .select({ stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, ctx.user!.id))
        .limit(1);

      if (!user?.stripeCustomerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No Stripe customer found. Subscribe to a plan first.',
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

      try {
        const stripe = getStripe();
        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${appUrl}/dashboard/api`,
        });

        return { portalUrl: session.url };
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create billing portal session',
        });
      }
    }),
});

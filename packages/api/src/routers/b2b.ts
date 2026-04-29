import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import {
  b2bPlans,
  b2bSubscriptions,
  b2bSuites,
  b2bPlanQuotas,
  b2bUsage,
  eq,
  and,
  desc,
  sql,
} from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';
import { getPolar } from '../lib/polar';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('b2b');

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
          message: 'You already have an active B2B subscription. Use the customer portal to change plans.',
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

      const productId = input.billingCycle === 'yearly'
        ? plan.polarProductIdYearly
        : plan.polarProductIdMonthly;

      if (!productId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Polar product not configured for ${plan.name} ${input.billingCycle} billing`,
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

      try {
        const polar = getPolar();
        const checkout = await polar.checkouts.create({
          products: [productId],
          successUrl: `${appUrl}/dashboard/api?checkout=success`,
          externalCustomerId: ctx.user!.id,
          metadata: {
            userId: ctx.user!.id,
            b2bPlanId: plan.id,
            billingCycle: input.billingCycle,
          },
        });

        return { checkoutUrl: checkout.url };
      } catch (err) {
        log.error('Polar B2B checkout failed', { planId: input.planId, error: String(err) });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session',
        });
      }
    }),

  // ─── Protected: Create Customer Portal Session ───────────────

  createPortalSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Verify user has an active B2B subscription
      const [sub] = await ctx.db
        .select({ id: b2bSubscriptions.id, polarSubscriptionId: b2bSubscriptions.polarSubscriptionId })
        .from(b2bSubscriptions)
        .where(
          and(
            eq(b2bSubscriptions.userId, ctx.user!.id),
            eq(b2bSubscriptions.status, 'active')
          )
        )
        .limit(1);

      if (!sub) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active B2B subscription found. Subscribe to a plan first.',
        });
      }

      try {
        const polar = getPolar();

        // Polar customer IDs are their own UUIDs — look up by externalId (our user ID)
        const polarCustomer = await polar.customers.getExternal({ externalId: ctx.user!.id }).catch(() => null);

        if (!polarCustomer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No Polar customer record found. Complete a checkout to create one.',
          });
        }

        const session = await polar.customerSessions.create({
          customerId: polarCustomer.id,
        });

        return { portalUrl: session.customerPortalUrl };
      } catch (err) {
        log.error('Polar customer portal failed', { userId: ctx.user!.id, error: String(err) });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create customer portal session',
        });
      }
    }),
});

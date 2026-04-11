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
});

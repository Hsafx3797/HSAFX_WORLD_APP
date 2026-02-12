/**
 * GET /api/v1/billing/subscription
 * Returns the current subscription for the API key owner.
 * Requires scope: billing:read
 */

import { NextRequest } from 'next/server';
import { db, eq, subscriptions, plans } from '@hsafx/db';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';

export async function GET(request: NextRequest) {
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  const scopeErr = requireScope(ctx, 'billing:read');
  if (scopeErr) return scopeErr;

  try {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, ctx.userId),
    });

    if (!sub) {
      return apiResponse(
        {
          plan: 'free',
          status: 'none',
          subscription: null,
        },
        ctx,
      );
    }

    // Fetch plan details
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, sub.planId),
    });

    return apiResponse(
      {
        plan: plan?.slug ?? 'unknown',
        status: sub.status,
        subscription: {
          id: sub.id,
          billingCycle: sub.billingCycle,
          currentPeriodStart: sub.currentPeriodStart.toISOString(),
          currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          canceledAt: sub.canceledAt?.toISOString() ?? null,
          trialStart: sub.trialStart?.toISOString() ?? null,
          trialEnd: sub.trialEnd?.toISOString() ?? null,
          createdAt: sub.createdAt.toISOString(),
        },
      },
      ctx,
    );
  } catch (err) {
    return apiErrorResponse(
      'B004',
      'Failed to retrieve subscription',
      ctx,
      500,
      process.env.NODE_ENV !== 'production'
        ? { detail: (err as Error).message }
        : undefined,
    );
  }
}

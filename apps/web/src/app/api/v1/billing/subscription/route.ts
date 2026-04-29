/**
 * GET /api/v1/billing/subscription
 * Returns the current B2B subscription for the API key owner.
 * Requires scope: billing:read
 */

import { NextRequest } from 'next/server';
import { db, eq, b2bSubscriptions, b2bPlans } from '@hsafx/db';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { ApiErrorCode } from '@hsafx/shared/errors';

export async function GET(request: NextRequest) {
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  const scopeErr = requireScope(ctx, 'billing:read');
  if (scopeErr) return scopeErr;

  try {
    const sub = await db.query.b2bSubscriptions.findFirst({
      where: eq(b2bSubscriptions.userId, ctx.userId),
    });

    if (!sub) {
      return apiResponse({ subscription: null }, ctx);
    }

    const plan = await db.query.b2bPlans.findFirst({
      where: eq(b2bPlans.id, sub.b2bPlanId),
    });

    return apiResponse(
      {
        subscription: {
          id: sub.id,
          planSlug: plan?.slug ?? 'unknown',
          planName: plan?.name ?? 'Unknown',
          status: sub.status,
          billingCycle: sub.billingCycle,
          currentPeriodStart: sub.currentPeriodStart.toISOString(),
          currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          canceledAt: sub.canceledAt?.toISOString() ?? null,
          createdAt: sub.createdAt.toISOString(),
        },
      },
      ctx,
    );
  } catch (err) {
    return apiErrorResponse(
      ApiErrorCode.SERVER_ERROR,
      'Failed to retrieve subscription',
      ctx,
      500,
      process.env.NODE_ENV !== 'production'
        ? { detail: (err as Error).message }
        : undefined,
    );
  }
}


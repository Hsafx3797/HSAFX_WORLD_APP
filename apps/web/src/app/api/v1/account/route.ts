/**
 * GET /api/v1/account
 * Returns account info for the API key owner.
 * Requires scope: billing:read
 *
 * Webhook management: see /api/v1/account/webhooks (GET, POST, DELETE).
 */

import { NextRequest } from 'next/server';
import { db, eq, users, b2bSubscriptions, b2bPlans } from '@hsafx/db';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { ApiErrorCode } from '@hsafx/shared/errors';

export async function GET(request: NextRequest) {
  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check
  const scopeErr = requireScope(ctx, 'billing:read');
  if (scopeErr) return scopeErr;

  try {
    // 3. Fetch user
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    });

    if (!user) {
      return apiErrorResponse(ApiErrorCode.USER_NOT_FOUND, 'User not found', ctx, 404);
    }

    // 4. Fetch B2B subscription
    const sub = await db.query.b2bSubscriptions.findFirst({
      where: eq(b2bSubscriptions.userId, ctx.userId),
    });

    // 5. Fetch B2B plan name
    const plan = sub
      ? await db.query.b2bPlans.findFirst({ where: eq(b2bPlans.id, sub.b2bPlanId) })
      : null;

    return apiResponse(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        subscription: sub
          ? {
              planSlug: plan?.slug ?? 'unknown',
              planName: plan?.name ?? 'Unknown',
              status: sub.status,
              billingCycle: sub.billingCycle,
              currentPeriodStart: sub.currentPeriodStart.toISOString(),
              currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            }
          : null,
        apiKey: {
          name: ctx.keyName,
          scopes: ctx.scopes,
          rateLimitTier: ctx.rateLimitTier,
        },
      },
      ctx,
    );
  } catch (err) {
    return apiErrorResponse(
      ApiErrorCode.SERVER_ERROR,
      'Failed to retrieve account info',
      ctx,
      500,
      process.env.NODE_ENV !== 'production'
        ? { detail: (err as Error).message }
        : undefined,
    );
  }
}


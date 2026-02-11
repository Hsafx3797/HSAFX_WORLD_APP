/**
 * GET /api/v1/account
 * Returns account info for the API key owner.
 * Requires scope: billing:read
 */

import { NextRequest } from 'next/server';
import { db, eq, users, subscriptions, userCoinWallets } from '@hsafx/db';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';

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
      return apiErrorResponse('U001', 'User not found', ctx, 404);
    }

    // 4. Fetch subscription
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, ctx.userId),
    });

    // 5. Fetch coin wallet
    const wallet = await db.query.userCoinWallets.findFirst({
      where: eq(userCoinWallets.userId, ctx.userId),
    });

    return apiResponse(
      {
        userId: user.id,
        email: user.email,
        name: user.fullName,
        plan: sub
          ? {
              id: sub.planId,
              status: sub.status,
              currentPeriodEnd: sub.currentPeriodEnd,
            }
          : { id: null, status: 'free', currentPeriodEnd: null },
        coins: {
          balance: wallet?.balance ?? 0,
          lifetimeEarned: wallet?.lifetimeEarned ?? 0,
          lifetimeSpent: wallet?.lifetimeSpent ?? 0,
        },
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
      'E001',
      'Failed to retrieve account info',
      ctx,
      500,
      process.env.NODE_ENV !== 'production'
        ? { detail: (err as Error).message }
        : undefined,
    );
  }
}

/**
 * GET /api/v1/billing/balance
 * Returns the API key owner's coin wallet balance.
 * Requires scope: billing:read
 */

import { NextRequest } from 'next/server';
import { db, eq, userCoinWallets } from '@hsafx/db';
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
    const wallet = await db.query.userCoinWallets.findFirst({
      where: eq(userCoinWallets.userId, ctx.userId),
    });

    return apiResponse(
      {
        balance: wallet?.balance ?? 0,
        lifetimeEarned: wallet?.lifetimeEarned ?? 0,
        lifetimeSpent: wallet?.lifetimeSpent ?? 0,
        lastRecalculatedAt: wallet?.lastRecalculatedAt?.toISOString() ?? null,
      },
      ctx,
    );
  } catch (err) {
    return apiErrorResponse(
      'B001',
      'Failed to retrieve balance',
      ctx,
      500,
      process.env.NODE_ENV !== 'production'
        ? { detail: (err as Error).message }
        : undefined,
    );
  }
}

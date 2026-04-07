/**
 * GET /api/v1/billing/transactions
 * Returns paginated coin transaction history for the API key owner.
 * Requires scope: billing:read
 *
 * Query params:
 *   - limit:  number (1–100, default 20)
 *   - offset: number (default 0)
 *   - type:   coin_transaction_type filter (optional)
 */

import { NextRequest } from 'next/server';
import { db, eq, and, desc, sql, coinTransactions } from '@hsafx/db';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { ApiErrorCode } from '@hsafx/shared/errors';

// Must match actual types used in coin-service.ts
const VALID_TYPES = [
  'spend', 'refund', 'grant', 'purchase', 'adjustment',
] as const;

export async function GET(request: NextRequest) {
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  const scopeErr = requireScope(ctx, 'billing:read');
  if (scopeErr) return scopeErr;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);
  const type = searchParams.get('type');

  if (type && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return apiErrorResponse(ApiErrorCode.INVALID_FIELD, `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`, ctx, 400);
  }

  try {
    const conditions = [eq(coinTransactions.userId, ctx.userId)];
    if (type) {
      conditions.push(sql`${coinTransactions.type} = ${type}`);
    }
    const where = and(...conditions);

    const [items, countRows] = await Promise.all([
      db
        .select({
          id: coinTransactions.id,
          amount: coinTransactions.amount,
          type: coinTransactions.type,
          reason: coinTransactions.reason,
          balanceAfter: coinTransactions.balanceAfter,
          resourceType: coinTransactions.resourceType,
          resourceId: coinTransactions.resourceId,
          createdAt: coinTransactions.createdAt,
        })
        .from(coinTransactions)
        .where(where)
        .orderBy(desc(coinTransactions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(coinTransactions)
        .where(where),
    ]);

    const total = Number(countRows[0]?.count ?? 0);

    return apiResponse(
      {
        transactions: items.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      ctx,
    );
  } catch (err) {
    return apiErrorResponse(
      ApiErrorCode.SERVER_ERROR,
      'Failed to retrieve transactions',
      ctx,
      500,
      process.env.NODE_ENV !== 'production'
        ? { detail: (err as Error).message }
        : undefined,
    );
  }
}

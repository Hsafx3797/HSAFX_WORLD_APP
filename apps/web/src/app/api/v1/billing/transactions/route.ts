/**
 * GET /api/v1/billing/transactions
 * Returns paginated B2B usage log (ops consumed per suite per period).
 * Requires scope: billing:read
 *
 * Query params:
 *   - limit:  number (1–100, default 20)
 *   - offset: number (default 0)
 */

import { NextRequest } from 'next/server';
import { db, eq, desc, sql, b2bUsage, b2bSuites } from '@hsafx/db';
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

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

  try {
    const [items, countRows] = await Promise.all([
      db
        .select({
          id: b2bUsage.id,
          suite: b2bSuites.slug,
          suiteName: b2bSuites.name,
          usageCount: b2bUsage.usageCount,
          periodStart: b2bUsage.periodStart,
          periodEnd: b2bUsage.periodEnd,
          updatedAt: b2bUsage.updatedAt,
        })
        .from(b2bUsage)
        .innerJoin(b2bSuites, eq(b2bUsage.b2bSuiteId, b2bSuites.id))
        .where(eq(b2bUsage.userId, ctx.userId))
        .orderBy(desc(b2bUsage.periodStart))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(b2bUsage)
        .where(eq(b2bUsage.userId, ctx.userId)),
    ]);

    const total = Number(countRows[0]?.count ?? 0);

    return apiResponse(
      {
        usage: items.map((r) => ({
          id: r.id,
          suite: r.suite,
          suiteName: r.suiteName,
          opsConsumed: r.usageCount,
          periodStart: r.periodStart.toISOString(),
          periodEnd: r.periodEnd.toISOString(),
          lastUpdated: r.updatedAt.toISOString(),
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
      'Failed to retrieve usage history',
      ctx,
      500,
      process.env.NODE_ENV !== 'production'
        ? { detail: (err as Error).message }
        : undefined,
    );
  }
}


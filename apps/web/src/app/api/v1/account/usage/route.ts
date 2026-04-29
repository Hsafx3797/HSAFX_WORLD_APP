/**
 * GET /api/v1/account/usage
 * Returns B2B usage statistics for the API key owner.
 * Requires scope: billing:read
 *
 * Query params:
 *   - period: 'day' | 'week' | 'month' (default: 'month')
 */

import { NextRequest } from 'next/server';
import { db, eq, and, gte, sql, b2bUsage, b2bSuites } from '@hsafx/db';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { ApiErrorCode } from '@hsafx/shared/errors';

function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

export async function GET(request: NextRequest) {
  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check
  const scopeErr = requireScope(ctx, 'billing:read');
  if (scopeErr) return scopeErr;

  // 3. Parse params
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'month';
  const periodStart = getPeriodStart(period);

  try {
    // 4. Fetch B2B usage rows for this user in the requested period
    const usageRows = await db
      .select({
        suiteId: b2bUsage.b2bSuiteId,
        suiteName: b2bSuites.name,
        suiteSlug: b2bSuites.slug,
        usageCount: b2bUsage.usageCount,
        periodStart: b2bUsage.periodStart,
        periodEnd: b2bUsage.periodEnd,
      })
      .from(b2bUsage)
      .innerJoin(b2bSuites, eq(b2bUsage.b2bSuiteId, b2bSuites.id))
      .where(
        and(
          eq(b2bUsage.userId, ctx.userId),
          gte(b2bUsage.periodStart, periodStart),
        ),
      );

    const totalOps = usageRows.reduce((sum, r) => sum + r.usageCount, 0);

    return apiResponse(
      {
        period,
        periodStart: periodStart.toISOString(),
        totalOps,
        suites: usageRows.map((r) => ({
          suite: r.suiteSlug,
          suiteName: r.suiteName,
          ops: r.usageCount,
          periodStart: r.periodStart.toISOString(),
          periodEnd: r.periodEnd.toISOString(),
        })),
      },
      ctx,
    );
  } catch (err) {
    return apiErrorResponse(
      ApiErrorCode.SERVER_ERROR,
      'Failed to retrieve usage statistics',
      ctx,
      500,
      process.env.NODE_ENV !== 'production'
        ? { detail: (err as Error).message }
        : undefined,
    );
  }
}

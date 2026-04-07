/**
 * GET /api/v1/account/usage
 * Returns usage statistics for the API key owner.
 * Requires scope: billing:read
 *
 * Query params:
 *   - period: 'day' | 'week' | 'month' (default: 'month')
 *   - toolId: filter by specific tool (optional)
 */

import { NextRequest } from 'next/server';
import { db, eq, and, gte, sql, toolExecutions, coinTransactions } from '@hsafx/db';
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
  const toolId = searchParams.get('toolId');
  const periodStart = getPeriodStart(period);

  try {
    // 4. Count executions
    const baseConditions = [
      eq(toolExecutions.userId, ctx.userId),
      gte(toolExecutions.createdAt, periodStart),
    ];
    if (toolId) {
      baseConditions.push(eq(toolExecutions.toolId, toolId));
    }

    const execStats = await db
      .select({
        total: sql<number>`count(*)`,
        succeeded: sql<number>`count(*) filter (where ${toolExecutions.status} = 'succeeded')`,
        failed: sql<number>`count(*) filter (where ${toolExecutions.status} = 'failed')`,
        avgExecutionTime: sql<number>`avg(${toolExecutions.executionTime})`,
        totalCoinsSpent: sql<number>`coalesce(sum(${toolExecutions.coinCost}), 0)`,
      })
      .from(toolExecutions)
      .where(and(...baseConditions));

    const stats = execStats[0] ?? {
      total: 0,
      succeeded: 0,
      failed: 0,
      avgExecutionTime: 0,
      totalCoinsSpent: 0,
    };

    // 5. Coin transactions summary
    const coinStats = await db
      .select({
        totalCredits: sql<number>`coalesce(sum(case when amount > 0 then amount else 0 end), 0)`,
        totalDebits: sql<number>`coalesce(sum(case when amount < 0 then abs(amount) else 0 end), 0)`,
      })
      .from(coinTransactions)
      .where(
        and(
          eq(coinTransactions.userId, ctx.userId),
          gte(coinTransactions.createdAt, periodStart),
        ),
      );

    const coins = coinStats[0] ?? { totalCredits: 0, totalDebits: 0 };

    return apiResponse(
      {
        period,
        periodStart: periodStart.toISOString(),
        executions: {
          total: Number(stats.total),
          succeeded: Number(stats.succeeded),
          failed: Number(stats.failed),
          avgExecutionTimeMs: Math.round(Number(stats.avgExecutionTime ?? 0)),
        },
        coins: {
          spent: Number(stats.totalCoinsSpent),
          credited: Number(coins.totalCredits),
          debited: Number(coins.totalDebits),
        },
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

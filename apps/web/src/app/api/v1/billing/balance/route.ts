/**
 * GET /api/v1/billing/balance
 * Returns B2B quota summary (ops used / limit per suite) for the API key owner.
 * Requires scope: billing:read
 */

import { NextRequest } from 'next/server';
import { db, eq, b2bSubscriptions, b2bUsage, b2bSuites, b2bPlanQuotas } from '@hsafx/db';
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
    // Fetch active B2B subscription
    const sub = await db.query.b2bSubscriptions.findFirst({
      where: eq(b2bSubscriptions.userId, ctx.userId),
    });

    if (!sub) {
      return apiResponse({ subscription: null, quotas: [] }, ctx);
    }

    // Fetch current-period usage rows
    const now = new Date();
    const usageRows = await db
      .select({
        suiteId: b2bUsage.b2bSuiteId,
        suiteName: b2bSuites.name,
        suiteSlug: b2bSuites.slug,
        usageCount: b2bUsage.usageCount,
        periodStart: b2bUsage.periodStart,
        periodEnd: b2bUsage.periodEnd,
        monthlyLimit: b2bPlanQuotas.monthlyLimit,
      })
      .from(b2bUsage)
      .innerJoin(b2bSuites, eq(b2bUsage.b2bSuiteId, b2bSuites.id))
      .leftJoin(
        b2bPlanQuotas,
        eq(b2bPlanQuotas.b2bSuiteId, b2bUsage.b2bSuiteId),
      )
      .where(
        eq(b2bUsage.userId, ctx.userId),
      );

    // Filter to current period rows
    const currentUsage = usageRows.filter(
      (r) => r.periodStart <= now && r.periodEnd >= now,
    );

    return apiResponse(
      {
        subscription: {
          status: sub.status,
          currentPeriodStart: sub.currentPeriodStart.toISOString(),
          currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        },
        quotas: currentUsage.map((r) => ({
          suite: r.suiteSlug,
          suiteName: r.suiteName,
          used: r.usageCount,
          limit: r.monthlyLimit ?? null,
          remaining: r.monthlyLimit != null ? Math.max(0, r.monthlyLimit - r.usageCount) : null,
        })),
      },
      ctx,
    );
  } catch (err) {
    return apiErrorResponse(
      ApiErrorCode.SERVER_ERROR,
      'Failed to retrieve quota balance',
      ctx,
      500,
      process.env.NODE_ENV !== 'production'
        ? { detail: (err as Error).message }
        : undefined,
    );
  }
}


/**
 * B2B Plan Quotas API Route
 * GET   /api/admin/b2b/quotas — List quotas (optionally filtered by planId or suiteId)
 * POST  /api/admin/b2b/quotas — Create or upsert a quota for a plan+suite combo
 * PATCH /api/admin/b2b/quotas — Update a quota's monthly limit (pass id in body)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db, b2bPlanQuotas, b2bPlans, b2bSuites,
  eq, and, sql,
} from '@hsafx/db';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminPaginatedResponse, adminErrorResponse } from '@/lib/admin-response';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('admin-b2b-quotas');

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.view');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const suiteId = searchParams.get('suiteId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (planId) conditions.push(eq(b2bPlanQuotas.b2bPlanId, planId));
    if (suiteId) conditions.push(eq(b2bPlanQuotas.b2bSuiteId, suiteId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [quotas, countResult] = await Promise.all([
      db
        .select({
          id: b2bPlanQuotas.id,
          b2bPlanId: b2bPlanQuotas.b2bPlanId,
          planName: b2bPlans.name,
          planSlug: b2bPlans.slug,
          b2bSuiteId: b2bPlanQuotas.b2bSuiteId,
          suiteName: b2bSuites.name,
          suiteSlug: b2bSuites.slug,
          monthlyLimit: b2bPlanQuotas.monthlyLimit,
          createdAt: b2bPlanQuotas.createdAt,
          updatedAt: b2bPlanQuotas.updatedAt,
        })
        .from(b2bPlanQuotas)
        .innerJoin(b2bPlans, eq(b2bPlanQuotas.b2bPlanId, b2bPlans.id))
        .innerJoin(b2bSuites, eq(b2bPlanQuotas.b2bSuiteId, b2bSuites.id))
        .where(whereClause)
        .orderBy(b2bPlans.name, b2bSuites.sortOrder)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(b2bPlanQuotas).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count ?? 0);

    return adminPaginatedResponse(quotas, { page, limit, total });
  } catch (error) {
    log.error('Failed to fetch B2B quotas', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to fetch B2B quotas');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { b2bPlanId, b2bSuiteId, monthlyLimit } = body;

    if (!b2bPlanId || !b2bSuiteId || !monthlyLimit || monthlyLimit <= 0) {
      return adminErrorResponse('VALIDATION', 'b2bPlanId, b2bSuiteId, and monthlyLimit (> 0) are required', 400);
    }

    // Verify plan exists
    const [plan] = await db.select({ id: b2bPlans.id }).from(b2bPlans).where(eq(b2bPlans.id, b2bPlanId)).limit(1);
    if (!plan) {
      return adminErrorResponse('NOT_FOUND', 'B2B plan not found', 400);
    }

    // Verify suite exists
    const [suite] = await db.select({ id: b2bSuites.id }).from(b2bSuites).where(eq(b2bSuites.id, b2bSuiteId)).limit(1);
    if (!suite) {
      return adminErrorResponse('NOT_FOUND', 'B2B suite not found', 400);
    }

    // Upsert: if the plan+suite combo already exists, update the limit
    const [quota] = await db
      .insert(b2bPlanQuotas)
      .values({ b2bPlanId, b2bSuiteId, monthlyLimit })
      .onConflictDoUpdate({
        target: [b2bPlanQuotas.b2bPlanId, b2bPlanQuotas.b2bSuiteId],
        set: { monthlyLimit } as Record<string, unknown>,
      })
      .returning();

    return adminResponse(quota, 201);
  } catch (error) {
    log.error('Failed to create B2B quota', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to create B2B quota');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, monthlyLimit } = body;

    if (!id) {
      return adminErrorResponse('VALIDATION', 'Quota ID is required', 400);
    }

    if (monthlyLimit !== undefined && (typeof monthlyLimit !== 'number' || monthlyLimit <= 0)) {
      return adminErrorResponse('VALIDATION', 'monthlyLimit must be a positive number', 400);
    }

    const [updated] = await db
      .update(b2bPlanQuotas)
      .set({
        ...(monthlyLimit !== undefined && { monthlyLimit }),
      } as Record<string, unknown>)
      .where(eq(b2bPlanQuotas.id, id))
      .returning();

    if (!updated) {
      return adminErrorResponse('NOT_FOUND', 'B2B quota not found', 404);
    }

    return adminResponse(updated);
  } catch (error) {
    log.error('Failed to update B2B quota', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to update B2B quota');
  }
}

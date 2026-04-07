/**
 * B2B Plans API Route
 * GET   /api/admin/b2b/plans — List all B2B plans with their suite quotas
 * POST  /api/admin/b2b/plans — Create a B2B plan
 * PATCH /api/admin/b2b/plans — Update a B2B plan (pass id in body)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, b2bPlans, b2bPlanQuotas, b2bSuites, eq, sql } from '@hsafx/db';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminPaginatedResponse, adminErrorResponse } from '@/lib/admin-response';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('admin-b2b-plans');

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.view');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const [allPlans, countResult] = await Promise.all([
      db
        .select()
        .from(b2bPlans)
        .orderBy(b2bPlans.createdAt)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(b2bPlans),
    ]);
    const total = Number(countResult[0]?.count ?? 0);

    // Fetch quotas with suite info for each plan
    const planIds = allPlans.map((p) => p.id);
    const quotas = planIds.length > 0
      ? await db
          .select({
            id: b2bPlanQuotas.id,
            b2bPlanId: b2bPlanQuotas.b2bPlanId,
            b2bSuiteId: b2bPlanQuotas.b2bSuiteId,
            suiteName: b2bSuites.name,
            suiteSlug: b2bSuites.slug,
            monthlyLimit: b2bPlanQuotas.monthlyLimit,
          })
          .from(b2bPlanQuotas)
          .innerJoin(b2bSuites, eq(b2bPlanQuotas.b2bSuiteId, b2bSuites.id))
          .where(sql`${b2bPlanQuotas.b2bPlanId} IN (${sql.join(planIds.map(id => sql`${id}`), sql`, `)})`)
      : [];

    const plansWithQuotas = allPlans.map((plan) => ({
      ...plan,
      quotas: quotas.filter((q) => q.b2bPlanId === plan.id),
    }));

    return adminPaginatedResponse(plansWithQuotas, { page, limit, total });
  } catch (error) {
    log.error('Failed to fetch B2B plans', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to fetch B2B plans');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { name, slug, description, priceMonthlyCents, priceYearlyCents, isActive, metadata } = body;

    if (!name || !slug) {
      return adminErrorResponse('VALIDATION', 'Name and slug are required', 400);
    }

    const [newPlan] = await db
      .insert(b2bPlans)
      .values({
        name,
        slug,
        description: description ?? null,
        priceMonthlyCents: priceMonthlyCents ?? null,
        priceYearlyCents: priceYearlyCents ?? null,
        isActive: isActive ?? true,
        metadata: metadata ?? {},
      } as typeof b2bPlans.$inferInsert)
      .returning();

    return adminResponse(newPlan, 201);
  } catch (error: unknown) {
    if (error instanceof Error && (error.message.includes('b2b_plans_slug_unique') || error.message.includes('unique constraint'))) {
      return adminErrorResponse('CONFLICT', 'A plan with this slug already exists', 409);
    }
    log.error('Failed to create B2B plan', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to create B2B plan');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return adminErrorResponse('VALIDATION', 'Plan ID is required', 400);
    }

    // Only allow known fields
    const allowedFields = ['name', 'slug', 'description', 'priceMonthlyCents', 'priceYearlyCents', 'isActive', 'metadata'];
    const setValues: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, val] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setValues[key] = val;
      }
    }

    const [updated] = await db
      .update(b2bPlans)
      .set(setValues)
      .where(eq(b2bPlans.id, id))
      .returning();

    if (!updated) {
      return adminErrorResponse('NOT_FOUND', 'B2B plan not found', 404);
    }

    return adminResponse(updated);
  } catch (error) {
    log.error('Failed to update B2B plan', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to update B2B plan');
  }
}

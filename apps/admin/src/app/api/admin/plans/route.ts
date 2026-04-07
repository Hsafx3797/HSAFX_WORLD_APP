/**
 * Plans API Route
 * GET /api/admin/plans — List all plans
 * POST /api/admin/plans — Create a plan
 * PATCH /api/admin/plans — Update a plan (pass id in body)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, plans, planLimits, planFeatures, eq, desc, sql } from '@hsafx/db';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminErrorResponse } from '@/lib/admin-response';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('admin-plans');

export async function GET() {
  try {
    const authResult = await requireAdminRole('billing.view');
    if (authResult instanceof NextResponse) return authResult;

    const allPlans = await db
      .select()
      .from(plans)
      .orderBy(plans.createdAt);

    // Fetch limits for each plan
    const planIds = allPlans.map((p) => p.id);
    const limits = planIds.length > 0
      ? await db.select().from(planLimits).where(sql`${planLimits.planId} IN (${sql.join(planIds.map(id => sql`${id}`), sql`, `)})`)
      : [];

    const plansWithLimits = allPlans.map((plan) => ({
      ...plan,
      limits: limits.filter((l) => l.planId === plan.id),
    }));

    return adminResponse(plansWithLimits);
  } catch (error) {
    log.error('Failed to fetch plans', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to fetch plans', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('billing.adjust');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { name, slug, description, priceMonthlyCents, priceYearlyCents, coinGrant, polarProductId, isActive } = body;

    if (!name || !slug) {
      return adminErrorResponse('VALIDATION', 'Name and slug are required', 400);
    }

    const [newPlan] = await db
      .insert(plans)
      .values({
        name,
        slug,
        description: description ?? null,
        priceMonthlyCents: priceMonthlyCents ?? 0,
        priceYearlyCents: priceYearlyCents ?? 0,
        coinGrant: coinGrant ?? 0,
        polarProductId: polarProductId ?? null,
        isActive: isActive ?? true,
      } as typeof plans.$inferInsert)
      .returning();

    return adminResponse(newPlan, 201);
  } catch (error) {
    log.error('Failed to create plan', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to create plan', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('billing.adjust');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return adminErrorResponse('VALIDATION', 'Plan ID is required', 400);
    }

    const [updated] = await db
      .update(plans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();

    if (!updated) {
      return adminErrorResponse('NOT_FOUND', 'Plan not found', 404);
    }

    return adminResponse(updated);
  } catch (error) {
    log.error('Failed to update plan', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to update plan', 500);
  }
}

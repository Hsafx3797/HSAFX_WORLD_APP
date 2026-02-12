/**
 * Plans API Route
 * GET /api/admin/plans — List all plans
 * POST /api/admin/plans — Create a plan
 * PATCH /api/admin/plans — Update a plan (pass id in body)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, plans, planLimits, planFeatures, eq, desc, sql } from '@hsafx/db';

export async function GET() {
  try {
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

    return NextResponse.json({ success: true, data: plansWithLimits });
  } catch (error) {
    console.error('[Plans API] GET error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch plans' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, priceMonthlyCents, priceYearlyCents, coinGrant, polarProductId, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Name and slug are required' } }, { status: 400 });
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

    return NextResponse.json({ success: true, data: newPlan }, { status: 201 });
  } catch (error) {
    console.error('[Plans API] POST error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create plan' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Plan ID is required' } }, { status: 400 });
    }

    const [updated] = await db
      .update(plans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[Plans API] PATCH error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update plan' } }, { status: 500 });
  }
}

/**
 * Subscriptions API Routes
 * GET   /api/admin/subscriptions — List subscriptions with pagination & filters
 * PATCH /api/admin/subscriptions — Admin override: change status, plan, extend period
 *
 * Real database implementation using Drizzle ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, users, subscriptions, plans, activityLogs, eq, and, or, sql, desc, asc } from '@hsafx/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search')?.toLowerCase();
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    
    // Status filter
    if (status) {
      conditions.push(eq(subscriptions.status, status));
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query subscriptions with user and plan info
    const subscriptionsQuery = db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        userEmail: users.email,
        userName: users.fullName,
        planId: subscriptions.planId,
        planSlug: plans.slug,
        planName: plans.name,
        status: subscriptions.status,
        billingCycle: subscriptions.billingCycle,
        priceMonthly: plans.priceMonthly,
        priceYearly: plans.priceYearly,
        provider: sql<string>`'polar'`, // Default provider
        providerId: subscriptions.polarSubscriptionId,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        canceledAt: subscriptions.canceledAt,
        trialStart: subscriptions.trialStart,
        trialEnd: subscriptions.trialEnd,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(whereClause)
      .orderBy(
        sortOrder === 'desc'
          ? desc(subscriptions.createdAt)
          : asc(subscriptions.createdAt)
      )
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subscriptions)
      .where(whereClause);

    // Execute queries in parallel
    const [subscriptionResults, countResults] = await Promise.all([
      subscriptionsQuery,
      countQuery,
    ]);

    // Transform results to match expected format
    let enrichedSubscriptions = subscriptionResults.map((sub) => ({
      id: sub.id,
      userId: sub.userId,
      userEmail: sub.userEmail,
      userName: sub.userName || 'Unknown',
      plan: sub.planSlug,
      planName: sub.planName,
      status: sub.status,
      billingCycle: sub.billingCycle,
      amount: sub.billingCycle === 'yearly' 
        ? Number(sub.priceYearly) || 0
        : Number(sub.priceMonthly) || 0,
      provider: sub.provider,
      providerId: sub.providerId,
      currentPeriodStart: sub.currentPeriodStart?.toISOString(),
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt?.toISOString(),
      trialStart: sub.trialStart?.toISOString(),
      trialEnd: sub.trialEnd?.toISOString(),
      createdAt: sub.createdAt?.toISOString(),
      updatedAt: sub.updatedAt?.toISOString(),
    }));

    // Apply search filter (after join)
    if (search) {
      enrichedSubscriptions = enrichedSubscriptions.filter(
        (s) =>
          (s.userName?.toLowerCase() || '').includes(search) ||
          (s.userEmail?.toLowerCase() || '').includes(search)
      );
    }

    // Apply plan filter
    if (plan) {
      enrichedSubscriptions = enrichedSubscriptions.filter((s) => s.plan === plan);
    }

    const total = countResults[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: enrichedSubscriptions,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return NextResponse.json(
      { code: 'FETCH_ERROR', message: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/subscriptions
 * Admin override for a subscription: change status, plan, extend period, cancel.
 *
 * Body: { id: string, status?, planId?, currentPeriodEnd?, cancelAtPeriodEnd?, canceledAt? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body as { id?: string; [k: string]: unknown };

    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const allowedFields: Record<string, string> = {
      status: 'status',
      planId: 'planId',
      billingCycle: 'billingCycle',
      currentPeriodEnd: 'currentPeriodEnd',
      cancelAtPeriodEnd: 'cancelAtPeriodEnd',
      canceledAt: 'canceledAt',
    };

    const setValues: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, val] of Object.entries(updates)) {
      if (key in allowedFields) {
        // Convert date strings to Date objects for timestamp fields
        if ((key === 'currentPeriodEnd' || key === 'canceledAt') && typeof val === 'string') {
          setValues[allowedFields[key]] = new Date(val);
        } else {
          setValues[allowedFields[key]] = val;
        }
      }
    }

    // Validate planId exists if changing plan
    if (updates.planId) {
      const [planExists] = await db
        .select({ id: plans.id })
        .from(plans)
        .where(eq(plans.id, updates.planId as string))
        .limit(1);
      if (!planExists) {
        return NextResponse.json(
          { code: 'INVALID_PLAN', message: 'Plan not found' },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(subscriptions)
      .set(setValues)
      .where(eq(subscriptions.id, id))
      .returning({
        id: subscriptions.id,
        userId: subscriptions.userId,
        planId: subscriptions.planId,
        status: subscriptions.status,
        billingCycle: subscriptions.billingCycle,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        updatedAt: subscriptions.updatedAt,
      });

    if (!updated) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Audit log
    await db.insert(activityLogs).values({
      userId: updated.userId,
      action: 'subscription_admin_override',
      resource: 'subscription',
      resourceId: id,
      metadata: JSON.stringify({ fields: Object.keys(updates) }),
    } as typeof activityLogs.$inferInsert);

    return NextResponse.json({
      id: updated.id,
      userId: updated.userId,
      planId: updated.planId,
      status: updated.status,
      billingCycle: updated.billingCycle,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      currentPeriodEnd: updated.currentPeriodEnd?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Failed to update subscription:', error);
    return NextResponse.json(
      { code: 'UPDATE_ERROR', message: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

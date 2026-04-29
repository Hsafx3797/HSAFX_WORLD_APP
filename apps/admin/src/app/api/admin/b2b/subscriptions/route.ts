/**
 * B2B Subscriptions API Route
 * GET   /api/admin/b2b/subscriptions — List B2B subscriptions with pagination & filters
 * POST  /api/admin/b2b/subscriptions — Create a B2B subscription for a user
 * PATCH /api/admin/b2b/subscriptions — Update a B2B subscription (change status, plan, period)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db, b2bSubscriptions, b2bPlans, users,
  eq, and, desc, asc, sql, ilike, or,
} from '@hsafx/db';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminPaginatedResponse, adminErrorResponse } from '@/lib/admin-response';
import { createLogger } from '@hsafx/shared/logger';
import { logB2bAudit } from '@/lib/b2b-audit';

const log = createLogger('admin-b2b-subscriptions');

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.view');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status) {
      conditions.push(eq(b2bSubscriptions.status, status as typeof b2bSubscriptions.status.enumValues[number]));
    }
    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
        ),
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build base query with joins (needed for search on user fields)
    const baseQuery = db
      .select({
        id: b2bSubscriptions.id,
        userId: b2bSubscriptions.userId,
        userEmail: users.email,
        userName: users.name,
        b2bPlanId: b2bSubscriptions.b2bPlanId,
        planName: b2bPlans.name,
        planSlug: b2bPlans.slug,
        status: b2bSubscriptions.status,
        billingCycle: b2bSubscriptions.billingCycle,
        currentPeriodStart: b2bSubscriptions.currentPeriodStart,
        currentPeriodEnd: b2bSubscriptions.currentPeriodEnd,
        resetDayOfMonth: b2bSubscriptions.resetDayOfMonth,
        cancelAtPeriodEnd: b2bSubscriptions.cancelAtPeriodEnd,
        canceledAt: b2bSubscriptions.canceledAt,
        createdAt: b2bSubscriptions.createdAt,
        updatedAt: b2bSubscriptions.updatedAt,
      })
      .from(b2bSubscriptions)
      .innerJoin(users, eq(b2bSubscriptions.userId, users.id))
      .innerJoin(b2bPlans, eq(b2bSubscriptions.b2bPlanId, b2bPlans.id))
      .where(whereClause);

    const [data, countResult] = await Promise.all([
      baseQuery
        .orderBy(sortOrder === 'desc' ? desc(b2bSubscriptions.createdAt) : asc(b2bSubscriptions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(b2bSubscriptions)
        .innerJoin(users, eq(b2bSubscriptions.userId, users.id))
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return adminPaginatedResponse(data, { page, limit, total });
  } catch (error) {
    log.error('Failed to fetch B2B subscriptions', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to fetch B2B subscriptions');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { userId, b2bPlanId, billingCycle, currentPeriodStart, currentPeriodEnd, resetDayOfMonth } = body;

    if (!userId || !b2bPlanId || !billingCycle || !currentPeriodStart || !currentPeriodEnd) {
      return adminErrorResponse('VALIDATION', 'userId, b2bPlanId, billingCycle, currentPeriodStart, and currentPeriodEnd are required', 400);
    }

    // Verify plan exists
    const [plan] = await db.select({ id: b2bPlans.id }).from(b2bPlans).where(eq(b2bPlans.id, b2bPlanId)).limit(1);
    if (!plan) {
      return adminErrorResponse('NOT_FOUND', 'B2B plan not found', 400);
    }

    // Verify user exists
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return adminErrorResponse('NOT_FOUND', 'User not found', 400);
    }

    // Check for existing active subscription
    const [existing] = await db
      .select({ id: b2bSubscriptions.id })
      .from(b2bSubscriptions)
      .where(and(eq(b2bSubscriptions.userId, userId), eq(b2bSubscriptions.status, 'active')))
      .limit(1);
    if (existing) {
      return adminErrorResponse('CONFLICT', 'User already has an active subscription. Deactivate existing first.', 409);
    }

    const [newSub] = await db
      .insert(b2bSubscriptions)
      .values({
        userId,
        b2bPlanId,
        status: 'active',
        billingCycle,
        currentPeriodStart: new Date(currentPeriodStart),
        currentPeriodEnd: new Date(currentPeriodEnd),
        resetDayOfMonth: resetDayOfMonth ?? 1,
      } as typeof b2bSubscriptions.$inferInsert)
      .returning();

    await logB2bAudit({ userId: authResult.userId, action: 'create', resource: 'b2b_subscription', resourceId: newSub.id, actionDetail: `Created subscription for user ${userId}`, changes: { after: { userId, b2bPlanId, billingCycle } } });

    return adminResponse(newSub, 201);
  } catch (error: unknown) {
    // Unique constraint = user already has an active subscription
    if (error instanceof Error && error.message.includes('b2b_sub_user_active_idx')) {
      return adminErrorResponse('CONFLICT', 'User already has an active B2B subscription', 409);
    }
    log.error('Failed to create B2B subscription', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to create B2B subscription');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return adminErrorResponse('VALIDATION', 'Subscription ID is required', 400);
    }

    const allowedFields: Record<string, boolean> = {
      status: true,
      b2bPlanId: true,
      billingCycle: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      resetDayOfMonth: true,
      cancelAtPeriodEnd: true,
      canceledAt: true,
    };

    const setValues: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, val] of Object.entries(updates)) {
      if (allowedFields[key]) {
        if (['currentPeriodStart', 'currentPeriodEnd', 'canceledAt'].includes(key) && typeof val === 'string') {
          setValues[key] = new Date(val);
        } else {
          setValues[key] = val;
        }
      }
    }

    // Validate plan if changing
    if (updates.b2bPlanId) {
      const [planExists] = await db.select({ id: b2bPlans.id }).from(b2bPlans).where(eq(b2bPlans.id, updates.b2bPlanId)).limit(1);
      if (!planExists) {
        return adminErrorResponse('NOT_FOUND', 'B2B plan not found', 400);
      }
    }

    // If reactivating, ensure no other active subscription exists for this user
    if (updates.status === 'active') {
      const [current] = await db
        .select({ userId: b2bSubscriptions.userId })
        .from(b2bSubscriptions)
        .where(eq(b2bSubscriptions.id, id))
        .limit(1);
      if (current) {
        const [existing] = await db
          .select({ id: b2bSubscriptions.id })
          .from(b2bSubscriptions)
          .where(
            and(
              eq(b2bSubscriptions.userId, current.userId),
              eq(b2bSubscriptions.status, 'active'),
              sql`${b2bSubscriptions.id} != ${id}`,
            ),
          )
          .limit(1);
        if (existing) {
          return adminErrorResponse('CONFLICT', 'User already has an active subscription. Deactivate existing first.', 409);
        }
      }
    }

    const [updated] = await db
      .update(b2bSubscriptions)
      .set(setValues)
      .where(eq(b2bSubscriptions.id, id))
      .returning();

    if (!updated) {
      return adminErrorResponse('NOT_FOUND', 'B2B subscription not found', 404);
    }

    await logB2bAudit({ userId: authResult.userId, action: 'update', resource: 'b2b_subscription', resourceId: id, actionDetail: `Updated subscription`, changes: { updates: Object.keys(setValues).filter(k => k !== 'updatedAt') } });

    return adminResponse(updated);
  } catch (error) {
    log.error('Failed to update B2B subscription', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to update B2B subscription');
  }
}

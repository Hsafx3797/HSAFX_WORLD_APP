/**
 * Users API Routes
 * GET    /api/admin/users — List users with pagination & filters
 * PATCH  /api/admin/users — Update user (role, ban/suspend, etc.)
 * DELETE /api/admin/users — Soft-delete user
 *
 * Real database implementation using Drizzle ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, users, subscriptions, plans, coinTransactions, toolExecutions, userCoinWallets, activityLogs, eq, and, or, sql, desc, asc } from '@hsafx/db';
import { createLogger } from '@hsafx/shared/logger';
import { requireAdminRole } from '@/lib/require-admin';

const log = createLogger('admin-users');

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole();
    if (authResult instanceof NextResponse) return authResult;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search')?.toLowerCase();
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    
    // Exclude soft-deleted users
    conditions.push(sql`${users.deletedAt} IS NULL`);
    
    // Search filter
    if (search) {
      conditions.push(
        or(
          sql`LOWER(${users.email}) LIKE ${`%${search}%`}`,
          sql`LOWER(${users.fullName}) LIKE ${`%${search}%`}`,
          sql`LOWER(${users.username}) LIKE ${`%${search}%`}`
        )
      );
    }
    
    // Status filter
    if (status === 'active') {
      conditions.push(eq(users.isActive, true));
    } else if (status === 'suspended' || status === 'banned') {
      conditions.push(eq(users.isActive, false));
    }

    // Tier filter applied at query level via subscription join
    if (tier && tier !== 'free') {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM subscriptions s
        JOIN plans p ON p.id = s.plan_id
        WHERE s.user_id = ${users.id} AND s.status = 'active' AND p.slug = ${tier}
      )`);
    } else if (tier === 'free') {
      conditions.push(sql`NOT EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = ${users.id} AND s.status = 'active'
      )`);
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Subqueries for enrichment — eliminates N+1
    const planSubquery = sql<string>`(
      SELECT p.slug FROM subscriptions s
      JOIN plans p ON p.id = s.plan_id
      WHERE s.user_id = ${users.id} AND s.status = 'active'
      LIMIT 1
    )`;

    const balanceSubquery = sql<number>`COALESCE((
      SELECT w.balance FROM user_coin_wallets w
      WHERE w.user_id = ${users.id}
      LIMIT 1
    ), 0)`;

    const execCountSubquery = sql<number>`(
      SELECT COUNT(*) FROM tool_executions te
      WHERE te.user_id = ${users.id}
    )`;

    // Single query with all enrichment data
    const usersQuery = db
      .select({
        id: users.id,
        email: users.email,
        name: users.fullName,
        displayName: users.username,
        avatarUrl: users.avatarUrl,
        status: sql<string>`CASE WHEN ${users.isActive} = true THEN 'active' ELSE 'suspended' END`,
        emailVerified: users.isEmailVerified,
        lastActiveAt: users.lastLogin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        tier: sql<string>`COALESCE(${planSubquery}, 'free')`,
        coinBalance: balanceSubquery,
        totalExecutions: execCountSubquery,
      })
      .from(users)
      .where(whereClause)
      .orderBy(sortOrder === 'desc' ? desc(users.createdAt) : asc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(whereClause);

    // Execute queries in parallel
    const [userResults, countResults] = await Promise.all([
      usersQuery,
      countQuery,
    ]);

    const enrichedUsers = userResults.map((user) => ({
      ...user,
      usageCount: user.totalExecutions,
      subscription: user.tier !== 'free' ? { plan: user.tier } : undefined,
    }));

    const total = countResults[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: enrichedUsers,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    log.error('Failed to fetch users', { error: String(error) });
    return NextResponse.json(
      { code: 'FETCH_ERROR', message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update a user: status (ban/unban), isActive, fullName, email
 *
 * Body: { id: string, isActive?: boolean, fullName?: string, email?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdminRole();
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, ...updates } = body as { id?: string; [k: string]: unknown };

    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Only allow specific fields to be updated
    const allowedFields: Record<string, keyof typeof users> = {
      isActive: 'isActive',
      fullName: 'fullName',
      email: 'email',
      username: 'username',
      isEmailVerified: 'isEmailVerified',
    };

    const setValues: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, val] of Object.entries(updates)) {
      if (key in allowedFields) {
        setValues[allowedFields[key] as string] = val;
      }
    }

    const [updated] = await db
      .update(users)
      .set(setValues)
      .where(and(eq(users.id, id), sql`${users.deletedAt} IS NULL`))
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        isActive: users.isActive,
        updatedAt: users.updatedAt,
      });

    if (!updated) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }

    // Audit log
    await db.insert(activityLogs).values({
      action: updates.isActive === false ? 'user_suspended' : 'user_updated',
      resource: 'user',
      resourceId: id,
      metadata: JSON.stringify({ fields: Object.keys(updates) }),
    } as typeof activityLogs.$inferInsert);

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt?.toISOString(),
    });
  } catch (error) {
    log.error('Failed to update user', { error: String(error) });
    return NextResponse.json(
      { code: 'UPDATE_ERROR', message: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Soft-delete a user by setting deletedAt + isActive = false
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdminRole();
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id } = body as { id?: string };

    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'User ID is required' },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .update(users)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() } as Partial<typeof users.$inferInsert>)
      .where(and(eq(users.id, id), sql`${users.deletedAt} IS NULL`))
      .returning({ id: users.id });

    if (!deleted) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'User not found or already deleted' },
        { status: 404 }
      );
    }

    // Audit log
    await db.insert(activityLogs).values({
      action: 'user_deleted',
      resource: 'user',
      resourceId: id,
    } as typeof activityLogs.$inferInsert);

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    log.error('Failed to delete user', { error: String(error) });
    return NextResponse.json(
      { code: 'DELETE_ERROR', message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

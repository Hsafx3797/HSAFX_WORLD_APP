/**
 * API Keys Admin Route
 * GET /api/admin/api-keys — List all api keys
 * PATCH /api/admin/api-keys — Revoke/update an api key
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, apiKeys, users, eq, desc, sql } from '@hsafx/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const search = searchParams.get('search')?.toLowerCase();
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(
        sql`(LOWER(${apiKeys.name}) LIKE ${`%${search}%`} OR LOWER(${apiKeys.keyPrefix}) LIKE ${`%${search}%`})`
      );
    }

    const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const [keys, countResult] = await Promise.all([
      db
        .select({
          id: apiKeys.id,
          userId: apiKeys.userId,
          userEmail: users.email,
          userName: users.fullName,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          lastUsed: apiKeys.lastUsed,
          expiresAt: apiKeys.expiresAt,
          isActive: apiKeys.isActive,
          rateLimitTier: apiKeys.rateLimitTier,
          createdAt: apiKeys.createdAt,
          revokedAt: apiKeys.revokedAt,
        })
        .from(apiKeys)
        .leftJoin(users, eq(apiKeys.userId, users.id))
        .where(whereClause)
        .orderBy(desc(apiKeys.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(apiKeys)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        data: keys,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API Keys] GET error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch API keys' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive, revokedAt } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'API key ID required' } }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (revokedAt !== undefined) updates.revokedAt = revokedAt ? new Date(revokedAt) : null;

    // If revoking, also deactivate
    if (revokedAt) {
      updates.isActive = false;
      updates.revokedAt = new Date();
    }

    const [updated] = await db
      .update(apiKeys)
      .set(updates)
      .where(eq(apiKeys.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'API key not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[API Keys] PATCH error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update API key' } }, { status: 500 });
  }
}

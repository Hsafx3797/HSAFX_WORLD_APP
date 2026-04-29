/**
 * API Keys Admin Route
 * GET /api/admin/api-keys — List all api keys
 * PATCH /api/admin/api-keys — Revoke/update an api key
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, apiKeys, users, eq, desc, sql } from '@hsafx/db';
import { createLogger } from '@hsafx/shared/logger';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminPaginatedResponse, adminErrorResponse } from '@/lib/admin-response';

const log = createLogger('admin-api-keys');

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('admin.view');
    if (authResult instanceof NextResponse) return authResult;
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
          userName: users.name,
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

    return adminPaginatedResponse(keys, { page, limit, total });
  } catch (error) {
    log.error('GET error', { error: String(error) });
    return adminErrorResponse('INTERNAL', 'Failed to fetch API keys', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('admin.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, isActive, revokedAt } = body;

    if (!id) {
      return adminErrorResponse('VALIDATION', 'API key ID required', 400);
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
      return adminErrorResponse('NOT_FOUND', 'API key not found', 404);
    }

    return adminResponse(updated);
  } catch (error) {
    log.error('PATCH error', { error: String(error) });
    return adminErrorResponse('INTERNAL', 'Failed to update API key', 500);
  }
}

/**
 * B2B Suite Categories API Route
 * GET    /api/admin/b2b/suite-categories — List all category→suite mappings
 * POST   /api/admin/b2b/suite-categories — Map a category to a suite
 * DELETE /api/admin/b2b/suite-categories — Remove a mapping (pass id in body)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, b2bSuiteCategories, b2bSuites, eq, sql } from '@hsafx/db';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminPaginatedResponse, adminErrorResponse } from '@/lib/admin-response';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('admin-b2b-suite-categories');

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.view');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const [mappings, countResult] = await Promise.all([
      db
        .select({
          id: b2bSuiteCategories.id,
          b2bSuiteId: b2bSuiteCategories.b2bSuiteId,
          suiteName: b2bSuites.name,
          suiteSlug: b2bSuites.slug,
          category: b2bSuiteCategories.category,
        })
        .from(b2bSuiteCategories)
        .innerJoin(b2bSuites, eq(b2bSuiteCategories.b2bSuiteId, b2bSuites.id))
        .orderBy(b2bSuites.sortOrder, b2bSuiteCategories.category)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(b2bSuiteCategories),
    ]);
    const total = Number(countResult[0]?.count ?? 0);

    return adminPaginatedResponse(mappings, { page, limit, total });
  } catch (error) {
    log.error('Failed to fetch suite-category mappings', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to fetch suite-category mappings');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { b2bSuiteId, category } = body;

    if (!b2bSuiteId || !category) {
      return adminErrorResponse('VALIDATION', 'b2bSuiteId and category are required', 400);
    }

    // Verify suite exists
    const [suite] = await db.select({ id: b2bSuites.id }).from(b2bSuites).where(eq(b2bSuites.id, b2bSuiteId)).limit(1);
    if (!suite) {
      return adminErrorResponse('NOT_FOUND', 'B2B suite not found', 400);
    }

    const [mapping] = await db
      .insert(b2bSuiteCategories)
      .values({ b2bSuiteId, category })
      .returning();

    return adminResponse(mapping, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('unique')) {
      return adminErrorResponse('CONFLICT', 'Category is already mapped to a suite', 409);
    }
    log.error('Failed to create suite-category mapping', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to create suite-category mapping');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return adminErrorResponse('VALIDATION', 'Mapping ID is required', 400);
    }

    const [deleted] = await db
      .delete(b2bSuiteCategories)
      .where(eq(b2bSuiteCategories.id, id))
      .returning();

    if (!deleted) {
      return adminErrorResponse('NOT_FOUND', 'Mapping not found', 404);
    }

    return adminResponse(deleted);
  } catch (error) {
    log.error('Failed to delete suite-category mapping', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to delete suite-category mapping');
  }
}

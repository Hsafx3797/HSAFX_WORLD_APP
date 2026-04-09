/**
 * B2B Suites API Route
 * GET   /api/admin/b2b/suites — List all B2B suites
 * POST  /api/admin/b2b/suites — Create a B2B suite
 * PATCH /api/admin/b2b/suites — Update a B2B suite (pass id in body)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, b2bSuites, b2bSuiteCategories, eq, sql } from '@hsafx/db';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminPaginatedResponse, adminErrorResponse } from '@/lib/admin-response';
import { createLogger } from '@hsafx/shared/logger';
import { logB2bAudit } from '@/lib/b2b-audit';

const log = createLogger('admin-b2b-suites');

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.view');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const [allSuites, countResult] = await Promise.all([
      db
        .select()
        .from(b2bSuites)
        .orderBy(b2bSuites.sortOrder)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(b2bSuites),
    ]);
    const total = Number(countResult[0]?.count ?? 0);

    // Fetch category mappings for each suite
    const suiteIds = allSuites.map((s) => s.id);
    const categories = suiteIds.length > 0
      ? await db
          .select()
          .from(b2bSuiteCategories)
          .where(sql`${b2bSuiteCategories.b2bSuiteId} IN (${sql.join(suiteIds.map(id => sql`${id}`), sql`, `)})`)
      : [];

    const suitesWithCategories = allSuites.map((suite) => ({
      ...suite,
      categories: categories.filter((c) => c.b2bSuiteId === suite.id).map((c) => c.category),
    }));

    return adminPaginatedResponse(suitesWithCategories, { page, limit, total });
  } catch (error) {
    log.error('Failed to fetch B2B suites', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to fetch B2B suites');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { slug, name, description, isActive, sortOrder } = body;

    if (!slug || !name) {
      return adminErrorResponse('VALIDATION', 'Slug and name are required', 400);
    }

    const [newSuite] = await db
      .insert(b2bSuites)
      .values({
        slug,
        name,
        description: description ?? null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      } as typeof b2bSuites.$inferInsert)
      .returning();

    await logB2bAudit({ userId: authResult.userId, action: 'create', resource: 'b2b_suite', resourceId: newSuite.id, actionDetail: `Created suite: ${name}`, changes: { after: { slug, name } } });

    return adminResponse(newSuite, 201);
  } catch (error: unknown) {
    if (error instanceof Error && (error.message.includes('b2b_suites_slug_unique') || error.message.includes('unique constraint'))) {
      return adminErrorResponse('CONFLICT', 'A suite with this slug already exists', 409);
    }
    log.error('Failed to create B2B suite', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to create B2B suite');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return adminErrorResponse('VALIDATION', 'Suite ID is required', 400);
    }

    const allowedFields = ['slug', 'name', 'description', 'isActive', 'sortOrder'];
    const setValues: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, val] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setValues[key] = val;
      }
    }

    const [updated] = await db
      .update(b2bSuites)
      .set(setValues)
      .where(eq(b2bSuites.id, id))
      .returning();

    if (!updated) {
      return adminErrorResponse('NOT_FOUND', 'B2B suite not found', 404);
    }

    await logB2bAudit({ userId: authResult.userId, action: 'update', resource: 'b2b_suite', resourceId: id, actionDetail: `Updated suite`, changes: { updates: Object.keys(setValues).filter(k => k !== 'updatedAt') } });

    return adminResponse(updated);
  } catch (error) {
    log.error('Failed to update B2B suite', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to update B2B suite');
  }
}

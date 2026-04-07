/**
 * B2B Tool Suite Overrides API Route
 * GET    /api/admin/b2b/tool-overrides — List all per-tool suite overrides
 * POST   /api/admin/b2b/tool-overrides — Add a tool→suite override
 * DELETE /api/admin/b2b/tool-overrides — Remove an override (pass id in body)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, b2bToolSuiteOverrides, b2bSuites, tools, eq, sql } from '@hsafx/db';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminPaginatedResponse, adminErrorResponse } from '@/lib/admin-response';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('admin-b2b-tool-overrides');

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.view');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const [overrides, countResult] = await Promise.all([
      db
        .select({
          id: b2bToolSuiteOverrides.id,
          toolId: b2bToolSuiteOverrides.toolId,
          toolSlug: tools.slug,
          toolName: tools.name,
          b2bSuiteId: b2bToolSuiteOverrides.b2bSuiteId,
          suiteName: b2bSuites.name,
          suiteSlug: b2bSuites.slug,
          createdAt: b2bToolSuiteOverrides.createdAt,
        })
        .from(b2bToolSuiteOverrides)
        .innerJoin(tools, eq(b2bToolSuiteOverrides.toolId, tools.id))
        .innerJoin(b2bSuites, eq(b2bToolSuiteOverrides.b2bSuiteId, b2bSuites.id))
        .orderBy(tools.name)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(b2bToolSuiteOverrides),
    ]);
    const total = Number(countResult[0]?.count ?? 0);

    return adminPaginatedResponse(overrides, { page, limit, total });
  } catch (error) {
    log.error('Failed to fetch tool-suite overrides', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to fetch tool-suite overrides');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { toolId, b2bSuiteId } = body;

    if (!toolId || !b2bSuiteId) {
      return adminErrorResponse('VALIDATION', 'toolId and b2bSuiteId are required', 400);
    }

    // Verify tool exists
    const [tool] = await db.select({ id: tools.id }).from(tools).where(eq(tools.id, toolId)).limit(1);
    if (!tool) {
      return adminErrorResponse('NOT_FOUND', 'Tool not found', 400);
    }

    // Verify suite exists
    const [suite] = await db.select({ id: b2bSuites.id }).from(b2bSuites).where(eq(b2bSuites.id, b2bSuiteId)).limit(1);
    if (!suite) {
      return adminErrorResponse('NOT_FOUND', 'B2B suite not found', 400);
    }

    const [override] = await db
      .insert(b2bToolSuiteOverrides)
      .values({ toolId, b2bSuiteId })
      .returning();

    return adminResponse(override, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('b2b_tso_tool_id_idx')) {
      return adminErrorResponse('CONFLICT', 'This tool already has a suite override', 409);
    }
    log.error('Failed to create tool-suite override', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to create tool-suite override');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return adminErrorResponse('VALIDATION', 'Override ID is required', 400);
    }

    const [deleted] = await db
      .delete(b2bToolSuiteOverrides)
      .where(eq(b2bToolSuiteOverrides.id, id))
      .returning();

    if (!deleted) {
      return adminErrorResponse('NOT_FOUND', 'Override not found', 404);
    }

    return adminResponse(deleted);
  } catch (error) {
    log.error('Failed to delete tool-suite override', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to delete tool-suite override');
  }
}

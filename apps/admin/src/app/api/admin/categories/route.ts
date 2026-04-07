/**
 * Categories API Routes
 * GET    /api/admin/categories — List categories with tool counts
 * POST   /api/admin/categories — Create category
 * PATCH  /api/admin/categories — Update category
 * DELETE /api/admin/categories — Delete category (only if no tools attached)
 *
 * Real database implementation using Drizzle ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, toolCategories, tools, eq, sql, asc } from '@hsafx/db';
import { createLogger } from '@hsafx/shared/logger';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminErrorResponse } from '@/lib/admin-response';

const log = createLogger('admin-categories');

export async function GET() {
  try {
    const authResult = await requireAdminRole('tools.view');
    if (authResult instanceof NextResponse) return authResult;

    // Query categories with tool counts
    const categoriesWithCounts = await db
      .select({
        id: toolCategories.id,
        name: toolCategories.name,
        slug: toolCategories.slug,
        description: toolCategories.description,
        icon: toolCategories.icon,
        sortOrder: toolCategories.sortOrder,
        isActive: toolCategories.isActive,
        createdAt: toolCategories.createdAt,
        updatedAt: toolCategories.updatedAt,
        toolCount: sql<number>`COUNT(${tools.id})`.as('toolCount'),
      })
      .from(toolCategories)
      .leftJoin(tools, eq(tools.categoryId, toolCategories.id))
      .groupBy(toolCategories.id)
      .orderBy(asc(toolCategories.sortOrder));

    // Format the response
    const formattedCategories = categoriesWithCounts.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      toolCount: cat.toolCount ?? 0,
      order: cat.sortOrder,
      enabled: cat.isActive,
      createdAt: cat.createdAt?.toISOString(),
      updatedAt: cat.updatedAt?.toISOString(),
    }));

    return adminResponse(formattedCategories);
  } catch (error) {
    log.error('Failed to fetch categories', { error: String(error) });
    return adminErrorResponse('FETCH_ERROR', 'Failed to fetch categories');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('tools.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { name, slug, description, icon, order } = body;

    if (!name || !slug) {
      return adminErrorResponse('VALIDATION_ERROR', 'Name and slug are required', 400);
    }

    // Check if slug already exists
    const existingCategory = await db
      .select({ id: toolCategories.id })
      .from(toolCategories)
      .where(eq(toolCategories.slug, slug))
      .limit(1);

    if (existingCategory.length > 0) {
      return adminErrorResponse('DUPLICATE_SLUG', 'Category with this slug already exists', 409);
    }

    // Insert new category - use type assertion to work around drizzle type inference issues
    const [newCategory] = await db
      .insert(toolCategories)
      .values({
        name,
        slug,
        description: description || null,
        icon: icon || null,
        sortOrder: order || 999,
        isActive: true,
      } as typeof toolCategories.$inferInsert)
      .returning();

    return adminResponse(
      {
        id: newCategory.id,
        name: newCategory.name,
        slug: newCategory.slug,
        description: newCategory.description,
        icon: newCategory.icon,
        order: newCategory.sortOrder,
        enabled: newCategory.isActive,
        createdAt: newCategory.createdAt?.toISOString(),
        updatedAt: newCategory.updatedAt?.toISOString(),
      },
      201,
    );
  } catch (error) {
    log.error('Failed to create category', { error: String(error) });
    return adminErrorResponse('CREATE_ERROR', 'Failed to create category');
  }
}

/**
 * PATCH /api/admin/categories
 * Update a category: name, description, icon, sortOrder, isActive
 *
 * Body: { id: string, ...fields }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('tools.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, ...updates } = body as { id?: string; [k: string]: unknown };

    if (!id) {
      return adminErrorResponse('VALIDATION_ERROR', 'Category ID is required', 400);
    }

    const allowedFields: Record<string, string> = {
      name: 'name',
      slug: 'slug',
      description: 'description',
      icon: 'icon',
      order: 'sortOrder',
      sortOrder: 'sortOrder',
      enabled: 'isActive',
      isActive: 'isActive',
    };

    const setValues: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, val] of Object.entries(updates)) {
      if (key in allowedFields) {
        setValues[allowedFields[key]] = val;
      }
    }

    // If changing slug, check for duplicates
    if (updates.slug) {
      const existing = await db
        .select({ id: toolCategories.id })
        .from(toolCategories)
        .where(eq(toolCategories.slug, updates.slug as string))
        .limit(1);
      if (existing.length > 0 && existing[0].id !== id) {
        return adminErrorResponse('DUPLICATE_SLUG', 'Another category with this slug already exists', 409);
      }
    }

    const [updated] = await db
      .update(toolCategories)
      .set(setValues)
      .where(eq(toolCategories.id, id))
      .returning();

    if (!updated) {
      return adminErrorResponse('NOT_FOUND', 'Category not found', 404);
    }

    return adminResponse({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      icon: updated.icon,
      order: updated.sortOrder,
      enabled: updated.isActive,
      updatedAt: updated.updatedAt?.toISOString(),
    });
  } catch (error) {
    log.error('Failed to update category', { error: String(error) });
    return adminErrorResponse('UPDATE_ERROR', 'Failed to update category');
  }
}

/**
 * DELETE /api/admin/categories
 * Delete a category — only if it has no tools attached.
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('tools.manage');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id } = body as { id?: string };

    if (!id) {
      return adminErrorResponse('VALIDATION_ERROR', 'Category ID is required', 400);
    }

    // Check for attached tools
    const [toolCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tools)
      .where(eq(tools.categoryId, id));

    if ((toolCount?.count ?? 0) > 0) {
      return adminErrorResponse('HAS_TOOLS', `Cannot delete category with ${toolCount.count} attached tools. Reassign them first.`, 409);
    }

    const deleted = await db
      .delete(toolCategories)
      .where(eq(toolCategories.id, id))
      .returning({ id: toolCategories.id });

    if (deleted.length === 0) {
      return adminErrorResponse('NOT_FOUND', 'Category not found', 404);
    }

    return adminResponse({ id: deleted[0].id });
  } catch (error) {
    log.error('Failed to delete category', { error: String(error) });
    return adminErrorResponse('DELETE_ERROR', 'Failed to delete category');
  }
}

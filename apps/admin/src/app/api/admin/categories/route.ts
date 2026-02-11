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

export async function GET() {
  try {
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

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { code: 'FETCH_ERROR', message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, icon, order } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingCategory = await db
      .select({ id: toolCategories.id })
      .from(toolCategories)
      .where(eq(toolCategories.slug, slug))
      .limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { code: 'DUPLICATE_SLUG', message: 'Category with this slug already exists' },
        { status: 409 }
      );
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

    return NextResponse.json(
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
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json(
      { code: 'CREATE_ERROR', message: 'Failed to create category' },
      { status: 500 }
    );
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
    const body = await request.json();
    const { id, ...updates } = body as { id?: string; [k: string]: unknown };

    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Category ID is required' },
        { status: 400 }
      );
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
        return NextResponse.json(
          { code: 'DUPLICATE_SLUG', message: 'Another category with this slug already exists' },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(toolCategories)
      .set(setValues)
      .where(eq(toolCategories.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    console.error('Failed to update category:', error);
    return NextResponse.json(
      { code: 'UPDATE_ERROR', message: 'Failed to update category' },
      { status: 500 }
    );
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
    const body = await request.json();
    const { id } = body as { id?: string };

    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check for attached tools
    const [toolCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tools)
      .where(eq(tools.categoryId, id));

    if ((toolCount?.count ?? 0) > 0) {
      return NextResponse.json(
        { code: 'HAS_TOOLS', message: `Cannot delete category with ${toolCount.count} attached tools. Reassign them first.` },
        { status: 409 }
      );
    }

    const deleted = await db
      .delete(toolCategories)
      .where(eq(toolCategories.id, id))
      .returning({ id: toolCategories.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: deleted[0].id });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { code: 'DELETE_ERROR', message: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

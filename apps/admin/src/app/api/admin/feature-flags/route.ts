/**
 * Feature Flags API Routes
 * GET    /api/admin/feature-flags — List all feature flags
 * POST   /api/admin/feature-flags — Create feature flag
 * PATCH  /api/admin/feature-flags — Update / toggle feature flag
 * DELETE /api/admin/feature-flags — Delete feature flag
 *
 * Real database implementation using Drizzle ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, featureFlags, eq, asc } from '@hsafx/db';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('admin-feature-flags');

export async function GET() {
  try {
    // Query all feature flags
    const flags = await db
      .select({
        id: featureFlags.id,
        name: featureFlags.name,
        description: featureFlags.description,
        isEnabled: featureFlags.isEnabled,
        rolloutPercentage: featureFlags.rolloutPercentage,
        targetUsers: featureFlags.targetUsers,
        targetRoles: featureFlags.targetRoles,
        metadata: featureFlags.metadata,
        createdAt: featureFlags.createdAt,
        updatedAt: featureFlags.updatedAt,
      })
      .from(featureFlags)
      .orderBy(asc(featureFlags.name));

    // Format for the frontend
    const formattedFlags = flags.map((flag) => {
      const metadata = (flag.metadata || {}) as Record<string, unknown>;
      return {
        id: flag.id,
        key: flag.name,
        name: (metadata.displayName as string) || flag.name,
        description: flag.description,
        enabled: flag.isEnabled,
        percentage: flag.rolloutPercentage,
        tier: (flag.targetRoles?.length ? flag.targetRoles[0] : undefined) as string | undefined,
        createdAt: flag.createdAt?.toISOString(),
        updatedAt: flag.updatedAt?.toISOString(),
      };
    });

    return NextResponse.json(formattedFlags);
  } catch (error) {
    log.error('Failed to fetch feature flags', { error: String(error) });
    return NextResponse.json(
      { code: 'FETCH_ERROR', message: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, name, description, enabled, percentage, tier } = body;

    if (!key) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Key is required' },
        { status: 400 }
      );
    }

    // Check if key already exists
    const existingFlag = await db
      .select({ id: featureFlags.id })
      .from(featureFlags)
      .where(eq(featureFlags.name, key))
      .limit(1);

    if (existingFlag.length > 0) {
      return NextResponse.json(
        { code: 'DUPLICATE_KEY', message: 'Feature flag with this key already exists' },
        { status: 409 }
      );
    }

    // Insert new feature flag - use type assertion for drizzle type inference
    const [newFlag] = await db
      .insert(featureFlags)
      .values({
        name: key,
        description: description || null,
        isEnabled: enabled ?? false,
        rolloutPercentage: percentage ?? 0,
        targetRoles: tier ? [tier] : [],
        metadata: { displayName: name || key },
      } as typeof featureFlags.$inferInsert)
      .returning();

    return NextResponse.json(
      {
        id: newFlag.id,
        key: newFlag.name,
        name: name || newFlag.name,
        description: newFlag.description,
        enabled: newFlag.isEnabled,
        percentage: newFlag.rolloutPercentage,
        tier: newFlag.targetRoles?.[0],
        createdAt: newFlag.createdAt?.toISOString(),
        updatedAt: newFlag.updatedAt?.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    log.error('Failed to create feature flag', { error: String(error) });
    return NextResponse.json(
      { code: 'CREATE_ERROR', message: 'Failed to create feature flag' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/feature-flags
 * Update or toggle a feature flag.
 *
 * Body: { id: string, enabled?: boolean, description?: string, percentage?: number, tier?: string, name?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body as { id?: string; [k: string]: unknown };

    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Feature flag ID is required' },
        { status: 400 }
      );
    }

    const setValues: Record<string, unknown> = { updatedAt: new Date() };

    if (updates.enabled !== undefined) setValues.isEnabled = updates.enabled;
    if (updates.description !== undefined) setValues.description = updates.description;
    if (updates.percentage !== undefined) setValues.rolloutPercentage = updates.percentage;
    if (updates.tier !== undefined) setValues.targetRoles = updates.tier ? [updates.tier] : [];
    if (updates.name !== undefined) {
      // Update displayName in metadata
      const [existing] = await db
        .select({ metadata: featureFlags.metadata })
        .from(featureFlags)
        .where(eq(featureFlags.id, id))
        .limit(1);

      const currentMetadata = (existing?.metadata || {}) as Record<string, unknown>;
      setValues.metadata = { ...currentMetadata, displayName: updates.name };
    }

    const [updated] = await db
      .update(featureFlags)
      .set(setValues)
      .where(eq(featureFlags.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Feature flag not found' },
        { status: 404 }
      );
    }

    const metadata = (updated.metadata || {}) as Record<string, unknown>;
    return NextResponse.json({
      id: updated.id,
      key: updated.name,
      name: (metadata.displayName as string) || updated.name,
      description: updated.description,
      enabled: updated.isEnabled,
      percentage: updated.rolloutPercentage,
      tier: updated.targetRoles?.[0],
      updatedAt: updated.updatedAt?.toISOString(),
    });
  } catch (error) {
    log.error('Failed to update feature flag', { error: String(error) });
    return NextResponse.json(
      { code: 'UPDATE_ERROR', message: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/feature-flags
 * Delete a feature flag permanently.
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body as { id?: string };

    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Feature flag ID is required' },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(featureFlags)
      .where(eq(featureFlags.id, id))
      .returning({ id: featureFlags.id, name: featureFlags.name });

    if (deleted.length === 0) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Feature flag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: deleted[0].id, key: deleted[0].name });
  } catch (error) {
    log.error('Failed to delete feature flag', { error: String(error) });
    return NextResponse.json(
      { code: 'DELETE_ERROR', message: 'Failed to delete feature flag' },
      { status: 500 }
    );
  }
}

/**
 * System Config API Routes
 * GET /api/admin/config
 * PATCH /api/admin/config
 * 
 * Combines database-backed settings with environment config
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, plans, planLimits, featureFlags, eq } from '@hsafx/db';
import { createLogger } from '@hsafx/shared/logger';
import { publishAdminAlert } from '@hsafx/shared';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminErrorResponse } from '@/lib/admin-response';

const log = createLogger('admin-config');

interface SystemConfig {
  maintenance: {
    enabled: boolean;
    message: string;
    scheduledAt: string | null;
  };
  rateLimit: Record<string, number>;
  coinPricing: {
    basePrice: number;
    bulkDiscounts: Array<{ amount: number; discount: number }>;
  };
  fileUpload: {
    maxSizeMB: number;
    allowedTypes: string[];
  };
  email: {
    provider: string;
    fromAddress: string;
    fromName: string;
  };
  analytics: {
    retentionDays: number;
    enabled: boolean;
  };
}

export async function GET() {
  try {
    const authResult = await requireAdminRole('system.view');
    if (authResult instanceof NextResponse) return authResult;

    // Get rate limits from plan limits table
    const rateLimits = await db
      .select({
        planSlug: plans.slug,
        limitValue: planLimits.limitValue,
      })
      .from(planLimits)
      .innerJoin(plans, eq(planLimits.planId, plans.id))
      .where(eq(planLimits.limitKey, 'api_rate_limit'));

    // Build rate limit config by plan
    const rateLimitConfig: Record<string, number> = {
      anonymous: 10, // Default for unauthenticated
      free: 50,
      pro: 200,
      advance: 1000,
    };

    for (const limit of rateLimits) {
      if (limit.planSlug) {
        rateLimitConfig[limit.planSlug] = limit.limitValue;
      }
    }

    // Get max file size limits by plan
    const fileSizeLimits = await db
      .select({
        planSlug: plans.slug,
        limitValue: planLimits.limitValue,
      })
      .from(planLimits)
      .innerJoin(plans, eq(planLimits.planId, plans.id))
      .where(eq(planLimits.limitKey, 'max_file_size'));

    // Use highest file size limit or default
    const maxFileSizeMB = fileSizeLimits.length > 0
      ? Math.max(...fileSizeLimits.map((l) => l.limitValue))
      : 50;

    // Check maintenance mode feature flag
    const [maintenanceFlag] = await db
      .select({
        isEnabled: featureFlags.isEnabled,
        metadata: featureFlags.metadata,
      })
      .from(featureFlags)
      .where(eq(featureFlags.name, 'maintenance_mode'))
      .limit(1);

    const maintenanceMetadata = (maintenanceFlag?.metadata || {}) as Record<string, unknown>;

    // Build full config (mixing DB data with env config)
    const config: SystemConfig = {
      maintenance: {
        enabled: maintenanceFlag?.isEnabled ?? false,
        message: (maintenanceMetadata.message as string) || '',
        scheduledAt: (maintenanceMetadata.scheduledAt as string) || null,
      },
      rateLimit: rateLimitConfig,
      coinPricing: {
        basePrice: parseFloat(process.env.COIN_BASE_PRICE || '0.01'),
        bulkDiscounts: [
          { amount: 100, discount: 5 },
          { amount: 500, discount: 10 },
          { amount: 1000, discount: 15 },
        ],
      },
      fileUpload: {
        maxSizeMB: maxFileSizeMB,
        allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/*,application/pdf,text/*,application/json').split(','),
      },
      email: {
        provider: process.env.EMAIL_PROVIDER || 'sendgrid',
        fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@hsafx.world',
        fromName: process.env.EMAIL_FROM_NAME || 'HSAFX World',
      },
      analytics: {
        retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10),
        enabled: process.env.ANALYTICS_ENABLED !== 'false',
      },
    };

    return adminResponse(config);
  } catch (error) {
    log.error('Failed to fetch config', { error: String(error) });
    return adminErrorResponse('FETCH_ERROR', 'Failed to fetch config', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('system.config');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { maintenance } = body;

    // Update maintenance mode if provided
    if (maintenance !== undefined) {
      const existingFlag = await db
        .select({ id: featureFlags.id })
        .from(featureFlags)
        .where(eq(featureFlags.name, 'maintenance_mode'))
        .limit(1);

      if (existingFlag.length > 0) {
        // Update existing flag - use type assertion for drizzle type inference
        await db
          .update(featureFlags)
          .set({
            isEnabled: maintenance.enabled ?? false,
            metadata: {
              message: maintenance.message || '',
              scheduledAt: maintenance.scheduledAt || null,
            },
            updatedAt: new Date(),
          } as Partial<typeof featureFlags.$inferInsert>)
          .where(eq(featureFlags.name, 'maintenance_mode'));
      } else {
        // Create new flag - use type assertion for drizzle type inference
        await db.insert(featureFlags).values({
          name: 'maintenance_mode',
          description: 'Enable maintenance mode for the application',
          isEnabled: maintenance.enabled ?? false,
          metadata: {
            message: maintenance.message || '',
            scheduledAt: maintenance.scheduledAt || null,
          },
        } as typeof featureFlags.$inferInsert);
      }
    }

    // Publish real-time alert for maintenance mode changes
    if (maintenance !== undefined) {
      publishAdminAlert({
        alertId: `alert_config_${Date.now()}`,
        type: maintenance.enabled ? 'warning' : 'success',
        title: maintenance.enabled ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
        message: maintenance.message || undefined,
        severity: maintenance.enabled ? 'high' : 'medium',
      });
    }

    return adminResponse({ message: 'Config updated successfully' });
  } catch (error) {
    log.error('Failed to update config', { error: String(error) });
    return adminErrorResponse('UPDATE_ERROR', 'Failed to update config', 500);
  }
}

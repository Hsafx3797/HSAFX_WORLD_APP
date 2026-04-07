/**
 * Coin Packs API Route
 * GET /api/admin/coin-packs — List all coin packs
 * POST /api/admin/coin-packs — Create coin pack
 * PATCH /api/admin/coin-packs — Update coin pack
 * DELETE /api/admin/coin-packs — Delete coin pack (pass id in body)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, coinPacks, eq } from '@hsafx/db';
import { createLogger } from '@hsafx/shared/logger';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminErrorResponse } from '@/lib/admin-response';

const log = createLogger('admin-coin-packs');

export async function GET() {
  try {
    const authResult = await requireAdminRole('billing.view');
    if (authResult instanceof NextResponse) return authResult;

    const packs = await db
      .select()
      .from(coinPacks)
      .orderBy(coinPacks.sortOrder);

    return adminResponse(packs);
  } catch (error) {
    log.error('GET error', { error: String(error) });
    return adminErrorResponse('INTERNAL', 'Failed to fetch coin packs', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('billing.adjust');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { name, coins, priceInCents, bonusCoins, isActive, sortOrder } = body;

    if (!name || coins == null || priceInCents == null) {
      return adminErrorResponse('VALIDATION', 'Name, coins, and price are required', 400);
    }

    const [pack] = await db
      .insert(coinPacks)
      .values({
        name,
        coins,
        priceInCents,
        bonusCoins: bonusCoins ?? 0,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      } as typeof coinPacks.$inferInsert)
      .returning();

    return adminResponse(pack, 201);
  } catch (error) {
    log.error('POST error', { error: String(error) });
    return adminErrorResponse('INTERNAL', 'Failed to create coin pack', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('billing.adjust');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return adminErrorResponse('VALIDATION', 'Coin pack ID is required', 400);
    }

    const [updated] = await db
      .update(coinPacks)
      .set(updates)
      .where(eq(coinPacks.id, id))
      .returning();

    if (!updated) {
      return adminErrorResponse('NOT_FOUND', 'Coin pack not found', 404);
    }

    return adminResponse(updated);
  } catch (error) {
    log.error('PATCH error', { error: String(error) });
    return adminErrorResponse('INTERNAL', 'Failed to update coin pack', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('billing.adjust');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return adminErrorResponse('VALIDATION', 'Coin pack ID is required', 400);
    }

    await db.delete(coinPacks).where(eq(coinPacks.id, id));

    return adminResponse(null);
  } catch (error) {
    log.error('DELETE error', { error: String(error) });
    return adminErrorResponse('INTERNAL', 'Failed to delete coin pack', 500);
  }
}

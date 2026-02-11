/**
 * Coin Packs API Route
 * GET /api/admin/coin-packs — List all coin packs
 * POST /api/admin/coin-packs — Create coin pack
 * PATCH /api/admin/coin-packs — Update coin pack
 * DELETE /api/admin/coin-packs — Delete coin pack (pass id in body)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, coinPacks, eq } from '@hsafx/db';

export async function GET() {
  try {
    const packs = await db
      .select()
      .from(coinPacks)
      .orderBy(coinPacks.sortOrder);

    return NextResponse.json({ success: true, data: packs });
  } catch (error) {
    console.error('[CoinPacks API] GET error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch coin packs' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, coins, priceInCents, bonusCoins, isActive, sortOrder } = body;

    if (!name || coins == null || priceInCents == null) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Name, coins, and price are required' } }, { status: 400 });
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

    return NextResponse.json({ success: true, data: pack }, { status: 201 });
  } catch (error) {
    console.error('[CoinPacks API] POST error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create coin pack' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Coin pack ID is required' } }, { status: 400 });
    }

    const [updated] = await db
      .update(coinPacks)
      .set(updates)
      .where(eq(coinPacks.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Coin pack not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[CoinPacks API] PATCH error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update coin pack' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Coin pack ID is required' } }, { status: 400 });
    }

    await db.delete(coinPacks).where(eq(coinPacks.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CoinPacks API] DELETE error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to delete coin pack' } }, { status: 500 });
  }
}

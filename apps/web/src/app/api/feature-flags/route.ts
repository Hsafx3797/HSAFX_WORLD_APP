import { NextResponse } from 'next/server';
import { db } from '@hsafx/db';
import { featureFlags } from '@hsafx/db/schema';
import { eq } from 'drizzle-orm';
import { redis, keys, TTL } from '@/lib/redis';

const CACHE_KEY = keys.system.featureFlags();
const CACHE_TTL = 5 * 60; // 5 minutes

export async function GET() {
  try {
    // Try Redis cache first
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      const flags = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return NextResponse.json({ flags }, {
        headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
      });
    }

    // Query enabled flags from DB
    const rows = await db
      .select({
        name: featureFlags.name,
        flagType: featureFlags.flagType,
        isEnabled: featureFlags.isEnabled,
        rolloutPercentage: featureFlags.rolloutPercentage,
        targetUsers: featureFlags.targetUsers,
        targetRoles: featureFlags.targetRoles,
      })
      .from(featureFlags)
      .where(eq(featureFlags.isEnabled, true));

    // Build a simple map: { flagName: true }
    const flagMap: Record<string, boolean> = {};
    for (const row of rows) {
      flagMap[row.name] = true;
    }

    // Cache in Redis
    await redis.set(CACHE_KEY, JSON.stringify(flagMap), { ex: CACHE_TTL });

    return NextResponse.json({ flags: flagMap }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch {
    // On error, return empty flags — don't block the UI
    return NextResponse.json({ flags: {} }, { status: 200 });
  }
}

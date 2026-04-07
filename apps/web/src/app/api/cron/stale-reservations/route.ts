/**
 * Cron: Stale Coin Reservation Sweeper
 * Reference: 90_FINAL_IMPLEMENTATION_PLAN.md Task WEB-STALE-COINS
 *
 * Releases coin reservations stuck in 'reserved' status > 30 minutes.
 * Secured by CRON_SECRET env var check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { releaseStaleReservations } from '@/server/limits/coin-service';

const CRON_SECRET = process.env.CRON_SECRET ?? '';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const released = await releaseStaleReservations(30);
    return NextResponse.json({ success: true, released });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

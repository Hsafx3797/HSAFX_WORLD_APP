import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('cron-cleanup');

/**
 * Cron endpoint: hard-delete users whose 14-day grace period has expired.
 * Secured via CRON_SECRET header.
 *
 * Call externally (e.g. Vercel Cron, GitHub Actions) with:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://app/api/cron/cleanup-deleted-users
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { hardDeleteExpiredUsers } = await import(
      '@/server/account/deletion-service'
    );
    const count = await hardDeleteExpiredUsers();

    return NextResponse.json({ ok: true, deletedCount: count });
  } catch (err) {
    log.error('Cleanup deleted users failed', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 },
    );
  }
}

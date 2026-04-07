import { NextResponse } from 'next/server';
import { metricsRegistry } from '@/lib/telemetry';

/**
 * GET /api/metrics — Prometheus scrape endpoint
 *
 * Secured by METRICS_SECRET Bearer token when set.
 * Returns text/plain metrics in Prometheus exposition format.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.METRICS_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const metrics = await metricsRegistry.metrics();
  return new NextResponse(metrics, {
    status: 200,
    headers: { 'Content-Type': metricsRegistry.contentType },
  });
}

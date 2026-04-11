'use client';

import { trpc } from '@/lib/trpc';

export function CoinEventBanner() {
  const eventsQuery = trpc.billing.getActiveCoinEvents.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const events = eventsQuery.data;

  if (!events || events.length === 0) return null;

  // Show the highest multiplier event
  const topEvent = events.reduce((best, e) =>
    Number(e.multiplier) > Number(best.multiplier) ? e : best
  );

  const multiplier = Number(topEvent.multiplier);
  const endsAt = new Date(topEvent.endsAt);
  const hoursLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-semibold text-foreground">
              {topEvent.name} — {multiplier}x Coin Multiplier Active!
            </p>
            <p className="text-sm text-muted-foreground">
              {topEvent.description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">
            {hoursLeft}h remaining
          </p>
          {events.length > 1 && (
            <p className="text-xs text-muted-foreground">
              +{events.length - 1} more event{events.length > 2 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

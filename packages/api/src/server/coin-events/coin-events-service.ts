import { db } from '@hsafx/db';
import { coinEvents, eq, and, gte, lte } from '@hsafx/db/schema';

/**
 * T3.7 — Coin Multiplier Events Service
 * Check for active coin events, apply multipliers.
 */

/** Get all currently active coin events */
export async function getActiveCoinEvents() {
  const now = new Date();
  const events = await db
    .select()
    .from(coinEvents)
    .where(
      and(
        eq(coinEvents.isActive, true),
        lte(coinEvents.startsAt, now),
        gte(coinEvents.endsAt, now),
      ),
    );

  return events;
}

/** Get the current highest multiplier (default 1.0x if no events active) */
export async function getCurrentMultiplier(): Promise<number> {
  const events = await getActiveCoinEvents();
  if (events.length === 0) return 1.0;
  // Use the highest multiplier among active events
  return Math.max(...events.map((e) => Number(e.multiplier)));
}

/** Apply multiplier to a coin amount */
export async function applyMultiplier(baseCoins: number, multiplier: number): Promise<number> {
  return Math.floor(baseCoins * multiplier);
}

/** Get upcoming events (starts within 7 days) */
export async function getUpcomingEvents() {
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const events = await db
    .select()
    .from(coinEvents)
    .where(
      and(
        eq(coinEvents.isActive, true),
        gte(coinEvents.startsAt, now),
        lte(coinEvents.startsAt, weekFromNow),
      ),
    );

  return events;
}

/** Admin: create a new coin event */
export async function createCoinEvent(input: {
  name: string;
  description: string;
  multiplier: string;
  startsAt: Date;
  endsAt: Date;
  createdBy: string;
}) {
  const [event] = await db
    .insert(coinEvents)
    .values({
      name: input.name,
      description: input.description,
      multiplier: input.multiplier,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdBy: input.createdBy,
      isActive: true,
    })
    .returning();

  return event;
}

/** Admin: deactivate a coin event */
export async function deactivateCoinEvent(eventId: string) {
  const [updated] = await db
    .update(coinEvents)
    .set({ isActive: false })
    .where(eq(coinEvents.id, eventId))
    .returning();

  return updated;
}

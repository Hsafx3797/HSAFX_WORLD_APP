import { db } from '@hsafx/db';
import { dailyProTrials, eq, and, sql } from '@hsafx/db/schema';

const MAX_TRIALS_PER_DAY = 1;

function todayStr(): string {
  return new Date().toISOString().split('T')[0]!;
}

/**
 * Get the current trial status for a user today.
 */
export async function getTrialStatus(userId: string) {
  const today = todayStr();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyProTrials)
    .where(and(eq(dailyProTrials.userId, userId), eq(dailyProTrials.trialDate, today)));

  const usedToday = Number(result?.count ?? 0);
  return {
    trialsUsedToday: usedToday,
    trialsRemaining: Math.max(0, MAX_TRIALS_PER_DAY - usedToday),
    maxTrialsPerDay: MAX_TRIALS_PER_DAY,
  };
}

/**
 * Consume one daily pro trial for a specific tool.
 * Idempotent: re-trying the same tool on the same day is a no-op.
 */
export async function consumeTrial(userId: string, toolId: string) {
  const today = todayStr();

  // Check if already tried this specific tool today (idempotent)
  const [existing] = await db
    .select()
    .from(dailyProTrials)
    .where(
      and(
        eq(dailyProTrials.userId, userId),
        eq(dailyProTrials.toolId, toolId),
        eq(dailyProTrials.trialDate, today),
      ),
    )
    .limit(1);

  if (existing) {
    // Already used for this tool today — allow re-execution
    const status = await getTrialStatus(userId);
    return { success: true as const, remaining: status.trialsRemaining };
  }

  // Check remaining trials
  const status = await getTrialStatus(userId);
  if (status.trialsRemaining <= 0) {
    return { success: false as const, reason: 'No trials remaining today' };
  }

  await db.insert(dailyProTrials).values({
    userId,
    toolId,
    trialDate: today,
  });

  return { success: true as const, remaining: status.trialsRemaining - 1 };
}

import { db } from '@hsafx/db';
import { asyncJobs, eq, and, sql } from '@hsafx/db/schema';

/**
 * T3.8 — Batch Processing Service
 * Create and track multi-file batch jobs using asyncJobs table.
 */

/** Create a batch job */
export async function createBatchJob(input: {
  userId: string;
  jobType: string;
  files: { filename: string; storageKey: string; mimeType: string; fileSize: number }[];
}) {
  const [job] = await db
    .insert(asyncJobs)
    .values({
      userId: input.userId,
      jobType: input.jobType,
      status: 'pending',
      progress: 0,
      metadata: { files: input.files, totalFiles: input.files.length },
    })
    .returning();

  return job;
}

/** Get batch job status */
export async function getBatchJobStatus(jobId: string, userId: string) {
  const [job] = await db
    .select()
    .from(asyncJobs)
    .where(and(eq(asyncJobs.id, jobId), eq(asyncJobs.userId, userId)))
    .limit(1);

  return job ?? null;
}

/** List user's batch jobs */
export async function getUserBatchJobs(userId: string, limit = 20) {
  const jobs = await db
    .select()
    .from(asyncJobs)
    .where(and(eq(asyncJobs.userId, userId), eq(asyncJobs.jobType, 'batch_process')))
    .orderBy(sql`${asyncJobs.createdAt} DESC`)
    .limit(limit);

  return jobs;
}

/** Update batch job progress */
export async function updateBatchProgress(jobId: string, progress: number, status?: string) {
  const updates: Record<string, unknown> = { progress };
  if (status) updates.status = status;
  if (status === 'running' && !updates.startedAt) updates.startedAt = new Date();
  if (status === 'succeeded' || status === 'failed') updates.completedAt = new Date();

  const [updated] = await db
    .update(asyncJobs)
    .set(updates)
    .where(eq(asyncJobs.id, jobId))
    .returning();

  return updated;
}

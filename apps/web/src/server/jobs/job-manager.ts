/**
 * Job Manager — Redis-backed async job system
 * Reference: SOLUTION_ROADMAP Task 3.3, 46_REDIS_KEY_SCHEMA.md
 *
 * State machine: QUEUED → PREPARING → PROCESSING → COMPLETED | FAILED
 * Storage:       Redis (state + result, 72h TTL) + DB (audit log)
 */

import { redis, keys, TTL, generateInputHash } from '@/lib/redis';
import { db, toolExecutions } from '@hsafx/db';
import type { Job, JobResult, CreateJobInput, JobStatus } from './types';

// Re-export types so existing consumers don't break
export type { Job, JobResult, CreateJobInput, JobStatus } from './types';

// ─── Job ID generation ────────────────────────────────────────

function generateJobId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `job_${ts}_${rand}`;
}

// ─── CRUD ─────────────────────────────────────────────────────

/**
 * Create a new async job. Stored in Redis (fast) and DB (audit).
 */
export async function createJob(input: CreateJobInput): Promise<Job> {
  const id = generateJobId();
  const now = new Date().toISOString();

  const job: Job = {
    id,
    toolId: input.toolId,
    toolSlug: input.toolSlug,
    userId: input.userId,
    apiKeyId: input.apiKeyId,
    status: 'queued',
    progress: 0,
    input: input.input,
    options: input.options,
    source: input.source,
    createdAt: now,
    updatedAt: now,
  };

  // Store in Redis (primary — fast reads for polling)
  const redisKey = keys.job.state(id);
  await redis.set(redisKey, JSON.stringify(job), { ex: TTL.JOB_STATE });

  // Also create DB audit record (fire-and-forget)
  db.insert(toolExecutions)
    .values({
      userId: input.userId,
      toolId: input.toolId,
      status: 'pending',
      coinCost: 0,
      metadata: {
        jobId: id,
        source: input.source,
        apiKeyId: input.apiKeyId,
      },
    })
    .catch((err: unknown) =>
      console.error('[job-manager] Failed to create DB audit record:', err),
    );

  // Dispatch to worker (imported lazily to avoid circular deps)
  dispatchJob(job).catch((err: unknown) =>
    console.error('[job-manager] Failed to dispatch job:', err),
  );

  return job;
}

/**
 * Get a job by ID from Redis.
 */
export async function getJob(jobId: string): Promise<Job | null> {
  const redisKey = keys.job.state(jobId);
  const raw = await redis.get(redisKey);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as Job);
}

/**
 * Update job fields in Redis.
 */
export async function updateJob(
  jobId: string,
  updates: Partial<Pick<Job, 'status' | 'progress' | 'error' | 'completedAt'>>,
): Promise<Job | null> {
  const job = await getJob(jobId);
  if (!job) return null;

  const updated: Job = {
    ...job,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const redisKey = keys.job.state(jobId);
  await redis.set(redisKey, JSON.stringify(updated), { ex: TTL.JOB_STATE });

  return updated;
}

/**
 * Store the result of a completed job.
 */
export async function setJobResult(
  jobId: string,
  result: JobResult,
): Promise<void> {
  const redisKey = keys.job.result(jobId);
  await redis.set(redisKey, JSON.stringify(result), { ex: TTL.JOB_RESULT });
}

/**
 * Retrieve the result of a completed job.
 */
export async function getJobResult(jobId: string): Promise<JobResult | null> {
  const redisKey = keys.job.result(jobId);
  const raw = await redis.get(redisKey);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as JobResult);
}

/**
 * Update job progress (0-100).
 */
export async function setJobProgress(
  jobId: string,
  progress: number,
): Promise<void> {
  // Update in the main job record
  await updateJob(jobId, { progress: Math.min(100, Math.max(0, progress)) });

  // Also store in a separate key for fast reads
  const progressKey = keys.job.progress(jobId);
  await redis.set(progressKey, String(progress), { ex: TTL.JOB_PROGRESS });
}

// ─── Dispatcher ───────────────────────────────────────────────

/**
 * Dispatch a job to the appropriate worker.
 * For now, processes inline (Phase 3). In Phase 4+, this will push to BullMQ.
 */
async function dispatchJob(job: Job): Promise<void> {
  // Dynamic import to avoid circular dependency (job-worker imports from job-manager)
  const { processJob } = await import('./job-worker') as { processJob: (job: Job) => Promise<void> };
  // Process asynchronously (don't block job creation)
  processJob(job).catch((err: unknown) => {
    console.error(`[job-manager] Job ${job.id} failed:`, err);
    updateJob(job.id, {
      status: 'failed',
      error: err instanceof Error ? err.message : 'Unknown error',
      completedAt: new Date().toISOString(),
    });
  });
}

/**
 * Job Manager — Redis-backed async job system
 * Reference: SOLUTION_ROADMAP Task 3.3, 46_REDIS_KEY_SCHEMA.md
 *
 * State machine: QUEUED → PREPARING → PROCESSING → COMPLETED | FAILED
 * Storage:       Redis (state + result, 72h TTL) + DB (audit log)
 */

import { redis, keys, TTL, generateInputHash } from '@/lib/redis';
import { db, asyncJobs } from '@hsafx/db';
import crypto from 'crypto';
import type { Job, JobResult, CreateJobInput, JobStatus } from './types';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('job-manager');

/** Max time a job can stay in 'queued' status before being considered stale (5 min). */
const STALE_JOB_THRESHOLD_MS = 5 * 60 * 1000;

/** Max time a job can stay in 'preparing' status (10 min). */
const STALE_PREPARING_THRESHOLD_MS = 10 * 60 * 1000;

/** Max time a job can stay in 'processing' status (30 min). */
const STALE_PROCESSING_THRESHOLD_MS = 30 * 60 * 1000;

// Re-export types so existing consumers don't break
export type { Job, JobResult, CreateJobInput, JobStatus } from './types';

// ─── Job ID generation ────────────────────────────────────────

function generateJobId(): string {
  const rand = crypto.randomBytes(16).toString('hex');
  return `job_${rand}`;
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
    engineName: input.engineName,
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
  db.insert(asyncJobs)
    .values({
      userId: input.userId,
      jobType: input.engineName ?? 'unknown',
      metadata: {
        jobId: id,
        source: input.source,
        apiKeyId: input.apiKeyId,
      },
    })
    .catch((err: unknown) =>
      log.error('Failed to create DB audit record', { jobId: id, error: String(err) }),
    );

  // Dispatch to worker (imported lazily to avoid circular deps)
  dispatchJob(job).catch(async (err: unknown) => {
    log.error('Failed to dispatch job', { jobId: id, error: String(err) });
  });

  return job;
}

/**
 * Get a job by ID from Redis.
 */
export async function getJob(jobId: string): Promise<Job | null> {
  const redisKey = keys.job.state(jobId);
  const raw = await redis.get(redisKey);
  if (!raw) return null;
  const job = typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as Job);

  // Detect stale jobs: if stuck beyond threshold for their status, mark as failed
  if (job.status === 'queued' || job.status === 'preparing' || job.status === 'processing') {
    const age = Date.now() - new Date(job.createdAt).getTime();
    const threshold =
      job.status === 'queued' ? STALE_JOB_THRESHOLD_MS :
      job.status === 'preparing' ? STALE_PREPARING_THRESHOLD_MS :
      STALE_PROCESSING_THRESHOLD_MS;

    if (age > threshold) {
      log.warn('Stale job detected, marking as failed', { jobId, status: job.status, ageMs: age });
      const failed = await updateJob(jobId, {
        status: 'failed',
        error: `Job timed out in '${job.status}' state (stale after ${Math.round(age / 1000)}s)`,
        completedAt: new Date().toISOString(),
      });

      return failed ?? job;
    }
  }

  return job;
}

/**
 * Update job fields in Redis.
 * Reads Redis directly (not via getJob) to avoid infinite recursion
 * when getJob detects stale jobs and calls updateJob.
 */
export async function updateJob(
  jobId: string,
  updates: Partial<Pick<Job, 'status' | 'progress' | 'error' | 'completedAt'>>,
): Promise<Job | null> {
  const redisKey = keys.job.state(jobId);
  const raw = await redis.get(redisKey);
  if (!raw) return null;
  const job = typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as Job);

  const updated: Job = {
    ...job,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

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
 * Redis-based concurrency limiter — survives restarts, works across instances.
 * Safety TTL on the counter key prevents permanent lockout if all instances crash.
 */
const MAX_CONCURRENT_JOBS = 50;

/**
 * Dispatch a job to the appropriate worker.
 * Uses Redis atomic counter for concurrency tracking.
 */
async function dispatchJob(job: Job): Promise<void> {
  const concurrencyKey = keys.system.concurrentJobs();

  // Atomically increment; if over limit, decrement and reject
  const current = await redis.incr(concurrencyKey);
  // Safety TTL: auto-cleanup if all instances crash (1 hour)
  await redis.expire(concurrencyKey, 3600);

  if (current > MAX_CONCURRENT_JOBS) {
    await redis.decr(concurrencyKey);
    throw new Error(
      `Server at capacity (${current - 1}/${MAX_CONCURRENT_JOBS} concurrent jobs). Please retry later.`,
    );
  }

  // Dynamic import to avoid circular dependency (job-worker imports from job-manager)
  const { processJob } = await import('./job-worker') as { processJob: (job: Job) => Promise<void> };
  // Process asynchronously (don't block job creation)
  processJob(job)
    .catch((err: unknown) => {
      log.error('Job failed', { jobId: job.id, error: String(err) });
      updateJob(job.id, {
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
        completedAt: new Date().toISOString(),
      });
    })
    .finally(async () => {
      await redis.decr(concurrencyKey).catch((err: unknown) =>
        log.error('Failed to decrement concurrent jobs counter', { error: String(err) }),
      );
    });
}

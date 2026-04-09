/**
 * Job Worker — processes queued jobs
 *
 * Routes engines to the correct execution backend:
 *   - 'node'   → @hsafx/tool-execution execute() (inline, same process)
 *   - 'python' → FastAPI POST /execute/{engine} or legacy /internal/execute
 *   - 'rust'   → Rust service POST /execute (not yet live — returns error)
 *
 * Billing: Calls confirmReservation on success, releaseReservation on failure.
 * Webhooks: Dispatches job.completed/job.failed to registered customer endpoints.
 */

import { updateJob, setJobResult } from './job-manager';
import type { Job, JobResult } from './types';
import {
  confirmReservation,
  releaseReservation,
} from '../limits/coin-service';
import { incrementB2bUsage } from '../limits/b2b-quota-service';
import { dispatchJobWebhooks } from '../webhooks/dispatch';
import { reportStripeUsage } from '../billing/stripe-usage';
import { redis } from '@/lib/redis';
import { createLogger } from '@hsafx/shared/logger';
import { ENGINE_RUNTIME } from '@/lib/engine-constants';
import type { EngineRuntime } from '@/lib/engine-constants';
import { engineExecutionDuration, engineExecutionTotal, jobsTotal } from '@/lib/telemetry';

const log = createLogger('job-worker');

/**
 * In production, internal service URLs MUST use HTTPS to prevent
 * credentials (X-Internal-Secret) from being sent over plaintext.
 */
function validateServiceUrl(url: string, name: string): void {
  if (
    process.env.NODE_ENV === 'production' &&
    url.startsWith('http://') &&
    !url.startsWith('http://localhost') &&
    !url.startsWith('http://127.0.0.1')
  ) {
    throw new Error(
      `${name} must use HTTPS in production (got ${url.slice(0, 40)}...)`,
    );
  }
}

// ─── TTL extension for long-running jobs ──────────────────────

async function extendJobTTL(jobId: string): Promise<void> {
  try {
    const { redis, keys, TTL } = await import('@/lib/redis');
    const stateKey = keys.job.state(jobId);
    await redis.expire(stateKey, TTL.JOB_STATE);
  } catch {
    // Non-critical — log but don't fail the job
  }
}

// ─── Main processor ───────────────────────────────────────────

/**
 * Resolve engine runtime for a job.
 * Priority: job.engineName → options._runtime → options._engineName → ENGINE_RUNTIME fallback → 'node'
 */
function resolveRuntime(job: Job): EngineRuntime {
  // New B2B route sets engineName directly on the Job
  const name = job.engineName
    ?? (job.options?._engineName as string | undefined)
    ?? job.toolSlug;

  // Check if the route already told us the runtime (options._runtime)
  const hinted = job.options?._runtime as string | undefined;
  if (hinted === 'rust' || hinted === 'node' || hinted === 'python') {
    return hinted;
  }

  // Look up from the canonical ENGINE_RUNTIME map
  const mapped = ENGINE_RUNTIME[name];
  if (mapped) return mapped;

  // Last resort: anything not in the map defaults to node
  log.warn('Engine not found in ENGINE_RUNTIME, defaulting to node', { name, jobId: job.id });
  return 'node';
}

/**
 * Get the effective engine name for a job.
 */
function getEngineName(job: Job): string {
  return job.engineName
    ?? (job.options?._engineName as string | undefined)
    ?? job.toolSlug;
}

/**
 * Process a single job end-to-end.
 */
export async function processJob(job: Job): Promise<void> {
  const startTime = Date.now();
  const engineName = getEngineName(job);
  const runtime = resolveRuntime(job);

  // Track job creation
  jobsTotal.inc({ engine: engineName, status: 'started' });

  try {
    // 1. Mark as preparing
    await updateJob(job.id, { status: 'preparing', progress: 10 });

    // 2. Determine runtime from ENGINE_RUNTIME
    // (already resolved above for metrics)

    // 3. Mark as processing + extend Redis TTL for long-running jobs
    await updateJob(job.id, { status: 'processing', progress: 25 });
    await extendJobTTL(job.id);

    let result: JobResult;
    let isAsync = false;

    switch (runtime) {
      case 'node':
        result = await executeNodeEngine(job, engineName);
        break;

      case 'python':
        result = await executePythonEngine(job, engineName);
        isAsync = true; // Completion handled by /api/internal/job-complete callback
        break;

      case 'rust':
        result = await executeRustEngine(job, engineName);
        break;

      default:
        throw new Error(`Unsupported runtime: ${runtime}`);
    }

    // For async (FastAPI) tools, the job-complete callback handles
    // result storage, status update, and billing reconciliation.
    if (isAsync) {
      // Async metrics are recorded on callback completion, not here
      return;
    }

    // 4. Store result and mark completed (inline tools only)
    await setJobResult(job.id, result);
    await updateJob(job.id, {
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    // Record success metrics
    const execDuration = (Date.now() - startTime) / 1000;
    engineExecutionDuration.observe({ engine: engineName, backend: runtime, status: 'success' }, execDuration);
    engineExecutionTotal.inc({ engine: engineName, backend: runtime, status: 'success' });
    jobsTotal.inc({ engine: engineName, status: 'completed' });

    // 5. Billing reconciliation — B2B (ops increment) vs B2C (coin confirmation)
    const isB2b = job.options?._isB2b === true;
    const b2bSuiteId = job.options?._b2bSuiteId as string | undefined;
    const reservationId = job.options?.reservationId as string | undefined;
    const coinCost = (job.options?.coinCost as number) ?? 0;

    if (isB2b && b2bSuiteId) {
      // B2B: increment usage count (SUCCESS-only counting)
      try {
        await incrementB2bUsage(job.userId, b2bSuiteId);
      } catch (err) {
        log.error('Failed to increment B2B usage — flagging for reconciliation', {
          userId: job.userId,
          suiteId: b2bSuiteId,
          jobId: job.id,
          error: err,
        });
        // Flag for reconciliation so ops that ran aren't lost from billing
        redis.set(
          `b2b:usage_failed:${job.id}`,
          JSON.stringify({ userId: job.userId, suiteId: b2bSuiteId, ts: Date.now() }),
          { ex: 7 * 24 * 60 * 60 }, // 7 day TTL
        ).catch(() => {});
      }
    } else {
      // B2C: confirm coin reservation (coins permanently deducted)
      if (reservationId) {
        await confirmReservation(reservationId);
      }
      // Report usage to Stripe metered billing (fire-and-forget, B2C only)
      reportStripeUsage(job.userId, job.toolId, coinCost);
    }

    // 6. Update DB execution record (fire-and-forget)
    const { db, sql } = await import('@hsafx/db');
    const executionTime = Date.now() - startTime;
    db.execute(
      sql`
        UPDATE tool_executions
        SET status = 'succeeded',
            execution_time = ${executionTime},
            completed_at = now()
        WHERE metadata->>'jobId' = ${job.id}
      `,
    ).catch(() => {});

    // 7. Dispatch webhook notification (fire-and-forget)
    dispatchJobWebhooks(job.userId, 'job.completed', {
      jobId: job.id,
      engine: getEngineName(job),
      toolId: job.toolId,
      status: 'completed',
      output: result.output,
      executionTime,
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown execution error';

    // Release coin reservation so user is not charged for a failed job (B2C only)
    const failedIsB2b = job.options?._isB2b === true;
    const failedReservationId = job.options?.reservationId as string | undefined;
    if (!failedIsB2b && failedReservationId) {
      await releaseReservation(failedReservationId).catch(() => {});
    }
    // B2B: nothing to do on failure — failed executions are free

    await updateJob(job.id, {
      status: 'failed',
      error: errorMessage,
      completedAt: new Date().toISOString(),
    });

    // Record failure metrics
    const failExecDuration = (Date.now() - startTime) / 1000;
    engineExecutionDuration.observe({ engine: engineName, backend: runtime, status: 'error' }, failExecDuration);
    engineExecutionTotal.inc({ engine: engineName, backend: runtime, status: 'error' });
    jobsTotal.inc({ engine: engineName, status: 'failed' });

    // Update DB record
    const { db: db2, sql: sql2 } = await import('@hsafx/db');
    db2.execute(
      sql2`
        UPDATE tool_executions
        SET status = 'failed',
            error_message = ${errorMessage},
            execution_time = ${Date.now() - startTime},
            completed_at = now()
        WHERE metadata->>'jobId' = ${job.id}
      `,
    ).catch(() => {});

    // Dispatch failure webhook notification (fire-and-forget)
    dispatchJobWebhooks(job.userId, 'job.failed', {
      jobId: job.id,
      engine: getEngineName(job),
      toolId: job.toolId,
      status: 'failed',
      error: errorMessage,
      executionTime: Date.now() - startTime,
    });

    throw err;
  }
}

// ─── Option sanitizer ─────────────────────────────────────────

/** Strip internal/billing fields from user options before passing to engine. */
function sanitizeOptions(opts: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(opts)) {
    if (!k.startsWith('_') && k !== 'reservationId' && k !== 'coinCost') {
      clean[k] = v;
    }
  }
  return clean;
}

// ─── Node.js engine execution ─────────────────────────────────

/**
 * Execute a Node.js engine inline via @hsafx/tool-execution.
 * Applies a 60-second timeout to prevent indefinite hangs.
 */
async function executeNodeEngine(job: Job, engineName: string): Promise<JobResult> {
  await updateJob(job.id, { progress: 50 });

  const timeoutMs = Number(process.env.TOOL_EXEC_TIMEOUT_MS ?? 60_000);

  try {
    const { execute } = await import('@hsafx/tool-execution');

    const engineOptions = sanitizeOptions(job.options ?? {});

    const execPromise = execute(engineName, job.input as string, engineOptions);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Engine execution timed out after ${timeoutMs}ms`)), timeoutMs),
    );

    const output = await Promise.race([execPromise, timeoutPromise]);

    await updateJob(job.id, { progress: 90 });

    return { output };
  } catch (err) {
    throw new Error(
      `Engine '${engineName}' execution failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ─── Python/FastAPI engine execution ──────────────────────────

/**
 * Dispatch execution to the FastAPI backend.
 *
 * New route: POST /execute/{engineName} (engine-based, Phase 5)
 * Legacy route: POST /internal/execute (tool-based, fallback)
 *
 * FastAPI returns 202 immediately and processes in background.
 * Final result arrives via callback to /api/internal/job-complete.
 */
async function executePythonEngine(job: Job, engineName: string): Promise<JobResult> {
  await updateJob(job.id, { progress: 30 });

  const fastApiUrl =
    process.env.FASTAPI_INTERNAL_URL ?? 'http://localhost:8000';
  validateServiceUrl(fastApiUrl, 'FASTAPI_INTERNAL_URL');
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (!internalSecret) {
    throw new Error(
      'INTERNAL_API_SECRET is required for FastAPI engine execution',
    );
  }

  const controller = new AbortController();
  const timeoutMs = Number(process.env.FASTAPI_DISPATCH_TIMEOUT_MS ?? 30_000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const cleanOptions = sanitizeOptions(job.options ?? {});

  try {
    // Try new engine route first: POST /execute/{engineName}
    // Falls back to legacy POST /internal/execute if the new route 404s
    let response = await fetch(`${fastApiUrl}/execute/${engineName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
      },
      body: JSON.stringify({
        jobId: job.id,
        input: job.input,
        options: cleanOptions,
      }),
      signal: controller.signal,
    });

    // Fallback to legacy route if new engine route is not yet deployed (404)
    if (response.status === 404) {
      log.info('New engine route not found, falling back to legacy /internal/execute', { engineName });
      response = await fetch(`${fastApiUrl}/internal/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': internalSecret,
        },
        body: JSON.stringify({
          jobId: job.id,
          toolId: job.toolId,
          toolSlug: job.toolSlug,
          input: job.input,
          options: cleanOptions,
        }),
        signal: controller.signal,
      });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `FastAPI returned ${response.status}: ${text}`,
      );
    }

    // 202 accepted — FastAPI is processing in background.
    await updateJob(job.id, { status: 'processing', progress: 50 });

    return {
      output: null,
      metadata: { dispatchedTo: 'fastapi', engine: engineName, async: true },
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`FastAPI dispatch timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Rust engine execution ────────────────────────────────────

/**
 * Dispatch execution to the Rust engine service.
 * Route: POST /execute { engine, input, options }
 * Auth: X-Internal-Secret header
 *
 * Unlike FastAPI, Rust engines are synchronous (fast text processing).
 * Returns the result directly.
 *
 * NOTE: Rust service is not yet live (Phase 6). Until then, falls back to
 * Node.js execution since all 9 Rust-targeted engines currently run on Node.js.
 */
async function executeRustEngine(job: Job, engineName: string): Promise<JobResult> {
  const rustServiceUrl = process.env.RUST_SERVICE_URL;

  // Rust service not configured → fall back to Node.js engine execution
  // (All 9 Rust-targeted engines still have Node.js implementations)
  if (!rustServiceUrl) {
    log.info('RUST_SERVICE_URL not set, falling back to Node.js engine', { engineName });
    return executeNodeEngine(job, engineName);
  }

  validateServiceUrl(rustServiceUrl, 'RUST_SERVICE_URL');

  await updateJob(job.id, { progress: 50 });

  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (!internalSecret) {
    throw new Error('INTERNAL_API_SECRET is required for Rust engine execution');
  }

  const controller = new AbortController();
  const timeoutMs = Number(process.env.RUST_EXEC_TIMEOUT_MS ?? 30_000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const cleanOptions = sanitizeOptions(job.options ?? {});

  try {
    const response = await fetch(`${rustServiceUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
      },
      body: JSON.stringify({
        engine: engineName,
        input: job.input,
        options: cleanOptions,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      throw new Error(`Rust service returned ${response.status}: ${text}`);
    }

    const result = await response.json();
    await updateJob(job.id, { progress: 90 });

    return { output: result.output ?? result };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Rust engine execution timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Job Worker — processes queued jobs
 * Reference: SOLUTION_ROADMAP Task 3.3
 *
 * Routes tools to the correct execution path:
 *   - WASM / Node.js tools → @hsafx/tool-execution (inline)
 *   - Native tools (media)  → FastAPI /internal/execute (async)
 *   - Python tools (scraper) → FastAPI /internal/execute (async)
 */

import { updateJob, setJobResult } from './job-manager';
import type { Job, JobResult } from './types';

// ─── Types ─────────────────────────────────────────────────────

/** Tool runtime from the tool-definitions catalog */
type ToolRuntime = 'wasm' | 'node' | 'python' | 'browser' | 'native';

// ─── Main processor ───────────────────────────────────────────

/**
 * Process a single job end-to-end.
 */
export async function processJob(job: Job): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. Mark as preparing
    await updateJob(job.id, { status: 'preparing', progress: 10 });

    // 2. Determine runtime from tool-definitions catalog
    const runtime = await resolveToolRuntime(job.toolSlug);

    // 3. Mark as processing
    await updateJob(job.id, { status: 'processing', progress: 25 });

    let result: JobResult;

    switch (runtime) {
      case 'wasm':
      case 'node':
      case 'browser':
        result = await executeInlineToolServer(job);
        break;

      case 'native':
      case 'python':
        result = await executeViaFastApi(job);
        break;

      default:
        throw new Error(`Unsupported runtime: ${runtime}`);
    }

    // 4. Store result and mark completed
    await setJobResult(job.id, result);
    await updateJob(job.id, {
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    // 5. Update DB execution record (fire-and-forget)
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
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown execution error';

    await updateJob(job.id, {
      status: 'failed',
      error: errorMessage,
      completedAt: new Date().toISOString(),
    });

    // Update DB record
    const { sql: sql2 } = await import('@hsafx/db');
    const { db: db2 } = await import('@hsafx/db');
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

    throw err;
  }
}

// ─── Runtime resolver ─────────────────────────────────────────

/**
 * Look up the runtime for a tool slug from the catalog.
 */
async function resolveToolRuntime(toolSlug: string): Promise<ToolRuntime> {
  try {
    const { getAllTools } = await import('@/lib/tools/registry');
    const all = getAllTools();
    const tool = all.find((t) => t.id === toolSlug);
    if (tool?.execution) {
      // execution is a string: 'client' | 'server' | 'hybrid'
      // Map: client → 'wasm', server → 'node', hybrid → 'node'
      const execMap: Record<string, ToolRuntime> = {
        client: 'wasm',
        server: 'node',
        hybrid: 'node',
      };
      return execMap[tool.execution] ?? 'node';
    }
  } catch {
    // Fallback
  }
  // Default to Node.js (server-side)
  return 'node';
}

// ─── Inline execution (WASM/Node.js) ─────────────────────────

/**
 * Execute tool server-side using @hsafx/tool-execution.
 */
async function executeInlineToolServer(job: Job): Promise<JobResult> {
  await updateJob(job.id, { progress: 50 });

  try {
    // Dynamic import to avoid bundling all tools in the middleware
    const toolExecution = await import('@hsafx/tool-execution');
    const executor =
      'ToolExecutor' in toolExecution
        ? new (toolExecution as { ToolExecutor: new () => { execute: (slug: string, input: unknown, opts?: unknown) => Promise<unknown> } }).ToolExecutor()
        : null;

    let output: unknown;

    if (executor) {
      output = await executor.execute(job.toolSlug, job.input, job.options);
    } else if ('execute' in toolExecution) {
      output = await (toolExecution as { execute: (slug: string, input: unknown) => Promise<unknown> }).execute(
        job.toolSlug,
        job.input,
      );
    } else {
      throw new Error(
        `@hsafx/tool-execution does not export ToolExecutor or execute()`,
      );
    }

    await updateJob(job.id, { progress: 90 });

    return { output };
  } catch (err) {
    throw new Error(
      `Inline tool execution failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ─── FastAPI execution (native/python) ────────────────────────

/**
 * Dispatch execution to the FastAPI backend.
 * FastAPI endpoint: POST /internal/execute
 * Auth: X-Internal-Secret header
 */
async function executeViaFastApi(job: Job): Promise<JobResult> {
  await updateJob(job.id, { progress: 30 });

  const fastApiUrl =
    process.env.FASTAPI_INTERNAL_URL ?? 'http://localhost:8000';
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (!internalSecret) {
    throw new Error(
      'INTERNAL_API_SECRET is required for FastAPI tool execution',
    );
  }

  const response = await fetch(`${fastApiUrl}/internal/execute`, {
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
      options: job.options,
    }),
  });

  await updateJob(job.id, { progress: 70 });

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `FastAPI returned ${response.status}: ${text}`,
    );
  }

  const data = await response.json();

  await updateJob(job.id, { progress: 90 });

  return {
    output: data.output ?? data.result ?? null,
    downloadUrl: data.resultUrl ?? data.downloadUrl ?? undefined,
    metadata: data.metadata ?? {},
  };
}

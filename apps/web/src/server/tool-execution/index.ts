/**
 * Server-side tool execution layer
 * Reference: SOLUTION_ROADMAP Task 4.5
 *
 * Server actions for tools that run in the Next.js process (node/wasm runtime).
 * For native/python tools, delegates to the async job system (Phase 3).
 */

'use server';

import {
  db,
  tools,
  toolExecutions,
  usageCounters,
  eq,
  and,
  sql,
} from '@hsafx/db';
import {
  getToolCoinCost,
  deductCoins,
  reserveCoins,
  confirmReservation,
  releaseReservation,
  InsufficientCoinsError,
} from '../limits/coin-service';
import { createJob } from '../jobs/job-manager';

// ─── Types ────────────────────────────────────────────────────

export interface ExecuteToolInput {
  toolId: string;
  inputs: Record<string, unknown>;
  userId: string;
  idempotencyKey?: string;
}

export interface ExecuteToolResult {
  /** 'completed' for sync, 'queued' for async */
  status: 'completed' | 'queued';
  /** Present when status = 'completed' */
  result?: unknown;
  /** Present when status = 'queued' */
  jobId?: string;
  /** Execution ID in DB */
  executionId: string;
  /** Coins charged (0 if free) */
  coinsCharged: number;
  /** Duration in ms (only for sync) */
  duration?: number;
}

// ─── Derive tool class from tool group ────────────────────────

function deriveToolClass(toolGroup: number, slug: string): string {
  // Tool groups per 30_TOOLS_CATALOG.md:
  // Group 1 (1-177): text_transform / validator / encoder
  // Group 2 (178-283): code tools → structured_conversion
  // Group 3 (284-365): file tools → structured_conversion
  // Group 4 (366-428): generators (366-400) + calculators (401-428)
  // Group 5 (429-446): visualizers + intelligence + scraper

  switch (toolGroup) {
    case 1: return 'text_transform';
    case 2: return 'structured_conversion';
    case 3: return 'structured_conversion';
    case 4: return slug.includes('calc') ? 'calculator' : 'generator';
    case 5: return 'advanced_processor';
    default: return 'text_transform';
  }
}

// ─── Main execution entry point ───────────────────────────────

/**
 * Execute a tool server-side. Handles:
 * - Cost calculation + coin deduction
 * - Sync execution (wasm/node/browser) or async job creation (native/python)
 * - Usage counter increment
 * - Execution audit logging
 */
export async function executeToolServer(
  input: ExecuteToolInput,
): Promise<ExecuteToolResult> {
  const { toolId, inputs, userId, idempotencyKey } = input;

  // 1. Fetch tool from DB
  const [tool] = await db
    .select()
    .from(tools)
    .where(eq(tools.id, toolId))
    .limit(1);

  if (!tool) throw new Error('Tool not found');
  if (!tool.isActive) throw new Error('Tool is disabled');

  // 2. Determine tool class and cost
  const toolClass = deriveToolClass(tool.toolGroup, tool.slug);
  const { coins: coinCost, baWeight, discountPercent } = await getToolCoinCost(
    toolId,
    toolClass,
    userId,
  );

  // 3. Determine execution mode
  const isAsync =
    tool.runtime === 'python' || tool.runtime === 'native' || tool.executionMode === 'server';
  const isSyncClient =
    tool.executionMode === 'client' || tool.runtime === 'wasm' || tool.runtime === 'browser';

  // ──────────────────────────────────────────────────
  // ASYNC PATH (native/python → job queue)
  // ──────────────────────────────────────────────────
  if (isAsync && !isSyncClient) {
    // Reserve coins for async execution
    let reservationId: string | undefined;
    if (coinCost > 0) {
      const reservation = await reserveCoins(
        userId,
        coinCost,
        toolId,
        tool.name,
        idempotencyKey,
      );
      reservationId = reservation.reservationId;
    }

    // Create execution record
    const [execution] = await db
      .insert(toolExecutions)
      .values({
        userId,
        toolId,
        status: 'pending',
        coinCost,
        metadata: {
          inputs,
          baWeight,
          discountPercent,
          reservationId,
          idempotencyKey,
        },
      })
      .returning();

    // Dispatch async job
    const job = await createJob({
      toolId,
      toolSlug: tool.slug,
      userId,
      input: inputs,
      options: { reservationId, executionId: execution!.id },
      source: 'trpc',
    });

    return {
      status: 'queued',
      jobId: job.id,
      executionId: execution!.id,
      coinsCharged: coinCost,
    };
  }

  // ──────────────────────────────────────────────────
  // SYNC PATH (wasm/node/browser → inline execution)
  // ──────────────────────────────────────────────────
  const startTime = Date.now();

  // Deduct coins upfront for sync (no reservation needed — instant result)
  let transactionId: string | undefined;
  if (coinCost > 0) {
    const deduction = await deductCoins(userId, coinCost, toolId, tool.name);
    transactionId = deduction.transactionId;
  }

  // Create execution record
  const [execution] = await db
    .insert(toolExecutions)
    .values({
      userId,
      toolId,
      status: 'running',
      coinCost,
      metadata: {
        inputs,
        baWeight,
        discountPercent,
        transactionId,
        idempotencyKey,
      },
    })
    .returning();

  try {
    // Execute the tool
    let result: unknown;

    if (tool.runtime === 'node') {
      // Server-side Node.js tools via @hsafx/tool-execution
      const toolExecution = await import('@hsafx/tool-execution');
      if ('execute' in toolExecution) {
        result = await (toolExecution as { execute: (slug: string, input: unknown) => Promise<unknown> }).execute(
          tool.slug,
          inputs,
        );
      } else {
        throw new Error('@hsafx/tool-execution does not export execute()');
      }
    } else {
      // For WASM/browser tools executed server-side, we just return a marker
      // indicating client should execute locally. The actual execution
      // happens in the client executor (Task 4.4).
      result = { _clientExecution: true, toolSlug: tool.slug };
    }

    const duration = Date.now() - startTime;

    // Update execution record
    await db
      .update(toolExecutions)
      .set({
        status: 'succeeded',
        executionTime: duration,
        completedAt: new Date(),
      })
      .where(eq(toolExecutions.id, execution!.id));

    // Increment usage counter (fire-and-forget)
    incrementUsageCounter(userId, toolId).catch(() => {});

    return {
      status: 'completed',
      result,
      executionId: execution!.id,
      coinsCharged: coinCost,
      duration,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const duration = Date.now() - startTime;

    // Mark execution as failed
    await db
      .update(toolExecutions)
      .set({
        status: 'failed',
        errorMessage,
        executionTime: duration,
        completedAt: new Date(),
      })
      .where(eq(toolExecutions.id, execution!.id));

    // Refund coins on failure
    if (transactionId && coinCost > 0) {
      await releaseReservation(transactionId);
    }

    throw err;
  }
}

// ─── Usage counter helper ─────────────────────────────────────

async function incrementUsageCounter(
  userId: string,
  toolId: string,
): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Upsert usage counter for the current month
  await db
    .insert(usageCounters)
    .values({
      userId,
      resourceType: 'tool',
      resourceId: toolId,
      periodStart,
      periodEnd,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [usageCounters.userId, usageCounters.resourceType, usageCounters.resourceId],
      set: {
        count: sql`${usageCounters.count} + 1`,
        updatedAt: new Date(),
      },
    })
    .catch(() => {
      // Silently fail — usage counters are best-effort
    });
}

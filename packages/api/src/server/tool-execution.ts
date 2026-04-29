/**
 * Server-side tool execution layer.
 *
 * Orchestrates tool execution via the engine architecture:
 * - Sync execution via @hsafx/tool-execution engines (text/data tools)
 * - Returns result with execution metadata
 *
 * Billing (coin reservation/confirmation) and async dispatch (FastAPI)
 * are handled by the API v1 route and job-worker respectively.
 */

import { execute } from '@hsafx/tool-execution';
import { randomUUID } from 'crypto';

export type ExecuteToolInput = {
  toolId: string;
  inputs: Record<string, unknown>;
  userId: string;
  idempotencyKey?: string;
};

export type ExecuteToolResult = {
  status: 'completed' | 'queued';
  result?: unknown;
  jobId?: string;
  executionId: string;
  duration?: number;
};

/**
 * Execute a tool on the server side using the engine architecture.
 * Supports text/data tools that run inline (not native/python).
 */
export async function executeToolServer(
  input: ExecuteToolInput
): Promise<ExecuteToolResult> {
  const executionId = randomUUID();
  const startTime = Date.now();

  // Derive text input from inputs record
  const textInput =
    typeof input.inputs === 'string'
      ? input.inputs
      : (input.inputs.input as string) ??
        (input.inputs.text as string) ??
        JSON.stringify(input.inputs);

  // Direct engine execution — toolId is the engine name, inputs are options
  const output = await execute(input.toolId, textInput, input.inputs);

  return {
    status: 'completed',
    result: output,
    executionId,
    duration: Date.now() - startTime,
  };
}

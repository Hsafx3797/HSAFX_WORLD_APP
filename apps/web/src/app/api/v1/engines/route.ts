/**
 * GET /api/v1/engines
 * List all 30 engines with their option schemas.
 * Requires scope: tools:read
 *
 * Returns engine names, descriptions, runtime backends, option schemas,
 * and billing categories. B2B customers use this to discover available engines.
 */

import { NextRequest } from 'next/server';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { getEngine } from '@hsafx/tool-execution/engines';
import {
  ENGINE_RUNTIME,
  ENGINE_TOOL_CLASS,
  ENGINE_TO_CATEGORY,
  ALL_ENGINE_NAMES,
} from '@/lib/engine-constants';
import { ENGINE_OPTION_SCHEMAS } from '@/lib/engines-option-schemas';

export async function GET(request: NextRequest) {
  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check
  const scopeErr = requireScope(ctx, 'tools:read');
  if (scopeErr) return scopeErr;

  // 3. Build engine list from ALL_ENGINE_NAMES (30 engines)
  const engines = ALL_ENGINE_NAMES.map((name) => {
    const runtime = ENGINE_RUNTIME[name]!;
    const nodeEngine = runtime === 'node' ? getEngine(name) : null;

    return {
      name,
      description: nodeEngine?.description ?? `${name} engine (${runtime} backend)`,
      runtime,
      category: ENGINE_TO_CATEGORY[name] ?? 'unknown',
      billingClass: ENGINE_TOOL_CLASS[name] ?? 'text_transform',
      optionSchema: ENGINE_OPTION_SCHEMAS[name] ?? {},
    };
  });

  return apiResponse(
    {
      engines,
      total: engines.length,
      executeEndpoint: 'POST /api/v1/engine/{name}',
      usage: {
        example: {
          url: 'POST /api/v1/engine/case',
          body: {
            input: 'hello world example',
            options: { separator: '_', wordCase: 'lower' },
          },
        },
        note: 'Options vary by engine. See optionSchema for each engine.',
      },
    },
    ctx,
  );
}

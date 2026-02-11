/**
 * GET /api/v1/tools/[toolKey]
 * Get detailed metadata for a single tool by slug/ID.
 * Requires scope: tools:read
 */

import { NextRequest } from 'next/server';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { getAllTools } from '@/lib/tools/registry';

interface Params {
  params: Promise<{ toolKey: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check
  const scopeErr = requireScope(ctx, 'tools:read');
  if (scopeErr) return scopeErr;

  // 3. Find tool
  const { toolKey } = await params;
  const allTools = getAllTools();
  const tool = allTools.find((t) => t.id === toolKey);

  if (!tool) {
    return apiErrorResponse('T001', `Tool '${toolKey}' not found`, ctx, 404);
  }

  return apiResponse(
    {
      id: tool.id,
      name: tool.name,
      slug: tool.id,
      description: tool.description,
      category: tool.category,
      tier: tool.tier,
      execution: tool.execution,
      coinCost: tool.coinCost,
      inputType: tool.inputType,
      outputType: tool.outputType,
      options: tool.options ?? [],
      keywords: tool.keywords ?? [],
    },
    ctx,
  );
}

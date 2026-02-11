/**
 * GET /api/v1/tools
 * List tools — paginated, filterable by category/search/tier.
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

// Reuse the existing in-memory tool registry (from @hsafx/tool-definitions)
import { getAllTools, getToolsByCategory } from '@/lib/tools/registry';
import type { ToolMetadata, ToolCategory } from '@/lib/tools/types';

export async function GET(request: NextRequest) {
  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check
  const scopeErr = requireScope(ctx, 'tools:read');
  if (scopeErr) return scopeErr;

  // 3. Query params
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const tier = searchParams.get('tier');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

  try {
    // 4. Fetch tools
    let tools: ToolMetadata[] = category
      ? getToolsByCategory(category as ToolCategory)
      : getAllTools();

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      tools = tools.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }

    // Tier filter
    if (tier) {
      tools = tools.filter((t) => t.tier === tier);
    }

    const total = tools.length;
    const paged = tools.slice(offset, offset + limit);

    return apiResponse(
      {
        tools: paged.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.id,
          description: t.description,
          category: t.category,
          tier: t.tier,
          execution: t.execution,
          coinCost: t.coinCost,
        })),
        pagination: { total, limit, offset, hasMore: offset + limit < total },
      },
      ctx,
    );
  } catch (err) {
    return apiErrorResponse(
      'E001',
      'Failed to retrieve tools',
      ctx,
      500,
      process.env.NODE_ENV !== 'production'
        ? { detail: (err as Error).message }
        : undefined,
    );
  }
}

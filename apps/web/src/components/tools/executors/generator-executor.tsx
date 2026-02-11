'use client';

/**
 * Generator Executor
 * 
 * Handles all generator tools (UUID, password, QR code, CSS generators, etc.)
 * Uses GeneratorLayout with form inputs and output display.
 */

import * as React from 'react';
import type { ToolMetadata } from '@/lib/tools/types';
import { executeClientTool } from '@/lib/tools/executor';
import { GeneratorLayout } from '../generator-layout';

// ============================================================================
// TOOL IDS
// ============================================================================

/** Generator tool IDs that use GeneratorLayout */
export const GENERATOR_TOOL_IDS = new Set([
  // ID generators
  'uuid-v4', 'uuid-v7', 'nanoid', 'cuid', 'ulid', 'object-id',
  // Security generators
  'password-generator', 'passphrase-generator',
  // SEO generators
  'meta-tags', 'og-tags', 'schema-article', 'schema-product', 'schema-faq',
  'robots-txt', 'sitemap',
  // CSS generators (IDs match CSS_GENERATOR_IDS below)
  'gradient-generator', 'box-shadow-generator', 'border-radius-generator',
  'flexbox-generator', 'grid-generator', 'clip-path-generator',
  'filter-generator', 'transform-animation-generator', 'typography-generator',
  'tailwind-to-css',
  // Visual generators
  'qr-code', 'barcode', 'color-palette', 'favicon-generator',
  // Container generator
  'container-generator',
]);

// ============================================================================
// TYPE CHECK
// ============================================================================

/** Check if a tool ID belongs to generator category */
export function isGeneratorTool(toolId: string): boolean {
  return GENERATOR_TOOL_IDS.has(toolId);
}

// ============================================================================
// CSS PREVIEW CONFIG
// ============================================================================

/** CSS generator tool IDs that should show preview */
const CSS_GENERATOR_IDS = new Set([
  'gradient-generator', 'box-shadow-generator', 'flexbox-generator', 'grid-generator',
  'border-radius-generator', 'clip-path-generator', 'filter-generator',
  'transform-animation-generator', 'typography-generator',
]);

/** Tool IDs that support multi-generation */
const MULTI_GENERATE_IDS = new Set([
  'uuid-v4', 'uuid-v7', 'nanoid', 'password-generator',
]);

/** Get CSS preview type for a generator */
function getCssPreviewType(toolId: string): 'gradient' | 'text' | 'box' {
  if (toolId === 'gradient-generator') return 'gradient';
  if (toolId === 'typography-generator') return 'text';
  return 'box';
}

// ============================================================================
// PROPS
// ============================================================================

export interface GeneratorExecutorProps {
  tool: ToolMetadata;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GeneratorExecutor({ tool }: GeneratorExecutorProps) {
  // Get form options (use tool options or default count option)
  const formOptions = tool.options || [
    { name: 'count', type: 'number' as const, label: 'Count', default: 1, min: 1, max: 100 }
  ];

  // Determine features
  const showCssPreview = CSS_GENERATOR_IDS.has(tool.id);
  const cssPreviewType = getCssPreviewType(tool.id);
  const multiGenerate = MULTI_GENERATE_IDS.has(tool.id);

  // Create generate function
  const generate = React.useCallback(
    async (options: Record<string, unknown>): Promise<string> => {
      const input = JSON.stringify(options);
      const result = await executeClientTool(tool.id, input, options);
      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }
      return typeof result.output === 'string' 
        ? result.output 
        : JSON.stringify(result.output, null, 2);
    },
    [tool.id]
  );

  return (
    <GeneratorLayout
      toolId={tool.id}
      toolName={tool.name}
      formOptions={formOptions}
      generate={generate}
      multiGenerate={multiGenerate}
      showCssPreview={showCssPreview}
      cssPreviewType={cssPreviewType}
    />
  );
}

export default GeneratorExecutor;

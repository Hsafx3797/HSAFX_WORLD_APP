'use client';

/**
 * Text Executor
 * 
 * Handles all text transformation tools (case conversion, encoding, hashing, etc.)
 * Uses TextConverterLayout - a single textarea with transform capabilities.
 */

import * as React from 'react';
import type { ToolMetadata } from '@/lib/tools/types';
import { executeClientTool } from '@/lib/tools/executor';
import { TextConverterLayout } from '../text-converter-layout';

// ============================================================================
// TOOL IDS
// ============================================================================

/** Text tool IDs that use TextConverterLayout */
export const TEXT_TOOL_IDS = new Set([
  // Case conversions
  'uppercase', 'lowercase', 'title-case', 'sentence-case', 'camel-case', 'pascal-case',
  'snake-case', 'kebab-case', 'constant-case', 'dot-case', 'path-case', 'swap-case',
  'sponge-case', 'alternating-case',
  // Text manipulations
  'text-reverse', 'text-shuffle', 'remove-whitespace', 'remove-line-breaks',
  'remove-duplicate-lines', 'sort-lines', 'unique-lines',
  // Counters
  'word-count', 'char-count',
  // Encodings (simple text-based)
  'base64-encode', 'base64-decode', 'url-encode', 'url-decode',
  'html-encode', 'html-decode', 'unicode-encode', 'unicode-decode',
  'hex-encode', 'hex-decode',
  // Hashing
  'hash-md5', 'hash-sha1', 'hash-sha256', 'hash-sha512',
  // Generators (text-based)
  'lorem-ipsum', 'slug-generator', 'text-slug',
]);

// ============================================================================
// TYPE CHECK
// ============================================================================

/** Check if a tool ID belongs to text category */
export function isTextTool(toolId: string): boolean {
  return TEXT_TOOL_IDS.has(toolId);
}

// ============================================================================
// PROPS
// ============================================================================

export interface TextExecutorProps {
  tool: ToolMetadata;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TextExecutor({ tool }: TextExecutorProps) {
  // Create transform function that calls the tool executor
  const transform = React.useCallback(
    async (text: string, options?: Record<string, unknown>): Promise<string> => {
      const result = await executeClientTool(tool.id, text, options);
      if (!result.success) {
        throw new Error(result.error || 'Transform failed');
      }
      return typeof result.output === 'string' 
        ? result.output 
        : JSON.stringify(result.output);
    },
    [tool.id]
  );

  return (
    <TextConverterLayout
      toolId={tool.id}
      toolName={tool.name}
      placeholder={`Enter text to convert using ${tool.name}...`}
      transform={transform}
      toolOptions={tool.options}
    />
  );
}

export default TextExecutor;

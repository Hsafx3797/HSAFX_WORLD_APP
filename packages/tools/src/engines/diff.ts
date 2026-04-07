/**
 * Diff Engine — Text Comparison
 *
 * Wraps diffText from the text module to provide line/word/character
 * diffing with configurable output formats.
 */

import type { Engine, DiffEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
import { diffText } from '../text';
import { schemaDiff, configDiff, openapiDiff, graphqlSchemaDiff } from '../data-converters/specialized';

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const diffEngine: Engine<DiffEngineOptions> = {
  name: 'diff',
  description: 'Compare two texts and show differences (line/word/character).',

  validate(options: DiffEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    const validModes = ['line', 'word', 'character'];
    if (!validModes.includes(options.mode)) {
      errors.push(`Invalid mode "${options.mode}". Must be one of: ${validModes.join(', ')}`);
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: DiffEngineOptions): EngineResult {
    // Input should be an object with "left" and "right" text
    let left: string;
    let right: string;

    if (typeof input === 'string') {
      // Try to split on a separator
      const parts = input.split('\n---\n');
      if (parts.length >= 2) {
        left = parts[0]!;
        right = parts.slice(1).join('\n---\n');
      } else {
        return { output: '', metadata: { error: 'Input must contain two texts separated by \\n---\\n or be an object with "left" and "right"' } };
      }
    } else {
      left = (input.left as string) ?? '';
      right = (input.right as string) ?? '';
    }

    // Use specialized diff functions for specific types
    if (options.diffType) {
      const DIFF_FNS: Record<string, (a: string, b: string) => string> = {
        schema: schemaDiff,
        config: configDiff,
        openapi: openapiDiff,
        graphql: graphqlSchemaDiff,
      };
      const fn = DIFF_FNS[options.diffType];
      if (fn) {
        return {
          output: fn(left, right),
          metadata: { mode: options.mode, diffType: options.diffType },
        };
      }
    }

    const result = diffText(left, right, options.mode);

    // Build output based on format
    const format = options.format ?? 'unified';
    if (format === 'json') {
      return {
        output: JSON.stringify(result, null, 2),
        metadata: { mode: options.mode, changes: result.length },
      };
    }

    // Default: return the raw diff output
    return {
      output: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
      metadata: { mode: options.mode },
    };
  },
};

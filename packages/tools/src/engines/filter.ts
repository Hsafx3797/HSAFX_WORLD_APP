/**
 * Filter Engine — Universal Remove / Extract / Keep / Replace / Count
 *
 * Replaces 30+ individual remove/extract functions with one parameterized engine.
 * Supports predefined targets AND custom regex patterns.
 */

import type { Engine, FilterEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';

// ---------------------------------------------------------------------------
// Predefined target → regex mapping
// ---------------------------------------------------------------------------

const TARGETS: Record<string, RegExp> = {
  'spaces':           /\s+/g,
  'extra-spaces':     / {2,}/g,
  'vowels':           /[aeiouAEIOU]/g,
  'consonants':       /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g,
  'numbers':          /\d+/g,
  'symbols':          /[^\w\s]/g,
  'punctuation':      /[.,;:!?'"(){}[\]]/g,
  'empty-lines':      /^\s*\n/gm,
  'leading-zeros':    /\b0+(?=\d)/g,
  'trailing-spaces':  /[ \t]+$/gm,
  'html-tags':        /<[^>]+>/g,
  'emails':           /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  'urls':             /https?:\/\/[^\s]+/g,
  'hashtags':         /#\w+/g,
  'mentions':         /@\w+/g,
  'ip-addresses':     /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  'phone-numbers':    /[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,}/g,
  'dates':            /\b\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b/g,
  // Unicode categories (require 'u' flag)
  'unicode-letters':     /\p{L}/gu,
  'unicode-numbers':     /\p{N}/gu,
  'unicode-symbols':     /\p{S}/gu,
  'unicode-punctuation': /\p{P}/gu,
  'unicode-marks':       /\p{M}/gu,
  'unicode-separators':  /\p{Z}/gu,
  'unicode-non-letters': /[^\p{L}\p{N}\s]/gu,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPattern(target: string, customPattern?: string, flags?: string): RegExp {
  if (target === 'custom' && customPattern) {
    return new RegExp(customPattern, flags ?? 'g');
  }
  const predefined = TARGETS[target];
  if (predefined) {
    return flags ? new RegExp(predefined.source, flags) : predefined;
  }
  // Treat target as literal string to match
  return new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags ?? 'g');
}

function removeDuplicateLines(text: string): string {
  const seen = new Set<string>();
  return text
    .split('\n')
    .filter(line => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const filterEngine: Engine<FilterEngineOptions> = {
  name: 'filter',
  description: 'Remove, extract, keep, replace, or count matches using predefined targets or custom regex.',

  validate(options: FilterEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    const ops = ['remove', 'extract', 'keep', 'replace', 'count'];
    if (!ops.includes(options.operation)) {
      errors.push(`Invalid operation "${options.operation}". Must be one of: ${ops.join(', ')}`);
    }
    if (!options.target) {
      errors.push('target is required');
    }
    if (options.target === 'custom' && !options.customPattern) {
      errors.push('customPattern is required when target is "custom"');
    }
    if (options.operation === 'replace' && options.replacement === undefined) {
      errors.push('replacement is required for "replace" operation');
    }
    // Validate custom regex
    if (options.customPattern) {
      try {
        new RegExp(options.customPattern);
      } catch {
        errors.push(`Invalid regex pattern: ${options.customPattern}`);
      }
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: FilterEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : String(input);
    const { operation, target, customPattern, replacement, flags } = options;

    // Special case: duplicate lines
    if (target === 'duplicate-lines') {
      if (operation === 'remove') {
        return { output: removeDuplicateLines(text), metadata: { target } };
      }
      // extract duplicates
      const lines = text.split('\n');
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (const line of lines) {
        if (seen.has(line)) dupes.push(line);
        else seen.add(line);
      }
      return { output: dupes.join('\n'), metadata: { target, matchCount: dupes.length } };
    }

    const pattern = getPattern(target, customPattern, flags);

    switch (operation) {
      case 'remove': {
        const result = text.replace(pattern, replacement ?? '');
        return { output: result, metadata: { target } };
      }
      case 'extract': {
        const matches = text.match(pattern) ?? [];
        return {
          output: matches.join('\n'),
          metadata: { target, matchCount: matches.length, matches },
        };
      }
      case 'keep': {
        const matches = text.match(pattern) ?? [];
        return {
          output: matches.join(''),
          metadata: { target, matchCount: matches.length },
        };
      }
      case 'replace': {
        const result = text.replace(pattern, replacement ?? '');
        return { output: result, metadata: { target } };
      }
      case 'count': {
        const matches = text.match(pattern) ?? [];
        return {
          output: String(matches.length),
          metadata: { target, matchCount: matches.length },
        };
      }
      default:
        return { output: text };
    }
  },
};

/**
 * Wrap Engine — Universal Wrapper
 *
 * Wraps text units (word / line / sentence / selection) with any
 * left / right pair, or uses a predefined style shortcut.
 * Also supports line-level operations: numbering, prefix, suffix.
 */

import type { Engine, WrapEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';

// ---------------------------------------------------------------------------
// Style registry
// ---------------------------------------------------------------------------

const STYLES: Record<string, { left: string; right: string }> = {
  parentheses:        { left: '(',    right: ')' },
  brackets:           { left: '[',    right: ']' },
  braces:             { left: '{',    right: '}' },
  angle:              { left: '<',    right: '>' },
  'double-angle':     { left: '«',   right: '»' },
  'single-quotes':    { left: "'",   right: "'" },
  'double-quotes':    { left: '"',   right: '"' },
  backticks:          { left: '`',   right: '`' },
  'triple-backtick':  { left: '```\n', right: '\n```' },
  'triple-single':    { left: "'''", right: "'''" },
  'triple-double':    { left: '"""', right: '"""' },
  asterisk:           { left: '*',   right: '*' },
  'double-asterisk':  { left: '**',  right: '**' },
  'spoiler':          { left: '||',  right: '||' },
  'blockquote-prefix': { left: '> ', right: '' },
  'hashtag':          { left: '#',   right: '' },
  'line-numbers':     { left: '',    right: '' }, // special: handled in execute()
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitByScope(text: string, scope: WrapEngineOptions['scope']): string[] {
  switch (scope) {
    case 'word':
      return text.split(/(\s+)/); // keep whitespace tokens
    case 'line':
      return text.split(/(\n)/);
    case 'sentence':
      return text.split(/(?<=[.!?])\s+/);
    case 'selection':
    default:
      return [text];
  }
}

function isWhitespace(s: string): boolean {
  return /^\s+$/.test(s);
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const wrapEngine: Engine<WrapEngineOptions> = {
  name: 'wrap',
  description: 'Wrap text units with any left/right pair or predefined style.',

  validate(options: WrapEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    const validScopes = ['word', 'line', 'sentence', 'selection'];
    if (!validScopes.includes(options.scope)) {
      errors.push(`Invalid scope "${options.scope}". Must be one of: ${validScopes.join(', ')}`);
    }
    if (!options.style && (!options.left || !options.right)) {
      // Allow left-only or right-only for prefix/suffix operations
      if (!options.left && !options.right && !options.style) {
        errors.push('Provide left/right pair or a style shortcut');
      }
    }
    if (options.style && !STYLES[options.style]) {
      errors.push(`Unknown style "${options.style}". Available: ${Object.keys(STYLES).join(', ')}`);
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: WrapEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : String(input);
    const { scope, style } = options;
    let { left, right } = options;

    // Ensure left/right are not undefined
    left = left ?? '';
    right = right ?? '';

    // Style shortcut overrides left/right
    if (style && STYLES[style]) {
      left = STYLES[style].left;
      right = STYLES[style].right;
    }

    // Special: line-number-wrapper
    if (options.style === 'line-numbers') {
      const lines = text.split('\n');
      const width = String(lines.length).length;
      const output = lines
        .map((line, i) => `${String(i + 1).padStart(width, ' ')} | ${line}`)
        .join('\n');
      return { output, metadata: { lineCount: lines.length } };
    }

    const segments = splitByScope(text, scope);
    let wrappedCount = 0;

    const result = segments
      .map(seg => {
        if (scope === 'word' && isWhitespace(seg)) return seg;
        if (scope === 'line' && seg === '\n') return seg;
        if (!seg.trim()) return seg;
        wrappedCount++;
        return `${left}${seg}${right}`;
      })
      .join('');

    return { output: result, metadata: { wrappedCount } };
  },
};

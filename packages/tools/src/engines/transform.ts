/**
 * Transform Engine — Reverse / Sort / Shuffle / Unique / Repeat / Truncate / Pad
 *
 * Parameterized text transformation with configurable scope
 * (characters, words, lines, sentences, paragraphs).
 */

import type { Engine, TransformEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitByScope(text: string, scope: TransformEngineOptions['scope']): string[] {
  switch (scope) {
    case 'characters':   return text.split('');
    case 'words':        return text.split(/\s+/).filter(Boolean);
    case 'lines':        return text.split('\n');
    case 'sentences':    return text.split(/(?<=[.!?])\s+/).filter(Boolean);
    case 'paragraphs':   return text.split(/\n\s*\n/).filter(Boolean);
    default:             return text.split('\n');
  }
}

function joinByScope(parts: string[], scope: TransformEngineOptions['scope']): string {
  switch (scope) {
    case 'characters':   return parts.join('');
    case 'words':        return parts.join(' ');
    case 'lines':        return parts.join('\n');
    case 'sentences':    return parts.join(' ');
    case 'paragraphs':   return parts.join('\n\n');
    default:             return parts.join('\n');
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const transformEngine: Engine<TransformEngineOptions> = {
  name: 'transform',
  description: 'Reverse, sort, shuffle, unique, repeat, truncate, or pad text at any scope.',

  validate(options: TransformEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    const validOps = [
      'reverse', 'sort', 'shuffle', 'unique', 'repeat', 'truncate', 'pad', 'join', 'split',
      'trim', 'pad-lines', 'normalize-length', 'indent', 'dedent',
      'replace-breaks', 'split-by-length', 'scramble-letters', 'pick-random',
    ];
    if (!validOps.includes(options.operation)) {
      errors.push(`Invalid operation "${options.operation}". Must be one of: ${validOps.join(', ')}`);
    }
    const validScopes = ['characters', 'words', 'lines', 'sentences', 'paragraphs'];
    if (!validScopes.includes(options.scope)) {
      errors.push(`Invalid scope "${options.scope}". Must be one of: ${validScopes.join(', ')}`);
    }
    if (options.operation === 'repeat' && (options.count === undefined || options.count < 1)) {
      errors.push('count must be >= 1 for repeat operation');
    }
    if (options.operation === 'truncate' && !options.maxLength) {
      errors.push('maxLength is required for truncate operation');
    }
    if (options.operation === 'pad' && !options.targetLength) {
      errors.push('targetLength is required for pad operation');
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: TransformEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : String(input);
    const { operation, scope } = options;

    switch (operation) {
      case 'reverse': {
        const parts = splitByScope(text, scope);
        return { output: joinByScope(parts.reverse(), scope) };
      }

      case 'sort': {
        const parts = splitByScope(text, scope);
        const { direction = 'asc', caseSensitive = false, numeric = false } = options;
        parts.sort((a, b) => {
          let va: string | number = a;
          let vb: string | number = b;
          if (!caseSensitive) { va = a.toLowerCase(); vb = b.toLowerCase(); }
          if (numeric) { va = parseFloat(a) || 0; vb = parseFloat(b) || 0; }
          if (va < vb) return direction === 'asc' ? -1 : 1;
          if (va > vb) return direction === 'asc' ? 1 : -1;
          return 0;
        });
        return { output: joinByScope(parts, scope) };
      }

      case 'shuffle': {
        const parts = splitByScope(text, scope);
        return { output: joinByScope(shuffleArray(parts), scope) };
      }

      case 'unique': {
        const parts = splitByScope(text, scope);
        const seen = new Set<string>();
        const unique = parts.filter(p => {
          if (seen.has(p)) return false;
          seen.add(p);
          return true;
        });
        return { output: joinByScope(unique, scope), metadata: { removed: parts.length - unique.length } };
      }

      case 'repeat': {
        const { count = 2, separator = '\n' } = options;
        const output = Array(count).fill(text).join(separator);
        return { output, metadata: { count } };
      }

      case 'truncate': {
        const { maxLength = 100, suffix = '...' } = options;
        if (text.length <= maxLength) return { output: text };
        return { output: text.slice(0, maxLength - suffix.length) + suffix };
      }

      case 'pad': {
        const { targetLength = 80, padChar = ' ', padSide = 'right' } = options;
        let output = text;
        if (padSide === 'left') {
          output = output.padStart(targetLength, padChar);
        } else if (padSide === 'both') {
          const totalPad = Math.max(0, targetLength - output.length);
          const leftPad = Math.floor(totalPad / 2);
          const rightPad = totalPad - leftPad;
          output = padChar.repeat(leftPad) + output + padChar.repeat(rightPad);
        } else {
          output = output.padEnd(targetLength, padChar);
        }
        return { output };
      }

      case 'join': {
        const parts = splitByScope(text, scope);
        const { delimiter = '' } = options;
        return { output: parts.join(delimiter), metadata: { partCount: parts.length } };
      }

      case 'split': {
        const { delimiter = '\n' } = options;
        const parts = text.split(delimiter);
        return { output: joinByScope(parts, scope), metadata: { partCount: parts.length } };
      }

      case 'trim': {
        const lines = text.split('\n');
        return { output: lines.map(l => l.trim()).join('\n') };
      }

      case 'pad-lines': {
        const { targetLength = 80, padChar = ' ', padSide = 'right' } = options;
        const lines = text.split('\n');
        return {
          output: lines.map(l => {
            if (padSide === 'left') return l.padStart(targetLength, padChar);
            return l.padEnd(targetLength, padChar);
          }).join('\n'),
        };
      }

      case 'normalize-length': {
        const { targetLength = 80 } = options;
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let current = '';
        for (const word of words) {
          if (current.length + word.length + 1 > targetLength && current) {
            lines.push(current);
            current = word;
          } else {
            current = current ? current + ' ' + word : word;
          }
        }
        if (current) lines.push(current);
        return { output: lines.join('\n') };
      }

      case 'indent': {
        const { indentStr = '  ' } = options;
        return { output: text.split('\n').map(l => indentStr + l).join('\n') };
      }

      case 'dedent': {
        const lines = text.split('\n');
        const nonEmpty = lines.filter(l => l.trim().length > 0);
        const minIndent = nonEmpty.reduce((min, l) => {
          const match = l.match(/^(\s*)/);
          const indent = match ? match[1].length : 0;
          return Math.min(min, indent);
        }, Infinity);
        const amountToRemove = minIndent === Infinity ? 0 : minIndent;
        return { output: lines.map(l => l.slice(amountToRemove)).join('\n') };
      }

      case 'replace-breaks': {
        const { lineBreak = '\\n' } = options;
        // Replace all line break styles with the chosen one
        let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        if (lineBreak === '\\r\\n') normalized = normalized.replace(/\n/g, '\r\n');
        else if (lineBreak === '\\r') normalized = normalized.replace(/\n/g, '\r');
        else if (lineBreak === ' ') normalized = normalized.replace(/\n/g, ' ');
        return { output: normalized };
      }

      case 'split-by-length': {
        const { targetLength = 80 } = options;
        const result: string[] = [];
        for (let i = 0; i < text.length; i += targetLength) {
          result.push(text.slice(i, i + targetLength));
        }
        return { output: result.join('\n') };
      }

      case 'scramble-letters': {
        return {
          output: text.split(/(\s+)/).map(token => {
            if (/^\s+$/.test(token)) return token;
            if (token.length <= 2) return token;
            // Keep first and last, shuffle middle
            const middle = token.slice(1, -1).split('');
            return token[0] + shuffleArray(middle).join('') + token[token.length - 1];
          }).join(''),
        };
      }

      case 'pick-random': {
        const parts = splitByScope(text, scope);
        if (parts.length === 0) return { output: '' };
        return { output: parts[Math.floor(Math.random() * parts.length)] };
      }

      default:
        return { output: text };
    }
  },
};

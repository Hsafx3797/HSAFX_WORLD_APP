/**
 * Case Engine — Universal Case Conversion
 *
 * Supports:
 *  - Word-level: split → apply casing → join with separator
 *  - Char-level: alternating, swap, random case transforms
 *  - Word-wrap: wrap each word with left/right pair (bracket-case etc.)
 */

import type { Engine, CaseEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Split any input string into words, handling camelCase, PascalCase, separators, etc. */
function splitIntoWords(input: string, strip: boolean): string[] {
  let s = input;

  // Insert boundary between lowercase→uppercase  and  uppercase→lowercase-continuation
  s = s.replace(/([a-z\d])([A-Z])/g, '$1\0$2');
  s = s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1\0$2');

  // Replace common separators with the null-char boundary
  s = s.replace(/[\s_\-./|:~+@#^&=;,\\]+/g, '\0');

  if (strip) {
    s = s.replace(/[^a-zA-Z0-9\0]/g, '');
  }

  return s.split('\0').filter(Boolean);
}

function applyWordCase(word: string, casing: CaseEngineOptions['wordCase']): string {
  switch (casing) {
    case 'lower':
      return word.toLowerCase();
    case 'upper':
      return word.toUpperCase();
    case 'title':
    case 'capitalize':
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    case 'preserve':
    default:
      return word;
  }
}

/** Character-level transforms */
function applyCharTransform(text: string, transform: CaseEngineOptions['charTransform']): string {
  switch (transform) {
    case 'alternating':
      return text
        .split('')
        .map((ch, i) => (i % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase()))
        .join('');
    case 'inverse-alternating':
      return text
        .split('')
        .map((ch, i) => (i % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase()))
        .join('');
    case 'swap':
      return text
        .split('')
        .map(ch => {
          if (ch === ch.toUpperCase()) return ch.toLowerCase();
          if (ch === ch.toLowerCase()) return ch.toUpperCase();
          return ch;
        })
        .join('');
    case 'random':
      return text
        .split('')
        .map(ch => (Math.random() > 0.5 ? ch.toUpperCase() : ch.toLowerCase()))
        .join('');
    default:
      return text;
  }
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const caseEngine: Engine<CaseEngineOptions> = {
  name: 'case',
  description: 'Universal case conversion — any separator + any word casing + character-level transforms.',

  validate(options: CaseEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    const validCases = ['lower', 'upper', 'title', 'capitalize', 'preserve'];
    if (options.wordCase && !validCases.includes(options.wordCase)) {
      errors.push(`Invalid wordCase "${options.wordCase}". Must be one of: ${validCases.join(', ')}`);
    }
    if (options.firstWordCase && !validCases.includes(options.firstWordCase)) {
      errors.push(`Invalid firstWordCase "${options.firstWordCase}". Must be one of: ${validCases.join(', ')}`);
    }
    const validTransforms = ['alternating', 'inverse-alternating', 'swap', 'random'];
    if (options.charTransform && !validTransforms.includes(options.charTransform)) {
      errors.push(`Invalid charTransform "${options.charTransform}". Must be one of: ${validTransforms.join(', ')}`);
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: CaseEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : String(input);

    // Character-level transform — bypass word splitting
    if (options.charTransform) {
      return {
        output: applyCharTransform(text, options.charTransform),
        metadata: { charTransform: options.charTransform },
      };
    }

    const {
      separator = '_',
      wordCase = 'lower',
      firstWordCase,
      preserveConsecutiveUppercase = false,
      stripNonAlphanumeric = false,
      wordWrap,
    } = options;

    let words = splitIntoWords(text, stripNonAlphanumeric);

    if (preserveConsecutiveUppercase) {
      words = words.map(w => (/^[A-Z]+$/.test(w) ? w : w.toLowerCase()));
    }

    const cased = words.map((word, index) => {
      const w = index === 0 && firstWordCase
        ? applyWordCase(word, firstWordCase)
        : applyWordCase(word, wordCase);
      if (wordWrap) return `${wordWrap.left}${w}${wordWrap.right}`;
      return w;
    });

    const result = cased.join(wordWrap ? ' ' : separator);
    return { output: result, metadata: { wordCount: words.length } };
  },
};

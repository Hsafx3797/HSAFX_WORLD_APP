/**
 * Counter Engine — Text Metrics & Analysis
 *
 * Wraps analyzeText, calculateReadability, getWordFrequency
 * into a single engine with configurable metric selection.
 */

import type { Engine, CounterEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
import { analyzeText, calculateReadability, getWordFrequency } from '../text';

// ---------------------------------------------------------------------------
// Metric definitions
// ---------------------------------------------------------------------------

const AVAILABLE_METRICS = [
  'characters', 'characters-no-spaces', 'words', 'sentences', 'paragraphs',
  'lines', 'avg-word-length', 'avg-sentence-length', 'reading-time',
  'speaking-time', 'readability', 'word-frequency', 'all',
] as const;

type MetricName = typeof AVAILABLE_METRICS[number];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const counterEngine: Engine<CounterEngineOptions> = {
  name: 'counter',
  description: 'Text statistics, readability scores, and word frequency analysis.',

  validate(options: CounterEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    if (!options.metrics || options.metrics.length === 0) {
      errors.push('At least one metric must be specified.');
    } else {
      for (const m of options.metrics) {
        if (!AVAILABLE_METRICS.includes(m as MetricName)) {
          errors.push(`Unknown metric "${m}". Available: ${AVAILABLE_METRICS.join(', ')}`);
        }
      }
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: CounterEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    const want = new Set<string>(options.metrics);
    const all = want.has('all');

    const result: Record<string, unknown> = {};

    // Basic stats
    if (all || want.has('characters') || want.has('characters-no-spaces') ||
        want.has('words') || want.has('sentences') || want.has('paragraphs') ||
        want.has('lines') || want.has('avg-word-length') || want.has('avg-sentence-length') ||
        want.has('reading-time') || want.has('speaking-time')) {
      const stats = analyzeText(text);
      const mapping: Record<string, keyof typeof stats> = {
        'characters': 'characters',
        'characters-no-spaces': 'charactersNoSpaces',
        'words': 'words',
        'sentences': 'sentences',
        'paragraphs': 'paragraphs',
        'lines': 'lines',
        'avg-word-length': 'averageWordLength',
        'avg-sentence-length': 'averageSentenceLength',
        'reading-time': 'readingTime',
        'speaking-time': 'speakingTime',
      };
      for (const [metricKey, statsKey] of Object.entries(mapping)) {
        if (all || want.has(metricKey)) {
          result[metricKey] = stats[statsKey];
        }
      }
    }

    // Readability
    if (all || want.has('readability')) {
      result['readability'] = calculateReadability(text);
    }

    // Word frequency
    if (all || want.has('word-frequency')) {
      const opts = options.options ?? {};
      result['word-frequency'] = getWordFrequency(text, {
        caseSensitive: opts.caseSensitive,
        excludeStopWords: opts.excludeStopWords,
        limit: opts.topN,
      });
    }

    // Build a nice text output summary
    const lines: string[] = [];
    for (const [key, val] of Object.entries(result)) {
      if (typeof val === 'object') {
        lines.push(`${key}: ${JSON.stringify(val)}`);
      } else {
        lines.push(`${key}: ${val}`);
      }
    }

    return { output: lines.join('\n'), metadata: result };
  },
};

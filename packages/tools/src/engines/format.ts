/**
 * Format Engine — Format / Minify / Validate / Sort-Keys
 *
 * Wraps formatting operations for JSON, XML, YAML, SQL, HTML,
 * GraphQL, Markdown, CSS and more.
 */

import type { Engine, FormatEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
import { formatJson, minifyJson, sortJsonKeys } from '../data-converters/json';
import { formatXml, validateXml } from '../data-converters/xml';
import { formatYaml } from '../data-converters/yaml';
import { sortKeys, normalizeLineEndings, convertIndentation } from '../data-converters/format';
import { validateCsv } from '../data-converters/csv';
import { formatSql, formatGraphql, formatMarkdown, formatHtml } from '../data-converters/code';
import { beautifyCss, minifyCss } from '../data-converters/code';

// ---------------------------------------------------------------------------
// Operation registry: "language:operation" → function
// ---------------------------------------------------------------------------

type FormatFn = (input: string, options?: FormatEngineOptions) => string;

function buildOps(): Record<string, FormatFn> {
  return {
    'json:format':     (i, o) => formatJson(i, typeof o?.options?.indent === 'number' ? o.options.indent : 2),
    'json:minify':     (i) => minifyJson(i),
    'json:sort-keys':  (i) => sortJsonKeys(i),
    'json:validate':   (i) => {
      try { JSON.parse(i); return 'Valid JSON'; }
      catch (e) { return `Invalid JSON: ${(e as Error).message}`; }
    },
    'xml:format':      (i) => formatXml(i),
    'xml:validate':    (i) => {
      const r = validateXml(i);
      return r.valid ? 'Valid XML' : `Invalid XML: ${r.error}`;
    },
    'yaml:format':     formatYaml,
    'yaml:sort-keys':  (i) => sortKeys(i, true),
    'csv:validate':    (i) => {
      const r = validateCsv(i);
      return r.valid ? 'Valid CSV' : `Invalid CSV: ${r.error}`;
    },
    'sql:format':      formatSql,
    'graphql:format':  formatGraphql,
    'markdown:format': formatMarkdown,
    'html:format':     (i) => formatHtml(i),
    'css:format':      beautifyCss,
    'css:minify':      minifyCss,
    'xml:minify':      (i) => i.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim(),
    'html:minify':     (i) => i.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim(),
    'sql:minify':      (i) => i.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim(),
    'yaml:validate':   (i) => {
      try { formatYaml(i); return 'Valid YAML'; }
      catch (e) { return `Invalid YAML: ${(e as Error).message}`; }
    },
    'text:line-endings': (i, o) => normalizeLineEndings(i, o?.options?.lineEnding ?? 'lf'),
    'text:indentation':  (i, o) => {
      const indent = o?.options?.indent;
      if (indent === 'tab') return convertIndentation(i, false, true, 2);
      return convertIndentation(i, false, false, typeof indent === 'number' ? indent : 2);
    },
  };
}

const OPS = buildOps();

const LANGUAGES = [...new Set(Object.keys(OPS).map(k => k.split(':')[0]!))].sort();
const OPERATIONS = ['format', 'minify', 'validate', 'sort-keys', 'line-endings', 'indentation'];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const formatEngine: Engine<FormatEngineOptions> = {
  name: 'format',
  description: 'Format, minify, validate, or sort keys in JSON, XML, YAML, CSV, etc.',

  validate(options: FormatEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    if (!OPERATIONS.includes(options.operation)) {
      errors.push(`Invalid operation "${options.operation}". Must be one of: ${OPERATIONS.join(', ')}`);
    }
    const key = `${options.language}:${options.operation}`;
    if (!OPS[key]) {
      errors.push(
        `Operation "${options.operation}" not available for "${options.language}". ` +
        `Available languages: ${LANGUAGES.join(', ')}`,
      );
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: FormatEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
    const key = `${options.language}:${options.operation}`;
    const fn = OPS[key];
    if (!fn) {
      return { output: text, metadata: { error: `No handler for ${key}` } };
    }
    return {
      output: fn(text, options),
      metadata: { language: options.language, operation: options.operation },
    };
  },
};

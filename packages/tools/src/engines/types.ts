/**
 * Engine Architecture — Shared Types
 *
 * Every engine implements the Engine interface. The top-level executor
 * uses these types to dispatch, validate, and return results.
 */

// ---------------------------------------------------------------------------
// Core engine contract
// ---------------------------------------------------------------------------

export interface Engine<TOptions extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique engine name (kebab-case, e.g. "case", "encode", "filter") */
  readonly name: string;

  /** Human-readable description */
  readonly description: string;

  /** Validate options before execution — fail fast with clear errors */
  validate(options: TOptions): ValidationOutcome;

  /** Execute the engine */
  execute(input: EngineInput, options: TOptions): EngineResult;
}

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

/** Engines accept either a plain string or structured data */
export type EngineInput = string | Record<string, unknown>;

export interface EngineResult {
  /** Primary output — string for text engines, object for data engines */
  output: string | Record<string, unknown>;

  /** Optional metadata (word count, timing, matched items, etc.) */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationOutcome =
  | { valid: true }
  | { valid: false; errors: string[] };

// ---------------------------------------------------------------------------
// Engine-specific option interfaces
// ---------------------------------------------------------------------------

export interface CaseEngineOptions extends Record<string, unknown> {
  separator?: string;
  wordCase?: 'lower' | 'upper' | 'title' | 'capitalize' | 'preserve';
  firstWordCase?: 'lower' | 'upper' | 'title' | 'capitalize' | 'preserve';
  preserveConsecutiveUppercase?: boolean;
  stripNonAlphanumeric?: boolean;
  /** Character-level transform — bypasses word-split logic */
  charTransform?: 'alternating' | 'inverse-alternating' | 'swap' | 'random';
  /** Wrap each word with a pair of strings instead of joining with separator */
  wordWrap?: { left: string; right: string };
}

export interface WrapEngineOptions extends Record<string, unknown> {
  scope: 'word' | 'line' | 'sentence' | 'selection';
  left: string;
  right: string;
  style?: string;
}

export interface FilterEngineOptions extends Record<string, unknown> {
  operation: 'remove' | 'extract' | 'keep' | 'replace' | 'count';
  target: string;
  scope?: 'characters' | 'words' | 'lines';
  customPattern?: string;
  replacement?: string;
  flags?: string;
}

export interface TransformEngineOptions extends Record<string, unknown> {
  operation: 'reverse' | 'sort' | 'shuffle' | 'unique' | 'repeat' | 'truncate' | 'pad' | 'join' | 'split' | 'trim' | 'pad-lines' | 'normalize-length' | 'indent' | 'dedent' | 'replace-breaks' | 'split-by-length' | 'scramble-letters' | 'pick-random';
  scope: 'characters' | 'words' | 'lines' | 'sentences' | 'paragraphs';
  direction?: 'asc' | 'desc';
  caseSensitive?: boolean;
  numeric?: boolean;
  count?: number;
  separator?: string;
  maxLength?: number;
  suffix?: string;
  padChar?: string;
  padSide?: 'left' | 'right' | 'both';
  targetLength?: number;
  delimiter?: string;
  indentStr?: string;
  lineBreak?: string;
}

export interface EncodeEngineOptions extends Record<string, unknown> {
  codec: string;
  operation: 'encode' | 'decode';
  shift?: number;
  key?: string;
  rails?: number;
  format?: string;
  style?: string;
}

export interface HashEngineOptions extends Record<string, unknown> {
  algorithm: string;
  output?: 'hex' | 'base64' | 'binary';
  hmac?: boolean;
  key?: string;
}

export interface CounterEngineOptions extends Record<string, unknown> {
  metrics: string[];
  options?: {
    excludeSpaces?: boolean;
    caseSensitive?: boolean;
    excludeStopWords?: boolean;
    topN?: number;
  };
}

export interface ConvertEngineOptions extends Record<string, unknown> {
  from: string;
  to: string;
  options?: {
    indent?: number;
    rootElement?: string;
    delimiter?: string;
    hasHeaders?: boolean;
    sortKeys?: boolean;
    lineEnding?: 'lf' | 'crlf';
  };
}

export interface FormatEngineOptions extends Record<string, unknown> {
  language: string;
  operation: 'format' | 'minify' | 'validate' | 'sort-keys' | 'line-endings' | 'indentation';
  options?: {
    indent?: number | 'tab';
    sortKeys?: boolean;
    quoteStyle?: 'single' | 'double';
    trailingComma?: boolean;
    lineEnding?: 'lf' | 'crlf' | 'cr';
  };
}

export interface GenerateDataOptions extends Record<string, unknown> {
  type: string;
  count?: number;
  options?: Record<string, unknown>;
}

export interface GenerateWebOptions extends Record<string, unknown> {
  type: string;
  count?: number;
  options?: Record<string, unknown>;
}

export interface ValidateEngineOptions extends Record<string, unknown> {
  type: string;
  strict?: boolean;
  version?: string | number;
  countryCode?: string;
  carrier?: string;
}

export interface UnitEngineOptions extends Record<string, unknown> {
  category: string;
  from: string;
  to: string;
  value: number;
}

export interface CalculateEngineOptions extends Record<string, unknown> {
  type: string;
  inputs: Record<string, unknown>;
}

export interface CommentEngineOptions extends Record<string, unknown> {
  language: string;
  style: 'line' | 'block' | 'doc';
  operation: 'add' | 'remove' | 'toggle';
}

export interface MarkupEngineOptions extends Record<string, unknown> {
  format: 'html' | 'markdown' | 'bbcode' | 'latex';
  tag: string;
  level?: number;
  scope?: 'word' | 'line' | 'selection';
  operation?: 'wrap' | 'unwrap' | 'convert';
  convertTo?: 'html' | 'markdown';
  attributes?: Record<string, string>;
}

export interface DiffEngineOptions extends Record<string, unknown> {
  mode: 'line' | 'word' | 'character';
  format?: 'unified' | 'inline' | 'json';
  contextLines?: number;
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  diffType?: 'schema' | 'openapi' | 'graphql' | 'config';
}

export interface SchemaEngineOptions extends Record<string, unknown> {
  from: string;
  to: string;
  options?: {
    name?: string;
    exportStyle?: 'named' | 'default';
    strict?: boolean;
  };
}

export interface ApiEngineOptions extends Record<string, unknown> {
  operation: 'convert' | 'parse' | 'beautify';
  from?: string;
  to?: string;
  parseType?: string;
}

/**
 * Engine Registry & Top-Level Executor
 *
 * This is the single entry point for all engine operations.
 *
 * Usage:
 *   import { execute, getEngine, listEngines } from '@hsafx/tool-execution/engines';
 *
 *   // Direct execution
 *   const result = execute('case', 'hello world', { separator: '_', wordCase: 'lower' });
 */

// ---------------------------------------------------------------------------
// Re-export types
// ---------------------------------------------------------------------------

export type {
  Engine,
  EngineInput,
  EngineResult,
  ValidationOutcome,
  CaseEngineOptions,
  WrapEngineOptions,
  FilterEngineOptions,
  TransformEngineOptions,
  EncodeEngineOptions,
  HashEngineOptions,
  CounterEngineOptions,
  ConvertEngineOptions,
  FormatEngineOptions,
  GenerateDataOptions,
  GenerateWebOptions,
  ValidateEngineOptions,
  UnitEngineOptions,
  CalculateEngineOptions,
  CommentEngineOptions,
  MarkupEngineOptions,
  DiffEngineOptions,
  SchemaEngineOptions,
  ApiEngineOptions,
} from './types';

export type { UnicodeEngineOptions } from './unicode';

// ---------------------------------------------------------------------------
// Import all engines
// ---------------------------------------------------------------------------

import type { Engine, EngineInput, EngineResult } from './types';

import { caseEngine } from './case';
import { wrapEngine } from './wrap';
import { filterEngine } from './filter';
import { transformEngine } from './transform';
import { encodeEngine } from './encode';
import { hashEngine } from './hash';
import { counterEngine } from './counter';
import { convertEngine } from './convert';
import { formatEngine } from './format';
import { generateDataEngine } from './generate-data';
import { generateWebEngine } from './generate-web';
import { validateEngine } from './validate';
import { unitEngine } from './unit';
import { calculateEngine } from './calculate';
import { commentEngine } from './comment';
import { markupEngine } from './markup';
import { diffEngine } from './diff';
import { schemaEngine } from './schema';
import { apiEngine } from './api';
import { unicodeEngine } from './unicode';

// ---------------------------------------------------------------------------
// Re-export individual engines
// ---------------------------------------------------------------------------

export {
  caseEngine,
  wrapEngine,
  filterEngine,
  transformEngine,
  encodeEngine,
  unicodeEngine,
  hashEngine,
  counterEngine,
  convertEngine,
  formatEngine,
  generateDataEngine,
  generateWebEngine,
  validateEngine,
  unitEngine,
  calculateEngine,
  commentEngine,
  markupEngine,
  diffEngine,
  schemaEngine,
  apiEngine,
};

// ---------------------------------------------------------------------------
// Engine registry (name → engine)
// ---------------------------------------------------------------------------

// Using Engine<Record<string, unknown>> as the common base type
const ALL_ENGINES: Engine<Record<string, unknown>>[] = [
  caseEngine,
  wrapEngine,
  filterEngine,
  transformEngine,
  encodeEngine,
  hashEngine,
  counterEngine,
  convertEngine,
  formatEngine,
  generateDataEngine,
  generateWebEngine,
  validateEngine,
  unitEngine,
  calculateEngine,
  commentEngine,
  markupEngine,
  diffEngine,
  schemaEngine,
  apiEngine,
  unicodeEngine,
];

const ENGINE_MAP = new Map<string, Engine<Record<string, unknown>>>();
for (const engine of ALL_ENGINES) {
  ENGINE_MAP.set(engine.name, engine);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get an engine by name.
 */
export function getEngine(name: string): Engine<Record<string, unknown>> | undefined {
  return ENGINE_MAP.get(name);
}

/**
 * List all registered engine names.
 */
export function listEngines(): string[] {
  return [...ENGINE_MAP.keys()];
}

/**
 * Execute an engine by name with explicit options.
 *
 * @param engineName - The engine name (e.g. "case", "encode")
 * @param input      - Text input or structured data
 * @param options    - Engine-specific options
 * @returns EngineResult
 * @throws Error if engine not found or validation fails
 */
export function execute(
  engineName: string,
  input: EngineInput,
  options: Record<string, unknown>,
): EngineResult {
  const engine = ENGINE_MAP.get(engineName);
  if (!engine) {
    throw new Error(
      `Unknown engine. Available: ${listEngines().join(', ')}`,
    );
  }

  const validation = engine.validate(options);
  if (!validation.valid) {
    throw new Error(
      `Validation failed for engine "${engineName}": ${validation.errors.join('; ')}`,
    );
  }

  return engine.execute(input, options);
}

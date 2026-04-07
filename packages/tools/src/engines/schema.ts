/**
 * Schema Engine — Schema Conversion
 *
 * Converts between JSON Schema, TypeScript interfaces, Zod schemas,
 * and Joi schemas.
 */

import type { Engine, SchemaEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
import {
  jsonSchemaToTypeScript,
  jsonSchemaToZod,
  jsonSchemaToJoi,
  typeScriptToJsonSchema,
  sqlDdlToJsonSchema,
} from '../data-converters/schema';

// ---------------------------------------------------------------------------
// Route table
// ---------------------------------------------------------------------------

type SchemaFn = (input: string, name?: string) => string;

const ROUTES: Record<string, SchemaFn> = {
  'json-schema:typescript': (i, n) => jsonSchemaToTypeScript(i, n),
  'json-schema:zod':        (i, n) => jsonSchemaToZod(i, n),
  'json-schema:joi':        (i, n) => jsonSchemaToJoi(i, n),
  'typescript:json-schema': (i) => typeScriptToJsonSchema(i),
  'sql-ddl:json-schema':    (i) => sqlDdlToJsonSchema(i),
};

const FORMATS = [...new Set(Object.keys(ROUTES).flatMap(k => k.split(':')))].sort();

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const schemaEngine: Engine<SchemaEngineOptions> = {
  name: 'schema',
  description: 'Convert between JSON Schema, TypeScript, Zod, Joi, and SQL DDL definitions.',

  validate(options: SchemaEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    const key = `${options.from}:${options.to}`;
    if (!ROUTES[key]) {
      errors.push(
        `No schema route "${options.from}" → "${options.to}". ` +
        `Available formats: ${FORMATS.join(', ')}`,
      );
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: SchemaEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
    const key = `${options.from}:${options.to}`;
    const fn = ROUTES[key];
    if (!fn) {
      return { output: text, metadata: { error: `No route: ${key}` } };
    }
    const name = options.options?.name ?? 'Root';
    return {
      output: fn(text, name),
      metadata: { from: options.from, to: options.to },
    };
  },
};

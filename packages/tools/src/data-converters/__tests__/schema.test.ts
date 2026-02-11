import { describe, it, expect } from 'vitest';
import {
  jsonSchemaToTypeScript,
  jsonSchemaToZod,
  jsonSchemaToJoi,
  typeScriptToJsonSchema,
  inferJsonSchema,
} from '../schema';

// ─── helpers ────────────────────────────────────────────────────────────────

const schema = (obj: Record<string, unknown>) => JSON.stringify(obj);

// ─── jsonSchemaToTypeScript ─────────────────────────────────────────────────

describe('jsonSchemaToTypeScript', () => {
  it('generates interface for simple object schema', () => {
    const s = schema({
      type: 'object',
      properties: { name: { type: 'string' }, age: { type: 'number' } },
      required: ['name'],
    });
    const result = jsonSchemaToTypeScript(s, 'User');
    expect(result).toContain('interface User');
    expect(result).toContain('name: string');
    expect(result).toContain('age?: number');
  });

  it('marks required properties without ?', () => {
    const s = schema({
      type: 'object',
      properties: { id: { type: 'integer' } },
      required: ['id'],
    });
    const result = jsonSchemaToTypeScript(s, 'Item');
    expect(result).toMatch(/id: number/);
    expect(result).not.toMatch(/id\?/);
  });

  it('marks optional properties with ?', () => {
    const s = schema({
      type: 'object',
      properties: { bio: { type: 'string' } },
    });
    const result = jsonSchemaToTypeScript(s);
    expect(result).toMatch(/bio\?: string/);
  });

  it('handles boolean type', () => {
    const s = schema({
      type: 'object',
      properties: { active: { type: 'boolean' } },
    });
    expect(jsonSchemaToTypeScript(s)).toContain('boolean');
  });

  it('handles array type with items', () => {
    const s = schema({
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } } },
    });
    expect(jsonSchemaToTypeScript(s)).toContain('string[]');
  });

  it('handles array without items as unknown[]', () => {
    const s = schema({
      type: 'object',
      properties: { data: { type: 'array' } },
    });
    expect(jsonSchemaToTypeScript(s)).toContain('unknown[]');
  });

  it('handles enum strings', () => {
    const s = schema({
      type: 'object',
      properties: { status: { type: 'string', enum: ['active', 'inactive'] } },
    });
    const result = jsonSchemaToTypeScript(s);
    expect(result).toContain("'active'");
    expect(result).toContain("'inactive'");
  });

  it('handles date-time format as Date | string', () => {
    const s = schema({
      type: 'object',
      properties: { created: { type: 'string', format: 'date-time' } },
    });
    expect(jsonSchemaToTypeScript(s)).toContain('Date | string');
  });

  it('handles null type', () => {
    const s = schema({
      type: 'object',
      properties: { nothing: { type: 'null' } },
    });
    expect(jsonSchemaToTypeScript(s)).toContain('null');
  });

  it('handles nested object with properties as inline type', () => {
    const s = schema({
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: { street: { type: 'string' } },
        },
      },
    });
    const result = jsonSchemaToTypeScript(s);
    expect(result).toContain('street');
  });

  it('handles additionalProperties as Record type', () => {
    const s = schema({
      type: 'object',
      properties: {
        meta: { type: 'object', additionalProperties: { type: 'string' } },
      },
    });
    expect(jsonSchemaToTypeScript(s)).toContain('Record<string, string>');
  });

  it('handles object without properties as Record<string, unknown>', () => {
    const s = schema({
      type: 'object',
      properties: { data: { type: 'object' } },
    });
    expect(jsonSchemaToTypeScript(s)).toContain('Record<string, unknown>');
  });

  it('handles oneOf as union', () => {
    const s = schema({
      type: 'object',
      properties: {
        value: { oneOf: [{ type: 'string' }, { type: 'number' }] },
      },
    });
    expect(jsonSchemaToTypeScript(s)).toContain('string | number');
  });

  it('handles allOf as intersection', () => {
    const s = schema({
      type: 'object',
      properties: {
        value: { allOf: [{ type: 'string' }, { type: 'number' }] },
      },
    });
    expect(jsonSchemaToTypeScript(s)).toContain('string & number');
  });

  it('defaults name to Root', () => {
    const s = schema({ type: 'object', properties: {} });
    expect(jsonSchemaToTypeScript(s)).toContain('interface Root');
  });

  it('returns type alias for non-object schema', () => {
    const s = schema({ type: 'string' });
    const result = jsonSchemaToTypeScript(s, 'Name');
    expect(result).toContain('type Name = string');
  });

  it('returns error comment for invalid JSON', () => {
    const result = jsonSchemaToTypeScript('not json');
    expect(result).toMatch(/^\/\/ Error:/);
  });

  it('includes description as comment', () => {
    const s = schema({
      type: 'object',
      properties: { name: { type: 'string', description: 'user name' } },
    });
    expect(jsonSchemaToTypeScript(s)).toContain('// user name');
  });

  it('handles integer type as number', () => {
    const s = schema({
      type: 'object',
      properties: { count: { type: 'integer' } },
    });
    expect(jsonSchemaToTypeScript(s)).toContain('number');
  });
});

// ─── jsonSchemaToZod ────────────────────────────────────────────────────────

describe('jsonSchemaToZod', () => {
  it('generates z.object for object schema', () => {
    const s = schema({
      type: 'object',
      properties: { name: { type: 'string' } },
    });
    const result = jsonSchemaToZod(s);
    expect(result).toContain('z.object(');
    expect(result).toContain('z.string()');
  });

  it('imports z from zod', () => {
    const s = schema({ type: 'object', properties: {} });
    expect(jsonSchemaToZod(s)).toContain("import { z } from 'zod'");
  });

  it('generates inferred type alias', () => {
    const s = schema({ type: 'object', properties: {} });
    expect(jsonSchemaToZod(s, 'mySchema')).toContain('type MySchema = z.infer<typeof mySchema>');
  });

  it('marks optional properties', () => {
    const s = schema({
      type: 'object',
      properties: { bio: { type: 'string' } },
    });
    expect(jsonSchemaToZod(s)).toContain('.optional()');
  });

  it('does not mark required properties as optional', () => {
    const s = schema({
      type: 'object',
      properties: { id: { type: 'number' } },
      required: ['id'],
    });
    const result = jsonSchemaToZod(s);
    expect(result).toContain('z.number()');
    // The id line should NOT have .optional()
    const idLine = result.split('\n').find((l: string) => l.trim().startsWith('id:'));
    expect(idLine).not.toContain('.optional()');
  });

  it('generates z.number().int() for integer', () => {
    const s = schema({ type: 'integer' });
    expect(jsonSchemaToZod(s)).toContain('z.number().int()');
  });

  it('generates z.boolean()', () => {
    const s = schema({
      type: 'object',
      properties: { active: { type: 'boolean' } },
    });
    expect(jsonSchemaToZod(s)).toContain('z.boolean()');
  });

  it('generates z.null()', () => {
    const s = schema({ type: 'null' });
    expect(jsonSchemaToZod(s)).toContain('z.null()');
  });

  it('generates z.array()', () => {
    const s = schema({
      type: 'object',
      properties: { items: { type: 'array', items: { type: 'string' } } },
    });
    expect(jsonSchemaToZod(s)).toContain('z.array(z.string())');
  });

  it('adds .min/.max for string constraints', () => {
    const s = schema({ type: 'string', minLength: 1, maxLength: 100 });
    const result = jsonSchemaToZod(s);
    expect(result).toContain('.min(1)');
    expect(result).toContain('.max(100)');
  });

  it('adds .email() for email format', () => {
    const s = schema({ type: 'string', format: 'email' });
    expect(jsonSchemaToZod(s)).toContain('.email()');
  });

  it('adds .url() for uri format', () => {
    const s = schema({ type: 'string', format: 'uri' });
    expect(jsonSchemaToZod(s)).toContain('.url()');
  });

  it('adds .uuid() for uuid format', () => {
    const s = schema({ type: 'string', format: 'uuid' });
    expect(jsonSchemaToZod(s)).toContain('.uuid()');
  });

  it('adds .datetime() for date-time format', () => {
    const s = schema({ type: 'string', format: 'date-time' });
    expect(jsonSchemaToZod(s)).toContain('.datetime()');
  });

  it('adds .regex() for pattern', () => {
    const s = schema({ type: 'string', pattern: '^[a-z]+$' });
    expect(jsonSchemaToZod(s)).toContain('.regex(/^[a-z]+$/)');
  });

  it('generates z.enum for string enum', () => {
    const s = schema({ type: 'string', enum: ['a', 'b'] });
    expect(jsonSchemaToZod(s)).toContain("z.enum(['a', 'b'])");
  });

  it('adds .min/.max for number constraints', () => {
    const s = schema({ type: 'number', minimum: 0, maximum: 100 });
    const result = jsonSchemaToZod(s);
    expect(result).toContain('.min(0)');
    expect(result).toContain('.max(100)');
  });

  it('adds .min/.max for array items', () => {
    const s = schema({ type: 'array', items: { type: 'number' }, minItems: 1, maxItems: 5 });
    const result = jsonSchemaToZod(s);
    expect(result).toContain('.min(1)');
    expect(result).toContain('.max(5)');
  });

  it('generates z.union for oneOf', () => {
    const s = schema({ oneOf: [{ type: 'string' }, { type: 'number' }] });
    expect(jsonSchemaToZod(s)).toContain('z.union([z.string(), z.number()])');
  });

  it('unwraps single oneOf', () => {
    const s = schema({ oneOf: [{ type: 'string' }] });
    const result = jsonSchemaToZod(s);
    expect(result).toContain('z.string()');
    expect(result).not.toContain('z.union');
  });

  it('falls back to z.unknown() for unknown type', () => {
    const s = schema({});
    expect(jsonSchemaToZod(s)).toContain('z.unknown()');
  });

  it('returns error comment for invalid JSON', () => {
    expect(jsonSchemaToZod('bad')).toMatch(/^\/\/ Error:/);
  });
});

// ─── jsonSchemaToJoi ────────────────────────────────────────────────────────

describe('jsonSchemaToJoi', () => {
  it('generates Joi.object for object schema', () => {
    const s = schema({
      type: 'object',
      properties: { name: { type: 'string' } },
    });
    const result = jsonSchemaToJoi(s);
    expect(result).toContain('Joi.object(');
    expect(result).toContain('Joi.string()');
  });

  it('requires joi import', () => {
    const s = schema({ type: 'object', properties: {} });
    expect(jsonSchemaToJoi(s)).toContain("const Joi = require('joi')");
  });

  it('marks required properties with .required()', () => {
    const s = schema({
      type: 'object',
      properties: { id: { type: 'number' } },
      required: ['id'],
    });
    expect(jsonSchemaToJoi(s)).toContain('.required()');
  });

  it('does not mark optional properties with .required()', () => {
    const s = schema({
      type: 'object',
      properties: { bio: { type: 'string' } },
    });
    const result = jsonSchemaToJoi(s);
    const bioLine = result.split('\n').find((l: string) => l.trim().startsWith('bio:'));
    expect(bioLine).not.toContain('.required()');
  });

  it('generates Joi.number().integer() for integer', () => {
    const s = schema({
      type: 'object',
      properties: { count: { type: 'integer' } },
      required: ['count'],
    });
    expect(jsonSchemaToJoi(s)).toContain('Joi.number().integer()');
  });

  it('generates Joi.boolean()', () => {
    const s = schema({
      type: 'object',
      properties: { active: { type: 'boolean' } },
    });
    expect(jsonSchemaToJoi(s)).toContain('Joi.boolean()');
  });

  it('generates Joi.array().items()', () => {
    const s = schema({
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } } },
    });
    expect(jsonSchemaToJoi(s)).toContain('Joi.array().items(Joi.string())');
  });

  it('adds .min/.max for string constraints', () => {
    const s = schema({ type: 'string', minLength: 2, maxLength: 50 });
    const result = jsonSchemaToJoi(s);
    expect(result).toContain('.min(2)');
    expect(result).toContain('.max(50)');
  });

  it('adds .pattern() for regex', () => {
    const s = schema({ type: 'string', pattern: '^\\d+$' });
    expect(jsonSchemaToJoi(s)).toContain('.pattern(');
  });

  it('adds .email() for email format', () => {
    const s = schema({ type: 'string', format: 'email' });
    expect(jsonSchemaToJoi(s)).toContain('.email()');
  });

  it('adds .uri() for uri format', () => {
    const s = schema({ type: 'string', format: 'uri' });
    expect(jsonSchemaToJoi(s)).toContain('.uri()');
  });

  it('adds .valid() for enum', () => {
    const s = schema({ type: 'string', enum: ['x', 'y'] });
    expect(jsonSchemaToJoi(s)).toContain(".valid('x', 'y')");
  });

  it('adds number min/max', () => {
    const s = schema({ type: 'number', minimum: 0, maximum: 10 });
    const result = jsonSchemaToJoi(s);
    expect(result).toContain('.min(0)');
    expect(result).toContain('.max(10)');
  });

  it('adds array min/max items', () => {
    const s = schema({ type: 'array', items: { type: 'number' }, minItems: 1, maxItems: 3 });
    const result = jsonSchemaToJoi(s);
    expect(result).toContain('.min(1)');
    expect(result).toContain('.max(3)');
  });

  it('falls back to Joi.any() for unknown type', () => {
    const s = schema({});
    expect(jsonSchemaToJoi(s)).toContain('Joi.any()');
  });

  it('returns error comment for invalid JSON', () => {
    expect(jsonSchemaToJoi('{')).toMatch(/^\/\/ Error:/);
  });
});

// ─── typeScriptToJsonSchema ─────────────────────────────────────────────────

describe('typeScriptToJsonSchema', () => {
  it('parses a simple interface', () => {
    const ts = 'interface User { name: string; age: number; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.title).toBe('User');
    expect(result.type).toBe('object');
    expect(result.properties.name).toEqual({ type: 'string' });
    expect(result.properties.age).toEqual({ type: 'number' });
  });

  it('puts non-optional properties in required', () => {
    const ts = 'interface A { id: number; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.required).toContain('id');
  });

  it('does not put optional properties in required', () => {
    const ts = 'interface A { bio?: string; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.required).toBeUndefined();
  });

  it('handles boolean type', () => {
    const ts = 'interface A { active: boolean; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.properties.active).toEqual({ type: 'boolean' });
  });

  it('handles null type', () => {
    const ts = 'interface A { nothing: null; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.properties.nothing).toEqual({ type: 'null' });
  });

  it('handles array type (string[])', () => {
    const ts = 'interface A { tags: string[]; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.properties.tags).toEqual({ type: 'array', items: { type: 'string' } });
  });

  it('handles union type', () => {
    const ts = 'interface A { val: string | number; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.properties.val.oneOf).toEqual([{ type: 'string' }, { type: 'number' }]);
  });

  it('handles any/unknown as empty schema', () => {
    const ts = 'interface A { data: any; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.properties.data).toEqual({});
  });

  it('handles string literal type as const', () => {
    const ts = "interface A { status: 'active'; }";
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.properties.status).toEqual({ const: 'active' });
  });

  it('includes $schema draft-07', () => {
    const ts = 'interface A { x: string; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.$schema).toBe('http://json-schema.org/draft-07/schema#');
  });

  it('returns error for non-interface code', () => {
    const result = JSON.parse(typeScriptToJsonSchema('const x = 1;'));
    expect(result.error).toBeDefined();
  });

  it('omits required array when all properties are optional', () => {
    const ts = 'interface A { a?: string; b?: number; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.required).toBeUndefined();
  });

  it('handles unknown type as empty schema', () => {
    const ts = 'interface A { data: unknown; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.properties.data).toEqual({});
  });

  it('handles custom/unrecognized type as object', () => {
    const ts = 'interface A { ref: MyCustomType; }';
    const result = JSON.parse(typeScriptToJsonSchema(ts));
    expect(result.properties.ref).toEqual({ type: 'object' });
  });
});

// ─── inferJsonSchema ────────────────────────────────────────────────────────

describe('inferJsonSchema', () => {
  it('infers object with string and number', () => {
    const result = JSON.parse(inferJsonSchema('{"name":"Alice","age":30}'));
    expect(result.type).toBe('object');
    expect(result.properties.name.type).toBe('string');
    expect(result.properties.age.type).toBe('integer');
  });

  it('infers boolean type', () => {
    const result = JSON.parse(inferJsonSchema('{"active":true}'));
    expect(result.properties.active.type).toBe('boolean');
  });

  it('infers null type', () => {
    const result = JSON.parse(inferJsonSchema('{"x":null}'));
    expect(result.properties.x.type).toBe('null');
  });

  it('infers float as number (not integer)', () => {
    const result = JSON.parse(inferJsonSchema('{"price":9.99}'));
    expect(result.properties.price.type).toBe('number');
  });

  it('infers array with item schema from first element', () => {
    const result = JSON.parse(inferJsonSchema('{"tags":["a","b"]}'));
    expect(result.properties.tags.type).toBe('array');
    expect(result.properties.tags.items.type).toBe('string');
  });

  it('infers empty array without items', () => {
    const result = JSON.parse(inferJsonSchema('{"list":[]}'));
    expect(result.properties.list.type).toBe('array');
    expect(result.properties.list.items).toBeUndefined();
  });

  it('detects date-time format', () => {
    const result = JSON.parse(inferJsonSchema('{"ts":"2024-01-01T00:00:00Z"}'));
    expect(result.properties.ts.format).toBe('date-time');
  });

  it('detects date format', () => {
    const result = JSON.parse(inferJsonSchema('{"d":"2024-01-01"}'));
    expect(result.properties.d.format).toBe('date');
  });

  it('detects email format', () => {
    const result = JSON.parse(inferJsonSchema('{"e":"user@example.com"}'));
    expect(result.properties.e.format).toBe('email');
  });

  it('detects uri format', () => {
    const result = JSON.parse(inferJsonSchema('{"url":"https://example.com"}'));
    expect(result.properties.url.format).toBe('uri');
  });

  it('includes $schema draft-07', () => {
    const result = JSON.parse(inferJsonSchema('{}'));
    expect(result.$schema).toBe('http://json-schema.org/draft-07/schema#');
  });

  it('puts all keys in required for objects', () => {
    const result = JSON.parse(inferJsonSchema('{"a":1,"b":"x"}'));
    expect(result.required).toContain('a');
    expect(result.required).toContain('b');
  });

  it('returns error for invalid JSON', () => {
    const result = JSON.parse(inferJsonSchema('not json'));
    expect(result.error).toBeDefined();
  });

  it('infers nested object', () => {
    const result = JSON.parse(inferJsonSchema('{"address":{"city":"NY"}}'));
    expect(result.properties.address.type).toBe('object');
    expect(result.properties.address.properties.city.type).toBe('string');
  });

  it('infers top-level array', () => {
    const result = JSON.parse(inferJsonSchema('[1,2,3]'));
    expect(result.type).toBe('array');
    expect(result.items.type).toBe('integer');
  });

  it('infers top-level string', () => {
    const result = JSON.parse(inferJsonSchema('"hello"'));
    expect(result.type).toBe('string');
  });

  it('infers top-level number', () => {
    const result = JSON.parse(inferJsonSchema('42'));
    expect(result.type).toBe('integer');
  });

  it('infers top-level boolean', () => {
    const result = JSON.parse(inferJsonSchema('true'));
    expect(result.type).toBe('boolean');
  });

  it('infers top-level null', () => {
    const result = JSON.parse(inferJsonSchema('null'));
    expect(result.type).toBe('null');
  });
});

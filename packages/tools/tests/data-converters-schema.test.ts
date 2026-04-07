import { describe, it, expect } from 'vitest';
import {
  jsonSchemaToTypeScript,
  jsonSchemaToZod,
  jsonSchemaToJoi,
  typeScriptToJsonSchema,
  inferJsonSchema,
} from '../src/data-converters/schema';

const userSchema = JSON.stringify({
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer', minimum: 0 },
    email: { type: 'string', format: 'email' },
    roles: { type: 'array', items: { type: 'string' } },
    active: { type: 'boolean' },
  },
  required: ['name', 'email'],
});

// ═══════════════════════════════════════════════
// JSON Schema → TypeScript
// ═══════════════════════════════════════════════

describe('jsonSchemaToTypeScript', () => {
  it('generates interface with required/optional fields', () => {
    const r = jsonSchemaToTypeScript(userSchema, 'User');
    expect(r).toContain('interface User');
    expect(r).toContain('name: string');
    expect(r).toContain('email: string');
    expect(r).toContain('age?:'); // optional
    expect(r).toContain('number');
    expect(r).toContain('roles?:');
    expect(r).toContain('string[]');
    expect(r).toContain('active?:');
    expect(r).toContain('boolean');
  });
  it('handles enum', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: { status: { type: 'string', enum: ['active', 'inactive'] } },
    });
    const r = jsonSchemaToTypeScript(schema);
    expect(r).toContain("'active' | 'inactive'");
  });
  it('handles nested objects', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: { city: { type: 'string' } },
        },
      },
    });
    const r = jsonSchemaToTypeScript(schema);
    expect(r).toContain('city');
    expect(r).toContain('string');
  });
  it('returns error for invalid JSON', () => {
    const r = jsonSchemaToTypeScript('not json');
    expect(r).toContain('Error');
  });
  it('handles date-time format', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: { created: { type: 'string', format: 'date-time' } },
    });
    const r = jsonSchemaToTypeScript(schema);
    expect(r).toContain('Date | string');
  });
});

// ═══════════════════════════════════════════════
// JSON Schema → Zod
// ═══════════════════════════════════════════════

describe('jsonSchemaToZod', () => {
  it('generates zod import + schema', () => {
    const r = jsonSchemaToZod(userSchema, 'userSchema');
    expect(r).toContain("import { z } from 'zod'");
    expect(r).toContain('const userSchema');
    expect(r).toContain('z.object');
  });
  it('includes field constraints', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        age: { type: 'integer', minimum: 0, maximum: 150 },
      },
      required: ['name'],
    });
    const r = jsonSchemaToZod(schema);
    expect(r).toContain('z.string()');
    expect(r).toContain('.min(1)');
    expect(r).toContain('.max(100)');
    expect(r).toContain('z.number().int()');
    expect(r).toContain('.optional()');
  });
  it('handles email format', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: { email: { type: 'string', format: 'email' } },
    });
    const r = jsonSchemaToZod(schema);
    expect(r).toContain('.email()');
  });
  it('handles arrays', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' }, minItems: 1 } },
    });
    const r = jsonSchemaToZod(schema);
    expect(r).toContain('z.array(z.string())');
    expect(r).toContain('.min(1)');
  });
  it('generates type inference', () => {
    const r = jsonSchemaToZod(userSchema, 'userSchema');
    expect(r).toContain('z.infer<typeof userSchema>');
  });
});

// ═══════════════════════════════════════════════
// JSON Schema → Joi
// ═══════════════════════════════════════════════

describe('jsonSchemaToJoi', () => {
  it('generates Joi require + schema', () => {
    const r = jsonSchemaToJoi(userSchema);
    expect(r).toContain("require('joi')");
    expect(r).toContain('Joi.object');
  });
  it('marks required fields', () => {
    const r = jsonSchemaToJoi(userSchema);
    expect(r).toContain('Joi.string()');
    expect(r).toContain('.required()');
  });
  it('handles number constraints', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: { count: { type: 'integer', minimum: 0, maximum: 100 } },
    });
    const r = jsonSchemaToJoi(schema);
    expect(r).toContain('Joi.number().integer()');
    expect(r).toContain('.min(0)');
    expect(r).toContain('.max(100)');
  });
});

// ═══════════════════════════════════════════════
// TypeScript → JSON Schema
// ═══════════════════════════════════════════════

describe('typeScriptToJsonSchema', () => {
  it('parses basic interface', () => {
    const ts = 'interface User {\n  name: string;\n  age: number;\n  active?: boolean;\n}';
    const r = JSON.parse(typeScriptToJsonSchema(ts));
    expect(r.title).toBe('User');
    expect(r.type).toBe('object');
    expect(r.properties.name.type).toBe('string');
    expect(r.properties.age.type).toBe('number');
    expect(r.properties.active.type).toBe('boolean');
    expect(r.required).toContain('name');
    expect(r.required).toContain('age');
    expect(r.required).not.toContain('active');
  });
  it('handles array types', () => {
    const ts = 'interface Foo {\n  items: string[];\n}';
    const r = JSON.parse(typeScriptToJsonSchema(ts));
    expect(r.properties.items.type).toBe('array');
    expect(r.properties.items.items.type).toBe('string');
  });
  it('returns error for non-interface', () => {
    const r = JSON.parse(typeScriptToJsonSchema('const x = 1;'));
    expect(r.error).toBeDefined();
  });
});

// ═══════════════════════════════════════════════
// Infer JSON Schema from data
// ═══════════════════════════════════════════════

describe('inferJsonSchema', () => {
  it('infers from object', () => {
    const r = JSON.parse(inferJsonSchema('{"name":"test","age":25,"active":true}'));
    expect(r.type).toBe('object');
    expect(r.properties.name.type).toBe('string');
    expect(r.properties.age.type).toBe('integer');
    expect(r.properties.active.type).toBe('boolean');
    expect(r.required).toContain('name');
  });
  it('infers from array', () => {
    const r = JSON.parse(inferJsonSchema('[{"a":1},{"a":2}]'));
    expect(r.type).toBe('array');
    expect(r.items.type).toBe('object');
  });
  it('detects date-time format', () => {
    const r = JSON.parse(inferJsonSchema('{"ts":"2024-01-01T00:00:00Z"}'));
    expect(r.properties.ts.format).toBe('date-time');
  });
  it('detects date format', () => {
    const r = JSON.parse(inferJsonSchema('{"d":"2024-01-01"}'));
    expect(r.properties.d.format).toBe('date');
  });
  it('detects email format', () => {
    const r = JSON.parse(inferJsonSchema('{"e":"user@example.com"}'));
    expect(r.properties.e.format).toBe('email');
  });
  it('detects URI format', () => {
    const r = JSON.parse(inferJsonSchema('{"url":"https://example.com"}'));
    expect(r.properties.url.format).toBe('uri');
  });
  it('handles null', () => {
    const r = JSON.parse(inferJsonSchema('null'));
    expect(r.type).toBe('null');
  });
  it('handles float', () => {
    const r = JSON.parse(inferJsonSchema('{"v":3.14}'));
    expect(r.properties.v.type).toBe('number');
  });
  it('returns error for invalid JSON', () => {
    const r = JSON.parse(inferJsonSchema('not json'));
    expect(r.error).toBeDefined();
  });

  // Injection: XSS in data should just be inferred as string
  it('infers string type for XSS payload', () => {
    const r = JSON.parse(inferJsonSchema('{"val":"<script>alert(1)</script>"}'));
    expect(r.properties.val.type).toBe('string');
  });
});

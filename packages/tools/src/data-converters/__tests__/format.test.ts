import { describe, it, expect } from 'vitest';
import {
  jsonToToml,
  iniToJson,
  jsonToIni,
  jsonToProperties,
  propertiesToJson,
  envToJson,
  jsonToEnv,
  envToDockerCompose,
  normalizeLineEndings,
  convertIndentation,
  sortKeys,
} from '../format';

// ─── jsonToToml ──────────────────────────────────────────────────────────────

describe('jsonToToml', () => {
  it('converts a simple string value', () => {
    const result = jsonToToml(JSON.stringify({ name: 'Alice' }));
    expect(result).toBe('name = "Alice"');
  });

  it('converts a number value', () => {
    const result = jsonToToml(JSON.stringify({ port: 8080 }));
    expect(result).toBe('port = 8080');
  });

  it('converts a boolean value', () => {
    const result = jsonToToml(JSON.stringify({ debug: true }));
    expect(result).toBe('debug = true');
  });

  it('converts a nested object as a TOML table', () => {
    const result = jsonToToml(JSON.stringify({ server: { port: 8080 } }));
    expect(result).toBe('\n[server]\nport = 8080');
  });

  it('converts a simple (primitive) array', () => {
    const result = jsonToToml(JSON.stringify({ tags: ['a', 'b', 'c'] }));
    expect(result).toBe('tags = ["a", "b", "c"]');
  });

  it('converts an array of objects using [[table]] syntax', () => {
    const input = { servers: [{ host: 'a', port: 1 }, { host: 'b', port: 2 }] };
    const result = jsonToToml(JSON.stringify(input));
    expect(result).toBe(
      '\n[[servers]]\nhost = "a"\nport = 1\n\n[[servers]]\nhost = "b"\nport = 2',
    );
  });

  it('skips null and undefined values', () => {
    const result = jsonToToml(JSON.stringify({ a: null, b: 1 }));
    expect(result).toBe('b = 1');
  });

  it('handles mixed primitive and nested values', () => {
    const input = { title: 'config', db: { host: 'localhost' } };
    const result = jsonToToml(JSON.stringify(input));
    expect(result).toBe('title = "config"\n\n[db]\nhost = "localhost"');
  });

  it('escapes double quotes in string values', () => {
    const result = jsonToToml(JSON.stringify({ msg: 'say "hi"' }));
    expect(result).toBe('msg = "say \\"hi\\""');
  });

  it('handles an empty object', () => {
    expect(jsonToToml('{}')).toBe('');
  });

  it('handles a mixed array with null elements (treated as primitive)', () => {
    const input = { items: [1, 'two', true, null] };
    const result = jsonToToml(JSON.stringify(input));
    expect(result).toBe('items = [1, "two", true, null]');
  });

  it('throws on invalid JSON', () => {
    expect(() => jsonToToml('not json')).toThrow();
  });
});

// ─── iniToJson ───────────────────────────────────────────────────────────────

describe('iniToJson', () => {
  it('parses a basic section with key-value pairs', () => {
    const ini = '[section]\nkey=value';
    expect(JSON.parse(iniToJson(ini))).toEqual({ section: { key: 'value' } });
  });

  it('coerces boolean and number values', () => {
    const ini = '[db]\nport=5432\ndebug=true\nverbose=false';
    expect(JSON.parse(iniToJson(ini))).toEqual({
      db: { port: 5432, debug: true, verbose: false },
    });
  });

  it('ignores semicolon and hash comments', () => {
    const ini = '; comment\n# also comment\n[s]\nk=v';
    expect(JSON.parse(iniToJson(ini))).toEqual({ s: { k: 'v' } });
  });

  it('ignores empty lines', () => {
    const ini = '\n[s]\n\nk=v\n';
    expect(JSON.parse(iniToJson(ini))).toEqual({ s: { k: 'v' } });
  });

  it('handles top-level key-value pairs without a section', () => {
    const ini = 'name=test\ncount=3';
    expect(JSON.parse(iniToJson(ini))).toEqual({ name: 'test', count: 3 });
  });

  it('parses multiple sections', () => {
    const ini = '[a]\nx=1\n[b]\ny=2';
    expect(JSON.parse(iniToJson(ini))).toEqual({ a: { x: 1 }, b: { y: 2 } });
  });

  it('preserves values containing equals signs', () => {
    const ini = '[section]\nurl=http://localhost?key=abc';
    expect(JSON.parse(iniToJson(ini))).toEqual({
      section: { url: 'http://localhost?key=abc' },
    });
  });

  it('handles empty value after equals', () => {
    const ini = '[s]\nempty=';
    expect(JSON.parse(iniToJson(ini))).toEqual({ s: { empty: '' } });
  });
});

// ─── jsonToIni ───────────────────────────────────────────────────────────────

describe('jsonToIni', () => {
  it('converts a section with key-value pairs', () => {
    const input = { section: { key: 'value', num: 42 } };
    const result = jsonToIni(JSON.stringify(input));
    expect(result).toBe('[section]\nkey=value\nnum=42');
  });

  it('handles top-level non-object values', () => {
    const input = { name: 'test', version: 1 };
    const result = jsonToIni(JSON.stringify(input));
    expect(result).toBe('name=test\nversion=1');
  });

  it('handles mixed top-level scalars and sections', () => {
    const input = { name: 'app', db: { host: 'localhost' } };
    const result = jsonToIni(JSON.stringify(input));
    expect(result).toBe('name=app\n[db]\nhost=localhost');
  });

  it('converts boolean and null values via String()', () => {
    const input = { settings: { debug: true, value: null } };
    const result = jsonToIni(JSON.stringify(input));
    expect(result).toBe('[settings]\ndebug=true\nvalue=null');
  });

  it('handles an empty object', () => {
    expect(jsonToIni('{}')).toBe('');
  });

  it('throws on invalid JSON input', () => {
    expect(() => jsonToIni('{')).toThrow();
  });
});

// ─── jsonToProperties ────────────────────────────────────────────────────────

describe('jsonToProperties', () => {
  it('converts a flat object', () => {
    const input = { key: 'value', port: 8080 };
    const result = jsonToProperties(JSON.stringify(input));
    expect(result).toBe('key=value\nport=8080');
  });

  it('flattens nested objects with dot notation', () => {
    const input = { app: { server: { port: 8080 } } };
    const result = jsonToProperties(JSON.stringify(input));
    expect(result).toBe('app.server.port=8080');
  });

  it('flattens arrays with bracket notation', () => {
    const input = { items: ['a', 'b'] };
    const result = jsonToProperties(JSON.stringify(input));
    expect(result).toBe('items[0]=a\nitems[1]=b');
  });

  it('handles null values as empty string', () => {
    const input = { key: null };
    const result = jsonToProperties(JSON.stringify(input));
    expect(result).toBe('key=');
  });

  it('handles deeply nested objects', () => {
    const input = { a: { b: { c: { d: 'deep' } } } };
    const result = jsonToProperties(JSON.stringify(input));
    expect(result).toBe('a.b.c.d=deep');
  });

  it('handles mixed nested objects and arrays', () => {
    const input = { db: { hosts: ['h1', 'h2'], port: 5432 } };
    const result = jsonToProperties(JSON.stringify(input));
    expect(result).toBe('db.hosts[0]=h1\ndb.hosts[1]=h2\ndb.port=5432');
  });

  it('converts boolean values via String()', () => {
    const input = { debug: true };
    const result = jsonToProperties(JSON.stringify(input));
    expect(result).toBe('debug=true');
  });
});

// ─── propertiesToJson ────────────────────────────────────────────────────────

describe('propertiesToJson', () => {
  it('converts a flat key-value pair', () => {
    expect(JSON.parse(propertiesToJson('key=value'))).toEqual({ key: 'value' });
  });

  it('rebuilds nested objects from dotted keys', () => {
    const props = 'app.server.port=8080';
    expect(JSON.parse(propertiesToJson(props))).toEqual({
      app: { server: { port: 8080 } },
    });
  });

  it('coerces boolean values', () => {
    const props = 'debug=true\nverbose=false';
    expect(JSON.parse(propertiesToJson(props))).toEqual({
      debug: true,
      verbose: false,
    });
  });

  it('coerces numeric values', () => {
    const props = 'port=3000';
    expect(JSON.parse(propertiesToJson(props))).toEqual({ port: 3000 });
  });

  it('ignores comment lines starting with #', () => {
    const props = '# This is a comment\nkey=value';
    expect(JSON.parse(propertiesToJson(props))).toEqual({ key: 'value' });
  });

  it('preserves values containing equals signs', () => {
    const props = 'url=http://host:8080/path?a=1';
    expect(JSON.parse(propertiesToJson(props))).toEqual({
      url: 'http://host:8080/path?a=1',
    });
  });

  it('handles empty value as empty string', () => {
    expect(JSON.parse(propertiesToJson('key='))).toEqual({ key: '' });
  });

  it('handles multiple nested siblings', () => {
    const props = 'db.host=localhost\ndb.port=5432';
    expect(JSON.parse(propertiesToJson(props))).toEqual({
      db: { host: 'localhost', port: 5432 },
    });
  });
});

// ─── envToJson ───────────────────────────────────────────────────────────────

describe('envToJson', () => {
  it('parses a simple key-value pair', () => {
    expect(JSON.parse(envToJson('KEY=value'))).toEqual({ KEY: 'value' });
  });

  it('removes surrounding double quotes from values', () => {
    expect(JSON.parse(envToJson('KEY="hello world"'))).toEqual({
      KEY: 'hello world',
    });
  });

  it('removes surrounding single quotes from values', () => {
    expect(JSON.parse(envToJson("KEY='hello world'"))).toEqual({
      KEY: 'hello world',
    });
  });

  it('ignores comment lines', () => {
    const env = '# comment\nKEY=value';
    expect(JSON.parse(envToJson(env))).toEqual({ KEY: 'value' });
  });

  it('ignores empty lines', () => {
    const env = '\nKEY=value\n\n';
    expect(JSON.parse(envToJson(env))).toEqual({ KEY: 'value' });
  });

  it('handles empty value after equals', () => {
    expect(JSON.parse(envToJson('KEY='))).toEqual({ KEY: '' });
  });

  it('parses multiple entries', () => {
    const env = 'DB_HOST=localhost\nDB_PORT=5432';
    expect(JSON.parse(envToJson(env))).toEqual({
      DB_HOST: 'localhost',
      DB_PORT: '5432',
    });
  });

  it('keeps values as strings (no type coercion)', () => {
    const env = 'NUM=42\nBOOL=true';
    const result = JSON.parse(envToJson(env));
    expect(result.NUM).toBe('42');
    expect(result.BOOL).toBe('true');
  });
});

// ─── jsonToEnv ───────────────────────────────────────────────────────────────

describe('jsonToEnv', () => {
  it('converts a simple key-value pair', () => {
    expect(jsonToEnv(JSON.stringify({ KEY: 'value' }))).toBe('KEY=value');
  });

  it('quotes values that contain spaces', () => {
    expect(jsonToEnv(JSON.stringify({ KEY: 'hello world' }))).toBe(
      'KEY="hello world"',
    );
  });

  it('quotes values that contain equals signs', () => {
    expect(jsonToEnv(JSON.stringify({ URL: 'a=b' }))).toBe('URL="a=b"');
  });

  it('converts null values to empty strings', () => {
    expect(jsonToEnv(JSON.stringify({ KEY: null }))).toBe('KEY=');
  });

  it('converts multiple entries', () => {
    const input = { A: '1', B: '2' };
    expect(jsonToEnv(JSON.stringify(input))).toBe('A=1\nB=2');
  });

  it('escapes double quotes within quoted values', () => {
    const input = { MSG: 'say "hi" now' };
    expect(jsonToEnv(JSON.stringify(input))).toBe('MSG="say \\"hi\\" now"');
  });

  it('throws on invalid JSON', () => {
    expect(() => jsonToEnv('not json')).toThrow();
  });
});

// ─── envToDockerCompose ──────────────────────────────────────────────────────

describe('envToDockerCompose', () => {
  it('converts env vars into a Docker Compose environment section', () => {
    const env = 'DB_HOST=localhost\nDB_PORT=5432';
    const result = envToDockerCompose(env);
    expect(result).toBe(
      'version: "3.8"\nservices:\n  app:\n    environment:\n      - DB_HOST=localhost\n      - DB_PORT=5432',
    );
  });

  it('strips surrounding quotes from env values', () => {
    const env = 'KEY="hello world"';
    const result = envToDockerCompose(env);
    expect(result).toContain('- KEY=hello world');
  });

  it('handles a single env variable', () => {
    const result = envToDockerCompose('NODE_ENV=production');
    expect(result).toContain('version: "3.8"');
    expect(result).toContain('services:');
    expect(result).toContain('- NODE_ENV=production');
  });
});

// ─── normalizeLineEndings ────────────────────────────────────────────────────

describe('normalizeLineEndings', () => {
  it('normalizes CRLF to LF by default', () => {
    expect(normalizeLineEndings('a\r\nb')).toBe('a\nb');
  });

  it('normalizes CR to LF by default', () => {
    expect(normalizeLineEndings('a\rb')).toBe('a\nb');
  });

  it('converts to CRLF', () => {
    expect(normalizeLineEndings('a\nb', 'crlf')).toBe('a\r\nb');
  });

  it('converts to CR', () => {
    expect(normalizeLineEndings('a\nb', 'cr')).toBe('a\rb');
  });

  it('handles mixed line endings → LF', () => {
    expect(normalizeLineEndings('a\r\nb\rc\nd', 'lf')).toBe('a\nb\nc\nd');
  });

  it('handles mixed line endings → CRLF', () => {
    expect(normalizeLineEndings('a\r\nb\rc', 'crlf')).toBe('a\r\nb\r\nc');
  });

  it('returns text unchanged if already in LF style', () => {
    const text = 'line1\nline2\nline3';
    expect(normalizeLineEndings(text, 'lf')).toBe(text);
  });
});

// ─── convertIndentation ──────────────────────────────────────────────────────

describe('convertIndentation', () => {
  it('converts tabs to 2 spaces', () => {
    expect(convertIndentation('\t\ta', true, false, 2)).toBe('    a');
  });

  it('converts tabs to 4 spaces', () => {
    expect(convertIndentation('\ta', true, false, 4)).toBe('    a');
  });

  it('converts 2-space indentation to tabs', () => {
    expect(convertIndentation('    a', false, true, 2)).toBe('\t\ta');
  });

  it('converts 4-space indentation to tabs', () => {
    expect(convertIndentation('        a', false, true, 4)).toBe('\t\ta');
  });

  it('only converts leading spaces when going to tabs', () => {
    const input = '  foo  bar';
    const result = convertIndentation(input, false, true, 2);
    expect(result).toBe('\tfoo  bar');
  });

  it('returns text unchanged when fromTabs and toTabs are both true', () => {
    const text = '\thello';
    expect(convertIndentation(text, true, true)).toBe(text);
  });

  it('returns text unchanged when fromTabs and toTabs are both false', () => {
    const text = '  hello';
    expect(convertIndentation(text, false, false)).toBe(text);
  });

  it('handles multi-line conversion from tabs to spaces', () => {
    const input = '\tline1\n\t\tline2';
    expect(convertIndentation(input, true, false, 2)).toBe('  line1\n    line2');
  });

  it('handles multi-line conversion from spaces to tabs', () => {
    const input = '  line1\n    line2';
    expect(convertIndentation(input, false, true, 2)).toBe(
      '\tline1\n\t\tline2',
    );
  });
});

// ─── sortKeys ────────────────────────────────────────────────────────────────

describe('sortKeys', () => {
  it('sorts top-level keys alphabetically', () => {
    const result = sortKeys('{"b":1,"a":2}');
    expect(JSON.parse(result)).toEqual({ a: 2, b: 1 });
    const keys = Object.keys(JSON.parse(result));
    expect(keys).toEqual(['a', 'b']);
  });

  it('sorts nested object keys recursively', () => {
    const input = JSON.stringify({ z: { d: 1, c: 2 }, m: 3 });
    const result = JSON.parse(sortKeys(input));
    expect(Object.keys(result)).toEqual(['m', 'z']);
    expect(Object.keys(result.z)).toEqual(['c', 'd']);
  });

  it('sorts keys inside array elements', () => {
    const input = JSON.stringify([{ b: 1, a: 2 }]);
    const result = JSON.parse(sortKeys(input));
    expect(Object.keys(result[0])).toEqual(['a', 'b']);
  });

  it('returns YAML text as-is when isYaml=true', () => {
    const yaml = 'z: 1\na: 2';
    expect(sortKeys(yaml, true)).toBe(yaml);
  });

  it('handles primitives at the root level', () => {
    expect(sortKeys('"hello"')).toBe('"hello"');
    expect(sortKeys('null')).toBe('null');
    expect(sortKeys('42')).toBe('42');
  });

  it('returns pretty-printed JSON with 2-space indent', () => {
    const result = sortKeys('{"b":1,"a":2}');
    expect(result).toBe('{\n  "a": 2,\n  "b": 1\n}');
  });

  it('throws on invalid JSON when isYaml is false', () => {
    expect(() => sortKeys('not json')).toThrow();
  });
});

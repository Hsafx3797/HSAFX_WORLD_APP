import { describe, it, expect } from 'vitest';
import { jsonToYaml, yamlToJson, formatYaml, envToYaml } from '../yaml';

// ─── jsonToYaml ──────────────────────────────────────────────────────────────

describe('jsonToYaml', () => {
  it('converts a simple object', () => {
    const result = jsonToYaml('{"name":"Alice","age":30}');
    expect(result).toBe('name: Alice\nage: 30');
  });

  it('converts nested objects', () => {
    const result = jsonToYaml('{"person":{"name":"Bob","age":25}}');
    expect(result).toContain('person:\n');
    expect(result).toContain('  name: Bob');
    expect(result).toContain('  age: 25');
  });

  it('converts arrays', () => {
    const result = jsonToYaml('{"items":["a","b","c"]}');
    expect(result).toContain('items:\n');
    expect(result).toContain('- a');
    expect(result).toContain('- b');
    expect(result).toContain('- c');
  });

  it('converts null values', () => {
    const result = jsonToYaml('{"key":null}');
    expect(result).toBe('key: null');
  });

  it('converts boolean values', () => {
    const result = jsonToYaml('{"a":true,"b":false}');
    expect(result).toBe('a: true\nb: false');
  });

  it('converts numeric values', () => {
    const result = jsonToYaml('{"int":42,"float":3.14}');
    expect(result).toBe('int: 42\nfloat: 3.14');
  });

  it('handles empty object', () => {
    const result = jsonToYaml('{}');
    expect(result).toBe('{}');
  });

  it('handles empty array at top level', () => {
    const result = jsonToYaml('[]');
    expect(result).toBe('[]');
  });

  it('handles strings with colons by quoting', () => {
    const result = jsonToYaml('{"url":"http://example.com"}');
    expect(result).toContain('"http://example.com"');
  });

  it('handles strings with newlines by quoting', () => {
    const result = jsonToYaml('{"msg":"line1\\nline2"}');
    expect(result).toContain('"line1\\nline2"');
  });

  it('handles strings with hash by quoting', () => {
    const result = jsonToYaml('{"color":"#fff"}');
    expect(result).toContain('"#fff"');
  });

  it('throws on invalid JSON', () => {
    expect(() => jsonToYaml('not json')).toThrow();
  });

  it('converts deeply nested structure', () => {
    const result = jsonToYaml('{"a":{"b":{"c":"deep"}}}');
    expect(result).toContain('a:\n');
    expect(result).toContain('  b:\n');
    expect(result).toContain('    c: deep');
  });

  it('converts a top-level string', () => {
    const result = jsonToYaml('"hello"');
    expect(result).toBe('hello');
  });

  it('converts a top-level number', () => {
    const result = jsonToYaml('42');
    expect(result).toBe('42');
  });

  it('converts a top-level boolean', () => {
    const result = jsonToYaml('true');
    expect(result).toBe('true');
  });

  it('converts a top-level null', () => {
    const result = jsonToYaml('null');
    expect(result).toBe('null');
  });

  it('handles array of objects', () => {
    const result = jsonToYaml('[{"name":"A"},{"name":"B"}]');
    expect(result).toContain('- name: A');
    expect(result).toContain('- name: B');
  });
});

// ─── yamlToJson ──────────────────────────────────────────────────────────────

describe('yamlToJson', () => {
  it('converts simple key-value pairs', () => {
    const result = yamlToJson('name: Alice\nage: 30');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ name: 'Alice', age: 30 });
  });

  it('uses default indent of 2', () => {
    const result = yamlToJson('a: 1');
    expect(result).toBe('{\n  "a": 1\n}');
  });

  it('respects custom indent', () => {
    const result = yamlToJson('a: 1', 4);
    expect(result).toBe('{\n    "a": 1\n}');
  });

  it('parses null values', () => {
    const result = yamlToJson('key: null');
    const parsed = JSON.parse(result);
    expect(parsed.key).toBeNull();
  });

  it('parses tilde as null', () => {
    const result = yamlToJson('key: ~');
    const parsed = JSON.parse(result);
    expect(parsed.key).toBeNull();
  });

  it('parses boolean true', () => {
    const result = yamlToJson('flag: true');
    const parsed = JSON.parse(result);
    expect(parsed.flag).toBe(true);
  });

  it('parses boolean false', () => {
    const result = yamlToJson('flag: false');
    const parsed = JSON.parse(result);
    expect(parsed.flag).toBe(false);
  });

  it('parses integer values', () => {
    const result = yamlToJson('count: 42');
    const parsed = JSON.parse(result);
    expect(parsed.count).toBe(42);
  });

  it('parses negative integers', () => {
    const result = yamlToJson('val: -10');
    const parsed = JSON.parse(result);
    expect(parsed.val).toBe(-10);
  });

  it('parses float values', () => {
    const result = yamlToJson('pi: 3.14');
    const parsed = JSON.parse(result);
    expect(parsed.pi).toBe(3.14);
  });

  it('parses quoted strings', () => {
    const result = yamlToJson('msg: "hello world"');
    const parsed = JSON.parse(result);
    expect(parsed.msg).toBe('hello world');
  });

  it('parses single-quoted strings', () => {
    const result = yamlToJson("msg: 'hello'");
    const parsed = JSON.parse(result);
    expect(parsed.msg).toBe('hello');
  });

  it('skips comment lines', () => {
    const result = yamlToJson('# comment\nname: Alice');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ name: 'Alice' });
  });

  it('skips empty lines', () => {
    const result = yamlToJson('a: 1\n\nb: 2');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ a: 1, b: 2 });
  });

  it('parses nested objects via indentation', () => {
    const yaml = 'server:\n  host: localhost\n  port: 8080';
    const parsed = JSON.parse(yamlToJson(yaml));
    expect(parsed.server).toBeDefined();
    expect(parsed.server.host).toBe('localhost');
    expect(parsed.server.port).toBe(8080);
  });

  it('returns empty object for empty string', () => {
    const result = yamlToJson('');
    expect(JSON.parse(result)).toEqual({});
  });

  it('returns empty object for only comments', () => {
    const result = yamlToJson('# just a comment\n# another');
    expect(JSON.parse(result)).toEqual({});
  });

  it('handles nested empty value as nested object', () => {
    const yaml = 'parent:\n  child: value';
    const parsed = JSON.parse(yamlToJson(yaml));
    expect(parsed.parent.child).toBe('value');
  });
});

// ─── formatYaml ──────────────────────────────────────────────────────────────

describe('formatYaml', () => {
  it('reformats YAML consistently', () => {
    const input = 'name:   Alice\nage:30';
    const result = formatYaml(input);
    expect(result).toContain('name: Alice');
  });

  it('preserves structure of nested YAML', () => {
    const input = 'db:\n  host: localhost\n  port: 5432';
    const result = formatYaml(input);
    expect(result).toContain('db:\n');
    expect(result).toContain('  host: localhost');
    expect(result).toContain('  port: 5432');
  });

  it('removes comments during formatting', () => {
    const input = '# comment\nkey: value';
    const result = formatYaml(input);
    expect(result).not.toContain('#');
    expect(result).toContain('key: value');
  });

  it('handles empty input', () => {
    const result = formatYaml('');
    expect(result).toBe('{}');
  });

  it('normalizes spacing around colons', () => {
    const input = 'key:value';
    const result = formatYaml(input);
    expect(result).toContain('key: value');
  });

  it('roundtrips a simple document', () => {
    const input = 'a: 1\nb: 2';
    const first = formatYaml(input);
    const second = formatYaml(first);
    expect(first).toBe(second);
  });
});

// ─── envToYaml ───────────────────────────────────────────────────────────────

describe('envToYaml', () => {
  it('converts simple env variables', () => {
    const result = envToYaml('KEY=value');
    expect(result).toBe('KEY: value');
  });

  it('converts multiple env variables', () => {
    const result = envToYaml('A=1\nB=2');
    expect(result).toContain('A: 1');
    expect(result).toContain('B: 2');
  });

  it('strips double quotes from values', () => {
    const result = envToYaml('KEY="hello"');
    expect(result).toBe('KEY: hello');
  });

  it('strips single quotes from values', () => {
    const result = envToYaml("KEY='hello'");
    expect(result).toBe('KEY: hello');
  });

  it('skips comment lines', () => {
    const result = envToYaml('# comment\nKEY=val');
    expect(result).not.toContain('#');
    expect(result).toBe('KEY: val');
  });

  it('skips empty lines', () => {
    const result = envToYaml('A=1\n\nB=2');
    expect(result).toContain('A: 1');
    expect(result).toContain('B: 2');
  });

  it('handles empty input', () => {
    const result = envToYaml('');
    expect(result).toBe('{}');
  });

  it('handles values with equals sign', () => {
    const result = envToYaml('KEY=a=b');
    expect(result).toBe('KEY: a=b');
  });

  it('handles value with spaces', () => {
    const result = envToYaml('KEY=hello world');
    expect(result).toBe('KEY: hello world');
  });

  it('trims whitespace around key', () => {
    const result = envToYaml('  KEY  =value');
    expect(result).toBe('KEY: value');
  });

  it('handles URL values that contain colons', () => {
    const result = envToYaml('URL=http://localhost:3000');
    expect(result).toContain('"http://localhost:3000"');
  });

  it('converts a realistic .env block', () => {
    const env = `
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME="mydb"
`;
    const result = envToYaml(env);
    expect(result).toContain('DB_HOST: localhost');
    expect(result).toContain('DB_PORT: 5432');
    expect(result).toContain('DB_NAME: mydb');
  });
});

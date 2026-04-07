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
} from '../src/data-converters/format';

// ═══════════════════════════════════════════════
// TOML
// ═══════════════════════════════════════════════

describe('jsonToToml', () => {
  it('converts flat JSON', () => {
    const r = jsonToToml('{"name":"app","port":3000,"debug":true}');
    expect(r).toContain('name = "app"');
    expect(r).toContain('port = 3000');
    expect(r).toContain('debug = true');
  });
  it('converts nested table', () => {
    const r = jsonToToml('{"db":{"host":"localhost","port":5432}}');
    expect(r).toContain('[db]');
    expect(r).toContain('host = "localhost"');
  });
  it('converts arrays', () => {
    const r = jsonToToml('{"tags":["a","b","c"]}');
    expect(r).toContain('tags = ["a", "b", "c"]');
  });
  it('escapes double quotes in strings', () => {
    const r = jsonToToml('{"val":"say \\"hello\\""}');
    expect(r).toContain('\\"hello\\"');
  });
  it('skips null values', () => {
    const r = jsonToToml('{"a":1,"b":null}');
    expect(r).toContain('a = 1');
    expect(r).not.toContain('b =');
  });
});

// ═══════════════════════════════════════════════
// INI
// ═══════════════════════════════════════════════

describe('iniToJson / jsonToIni', () => {
  it('parses INI with sections', () => {
    const ini = '[database]\nhost=localhost\nport=5432\n[app]\ndebug=true';
    const r = JSON.parse(iniToJson(ini));
    expect(r.database.host).toBe('localhost');
    expect(r.database.port).toBe(5432);
    expect(r.app.debug).toBe(true);
  });
  it('skips comments', () => {
    const ini = '; comment\n# hash comment\n[s]\nk=v';
    const r = JSON.parse(iniToJson(ini));
    expect(r.s.k).toBe('v');
  });
  it('jsonToIni produces sections', () => {
    const json = '{"db":{"host":"localhost","port":"5432"}}';
    const r = jsonToIni(json);
    expect(r).toContain('[db]');
    expect(r).toContain('host=localhost');
  });
  it('roundtrip', () => {
    const ini = '[section]\nkey=value\nnum=42';
    const json = iniToJson(ini);
    const back = jsonToIni(json);
    expect(back).toContain('[section]');
    expect(back).toContain('key=value');
    expect(back).toContain('num=42');
  });
});

// ═══════════════════════════════════════════════
// Properties
// ═══════════════════════════════════════════════

describe('jsonToProperties / propertiesToJson', () => {
  it('flattens nested JSON', () => {
    const json = '{"db":{"host":"localhost","port":5432}}';
    const r = jsonToProperties(json);
    expect(r).toContain('db.host=localhost');
    expect(r).toContain('db.port=5432');
  });
  it('handles arrays', () => {
    const json = '{"items":["a","b"]}';
    const r = jsonToProperties(json);
    expect(r).toContain('items[0]=a');
    expect(r).toContain('items[1]=b');
  });
  it('propertiesToJson reconstructs nested', () => {
    const props = 'db.host=localhost\ndb.port=5432\napp.name=test';
    const r = JSON.parse(propertiesToJson(props));
    expect(r.db.host).toBe('localhost');
    expect(r.db.port).toBe(5432);
    expect(r.app.name).toBe('test');
  });
  it('skips comment lines', () => {
    const props = '# comment\na=1';
    const r = JSON.parse(propertiesToJson(props));
    expect(r.a).toBe(1);
  });
  it('handles boolean coercion', () => {
    const props = 'flag=true\nother=false';
    const r = JSON.parse(propertiesToJson(props));
    expect(r.flag).toBe(true);
    expect(r.other).toBe(false);
  });
});

// ═══════════════════════════════════════════════
// ENV
// ═══════════════════════════════════════════════

describe('envToJson / jsonToEnv', () => {
  it('parses basic env', () => {
    const env = 'DB_HOST=localhost\nDB_PORT=5432';
    const r = JSON.parse(envToJson(env));
    expect(r.DB_HOST).toBe('localhost');
    expect(r.DB_PORT).toBe('5432');
  });
  it('strips surrounding quotes', () => {
    const env = 'A="quoted"\nB=\'single\'';
    const r = JSON.parse(envToJson(env));
    expect(r.A).toBe('quoted');
    expect(r.B).toBe('single');
  });
  it('skips comments and blank lines', () => {
    const env = '# comment\n\nKEY=val';
    const r = JSON.parse(envToJson(env));
    expect(Object.keys(r)).toEqual(['KEY']);
  });
  it('jsonToEnv basic', () => {
    const json = '{"DB_HOST":"localhost","DB_PORT":"5432"}';
    const r = jsonToEnv(json);
    expect(r).toContain('DB_HOST=localhost');
    expect(r).toContain('DB_PORT=5432');
  });
  it('jsonToEnv quotes values with spaces', () => {
    const json = '{"MSG":"hello world"}';
    const r = jsonToEnv(json);
    expect(r).toContain('MSG="hello world"');
  });
  it('envToDockerCompose generates compose format', () => {
    const env = 'PORT=3000\nNODE_ENV=production';
    const r = envToDockerCompose(env);
    expect(r).toContain('version:');
    expect(r).toContain('services:');
    expect(r).toContain('environment:');
    expect(r).toContain('PORT=3000');
  });
});

// ═══════════════════════════════════════════════
// Line Endings & Indentation
// ═══════════════════════════════════════════════

describe('normalizeLineEndings', () => {
  it('CRLF → LF', () => {
    expect(normalizeLineEndings('a\r\nb\r\nc', 'lf')).toBe('a\nb\nc');
  });
  it('LF → CRLF', () => {
    expect(normalizeLineEndings('a\nb\nc', 'crlf')).toBe('a\r\nb\r\nc');
  });
  it('mixed → CR', () => {
    expect(normalizeLineEndings('a\r\nb\nc', 'cr')).toBe('a\rb\rc');
  });
  it('already correct is idempotent', () => {
    expect(normalizeLineEndings('a\nb\nc', 'lf')).toBe('a\nb\nc');
  });
});

describe('convertIndentation', () => {
  it('tabs to spaces', () => {
    expect(convertIndentation('\tif (x) {\n\t\ty;\n\t}', true, false, 2)).toBe(
      '  if (x) {\n    y;\n  }',
    );
  });
  it('spaces to tabs', () => {
    expect(convertIndentation('    x', false, true, 4)).toBe('\tx');
  });
  it('no-op when same format', () => {
    expect(convertIndentation('\tx', true, true)).toBe('\tx');
  });
});

describe('sortKeys', () => {
  it('sorts JSON keys', () => {
    const r = sortKeys('{"z":1,"a":2,"m":3}');
    expect(Object.keys(JSON.parse(r))).toEqual(['a', 'm', 'z']);
  });
  it('deep sorts nested objects', () => {
    const r = sortKeys('{"b":{"z":1,"a":2},"a":3}');
    const p = JSON.parse(r);
    expect(Object.keys(p)).toEqual(['a', 'b']);
    expect(Object.keys(p.b)).toEqual(['a', 'z']);
  });
  it('handles arrays', () => {
    const r = sortKeys('[{"b":1,"a":2}]');
    const p = JSON.parse(r);
    expect(Object.keys(p[0])).toEqual(['a', 'b']);
  });
});

// ═══════════════════════════════════════════════
// Injection tests
// ═══════════════════════════════════════════════

describe('injection resistance in format converters', () => {
  const xss = '<script>alert(document.cookie)</script>';
  const sqli = "'; DROP TABLE users; --";
  const cmd = '$(rm -rf /)';

  it('envToJson preserves but does not execute injections', () => {
    const r = JSON.parse(envToJson(`PAYLOAD=${xss}`));
    expect(r.PAYLOAD).toBe(xss); // data preserved, not executed
  });
  it('jsonToEnv with command injection', () => {
    const r = jsonToEnv(JSON.stringify({ CMD: cmd }));
    expect(r).toContain('CMD=');
    // command injection is present as data — env files don't execute on their own
  });
  it('iniToJson with SQLi in value', () => {
    const r = JSON.parse(iniToJson(`[s]\nval=${sqli}`));
    expect(r.s.val).toBe(sqli);
  });
  it('propertiesToJson with path traversal', () => {
    const r = JSON.parse(propertiesToJson('path=../../../../etc/passwd'));
    expect(r.path).toBe('../../../../etc/passwd');
  });
});

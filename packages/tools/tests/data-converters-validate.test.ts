import { describe, it, expect } from 'vitest';
import {
  validateJson,
  validateYaml,
  testRegex,
  testJsonPath,
  parseSemver,
  parseCronExpression,
  lineDiff,
} from '../src/data-converters/validate';

describe('validateJson', () => {
  it('valid JSON', () => {
    expect(validateJson('{"a":1}')).toEqual({ valid: true });
  });
  it('valid array', () => {
    expect(validateJson('[1,2,3]')).toEqual({ valid: true });
  });
  it('invalid JSON', () => {
    const r = validateJson('{not json}');
    expect(r.valid).toBe(false);
    expect(r.error).toBeDefined();
  });
  it('empty string', () => {
    expect(validateJson('').valid).toBe(false);
  });
  it('injection payload is valid JSON string', () => {
    expect(validateJson('"<script>alert(1)</script>"')).toEqual({ valid: true });
  });
});

describe('validateYaml', () => {
  it('valid YAML', () => {
    expect(validateYaml('name: test\nport: 3000').valid).toBe(true);
  });
  it('YAML with list', () => {
    expect(validateYaml('- item1\n- item2').valid).toBe(true);
  });
  it('tabs rejected', () => {
    const r = validateYaml('\tname: test');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('tabs');
  });
  it('invalid syntax', () => {
    const r = validateYaml('just some text without colon');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('invalid YAML syntax');
  });
});

describe('testRegex', () => {
  it('finds matches', () => {
    const r = JSON.parse(testRegex('\\d+', 'abc 123 def 456'));
    expect(r.matchCount).toBe(2);
    expect(r.matches[0].match).toBe('123');
    expect(r.matches[1].match).toBe('456');
  });
  it('no matches', () => {
    const r = JSON.parse(testRegex('xyz', 'abc def'));
    expect(r.matchCount).toBe(0);
  });
  it('with groups', () => {
    const r = JSON.parse(testRegex('(\\w+)@(\\w+)', 'user@host'));
    expect(r.matchCount).toBe(1);
  });
  it('invalid regex returns error', () => {
    const r = JSON.parse(testRegex('[invalid', 'text'));
    expect(r.error).toBeDefined();
  });
  it('custom flags', () => {
    const r = JSON.parse(testRegex('abc', 'ABC DEF abc', 'gi'));
    expect(r.matchCount).toBe(2);
  });
  // ReDoS resistance — the function should handle this without hanging
  it('handles potentially catastrophic backtracking pattern', () => {
    const r = JSON.parse(testRegex('(a+)+$', 'aaaaab'));
    expect(r.matchCount).toBe(0);
  });
});

describe('testJsonPath', () => {
  it('root path $', () => {
    const r = JSON.parse(testJsonPath('{"a":1}', '$'));
    expect(r.result.a).toBe(1);
  });
  it('simple property $.name', () => {
    const r = JSON.parse(testJsonPath('{"name":"test"}', '$.name'));
    expect(r.result).toBe('test');
  });
  it('nested property', () => {
    const r = JSON.parse(testJsonPath('{"a":{"b":{"c":42}}}', '$.a.b.c'));
    expect(r.result).toBe(42);
  });
  it('array index', () => {
    const r = JSON.parse(testJsonPath('{"items":["x","y","z"]}', '$.items[1]'));
    expect(r.result).toBe('y');
  });
  it('invalid JSON returns error', () => {
    const r = JSON.parse(testJsonPath('not json', '$.a'));
    expect(r.error).toBeDefined();
  });
  it('missing path returns undefined', () => {
    const r = JSON.parse(testJsonPath('{"a":1}', '$.nonexistent'));
    expect(r.result).toBeUndefined();
  });
});

describe('parseSemver', () => {
  it('valid: 1.2.3', () => {
    const r = parseSemver('1.2.3');
    expect(r.valid).toBe(true);
    expect(r.parsed?.major).toBe(1);
    expect(r.parsed?.minor).toBe(2);
    expect(r.parsed?.patch).toBe(3);
  });
  it('valid with v prefix', () => {
    expect(parseSemver('v2.0.0').valid).toBe(true);
  });
  it('with prerelease', () => {
    const r = parseSemver('1.0.0-alpha.1');
    expect(r.valid).toBe(true);
    expect(r.parsed?.prerelease).toBe('alpha.1');
  });
  it('with build metadata', () => {
    const r = parseSemver('1.0.0+build.123');
    expect(r.valid).toBe(true);
    expect(r.parsed?.buildMetadata).toBe('build.123');
  });
  it('with prerelease and build', () => {
    const r = parseSemver('1.0.0-beta.2+sha.abc');
    expect(r.valid).toBe(true);
  });
  it('invalid: missing patch', () => {
    expect(parseSemver('1.2').valid).toBe(false);
  });
  it('invalid: letters', () => {
    expect(parseSemver('abc').valid).toBe(false);
  });
  it('0.0.0 is valid', () => {
    expect(parseSemver('0.0.0').valid).toBe(true);
  });
  it('injection in version string', () => {
    expect(parseSemver('<script>alert(1)</script>').valid).toBe(false);
  });
});

describe('parseCronExpression', () => {
  it('every minute * * * * *', () => {
    const r = JSON.parse(parseCronExpression('* * * * *'));
    expect(r.valid).toBe(true);
    expect(r.description).toContain('Every minute');
  });
  it('specific time 30 9 * * *', () => {
    const r = JSON.parse(parseCronExpression('30 9 * * *'));
    expect(r.valid).toBe(true);
    expect(r.fields.minute).toBe('30');
    expect(r.fields.hour).toBe('9');
  });
  it('6-field extended cron', () => {
    const r = JSON.parse(parseCronExpression('0 30 9 * * *'));
    expect(r.valid).toBe(true);
    expect(r.fields.second).toBe('0');
  });
  it('invalid: too many fields', () => {
    const r = JSON.parse(parseCronExpression('1 2 3 4 5 6 7'));
    expect(r.valid).toBe(false);
  });
  it('invalid: too few fields', () => {
    const r = JSON.parse(parseCronExpression('* * *'));
    expect(r.valid).toBe(false);
  });
});

describe('lineDiff', () => {
  it('identical texts', () => {
    const r = lineDiff('a\nb', 'a\nb');
    expect(r).toContain('  a');
    expect(r).toContain('  b');
    expect(r).not.toContain('+ ');
    expect(r).not.toContain('- ');
  });
  it('changed line', () => {
    const r = lineDiff('a\nb', 'a\nc');
    expect(r).toContain('- b');
    expect(r).toContain('+ c');
  });
  it('added line', () => {
    const r = lineDiff('a', 'a\nb');
    expect(r).toContain('+ b');
  });
  it('removed line', () => {
    const r = lineDiff('a\nb', 'a');
    expect(r).toContain('- b');
  });
  it('completely different', () => {
    const r = lineDiff('x', 'y');
    expect(r).toContain('- x');
    expect(r).toContain('+ y');
  });
});

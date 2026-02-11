import { describe, it, expect } from 'vitest';
import {
  validateJson,
  validateYaml,
  testRegex,
  testJsonPath,
  parseSemver,
  parseCronExpression,
  lineDiff,
} from '../validate';

// ─── validateJson ───────────────────────────────────────────────────────────

describe('validateJson', () => {
  it('returns valid for a simple object', () => {
    expect(validateJson('{"a":1}')).toEqual({ valid: true });
  });

  it('returns valid for a JSON array', () => {
    expect(validateJson('[1,2,3]')).toEqual({ valid: true });
  });

  it('returns valid for a string value', () => {
    expect(validateJson('"hello"')).toEqual({ valid: true });
  });

  it('returns valid for a numeric value', () => {
    expect(validateJson('42')).toEqual({ valid: true });
  });

  it('returns valid for null', () => {
    expect(validateJson('null')).toEqual({ valid: true });
  });

  it('returns valid for boolean true', () => {
    expect(validateJson('true')).toEqual({ valid: true });
  });

  it('returns valid for nested objects', () => {
    expect(validateJson('{"a":{"b":{"c":1}}}')).toEqual({ valid: true });
  });

  it('returns invalid with error for trailing comma', () => {
    const result = validateJson('{"a":1,}');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns invalid with error for empty string', () => {
    const result = validateJson('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns invalid with error for plain text', () => {
    const result = validateJson('not json');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns invalid with error for unclosed brace', () => {
    const result = validateJson('{"a":1');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns valid for an empty object', () => {
    expect(validateJson('{}')).toEqual({ valid: true });
  });

  it('returns valid for an empty array', () => {
    expect(validateJson('[]')).toEqual({ valid: true });
  });
});

// ─── validateYaml ───────────────────────────────────────────────────────────

describe('validateYaml', () => {
  it('returns valid for simple key-value', () => {
    expect(validateYaml('name: hello')).toEqual({ valid: true });
  });

  it('returns valid for multiple key-value lines', () => {
    expect(validateYaml('a: 1\nb: 2')).toEqual({ valid: true });
  });

  it('returns valid for list items', () => {
    expect(validateYaml('- item1\n- item2')).toEqual({ valid: true });
  });

  it('returns valid for comments', () => {
    expect(validateYaml('# this is a comment\nkey: value')).toEqual({ valid: true });
  });

  it('returns valid for empty lines mixed in', () => {
    expect(validateYaml('a: 1\n\nb: 2')).toEqual({ valid: true });
  });

  it('returns invalid when tabs are present', () => {
    const result = validateYaml('\tkey: value');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('tabs are not allowed');
  });

  it('reports the correct line number for tab errors', () => {
    const result = validateYaml('a: 1\n\tkey: value');
    expect(result.error).toContain('Line 2');
  });

  it('returns invalid for line without colon or dash', () => {
    const result = validateYaml('just some text');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid YAML syntax');
  });

  it('returns valid for empty string', () => {
    // All lines are empty or trimmed-empty → skipped, so valid
    expect(validateYaml('')).toEqual({ valid: true });
  });

  it('returns valid for only comments', () => {
    expect(validateYaml('# comment1\n# comment2')).toEqual({ valid: true });
  });

  it('returns valid for list with nested key-value', () => {
    expect(validateYaml('- name: a\n- name: b')).toEqual({ valid: true });
  });
});

// ─── testRegex ──────────────────────────────────────────────────────────────

describe('testRegex', () => {
  it('returns matches for a simple pattern', () => {
    const result = JSON.parse(testRegex('\\d+', 'abc 123 def 456'));
    expect(result.matchCount).toBe(2);
    expect(result.matches[0].match).toBe('123');
    expect(result.matches[1].match).toBe('456');
  });

  it('returns the pattern and flags in the result', () => {
    const result = JSON.parse(testRegex('hello', 'hello world', 'g'));
    expect(result.pattern).toBe('hello');
    expect(result.flags).toBe('g');
  });

  it('defaults to g flag', () => {
    const result = JSON.parse(testRegex('a', 'aaa'));
    expect(result.flags).toBe('g');
    expect(result.matchCount).toBe(3);
  });

  it('picks up named groups', () => {
    const result = JSON.parse(testRegex('(?<year>\\d{4})-(?<month>\\d{2})', '2024-05'));
    expect(result.matches[0].groups).toEqual({ year: '2024', month: '05' });
  });

  it('handles zero matches', () => {
    const result = JSON.parse(testRegex('xyz', 'hello'));
    expect(result.matchCount).toBe(0);
    expect(result.matches).toEqual([]);
  });

  it('returns match index', () => {
    const result = JSON.parse(testRegex('world', 'hello world'));
    expect(result.matches[0].index).toBe(6);
  });

  it('returns error JSON for invalid regex', () => {
    const result = JSON.parse(testRegex('[invalid', 'text'));
    expect(result.error).toBeDefined();
  });

  it('supports case-insensitive flag', () => {
    const result = JSON.parse(testRegex('hello', 'Hello HELLO hello', 'gi'));
    expect(result.matchCount).toBe(3);
  });

  it('handles zero-length matches without infinite loop', () => {
    const result = JSON.parse(testRegex('', 'abc'));
    // Empty pattern matches at every position
    expect(result.matchCount).toBeGreaterThan(0);
  });
});

// ─── testJsonPath ───────────────────────────────────────────────────────────

describe('testJsonPath', () => {
  const sampleJson = JSON.stringify({ name: 'Alice', age: 30, items: [1, 2, 3], nested: { x: 10 } });

  it('returns full data for $ path', () => {
    const result = JSON.parse(testJsonPath(sampleJson, '$'));
    expect(result.result).toEqual({ name: 'Alice', age: 30, items: [1, 2, 3], nested: { x: 10 } });
  });

  it('returns full data for empty path', () => {
    const result = JSON.parse(testJsonPath(sampleJson, ''));
    expect(result.result).toEqual({ name: 'Alice', age: 30, items: [1, 2, 3], nested: { x: 10 } });
  });

  it('resolves a top-level field with $.field', () => {
    const result = JSON.parse(testJsonPath(sampleJson, '$.name'));
    expect(result.result).toBe('Alice');
  });

  it('resolves nested field', () => {
    const result = JSON.parse(testJsonPath(sampleJson, '$.nested.x'));
    expect(result.result).toBe(10);
  });

  it('resolves array index', () => {
    const result = JSON.parse(testJsonPath(sampleJson, '$.items[0]'));
    expect(result.result).toBe(1);
  });

  it('returns undefined for non-existent path', () => {
    const result = JSON.parse(testJsonPath(sampleJson, '$.missing'));
    expect(result.result).toBeUndefined();
  });

  it('returns error for invalid JSON input', () => {
    const result = JSON.parse(testJsonPath('not json', '$.x'));
    expect(result.error).toBeDefined();
  });

  it('includes the path in result', () => {
    const result = JSON.parse(testJsonPath(sampleJson, '$.age'));
    expect(result.path).toBe('$.age');
    expect(result.result).toBe(30);
  });
});

// ─── parseSemver ────────────────────────────────────────────────────────────

describe('parseSemver', () => {
  it('parses a basic semver string', () => {
    const result = parseSemver('1.2.3');
    expect(result.valid).toBe(true);
    expect(result.parsed?.major).toBe(1);
    expect(result.parsed?.minor).toBe(2);
    expect(result.parsed?.patch).toBe(3);
  });

  it('parses version with v prefix', () => {
    const result = parseSemver('v2.0.0');
    expect(result.valid).toBe(true);
    expect(result.parsed?.major).toBe(2);
  });

  it('parses prerelease tag', () => {
    const result = parseSemver('1.0.0-alpha.1');
    expect(result.valid).toBe(true);
    expect(result.parsed?.prerelease).toBe('alpha.1');
  });

  it('parses build metadata', () => {
    const result = parseSemver('1.0.0+build.123');
    expect(result.valid).toBe(true);
    expect(result.parsed?.buildMetadata).toBe('build.123');
  });

  it('parses prerelease and build metadata together', () => {
    const result = parseSemver('1.0.0-beta.2+sha.abc');
    expect(result.valid).toBe(true);
    expect(result.parsed?.prerelease).toBe('beta.2');
    expect(result.parsed?.buildMetadata).toBe('sha.abc');
  });

  it('sets prerelease to null when absent', () => {
    const result = parseSemver('3.2.1');
    expect(result.parsed?.prerelease).toBeNull();
  });

  it('sets buildMetadata to null when absent', () => {
    const result = parseSemver('3.2.1');
    expect(result.parsed?.buildMetadata).toBeNull();
  });

  it('stores original full version string', () => {
    const result = parseSemver('v1.2.3-rc.1+build');
    expect(result.parsed?.full).toBe('v1.2.3-rc.1+build');
  });

  it('rejects version with only two parts', () => {
    const result = parseSemver('1.2');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid semantic version format');
  });

  it('rejects completely invalid string', () => {
    const result = parseSemver('not-a-version');
    expect(result.valid).toBe(false);
  });

  it('parses 0.0.0', () => {
    const result = parseSemver('0.0.0');
    expect(result.valid).toBe(true);
    expect(result.parsed?.major).toBe(0);
    expect(result.parsed?.minor).toBe(0);
    expect(result.parsed?.patch).toBe(0);
  });

  it('rejects leading zeros in major version', () => {
    const result = parseSemver('01.0.0');
    expect(result.valid).toBe(false);
  });
});

// ─── parseCronExpression ────────────────────────────────────────────────────

describe('parseCronExpression', () => {
  it('parses standard 5-field cron', () => {
    const result = JSON.parse(parseCronExpression('0 12 * * *'));
    expect(result.valid).toBe(true);
    expect(result.fields.minute).toBe('0');
    expect(result.fields.hour).toBe('12');
  });

  it('generates description for specific time', () => {
    const result = JSON.parse(parseCronExpression('30 9 * * *'));
    expect(result.description).toBe('At 9:30');
  });

  it('parses every-minute cron', () => {
    const result = JSON.parse(parseCronExpression('* * * * *'));
    expect(result.description).toBe('Every minute');
  });

  it('describes at minute X of every hour', () => {
    const result = JSON.parse(parseCronExpression('15 * * * *'));
    expect(result.description).toBe('At minute 15 of every hour');
  });

  it('parses 6-field (with seconds) cron', () => {
    const result = JSON.parse(parseCronExpression('0 30 9 * * *'));
    expect(result.valid).toBe(true);
    expect(result.fields.second).toBe('0');
    expect(result.fields.minute).toBe('30');
    expect(result.fields.hour).toBe('9');
  });

  it('rejects cron with wrong number of fields', () => {
    const result = JSON.parse(parseCronExpression('1 2 3'));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5 or 6 fields');
  });

  it('rejects cron with too many fields', () => {
    const result = JSON.parse(parseCronExpression('1 2 3 4 5 6 7'));
    expect(result.valid).toBe(false);
  });

  it('preserves dayOfMonth, month, dayOfWeek fields', () => {
    const result = JSON.parse(parseCronExpression('0 0 1 1 0'));
    expect(result.fields.dayOfMonth).toBe('1');
    expect(result.fields.month).toBe('1');
    expect(result.fields.dayOfWeek).toBe('0');
  });

  it('returns Custom schedule when minute is wildcard and hour is not', () => {
    const result = JSON.parse(parseCronExpression('* 5 * * *'));
    expect(result.description).toBe('Custom schedule');
  });
});

// ─── lineDiff ───────────────────────────────────────────────────────────────

describe('lineDiff', () => {
  it('shows no changes for identical texts', () => {
    const result = lineDiff('a\nb', 'a\nb');
    expect(result).toBe('  a\n  b');
  });

  it('shows a removed line', () => {
    const result = lineDiff('a\nb', 'a');
    expect(result).toContain('- b');
  });

  it('shows an added line', () => {
    const result = lineDiff('a', 'a\nb');
    expect(result).toContain('+ b');
  });

  it('shows changed line as minus then plus', () => {
    const result = lineDiff('old', 'new');
    const lines = result.split('\n');
    expect(lines[0]).toBe('- old');
    expect(lines[1]).toBe('+ new');
  });

  it('handles empty first text', () => {
    const result = lineDiff('', 'new');
    expect(result).toContain('- ');
    // first text splits to [''] and second to ['new'] → differs
  });

  it('handles empty second text', () => {
    const result = lineDiff('old', '');
    const lines = result.split('\n');
    expect(lines[0]).toBe('- old');
    expect(lines[1]).toBe('+ ');
  });

  it('handles both texts empty', () => {
    const result = lineDiff('', '');
    // Both split to [''], same line → unchanged
    expect(result).toBe('  ');
  });

  it('handles multi-line diff correctly', () => {
    const result = lineDiff('a\nb\nc', 'a\nB\nc');
    const lines = result.split('\n');
    expect(lines[0]).toBe('  a');
    expect(lines[1]).toBe('- b');
    expect(lines[2]).toBe('+ B');
    expect(lines[3]).toBe('  c');
  });

  it('handles text2 having more lines than text1', () => {
    const result = lineDiff('a', 'a\nb\nc');
    expect(result).toContain('+ b');
    expect(result).toContain('+ c');
  });

  it('handles text1 having more lines than text2', () => {
    const result = lineDiff('a\nb\nc', 'a');
    expect(result).toContain('- b');
    expect(result).toContain('- c');
  });
});

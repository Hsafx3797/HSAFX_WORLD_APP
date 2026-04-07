import { describe, it, expect } from 'vitest';
import {
  formatJson,
  minifyJson,
  sortJsonKeys,
  jsonToNdjson,
  ndjsonToJson,
  jsonToUrlParams,
  urlParamsToJson,
  jsonToFormData,
  queryStringToJson,
  jsonToQueryString,
  base64ToJson,
  jsonToBase64,
  jsonDiff,
} from '../src/data-converters/json';
import {
  jsonToYaml,
  yamlToJson,
  formatYaml,
  envToYaml,
} from '../src/data-converters/yaml';
import {
  jsonToXml,
  xmlToJson,
  formatXml,
  validateXml,
  testXPath,
} from '../src/data-converters/xml';
import {
  jsonToCsv,
  csvToJson,
  jsonToTsv,
  tsvToJson,
  tsvToCsv,
  csvToTsv,
  validateCsv,
  markdownTableToJson,
  jsonToMarkdownTable,
} from '../src/data-converters/csv';

// ═══════════════════════════════════════════════
// JSON utilities
// ═══════════════════════════════════════════════

describe('formatJson', () => {
  it('formats compact JSON', () => {
    const r = formatJson('{"a":1,"b":2}');
    expect(r).toContain('\n');
    expect(JSON.parse(r)).toEqual({ a: 1, b: 2 });
  });
  it('custom indent', () => {
    const r = formatJson('{"a":1}', 4);
    expect(r).toContain('    "a"');
  });
  it('throws on invalid JSON', () => {
    expect(() => formatJson('not json')).toThrow();
  });
});

describe('minifyJson', () => {
  it('removes whitespace', () => {
    const r = minifyJson('{\n  "a": 1\n}');
    expect(r).toBe('{"a":1}');
  });
});

describe('sortJsonKeys', () => {
  it('sorts alphabetically', () => {
    const r = sortJsonKeys('{"z":1,"a":2,"m":3}');
    const keys = Object.keys(JSON.parse(r));
    expect(keys).toEqual(['a', 'm', 'z']);
  });
  it('deep sorts nested objects', () => {
    const r = sortJsonKeys('{"b":{"z":1,"a":2},"a":3}');
    const parsed = JSON.parse(r);
    expect(Object.keys(parsed)).toEqual(['a', 'b']);
    expect(Object.keys(parsed.b)).toEqual(['a', 'z']);
  });
});

describe('NDJSON', () => {
  it('jsonToNdjson array → one line per item', () => {
    const r = jsonToNdjson('[{"a":1},{"a":2}]');
    const lines = r.split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!)).toEqual({ a: 1 });
  });
  it('ndjsonToJson lines → array', () => {
    const ndjson = '{"a":1}\n{"a":2}';
    const r = JSON.parse(ndjsonToJson(ndjson));
    expect(r).toHaveLength(2);
  });
  it('roundtrip', () => {
    const orig = '[{"x":1},{"x":2},{"x":3}]';
    const rt = JSON.parse(ndjsonToJson(jsonToNdjson(orig)));
    expect(rt).toEqual(JSON.parse(orig));
  });
});

describe('URL params & query strings', () => {
  it('jsonToUrlParams basic', () => {
    const r = jsonToUrlParams('{"a":"1","b":"hello world"}');
    expect(r).toContain('a=1');
    expect(r).toContain('b=hello');
  });
  it('urlParamsToJson', () => {
    const r = JSON.parse(urlParamsToJson('a=1&b=2'));
    expect(r.a).toBe('1');
    expect(r.b).toBe('2');
  });
  it('queryStringToJson with ?', () => {
    const r = JSON.parse(queryStringToJson('?name=test&val=42'));
    expect(r.name).toBe('test');
  });
  it('queryStringToJson duplicates → array', () => {
    const r = JSON.parse(queryStringToJson('a=1&a=2'));
    expect(r.a).toEqual(['1', '2']);
  });
  it('jsonToQueryString', () => {
    const r = jsonToQueryString('{"a":"1","b":"2"}');
    expect(r).toContain('a=1');
    expect(r).toContain('b=2');
  });
  it('jsonToFormData', () => {
    const r = jsonToFormData('{"name":"test","val":"hello world"}');
    expect(r).toContain('name=test');
  });
});

describe('Base64 ↔ JSON', () => {
  it('roundtrip', () => {
    const orig = '{"hello":"world"}';
    const b64 = jsonToBase64(orig);
    const back = JSON.parse(base64ToJson(b64));
    expect(back).toEqual(JSON.parse(orig));
  });
  it('jsonToBase64 validates JSON first', () => {
    expect(() => jsonToBase64('not json')).toThrow();
  });
});

describe('jsonDiff', () => {
  it('no differences for identical', () => {
    const r = jsonDiff('{"a":1}', '{"a":1}');
    expect(r).toContain('No differences');
  });
  it('detects value change', () => {
    const r = jsonDiff('{"a":1}', '{"a":2}');
    expect(r).toContain('a');
  });
  it('detects added key', () => {
    const r = jsonDiff('{"a":1}', '{"a":1,"b":2}');
    expect(r).toContain('added');
  });
  it('detects removed key', () => {
    const r = jsonDiff('{"a":1,"b":2}', '{"a":1}');
    expect(r).toContain('removed');
  });
  it('detects type change', () => {
    const r = jsonDiff('{"a":1}', '{"a":"1"}');
    expect(r).toContain('type');
  });
});

// ═══════════════════════════════════════════════
// YAML
// ═══════════════════════════════════════════════

describe('jsonToYaml / yamlToJson', () => {
  it('jsonToYaml basic', () => {
    const r = jsonToYaml('{"name":"test","port":3000}');
    expect(r).toContain('name: test');
    expect(r).toContain('port: 3000');
  });
  it('yamlToJson basic', () => {
    const yaml = 'name: test\nport: 3000';
    const r = JSON.parse(yamlToJson(yaml));
    expect(r.name).toBe('test');
    expect(r.port).toBe(3000);
  });
  it('formatYaml produces consistent output', () => {
    const yaml = 'name:  test\nport:   3000';
    const r = formatYaml(yaml);
    expect(r).toContain('name');
    expect(r).toContain('port');
  });
  it('envToYaml', () => {
    const env = 'DB_HOST=localhost\nDB_PORT=5432';
    const r = envToYaml(env);
    expect(r).toContain('DB_HOST');
    expect(r).toContain('localhost');
  });
});

// ═══════════════════════════════════════════════
// XML
// ═══════════════════════════════════════════════

describe('jsonToXml', () => {
  it('produces valid XML', () => {
    const r = jsonToXml('{"name":"test","age":25}');
    expect(r).toContain('<?xml');
    expect(r).toContain('<name>test</name>');
    expect(r).toContain('<age>25</age>');
  });
  it('custom root', () => {
    const r = jsonToXml('{"a":1}', 'data');
    expect(r).toContain('<data>');
    expect(r).toContain('</data>');
  });
  it('escapes special characters (XSS prevention)', () => {
    const r = jsonToXml('{"val":"<script>alert(1)</script>"}');
    expect(r).not.toContain('<script>');
    expect(r).toContain('&lt;script&gt;');
  });
  it('escapes SQL injection payload', () => {
    const r = jsonToXml(JSON.stringify({ q: "' OR 1=1 --" }));
    expect(r).toContain('&apos;');
  });
});

describe('xmlToJson', () => {
  it('parses simple XML', () => {
    const xml = '<root><name>test</name><age>25</age></root>';
    const r = JSON.parse(xmlToJson(xml));
    expect(r.root.name).toBe('test');
  });
  it('returns {} for invalid XML', () => {
    const r = xmlToJson('not xml');
    expect(r).toBe('{}');
  });
});

describe('formatXml', () => {
  it('indents XML', () => {
    const flat = '<root><a>1</a><b>2</b></root>';
    const r = formatXml(flat);
    expect(r).toContain('\n');
  });
});

describe('validateXml', () => {
  it('valid XML', () => {
    expect(validateXml('<root><a>1</a></root>')).toEqual({ valid: true });
  });
  it('mismatched tags', () => {
    const r = validateXml('<root><a>1</b></root>');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('Mismatched');
  });
});

describe('testXPath', () => {
  it('finds elements', () => {
    const xml = '<root><item>a</item><item>b</item></root>';
    const r = JSON.parse(testXPath(xml, '//item'));
    expect(r.count).toBe(2);
    expect(r.matches).toContain('a');
  });
});

// ═══════════════════════════════════════════════
// CSV / TSV
// ═══════════════════════════════════════════════

describe('jsonToCsv / csvToJson', () => {
  const jsonArr = '[{"name":"Alice","age":30},{"name":"Bob","age":25}]';

  it('jsonToCsv has header row', () => {
    const r = jsonToCsv(jsonArr);
    const lines = r.split('\n');
    expect(lines[0]).toContain('name');
    expect(lines[0]).toContain('age');
    expect(lines).toHaveLength(3); // header + 2 data rows
  });
  it('csvToJson roundtrip', () => {
    const csv = jsonToCsv(jsonArr);
    const back = JSON.parse(csvToJson(csv));
    expect(back).toHaveLength(2);
    expect(back[0].name).toBe('Alice');
  });
  it('throws on non-array', () => {
    expect(() => jsonToCsv('{"a":1}')).toThrow();
  });
  it('throws on empty array', () => {
    expect(() => jsonToCsv('[]')).toThrow();
  });
});

describe('TSV', () => {
  const jsonArr = '[{"x":"hello","y":"world"}]';

  it('jsonToTsv uses tabs', () => {
    const r = jsonToTsv(jsonArr);
    expect(r).toContain('\t');
  });
  it('tsvToJson roundtrip', () => {
    const tsv = jsonToTsv(jsonArr);
    const back = JSON.parse(tsvToJson(tsv));
    expect(back[0].x).toBe('hello');
  });
  it('tsvToCsv and csvToTsv', () => {
    const tsv = 'a\tb\n1\t2';
    const csv = tsvToCsv(tsv);
    expect(csv).toContain(',');
    const backTsv = csvToTsv(csv);
    expect(backTsv).toContain('\t');
  });
});

describe('validateCsv', () => {
  it('valid CSV', () => {
    const r = validateCsv('a,b\n1,2\n3,4');
    expect(r.valid).toBe(true);
  });
  it('column mismatch', () => {
    const r = validateCsv('a,b\n1,2,3');
    expect(r.valid).toBe(false);
  });
});

describe('Markdown table ↔ JSON', () => {
  it('markdownTableToJson', () => {
    const md = '| Name | Age |\n| --- | --- |\n| Alice | 30 |';
    const r = JSON.parse(markdownTableToJson(md));
    expect(r).toHaveLength(1);
    expect(r[0].Name).toBe('Alice');
  });
  it('jsonToMarkdownTable', () => {
    const r = jsonToMarkdownTable('[{"Name":"Alice","Age":"30"}]');
    expect(r).toContain('|');
    expect(r).toContain('Alice');
    expect(r).toContain('---');
  });
  it('roundtrip', () => {
    const orig = '[{"x":"1","y":"2"}]';
    const md = jsonToMarkdownTable(orig);
    const back = JSON.parse(markdownTableToJson(md));
    expect(back[0].x).toBe('1');
  });
});

// ═══════════════════════════════════════════════
// Injection sweep across data converters
// ═══════════════════════════════════════════════
describe('injection resistance in JSON converters', () => {
  const xss = '<script>alert(document.cookie)</script>';
  const sqli = "'; DROP TABLE users; --";
  const xxe = '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>';

  it('formatJson preserves but does not execute XSS', () => {
    const input = JSON.stringify({ val: xss });
    const r = formatJson(input);
    expect(JSON.parse(r).val).toBe(xss); // preserved in data
  });
  it('sortJsonKeys with SQLi key', () => {
    const input = JSON.stringify({ [sqli]: 1, a: 2 });
    const r = sortJsonKeys(input);
    expect(r).toContain(sqli.replace(/"/g, '\\"'));
  });
  it('jsonToXml escapes XSS value', () => {
    const input = JSON.stringify({ val: xss });
    const r = jsonToXml(input);
    expect(r).not.toContain('<script>');
  });
  it('jsonToXml escapes XXE in value', () => {
    const input = JSON.stringify({ val: xxe });
    const r = jsonToXml(input);
    expect(r).not.toContain('<!DOCTYPE');
  });
  it('jsonToCsv with injection in values', () => {
    const input = JSON.stringify([{ val: '=CMD("calc")' }]);
    const r = jsonToCsv(input);
    // CSV formula injection: value should be present (CSV doesn't auto-sanitize formulas)
    expect(r).toContain('val');
  });
  it('jsonToYaml with injection values', () => {
    const input = JSON.stringify({ cmd: '$(whoami)' });
    const r = jsonToYaml(input);
    expect(r).toContain('cmd');
  });
});

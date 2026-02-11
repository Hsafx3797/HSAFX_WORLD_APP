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
} from '../json';

// ─── formatJson ──────────────────────────────────────────────────────────────

describe('formatJson', () => {
  it('pretty-prints with default indent of 2', () => {
    const result = formatJson('{"a":1,"b":2}');
    expect(result).toBe(JSON.stringify({ a: 1, b: 2 }, null, 2));
  });

  it('pretty-prints with custom indent of 4', () => {
    const result = formatJson('{"a":1,"b":2}', 4);
    expect(result).toBe(JSON.stringify({ a: 1, b: 2 }, null, 4));
  });

  it('handles nested objects', () => {
    const result = formatJson('{"a":{"b":1}}');
    expect(result).toBe(JSON.stringify({ a: { b: 1 } }, null, 2));
  });

  it('handles arrays', () => {
    const result = formatJson('[1,2,3]');
    expect(result).toBe(JSON.stringify([1, 2, 3], null, 2));
  });

  it('throws on invalid JSON', () => {
    expect(() => formatJson('not json')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => formatJson('')).toThrow();
  });
});

// ─── minifyJson ──────────────────────────────────────────────────────────────

describe('minifyJson', () => {
  it('removes whitespace from pretty-printed JSON', () => {
    const input = '{ "a": 1, "b": 2 }';
    expect(minifyJson(input)).toBe('{"a":1,"b":2}');
  });

  it('already minified JSON stays the same', () => {
    const input = '{"a":1,"b":2}';
    expect(minifyJson(input)).toBe('{"a":1,"b":2}');
  });

  it('minifies multi-line JSON', () => {
    const input = `{
  "name": "test",
  "value": 42
}`;
    expect(minifyJson(input)).toBe('{"name":"test","value":42}');
  });

  it('throws on invalid JSON', () => {
    expect(() => minifyJson('{bad}')).toThrow();
  });
});

// ─── sortJsonKeys ────────────────────────────────────────────────────────────

describe('sortJsonKeys', () => {
  it('sorts top-level keys alphabetically', () => {
    const result = sortJsonKeys('{"b":1,"a":2}');
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed)).toEqual(['a', 'b']);
  });

  it('deep sorts nested object keys by default', () => {
    const result = sortJsonKeys('{"b":{"d":1,"c":2},"a":1}');
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed)).toEqual(['a', 'b']);
    expect(Object.keys(parsed.b)).toEqual(['c', 'd']);
  });

  it('only sorts top-level when deep=false', () => {
    const result = sortJsonKeys('{"b":{"d":1,"c":2},"a":1}', false);
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed)).toEqual(['a', 'b']);
    // nested keys remain in original order
    expect(Object.keys(parsed.b)).toEqual(['d', 'c']);
  });

  it('handles arrays inside objects when deep=true', () => {
    const result = sortJsonKeys('{"arr":[{"z":1,"a":2}]}');
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed.arr[0])).toEqual(['a', 'z']);
  });

  it('preserves arrays when deep=false', () => {
    const result = sortJsonKeys('{"arr":[{"z":1,"a":2}]}', false);
    const parsed = JSON.parse(result);
    // Array items' keys are NOT sorted
    expect(Object.keys(parsed.arr[0])).toEqual(['z', 'a']);
  });

  it('returns pretty-printed output with indent 2', () => {
    const result = sortJsonKeys('{"b":1,"a":2}');
    expect(result).toContain('\n');
  });
});

// ─── jsonToNdjson ────────────────────────────────────────────────────────────

describe('jsonToNdjson', () => {
  it('converts a JSON array to newline-delimited lines', () => {
    const result = jsonToNdjson('[{"a":1},{"b":2}]');
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('{"a":1}');
    expect(lines[1]).toBe('{"b":2}');
  });

  it('non-array input returns single stringified line', () => {
    const result = jsonToNdjson('{"a":1}');
    expect(result).toBe('{"a":1}');
    expect(result.split('\n')).toHaveLength(1);
  });

  it('handles empty array', () => {
    expect(jsonToNdjson('[]')).toBe('');
  });

  it('handles array with single element', () => {
    const result = jsonToNdjson('[{"x":99}]');
    expect(result).toBe('{"x":99}');
  });
});

// ─── ndjsonToJson ────────────────────────────────────────────────────────────

describe('ndjsonToJson', () => {
  it('converts two NDJSON lines to a JSON array', () => {
    const result = ndjsonToJson('{"a":1}\n{"b":2}');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('handles trailing newline', () => {
    const result = ndjsonToJson('{"a":1}\n{"b":2}\n');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('handles single line', () => {
    const result = ndjsonToJson('{"only":true}');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual([{ only: true }]);
  });

  it('roundtrips with jsonToNdjson', () => {
    const original = '[{"a":1},{"b":2}]';
    const ndjson = jsonToNdjson(original);
    const back = ndjsonToJson(ndjson);
    expect(JSON.parse(back)).toEqual(JSON.parse(original));
  });
});

// ─── jsonToUrlParams ─────────────────────────────────────────────────────────

describe('jsonToUrlParams', () => {
  it('converts flat object to url params', () => {
    const result = jsonToUrlParams('{"name":"test","age":"30"}');
    expect(result).toBe('name=test&age=30');
  });

  it('flattens nested objects with bracket notation', () => {
    const result = jsonToUrlParams('{"user":{"name":"bob"}}');
    expect(result).toContain('user%5Bname%5D=bob');
  });

  it('flattens arrays with index brackets', () => {
    const result = jsonToUrlParams('{"items":["a","b"]}');
    expect(result).toContain('items%5B0%5D=a');
    expect(result).toContain('items%5B1%5D=b');
  });

  it('handles empty object', () => {
    expect(jsonToUrlParams('{}')).toBe('');
  });

  it('converts numbers to strings', () => {
    const result = jsonToUrlParams('{"count":5}');
    expect(result).toBe('count=5');
  });
});

// ─── urlParamsToJson ─────────────────────────────────────────────────────────

describe('urlParamsToJson', () => {
  it('converts simple params to JSON', () => {
    const result = urlParamsToJson('name=test&age=30');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ name: 'test', age: '30' });
  });

  it('handles array notation', () => {
    const result = urlParamsToJson('items[0]=a&items[1]=b');
    const parsed = JSON.parse(result);
    expect(parsed.items).toEqual(['a', 'b']);
  });

  it('handles empty params', () => {
    const result = urlParamsToJson('');
    expect(JSON.parse(result)).toEqual({});
  });

  it('handles encoded characters', () => {
    const result = urlParamsToJson('msg=hello%20world');
    const parsed = JSON.parse(result);
    expect(parsed.msg).toBe('hello world');
  });
});

// ─── jsonToFormData ──────────────────────────────────────────────────────────

describe('jsonToFormData', () => {
  it('returns encoded key=value lines', () => {
    const result = jsonToFormData('{"name":"test","age":"30"}');
    const lines = result.split('\n');
    expect(lines).toContain('name=test');
    expect(lines).toContain('age=30');
  });

  it('encodes special characters', () => {
    const result = jsonToFormData('{"msg":"hello world&foo=bar"}');
    expect(result).toBe('msg=hello%20world%26foo%3Dbar');
  });

  it('flattens nested objects', () => {
    const result = jsonToFormData('{"user":{"name":"a"}}');
    expect(result).toContain('user[name]=a');
  });

  it('flattens arrays', () => {
    const result = jsonToFormData('{"tags":["x","y"]}');
    expect(result).toContain('tags[0]=x');
    expect(result).toContain('tags[1]=y');
  });

  it('handles empty object', () => {
    expect(jsonToFormData('{}')).toBe('');
  });
});

// ─── queryStringToJson ───────────────────────────────────────────────────────

describe('queryStringToJson', () => {
  it('handles leading ?', () => {
    const result = queryStringToJson('?name=test');
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe('test');
  });

  it('works without leading ?', () => {
    const result = queryStringToJson('name=test');
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe('test');
  });

  it('converts duplicate keys into arrays', () => {
    const result = queryStringToJson('tag=a&tag=b&tag=c');
    const parsed = JSON.parse(result);
    expect(parsed.tag).toEqual(['a', 'b', 'c']);
  });

  it('keeps single values as strings', () => {
    const result = queryStringToJson('x=1');
    const parsed = JSON.parse(result);
    expect(parsed.x).toBe('1');
  });

  it('handles empty query string', () => {
    const result = queryStringToJson('');
    expect(JSON.parse(result)).toEqual({});
  });
});

// ─── jsonToQueryString ───────────────────────────────────────────────────────

describe('jsonToQueryString', () => {
  it('converts flat object to query string', () => {
    const result = jsonToQueryString('{"name":"test","age":"30"}');
    expect(result).toBe('name=test&age=30');
  });

  it('repeats keys for array values', () => {
    const result = jsonToQueryString('{"tag":["a","b"]}');
    expect(result).toBe('tag=a&tag=b');
  });

  it('handles empty object', () => {
    expect(jsonToQueryString('{}')).toBe('');
  });

  it('roundtrips flat objects with queryStringToJson', () => {
    const json = '{"foo":"bar","baz":"qux"}';
    const qs = jsonToQueryString(json);
    const back = queryStringToJson(qs);
    expect(JSON.parse(back)).toEqual(JSON.parse(json));
  });
});

// ─── base64ToJson ────────────────────────────────────────────────────────────

describe('base64ToJson', () => {
  it('decodes valid base64 to pretty JSON', () => {
    const encoded = btoa('{"a":1}');
    const result = base64ToJson(encoded);
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  it('output is pretty-printed', () => {
    const encoded = btoa('{"a":1,"b":2}');
    const result = base64ToJson(encoded);
    expect(result).toBe(JSON.stringify({ a: 1, b: 2 }, null, 2));
  });

  it('throws on invalid base64 content (not JSON)', () => {
    const encoded = btoa('not json');
    expect(() => base64ToJson(encoded)).toThrow();
  });

  it('throws on completely invalid base64', () => {
    expect(() => base64ToJson('!!!invalid!!!')).toThrow();
  });
});

// ─── jsonToBase64 ────────────────────────────────────────────────────────────

describe('jsonToBase64', () => {
  it('encodes valid JSON to base64', () => {
    const result = jsonToBase64('{"a":1}');
    expect(atob(result)).toBe('{"a":1}');
  });

  it('roundtrips with base64ToJson', () => {
    const json = '{"hello":"world","n":42}';
    const b64 = jsonToBase64(json);
    const back = base64ToJson(b64);
    // Both parse to the same object
    expect(JSON.parse(back)).toEqual(JSON.parse(json));
  });

  it('throws on invalid JSON input', () => {
    expect(() => jsonToBase64('not json')).toThrow();
  });

  it('strips whitespace before encoding', () => {
    const a = jsonToBase64('{ "a": 1 }');
    const b = jsonToBase64('{"a":1}');
    expect(a).toBe(b);
  });
});

// ─── jsonDiff ────────────────────────────────────────────────────────────────

describe('jsonDiff', () => {
  it('returns no-diff message for identical objects', () => {
    const result = jsonDiff('{"a":1}', '{"a":1}');
    expect(result).toBe('No differences found');
  });

  it('detects a changed value', () => {
    const result = jsonDiff('{"a":1}', '{"a":2}');
    expect(result).toContain('a');
    expect(result).toContain('1');
    expect(result).toContain('2');
  });

  it('detects an added key', () => {
    const result = jsonDiff('{"a":1}', '{"a":1,"b":2}');
    expect(result).toContain('added');
    expect(result).toContain('b');
  });

  it('detects a removed key', () => {
    const result = jsonDiff('{"a":1,"b":2}', '{"a":1}');
    expect(result).toContain('removed');
    expect(result).toContain('b');
  });

  it('detects type changes', () => {
    const result = jsonDiff('{"a":1}', '{"a":"1"}');
    expect(result).toContain('type changed');
  });

  it('detects changes in nested objects', () => {
    const result = jsonDiff('{"x":{"y":1}}', '{"x":{"y":2}}');
    expect(result).toContain('x.y');
  });

  it('detects array element additions', () => {
    const result = jsonDiff('{"a":[1]}', '{"a":[1,2]}');
    expect(result).toContain('added');
  });

  it('detects array element removals', () => {
    const result = jsonDiff('{"a":[1,2]}', '{"a":[1]}');
    expect(result).toContain('removed');
  });

  it('returns no-diff for identical nested structures', () => {
    const obj = '{"a":{"b":{"c":3}}}';
    expect(jsonDiff(obj, obj)).toBe('No differences found');
  });

  it('handles null value changes', () => {
    const result = jsonDiff('{"a":null}', '{"a":1}');
    expect(result).not.toBe('No differences found');
  });

  it('handles multiple differences at once', () => {
    const result = jsonDiff(
      '{"a":1,"b":2,"c":3}',
      '{"a":9,"b":2,"d":4}',
    );
    expect(result).toContain('a');
    expect(result).toContain('c');
    expect(result).toContain('d');
  });

  it('detects change from object to primitive', () => {
    const result = jsonDiff('{"a":{"nested":true}}', '{"a":42}');
    expect(result).toContain('type changed');
  });
});

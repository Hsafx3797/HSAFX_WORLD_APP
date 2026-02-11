import { describe, it, expect } from 'vitest';
import { escapeXml, jsonToXml, xmlToJson, formatXml, validateXml, testXPath } from '../xml';

// ─── escapeXml ───────────────────────────────────────────────────────────────

describe('escapeXml', () => {
  it('escapes ampersand', () => {
    expect(escapeXml('a&b')).toBe('a&amp;b');
  });

  it('escapes less-than', () => {
    expect(escapeXml('a<b')).toBe('a&lt;b');
  });

  it('escapes greater-than', () => {
    expect(escapeXml('a>b')).toBe('a&gt;b');
  });

  it('escapes double quote', () => {
    expect(escapeXml('a"b')).toBe('a&quot;b');
  });

  it('escapes single quote (apostrophe)', () => {
    expect(escapeXml("a'b")).toBe('a&apos;b');
  });

  it('escapes all special characters in one string', () => {
    expect(escapeXml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&apos;');
  });

  it('returns empty string unchanged', () => {
    expect(escapeXml('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(escapeXml('hello world')).toBe('hello world');
  });

  it('handles multiple ampersands', () => {
    expect(escapeXml('a&&b')).toBe('a&amp;&amp;b');
  });
});

// ─── jsonToXml ───────────────────────────────────────────────────────────────

describe('jsonToXml', () => {
  it('converts a simple object with default root', () => {
    const result = jsonToXml('{"name":"Alice"}');
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain('<root>');
    expect(result).toContain('</root>');
    expect(result).toContain('<name>Alice</name>');
  });

  it('uses custom root name', () => {
    const result = jsonToXml('{"a":"b"}', 'data');
    expect(result).toContain('<data>');
    expect(result).toContain('</data>');
  });

  it('converts nested objects', () => {
    const result = jsonToXml('{"person":{"name":"Bob"}}');
    expect(result).toContain('<person>');
    expect(result).toContain('<name>Bob</name>');
    expect(result).toContain('</person>');
  });

  it('converts arrays with repeated tags', () => {
    const result = jsonToXml('{"items":["a","b"]}');
    expect(result).toContain('<items>');
    // Each array item gets wrapped in <items>
    const itemsCount = (result.match(/<items>/g) || []).length;
    expect(itemsCount).toBeGreaterThanOrEqual(2);
  });

  it('escapes special characters in values', () => {
    const result = jsonToXml('{"text":"a&b<c>d"}');
    expect(result).toContain('a&amp;b&lt;c&gt;d');
  });

  it('handles null values as empty content', () => {
    const result = jsonToXml('{"key":null}');
    // null/undefined returns '' from toXml
    expect(result).toContain('<root>');
  });

  it('handles numeric values', () => {
    const result = jsonToXml('{"count":42}');
    expect(result).toContain('<count>42</count>');
  });

  it('handles boolean values', () => {
    const result = jsonToXml('{"active":true}');
    expect(result).toContain('<active>true</active>');
  });

  it('throws on invalid JSON', () => {
    expect(() => jsonToXml('not json')).toThrow();
  });

  it('handles empty object', () => {
    const result = jsonToXml('{}');
    expect(result).toContain('<root>');
    expect(result).toContain('</root>');
  });

  it('handles multiple top-level keys', () => {
    const result = jsonToXml('{"a":"1","b":"2"}');
    expect(result).toContain('<a>1</a>');
    expect(result).toContain('<b>2</b>');
  });
});

// ─── xmlToJson ───────────────────────────────────────────────────────────────

describe('xmlToJson', () => {
  it('parses a simple XML element', () => {
    const result = xmlToJson('<root><name>Alice</name></root>');
    const parsed = JSON.parse(result);
    expect(parsed.root.name).toBe('Alice');
  });

  it('returns empty object for non-matching XML', () => {
    const result = xmlToJson('no xml here');
    expect(result).toBe('{}');
  });

  it('parses nested XML', () => {
    const xml = '<root><person><name>Bob</name></person></root>';
    const parsed = JSON.parse(xmlToJson(xml));
    expect(parsed.root.person.name).toBe('Bob');
  });

  it('parses duplicate tags into array', () => {
    const xml = '<root><item>a</item><item>b</item></root>';
    const parsed = JSON.parse(xmlToJson(xml));
    expect(Array.isArray(parsed.root.item)).toBe(true);
    expect(parsed.root.item).toEqual(['a', 'b']);
  });

  it('handles XML with declaration', () => {
    const xml = '<?xml version="1.0"?><data><val>1</val></data>';
    const parsed = JSON.parse(xmlToJson(xml));
    // The regex should pick up <data> as root
    expect(parsed.data).toBeDefined();
    expect(parsed.data.val).toBe('1');
  });

  it('handles empty content element', () => {
    const xml = '<root><empty></empty></root>';
    const parsed = JSON.parse(xmlToJson(xml));
    expect(parsed.root.empty).toBeNull();
  });

  it('returns indented JSON (2 spaces)', () => {
    const result = xmlToJson('<root><a>1</a></root>');
    expect(result).toContain('  ');
  });

  it('handles multiple different children', () => {
    const xml = '<root><a>1</a><b>2</b></root>';
    const parsed = JSON.parse(xmlToJson(xml));
    expect(parsed.root.a).toBe('1');
    expect(parsed.root.b).toBe('2');
  });
});

// ─── formatXml ───────────────────────────────────────────────────────────────

describe('formatXml', () => {
  it('formats compact XML with default indent', () => {
    const result = formatXml('<root><a>1</a></root>');
    const lines = result.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('uses custom indent size', () => {
    const result = formatXml('<root><a>1</a></root>', 4);
    expect(result).toContain('    <a>1</a>');
  });

  it('indents nested tags', () => {
    const result = formatXml('<root><child><deep>val</deep></child></root>');
    const lines = result.split('\n');
    // root at level 0, child at level 1, deep at level 2
    expect(lines[0]).toBe('<root>');
    expect(lines[1]).toMatch(/^\s{2}<child>/);
  });

  it('handles self-closing tags without extra indent', () => {
    const result = formatXml('<root><item/></root>');
    expect(result).toContain('<item/>');
  });

  it('formats XML declaration', () => {
    const result = formatXml('<?xml version="1.0"?><root><a>1</a></root>');
    expect(result.startsWith('<?xml')).toBe(true);
  });

  it('handles already formatted XML', () => {
    const formatted = '<root>\n  <a>1</a>\n</root>';
    const result = formatXml(formatted);
    expect(result).toContain('<root>');
    expect(result).toContain('<a>1</a>');
    expect(result).toContain('</root>');
  });

  it('removes extra whitespace between tags', () => {
    const result = formatXml('<root>   <a>1</a>   </root>');
    const lines = result.split('\n');
    for (const line of lines) {
      expect(line).toBe(line.trimEnd()); // no trailing spaces expected in clean format
    }
  });

  it('handles closing tag indent decrease', () => {
    const result = formatXml('<root><a>1</a></root>');
    const lines = result.split('\n');
    const lastLine = lines[lines.length - 1];
    // closing </root> should be at level 0
    expect(lastLine).toBe('</root>');
  });
});

// ─── validateXml ─────────────────────────────────────────────────────────────

describe('validateXml', () => {
  it('returns valid for well-formed XML', () => {
    const result = validateXml('<root><a>1</a></root>');
    expect(result).toEqual({ valid: true });
  });

  it('returns valid for self-closing tags', () => {
    const result = validateXml('<root><br/></root>');
    expect(result).toEqual({ valid: true });
  });

  it('detects mismatched tags', () => {
    const result = validateXml('<root><a></b></root>');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Mismatched tag');
  });

  it('detects unclosed tags', () => {
    const result = validateXml('<root><a>');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unclosed tags');
  });

  it('validates nested structure', () => {
    const result = validateXml('<a><b><c></c></b></a>');
    expect(result).toEqual({ valid: true });
  });

  it('detects unclosed root tag', () => {
    const result = validateXml('<root>');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unclosed tags');
    expect(result.error).toContain('root');
  });

  it('validates empty document with single self-closing tag', () => {
    const result = validateXml('<empty/>');
    expect(result).toEqual({ valid: true });
  });

  it('returns valid for XML with text content', () => {
    const result = validateXml('<root>hello</root>');
    expect(result).toEqual({ valid: true });
  });

  it('returns valid for empty string (no tags to mismatch)', () => {
    const result = validateXml('');
    expect(result).toEqual({ valid: true });
  });
});

// ─── testXPath ───────────────────────────────────────────────────────────────

describe('testXPath', () => {
  it('finds matching tags with //tagname', () => {
    const xml = '<root><name>Alice</name><name>Bob</name></root>';
    const result = JSON.parse(testXPath(xml, '//name'));
    expect(result.matches).toEqual(['Alice', 'Bob']);
    expect(result.count).toBe(2);
  });

  it('returns empty matches for non-existent tag', () => {
    const xml = '<root><a>1</a></root>';
    const result = JSON.parse(testXPath(xml, '//missing'));
    expect(result.matches).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('returns error for unsupported xpath syntax', () => {
    const xml = '<root><a>1</a></root>';
    const result = JSON.parse(testXPath(xml, '/root/a'));
    // only //tagname is supported; /root/a won't match the regex
    expect(result.error).toBeDefined();
  });

  it('includes xpath in result', () => {
    const xml = '<root><a>1</a></root>';
    const result = JSON.parse(testXPath(xml, '//a'));
    expect(result.xpath).toBe('//a');
  });

  it('finds single match', () => {
    const xml = '<root><title>Hello</title></root>';
    const result = JSON.parse(testXPath(xml, '//title'));
    expect(result.matches).toEqual(['Hello']);
    expect(result.count).toBe(1);
  });

  it('finds tags in nested structure', () => {
    const xml = '<root><a><b>deep</b></a></root>';
    const result = JSON.parse(testXPath(xml, '//b'));
    expect(result.matches).toEqual(['deep']);
    expect(result.count).toBe(1);
  });

  it('returns formatted JSON string', () => {
    const xml = '<root><x>1</x></root>';
    const result = testXPath(xml, '//x');
    // Should be pretty-printed with indent 2
    expect(result).toContain('\n');
  });

  it('handles empty tag content', () => {
    const xml = '<root><a></a></root>';
    const result = JSON.parse(testXPath(xml, '//a'));
    expect(result.matches).toEqual(['']);
    expect(result.count).toBe(1);
  });
});

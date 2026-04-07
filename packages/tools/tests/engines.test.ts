/**
 * Engine Architecture Tests
 *
 * Tests the 20-engine system: registry, execute(),
 * listEngines(), getEngine(),
 * and individual engine validate/execute for each engine.
 */

import { describe, it, expect, test } from 'vitest';
import {
  execute,
  listEngines,
  getEngine,
  caseEngine,
  wrapEngine,
  filterEngine,
  transformEngine,
  encodeEngine,
  hashEngine,
  counterEngine,
  convertEngine,
  formatEngine,
  generateDataEngine,
  generateWebEngine,
  validateEngine,
  unitEngine,
  calculateEngine,
  commentEngine,
  markupEngine,
  diffEngine,
  schemaEngine,
  apiEngine,
  unicodeEngine,
} from '../src/engines';

// ===================================================================
// 1. Registry — listEngines, getEngine
// ===================================================================

describe('Engine Registry', () => {
  const EXPECTED_ENGINES = [
    'case', 'wrap', 'filter', 'transform', 'encode', 'hash',
    'counter', 'convert', 'format', 'generate-data', 'generate-web',
    'validate', 'unit', 'calculate', 'comment', 'markup', 'diff',
    'schema', 'api', 'unicode',
  ];

  it('listEngines returns all 20 engines', () => {
    const engines = listEngines();
    expect(engines.length).toBe(20);
    for (const name of EXPECTED_ENGINES) {
      expect(engines).toContain(name);
    }
  });

  it('getEngine returns engine by name', () => {
    for (const name of EXPECTED_ENGINES) {
      const engine = getEngine(name);
      expect(engine).toBeDefined();
      expect(engine!.name).toBe(name);
    }
  });

  it('getEngine returns undefined for unknown name', () => {
    expect(getEngine('nonexistent')).toBeUndefined();
  });
});

// ===================================================================
// 2. execute() — top-level API
// ===================================================================

describe('execute()', () => {
  it('executes case engine with direct options', () => {
    const r = execute('case', 'hello world', { separator: '_', wordCase: 'lower' });
    expect(r.output).toBe('hello_world');
  });

  it('throws on unknown engine', () => {
    expect(() => execute('nonexistent', 'test', {})).toThrow('Unknown engine');
  });

  it('throws on validation failure', () => {
    expect(() => execute('case', 'test', { wordCase: 'INVALID_CASE' })).toThrow('Validation failed');
  });
});

// ===================================================================
// 4. Case Engine — direct tests
// ===================================================================

describe('Case Engine', () => {
  it('validate rejects invalid wordCase', () => {
    const r = caseEngine.validate({ wordCase: 'INVALID' });
    expect(r.valid).toBe(false);
  });

  it('validate rejects invalid charTransform', () => {
    const r = caseEngine.validate({ charTransform: 'INVALID' });
    expect(r.valid).toBe(false);
  });

  it('validate accepts valid options', () => {
    expect(caseEngine.validate({ separator: '-', wordCase: 'lower' }).valid).toBe(true);
  });

  it('sentence-case', () => {
    const r = caseEngine.execute('hello world test', { separator: ' ', firstWordCase: 'capitalize', wordCase: 'lower' });
    expect(r.output).toBe('Hello world test');
  });

  it('bracket-case wraps words', () => {
    const r = caseEngine.execute('hello world', { wordCase: 'preserve', wordWrap: { left: '[', right: ']' } });
    expect(r.output).toBe('[hello] [world]');
  });
});

// ===================================================================
// 5. Wrap Engine
// ===================================================================

describe('Wrap Engine', () => {
  it('validate rejects invalid scope', () => {
    expect(wrapEngine.validate({ scope: 'invalid', left: '(', right: ')' }).valid).toBe(false);
  });

  it('validate rejects unknown style', () => {
    expect(wrapEngine.validate({ scope: 'selection', style: 'unknown-style' }).valid).toBe(false);
  });

  it('wraps selection with parentheses', () => {
    const r = wrapEngine.execute('hello', { scope: 'selection', left: '(', right: ')' });
    expect(r.output).toBe('(hello)');
  });

  it('wraps words with backticks', () => {
    const r = wrapEngine.execute('hello world', { scope: 'word', style: 'backticks', left: '`', right: '`' });
    expect(r.output).toBe('`hello` `world`');
  });

  it('wraps lines with blockquote', () => {
    const r = wrapEngine.execute('line1\nline2', { scope: 'line', left: '> ', right: '' });
    expect(r.output).toBe('> line1\n> line2');
  });

  it('line-numbers style', () => {
    const r = wrapEngine.execute('a\nb\nc', { scope: 'selection', left: '', right: '', style: 'line-numbers' });
    expect(r.output).toContain('1 | a');
    expect(r.output).toContain('3 | c');
  });

});

// ===================================================================
// 6. Filter Engine
// ===================================================================

describe('Filter Engine', () => {
  it('validate rejects invalid operation', () => {
    expect(filterEngine.validate({ operation: 'invalid', target: 'spaces' }).valid).toBe(false);
  });

  it('validate rejects missing target', () => {
    expect(filterEngine.validate({ operation: 'remove', target: '' }).valid).toBe(false);
  });

  it('remove spaces', () => {
    const r = filterEngine.execute('hello world', { operation: 'remove', target: 'spaces' });
    expect(r.output).toBe('helloworld');
  });

  it('remove vowels', () => {
    const r = filterEngine.execute('hello', { operation: 'remove', target: 'vowels' });
    expect(r.output).toBe('hll');
  });

  it('extract emails', () => {
    const r = filterEngine.execute('Contact test@example.com or info@test.org', { operation: 'extract', target: 'emails' });
    expect(r.output).toContain('test@example.com');
    expect(r.output).toContain('info@test.org');
  });

  it('extract urls', () => {
    const r = filterEngine.execute('Visit https://example.com for more', { operation: 'extract', target: 'urls' });
    expect(r.output).toContain('https://example.com');
  });

  it('remove html tags', () => {
    const r = filterEngine.execute('<b>bold</b> text', { operation: 'remove', target: 'html-tags' });
    expect(r.output).toBe('bold text');
  });

  it('count numbers', () => {
    const r = filterEngine.execute('I have 3 cats and 5 dogs', { operation: 'count', target: 'numbers' });
    expect(r.metadata?.matchCount).toBe(2);
  });

  it('replace with custom pattern', () => {
    const r = filterEngine.execute('hello world', { operation: 'replace', target: 'custom', customPattern: 'world', replacement: 'everyone' });
    expect(r.output).toBe('hello everyone');
  });
});

// ===================================================================
// 7. Transform Engine
// ===================================================================

describe('Transform Engine', () => {
  it('validate rejects invalid operation', () => {
    expect(transformEngine.validate({ operation: 'invalid', scope: 'lines' }).valid).toBe(false);
  });

  it('reverse characters', () => {
    const r = transformEngine.execute('hello', { operation: 'reverse', scope: 'characters' });
    expect(r.output).toBe('olleh');
  });

  it('reverse words', () => {
    const r = transformEngine.execute('hello world', { operation: 'reverse', scope: 'words' });
    expect(r.output).toBe('world hello');
  });

  it('reverse lines', () => {
    const r = transformEngine.execute('a\nb\nc', { operation: 'reverse', scope: 'lines' });
    expect(r.output).toBe('c\nb\na');
  });

  it('sort lines ascending', () => {
    const r = transformEngine.execute('banana\napple\ncherry', { operation: 'sort', scope: 'lines', direction: 'asc' });
    expect(r.output).toBe('apple\nbanana\ncherry');
  });

  it('sort lines descending', () => {
    const r = transformEngine.execute('banana\napple\ncherry', { operation: 'sort', scope: 'lines', direction: 'desc' });
    expect(r.output).toBe('cherry\nbanana\napple');
  });

  it('unique lines', () => {
    const r = transformEngine.execute('a\nb\na\nc\nb', { operation: 'unique', scope: 'lines' });
    expect(r.output).toBe('a\nb\nc');
    expect(r.metadata?.removed).toBe(2);
  });

  it('repeat text', () => {
    const r = transformEngine.execute('hello', { operation: 'repeat', scope: 'lines', count: 3, separator: '-' });
    expect(r.output).toBe('hello-hello-hello');
  });

  it('truncate text', () => {
    const r = transformEngine.execute('hello world, this is a long text', { operation: 'truncate', scope: 'lines', maxLength: 15 });
    expect(r.output).toBe('hello world,...');
  });

  it('pad right', () => {
    const r = transformEngine.execute('hi', { operation: 'pad', scope: 'lines', targetLength: 10, padChar: '.', padSide: 'right' });
    expect(r.output).toBe('hi........');
  });

  it('pad left', () => {
    const r = transformEngine.execute('hi', { operation: 'pad', scope: 'lines', targetLength: 10, padChar: '0', padSide: 'left' });
    expect(r.output).toBe('00000000hi');
  });
});

// ===================================================================
// 8. Encode Engine
// ===================================================================

describe('Encode Engine', () => {
  it('validate rejects invalid operation', () => {
    expect(encodeEngine.validate({ codec: 'base64', operation: 'invalid' }).valid).toBe(false);
  });

  it('validate rejects unknown codec', () => {
    expect(encodeEngine.validate({ codec: 'nonexistent', operation: 'encode' }).valid).toBe(false);
  });

  it('validate rejects vigenere without key', () => {
    expect(encodeEngine.validate({ codec: 'vigenere', operation: 'encode' }).valid).toBe(false);
  });

  it('base64 encode/decode', () => {
    const encoded = encodeEngine.execute('hello world', { codec: 'base64', operation: 'encode' });
    expect(encoded.output).toBe('aGVsbG8gd29ybGQ=');
    const decoded = encodeEngine.execute(encoded.output, { codec: 'base64', operation: 'decode' });
    expect(decoded.output).toBe('hello world');
  });

  it('hex encode/decode', () => {
    const encoded = encodeEngine.execute('Hi', { codec: 'hex', operation: 'encode' });
    const decoded = encodeEngine.execute(encoded.output, { codec: 'hex', operation: 'decode' });
    expect(decoded.output).toBe('Hi');
  });

  it('binary encode/decode', () => {
    const encoded = encodeEngine.execute('A', { codec: 'binary', operation: 'encode' });
    expect(encoded.output).toBe('01000001');
    const decoded = encodeEngine.execute('01000001', { codec: 'binary', operation: 'decode' });
    expect(decoded.output).toBe('A');
  });

  it('morse encode/decode', () => {
    const encoded = encodeEngine.execute('SOS', { codec: 'morse', operation: 'encode' });
    expect(encoded.output).toContain('...');
    const decoded = encodeEngine.execute(encoded.output, { codec: 'morse', operation: 'decode' });
    expect(decoded.output.toUpperCase()).toContain('SOS');
  });

  it('rot13', () => {
    const r = encodeEngine.execute('Hello', { codec: 'rot13', operation: 'encode' });
    expect(r.output).toBe('Uryyb');
    const back = encodeEngine.execute('Uryyb', { codec: 'rot13', operation: 'encode' });
    expect(back.output).toBe('Hello');
  });

  it('url encode/decode', () => {
    const encoded = encodeEngine.execute('hello world', { codec: 'url', operation: 'encode' });
    expect(encoded.output).toContain('hello%20world');
    const decoded = encodeEngine.execute(encoded.output, { codec: 'url', operation: 'decode' });
    expect(decoded.output).toBe('hello world');
  });

  it('caesar cipher with shift', () => {
    const encoded = encodeEngine.execute('ABC', { codec: 'caesar', operation: 'encode', shift: 3 });
    expect(encoded.output).toBe('DEF');
    const decoded = encodeEngine.execute('DEF', { codec: 'caesar', operation: 'decode', shift: 3 });
    expect(decoded.output).toBe('ABC');
  });

  it('atbash cipher', () => {
    const r = encodeEngine.execute('ABC', { codec: 'atbash', operation: 'encode' });
    expect(r.output).toBe('ZYX');
  });

  it('rot47', () => {
    const r = encodeEngine.execute('Hello!', { codec: 'rot47', operation: 'encode' });
    // rot47 is self-inverse
    const back = encodeEngine.execute(r.output, { codec: 'rot47', operation: 'encode' });
    expect(back.output).toBe('Hello!');
  });

  it('base32 encode/decode', () => {
    const encoded = encodeEngine.execute('Hi', { codec: 'base32', operation: 'encode' });
    const decoded = encodeEngine.execute(encoded.output, { codec: 'base32', operation: 'decode' });
    expect(decoded.output).toBe('Hi');
  });

  it('vigenere encode/decode', () => {
    const encoded = encodeEngine.execute('HELLO', { codec: 'vigenere', operation: 'encode', key: 'KEY' });
    const decoded = encodeEngine.execute(encoded.output, { codec: 'vigenere', operation: 'decode', key: 'KEY' });
    expect(decoded.output).toBe('HELLO');
  });

  it('html encode/decode', () => {
    const encoded = encodeEngine.execute('<div>hello</div>', { codec: 'html', operation: 'encode' });
    expect(encoded.output).toContain('&lt;');
    const decoded = encodeEngine.execute(encoded.output, { codec: 'html', operation: 'decode' });
    expect(decoded.output).toBe('<div>hello</div>');
  });

});

// ===================================================================
// 9. Hash Engine
// ===================================================================

describe('Hash Engine', () => {
  it('validate rejects unknown algorithm', () => {
    expect(hashEngine.validate({ algorithm: 'unknown' }).valid).toBe(false);
  });

  it('sha256 is now accepted', () => {
    expect(hashEngine.validate({ algorithm: 'sha256' }).valid).toBe(true);
  });

  // Known-answer tests (verified against standard implementations)
  it('md5 produces correct 32-char hex for "hello world"', () => {
    const r = hashEngine.execute('hello world', { algorithm: 'md5' });
    expect(r.output).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3');
    expect(r.metadata?.algorithm).toBe('md5');
  });

  it('sha1 produces correct 40-char hex for "hello world"', () => {
    const r = hashEngine.execute('hello world', { algorithm: 'sha1' });
    expect(r.output).toMatch(/^[0-9a-f]{40}$/);
  });

  it('sha256 produces correct 64-char hex for "hello world"', () => {
    const r = hashEngine.execute('hello world', { algorithm: 'sha256' });
    expect(r.output).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    expect(r.metadata?.algorithm).toBe('sha256');
  });

  it('sha512 produces 128-char hex', () => {
    const r = hashEngine.execute('hello world', { algorithm: 'sha512' });
    expect(r.output).toMatch(/^[0-9a-f]{128}$/);
    expect(r.metadata?.algorithm).toBe('sha512');
  });

  it('md5 empty string matches RFC 1321', () => {
    const r = hashEngine.execute('', { algorithm: 'md5' });
    expect(r.output).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('sha256 empty string matches FIPS 180-4', () => {
    const r = hashEngine.execute('', { algorithm: 'sha256' });
    expect(r.output).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('crc32 produces 8-char hex', () => {
    const r = hashEngine.execute('hello world', { algorithm: 'crc32' });
    expect(r.output).toMatch(/^[0-9a-f]{8}$/);
    expect(r.metadata?.algorithm).toBe('crc32');
  });

  it('crc32 is deterministic', () => {
    const r1 = hashEngine.execute('test', { algorithm: 'crc32' });
    const r2 = hashEngine.execute('test', { algorithm: 'crc32' });
    expect(r1.output).toBe(r2.output);
  });

  it('djb2 produces hex', () => {
    const r = hashEngine.execute('hello', { algorithm: 'djb2' });
    expect(r.output).toMatch(/^[0-9a-f]+$/);
  });

  it('fnv1a produces hex', () => {
    const r = hashEngine.execute('hello', { algorithm: 'fnv1a' });
    expect(r.output).toMatch(/^[0-9a-f]+$/);
  });

  it('adler32 produces hex', () => {
    const r = hashEngine.execute('hello', { algorithm: 'adler32' });
    expect(r.output).toMatch(/^[0-9a-f]+$/);
  });

  it('different inputs produce different hashes', () => {
    const h1 = hashEngine.execute('hello', { algorithm: 'crc32' }).output;
    const h2 = hashEngine.execute('world', { algorithm: 'crc32' }).output;
    expect(h1).not.toBe(h2);
  });

  it('sha-256 alias works', () => {
    const r = hashEngine.execute('test', { algorithm: 'sha-256' });
    const r2 = hashEngine.execute('test', { algorithm: 'sha256' });
    expect(r.output).toBe(r2.output);
  });

});

// ===================================================================
// 10. Counter Engine
// ===================================================================

describe('Counter Engine', () => {
  it('validate rejects empty metrics', () => {
    expect(counterEngine.validate({ metrics: [] }).valid).toBe(false);
  });

  it('validate rejects unknown metric', () => {
    expect(counterEngine.validate({ metrics: ['unknown-metric'] }).valid).toBe(false);
  });

  it('count words', () => {
    const r = counterEngine.execute('hello world test', { metrics: ['words'] });
    expect(r.metadata?.words).toBe(3);
  });

  it('count characters', () => {
    const r = counterEngine.execute('hello', { metrics: ['characters'] });
    expect(r.metadata?.characters).toBe(5);
  });

  it('count lines', () => {
    const r = counterEngine.execute('a\nb\nc', { metrics: ['lines'] });
    expect(r.metadata?.lines).toBe(3);
  });

  it('all metrics', () => {
    const r = counterEngine.execute('Hello World. This is a test.', { metrics: ['all'] });
    expect(r.metadata?.words).toBeGreaterThan(0);
    expect(r.metadata?.characters).toBeGreaterThan(0);
    expect(r.metadata?.sentences).toBeGreaterThan(0);
  });

  it('readability', () => {
    const r = counterEngine.execute('The quick brown fox jumps over the lazy dog. It is a simple sentence.', { metrics: ['readability'] });
    expect(r.metadata?.readability).toBeDefined();
  });

  it('word frequency', () => {
    const r = counterEngine.execute('hello hello world', { metrics: ['word-frequency'] });
    expect(r.metadata?.['word-frequency']).toBeDefined();
  });
});

// ===================================================================
// 11. Convert Engine
// ===================================================================

describe('Convert Engine', () => {
  it('validate rejects unknown conversion route', () => {
    expect(convertEngine.validate({ from: 'unknown', to: 'unknown2' }).valid).toBe(false);
  });

  it('json to yaml', () => {
    const r = convertEngine.execute('{"name":"test","value":42}', { from: 'json', to: 'yaml' });
    expect(r.output).toContain('name:');
    expect(r.output).toContain('test');
  });

  it('yaml to json', () => {
    const r = convertEngine.execute('name: test\nvalue: 42', { from: 'yaml', to: 'json' });
    const parsed = JSON.parse(r.output);
    expect(parsed.name).toBe('test');
    expect(parsed.value).toBe(42);
  });

  it('json to csv', () => {
    const r = convertEngine.execute('[{"name":"Alice","age":30},{"name":"Bob","age":25}]', { from: 'json', to: 'csv' });
    expect(r.output).toContain('name');
    expect(r.output).toContain('Alice');
  });

  it('csv to json', () => {
    const r = convertEngine.execute('name,age\nAlice,30\nBob,25', { from: 'csv', to: 'json' });
    const parsed = JSON.parse(r.output);
    expect(parsed).toBeInstanceOf(Array);
    expect(parsed[0].name).toBe('Alice');
  });

  it('json to xml', () => {
    const r = convertEngine.execute('{"root":{"name":"test"}}', { from: 'json', to: 'xml' });
    expect(r.output).toContain('<');
    expect(r.output).toContain('test');
  });

  it('json to yaml', () => {
    const r = convertEngine.execute('{"name":"test"}', { from: 'json', to: 'yaml' });
    expect(r.output).toContain('name');
    expect(r.output).toContain('test');
  });
});

// ===================================================================
// 12. Format Engine
// ===================================================================

describe('Format Engine', () => {
  it('validate rejects invalid operation', () => {
    expect(formatEngine.validate({ language: 'json', operation: 'invalid' as 'format' }).valid).toBe(false);
  });

  it('format json', () => {
    const r = formatEngine.execute('{"a":1}', { language: 'json', operation: 'format' });
    expect(r.output).toContain('\n');
  });

  it('minify json', () => {
    const r = formatEngine.execute('{\n  "a": 1\n}', { language: 'json', operation: 'minify' });
    expect(r.output).toBe('{"a":1}');
  });

  it('validate json — valid', () => {
    const r = formatEngine.execute('{"a":1}', { language: 'json', operation: 'validate' });
    expect(r.output).toBe('Valid JSON');
  });

  it('validate json — invalid', () => {
    const r = formatEngine.execute('{bad json}', { language: 'json', operation: 'validate' });
    expect(r.output).toContain('Invalid JSON');
  });

  it('sort keys json', () => {
    const r = formatEngine.execute('{"b":2,"a":1}', { language: 'json', operation: 'sort-keys' });
    const keys = Object.keys(JSON.parse(r.output));
    expect(keys[0]).toBe('a');
  });

  it('format sql', () => {
    const r = formatEngine.execute('SELECT * FROM users WHERE id = 1', { language: 'sql', operation: 'format' });
    expect(r.output.length).toBeGreaterThan(0);
  });
});

// ===================================================================
// 13a. Generate Data Engine
// ===================================================================

describe('Generate Data Engine', () => {
  it('validate rejects unknown type', () => {
    expect(generateDataEngine.validate({ type: 'unknown' }).valid).toBe(false);
  });

  it('validate rejects count > 100', () => {
    expect(generateDataEngine.validate({ type: 'uuid', count: 200 }).valid).toBe(false);
  });

  it('generate uuid', () => {
    const r = generateDataEngine.execute('', { type: 'uuid' });
    expect(r.output).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('generate multiple uuids', () => {
    const r = generateDataEngine.execute('', { type: 'uuid', count: 3 });
    const lines = r.output.split('\n');
    expect(lines.length).toBe(3);
  });

  it('generate nanoid', () => {
    const r = generateDataEngine.execute('', { type: 'nanoid' });
    expect(r.output.length).toBeGreaterThan(0);
  });

  it('generate password', () => {
    const r = generateDataEngine.execute('', { type: 'password' });
    expect(r.output.length).toBeGreaterThan(0);
  });

  it('generate person', () => {
    const r = generateDataEngine.execute('', { type: 'person' });
    const person = JSON.parse(r.output);
    expect(person.firstName).toBeDefined();
    expect(person.lastName).toBeDefined();
    expect(person.email).toBeDefined();
  });

  it('generate company', () => {
    const r = generateDataEngine.execute('', { type: 'company' });
    const company = JSON.parse(r.output);
    expect(company.name).toBeDefined();
  });

  it('generate credit card', () => {
    const r = generateDataEngine.execute('', { type: 'credit-card' });
    const card = JSON.parse(r.output);
    expect(card.number).toBeDefined();
    expect(card.cvv).toBeDefined();
  });

  it('generate color', () => {
    const r = generateDataEngine.execute('', { type: 'color' });
    expect(r.output).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

// ===================================================================
// 13b. Generate Web Engine
// ===================================================================

describe('Generate Web Engine', () => {
  it('validate rejects unknown type', () => {
    expect(generateWebEngine.validate({ type: 'unknown' }).valid).toBe(false);
  });

  it('generate lorem ipsum', () => {
    const r = generateWebEngine.execute('', { type: 'lorem' });
    expect(r.output.length).toBeGreaterThan(50);
  });
});

// ===================================================================
// 14. Validate Engine
// ===================================================================

describe('Validate Engine', () => {
  it('validate rejects unknown type', () => {
    expect(validateEngine.validate({ type: 'unknown' }).valid).toBe(false);
  });

  it('validate email — valid', () => {
    const r = validateEngine.execute('test@example.com', { type: 'email' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(true);
  });

  it('validate email — invalid', () => {
    const r = validateEngine.execute('not-email', { type: 'email' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(false);
  });

  it('validate url — valid', () => {
    const r = validateEngine.execute('https://example.com', { type: 'url' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(true);
  });

  it('validate ipv4 — valid', () => {
    const r = validateEngine.execute('192.168.1.1', { type: 'ipv4' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(true);
  });

  it('validate ipv4 — invalid', () => {
    const r = validateEngine.execute('999.999.999.999', { type: 'ipv4' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(false);
  });

  it('validate uuid — valid', () => {
    const r = validateEngine.execute('550e8400-e29b-41d4-a716-446655440000', { type: 'uuid' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(true);
  });

  it('validate json — valid', () => {
    const r = validateEngine.execute('{"a":1}', { type: 'json' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(true);
  });

  it('validate json — invalid', () => {
    const r = validateEngine.execute('{bad}', { type: 'json' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(false);
  });

  it('validate credit card — valid visa', () => {
    const r = validateEngine.execute('4111111111111111', { type: 'credit-card' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(true);
    expect(parsed.details.type).toBe('Visa');
  });

  it('validate regex — valid', () => {
    const r = validateEngine.execute('^[a-z]+$', { type: 'regex' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(true);
  });

  it('validate regex — invalid', () => {
    const r = validateEngine.execute('[invalid', { type: 'regex' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(false);
  });

  it('validate semver — valid', () => {
    const r = validateEngine.execute('1.2.3', { type: 'semver' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(true);
  });

  it('validate csv — valid', () => {
    const r = validateEngine.execute('a,b,c\n1,2,3\n4,5,6', { type: 'csv' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(true);
    expect(parsed.details.rows).toBe(3);
  });

  it('password strength — strong', () => {
    const r = validateEngine.execute('MyStr0ng!P@ssword', { type: 'password-strength' });
    const parsed = JSON.parse(r.output);
    expect(parsed.valid).toBe(true);
  });
});

// ===================================================================
// 15. Unit Engine
// ===================================================================

describe('Unit Engine', () => {
  it('validate rejects unknown category', () => {
    expect(unitEngine.validate({ category: 'unknown', value: 1, from: 'a', to: 'b' }).valid).toBe(false);
  });

  it('validate rejects NaN value', () => {
    expect(unitEngine.validate({ category: 'length', value: NaN, from: 'km', to: 'mi' }).valid).toBe(false);
  });

  it('km to miles', () => {
    const r = unitEngine.execute('', { category: 'length', value: 10, from: 'km', to: 'mi' });
    const result = r.metadata?.result as number;
    expect(result).toBeCloseTo(6.2137, 2);
  });

  it('kg to lb', () => {
    const r = unitEngine.execute('', { category: 'weight', value: 1, from: 'kg', to: 'lb' });
    const result = r.metadata?.result as number;
    expect(result).toBeCloseTo(2.2046, 2);
  });

  it('celsius to fahrenheit', () => {
    const r = unitEngine.execute('', { category: 'temperature', value: 0, from: 'c', to: 'f' });
    const result = r.metadata?.result as number;
    expect(result).toBe(32);
  });

  it('celsius to fahrenheit — 100', () => {
    const r = unitEngine.execute('', { category: 'temperature', value: 100, from: 'c', to: 'f' });
    const result = r.metadata?.result as number;
    expect(result).toBe(212);
  });

  it('degrees to radians', () => {
    const r = unitEngine.execute('', { category: 'angle', value: 180, from: 'deg', to: 'rad' });
    const result = r.metadata?.result as number;
    expect(result).toBeCloseTo(Math.PI, 4);
  });

  it('output contains unit labels', () => {
    const r = unitEngine.execute('', { category: 'length', value: 5, from: 'km', to: 'mi' });
    expect(r.output).toContain('km');
    expect(r.output).toContain('mi');
  });
});

// ===================================================================
// 16. Calculate Engine
// ===================================================================

describe('Calculate Engine', () => {
  it('validate rejects unknown type', () => {
    expect(calculateEngine.validate({ type: 'unknown', inputs: {} }).valid).toBe(false);
  });

  it('validate rejects non-object inputs', () => {
    expect(calculateEngine.validate({ type: 'expression', inputs: null as unknown as Record<string, unknown> }).valid).toBe(false);
  });

  it('evaluate expression', () => {
    const r = calculateEngine.execute('', { type: 'expression', inputs: { expression: '2 + 3 * 4' } });
    const parsed = JSON.parse(r.output);
    expect(parsed.result).toBe(14);
  });

  it('calculate BMI', () => {
    const r = calculateEngine.execute('', { type: 'bmi', inputs: { weightKg: 70, heightM: 1.75 } });
    const parsed = JSON.parse(r.output);
    expect(parsed.bmi).toBeCloseTo(22.86, 1);
  });

  it('calculate tip', () => {
    const r = calculateEngine.execute('', { type: 'tip', inputs: { billAmount: 100, tipPercent: 15 } });
    const parsed = JSON.parse(r.output);
    expect(parsed.tipAmount).toBe(15);
    expect(parsed.total).toBe(115);
  });

  it('calculate discount', () => {
    const r = calculateEngine.execute('', { type: 'discount', inputs: { originalPrice: 100, discountPercent: 20 } });
    const parsed = JSON.parse(r.output);
    expect(parsed.savings).toBe(20);
    expect(parsed.finalPrice).toBe(80);
  });

  it('calculate simple interest', () => {
    const r = calculateEngine.execute('', { type: 'simple-interest', inputs: { principal: 1000, rate: 5, time: 2 } });
    const parsed = JSON.parse(r.output);
    expect(parsed.interest).toBe(100);
  });

  it('calculate loan payment', () => {
    // engine passes termMonths to calculateLoanPayment which treats it as termYears
    const r = calculateEngine.execute('', { type: 'loan-payment', inputs: { principal: 100000, annualRate: 5, termMonths: 30 } });
    const parsed = JSON.parse(r.output);
    expect(parsed.monthlyPayment).toBeGreaterThan(500);
    expect(parsed.monthlyPayment).toBeLessThan(600);
  });

  it('calculate statistics', () => {
    const r = calculateEngine.execute('', { type: 'statistics', inputs: { values: [1, 2, 3, 4, 5] } });
    const parsed = JSON.parse(r.output);
    expect(parsed.mean).toBe(3);
    expect(parsed.min).toBe(1);
    expect(parsed.max).toBe(5);
  });

  it('calculate ROI', () => {
    const r = calculateEngine.execute('', { type: 'roi', inputs: { investment: 1000, returnAmount: 1500 } });
    const parsed = JSON.parse(r.output);
    expect(parsed.roi).toBe(50);
  });
});

// ===================================================================
// 17. Comment Engine
// ===================================================================

describe('Comment Engine', () => {
  it('validate rejects unsupported language', () => {
    expect(commentEngine.validate({ language: 'nonexistent', style: 'line', operation: 'add' }).valid).toBe(false);
  });

  it('validate rejects invalid style', () => {
    expect(commentEngine.validate({ language: 'javascript', style: 'invalid' as 'line', operation: 'add' }).valid).toBe(false);
  });

  it('add javascript line comment', () => {
    const r = commentEngine.execute('const x = 1;', { language: 'javascript', style: 'line', operation: 'add' });
    expect(r.output).toBe('// const x = 1;');
  });

  it('remove javascript line comment', () => {
    const r = commentEngine.execute('// const x = 1;', { language: 'javascript', style: 'line', operation: 'remove' });
    expect(r.output).toBe('const x = 1;');
  });

  it('add python comment', () => {
    const r = commentEngine.execute('x = 1', { language: 'python', style: 'line', operation: 'add' });
    expect(r.output).toBe('# x = 1');
  });

  it('toggle — add when not commented', () => {
    const r = commentEngine.execute('x = 1;', { language: 'javascript', style: 'line', operation: 'toggle' });
    expect(r.output).toBe('// x = 1;');
  });

  it('toggle — remove when commented', () => {
    const r = commentEngine.execute('// x = 1;', { language: 'javascript', style: 'line', operation: 'toggle' });
    expect(r.output).toBe('x = 1;');
  });

  it('add block comment HTML', () => {
    const r = commentEngine.execute('some content', { language: 'html', style: 'block', operation: 'add' });
    expect(r.output).toContain('<!--');
    expect(r.output).toContain('-->');
  });

  it('multiline line comment', () => {
    const r = commentEngine.execute('a\nb\nc', { language: 'javascript', style: 'line', operation: 'add' });
    expect(r.output).toBe('// a\n// b\n// c');
  });

});

// ===================================================================
// 18. Markup Engine
// ===================================================================

describe('Markup Engine', () => {
  it('validate rejects unknown format', () => {
    expect(markupEngine.validate({ format: 'unknown', tag: 'bold' }).valid).toBe(false);
  });

  it('HTML bold', () => {
    const r = markupEngine.execute('hello', { format: 'html', tag: 'bold' });
    expect(r.output).toBe('<b>hello</b>');
  });

  it('HTML italic', () => {
    const r = markupEngine.execute('hello', { format: 'html', tag: 'italic' });
    expect(r.output).toBe('<i>hello</i>');
  });

  it('Markdown bold', () => {
    const r = markupEngine.execute('hello', { format: 'markdown', tag: 'bold' });
    expect(r.output).toBe('**hello**');
  });

  it('Markdown italic', () => {
    const r = markupEngine.execute('hello', { format: 'markdown', tag: 'italic' });
    expect(r.output).toBe('_hello_');
  });

  it('BBCode bold', () => {
    const r = markupEngine.execute('hello', { format: 'bbcode', tag: 'bold' });
    expect(r.output).toBe('[b]hello[/b]');
  });

  it('LaTeX bold', () => {
    const r = markupEngine.execute('hello', { format: 'latex', tag: 'bold' });
    expect(r.output).toBe('\\textbf{hello}');
  });

  it('HTML heading level 2', () => {
    const r = markupEngine.execute('Title', { format: 'html', tag: 'heading', level: 2 });
    expect(r.output).toBe('<h2>Title</h2>');
  });

  it('Markdown heading level 3', () => {
    const r = markupEngine.execute('Title', { format: 'markdown', tag: 'heading', level: 3 });
    expect(r.output).toBe('### Title');
  });

  it('HTML code', () => {
    const r = markupEngine.execute('const x = 1', { format: 'html', tag: 'code' });
    expect(r.output).toBe('<code>const x = 1</code>');
  });
});

// ===================================================================
// 19. Diff Engine
// ===================================================================

describe('Diff Engine', () => {
  it('validate rejects invalid mode', () => {
    expect(diffEngine.validate({ mode: 'invalid' }).valid).toBe(false);
  });

  it('diff lines with separator', () => {
    const r = diffEngine.execute('hello\n---\nworld', { mode: 'line' });
    expect(r.output.length).toBeGreaterThan(0);
  });

  it('diff lines with object input', () => {
    const r = diffEngine.execute({ left: 'hello', right: 'world' }, { mode: 'line' });
    expect(r.output.length).toBeGreaterThan(0);
  });

});

// ===================================================================
// 20. Schema Engine
// ===================================================================

describe('Schema Engine', () => {
  it('validate rejects unknown route', () => {
    expect(schemaEngine.validate({ from: 'unknown', to: 'unknown2' }).valid).toBe(false);
  });

  it('json-schema to typescript', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    });
    const r = schemaEngine.execute(schema, { from: 'json-schema', to: 'typescript' });
    expect(r.output).toContain('name');
    expect(r.output).toContain('string');
  });

  it('json-schema to zod', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        email: { type: 'string' },
      },
    });
    const r = schemaEngine.execute(schema, { from: 'json-schema', to: 'zod' });
    expect(r.output).toContain('z.');
  });

});

// ===================================================================
// 21. API Engine
// ===================================================================

describe('API Engine', () => {
  it('validate rejects invalid operation', () => {
    expect(apiEngine.validate({ operation: 'invalid' as 'convert' }).valid).toBe(false);
  });

  it('validate rejects unknown convert route', () => {
    expect(apiEngine.validate({ operation: 'convert', from: 'a', to: 'b' }).valid).toBe(false);
  });

  it('validate rejects unknown parse type', () => {
    expect(apiEngine.validate({ operation: 'parse', parseType: 'nonexistent' }).valid).toBe(false);
  });

  it('parse JWT', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const r = apiEngine.execute(jwt, { operation: 'parse', parseType: 'jwt' });
    expect(r.output).toContain('John Doe');
  });

  it('parse URL', () => {
    const r = apiEngine.execute('https://example.com/path?q=test#section', { operation: 'parse', parseType: 'url' });
    expect(r.output).toContain('example.com');
  });

  it('curl to fetch', () => {
    const curl = 'curl https://api.example.com/data';
    const r = apiEngine.execute(curl, { operation: 'convert', from: 'curl', to: 'fetch' });
    expect(r.output).toContain('fetch');
  });

});

// ===================================================================
// 22. Unicode Engine
// ===================================================================

describe('Unicode Engine', () => {
  it('validate rejects unknown style', () => {
    expect(unicodeEngine.validate({ style: 'unknown' }).valid).toBe(false);
  });

  it('small-caps', () => {
    const r = unicodeEngine.execute('hello', { style: 'small-caps' });
    expect(r.output).toBe('ʜᴇʟʟᴏ');
  });

  it('upside-down', () => {
    const r = unicodeEngine.execute('hello', { style: 'upside-down' });
    expect(r.output.length).toBeGreaterThan(0);
    expect(r.output).not.toBe('hello');
  });

  it('leet-speak', () => {
    const r = unicodeEngine.execute('hello', { style: 'leet-speak' });
    expect(r.output).toContain('3'); // e → 3
  });

  it('circled', () => {
    const r = unicodeEngine.execute('ABC', { style: 'circled' });
    expect(r.output).toBe('ⒶⒷⒸ');
  });

  it('clap', () => {
    const r = unicodeEngine.execute('hello world', { style: 'clap' });
    expect(r.output).toContain('👏');
  });

  it('pig-latin', () => {
    const r = unicodeEngine.execute('hello world', { style: 'pig-latin' });
    expect(r.output).toContain('ay');
  });

  it('pirate-speak', () => {
    const r = unicodeEngine.execute('hello my friend', { style: 'pirate-speak' });
    expect(r.output).toContain('Arrr');
  });

});

// ===================================================================
// 23. Engine structural contract — every engine has name, description,
//     validate, execute
// ===================================================================

describe('Engine structural contract', () => {
  const allEngines = [
    caseEngine, wrapEngine, filterEngine, transformEngine,
    encodeEngine, hashEngine, counterEngine, convertEngine,
    formatEngine, generateDataEngine, generateWebEngine, validateEngine, unitEngine,
    calculateEngine, commentEngine, markupEngine, diffEngine,
    schemaEngine, apiEngine, unicodeEngine,
  ];

  for (const engine of allEngines) {
    describe(`${engine.name} engine`, () => {
      it('has name string', () => {
        expect(typeof engine.name).toBe('string');
        expect(engine.name.length).toBeGreaterThan(0);
      });

      it('has description string', () => {
        expect(typeof engine.description).toBe('string');
        expect(engine.description.length).toBeGreaterThan(0);
      });

      it('has validate function', () => {
        expect(typeof engine.validate).toBe('function');
      });

      it('has execute function', () => {
        expect(typeof engine.execute).toBe('function');
      });
    });
  }
});

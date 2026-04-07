import { describe, it, expect, beforeAll } from 'vitest';
import { readJsonInput, writeOutput } from './helpers';
import {
  encodeHTML,
  decodeHTML,
  encodeUnicode,
  decodeUnicode,
  toCodePoints,
  fromCodePoints,
  encodeHex,
  decodeHex,
  encodeBinary,
  decodeBinary,
  encodeASCII,
  decodeASCII,
  toASCIITable,
  encodeURLComponent,
  encodeDataURI,
  decodeDataURI,
  escapeJSON,
  unescapeJSON,
  escapeRegExp,
  escapeCSV,
  escapeXML,
} from '../src/encoders';

interface EncodingInput {
  plain: string;
  unicode: string;
  special: string;
  html_entities: string;
  url_component: string;
  hex_input: string;
  binary_input: string;
  ascii_codes: number[];
  code_points: number[];
}

let input: EncodingInput;

beforeAll(() => {
  const data = readJsonInput<{ encoding: EncodingInput }>('tools-input.json');
  input = data.encoding;
});

// ==================== HTML ====================

describe('encodeHTML / decodeHTML', () => {
  it('encodes HTML special characters', () => {
    const encoded = encodeHTML(input.plain);
    writeOutput('encoders', 'html-encoded.txt', encoded);
    expect(encoded).toContain('&lt;');
    expect(encoded).toContain('&gt;');
    expect(encoded).toContain('&#39;'); // single quotes encoded
    expect(encoded).not.toContain('<script>'); // no raw HTML tags
  });

  it('decodes HTML entities back to original', () => {
    const decoded = decodeHTML(input.html_entities);
    writeOutput('encoders', 'html-decoded.txt', decoded);
    expect(decoded).toContain('&');
    expect(decoded).toContain('<div');
  });

  it('roundtrips: decode(encode(x)) returns original', () => {
    const text = 'Test <script>alert("xss")</script> & more';
    const roundtripped = decodeHTML(encodeHTML(text));
    expect(roundtripped).toBe(text);
  });
});

// ==================== UNICODE ====================

describe('encodeUnicode / decodeUnicode', () => {
  it('encodes text to unicode escape sequences', () => {
    const encoded = encodeUnicode(input.unicode);
    writeOutput('encoders', 'unicode-encoded.txt', encoded);
    expect(encoded).toContain('\\u');
  });

  it('decodes unicode escape sequences back', () => {
    const encoded = encodeUnicode('Hello');
    const decoded = decodeUnicode(encoded);
    expect(decoded).toBe('Hello');
  });

  it('handles emoji and CJK characters', () => {
    const encoded = encodeUnicode('🌍你好');
    writeOutput('encoders', 'unicode-emoji-encoded.txt', encoded);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
  });
});

// ==================== CODE POINTS ====================

describe('toCodePoints / fromCodePoints', () => {
  it('converts text to code point array', () => {
    const points = toCodePoints('Hello');
    writeOutput('encoders', 'code-points.json', JSON.stringify(points));
    expect(points).toEqual([72, 101, 108, 108, 111]);
  });

  it('converts code points back to text', () => {
    const text = fromCodePoints(input.code_points);
    writeOutput('encoders', 'from-code-points.txt', text);
    // code_points: [72, 233, 108, 108, 111, 32, 128013] -> 'Héllo 🐍'
    expect(text).toContain('llo');
  });

  it('roundtrips correctly', () => {
    const original = 'Test 123!';
    expect(fromCodePoints(toCodePoints(original))).toBe(original);
  });
});

// ==================== HEX ====================

describe('encodeHex / decodeHex', () => {
  it('encodes text to hex representation', () => {
    const hex = encodeHex('Hello');
    writeOutput('encoders', 'hex-encoded.txt', hex);
    expect(hex.length).toBeGreaterThan(0);
    // 'Hello' -> '48656c6c6f' (lowercase hex)
    expect(hex.toLowerCase()).toContain('48656c6c6f');
  });

  it('decodes hex back to text', () => {
    const hex = encodeHex('Hello');
    const decoded = decodeHex(hex);
    expect(decoded).toBe('Hello');
  });

  it('roundtrips correctly', () => {
    const original = 'Test hex encoding!';
    expect(decodeHex(encodeHex(original))).toBe(original);
  });
});

// ==================== BINARY ====================

describe('encodeBinary / decodeBinary', () => {
  it('encodes text to binary representation', () => {
    const binary = encodeBinary('Hi');
    writeOutput('encoders', 'binary-encoded.txt', binary);
    // Should contain only 0, 1, and spaces
    expect(binary).toMatch(/^[01 ]+$/);
  });

  it('decodes binary back to text', () => {
    const binary = encodeBinary('Hi');
    const decoded = decodeBinary(binary);
    expect(decoded).toBe('Hi');
  });

  it('roundtrips correctly', () => {
    const original = 'Binary test';
    expect(decodeBinary(encodeBinary(original))).toBe(original);
  });
});

// ==================== ASCII ====================

describe('encodeASCII / decodeASCII', () => {
  it('encodes text to ASCII code array', () => {
    const codes = encodeASCII('Hello');
    writeOutput('encoders', 'ascii-encoded.json', JSON.stringify(codes));
    expect(codes).toEqual([72, 101, 108, 108, 111]);
  });

  it('decodes ASCII codes back to text', () => {
    const text = decodeASCII(input.ascii_codes);
    writeOutput('encoders', 'ascii-decoded.txt', text);
    expect(text).toBe('Hello');
  });

  it('roundtrips correctly', () => {
    const original = 'Test!';
    expect(decodeASCII(encodeASCII(original))).toBe(original);
  });
});

// ==================== ASCII TABLE ====================

describe('toASCIITable', () => {
  it('generates ASCII table for input text', () => {
    const table = toASCIITable('AB');
    writeOutput('encoders', 'ascii-table.json', JSON.stringify(table, null, 2));
    expect(table).toHaveLength(2);
    expect(table[0]).toHaveProperty('char', 'A');
    expect(table[0]).toHaveProperty('dec', 65);
    expect(table[0]).toHaveProperty('hex');
    expect(table[0]).toHaveProperty('bin');
  });
});

// ==================== URL COMPONENT ====================

describe('encodeURLComponent', () => {
  it('encodes URL component with special characters', () => {
    const encoded = encodeURLComponent(input.url_component);
    writeOutput('encoders', 'url-component-encoded.txt', encoded);
    expect(encoded).not.toContain(' ');
  });
});

// ==================== DATA URI ====================

describe('encodeDataURI / decodeDataURI', () => {
  it('encodes content as data URI', () => {
    const uri = encodeDataURI('<h1>Hello</h1>', 'text/html');
    writeOutput('encoders', 'data-uri.txt', uri);
    expect(uri).toContain('data:text/html');
  });

  it('decodes data URI back', () => {
    const uri = encodeDataURI('Hello World', 'text/plain');
    const decoded = decodeDataURI(uri);
    expect(decoded).not.toBeNull();
    expect(decoded!.mimeType).toBe('text/plain');
    expect(decoded!.content).toBe('Hello World');
  });

  it('returns null for invalid data URI', () => {
    const decoded = decodeDataURI('not-a-data-uri');
    expect(decoded).toBeNull();
  });
});

// ==================== ESCAPE / UNESCAPE ====================

describe('escapeJSON / unescapeJSON', () => {
  it('escapes JSON special characters', () => {
    const input = 'Hello\n"World"\t\\back';
    const escaped = escapeJSON(input);
    writeOutput('encoders', 'json-escaped.txt', escaped);
    expect(escaped).toContain('\\n');
    expect(escaped).toContain('\\"');
  });

  it('roundtrips correctly', () => {
    const original = 'Line1\nLine2\t"quoted"';
    expect(unescapeJSON(escapeJSON(original))).toBe(original);
  });
});

describe('escapeRegExp', () => {
  it('escapes regex special characters', () => {
    const escaped = escapeRegExp('hello.world*test?');
    writeOutput('encoders', 'regexp-escaped.txt', escaped);
    expect(escaped).toContain('\\.');
    expect(escaped).toContain('\\*');
    expect(escaped).toContain('\\?');
  });
});

describe('escapeCSV', () => {
  it('escapes CSV fields with commas and quotes', () => {
    const escaped = escapeCSV('Hello, "World"');
    writeOutput('encoders', 'csv-escaped.txt', escaped);
    // CSV escaping wraps in quotes and doubles internal quotes
    expect(escaped).toContain('"');
  });
});

describe('escapeXML', () => {
  it('escapes XML special characters', () => {
    const escaped = escapeXML('<tag attr="value">content & more</tag>');
    writeOutput('encoders', 'xml-escaped.txt', escaped);
    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&amp;');
  });
});

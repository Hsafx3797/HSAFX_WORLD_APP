import { describe, it, expect, beforeAll } from 'vitest';
import { readJsonInput, writeOutput } from './helpers';
import {
  encodeBase64, decodeBase64,
  encodeBase64Url, decodeBase64Url,
  encodeURL, decodeURL, encodeURLComponent,
  parseQueryString, buildQueryString,
  rot13, caesarCipher,
  encodeMorse, decodeMorse,
  encodeNATO, decodeNATO,
  encodePunycode, decodePunycode,
  decodeJWT,
  encodeDataURI, decodeDataURI,
  escapeJSON, unescapeJSON,
  escapeRegExp, escapeCSV, escapeXML,
  encodeHTML, decodeHTML,
} from '../src/encoders';

interface InjectionData {
  xss: Record<string, string>;
  sql_injection: Record<string, string>;
  template_injection: Record<string, string>;
  command_injection: Record<string, string>;
  path_traversal: Record<string, string>;
  xxe: Record<string, string>;
  unicode_attacks: Record<string, string>;
  edge_cases: Record<string, string>;
}

let attacks: InjectionData;

beforeAll(async () => {
  attacks = await readJsonInput<InjectionData>('injection-input.json');
});

// ==================== BASE64 ====================

describe('Base64', () => {
  it('encode/decode roundtrip', () => {
    const text = 'Hello, World!';
    expect(decodeBase64(encodeBase64(text))).toBe(text);
  });

  it('known encoding', () => {
    expect(encodeBase64('Hello')).toBe('SGVsbG8=');
  });

  it('empty string', () => {
    expect(encodeBase64('')).toBe('');
    expect(decodeBase64('')).toBe('');
  });

  it('unicode roundtrip', () => {
    const text = 'مرحبا بالعالم 🌍';
    expect(decodeBase64(encodeBase64(text))).toBe(text);
  });

  it('binary-like data roundtrip', () => {
    const text = '\x00\x01\x02\xff';
    const encoded = encodeBase64(text);
    expect(decodeBase64(encoded)).toBe(text);
  });

  it('XSS payload roundtrip — no execution', () => {
    const xss = '<script>alert(1)</script>';
    const encoded = encodeBase64(xss);
    expect(encoded).not.toContain('<script>');
    expect(decodeBase64(encoded)).toBe(xss);
  });
});

// ==================== BASE64URL ====================

describe('Base64 URL-safe', () => {
  it('encode/decode roundtrip', () => {
    const text = 'Hello+World/Test==';
    expect(decodeBase64Url(encodeBase64Url(text))).toBe(text);
  });

  it('no + / = in output', () => {
    const encoded = encodeBase64Url('test string with special chars ?!@#');
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('empty string', () => {
    expect(encodeBase64Url('')).toBe('');
  });

  it('injection payloads encode safely', () => {
    Object.values(attacks.xss).forEach(payload => {
      const encoded = encodeBase64Url(payload);
      expect(encoded).not.toContain('<');
      expect(encoded).not.toContain('>');
      expect(decodeBase64Url(encoded)).toBe(payload);
    });
  });
});

// ==================== URL ENCODING ====================

describe('URL encoding', () => {
  it('encodeURL', () => {
    expect(encodeURL('hello world')).toBe('hello%20world');
    expect(encodeURL('a=b&c=d')).toBe('a%3Db%26c%3Dd');
  });

  it('decodeURL', () => {
    expect(decodeURL('hello%20world')).toBe('hello world');
    expect(decodeURL('a%3Db%26c%3Dd')).toBe('a=b&c=d');
  });

  it('roundtrip', () => {
    const text = 'query=hello world&name=John Doe';
    expect(decodeURL(encodeURL(text))).toBe(text);
  });

  it('encodeURLComponent extra chars', () => {
    const encoded = encodeURLComponent("test's value!(*)");
    expect(encoded).toContain('%27');   // '
    expect(encoded).toContain('%28');   // (
    expect(encoded).toContain('%29');   // )
    expect(encoded).toContain('%2A');   // *
    expect(encoded).toContain('%21');   // !
  });

  it('injection payloads are URL-encoded', () => {
    const xss = attacks.xss.script_tag;
    const encoded = encodeURL(xss);
    expect(encoded).not.toContain('<');
    expect(encoded).not.toContain('>');
  });
});

// ==================== QUERY STRING ====================

describe('parseQueryString / buildQueryString', () => {
  it('parse simple query', () => {
    const r = parseQueryString('name=John&age=30');
    expect(r.name).toBe('John');
    expect(r.age).toBe('30');
  });

  it('parse with leading ?', () => {
    const r = parseQueryString('?foo=bar');
    expect(r.foo).toBe('bar');
  });

  it('parse duplicate keys into array', () => {
    const r = parseQueryString('tag=a&tag=b&tag=c');
    expect(Array.isArray(r.tag)).toBe(true);
    expect(r.tag).toEqual(['a', 'b', 'c']);
  });

  it('build query string', () => {
    const qs = buildQueryString({ name: 'John', age: 30, active: true });
    expect(qs).toContain('name=John');
    expect(qs).toContain('age=30');
    expect(qs).toContain('active=true');
  });

  it('build with array values', () => {
    const qs = buildQueryString({ tag: ['a', 'b'] });
    expect(qs).toContain('tag=a');
    expect(qs).toContain('tag=b');
  });

  it('injection: SQL in query key/value', () => {
    const sql = "'; DROP TABLE users; --";
    const qs = buildQueryString({ input: sql });
    // The injection should be properly URL-encoded
    expect(qs).not.toContain("'");
    expect(qs).not.toContain(';');
  });

  it('injection: XSS in query value', () => {
    const r = parseQueryString('q=<script>alert(1)</script>');
    // Parse just stores the value as-is — application must sanitize
    expect(r.q).toBe('<script>alert(1)</script>');
  });
});

// ==================== ROT13 / CAESAR ====================

describe('rot13', () => {
  it('encodes correctly', () => {
    expect(rot13('Hello')).toBe('Uryyb');
    expect(rot13('ABC')).toBe('NOP');
  });

  it('double rot13 = identity', () => {
    const text = 'The Quick Brown Fox';
    expect(rot13(rot13(text))).toBe(text);
  });

  it('preserves non-alpha', () => {
    expect(rot13('123 !@#')).toBe('123 !@#');
  });

  it('XSS payload through rot13', () => {
    const xss = '<script>alert(1)</script>';
    const encoded = rot13(xss);
    // rot13 rotates ALL alpha chars: <script> → <fpevcg>
    expect(encoded).toContain('<fpevcg>');
    // roundtrip: applying rot13 twice recovers original
    expect(rot13(encoded)).toBe(xss);
  });
});

describe('caesarCipher', () => {
  it('shift 3 (classic)', () => {
    expect(caesarCipher('ABC', 3)).toBe('DEF');
    expect(caesarCipher('XYZ', 3)).toBe('ABC');
  });

  it('negative shift', () => {
    expect(caesarCipher('DEF', -3)).toBe('ABC');
  });

  it('shift 0 = identity', () => {
    expect(caesarCipher('Hello', 0)).toBe('Hello');
  });

  it('shift 26 = identity', () => {
    expect(caesarCipher('Test', 26)).toBe('Test');
  });

  it('large shift wraps correctly', () => {
    expect(caesarCipher('A', 52)).toBe('A');
    expect(caesarCipher('A', 53)).toBe('B');
  });

  it('preserves non-alpha', () => {
    expect(caesarCipher('Hello, World! 123', 5)).toBe('Mjqqt, Btwqi! 123');
  });
});

// ==================== MORSE CODE ====================

describe('Morse code', () => {
  it('encode SOS', () => {
    expect(encodeMorse('SOS')).toBe('... --- ...');
  });

  it('decode SOS', () => {
    expect(decodeMorse('... --- ...')).toBe('SOS');
  });

  it('encode with spaces', () => {
    const encoded = encodeMorse('HI WORLD');
    expect(encoded).toContain('/');
  });

  it('roundtrip uppercase', () => {
    const text = 'HELLO WORLD';
    expect(decodeMorse(encodeMorse(text))).toBe(text);
  });

  it('numbers', () => {
    expect(encodeMorse('123')).toBe('.---- ..--- ...--');
    expect(decodeMorse('.---- ..--- ...--')).toBe('123');
  });

  it('special characters', () => {
    expect(encodeMorse('?')).toBe('..--..');
    expect(decodeMorse('..--..')).toBe('?');
  });
});

// ==================== NATO ====================

describe('NATO phonetic alphabet', () => {
  it('encode text', () => {
    expect(encodeNATO('ABC')).toBe('Alpha Bravo Charlie');
  });

  it('decode text', () => {
    expect(decodeNATO('Alpha Bravo Charlie')).toBe('ABC');
  });

  it('numbers', () => {
    expect(encodeNATO('911')).toBe('Niner One One');
  });

  it('roundtrip', () => {
    const text = 'HELLO';
    expect(decodeNATO(encodeNATO(text))).toBe(text);
  });
});

// ==================== JWT ====================

describe('decodeJWT', () => {
  // Construct a valid JWT for testing (unsigned, just for decoding)
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = encodeBase64Url(JSON.stringify({
    sub: '1234567890', name: 'Test User', iat: 1700000000, exp: 9999999999,
  }));
  const fakeSignature = 'fakesig123';
  const validToken = `${header}.${payload}.${fakeSignature}`;

  it('decodes valid JWT', () => {
    const r = decodeJWT(validToken);
    writeOutput('encoders', 'jwt-decoded.json', JSON.stringify(r, null, 2));
    expect(r).not.toBeNull();
    expect(r!.header.alg).toBe('HS256');
    expect(r!.payload.sub).toBe('1234567890');
    expect(r!.payload.name).toBe('Test User');
    expect(r!.isExpired).toBe(false);
  });

  it('detects expired JWT', () => {
    const expiredPayload = encodeBase64Url(JSON.stringify({
      sub: 'user', exp: 1000000000, // far in the past
    }));
    const token = `${header}.${expiredPayload}.${fakeSignature}`;
    const r = decodeJWT(token);
    expect(r!.isExpired).toBe(true);
  });

  it('returns null for malformed token', () => {
    expect(decodeJWT('not-a-jwt')).toBeNull();
    expect(decodeJWT('only.two')).toBeNull();
    expect(decodeJWT('')).toBeNull();
  });

  it('injection: SQL in JWT payload', () => {
    const sqlPayload = encodeBase64Url(JSON.stringify({
      sub: "' OR 1=1 --", role: "admin'; DROP TABLE users;--",
    }));
    const token = `${header}.${sqlPayload}.${fakeSignature}`;
    const r = decodeJWT(token);
    expect(r).not.toBeNull();
    // Decoder should faithfully return the payload — no execution
    expect(r!.payload.sub).toBe("' OR 1=1 --");
  });

  it('injection: XSS in JWT payload', () => {
    const xssPayload = encodeBase64Url(JSON.stringify({
      name: '<script>alert(document.cookie)</script>',
    }));
    const token = `${header}.${xssPayload}.${fakeSignature}`;
    const r = decodeJWT(token);
    expect(r!.payload.name).toBe('<script>alert(document.cookie)</script>');
  });
});

// ==================== DATA URI ====================

describe('Data URI', () => {
  it('encode plain text', () => {
    const uri = encodeDataURI('Hello, World!', 'text/plain');
    expect(uri).toMatch(/^data:text\/plain;base64,/);
  });

  it('decode data URI', () => {
    const uri = encodeDataURI('Test content', 'text/html');
    const r = decodeDataURI(uri);
    expect(r).not.toBeNull();
    expect(r!.mimeType).toBe('text/html');
    expect(r!.content).toBe('Test content');
  });

  it('roundtrip', () => {
    const text = '<h1>Hello</h1><script>// not executed</script>';
    const uri = encodeDataURI(text, 'text/html');
    const r = decodeDataURI(uri);
    expect(r!.content).toBe(text);
  });

  it('invalid URI returns null', () => {
    expect(decodeDataURI('not-a-data-uri')).toBeNull();
    expect(decodeDataURI('data:text/plain,not-base64')).toBeNull();
  });

  it('injection: XSS in data URI content', () => {
    const xss = '<img src=x onerror=alert(1)>';
    const uri = encodeDataURI(xss, 'text/html');
    // Content is base64-encoded, so raw XSS not in URI string
    const base64Part = uri.split(',')[1];
    expect(base64Part).not.toContain('<img');
  });
});

// ==================== ESCAPE FUNCTIONS ====================

describe('escapeJSON / unescapeJSON', () => {
  it('escapes special chars', () => {
    expect(escapeJSON('line1\nline2')).toBe('line1\\nline2');
    expect(escapeJSON('tab\there')).toBe('tab\\there');
    expect(escapeJSON('quote"here')).toBe('quote\\"here');
  });

  it('roundtrip', () => {
    const text = 'Hello\n"World"\t\\Escaped\\';
    expect(unescapeJSON(escapeJSON(text))).toBe(text);
  });

  it('injection: SQL in JSON escape', () => {
    const sql = "'; DROP TABLE users; --";
    const escaped = escapeJSON(sql);
    const unescaped = unescapeJSON(escaped);
    expect(unescaped).toBe(sql);
  });
});

describe('escapeRegExp', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegExp('hello.world')).toBe('hello\\.world');
    expect(escapeRegExp('a*b+c?')).toBe('a\\*b\\+c\\?');
    expect(escapeRegExp('[test]')).toBe('\\[test\\]');
    expect(escapeRegExp('(group)')).toBe('\\(group\\)');
    expect(escapeRegExp('a{1,3}')).toBe('a\\{1,3\\}');
    expect(escapeRegExp('a|b')).toBe('a\\|b');
    expect(escapeRegExp('^start$end')).toBe('\\^start\\$end');
  });

  it('escaped pattern works in RegExp', () => {
    const literal = 'test.file (copy).txt';
    const escaped = escapeRegExp(literal);
    const regex = new RegExp(escaped);
    expect(regex.test(literal)).toBe(true);
    expect(regex.test('testXfile Xcopy)Xtxt')).toBe(false);
  });

  it('ReDoS prevention: complex patterns are escaped', () => {
    const redos = '(a+)+b';
    const escaped = escapeRegExp(redos);
    // The escaped version should be safe to use in a RegExp
    expect(() => new RegExp(escaped)).not.toThrow();
    // And should match the literal string, not the pattern
    expect(new RegExp(escaped).test(redos)).toBe(true);
  });
});

describe('escapeCSV', () => {
  it('simple value unchanged', () => {
    expect(escapeCSV('hello')).toBe('hello');
  });

  it('wraps values with commas', () => {
    expect(escapeCSV('hello, world')).toBe('"hello, world"');
  });

  it('wraps values with newlines', () => {
    expect(escapeCSV('line1\nline2')).toBe('"line1\nline2"');
  });

  it('doubles quotes', () => {
    expect(escapeCSV('say "hello"')).toBe('"say ""hello"""');
  });

  it('injection: formula injection attempt', () => {
    // CSV formula injection (=, +, -, @)
    const formula = '=HYPERLINK("http://evil.com","Click")';
    const escaped = escapeCSV(formula);
    // The function doesn't prevent formula injection — just handles CSV escaping
    // This documents the behavior
    expect(escaped).toBeDefined();
  });
});

describe('escapeXML', () => {
  it('escapes XML entities', () => {
    expect(escapeXML('a & b')).toBe('a &amp; b');
    expect(escapeXML('<tag>')).toBe('&lt;tag&gt;');
    expect(escapeXML('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeXML("'apos'")).toBe('&apos;apos&apos;');
  });

  it('XSS payload is neutralized', () => {
    const xss = '<script>alert("xss")</script>';
    const escaped = escapeXML(xss);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('XXE payload is neutralized', () => {
    const xxe = '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>';
    const escaped = escapeXML(xxe);
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
  });
});

// ==================== CROSS-CUTTING INJECTION SWEEPS ====================

describe('Cross-cutting: all XSS through encodeHTML', () => {
  it('every XSS payload is HTML-entity encoded', () => {
    Object.entries(attacks.xss).forEach(([name, payload]) => {
      const encoded = encodeHTML(payload);
      // Must not contain raw < or > after encoding
      expect(encoded).not.toMatch(/[<>]/);
    });
  });
});

describe('Cross-cutting: all injection payloads through encodeURL', () => {
  it('encodeURL neutralizes all attack vectors', () => {
    const allPayloads = [
      ...Object.values(attacks.xss),
      ...Object.values(attacks.sql_injection),
      ...Object.values(attacks.command_injection),
    ];
    allPayloads.forEach(payload => {
      const encoded = encodeURL(payload);
      // Should not contain unencoded dangerous chars
      expect(encoded).not.toContain('<');
      expect(encoded).not.toContain('>');
      // Roundtrip must preserve original
      expect(decodeURL(encoded)).toBe(payload);
    });
  });
});

describe('Cross-cutting: escapeXML neutralizes all payloads', () => {
  it('no raw angle brackets after escaping any attack', () => {
    const allPayloads = [
      ...Object.values(attacks.xss),
      ...Object.values(attacks.xxe),
    ];
    allPayloads.forEach(payload => {
      const escaped = escapeXML(payload);
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
    });
  });
});

describe('Cross-cutting: Base64 roundtrip preserves all payloads', () => {
  it('encode+decode roundtrip for every attack vector', () => {
    const allPayloads = [
      ...Object.values(attacks.xss),
      ...Object.values(attacks.sql_injection),
      ...Object.values(attacks.template_injection),
      ...Object.values(attacks.command_injection),
      ...Object.values(attacks.path_traversal),
    ];
    allPayloads.forEach(payload => {
      expect(decodeBase64(encodeBase64(payload))).toBe(payload);
      expect(decodeBase64Url(encodeBase64Url(payload))).toBe(payload);
    });
  });
});

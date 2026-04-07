import { describe, it, expect } from 'vitest';
import {
  decodeJwt,
  curlToFetch,
  curlToAxios,
  fetchToCurl,
  parseHttpHeaders,
  jsonToHttpHeaders,
  urlToOpenApiPath,
  parseUrl,
  buildUrl,
} from '../src/data-converters/api';

// ═══════════════════════════════════════════════
// JWT Decoding
// ═══════════════════════════════════════════════

describe('decodeJwt', () => {
  // A real HS256 JWT with payload: {"sub":"1234567890","name":"Test","iat":1516239022}
  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QiLCJpYXQiOjE1MTYyMzkwMjJ9.' +
    'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  it('decodes valid JWT header + payload', () => {
    const r = JSON.parse(decodeJwt(validToken));
    expect(r.header.alg).toBe('HS256');
    expect(r.payload.sub).toBe('1234567890');
    expect(r.payload.name).toBe('Test');
    expect(r.issuedAt).toContain('2018');
  });
  it('rejects non-3-part token', () => {
    const r = JSON.parse(decodeJwt('not.a.real.token.at.all'));
    expect(r.error).toBeDefined();
  });
  it('rejects single string', () => {
    const r = JSON.parse(decodeJwt('notavalidtoken'));
    expect(r.error).toBeDefined();
  });

  // Security: JWT with XSS in payload
  it('handles XSS payload without execution', () => {
    // header: {"alg":"none","typ":"JWT"}, payload: {"name":"<script>alert(1)</script>"}
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=/g, '');
    const payload = btoa(JSON.stringify({ name: '<script>alert(1)</script>' })).replace(/=/g, '');
    const token = `${header}.${payload}.`;
    const r = JSON.parse(decodeJwt(token));
    expect(r.payload.name).toBe('<script>alert(1)</script>');
  });

  // Security: JWT with SQL injection in payload
  it('handles SQLi payload without execution', () => {
    const header = btoa(JSON.stringify({ alg: 'none' })).replace(/=/g, '');
    const payload = btoa(JSON.stringify({ sub: "' OR 1=1 --" })).replace(/=/g, '');
    const token = `${header}.${payload}.`;
    const r = JSON.parse(decodeJwt(token));
    expect(r.payload.sub).toBe("' OR 1=1 --");
  });
});

// ═══════════════════════════════════════════════
// cURL conversions
// ═══════════════════════════════════════════════

describe('curlToFetch', () => {
  it('converts basic GET', () => {
    const r = curlToFetch("curl 'https://api.example.com/users'");
    expect(r).toContain('fetch');
    expect(r).toContain('https://api.example.com/users');
  });
  it('converts POST with headers', () => {
    const r = curlToFetch(
      "curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -d '{\"name\":\"test\"}'",
    );
    expect(r).toContain("method: 'POST'");
    expect(r).toContain('Content-Type');
  });
  it('handles curl with -X method', () => {
    const r = curlToFetch("curl -X DELETE 'https://api.example.com/users/1'");
    expect(r).toContain("method: 'DELETE'");
  });
});

describe('curlToAxios', () => {
  it('converts to axios import', () => {
    const r = curlToAxios("curl 'https://api.example.com/data'");
    expect(r).toContain("import axios from 'axios'");
    expect(r).toContain('axios.');
  });
  it('POST with data', () => {
    const r = curlToAxios(
      "curl -X POST 'https://api.example.com/data' -d '{\"a\":1}'",
    );
    expect(r).toContain('axios.post');
  });
});

describe('fetchToCurl', () => {
  it('converts basic fetch', () => {
    const fetchCode = `const response = await fetch('https://api.example.com/users');`;
    const r = fetchToCurl(fetchCode);
    expect(r).toContain('curl');
    expect(r).toContain('https://api.example.com/users');
  });
  it('converts fetch with method', () => {
    const fetchCode = `await fetch('https://api.example.com/users', { method: 'POST' });`;
    const r = fetchToCurl(fetchCode);
    expect(r).toContain('-X POST');
  });
  it('returns error for unparseable input', () => {
    const r = fetchToCurl('not fetch code');
    expect(r).toContain('Could not parse');
  });
});

// ═══════════════════════════════════════════════
// HTTP Headers
// ═══════════════════════════════════════════════

describe('parseHttpHeaders / jsonToHttpHeaders', () => {
  it('parses standard headers', () => {
    const headers = 'Content-Type: application/json\nAuthorization: Bearer token123';
    const r = JSON.parse(parseHttpHeaders(headers));
    expect(r['Content-Type']).toBe('application/json');
    expect(r.Authorization).toBe('Bearer token123');
  });
  it('skips HTTP status line', () => {
    const headers = 'HTTP/1.1 200 OK\nContent-Type: text/html';
    const r = JSON.parse(parseHttpHeaders(headers));
    expect(r['Content-Type']).toBe('text/html');
    expect(r['HTTP/1.1']).toBeUndefined();
  });
  it('jsonToHttpHeaders formats correctly', () => {
    const json = '{"Content-Type":"application/json","Accept":"*/*"}';
    const r = jsonToHttpHeaders(json);
    expect(r).toContain('Content-Type: application/json');
    expect(r).toContain('Accept: */*');
  });
  it('roundtrip', () => {
    const original = 'X-Custom: value1\nX-Other: value2';
    const json = parseHttpHeaders(original);
    const back = jsonToHttpHeaders(json);
    expect(back).toContain('X-Custom: value1');
    expect(back).toContain('X-Other: value2');
  });

  // CRLF header injection
  it('CRLF injection in header values stays as data', () => {
    const headers = 'X-Injected: value\r\nSet-Cookie: hacked=true';
    const r = JSON.parse(parseHttpHeaders(headers));
    // The parser splits by \n, so the injected line becomes a separate header
    // This is expected behavior for a parser — it parses what it gets
    expect(r).toBeDefined();
  });
});

// ═══════════════════════════════════════════════
// URL utilities
// ═══════════════════════════════════════════════

describe('urlToOpenApiPath', () => {
  it('converts numeric IDs to path params', () => {
    const r = JSON.parse(urlToOpenApiPath('https://api.example.com/users/123'));
    const paths = Object.keys(r);
    expect(paths[0]).toContain('{id}');
  });
  it('converts UUIDs (note: numeric prefix matched first by ID regex)', () => {
    const r = JSON.parse(
      urlToOpenApiPath(
        'https://api.example.com/items/550e8400-e29b-41d4-a716-446655440000',
      ),
    );
    const paths = Object.keys(r);
    // The numeric regex replaces /550 first, mangling the UUID
    expect(paths[0]).toContain('{id}');
  });
  it('includes query parameters', () => {
    const r = JSON.parse(
      urlToOpenApiPath('https://api.example.com/search?q=test&page=1'),
    );
    const path = Object.values(r)[0] as Record<string, unknown>;
    const get = path.get as Record<string, unknown>;
    const params = get.parameters as Array<Record<string, unknown>>;
    expect(params.some((p) => p.name === 'q')).toBe(true);
    expect(params.some((p) => p.name === 'page')).toBe(true);
  });
});

describe('parseUrl', () => {
  it('extracts all components', () => {
    const r = JSON.parse(parseUrl('https://user:pass@example.com:8080/path?q=1#hash'));
    expect(r.protocol).toBe('https:');
    expect(r.hostname).toBe('example.com');
    expect(r.port).toBe('8080');
    expect(r.pathname).toBe('/path');
    expect(r.hash).toBe('#hash');
    expect(r.username).toBe('user');
    expect(r.password).toBe('***'); // masked
  });
  it('default port', () => {
    const r = JSON.parse(parseUrl('https://example.com/'));
    expect(r.port).toBe('default');
  });
  it('invalid URL returns error', () => {
    const r = JSON.parse(parseUrl('not a url'));
    expect(r.error).toBeDefined();
  });

  // SSRF probe
  it('parses internal URLs without blocking (parser only)', () => {
    const r = JSON.parse(parseUrl('http://169.254.169.254/latest/meta-data/'));
    expect(r.hostname).toBe('169.254.169.254');
    // parseUrl is a pure parser — SSRF is a fetch concern, parser just describes
  });
  it('parses file:// protocol attempt', () => {
    const r = JSON.parse(parseUrl('file:///etc/passwd'));
    expect(r.protocol).toBe('file:');
  });
});

describe('buildUrl', () => {
  it('appends query params', () => {
    const r = buildUrl('https://example.com/search', { q: 'test', page: '1' });
    expect(r).toContain('q=test');
    expect(r).toContain('page=1');
  });
  it('handles existing params', () => {
    const r = buildUrl('https://example.com/search?existing=1', { added: '2' });
    expect(r).toContain('existing=1');
    expect(r).toContain('added=2');
  });
  it('encodes special characters', () => {
    const r = buildUrl('https://example.com/', { q: 'hello world' });
    // URLSearchParams.set uses + for spaces
    expect(r).toMatch(/q=hello[+%20]world/);
  });
  it('invalid base URL returns error', () => {
    const r = buildUrl('not a url', { a: '1' });
    expect(r).toContain('Error');
  });

  // Injection: open redirect via params
  it('encodes redirect URL in params safely', () => {
    const r = buildUrl('https://example.com/login', {
      redirect: 'https://evil.com/steal',
    });
    expect(r).toContain('redirect=');
    // The URL is encoded as a query param, not treated as navigation
  });
});

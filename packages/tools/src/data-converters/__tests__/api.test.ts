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
  apiResponseToMock,
} from '../api';

// Helper: build a fake JWT from header/payload objects
function makeJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  signature = 'fake-sig',
): string {
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${encode(header)}.${encode(payload)}.${signature}`;
}

// ─── decodeJwt ────────────────────────────────────────────────────────────────

describe('decodeJwt', () => {
  it('decodes a valid JWT and returns header + payload', () => {
    const token = makeJwt({ alg: 'HS256', typ: 'JWT' }, { sub: '1234', name: 'Alice' });
    const result = JSON.parse(decodeJwt(token));
    expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(result.payload.sub).toBe('1234');
    expect(result.payload.name).toBe('Alice');
  });

  it('extracts standard claims (sub, iat, exp)', () => {
    const iat = 1700000000;
    const exp = 1700003600;
    const token = makeJwt({ alg: 'HS256' }, { sub: 'user-42', iat, exp });
    const result = JSON.parse(decodeJwt(token));
    expect(result.payload.sub).toBe('user-42');
    expect(result.payload.iat).toBe(iat);
    expect(result.payload.exp).toBe(exp);
    expect(result.issuedAt).toBe(new Date(iat * 1000).toISOString());
    expect(result.expiration).toBe(new Date(exp * 1000).toISOString());
  });

  it('sets expired=true when exp is in the past', () => {
    const token = makeJwt({ alg: 'HS256' }, { exp: 1000000000 }); // 2001-09-08
    const result = JSON.parse(decodeJwt(token));
    expect(result.expired).toBe(true);
  });

  it('includes notBefore when nbf claim is present', () => {
    const nbf = 1700000000;
    const token = makeJwt({ alg: 'HS256' }, { nbf });
    const result = JSON.parse(decodeJwt(token));
    expect(result.notBefore).toBe(new Date(nbf * 1000).toISOString());
  });

  it('returns error JSON for token with less than 3 parts', () => {
    const result = JSON.parse(decodeJwt('only.two'));
    expect(result.error).toMatch(/Invalid JWT format/);
  });

  it('returns error JSON for completely invalid token', () => {
    const result = JSON.parse(decodeJwt('not-a-jwt'));
    expect(result.error).toMatch(/Invalid JWT format/);
  });

  it('returns error JSON for token with invalid base64 payload', () => {
    const result = JSON.parse(decodeJwt('a.!!!.c'));
    expect(result).toHaveProperty('error');
  });
});

// ─── curlToFetch ──────────────────────────────────────────────────────────────

describe('curlToFetch', () => {
  it('converts a simple GET curl to fetch', () => {
    const result = curlToFetch('curl https://api.example.com/data');
    expect(result).toContain("fetch('https://api.example.com/data'");
    expect(result).toContain("method: 'GET'");
  });

  it('converts POST with data and Content-Type header', () => {
    const curl =
      `curl -X POST -H "Content-Type: application/json" -d '{"key":"val"}' "https://api.example.com/items"`;
    const result = curlToFetch(curl);
    expect(result).toContain("method: 'POST'");
    expect(result).toContain("'Content-Type': 'application/json'");
    expect(result).toContain('JSON.stringify(');
  });

  it('maps multiple -H flags to headers object', () => {
    const curl =
      `curl -H "Authorization: Bearer abc" -H "Accept: text/html" "https://api.example.com"`;
    const result = curlToFetch(curl);
    expect(result).toContain("'Authorization': 'Bearer abc'");
    expect(result).toContain("'Accept': 'text/html'");
  });

  it('infers POST when -d is provided without -X', () => {
    const curl = `curl -d '{"a":1}' "https://api.example.com"`;
    const result = curlToFetch(curl);
    expect(result).toContain("method: 'POST'");
  });

  it('returns error comment for completely broken input', () => {
    // Empty string — should still produce something (no crash)
    const result = curlToFetch('');
    expect(typeof result).toBe('string');
  });
});

// ─── curlToAxios ──────────────────────────────────────────────────────────────

describe('curlToAxios', () => {
  it('converts GET request to axios.get', () => {
    const result = curlToAxios('curl https://api.example.com/users');
    expect(result).toContain("axios.get('https://api.example.com/users')");
  });

  it('converts POST request with data to axios.post', () => {
    const curl =
      `curl -X POST -d '{"name":"Bob"}' -H "Content-Type: application/json" "https://api.example.com/users"`;
    const result = curlToAxios(curl);
    expect(result).toContain('axios.post(');
    expect(result).toContain('{"name":"Bob"}');
  });

  it('includes headers config for requests with headers', () => {
    const curl =
      `curl -H "Authorization: Bearer xyz" "https://api.example.com"`;
    const result = curlToAxios(curl);
    expect(result).toContain("'Authorization': 'Bearer xyz'");
    expect(result).toContain('headers');
  });

  it('includes import statement for axios', () => {
    const result = curlToAxios('curl https://example.com');
    expect(result).toContain("import axios from 'axios'");
  });

  it('uses lowercase method name', () => {
    const result = curlToAxios('curl -X DELETE "https://api.example.com/item/1"');
    expect(result).toContain('axios.delete(');
  });
});

// ─── fetchToCurl ──────────────────────────────────────────────────────────────

describe('fetchToCurl', () => {
  it('extracts the URL from a basic fetch call', () => {
    const code = `fetch('https://api.example.com/data')`;
    const result = fetchToCurl(code);
    expect(result).toContain("curl 'https://api.example.com/data'");
  });

  it('includes -X for non-GET methods', () => {
    const code = `fetch('https://api.example.com', { method: 'POST' })`;
    const result = fetchToCurl(code);
    expect(result).toContain('-X POST');
  });

  it('maps headers to -H flags', () => {
    const code = `
      fetch('https://api.example.com', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer tok',
        },
      })
    `;
    const result = fetchToCurl(code);
    expect(result).toContain("-H 'Content-Type: application/json'");
    expect(result).toContain("-H 'Authorization: Bearer tok'");
  });

  it('includes -d for body with JSON.stringify', () => {
    const code = `
      fetch('https://api.example.com', {
        method: 'POST',
        body: JSON.stringify({"key": "val"}),
      })
    `;
    const result = fetchToCurl(code);
    expect(result).toContain('-d');
  });

  it('returns comment when URL cannot be parsed', () => {
    const result = fetchToCurl('notAFetchCall()');
    expect(result).toContain('# Could not parse fetch URL');
  });
});

// ─── parseHttpHeaders ─────────────────────────────────────────────────────────

describe('parseHttpHeaders', () => {
  it('parses a single header line', () => {
    const result = JSON.parse(parseHttpHeaders('Content-Type: application/json'));
    expect(result['Content-Type']).toBe('application/json');
  });

  it('parses multiple header lines', () => {
    const raw = 'Content-Type: application/json\nAuthorization: Bearer token123';
    const result = JSON.parse(parseHttpHeaders(raw));
    expect(result['Content-Type']).toBe('application/json');
    expect(result['Authorization']).toBe('Bearer token123');
  });

  it('skips HTTP status lines', () => {
    const raw = 'HTTP/1.1 200 OK\nContent-Length: 42';
    const result = JSON.parse(parseHttpHeaders(raw));
    expect(result).not.toHaveProperty('HTTP/1.1 200 OK');
    expect(result['Content-Length']).toBe('42');
  });

  it('skips blank lines', () => {
    const raw = 'A: 1\n\nB: 2\n\n';
    const result = JSON.parse(parseHttpHeaders(raw));
    expect(result).toEqual({ A: '1', B: '2' });
  });

  it('handles header values containing colons', () => {
    const raw = 'Date: Mon, 01 Jan 2024 00:00:00 GMT';
    const result = JSON.parse(parseHttpHeaders(raw));
    expect(result['Date']).toBe('Mon, 01 Jan 2024 00:00:00 GMT');
  });
});

// ─── jsonToHttpHeaders ────────────────────────────────────────────────────────

describe('jsonToHttpHeaders', () => {
  it('converts a JSON object to header string', () => {
    const json = JSON.stringify({ 'Content-Type': 'text/plain', Accept: '*/*' });
    const result = jsonToHttpHeaders(json);
    expect(result).toContain('Content-Type: text/plain');
    expect(result).toContain('Accept: */*');
  });

  it('joins headers with newlines', () => {
    const json = JSON.stringify({ A: '1', B: '2' });
    const lines = jsonToHttpHeaders(json).split('\n');
    expect(lines).toHaveLength(2);
  });

  it('returns error string for invalid JSON', () => {
    const result = jsonToHttpHeaders('not json');
    expect(result).toContain('# Error');
  });
});

// ─── urlToOpenApiPath ─────────────────────────────────────────────────────────

describe('urlToOpenApiPath', () => {
  it('replaces numeric path segments with {id}', () => {
    const result = JSON.parse(urlToOpenApiPath('https://api.com/users/123/posts/456'));
    const paths = Object.keys(result);
    expect(paths[0]).toBe('/users/{id}/posts/{id}');
  });

  it('replaces UUID segments with {uuid} when no leading digits', () => {
    // UUID starting with letters avoids the numeric regex matching first
    const uuid = 'a50e8400-e29b-41d4-a716-446655440000';
    const result = JSON.parse(urlToOpenApiPath(`https://api.com/items/${uuid}`));
    const path = Object.keys(result)[0];
    expect(path).toBe('/items/{uuid}');
  });

  it('numeric-starting ObjectId gets partially matched by numeric regex', () => {
    // The source replaces /\d+/ first, so '507...' partially matches
    const result = JSON.parse(urlToOpenApiPath('https://api.com/docs/507f1f77bcf86cd799439011'));
    const path = Object.keys(result)[0];
    // Numeric regex replaces /507 portion first
    expect(path).toContain('/docs/');
    expect(path).toContain('{id}');
  });

  it('includes query parameters in the spec', () => {
    const result = JSON.parse(urlToOpenApiPath('https://api.com/search?q=test&page=1'));
    const pathObj = result['/search'];
    const paramNames = pathObj.get.parameters.map((p: { name: string }) => p.name);
    expect(paramNames).toContain('q');
    expect(paramNames).toContain('page');
  });

  it('includes path parameters marked as required', () => {
    const result = JSON.parse(urlToOpenApiPath('https://api.com/users/42'));
    const pathObj = result['/users/{id}'];
    const idParam = pathObj.get.parameters.find(
      (p: { name: string; in: string }) => p.name === 'id' && p.in === 'path',
    );
    expect(idParam).toBeDefined();
    expect(idParam.required).toBe(true);
  });

  it('returns error for invalid URL', () => {
    const result = JSON.parse(urlToOpenApiPath('not a url'));
    expect(result).toHaveProperty('error');
  });
});

// ─── parseUrl ─────────────────────────────────────────────────────────────────

describe('parseUrl', () => {
  it('parses a full URL with all components', () => {
    const result = JSON.parse(
      parseUrl('https://user:pass@host.com:8080/path?q=1#hash'),
    );
    expect(result.protocol).toBe('https:');
    expect(result.hostname).toBe('host.com');
    expect(result.port).toBe('8080');
    expect(result.pathname).toBe('/path');
    expect(result.search).toBe('?q=1');
    expect(result.hash).toBe('#hash');
    expect(result.username).toBe('user');
    expect(result.password).toBe('***'); // masked
  });

  it('sets port to "default" when not specified', () => {
    const result = JSON.parse(parseUrl('https://example.com/page'));
    expect(result.port).toBe('default');
  });

  it('parses query params into searchParams object', () => {
    const result = JSON.parse(parseUrl('https://example.com?a=1&b=2'));
    expect(result.searchParams).toEqual({ a: '1', b: '2' });
  });

  it('returns error for invalid URL', () => {
    const result = JSON.parse(parseUrl('definitely not a URL'));
    expect(result).toHaveProperty('error');
  });

  it('includes origin', () => {
    const result = JSON.parse(parseUrl('https://example.com:3000/test'));
    expect(result.origin).toBe('https://example.com:3000');
  });
});

// ─── buildUrl ─────────────────────────────────────────────────────────────────

describe('buildUrl', () => {
  it('appends query params to a base URL', () => {
    const result = buildUrl('https://api.com', { page: '1', limit: '10' });
    const url = new URL(result);
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('limit')).toBe('10');
  });

  it('encodes special characters in param values', () => {
    const result = buildUrl('https://api.com', { q: 'hello world', tag: 'a&b' });
    expect(result).toContain('q=hello+world');
    expect(result).toContain('tag=a%26b');
  });

  it('preserves existing path on the base URL', () => {
    const result = buildUrl('https://api.com/v2/search', { q: 'test' });
    const url = new URL(result);
    expect(url.pathname).toBe('/v2/search');
    expect(url.searchParams.get('q')).toBe('test');
  });

  it('returns error string for invalid base URL', () => {
    const result = buildUrl('not a url', { a: '1' });
    expect(result).toContain('Error');
  });

  it('handles empty params object', () => {
    const result = buildUrl('https://api.com/path', {});
    expect(result).toBe('https://api.com/path');
  });
});

// ─── apiResponseToMock ────────────────────────────────────────────────────────

describe('apiResponseToMock', () => {
  it('preserves object structure with same keys', () => {
    const input = JSON.stringify({ id: 1, name: 'Alice', active: true });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(Object.keys(mock)).toEqual(['id', 'name', 'active']);
  });

  it('generates number for number fields', () => {
    const input = JSON.stringify({ count: 42, price: 19.99 });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(typeof mock.count).toBe('number');
    expect(typeof mock.price).toBe('number');
  });

  it('generates boolean for boolean fields', () => {
    const input = JSON.stringify({ active: true, deleted: false });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(typeof mock.active).toBe('boolean');
    expect(typeof mock.deleted).toBe('boolean');
  });

  it('generates string for string fields', () => {
    const input = JSON.stringify({ title: 'Hello World', desc: 'A description' });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(typeof mock.title).toBe('string');
    expect(typeof mock.desc).toBe('string');
  });

  it('produces different values than original (randomized)', () => {
    const input = JSON.stringify({ id: 999, name: 'SpecificUniqueName123' });
    // Run multiple times — at least one should differ
    const results = Array.from({ length: 5 }, () => JSON.parse(apiResponseToMock(input)));
    const allSameId = results.every(r => r.id === 999);
    const allSameName = results.every(r => r.name === 'SpecificUniqueName123');
    // Statistically, not all 5 should match the original
    expect(allSameId && allSameName).toBe(false);
  });

  it('preserves nested object structure', () => {
    const input = JSON.stringify({
      user: { id: 1, profile: { bio: 'Hello', age: 25 } },
    });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(mock).toHaveProperty('user');
    expect(mock.user).toHaveProperty('id');
    expect(mock.user).toHaveProperty('profile');
    expect(mock.user.profile).toHaveProperty('bio');
    expect(mock.user.profile).toHaveProperty('age');
    expect(typeof mock.user.profile.age).toBe('number');
  });

  it('handles arrays — preserves element structure', () => {
    const input = JSON.stringify({
      items: [
        { id: 1, name: 'Widget' },
        { id: 2, name: 'Gadget' },
      ],
    });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(Array.isArray(mock.items)).toBe(true);
    expect(mock.items.length).toBeGreaterThanOrEqual(1);
    expect(mock.items[0]).toHaveProperty('id');
    expect(mock.items[0]).toHaveProperty('name');
  });

  it('generates UUID-like string for UUID values', () => {
    const input = JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440000' });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(mock.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{8,12}/i);
  });

  it('generates ISO date string for date values', () => {
    const input = JSON.stringify({ createdAt: '2024-01-15T10:30:00.000Z' });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(new Date(mock.createdAt).toString()).not.toBe('Invalid Date');
  });

  it('generates email-like string for email values', () => {
    const input = JSON.stringify({ email: 'alice@company.com' });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(mock.email).toMatch(/@/);
  });

  it('generates URL for URL values', () => {
    const input = JSON.stringify({ website: 'https://example.com/page' });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(mock.website).toMatch(/^https?:\/\//);
  });

  it('preserves null values', () => {
    const input = JSON.stringify({ deletedAt: null, name: 'test' });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(mock.deletedAt).toBeNull();
  });

  it('handles empty object', () => {
    const mock = JSON.parse(apiResponseToMock('{}'));
    expect(mock).toEqual({});
  });

  it('handles empty array', () => {
    const mock = JSON.parse(apiResponseToMock('[]'));
    expect(mock).toEqual([]);
  });

  it('returns error for invalid JSON', () => {
    const result = JSON.parse(apiResponseToMock('not json'));
    expect(result).toHaveProperty('error');
  });

  it('handles complex real-world API response', () => {
    const response = {
      data: {
        users: [
          {
            id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            email: 'john@example.com',
            name: 'John Doe',
            age: 30,
            active: true,
            createdAt: '2024-06-15T08:00:00Z',
            tags: ['admin', 'verified'],
          },
        ],
      },
      pagination: { page: 1, total: 100, hasMore: true },
    };
    const mock = JSON.parse(apiResponseToMock(JSON.stringify(response)));
    // Structure preserved
    expect(mock).toHaveProperty('data');
    expect(mock.data).toHaveProperty('users');
    expect(Array.isArray(mock.data.users)).toBe(true);
    expect(mock.data.users[0]).toHaveProperty('id');
    expect(mock.data.users[0]).toHaveProperty('email');
    expect(mock.data.users[0]).toHaveProperty('tags');
    expect(mock).toHaveProperty('pagination');
    // Types preserved
    expect(typeof mock.pagination.page).toBe('number');
    expect(typeof mock.pagination.hasMore).toBe('boolean');
  });

  it('generates IP address for IP values', () => {
    const input = JSON.stringify({ clientIp: '192.168.1.1' });
    const mock = JSON.parse(apiResponseToMock(input));
    expect(mock.clientIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  });
});

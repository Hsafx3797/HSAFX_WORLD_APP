/**
 * Tests for packages/tools/src/encoders
 * Base64, URL encoding, query strings, HTML entities
 */
import { describe, it, expect } from 'vitest';
import {
  encodeBase64,
  decodeBase64,
  encodeBase64Url,
  decodeBase64Url,
  encodeURL,
  decodeURL,
  parseQueryString,
  buildQueryString,
} from '../index.ts';

// ─── Base64 ──────────────────────────────────────────────
describe('Base64', () => {
  it('should encode and decode round-trip', () => {
    const input = 'Hello, World!';
    const encoded = encodeBase64(input);
    expect(decodeBase64(encoded)).toBe(input);
  });

  it('should encode known value', () => {
    expect(encodeBase64('Hello')).toBe('SGVsbG8=');
  });

  it('should handle unicode', () => {
    const input = 'こんにちは';
    expect(decodeBase64(encodeBase64(input))).toBe(input);
  });

  it('should handle empty string', () => {
    expect(encodeBase64('')).toBe('');
    expect(decodeBase64('')).toBe('');
  });
});

// ─── Base64 URL-safe ─────────────────────────────────────
describe('Base64 URL-safe', () => {
  it('should encode without +/= characters', () => {
    const encoded = encodeBase64Url('Hello, World!??');
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('should round-trip correctly', () => {
    const input = 'Hello, World! Some+special/chars==';
    expect(decodeBase64Url(encodeBase64Url(input))).toBe(input);
  });
});

// ─── URL Encoding ────────────────────────────────────────
describe('URL Encoding', () => {
  it('should encode special characters', () => {
    expect(encodeURL('hello world')).toBe('hello%20world');
    expect(encodeURL('a=1&b=2')).toBe('a%3D1%26b%3D2');
  });

  it('should decode encoded strings', () => {
    expect(decodeURL('hello%20world')).toBe('hello world');
    expect(decodeURL('a%3D1%26b%3D2')).toBe('a=1&b=2');
  });

  it('should round-trip', () => {
    const input = 'hello world & foo=bar';
    expect(decodeURL(encodeURL(input))).toBe(input);
  });
});

// ─── Query String ────────────────────────────────────────
describe('parseQueryString', () => {
  it('should parse simple params', () => {
    const result = parseQueryString('a=1&b=2');
    expect(result).toEqual({ a: '1', b: '2' });
  });

  it('should handle duplicate keys as arrays', () => {
    const result = parseQueryString('tag=a&tag=b&tag=c');
    expect(result.tag).toEqual(['a', 'b', 'c']);
  });

  it('should handle empty string', () => {
    expect(parseQueryString('')).toEqual({});
  });
});

describe('buildQueryString', () => {
  it('should build from simple params', () => {
    const result = buildQueryString({ a: '1', b: '2' });
    expect(result).toContain('a=1');
    expect(result).toContain('b=2');
  });

  it('should handle arrays', () => {
    const result = buildQueryString({ tag: ['a', 'b'] });
    expect(result).toBe('tag=a&tag=b');
  });

  it('should convert numbers and booleans', () => {
    const result = buildQueryString({ page: 1, active: true });
    expect(result).toContain('page=1');
    expect(result).toContain('active=true');
  });
});

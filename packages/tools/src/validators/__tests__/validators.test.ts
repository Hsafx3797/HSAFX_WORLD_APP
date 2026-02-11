/**
 * Tests for packages/tools/src/validators
 * Email, URL, phone, IP, UUID, and other validators
 */
import { describe, it, expect } from 'vitest';
import {
  isEmail,
  isURL,
  isPhoneNumber,
  isAlpha,
  isAlphanumeric,
  isNumeric,
  isInteger,
  isHexColor,
  isIPv4,
  isIPv6,
  isMACAddress,
  isUUID,
  isSlug,
} from '../index.ts';

// ─── isEmail ─────────────────────────────────────────────
describe('isEmail', () => {
  it('should validate correct emails', () => {
    expect(isEmail('user@example.com')).toBe(true);
    expect(isEmail('name@domain.org')).toBe(true);
    expect(isEmail('a.b@c.d.e')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isEmail('')).toBe(false);
    expect(isEmail('notanemail')).toBe(false);
    expect(isEmail('@domain.com')).toBe(false);
    expect(isEmail('user@')).toBe(false);
    expect(isEmail('user @domain.com')).toBe(false);
  });
});

// ─── isURL ───────────────────────────────────────────────
describe('isURL', () => {
  it('should validate correct URLs', () => {
    expect(isURL('https://example.com')).toBe(true);
    expect(isURL('http://localhost:3000')).toBe(true);
    expect(isURL('ftp://files.example.com/file.txt')).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(isURL('')).toBe(false);
    expect(isURL('not a url')).toBe(false);
    expect(isURL('example.com')).toBe(false); // no protocol
  });
});

// ─── isPhoneNumber ───────────────────────────────────────
describe('isPhoneNumber', () => {
  it('should validate international format', () => {
    expect(isPhoneNumber('+12025551234')).toBe(true);
    expect(isPhoneNumber('+442071234567')).toBe(true);
  });

  it('should validate with formatting', () => {
    expect(isPhoneNumber('+1 (202) 555-1234')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(isPhoneNumber('123')).toBe(false);
    expect(isPhoneNumber('abc')).toBe(false);
  });
});

// ─── isAlpha ─────────────────────────────────────────────
describe('isAlpha', () => {
  it('should accept only letters', () => {
    expect(isAlpha('hello')).toBe(true);
    expect(isAlpha('Hello')).toBe(true);
  });

  it('should reject non-alpha', () => {
    expect(isAlpha('hello1')).toBe(false);
    expect(isAlpha('hello world')).toBe(false);
    expect(isAlpha('')).toBe(false);
  });
});

// ─── isAlphanumeric ──────────────────────────────────────
describe('isAlphanumeric', () => {
  it('should accept letters and numbers', () => {
    expect(isAlphanumeric('hello123')).toBe(true);
    expect(isAlphanumeric('ABC')).toBe(true);
  });

  it('should reject special chars', () => {
    expect(isAlphanumeric('hello-world')).toBe(false);
    expect(isAlphanumeric('hello world')).toBe(false);
  });
});

// ─── isNumeric ───────────────────────────────────────────
describe('isNumeric', () => {
  it('should accept numeric strings', () => {
    expect(isNumeric('123')).toBe(true);
    expect(isNumeric('-42')).toBe(true);
    expect(isNumeric('3.14')).toBe(true);
  });

  it('should reject non-numeric', () => {
    expect(isNumeric('abc')).toBe(false);
    expect(isNumeric('12abc')).toBe(false);
    expect(isNumeric('')).toBe(false);
  });
});

// ─── isInteger ───────────────────────────────────────────
describe('isInteger', () => {
  it('should accept integers', () => {
    expect(isInteger('42')).toBe(true);
    expect(isInteger('-7')).toBe(true);
    expect(isInteger('0')).toBe(true);
  });

  it('should reject floats and non-numbers', () => {
    expect(isInteger('3.14')).toBe(false);
    expect(isInteger('abc')).toBe(false);
  });
});

// ─── isHexColor ──────────────────────────────────────────
describe('isHexColor', () => {
  it('should accept valid hex colors', () => {
    expect(isHexColor('#FF0000')).toBe(true);
    expect(isHexColor('FF0000')).toBe(true);
    expect(isHexColor('#FFF')).toBe(true);
    expect(isHexColor('abc')).toBe(true);
  });

  it('should reject invalid hex colors', () => {
    expect(isHexColor('#GGGGGG')).toBe(false);
    expect(isHexColor('#FFFF')).toBe(false);
    expect(isHexColor('')).toBe(false);
  });
});

// ─── isIPv4 ──────────────────────────────────────────────
describe('isIPv4', () => {
  it('should validate correct IPv4 addresses', () => {
    expect(isIPv4('192.168.1.1')).toBe(true);
    expect(isIPv4('0.0.0.0')).toBe(true);
    expect(isIPv4('255.255.255.255')).toBe(true);
  });

  it('should reject invalid IPv4 addresses', () => {
    expect(isIPv4('256.1.1.1')).toBe(false);
    expect(isIPv4('1.2.3')).toBe(false);
    expect(isIPv4('1.2.3.4.5')).toBe(false);
    expect(isIPv4('abc.def.ghi.jkl')).toBe(false);
    expect(isIPv4('01.02.03.04')).toBe(false); // leading zeros
  });
});

// ─── isIPv6 ──────────────────────────────────────────────
describe('isIPv6', () => {
  it('should validate correct IPv6 addresses', () => {
    expect(isIPv6('::1')).toBe(true);
    expect(isIPv6('::')).toBe(true);
    expect(isIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
  });

  it('should reject invalid IPv6 addresses', () => {
    expect(isIPv6('192.168.1.1')).toBe(false);
    expect(isIPv6('not-an-ip')).toBe(false);
  });
});

// ─── isMACAddress ────────────────────────────────────────
describe('isMACAddress', () => {
  it('should validate MAC addresses with colons', () => {
    expect(isMACAddress('00:1B:44:11:3A:B7')).toBe(true);
  });

  it('should validate MAC addresses with hyphens', () => {
    expect(isMACAddress('00-1B-44-11-3A-B7')).toBe(true);
  });

  it('should reject invalid MAC addresses', () => {
    expect(isMACAddress('not-a-mac')).toBe(false);
    expect(isMACAddress('00:1B:44')).toBe(false);
  });
});

// ─── isUUID ──────────────────────────────────────────────
describe('isUUID', () => {
  it('should validate UUID v4', () => {
    expect(isUUID('550e8400-e29b-41d4-a716-446655440000', 4)).toBe(true);
  });

  it('should validate any UUID version by default', () => {
    expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('should reject invalid UUIDs', () => {
    expect(isUUID('not-a-uuid')).toBe(false);
    expect(isUUID('')).toBe(false);
    expect(isUUID('12345678-1234-1234-1234-12345678901')).toBe(false); // too short
  });
});

// ─── isSlug ──────────────────────────────────────────────
describe('isSlug', () => {
  it('should validate slugs', () => {
    expect(isSlug('hello-world')).toBe(true);
    expect(isSlug('my-post-123')).toBe(true);
    expect(isSlug('simple')).toBe(true);
  });

  it('should reject invalid slugs', () => {
    expect(isSlug('Hello World')).toBe(false);
    expect(isSlug('UPPER')).toBe(false);
    expect(isSlug('-start-dash')).toBe(false);
    expect(isSlug('end-dash-')).toBe(false);
  });
});

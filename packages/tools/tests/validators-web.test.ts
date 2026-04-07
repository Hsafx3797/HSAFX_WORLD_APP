/**
 * Tests for validators/web.ts
 * All web validators returning ValidationResult with valid, error, details
 */
import { describe, it, expect } from 'vitest';

import {
  validateEmail,
  validateUrl,
  validateUuid,
  validateIpAddress,
  validateCreditCard,
  validatePhoneNumber,
  validateMacAddress,
  validateIsbn,
  validateIban,
  validateHexColor,
  validateDate,
  validateSemver,
  validateTime24h,
  validateSlug,
  validateBase64,
  validateJwt,
  validateCronExpression,
  validatePasswordStrength,
} from '../src/validators/web';

// =====================================================================
// EMAIL
// =====================================================================
describe('web validateEmail', () => {
  it('valid email', () => {
    const r = validateEmail('user@example.com');
    expect(r.valid).toBe(true);
    expect(r.details?.localPart).toBe('user');
    expect(r.details?.domain).toBe('example.com');
  });
  it('invalid email', () => {
    const r = validateEmail('not-an-email');
    expect(r.valid).toBe(false);
    expect(r.error).toBeDefined();
  });
});

// =====================================================================
// URL
// =====================================================================
describe('web validateUrl', () => {
  it('valid URL with details', () => {
    const r = validateUrl('https://example.com/path?q=1');
    expect(r.valid).toBe(true);
    expect(r.details?.protocol).toBe('https:');
    expect(r.details?.hostname).toBe('example.com');
    expect(r.details?.pathname).toBe('/path');
  });
  it('invalid URL', () => {
    expect(validateUrl('not a url').valid).toBe(false);
  });
});

// =====================================================================
// UUID
// =====================================================================
describe('web validateUuid', () => {
  it('valid v4 UUID', () => {
    const r = validateUuid('550e8400-e29b-41d4-a716-446655440000');
    expect(r.valid).toBe(true);
    expect(r.details?.version).toBe(4);
  });
  it('valid v1 UUID', () => {
    const r = validateUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    expect(r.valid).toBe(true);
    expect(r.details?.version).toBe(1);
  });
  it('invalid UUID', () => {
    expect(validateUuid('not-a-uuid').valid).toBe(false);
  });
});

// =====================================================================
// IP ADDRESS
// =====================================================================
describe('web validateIpAddress', () => {
  it('valid IPv4', () => {
    const r = validateIpAddress('192.168.1.1');
    expect(r.valid).toBe(true);
    expect(r.details?.type).toBe('IPv4');
  });
  it('invalid IPv4 (octet > 255)', () => {
    expect(validateIpAddress('256.0.0.1').valid).toBe(false);
  });
  it('valid IPv6 loopback', () => {
    const r = validateIpAddress('::1');
    expect(r.valid).toBe(true);
    expect(r.details?.type).toBe('IPv6');
  });
  it('invalid IP', () => {
    expect(validateIpAddress('abc').valid).toBe(false);
  });
});

// =====================================================================
// CREDIT CARD (Luhn)
// =====================================================================
describe('web validateCreditCard', () => {
  it('valid Visa', () => {
    const r = validateCreditCard('4111111111111111');
    expect(r.valid).toBe(true);
    expect(r.details?.cardType).toBe('Visa');
    expect(r.details?.maskedNumber).toBe('****1111');
  });
  it('valid Mastercard', () => {
    const r = validateCreditCard('5500000000000004');
    expect(r.valid).toBe(true);
    expect(r.details?.cardType).toBe('Mastercard');
  });
  it('invalid Luhn', () => {
    expect(validateCreditCard('4111111111111112').valid).toBe(false);
  });
  it('too short', () => {
    expect(validateCreditCard('123').valid).toBe(false);
  });
});

// =====================================================================
// PHONE NUMBER
// =====================================================================
describe('web validatePhoneNumber', () => {
  it('valid E.164', () => {
    const r = validatePhoneNumber('+12125551234');
    expect(r.valid).toBe(true);
    expect(r.details?.hasCountryCode).toBe(true);
  });
  it('valid without +', () => {
    expect(validatePhoneNumber('12125551234').valid).toBe(true);
  });
  it('invalid', () => {
    expect(validatePhoneNumber('abc').valid).toBe(false);
  });
});

// =====================================================================
// MAC ADDRESS
// =====================================================================
describe('web validateMacAddress', () => {
  it('valid colon-separated', () => {
    const r = validateMacAddress('00:1A:2B:3C:4D:5E');
    expect(r.valid).toBe(true);
  });
  it('valid dash-separated', () => {
    expect(validateMacAddress('00-1A-2B-3C-4D-5E').valid).toBe(true);
  });
  it('invalid', () => {
    expect(validateMacAddress('not-a-mac').valid).toBe(false);
  });
});

// =====================================================================
// ISBN
// =====================================================================
describe('web validateIsbn', () => {
  it('valid ISBN-10', () => {
    const r = validateIsbn('0-306-40615-2');
    expect(r.valid).toBe(true);
    expect(r.details?.type).toBe('ISBN-10');
  });
  it('valid ISBN-13', () => {
    const r = validateIsbn('978-0-306-40615-7');
    expect(r.valid).toBe(true);
    expect(r.details?.type).toBe('ISBN-13');
  });
  it('invalid length', () => {
    expect(validateIsbn('123').valid).toBe(false);
  });
  it('invalid ISBN-10 checksum', () => {
    expect(validateIsbn('0-306-40615-3').valid).toBe(false);
  });
});

// =====================================================================
// IBAN
// =====================================================================
describe('web validateIban', () => {
  it('valid GB IBAN', () => {
    const r = validateIban('GB29 NWBK 6016 1331 9268 19');
    expect(r.valid).toBe(true);
    expect(r.details?.countryCode).toBe('GB');
  });
  it('invalid IBAN checksum', () => {
    expect(validateIban('GB00 NWBK 6016 1331 9268 19').valid).toBe(false);
  });
  it('too short', () => {
    expect(validateIban('GB29').valid).toBe(false);
  });
});

// =====================================================================
// HEX COLOR
// =====================================================================
describe('web validateHexColor', () => {
  it('valid 6-digit with #', () => {
    const r = validateHexColor('#ff0000');
    expect(r.valid).toBe(true);
    expect(r.details?.hasAlpha).toBe(false);
  });
  it('valid 3-digit', () => {
    expect(validateHexColor('#fff').valid).toBe(true);
  });
  it('valid 8-digit (alpha)', () => {
    const r = validateHexColor('#ff000080');
    expect(r.valid).toBe(true);
    expect(r.details?.hasAlpha).toBe(true);
  });
  it('invalid hex', () => {
    expect(validateHexColor('#xyz').valid).toBe(false);
  });
});

// =====================================================================
// DATE
// =====================================================================
describe('web validateDate', () => {
  it('valid YYYY-MM-DD', () => {
    const r = validateDate('2024-01-15');
    expect(r.valid).toBe(true);
    expect(r.details?.iso).toBeDefined();
  });
  it('invalid format', () => {
    expect(validateDate('2024/01/15').valid).toBe(false);
  });
  it('unsupported format', () => {
    expect(validateDate('2024-01-15', 'INVALID' as 'YYYY-MM-DD').valid).toBe(false);
  });
});

// =====================================================================
// SEMVER
// =====================================================================
describe('web validateSemver', () => {
  it('valid semver', () => {
    const r = validateSemver('1.2.3');
    expect(r.valid).toBe(true);
    expect(r.details?.major).toBe(1);
    expect(r.details?.minor).toBe(2);
    expect(r.details?.patch).toBe(3);
  });
  it('valid with prerelease', () => {
    const r = validateSemver('1.0.0-alpha.1');
    expect(r.valid).toBe(true);
    expect(r.details?.prerelease).toBe('alpha.1');
  });
  it('valid with v prefix', () => {
    expect(validateSemver('v2.0.0').valid).toBe(true);
  });
  it('invalid semver', () => {
    expect(validateSemver('1.2').valid).toBe(false);
  });
});

// =====================================================================
// TIME 24H
// =====================================================================
describe('web validateTime24h', () => {
  it('valid time with seconds', () => {
    const r = validateTime24h('14:30:00');
    expect(r.valid).toBe(true);
    expect(r.details?.hours).toBe(14);
    expect(r.details?.minutes).toBe(30);
    expect(r.details?.seconds).toBe(0);
  });
  it('valid time without seconds', () => {
    const r = validateTime24h('08:15');
    expect(r.valid).toBe(true);
    expect(r.details?.seconds).toBeUndefined();
  });
  it('invalid hour > 23', () => {
    expect(validateTime24h('25:00').valid).toBe(false);
  });
});

// =====================================================================
// SLUG
// =====================================================================
describe('web validateSlug', () => {
  it('valid slug', () => {
    expect(validateSlug('hello-world').valid).toBe(true);
  });
  it('invalid slug with uppercase', () => {
    expect(validateSlug('Hello').valid).toBe(false);
  });
  it('invalid slug with spaces', () => {
    expect(validateSlug('hello world').valid).toBe(false);
  });
});

// =====================================================================
// BASE64
// =====================================================================
describe('web validateBase64', () => {
  it('valid base64', () => {
    const r = validateBase64('SGVsbG8=');
    expect(r.valid).toBe(true);
  });
  it('invalid base64 (wrong padding)', () => {
    expect(validateBase64('SGVsbG8').valid).toBe(false);
  });
});

// =====================================================================
// JWT
// =====================================================================
describe('web validateJwt', () => {
  it('valid JWT', () => {
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const r = validateJwt(token);
    expect(r.valid).toBe(true);
    expect(r.details?.algorithm).toBe('HS256');
    expect(r.details?.type).toBe('JWT');
    expect(r.details?.subject).toBe('1234567890');
  });
  it('invalid JWT (not 3 parts)', () => {
    expect(validateJwt('not.ajwt').valid).toBe(false);
  });
});

// =====================================================================
// CRON
// =====================================================================
describe('web validateCronExpression', () => {
  it('valid 5-field cron', () => {
    const r = validateCronExpression('*/5 * * * *');
    expect(r.valid).toBe(true);
  });
  it('valid 6-field cron', () => {
    const r = validateCronExpression('0 */5 * * * *');
    expect(r.valid).toBe(true);
  });
  it('invalid field count', () => {
    expect(validateCronExpression('* * *').valid).toBe(false);
  });
});

// =====================================================================
// PASSWORD STRENGTH
// =====================================================================
describe('web validatePasswordStrength', () => {
  it('strong password', () => {
    const r = validatePasswordStrength('MyStr0ng!Pass');
    expect(r.valid).toBe(true);
    expect(r.details?.strength).toBe('strong');
    expect(r.details?.score).toBe(5);
  });
  it('weak password', () => {
    const r = validatePasswordStrength('abc');
    expect(r.valid).toBe(false);
    expect(r.details?.strength).toBe('weak');
  });
  it('fair password', () => {
    const r = validatePasswordStrength('Password1');
    expect(r.valid).toBe(true);
    expect((r.details?.score as number)).toBeGreaterThanOrEqual(3);
  });
});

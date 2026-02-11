import { describe, it, expect } from 'vitest';
import {
  generateUUID,
  generateNanoId,
  generateSlug,
  generatePassword,
  generatePassphrase,
  generatePerson,
  generateCompany,
  generateCreditCard,
  generateRandomColor,
  generateColorPalette,
  generateGradient,
  qrCodeData,
} from '../index';

// ── Helper: Luhn check ──────────────────────────────────────────────
function luhnCheck(num: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// ─────────────────────────────────────────────────────────────────────
// 1. generateUUID
// ─────────────────────────────────────────────────────────────────────
describe('generateUUID', () => {
  const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('returns a string matching UUID v4 format', () => {
    expect(generateUUID()).toMatch(UUID_V4_RE);
  });

  it('two consecutive calls produce different UUIDs', () => {
    expect(generateUUID()).not.toBe(generateUUID());
  });

  it('returns a 36-character string', () => {
    expect(generateUUID()).toHaveLength(36);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 2. generateNanoId
// ─────────────────────────────────────────────────────────────────────
describe('generateNanoId', () => {
  it('default length is 21', () => {
    expect(generateNanoId()).toHaveLength(21);
  });

  it('custom length (10) returns string of length 10', () => {
    expect(generateNanoId(10)).toHaveLength(10);
  });

  it('custom length (50) returns string of length 50', () => {
    expect(generateNanoId(50)).toHaveLength(50);
  });

  it('only contains valid characters [A-Za-z0-9_-]', () => {
    const id = generateNanoId(100);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('two calls produce different ids', () => {
    expect(generateNanoId()).not.toBe(generateNanoId());
  });
});

// ─────────────────────────────────────────────────────────────────────
// 3. generateSlug
// ─────────────────────────────────────────────────────────────────────
describe('generateSlug', () => {
  it('default returns a truthy string', () => {
    expect(generateSlug()).toBeTruthy();
  });

  it('contains hyphens (word separator)', () => {
    // Use a large length so multiple words are joined
    const slug = generateSlug(30);
    expect(slug).toContain('-');
  });

  it('respects maximum length', () => {
    expect(generateSlug(8).length).toBeLessThanOrEqual(8);
  });

  it('returns only lowercase letters and hyphens', () => {
    const slug = generateSlug(30);
    expect(slug).toMatch(/^[a-z-]+$/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 4. generatePassword
// ─────────────────────────────────────────────────────────────────────
describe('generatePassword', () => {
  it('default length is 16', () => {
    expect(generatePassword()).toHaveLength(16);
  });

  it('custom length (32) returns length 32', () => {
    expect(generatePassword({ length: 32 })).toHaveLength(32);
  });

  it('custom length (8) returns length 8', () => {
    expect(generatePassword({ length: 8 })).toHaveLength(8);
  });

  it('includeUppercase produces at least one uppercase letter', () => {
    const pw = generatePassword({
      length: 32,
      includeUppercase: true,
      includeLowercase: false,
      includeNumbers: false,
      includeSymbols: false,
    });
    expect(pw).toMatch(/[A-Z]/);
  });

  it('includeNumbers produces at least one digit', () => {
    const pw = generatePassword({
      length: 32,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
    });
    expect(pw).toMatch(/[0-9]/);
  });

  it('includeSymbols produces at least one special character', () => {
    const pw = generatePassword({
      length: 32,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: false,
      includeSymbols: true,
    });
    expect(pw).toMatch(/[^A-Za-z0-9]/);
  });

  it('throws when no character types are selected', () => {
    expect(() =>
      generatePassword({
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      }),
    ).toThrow('No character types selected');
  });

  it('requireEveryType ensures all selected types present', () => {
    for (let i = 0; i < 5; i++) {
      const pw = generatePassword({
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        requireEveryType: true,
      });
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[^A-Za-z0-9]/);
    }
  });

  it('excludeAmbiguous removes I, O, l, 0, 1', () => {
    // Generate many passwords and concat them to raise probability
    let combined = '';
    for (let i = 0; i < 20; i++) {
      combined += generatePassword({
        length: 64,
        excludeAmbiguous: true,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
      });
    }
    expect(combined).not.toMatch(/[IOl01]/);
  });

  it('excludeChars removes specified characters', () => {
    let combined = '';
    for (let i = 0; i < 20; i++) {
      combined += generatePassword({
        length: 64,
        excludeChars: 'abc',
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
      });
    }
    expect(combined).not.toMatch(/[abc]/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 5. generatePassphrase
// ─────────────────────────────────────────────────────────────────────
describe('generatePassphrase', () => {
  it('default returns 4 words joined by hyphens', () => {
    const phrase = generatePassphrase();
    const parts = phrase.split('-');
    expect(parts).toHaveLength(4);
  });

  it('custom separator ("_") is used', () => {
    const phrase = generatePassphrase(4, '_');
    expect(phrase).toContain('_');
    expect(phrase.split('_')).toHaveLength(4);
  });

  it('custom word count (6) produces 6 segments', () => {
    const phrase = generatePassphrase(6);
    expect(phrase.split('-')).toHaveLength(6);
  });

  it('each word is lowercase alphabetic', () => {
    const words = generatePassphrase().split('-');
    words.forEach((w) => expect(w).toMatch(/^[a-z]+$/));
  });

  it('two calls produce different passphrases (very likely)', () => {
    expect(generatePassphrase(6)).not.toBe(generatePassphrase(6));
  });
});

// ─────────────────────────────────────────────────────────────────────
// 6. generatePerson
// ─────────────────────────────────────────────────────────────────────
describe('generatePerson', () => {
  it('returns all expected keys', () => {
    const p = generatePerson();
    expect(p).toHaveProperty('firstName');
    expect(p).toHaveProperty('lastName');
    expect(p).toHaveProperty('fullName');
    expect(p).toHaveProperty('email');
    expect(p).toHaveProperty('phone');
    expect(p).toHaveProperty('address');
    expect(p).toHaveProperty('birthDate');
    expect(p).toHaveProperty('ssn');
  });

  it('email contains "@"', () => {
    expect(generatePerson().email).toContain('@');
  });

  it('address contains street, city, state, zip, country', () => {
    const addr = generatePerson().address;
    expect(addr).toHaveProperty('street');
    expect(addr).toHaveProperty('city');
    expect(addr).toHaveProperty('state');
    expect(addr).toHaveProperty('zip');
    expect(addr).toHaveProperty('country');
  });

  it('fullName equals firstName + " " + lastName', () => {
    const p = generatePerson();
    expect(p.fullName).toBe(`${p.firstName} ${p.lastName}`);
  });

  it('birthDate matches YYYY-MM-DD format', () => {
    expect(generatePerson().birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('ssn matches NNN-NN-NNNN format', () => {
    expect(generatePerson().ssn).toMatch(/^\d{3}-\d{2}-\d{4}$/);
  });

  it('phone matches (NNN) NNN-NNNN format', () => {
    expect(generatePerson().phone).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
  });

  it('address.country is "USA"', () => {
    expect(generatePerson().address.country).toBe('USA');
  });
});

// ─────────────────────────────────────────────────────────────────────
// 7. generateCompany
// ─────────────────────────────────────────────────────────────────────
describe('generateCompany', () => {
  it('returns all expected keys', () => {
    const c = generateCompany();
    expect(c).toHaveProperty('name');
    expect(c).toHaveProperty('suffix');
    expect(c).toHaveProperty('fullName');
    expect(c).toHaveProperty('industry');
    expect(c).toHaveProperty('catchPhrase');
    expect(c).toHaveProperty('website');
    expect(c).toHaveProperty('email');
    expect(c).toHaveProperty('phone');
  });

  it('website starts with "https://"', () => {
    expect(generateCompany().website).toMatch(/^https:\/\//);
  });

  it('email contains "@"', () => {
    expect(generateCompany().email).toContain('@');
  });

  it('fullName contains the suffix', () => {
    const c = generateCompany();
    expect(c.fullName).toContain(c.suffix);
  });

  it('fullName contains the name', () => {
    const c = generateCompany();
    expect(c.fullName).toContain(c.name);
  });

  it('phone starts with "1-800-"', () => {
    expect(generateCompany().phone).toMatch(/^1-800-/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 8. generateCreditCard
// ─────────────────────────────────────────────────────────────────────
describe('generateCreditCard', () => {
  it('default returns valid structure', () => {
    const card = generateCreditCard();
    expect(card).toHaveProperty('number');
    expect(card).toHaveProperty('type');
    expect(card).toHaveProperty('expiryMonth');
    expect(card).toHaveProperty('expiryYear');
    expect(card).toHaveProperty('expiry');
    expect(card).toHaveProperty('cvv');
    expect(card).toHaveProperty('holder');
  });

  it('Visa starts with "4" and has length 16', () => {
    const card = generateCreditCard('visa');
    expect(card.number).toHaveLength(16);
    expect(card.number[0]).toBe('4');
  });

  it('Mastercard starts with "5" and has length 16', () => {
    const card = generateCreditCard('mastercard');
    expect(card.number).toHaveLength(16);
    expect(card.number[0]).toBe('5');
  });

  it('Amex starts with "3" and has length 15', () => {
    const card = generateCreditCard('amex');
    expect(card.number).toHaveLength(15);
    expect(card.number[0]).toBe('3');
  });

  it('Discover starts with "6011" and has length 16', () => {
    const card = generateCreditCard('discover');
    expect(card.number).toHaveLength(16);
    expect(card.number.startsWith('6011')).toBe(true);
  });

  it('Amex CVV is 4 digits', () => {
    const card = generateCreditCard('amex');
    expect(card.cvv).toHaveLength(4);
    expect(card.cvv).toMatch(/^\d{4}$/);
  });

  it('Non-Amex CVV is 3 digits', () => {
    const card = generateCreditCard('visa');
    expect(card.cvv).toHaveLength(3);
    expect(card.cvv).toMatch(/^\d{3}$/);
  });

  it('Visa number passes Luhn algorithm', () => {
    expect(luhnCheck(generateCreditCard('visa').number)).toBe(true);
  });

  it('Mastercard number passes Luhn algorithm', () => {
    expect(luhnCheck(generateCreditCard('mastercard').number)).toBe(true);
  });

  it('Amex number passes Luhn algorithm', () => {
    expect(luhnCheck(generateCreditCard('amex').number)).toBe(true);
  });

  it('Discover number passes Luhn algorithm', () => {
    expect(luhnCheck(generateCreditCard('discover').number)).toBe(true);
  });

  it('expiry matches MM/YY format', () => {
    expect(generateCreditCard().expiry).toMatch(/^\d{2}\/\d{2}$/);
  });

  it('holder is uppercase', () => {
    const holder = generateCreditCard().holder;
    expect(holder).toBe(holder.toUpperCase());
  });

  it('type is capitalized', () => {
    const card = generateCreditCard('visa');
    expect(card.type).toBe('Visa');
  });
});

// ─────────────────────────────────────────────────────────────────────
// 9. generateRandomColor
// ─────────────────────────────────────────────────────────────────────
describe('generateRandomColor', () => {
  it('returns "#" followed by 6 hex characters', () => {
    expect(generateRandomColor()).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('always starts with "#"', () => {
    expect(generateRandomColor().startsWith('#')).toBe(true);
  });

  it('has length 7', () => {
    expect(generateRandomColor()).toHaveLength(7);
  });

  it('two calls can produce different colors', () => {
    const colors = new Set(Array.from({ length: 20 }, () => generateRandomColor()));
    expect(colors.size).toBeGreaterThan(1);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 10. generateColorPalette
// ─────────────────────────────────────────────────────────────────────
describe('generateColorPalette', () => {
  it('returns array of default length 5', () => {
    expect(generateColorPalette('#ff0000')).toHaveLength(5);
  });

  it('returns array of custom length', () => {
    expect(generateColorPalette('#00ff00', 8)).toHaveLength(8);
  });

  it('first element is the baseColor', () => {
    expect(generateColorPalette('#abcdef')[0]).toBe('#abcdef');
  });

  it('all elements are valid hex colors', () => {
    const palette = generateColorPalette('#112233', 6);
    palette.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/));
  });

  it('palette of 1 contains only the base color', () => {
    const palette = generateColorPalette('#ff0000', 1);
    expect(palette).toEqual(['#ff0000']);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 11. generateGradient
// ─────────────────────────────────────────────────────────────────────
describe('generateGradient', () => {
  it('returns array of default length 5', () => {
    expect(generateGradient('#000000', '#ffffff')).toHaveLength(5);
  });

  it('returns array of custom length', () => {
    expect(generateGradient('#000000', '#ffffff', 10)).toHaveLength(10);
  });

  it('first element is color1', () => {
    expect(generateGradient('#ff0000', '#0000ff')[0]).toBe('#ff0000');
  });

  it('last element is color2', () => {
    const g = generateGradient('#ff0000', '#0000ff');
    expect(g[g.length - 1]).toBe('#0000ff');
  });

  it('all elements are valid hex colors', () => {
    const g = generateGradient('#112233', '#aabbcc', 7);
    g.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/));
  });

  it('gradient from black to white midpoint is grey', () => {
    const g = generateGradient('#000000', '#ffffff', 3);
    // Midpoint should be approximately #808080 (rounding)
    expect(g[1]).toMatch(/^#[78][0-9a-f][78][0-9a-f][78][0-9a-f]$/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 12. qrCodeData
// ─────────────────────────────────────────────────────────────────────
describe('qrCodeData', () => {
  it('wifi() contains "WIFI:T:WPA"', () => {
    expect(qrCodeData.wifi('MyNet', 'pass123')).toContain('WIFI:T:WPA');
  });

  it('wifi() includes SSID and password', () => {
    const result = qrCodeData.wifi('TestSSID', 'secret');
    expect(result).toContain('S:TestSSID');
    expect(result).toContain('P:secret');
  });

  it('wifi() supports WEP encryption', () => {
    expect(qrCodeData.wifi('Net', 'pw', 'WEP')).toContain('WIFI:T:WEP');
  });

  it('wifi() supports nopass', () => {
    expect(qrCodeData.wifi('Open', '', 'nopass')).toContain('WIFI:T:nopass');
  });

  it('vcard() contains "BEGIN:VCARD"', () => {
    const result = qrCodeData.vcard({ firstName: 'John', lastName: 'Doe' });
    expect(result).toContain('BEGIN:VCARD');
  });

  it('vcard() contains "END:VCARD"', () => {
    const result = qrCodeData.vcard({ firstName: 'Jane', lastName: 'Smith' });
    expect(result).toContain('END:VCARD');
  });

  it('vcard() includes optional email when provided', () => {
    const result = qrCodeData.vcard({
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
    });
    expect(result).toContain('EMAIL:a@b.com');
  });

  it('vcard() includes optional phone when provided', () => {
    const result = qrCodeData.vcard({
      firstName: 'A',
      lastName: 'B',
      phone: '+1234567890',
    });
    expect(result).toContain('TEL:+1234567890');
  });

  it('sms() returns SMSTO format', () => {
    expect(qrCodeData.sms('+1234567890')).toBe('SMSTO:+1234567890');
  });

  it('sms() includes message when provided', () => {
    expect(qrCodeData.sms('+1234', 'Hello')).toBe('SMSTO:+1234:Hello');
  });

  it('email() returns mailto format', () => {
    const result = qrCodeData.email('test@example.com');
    expect(result).toBe('mailto:test@example.com');
  });

  it('email() includes subject and body', () => {
    const result = qrCodeData.email('a@b.com', 'Hi', 'Body text');
    expect(result).toContain('mailto:a@b.com');
    expect(result).toContain('subject=');
    expect(result).toContain('body=');
  });

  it('phone() returns tel format', () => {
    expect(qrCodeData.phone('+9876543210')).toBe('tel:+9876543210');
  });

  it('geo() returns geo format', () => {
    expect(qrCodeData.geo(40.7128, -74.006)).toBe('geo:40.7128,-74.006');
  });

  it('url() returns the url as-is', () => {
    expect(qrCodeData.url('https://example.com')).toBe('https://example.com');
  });

  it('text() returns the text as-is', () => {
    expect(qrCodeData.text('Hello World!')).toBe('Hello World!');
  });
});

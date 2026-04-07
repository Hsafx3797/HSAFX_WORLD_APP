import { describe, it, expect } from 'vitest';
import { writeOutput } from './helpers';
import {
  generateUuidV1,
  generateUuidV4,
  generateUuidV5,
  generateUuidV7,
  generateNanoId,
  generateCuid,
  generateUlid,
  generateObjectId,
  generatePassword,
  generatePassphrase,
  generateHash,
  generateFakeEmail,
  generateFakeName,
  generateFakePhone,
  generateFakeAddress,
  generateRandomColor,
  generateSlug,
  generateRandomNumber,
  generateRandomString,
  generateRandomDate,
  generateChecksum,
  generateSqlInsert,
  generateEmailRegex,
  generateUrlRegex,
  generatePhoneRegex,
  generateTimestamp,
  generateApiKey,
  generateJwt,
  generateLoremIpsum,
  generateUsername,
  generateQuote,
  generateRandomNumbers,
  generateQrCode,
  generateSignature,
  generateColorPalette,
  generatePlaceholderImage,
  generateFaviconHtml,
  generateVCardQr,
  searchEmoji,
} from '../src/generators/web';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ==================== ID GENERATORS ====================

describe('UUID generators', () => {
  it('generateUuidV1 produces valid UUID', () => {
    const uuid = generateUuidV1();
    writeOutput('generators', 'uuid-v1.txt', uuid);
    expect(uuid).toMatch(UUID_REGEX);
    expect(uuid.charAt(14)).toBe('1');
  });

  it('generateUuidV4 produces valid UUID', () => {
    const uuid = generateUuidV4();
    writeOutput('generators', 'uuid-v4.txt', uuid);
    expect(uuid).toMatch(UUID_REGEX);
    expect(uuid.charAt(14)).toBe('4');
  });

  it('generateUuidV5 produces deterministic UUID', () => {
    const ns = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace
    const uuid1 = generateUuidV5(ns, 'example.com');
    const uuid2 = generateUuidV5(ns, 'example.com');
    writeOutput('generators', 'uuid-v5.txt', uuid1);
    expect(uuid1).toMatch(UUID_REGEX);
    expect(uuid1).toBe(uuid2); // deterministic
    expect(uuid1.charAt(14)).toBe('5');
  });

  it('generateUuidV7 produces valid UUID', () => {
    const uuid = generateUuidV7();
    writeOutput('generators', 'uuid-v7.txt', uuid);
    expect(uuid).toMatch(UUID_REGEX);
    expect(uuid.charAt(14)).toBe('7');
  });

  it('generateUuidV4 produces unique values', () => {
    const set = new Set(Array.from({ length: 100 }, () => generateUuidV4()));
    expect(set.size).toBe(100);
  });
});

describe('other ID generators', () => {
  it('generateNanoId produces string of correct length', () => {
    const id = generateNanoId();
    writeOutput('generators', 'nanoid.txt', id);
    expect(id).toHaveLength(21);
  });

  it('generateNanoId accepts custom size', () => {
    const id = generateNanoId(10);
    expect(id).toHaveLength(10);
  });

  it('generateCuid produces valid CUID', () => {
    const id = generateCuid();
    writeOutput('generators', 'cuid.txt', id);
    expect(id.length).toBeGreaterThan(0);
  });

  it('generateUlid produces 26-char string', () => {
    const id = generateUlid();
    writeOutput('generators', 'ulid.txt', id);
    expect(id).toHaveLength(26);
    expect(id).toMatch(/^[0-9A-Z]+$/);
  });

  it('generateObjectId produces 24-char hex string', () => {
    const id = generateObjectId();
    writeOutput('generators', 'objectid.txt', id);
    expect(id).toHaveLength(24);
    expect(id).toMatch(/^[0-9a-f]+$/);
  });
});

// ==================== PASSWORD / PASSPHRASE ====================

describe('generatePassword', () => {
  it('generates password with default options', () => {
    const pwd = generatePassword();
    writeOutput('generators', 'password-default.txt', pwd);
    expect(pwd.length).toBeGreaterThanOrEqual(8);
  });

  it('generates password with custom length', () => {
    const pwd = generatePassword(32);
    expect(pwd).toHaveLength(32);
  });

  it('generates password with options object', () => {
    const pwd = generatePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
    writeOutput('generators', 'password-strong.txt', pwd);
    expect(pwd).toHaveLength(16);
  });

  it('generates password without symbols', () => {
    const pwd = generatePassword({ length: 20, symbols: false });
    expect(pwd).toMatch(/^[A-Za-z0-9]+$/);
  });
});

describe('generatePassphrase', () => {
  it('generates passphrase with default 4 words', () => {
    const phrase = generatePassphrase();
    writeOutput('generators', 'passphrase.txt', phrase);
    const words = phrase.split('-');
    expect(words.length).toBe(4);
  });

  it('generates passphrase with custom word count and separator', () => {
    const phrase = generatePassphrase(6, ' ');
    const words = phrase.split(' ');
    expect(words.length).toBe(6);
  });
});

// ==================== HASH (ASYNC) ====================

describe('generateHash', () => {
  it('generates SHA-256 hash by default', async () => {
    const hash = await generateHash('Hello World');
    writeOutput('generators', 'hash-sha256.txt', hash);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates SHA-512 hash', async () => {
    const hash = await generateHash('Hello World', 'SHA-512');
    writeOutput('generators', 'hash-sha512.txt', hash);
    expect(hash).toMatch(/^[0-9a-f]{128}$/);
  });

  it('generates SHA-1 hash', async () => {
    const hash = await generateHash('Hello World', 'SHA-1');
    expect(hash).toMatch(/^[0-9a-f]{40}$/);
  });

  it('same input produces same hash', async () => {
    const hash1 = await generateHash('deterministic');
    const hash2 = await generateHash('deterministic');
    expect(hash1).toBe(hash2);
  });
});

// ==================== FAKE DATA ====================

describe('fake data generators', () => {
  it('generateFakeEmail returns email format', () => {
    const email = generateFakeEmail();
    writeOutput('generators', 'fake-email.txt', email);
    expect(email).toContain('@');
  });

  it('generateFakeName returns non-empty string', () => {
    const name = generateFakeName();
    writeOutput('generators', 'fake-name.txt', name);
    expect(name.length).toBeGreaterThan(0);
  });

  it('generateFakePhone returns phone format', () => {
    const phone = generateFakePhone();
    writeOutput('generators', 'fake-phone.txt', phone);
    expect(phone.length).toBeGreaterThan(0);
  });

  it('generateFakeAddress returns non-empty string', () => {
    const address = generateFakeAddress();
    writeOutput('generators', 'fake-address.txt', address);
    expect(address.length).toBeGreaterThan(0);
  });
});

// ==================== COLOR ====================

describe('generateRandomColor', () => {
  it('generates hex color by default', () => {
    const color = generateRandomColor();
    writeOutput('generators', 'random-color-hex.txt', color);
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('generates rgb color', () => {
    const color = generateRandomColor('rgb');
    expect(color).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/);
  });

  it('generates hsl color', () => {
    const color = generateRandomColor('hsl');
    expect(color).toContain('hsl');
  });
});

// ==================== SLUG ====================

describe('generateSlug', () => {
  it('converts text to slug', () => {
    const slug = generateSlug('Hello World! This is a Test');
    writeOutput('generators', 'slug.txt', slug);
    expect(slug).toBe('hello-world-this-is-a-test');
  });

  it('handles special characters', () => {
    const slug = generateSlug('Café & Restaurant — Más!');
    expect(slug).not.toContain(' ');
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });
});

// ==================== RANDOM NUMBERS ====================

describe('generateRandomNumber', () => {
  it('generates number within range', () => {
    for (let i = 0; i < 50; i++) {
      const num = generateRandomNumber(1, 100);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(100);
    }
  });
});

describe('generateRandomString', () => {
  it('generates alphanumeric string of correct length', () => {
    const str = generateRandomString(16);
    writeOutput('generators', 'random-string.txt', str);
    expect(str).toHaveLength(16);
  });

  it('generates custom charset string', () => {
    const str = generateRandomString(10, 'numeric');
    expect(str).toMatch(/^[0-9]+$/);
  });
});

describe('generateRandomDate', () => {
  it('generates date within range', () => {
    const start = new Date('2020-01-01');
    const end = new Date('2025-12-31');
    const date = generateRandomDate(start, end);
    writeOutput('generators', 'random-date.txt', date.toISOString());
    expect(date.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(date.getTime()).toBeLessThanOrEqual(end.getTime());
  });
});

describe('generateRandomNumbers', () => {
  it('generates multiple random numbers', () => {
    const result = generateRandomNumbers(1, 100, 5);
    writeOutput('generators', 'random-numbers.txt', result);
    expect(typeof result).toBe('string');
  });

  it('generates unique numbers when specified', () => {
    const result = generateRandomNumbers(1, 10, 5, true);
    const nums = result.split(/[,\s]+/).map(Number);
    const unique = new Set(nums);
    expect(unique.size).toBe(nums.length);
  });
});

// ==================== CHECKSUM ====================

describe('generateChecksum', () => {
  it('returns consistent checksum for same input', () => {
    const cs1 = generateChecksum('Hello World');
    const cs2 = generateChecksum('Hello World');
    writeOutput('generators', 'checksum.txt', String(cs1));
    expect(cs1).toBe(cs2);
  });

  it('returns different checksum for different input', () => {
    const cs1 = generateChecksum('Hello');
    const cs2 = generateChecksum('World');
    expect(cs1).not.toBe(cs2);
  });
});

// ==================== SQL INSERT ====================

describe('generateSqlInsert', () => {
  it('generates SQL INSERT statement', () => {
    const sql = generateSqlInsert('users', [
      { name: 'Alice', age: 30, email: 'alice@example.com' },
      { name: 'Bob', age: 25, email: 'bob@example.com' },
    ]);
    writeOutput('generators', 'sql-insert.sql', sql);
    expect(sql).toContain('INSERT INTO');
    expect(sql).toContain('users');
    expect(sql).toContain('Alice');
    expect(sql).toContain('Bob');
  });
});

// ==================== REGEX GENERATORS ====================

describe('regex generators', () => {
  it('generateEmailRegex returns valid regex string', () => {
    const regex = generateEmailRegex();
    writeOutput('generators', 'email-regex.txt', regex);
    expect(() => new RegExp(regex)).not.toThrow();
  });

  it('generateUrlRegex returns valid regex string', () => {
    const regex = generateUrlRegex();
    writeOutput('generators', 'url-regex.txt', regex);
    expect(() => new RegExp(regex)).not.toThrow();
  });

  it('generatePhoneRegex returns valid regex string', () => {
    const regex = generatePhoneRegex();
    writeOutput('generators', 'phone-regex.txt', regex);
    expect(() => new RegExp(regex)).not.toThrow();
  });
});

// ==================== TIMESTAMP ====================

describe('generateTimestamp', () => {
  it('generates ISO timestamp by default', () => {
    const ts = generateTimestamp();
    writeOutput('generators', 'timestamp-iso.txt', ts);
    expect(() => new Date(ts)).not.toThrow();
  });

  it('generates unix timestamp', () => {
    const ts = generateTimestamp('unix');
    expect(Number(ts)).toBeGreaterThan(0);
  });

  it('generates RFC 2822 timestamp', () => {
    const ts = generateTimestamp('rfc2822');
    writeOutput('generators', 'timestamp-rfc2822.txt', ts);
    expect(ts.length).toBeGreaterThan(0);
  });
});

// ==================== API KEY / JWT ====================

describe('generateApiKey', () => {
  it('generates API key with default prefix', () => {
    const key = generateApiKey();
    writeOutput('generators', 'api-key.txt', key);
    expect(key).toMatch(/^sk_/);
  });

  it('generates API key with custom prefix', () => {
    const key = generateApiKey('pk', 32);
    expect(key).toMatch(/^pk_/);
  });
});

describe('generateJwt', () => {
  it('generates valid JWT format', () => {
    const jwt = generateJwt({ sub: '1234', name: 'Test User' });
    writeOutput('generators', 'jwt.txt', jwt);
    const parts = jwt.split('.');
    expect(parts).toHaveLength(3);
  });

  it('generates JWT with custom expiration', () => {
    const jwt = generateJwt({ sub: 'user1' }, 'secret', '24h');
    const parts = jwt.split('.');
    expect(parts).toHaveLength(3);
  });
});

// ==================== LOREM IPSUM ====================

describe('generateLoremIpsum', () => {
  it('generates single paragraph by default', () => {
    const text = generateLoremIpsum();
    writeOutput('generators', 'lorem-1.txt', text);
    expect(text.length).toBeGreaterThan(0);
  });

  it('generates multiple paragraphs', () => {
    const text = generateLoremIpsum(3, 30);
    writeOutput('generators', 'lorem-3.txt', text);
    // Multiple paragraphs separated by newlines
    expect(text.length).toBeGreaterThan(0);
  });
});

// ==================== USERNAME / QUOTE ====================

describe('generateUsername', () => {
  it('generates username', () => {
    const username = generateUsername();
    writeOutput('generators', 'username.txt', username);
    expect(username.length).toBeGreaterThan(0);
  });
});

describe('generateQuote', () => {
  it('generates a quote string', () => {
    const quote = generateQuote();
    writeOutput('generators', 'quote.txt', quote);
    expect(quote.length).toBeGreaterThan(0);
  });
});

// ==================== QR CODE ====================

describe('generateQrCode', () => {
  it('generates QR code data', () => {
    const qr = generateQrCode('https://example.com');
    writeOutput('generators', 'qr-code.json', qr);
    // Returns JSON data with text, size, and type fields
    const parsed = JSON.parse(qr);
    expect(parsed.text).toBe('https://example.com');
    expect(parsed.type).toBe('qr-code-data');
  });

  it('generates QR code with custom size', () => {
    const qr = generateQrCode('Test', 300);
    const parsed = JSON.parse(qr);
    expect(parsed.size).toBe(300);
  });
});

// ==================== SIGNATURE ====================

describe('generateSignature', () => {
  it('generates signature SVG', () => {
    const sig = generateSignature('John Doe');
    writeOutput('generators', 'signature-formal.svg', sig);
    expect(sig.length).toBeGreaterThan(0);
  });

  it('generates signature with different style', () => {
    const sig = generateSignature('Jane Smith', 'casual');
    writeOutput('generators', 'signature-casual.svg', sig);
    expect(sig.length).toBeGreaterThan(0);
  });
});

// ==================== COLOR PALETTE ====================

describe('generateColorPalette', () => {
  it('generates palette from base color', () => {
    const palette = generateColorPalette('#3498db');
    writeOutput('generators', 'color-palette.json', JSON.stringify(palette));
    expect(palette).toHaveLength(5);
    palette.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('generates palette with custom count', () => {
    const palette = generateColorPalette('#ff5733', 8);
    expect(palette).toHaveLength(8);
  });
});

// ==================== PLACEHOLDER IMAGE ====================

describe('generatePlaceholderImage', () => {
  it('generates placeholder image URL', () => {
    const result = generatePlaceholderImage(300, 200);
    writeOutput('generators', 'placeholder-image.txt', result);
    // Returns a URL to via.placeholder.com
    expect(result).toContain('300');
    expect(result).toContain('200');
  });

  it('generates placeholder with custom text', () => {
    const result = generatePlaceholderImage(400, 300, 'Preview');
    expect(result).toContain('Preview');
  });
});

// ==================== FAVICON HTML ====================

describe('generateFaviconHtml', () => {
  it('generates favicon HTML tags', () => {
    const html = generateFaviconHtml('/favicon.ico');
    writeOutput('generators', 'favicon-html.html', html);
    expect(html).toContain('link');
    expect(html).toContain('/favicon.ico');
  });

  it('generates favicon with custom sizes', () => {
    const html = generateFaviconHtml('/icon.png', [16, 32, 48, 64]);
    expect(html).toContain('link');
  });
});

// ==================== VCARD QR ====================

describe('generateVCardQr', () => {
  it('generates VCard QR code URL', () => {
    const qr = generateVCardQr({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      organization: 'Acme Corp',
      title: 'Engineer',
    });
    writeOutput('generators', 'vcard-qr.txt', qr);
    // Returns a URL to qrserver.com with encoded VCard data
    expect(qr).toContain('VCARD');
    expect(qr).toContain('John');
  });
});

// ==================== EMOJI SEARCH ====================

describe('searchEmoji', () => {
  it('finds emojis by keyword', () => {
    const results = searchEmoji('smile');
    writeOutput('generators', 'emoji-search-smile.json', JSON.stringify(results));
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('name');
    expect(results[0]).toHaveProperty('emoji');
  });

  it('returns empty for no match', () => {
    const results = searchEmoji('xyznonexistent');
    expect(results).toHaveLength(0);
  });
});

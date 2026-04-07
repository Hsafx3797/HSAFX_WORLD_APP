import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encrypt, decrypt, isEncrypted } from '../crypto/encryption';

// 64-hex = 32-byte AES-256 key
const TEST_KEY = 'a'.repeat(64);

describe('AES-256-GCM encryption', () => {
  beforeEach(() => {
    vi.stubEnv('ENCRYPTION_KEY', TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('encrypts and decrypts a string roundtrip', () => {
    const plaintext = 'my-secret-oauth-token-12345';
    const encrypted = encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertext each time (random IV)', () => {
    const plaintext = 'same-input-twice';
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);

    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(plaintext);
    expect(decrypt(b)).toBe(plaintext);
  });

  it('handles empty string', () => {
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe('');
  });

  it('handles unicode content', () => {
    const plaintext = '🔑 Schlüssel こんにちは';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('handles long strings', () => {
    const plaintext = 'x'.repeat(10_000);
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('rejects tampered ciphertext (auth tag verification)', () => {
    const encrypted = encrypt('secret');
    // Flip a character in the base64 ciphertext
    const tampered =
      encrypted.slice(0, 10) +
      (encrypted[10] === 'A' ? 'B' : 'A') +
      encrypted.slice(11);

    expect(() => decrypt(tampered)).toThrow();
  });

  it('rejects too-short data', () => {
    expect(() => decrypt('AAAA')).toThrow('Invalid encrypted data: too short');
  });
});

describe('isEncrypted()', () => {
  beforeEach(() => {
    vi.stubEnv('ENCRYPTION_KEY', TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true for encrypted values', () => {
    const encrypted = encrypt('test-value');
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it('returns false for plaintext', () => {
    expect(isEncrypted('hello world')).toBe(false);
    expect(isEncrypted('not-base64!@#$')).toBe(false);
  });

  it('returns false for empty/falsy values', () => {
    expect(isEncrypted('')).toBe(false);
  });

  it('returns false for short base64 that is too small to be ciphertext', () => {
    // Valid base64 but shorter than IV + AuthTag (28 bytes)
    const shortB64 = Buffer.from('short').toString('base64');
    expect(isEncrypted(shortB64)).toBe(false);
  });
});

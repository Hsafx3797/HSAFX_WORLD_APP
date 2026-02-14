/**
 * Encrypted-field helpers for Drizzle ORM
 *
 * Provides encrypt/decrypt wrappers for sensitive columns
 * (OAuth tokens, TOTP secrets, backup codes).
 *
 * Usage in service layer:
 *   import { encryptFields, decryptFields } from '@hsafx/db/crypto';
 *   const row = encryptFields(values, ['accessToken', 'refreshToken']);
 *   const plain = decryptFields(row, ['accessToken', 'refreshToken']);
 */

import { encrypt, decrypt } from '@hsafx/shared/crypto';

/**
 * Encrypt specified string fields on a record before INSERT/UPDATE.
 * Returns a shallow copy with encrypted values. Null/undefined fields are left as-is.
 */
export function encryptFields<T extends Record<string, unknown>>(
  record: T,
  fields: (keyof T)[],
): T {
  const copy = { ...record };
  for (const field of fields) {
    const value = copy[field];
    if (typeof value === 'string' && value.length > 0) {
      (copy as Record<string, unknown>)[field as string] = encrypt(value);
    }
  }
  return copy;
}

/**
 * Decrypt specified string fields on a record after SELECT.
 * Returns a shallow copy with decrypted values. Null/undefined fields are left as-is.
 */
export function decryptFields<T extends Record<string, unknown>>(
  record: T,
  fields: (keyof T)[],
): T {
  const copy = { ...record };
  for (const field of fields) {
    const value = copy[field];
    if (typeof value === 'string' && value.length > 0) {
      try {
        (copy as Record<string, unknown>)[field as string] = decrypt(value);
      } catch {
        // If decryption fails (e.g. legacy plaintext), leave as-is
      }
    }
  }
  return copy;
}

/** The OAuth token fields that are encrypted at rest */
export const OAUTH_ENCRYPTED_FIELDS = ['accessToken', 'refreshToken'] as const;

/** The TOTP fields that are encrypted at rest */
export const TOTP_ENCRYPTED_FIELDS = ['secret', 'backupCodes'] as const;

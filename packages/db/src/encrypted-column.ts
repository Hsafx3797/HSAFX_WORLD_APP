/**
 * Drizzle custom column type: transparent AES-256-GCM encryption at rest.
 *
 * Encrypts values on INSERT/UPDATE via `toDriver()`, decrypts on SELECT via
 * `fromDriver()`. When ENCRYPTION_KEY is missing (dev/test), acts as plain text.
 * Gracefully handles legacy plaintext rows — if decryption fails the raw value
 * is returned as-is (allows incremental migration).
 */

import { customType } from 'drizzle-orm/pg-core';
import { encrypt, decrypt, isEncrypted } from '@hsafx/shared/crypto';

/**
 * Check if encryption is available (ENCRYPTION_KEY env var is set).
 * Cached after first check to avoid repeated env reads.
 */
let _encryptionAvailable: boolean | null = null;

function canEncrypt(): boolean {
  if (_encryptionAvailable !== null) return _encryptionAvailable;
  const key = process.env.ENCRYPTION_KEY;
  _encryptionAvailable = !!key && key.length === 64;
  return _encryptionAvailable;
}

/**
 * A `text` column that encrypts at rest via AES-256-GCM.
 *
 * Usage in schema:
 *   accessToken: encryptedText('access_token'),
 */
export const encryptedText = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'text';
  },

  toDriver(value: string): string {
    if (!value) return value;
    if (!canEncrypt()) return value; // no key → store plaintext (dev/test)
    // Don't double-encrypt
    if (isEncrypted(value)) return value;
    return encrypt(value);
  },

  fromDriver(value: unknown): string {
    if (typeof value !== 'string' || !value) return value as string;
    if (!canEncrypt()) return value; // no key → return as-is
    try {
      return decrypt(value);
    } catch {
      // Legacy plaintext row — return as-is
      return value;
    }
  },
});

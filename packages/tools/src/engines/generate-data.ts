/**
 * Generate-Data Engine — Pure Data Generation
 *
 * UUID variants, NanoID, passwords, mock persons, companies,
 * credit cards, colors, random numbers, timestamps, hashes, JWTs.
 *
 * Backend: Node.js
 */

import type { Engine, GenerateDataOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
import {
  generateUUID,
  generateNanoId,
  generatePassword,
  generatePassphrase,
  generatePerson,
  generateCompany,
  generateCreditCard,
  generateRandomColor,
  generateColorPalette,
} from '../generators';
import { generateUuidV1, generateUuidV4, generateUuidV5, generateUuidV7 } from '../generators/web';
import { SYNC_ALGORITHMS } from './hash';

// ---------------------------------------------------------------------------
// Generator type registry
// ---------------------------------------------------------------------------

const DATA_TYPES = [
  'uuid', 'uuid-v1', 'uuid-v4', 'uuid-v5', 'uuid-v7',
  'nanoid',
  'password', 'passphrase',
  'person', 'company', 'credit-card',
  'color', 'color-palette',
  'random-number', 'timestamp', 'username',
  'hash', 'jwt',
] as const;

type GenerateDataType = typeof DATA_TYPES[number];

function runDataGenerator(type: GenerateDataType, options: Record<string, unknown> = {}): unknown {
  switch (type) {
    case 'uuid':
      return generateUUID();
    case 'uuid-v1':
      return generateUuidV1();
    case 'uuid-v4':
      return generateUuidV4();
    case 'uuid-v5':
      return generateUuidV5(
        (options.namespace as string) || '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        (options.name as string) || 'default',
      );
    case 'uuid-v7':
      return generateUuidV7();
    case 'nanoid':
      return generateNanoId(options.size as number | undefined);
    case 'password':
      return generatePassword(options as Parameters<typeof generatePassword>[0]);
    case 'passphrase':
      return generatePassphrase(
        options.wordCount as number | undefined,
        options.separator as string | undefined,
      );
    case 'person':
      return generatePerson();
    case 'company':
      return generateCompany();
    case 'credit-card':
      return generateCreditCard(options.type as 'visa' | 'mastercard' | 'amex' | 'discover' | undefined);
    case 'color':
      return generateRandomColor();
    case 'color-palette':
      return generateColorPalette(
        (options.baseColor as string) || generateRandomColor(),
        options.count as number | undefined,
      );
    case 'random-number': {
      const min = (options.min as number) ?? 0;
      const max = (options.max as number) ?? 100;
      const integer = (options.integer as boolean) ?? true;
      const val = Math.random() * (max - min) + min;
      return integer ? Math.floor(val) : Number(val.toFixed(6));
    }
    case 'timestamp': {
      const now = new Date();
      const format = (options.format as string) || 'iso';
      switch (format) {
        case 'unix': return Math.floor(now.getTime() / 1000);
        case 'unix-ms': return now.getTime();
        case 'iso': return now.toISOString();
        case 'utc': return now.toUTCString();
        case 'date': return now.toISOString().split('T')[0];
        default: return now.toISOString();
      }
    }
    case 'username': {
      const person = generatePerson() as { firstName: string; lastName: string };
      const num = Math.floor(Math.random() * 999);
      return `${person.firstName.toLowerCase()}${person.lastName.toLowerCase()}${num}`;
    }
    case 'hash': {
      const algo = (options.algorithm as string) || 'sha256';
      const text = (options.text as string) || generatePassword({ length: 32 });
      const fn = SYNC_ALGORITHMS[algo] || SYNC_ALGORITHMS['sha256'];
      return `${algo}:${fn(text)}`;
    }
    case 'jwt': {
      const header = { alg: (options.algorithm as string) || 'none', typ: 'JWT' };
      const payload: Record<string, unknown> = {
        sub: (options.sub as string) || generateUUID(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + ((options.expiresIn as number) || 3600),
        ...(options.claims as Record<string, unknown> || {}),
      };
      if (options.iss) payload.iss = options.iss;
      if (options.aud) payload.aud = options.aud;
      const b64 = (obj: unknown) => {
        const json = JSON.stringify(obj);
        const bytes = new TextEncoder().encode(json);
        let binary = '';
        for (const b of bytes) binary += String.fromCharCode(b);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      };
      const sig = (options.algorithm === 'none' || !options.secret)
        ? ''
        : SYNC_ALGORITHMS['sha256'](`${b64(header)}.${b64(payload)}.${options.secret}`).substring(0, 43);
      return `${b64(header)}.${b64(payload)}.${sig}`;
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const generateDataEngine: Engine<GenerateDataOptions> = {
  name: 'generate-data',
  description: 'Generate random data — UUIDs, passwords, mock persons, colors, timestamps, hashes, JWTs.',

  validate(options: GenerateDataOptions): ValidationOutcome {
    const errors: string[] = [];
    if (!DATA_TYPES.includes(options.type as GenerateDataType)) {
      errors.push(`Unknown generator type "${options.type}". Available: ${DATA_TYPES.join(', ')}`);
    }
    if (options.count !== undefined && (options.count < 1 || options.count > 100)) {
      errors.push('count must be between 1 and 100');
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(_input: EngineInput, options: GenerateDataOptions): EngineResult {
    const count = options.count ?? 1;
    const results: unknown[] = [];
    for (let i = 0; i < count; i++) {
      results.push(runDataGenerator(options.type as GenerateDataType, options.options));
    }

    if (count === 1) {
      const val = results[0];
      if (typeof val === 'string') {
        return { output: val, metadata: { type: options.type, count } };
      }
      return {
        output: JSON.stringify(val, null, 2),
        metadata: { type: options.type, count },
      };
    }

    if (results.every(r => typeof r === 'string')) {
      return { output: (results as string[]).join('\n'), metadata: { type: options.type, count } };
    }
    return {
      output: JSON.stringify(results, null, 2),
      metadata: { type: options.type, count },
    };
  },
};

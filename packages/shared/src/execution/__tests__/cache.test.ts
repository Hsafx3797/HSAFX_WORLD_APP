import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_CACHE_CONFIG,
  TOOL_CACHE_TTL,
  generateCacheKey,
  calculateSize,
  shouldCache,
  getToolTTL,
  createCacheEntry,
  isExpired,
  shouldEvict,
  CACHE_REDIS_KEYS,
  type CacheEntry,
  type CacheStats,
  type CacheConfig,
} from '../cache';

// ─── DEFAULT_CACHE_CONFIG ────────────────────────────────────────────────────

describe('DEFAULT_CACHE_CONFIG', () => {
  it('maxSize is 100MB', () => {
    expect(DEFAULT_CACHE_CONFIG.maxSize).toBe(100 * 1024 * 1024);
  });

  it('maxEntries is 1000', () => {
    expect(DEFAULT_CACHE_CONFIG.maxEntries).toBe(1000);
  });

  it('defaultTTL is 3600000ms (1 hour)', () => {
    expect(DEFAULT_CACHE_CONFIG.defaultTTL).toBe(3600000);
  });

  it('cleanupInterval is 300000ms (5 minutes)', () => {
    expect(DEFAULT_CACHE_CONFIG.cleanupInterval).toBe(300000);
  });
});

// ─── TOOL_CACHE_TTL ──────────────────────────────────────────────────────────

describe('TOOL_CACHE_TTL', () => {
  it('uuid-generator has TTL of 0 (never cache)', () => {
    expect(TOOL_CACHE_TTL['uuid-generator']).toBe(0);
  });

  it('calculator-basic has TTL of 3600000 (1 hour)', () => {
    expect(TOOL_CACHE_TTL['calculator-basic']).toBe(3600000);
  });

  it('hash-generator has TTL of 86400000 (24 hours)', () => {
    expect(TOOL_CACHE_TTL['hash-generator']).toBe(86400000);
  });

  it('random-string-generator has TTL of 0', () => {
    expect(TOOL_CACHE_TTL['random-string-generator']).toBe(0);
  });

  it('qr-code-generator has TTL of 604800000 (7 days)', () => {
    expect(TOOL_CACHE_TTL['qr-code-generator']).toBe(604800000);
  });
});

// ─── generateCacheKey ────────────────────────────────────────────────────────

describe('generateCacheKey', () => {
  it('returns a string starting with "tool:"', () => {
    const key = generateCacheKey('calculator-basic', '2+2');
    expect(key).toMatch(/^tool:/);
  });

  it('same inputs produce the same key', () => {
    const key1 = generateCacheKey('calculator-basic', '2+2');
    const key2 = generateCacheKey('calculator-basic', '2+2');
    expect(key1).toBe(key2);
  });

  it('different inputs produce different keys', () => {
    const key1 = generateCacheKey('calculator-basic', '2+2');
    const key2 = generateCacheKey('calculator-basic', '3+3');
    expect(key1).not.toBe(key2);
  });

  it('different toolIds produce different keys', () => {
    const key1 = generateCacheKey('calculator-basic', '2+2');
    const key2 = generateCacheKey('hash-generator', '2+2');
    expect(key1).not.toBe(key2);
  });

  it('handles string input', () => {
    const key = generateCacheKey('text-case-converter', 'hello world');
    expect(typeof key).toBe('string');
    expect(key.startsWith('tool:text-case-converter:')).toBe(true);
  });

  it('handles object input', () => {
    const key = generateCacheKey('calculator-basic', { a: 1, b: 2 });
    expect(typeof key).toBe('string');
    expect(key.startsWith('tool:calculator-basic:')).toBe(true);
  });

  it('produces deterministic keys for objects regardless of key order', () => {
    const key1 = generateCacheKey('calc', { a: 1, b: 2 });
    const key2 = generateCacheKey('calc', { b: 2, a: 1 });
    expect(key1).toBe(key2);
  });
});

// ─── calculateSize ───────────────────────────────────────────────────────────

describe('calculateSize', () => {
  it('returns 0 for null', () => {
    expect(calculateSize(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(calculateSize(undefined)).toBe(0);
  });

  it('returns string.length * 2 for strings (UTF-16)', () => {
    expect(calculateSize('hello')).toBe(10); // 5 * 2
  });

  it('returns 0 for empty string', () => {
    expect(calculateSize('')).toBe(0);
  });

  it('returns 8 for numbers', () => {
    expect(calculateSize(42)).toBe(8);
    expect(calculateSize(3.14)).toBe(8);
    expect(calculateSize(0)).toBe(8);
  });

  it('returns 4 for booleans', () => {
    expect(calculateSize(true)).toBe(4);
    expect(calculateSize(false)).toBe(4);
  });

  it('returns sum of element sizes for arrays', () => {
    // [1, 2, 3] → 8 + 8 + 8 = 24
    expect(calculateSize([1, 2, 3])).toBe(24);
  });

  it('returns 0 for empty array', () => {
    expect(calculateSize([])).toBe(0);
  });

  it('handles mixed-type arrays', () => {
    // ['hi', 42] → (2*2) + 8 = 12
    expect(calculateSize(['hi', 42])).toBe(12);
  });

  it('returns sum of keys + values for objects', () => {
    // { a: 1 } → key 'a' (1*2) + value 1 (8) = 10
    expect(calculateSize({ a: 1 })).toBe(10);
  });

  it('returns 0 for empty object', () => {
    expect(calculateSize({})).toBe(0);
  });

  it('handles nested objects', () => {
    // { a: { b: 1 } } → key 'a' (2) + value { b: 1 } → key 'b' (2) + 8 = 10 → total 12
    expect(calculateSize({ a: { b: 1 } })).toBe(12);
  });
});

// ─── shouldCache ─────────────────────────────────────────────────────────────

describe('shouldCache', () => {
  it('returns false for uuid-generator (TTL is 0)', () => {
    expect(shouldCache('uuid-generator')).toBe(false);
  });

  it('returns false for random-string-generator (TTL is 0)', () => {
    expect(shouldCache('random-string-generator')).toBe(false);
  });

  it('returns true for calculator-basic', () => {
    expect(shouldCache('calculator-basic')).toBe(true);
  });

  it('returns true for hash-generator', () => {
    expect(shouldCache('hash-generator')).toBe(true);
  });

  it('returns true for unknown-tool (not in TTL list → undefined !== 0)', () => {
    expect(shouldCache('unknown-tool')).toBe(true);
  });
});

// ─── getToolTTL ──────────────────────────────────────────────────────────────

describe('getToolTTL', () => {
  it('returns 0 for uuid-generator', () => {
    expect(getToolTTL('uuid-generator')).toBe(0);
  });

  it('returns 86400000 for hash-generator', () => {
    expect(getToolTTL('hash-generator')).toBe(86400000);
  });

  it('returns 3600000 for calculator-basic', () => {
    expect(getToolTTL('calculator-basic')).toBe(3600000);
  });

  it('returns default TTL for unknown-tool', () => {
    expect(getToolTTL('unknown-tool')).toBe(DEFAULT_CACHE_CONFIG.defaultTTL);
  });

  it('returns 300000 for timezone-converter', () => {
    expect(getToolTTL('timezone-converter')).toBe(300000);
  });
});

// ─── createCacheEntry ────────────────────────────────────────────────────────

describe('createCacheEntry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an object with the correct key', () => {
    const entry = createCacheEntry('calculator-basic', '2+2', 4);
    expect(entry.key).toBe(generateCacheKey('calculator-basic', '2+2'));
  });

  it('stores the provided value', () => {
    const entry = createCacheEntry('calculator-basic', '2+2', 4);
    expect(entry.value).toBe(4);
  });

  it('sets createdAt to Date.now()', () => {
    const now = Date.now();
    const entry = createCacheEntry('calculator-basic', '2+2', 4);
    expect(entry.createdAt).toBe(now);
  });

  it('sets expiresAt to createdAt + TTL', () => {
    const now = Date.now();
    const ttl = getToolTTL('calculator-basic');
    const entry = createCacheEntry('calculator-basic', '2+2', 4);
    expect(entry.expiresAt).toBe(now + ttl);
  });

  it('sets hits to 0', () => {
    const entry = createCacheEntry('calculator-basic', '2+2', 4);
    expect(entry.hits).toBe(0);
  });

  it('sets the size of the value', () => {
    const entry = createCacheEntry('calculator-basic', '2+2', 'result');
    expect(entry.size).toBe(calculateSize('result'));
  });

  it('sets the toolId', () => {
    const entry = createCacheEntry('hash-generator', 'abc', 'def');
    expect(entry.toolId).toBe('hash-generator');
  });

  it('sets inputHash as a string', () => {
    const entry = createCacheEntry('calculator-basic', '2+2', 4);
    expect(typeof entry.inputHash).toBe('string');
    expect(entry.inputHash.length).toBeGreaterThan(0);
  });

  it('handles object input', () => {
    const entry = createCacheEntry('calculator-basic', { expr: '2+2' }, 4);
    expect(entry.key).toContain('tool:calculator-basic:');
    expect(typeof entry.inputHash).toBe('string');
  });
});

// ─── isExpired ────────────────────────────────────────────────────────────────

describe('isExpired', () => {
  it('returns true when expiresAt is in the past', () => {
    const entry: CacheEntry = {
      key: 'test',
      value: 1,
      createdAt: Date.now() - 7200000,
      expiresAt: Date.now() - 3600000, // 1 hour ago
      hits: 0,
      size: 8,
      toolId: 'test',
      inputHash: 'abc',
    };
    expect(isExpired(entry)).toBe(true);
  });

  it('returns false when expiresAt is in the future', () => {
    const entry: CacheEntry = {
      key: 'test',
      value: 1,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour from now
      hits: 0,
      size: 8,
      toolId: 'test',
      inputHash: 'abc',
    };
    expect(isExpired(entry)).toBe(false);
  });
});

// ─── shouldEvict ─────────────────────────────────────────────────────────────

describe('shouldEvict', () => {
  const baseEntry: CacheEntry = {
    key: 'test',
    value: 1,
    createdAt: Date.now(),
    expiresAt: Date.now() + 3600000,
    hits: 0,
    size: 8,
    toolId: 'test',
    inputHash: 'abc',
  };

  const baseStats: CacheStats = {
    totalEntries: 10,
    totalSize: 1024,
    hitCount: 0,
    missCount: 0,
    hitRate: 0,
    evictionCount: 0,
  };

  it('returns true when entry is expired', () => {
    const expired: CacheEntry = {
      ...baseEntry,
      expiresAt: Date.now() - 1000,
    };
    expect(shouldEvict(expired, baseStats, DEFAULT_CACHE_CONFIG)).toBe(true);
  });

  it('returns true when totalSize exceeds maxSize', () => {
    const overSizeStats: CacheStats = {
      ...baseStats,
      totalSize: DEFAULT_CACHE_CONFIG.maxSize + 1,
    };
    expect(shouldEvict(baseEntry, overSizeStats, DEFAULT_CACHE_CONFIG)).toBe(true);
  });

  it('returns true when totalEntries exceeds maxEntries', () => {
    const overEntriesStats: CacheStats = {
      ...baseStats,
      totalEntries: DEFAULT_CACHE_CONFIG.maxEntries + 1,
    };
    expect(shouldEvict(baseEntry, overEntriesStats, DEFAULT_CACHE_CONFIG)).toBe(true);
  });

  it('returns false for valid entry within limits', () => {
    expect(shouldEvict(baseEntry, baseStats, DEFAULT_CACHE_CONFIG)).toBe(false);
  });

  it('returns false when stats are at exact limits (not exceeding)', () => {
    const atLimitStats: CacheStats = {
      ...baseStats,
      totalSize: DEFAULT_CACHE_CONFIG.maxSize,
      totalEntries: DEFAULT_CACHE_CONFIG.maxEntries,
    };
    expect(shouldEvict(baseEntry, atLimitStats, DEFAULT_CACHE_CONFIG)).toBe(false);
  });

  it('respects custom config limits', () => {
    const tinyConfig: CacheConfig = {
      maxSize: 100,
      maxEntries: 5,
      defaultTTL: 1000,
      cleanupInterval: 1000,
    };
    const overStats: CacheStats = { ...baseStats, totalSize: 101 };
    expect(shouldEvict(baseEntry, overStats, tinyConfig)).toBe(true);
  });
});

// ─── CACHE_REDIS_KEYS ────────────────────────────────────────────────────────

describe('CACHE_REDIS_KEYS', () => {
  it('toolResult returns correct pattern', () => {
    expect(CACHE_REDIS_KEYS.toolResult('calc', 'abc')).toBe('cache:tool:calc:abc');
  });

  it('toolResult handles different toolIds', () => {
    expect(CACHE_REDIS_KEYS.toolResult('hash-generator', 'xyz')).toBe(
      'cache:tool:hash-generator:xyz'
    );
  });

  it('globalStats returns "cache:stats:global"', () => {
    expect(CACHE_REDIS_KEYS.globalStats()).toBe('cache:stats:global');
  });

  it('toolStats returns correct pattern', () => {
    expect(CACHE_REDIS_KEYS.toolStats('calc')).toBe('cache:stats:calc');
  });

  it('lockKey returns correct pattern', () => {
    expect(CACHE_REDIS_KEYS.lockKey('mykey')).toBe('cache:lock:mykey');
  });
});

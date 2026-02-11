/**
 * Tests for packages/shared/src/utils
 * Pure utility functions — zero mocking needed
 */
import { describe, it, expect, vi } from 'vitest';
import {
  sleep,
  generateRandomString,
  formatBytes,
  formatDuration,
  truncate,
  slugify,
  debounce,
  throttle,
  retry,
  safeJsonParse,
  deepMerge,
  chunk,
  omit,
  pick,
  isEmpty,
  simpleHash,
  dateRange,
} from '../utils/index.ts';

// ─── sleep ───────────────────────────────────────────────
describe('sleep', () => {
  it('should resolve after specified time', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });
});

// ─── generateRandomString ────────────────────────────────
describe('generateRandomString', () => {
  it('should generate string of default length 32', () => {
    const result = generateRandomString();
    expect(result).toHaveLength(32);
  });

  it('should generate string of specified length', () => {
    expect(generateRandomString(10)).toHaveLength(10);
    expect(generateRandomString(64)).toHaveLength(64);
    expect(generateRandomString(1)).toHaveLength(1);
  });

  it('should only contain alphanumeric characters', () => {
    const result = generateRandomString(100);
    expect(result).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('should generate unique strings', () => {
    const set = new Set(Array.from({ length: 10 }, () => generateRandomString()));
    expect(set.size).toBe(10);
  });
});

// ─── formatBytes ─────────────────────────────────────────
describe('formatBytes', () => {
  it('should format 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('should format bytes', () => {
    expect(formatBytes(500)).toBe('500 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('should format gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('should respect decimal precision', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB');
    expect(formatBytes(1536, 3)).toBe('1.5 KB');
  });
});

// ─── formatDuration ──────────────────────────────────────
describe('formatDuration', () => {
  it('should format milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('should format seconds', () => {
    expect(formatDuration(5000)).toBe('5.00s');
  });

  it('should format minutes', () => {
    expect(formatDuration(120000)).toBe('2.00m');
  });

  it('should format hours', () => {
    expect(formatDuration(7200000)).toBe('2.00h');
  });
});

// ─── truncate ────────────────────────────────────────────
describe('truncate', () => {
  it('should not truncate short strings', () => {
    expect(truncate('hello', 50)).toBe('hello');
  });

  it('should truncate long strings with ellipsis', () => {
    expect(truncate('hello world foo bar', 10)).toBe('hello w...');
  });

  it('should use default maxLength of 50', () => {
    const longStr = 'a'.repeat(60);
    const result = truncate(longStr);
    expect(result).toHaveLength(50);
    expect(result.endsWith('...')).toBe(true);
  });
});

// ─── slugify ─────────────────────────────────────────────
describe('slugify', () => {
  it('should convert to lowercase kebab-case', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should handle special characters', () => {
    expect(slugify('Hello! World? #2024')).toBe('hello-world-2024');
  });

  it('should trim leading/trailing hyphens', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });

  it('should collapse multiple separators', () => {
    expect(slugify('Hello   World___Foo--Bar')).toBe('hello-world-foo-bar');
  });
});

// ─── debounce ────────────────────────────────────────────
describe('debounce', () => {
  it('should only call function after wait time', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    await sleep(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ─── throttle ────────────────────────────────────────────
describe('throttle', () => {
  it('should call immediately then throttle', async () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    await sleep(150);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ─── retry ───────────────────────────────────────────────
describe('retry', () => {
  it('should return result on first success', async () => {
    const result = await retry(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('should retry on failure and succeed', async () => {
    let attempt = 0;
    const result = await retry(
      () => {
        attempt++;
        if (attempt < 3) throw new Error('fail');
        return Promise.resolve('success');
      },
      { maxAttempts: 3, delay: 10 }
    );
    expect(result).toBe('success');
    expect(attempt).toBe(3);
  });

  it('should throw after max attempts', async () => {
    await expect(
      retry(() => Promise.reject(new Error('always fails')), {
        maxAttempts: 2,
        delay: 10,
      })
    ).rejects.toThrow('always fails');
  });

  it('should call onRetry callback', async () => {
    const onRetry = vi.fn();
    try {
      await retry(() => Promise.reject(new Error('fail')), {
        maxAttempts: 3,
        delay: 10,
        onRetry,
      });
    } catch {
      // expected
    }
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});

// ─── safeJsonParse ───────────────────────────────────────
describe('safeJsonParse', () => {
  it('should parse valid JSON', () => {
    expect(safeJsonParse('{"a":1}', null)).toEqual({ a: 1 });
  });

  it('should return fallback for invalid JSON', () => {
    expect(safeJsonParse('not json', 'fallback')).toBe('fallback');
  });

  it('should return fallback for empty string', () => {
    expect(safeJsonParse('', {})).toEqual({});
  });
});

// ─── deepMerge ───────────────────────────────────────────
describe('deepMerge', () => {
  it('should merge flat objects', () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should deeply merge nested objects', () => {
    const result = deepMerge(
      { a: { b: 1, c: 2 } },
      { a: { c: 3, d: 4 } }
    );
    expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } });
  });

  it('should not merge arrays (replace instead)', () => {
    const result = deepMerge({ a: [1, 2] }, { a: [3, 4] });
    expect(result).toEqual({ a: [3, 4] });
  });

  it('should handle multiple sources', () => {
    const result = deepMerge({ a: 1 }, { b: 2 }, { c: 3 });
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });
});

// ─── chunk ───────────────────────────────────────────────
describe('chunk', () => {
  it('should split array into chunks', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should handle empty array', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('should handle chunk size larger than array', () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });
});

// ─── omit ────────────────────────────────────────────────
describe('omit', () => {
  it('should remove specified keys', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 });
  });

  it('should handle empty keys array', () => {
    expect(omit({ a: 1 }, [])).toEqual({ a: 1 });
  });
});

// ─── pick ────────────────────────────────────────────────
describe('pick', () => {
  it('should keep only specified keys', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('should ignore non-existent keys', () => {
    expect(pick({ a: 1 }, ['a', 'b' as keyof { a: number }])).toEqual({ a: 1 });
  });
});

// ─── isEmpty ─────────────────────────────────────────────
describe('isEmpty', () => {
  it('should return true for null/undefined', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty('   ')).toBe(true);
  });

  it('should return true for empty array', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('should return true for empty object', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('should return false for non-empty values', () => {
    expect(isEmpty('hello')).toBe(false);
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty(false)).toBe(false);
  });
});

// ─── simpleHash ──────────────────────────────────────────
describe('simpleHash', () => {
  it('should produce consistent hash for same input', () => {
    expect(simpleHash('hello')).toBe(simpleHash('hello'));
  });

  it('should produce different hashes for different input', () => {
    expect(simpleHash('hello')).not.toBe(simpleHash('world'));
  });

  it('should return a base-36 string', () => {
    const hash = simpleHash('test');
    expect(hash).toMatch(/^[0-9a-z]+$/);
  });
});

// ─── dateRange ───────────────────────────────────────────
describe('dateRange', () => {
  it('should generate daily range', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-03');
    const dates = dateRange(start, end, 'day');
    expect(dates).toHaveLength(3);
  });

  it('should generate weekly range', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-22');
    const dates = dateRange(start, end, 'week');
    expect(dates).toHaveLength(4); // Jan 1, 8, 15, 22
  });

  it('should generate monthly range', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-03-01');
    const dates = dateRange(start, end, 'month');
    expect(dates).toHaveLength(3);
  });
});

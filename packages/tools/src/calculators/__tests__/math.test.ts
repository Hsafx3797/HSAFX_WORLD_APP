/**
 * Tests for packages/tools/src/calculators/math
 * Math operations and statistics
 */
import { describe, it, expect } from 'vitest';
import {
  add,
  subtract,
  multiply,
  divide,
  modulo,
  power,
  sqrt,
  nthRoot,
  calculateStatistics,
} from '../math.ts';

// ─── Basic Operations ────────────────────────────────────
describe('add', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should add multiple numbers', () => {
    expect(add(1, 2, 3, 4)).toBe(10);
  });

  it('should return 0 for no arguments', () => {
    expect(add()).toBe(0);
  });

  it('should handle negative numbers', () => {
    expect(add(-5, 3)).toBe(-2);
  });
});

describe('subtract', () => {
  it('should subtract two numbers', () => {
    expect(subtract(10, 3)).toBe(7);
  });

  it('should handle negative result', () => {
    expect(subtract(3, 10)).toBe(-7);
  });
});

describe('multiply', () => {
  it('should multiply two numbers', () => {
    expect(multiply(4, 5)).toBe(20);
  });

  it('should multiply multiple numbers', () => {
    expect(multiply(2, 3, 4)).toBe(24);
  });

  it('should return 1 for no arguments', () => {
    expect(multiply()).toBe(1);
  });

  it('should handle zero', () => {
    expect(multiply(5, 0)).toBe(0);
  });
});

describe('divide', () => {
  it('should divide two numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should throw on division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('should handle decimal results', () => {
    expect(divide(1, 3)).toBeCloseTo(0.3333, 3);
  });
});

describe('modulo', () => {
  it('should return remainder', () => {
    expect(modulo(10, 3)).toBe(1);
    expect(modulo(9, 3)).toBe(0);
  });
});

describe('power', () => {
  it('should compute power', () => {
    expect(power(2, 10)).toBe(1024);
    expect(power(3, 3)).toBe(27);
  });

  it('should handle zero exponent', () => {
    expect(power(5, 0)).toBe(1);
  });
});

describe('sqrt', () => {
  it('should compute square root', () => {
    expect(sqrt(9)).toBe(3);
    expect(sqrt(144)).toBe(12);
    expect(sqrt(0)).toBe(0);
  });

  it('should throw for negative numbers', () => {
    expect(() => sqrt(-1)).toThrow('Cannot compute square root of negative number');
  });
});

describe('nthRoot', () => {
  it('should compute cube root', () => {
    expect(nthRoot(27, 3)).toBeCloseTo(3);
  });

  it('should compute 4th root', () => {
    expect(nthRoot(16, 4)).toBeCloseTo(2);
  });

  it('should throw for even root of negative number', () => {
    expect(() => nthRoot(-16, 2)).toThrow('Cannot compute even root of negative number');
  });

  it('should handle cube root of negative', () => {
    expect(nthRoot(-27, 3)).toBeCloseTo(-3);
  });
});

// ─── Statistics ──────────────────────────────────────────
describe('calculateStatistics', () => {
  it('should throw for empty array', () => {
    expect(() => calculateStatistics([])).toThrow('Cannot calculate statistics of empty array');
  });

  it('should calculate basic statistics', () => {
    const result = calculateStatistics([1, 2, 3, 4, 5]);
    expect(result.count).toBe(5);
    expect(result.sum).toBe(15);
    expect(result.mean).toBe(3);
    expect(result.median).toBe(3);
    expect(result.min).toBe(1);
    expect(result.max).toBe(5);
    expect(result.range).toBe(4);
  });

  it('should calculate median for even count', () => {
    const result = calculateStatistics([1, 2, 3, 4]);
    expect(result.median).toBe(2.5);
  });

  it('should calculate variance and standard deviation', () => {
    const result = calculateStatistics([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result.mean).toBe(5);
    expect(result.variance).toBe(4);
    expect(result.standardDeviation).toBe(2);
  });

  it('should find mode', () => {
    const result = calculateStatistics([1, 2, 2, 3, 3, 3, 4]);
    expect(result.mode).toContain(3);
  });

  it('should handle single value', () => {
    const result = calculateStatistics([42]);
    expect(result.count).toBe(1);
    expect(result.mean).toBe(42);
    expect(result.median).toBe(42);
    expect(result.variance).toBe(0);
  });
});

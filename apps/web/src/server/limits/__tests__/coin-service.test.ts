/**
 * Coin Service Tests
 * Tests for the coin reservation lifecycle: calculateCoinCost (pure),
 * and InsufficientCoinsError.
 *
 * DB-dependent functions (reserveCoins, confirmReservation, releaseReservation)
 * require a live database and are covered by integration tests.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateCoinCost,
  InsufficientCoinsError,
} from '../coin-service';

// ─── calculateCoinCost ──────────────────────────────────────

describe('calculateCoinCost', () => {
  it('should return ceiled cost with no discount', () => {
    // 1 × 1.0 × (1 - 0/100) = 1
    expect(calculateCoinCost(1.0, 0, 1)).toBe(1);
  });

  it('should apply discount percentage', () => {
    // 1 × 1.0 × (1 - 50/100) = 0.5 → ceil = 1
    expect(calculateCoinCost(1.0, 50, 1)).toBe(1);
    // 1 × 2.0 × (1 - 50/100) = 1.0 → ceil = 1
    expect(calculateCoinCost(2.0, 50, 1)).toBe(1);
  });

  it('should multiply by successCount', () => {
    // 5 × 0.2 × (1 - 0/100) = 1.0
    expect(calculateCoinCost(0.2, 0, 5)).toBe(1);
    // 10 × 0.2 × (1 - 0/100) = 2.0
    expect(calculateCoinCost(0.2, 0, 10)).toBe(2);
  });

  it('should ceil fractional results', () => {
    // 1 × 0.3 × 1 = 0.3 → ceil = 1
    expect(calculateCoinCost(0.3, 0, 1)).toBe(1);
    // 3 × 0.1 × 1 = 0.3 → ceil = 1
    expect(calculateCoinCost(0.1, 0, 3)).toBe(1);
    // 7 × 0.1 × 1 = 0.7 → ceil = 1
    expect(calculateCoinCost(0.1, 0, 7)).toBe(1);
    // 11 × 0.1 × 1 = 1.1 → ceil = 2
    expect(calculateCoinCost(0.1, 0, 11)).toBe(2);
  });

  it('should return 0 for 100% discount', () => {
    expect(calculateCoinCost(1.0, 100, 1)).toBe(0);
    expect(calculateCoinCost(5.0, 100, 10)).toBe(0);
  });

  it('should default successCount to 1', () => {
    expect(calculateCoinCost(1.0, 0)).toBe(1);
  });

  it('should handle small BA weights correctly', () => {
    // Calculator class: 0.1 × 1 × 1 = 0.1 → ceil = 1
    expect(calculateCoinCost(0.1, 0, 1)).toBe(1);
    // Text transform: 0.2 × 1 × 1 = 0.2 → ceil = 1
    expect(calculateCoinCost(0.2, 0, 1)).toBe(1);
  });

  it('should handle combined discount + high volume', () => {
    // 100 × 1.0 × (1 - 25/100) = 75
    expect(calculateCoinCost(1.0, 25, 100)).toBe(75);
    // 100 × 0.2 × (1 - 10/100) = 18
    expect(calculateCoinCost(0.2, 10, 100)).toBe(18);
  });
});

// ─── InsufficientCoinsError ─────────────────────────────────

describe('InsufficientCoinsError', () => {
  it('should expose currentBalance and requiredAmount', () => {
    const err = new InsufficientCoinsError(50, 100);
    expect(err.currentBalance).toBe(50);
    expect(err.requiredAmount).toBe(100);
    expect(err.name).toBe('InsufficientCoinsError');
  });

  it('should produce a descriptive message', () => {
    const err = new InsufficientCoinsError(10, 25);
    expect(err.message).toContain('10');
    expect(err.message).toContain('25');
  });

  it('should be instanceof Error', () => {
    const err = new InsufficientCoinsError(0, 1);
    expect(err).toBeInstanceOf(Error);
  });
});

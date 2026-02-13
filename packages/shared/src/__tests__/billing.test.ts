/**
 * Tests for packages/shared/src/billing
 * Tool costs, coin packs, billing validation — all pure functions
 */
import { describe, it, expect } from 'vitest';
import {
  calculateToolCost,
  isToolFree,
  getDefaultCostConfig,
  FREE_TOOLS,
  DEFAULT_COSTS_BY_CATEGORY,
} from '../billing/tool-costs';
import {
  getCoinPack,
  getEffectiveCoins,
  getCostPerCoin,
  getBestValuePack,
  COIN_PACKS,
  LOGIN_REWARD_CONFIG,
} from '../billing/coin-packs';
import {
  validateSufficientBalance,
  validatePositiveAmount,
  validateTransactionType,
  createBillingError,
  createBillingSuccess,
  formatCoinAmount,
  parseCoinCost,
  calculateTransactionSummary,
} from '../billing/validation';

// ══════════════════════════════════════════════════════════
// Tool Costs
// ══════════════════════════════════════════════════════════

describe('calculateToolCost', () => {
  it('should return 0 for unlimited free quota', () => {
    const config = {
      toolId: 'test', toolName: 'Test',
      baseCost: 5, perUnitCost: 1, unitType: 'none' as const,
      maxCost: 10, freeQuota: -1,
    };
    expect(calculateToolCost(config, 1, 0)).toBe(0);
  });

  it('should return 0 within free quota', () => {
    const config = {
      toolId: 'test', toolName: 'Test',
      baseCost: 5, perUnitCost: 1, unitType: 'none' as const,
      maxCost: 10, freeQuota: 5,
    };
    expect(calculateToolCost(config, 1, 3)).toBe(0);
  });

  it('should charge baseCost when free quota exhausted', () => {
    const config = {
      toolId: 'test', toolName: 'Test',
      baseCost: 5, perUnitCost: 0, unitType: 'none' as const,
      maxCost: 10, freeQuota: 5,
    };
    expect(calculateToolCost(config, 1, 5)).toBe(5);
  });

  it('should add per-unit cost', () => {
    const config = {
      toolId: 'test', toolName: 'Test',
      baseCost: 2, perUnitCost: 1, unitType: 'mb' as const,
      maxCost: 20, freeQuota: 0,
    };
    expect(calculateToolCost(config, 5, 0)).toBe(7); // 2 + 5*1
  });

  it('should cap at maxCost', () => {
    const config = {
      toolId: 'test', toolName: 'Test',
      baseCost: 10, perUnitCost: 5, unitType: 'file' as const,
      maxCost: 15, freeQuota: 0,
    };
    expect(calculateToolCost(config, 10, 0)).toBe(15); // capped
  });
});

describe('isToolFree', () => {
  it('should return true for known free tools', () => {
    expect(isToolFree('gpa-calculator')).toBe(true);
    expect(isToolFree('word-counter')).toBe(true);
    expect(isToolFree('json-validator')).toBe(true);
  });

  it('should return false for paid tools', () => {
    expect(isToolFree('image-compressor')).toBe(false);
    expect(isToolFree('random-slug')).toBe(false);
  });
});

describe('FREE_TOOLS', () => {
  it('should contain expected free tools', () => {
    expect(FREE_TOOLS).toContain('gpa-calculator');
    expect(FREE_TOOLS).toContain('unit-converter');
    expect(FREE_TOOLS.length).toBeGreaterThan(20);
  });
});

describe('getDefaultCostConfig', () => {
  it('should return config for known category', () => {
    const config = getDefaultCostConfig('calculators');
    expect(config.baseCost).toBe(0);
    expect(config.freeQuota).toBe(-1); // unlimited
  });

  it('should return fallback for unknown category', () => {
    const config = getDefaultCostConfig('nonexistent');
    expect(config.baseCost).toBe(1);
    expect(config.freeQuota).toBe(5);
  });
});

// ══════════════════════════════════════════════════════════
// Coin Packs
// ══════════════════════════════════════════════════════════

describe('getCoinPack', () => {
  it('should find pack by ID', () => {
    const pack = getCoinPack('starter');
    expect(pack).toBeDefined();
    expect(pack!.name).toBe('Starter Pack');
    expect(pack!.coins).toBe(100);
  });

  it('should return undefined for nonexistent pack', () => {
    expect(getCoinPack('nonexistent')).toBeUndefined();
  });
});

describe('getEffectiveCoins', () => {
  it('should include bonus coins', () => {
    const pack = getCoinPack('popular')!;
    expect(getEffectiveCoins(pack)).toBe(800); // 700 + 100
  });

  it('should return base coins when no bonus', () => {
    const pack = getCoinPack('starter')!;
    expect(getEffectiveCoins(pack)).toBe(100); // 100 + 0
  });
});

describe('getCostPerCoin', () => {
  it('should calculate cost per coin', () => {
    const pack = getCoinPack('starter')!;
    // priceInCents=499, coins=100, bonusCoins=0 → 499/100 = 4.99 cents per coin
    expect(getCostPerCoin(pack)).toBeCloseTo(499 / 100); // 4.99 cents/coin
  });

  it('should be cheaper for bigger packs', () => {
    const starter = getCostPerCoin(getCoinPack('starter')!);
    const ultimate = getCostPerCoin(getCoinPack('ultimate')!);
    expect(ultimate).toBeLessThan(starter);
  });
});

describe('getBestValuePack', () => {
  it('should return the pack with lowest cost per coin', () => {
    const best = getBestValuePack();
    const bestCPC = getCostPerCoin(best);

    for (const pack of COIN_PACKS) {
      expect(getCostPerCoin(pack)).toBeGreaterThanOrEqual(bestCPC);
    }
  });
});

describe('LOGIN_REWARD_CONFIG', () => {
  it('should have correct reward values per user decisions', () => {
    expect(LOGIN_REWARD_CONFIG.coinsPerReward).toBe(10);
    expect(LOGIN_REWARD_CONFIG.dailyCoinCap).toBe(50);
    expect(LOGIN_REWARD_CONFIG.hourlyCooldownMinutes).toBe(60);
  });
});

// ══════════════════════════════════════════════════════════
// Billing Validation
// ══════════════════════════════════════════════════════════

describe('validateSufficientBalance', () => {
  it('should succeed when balance is enough', () => {
    expect(validateSufficientBalance(100, 50)).toEqual({ success: true });
  });

  it('should succeed when balance equals amount', () => {
    expect(validateSufficientBalance(50, 50)).toEqual({ success: true });
  });

  it('should fail when balance is insufficient', () => {
    const result = validateSufficientBalance(10, 50);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('BILLING_3001');
  });
});

describe('validatePositiveAmount', () => {
  it('should succeed for positive amounts', () => {
    expect(validatePositiveAmount(1)).toEqual({ success: true });
    expect(validatePositiveAmount(0.01)).toEqual({ success: true });
  });

  it('should fail for zero', () => {
    expect(validatePositiveAmount(0).success).toBe(false);
  });

  it('should fail for negative', () => {
    expect(validatePositiveAmount(-5).success).toBe(false);
  });
});

describe('validateTransactionType', () => {
  it('should accept valid types', () => {
    expect(validateTransactionType('grant')).toBe(true);
    expect(validateTransactionType('purchase')).toBe(true);
    expect(validateTransactionType('spend')).toBe(true);
    expect(validateTransactionType('reward')).toBe(true);
  });

  it('should reject invalid types', () => {
    expect(validateTransactionType('invalid')).toBe(false);
    expect(validateTransactionType('')).toBe(false);
  });
});

describe('createBillingError', () => {
  it('should create error result', () => {
    const result = createBillingError('INSUFFICIENT_COINS', 'Not enough');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not enough');
    expect(result.errorCode).toBe('BILLING_3001');
  });
});

describe('createBillingSuccess', () => {
  it('should create success result', () => {
    const result = createBillingSuccess('tx-123', 500);
    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('tx-123');
    expect(result.newBalance).toBe(500);
  });
});

describe('formatCoinAmount', () => {
  it('should format small amounts as-is', () => {
    expect(formatCoinAmount(42)).toBe('42');
    expect(formatCoinAmount(999)).toBe('999');
  });

  it('should format thousands with K', () => {
    expect(formatCoinAmount(1500)).toBe('1.5K');
    expect(formatCoinAmount(10000)).toBe('10.0K');
  });

  it('should format millions with M', () => {
    expect(formatCoinAmount(2500000)).toBe('2.5M');
  });
});

describe('parseCoinCost', () => {
  it('should extract number from cost string', () => {
    expect(parseCoinCost('5 coins')).toBe(5);
    expect(parseCoinCost('100')).toBe(100);
  });

  it('should return 0 for invalid strings', () => {
    expect(parseCoinCost('free')).toBe(0);
    expect(parseCoinCost('')).toBe(0);
  });
});

describe('calculateTransactionSummary', () => {
  it('should calculate credits, debits, and net change', () => {
    const txs = [
      { amount: 100 },
      { amount: -30 },
      { amount: 50 },
      { amount: -20 },
    ];
    const summary = calculateTransactionSummary(txs);
    expect(summary.totalCredits).toBe(150);
    expect(summary.totalDebits).toBe(50);
    expect(summary.netChange).toBe(100);
    expect(summary.transactionCount).toBe(4);
  });

  it('should handle empty transactions', () => {
    const summary = calculateTransactionSummary([]);
    expect(summary.totalCredits).toBe(0);
    expect(summary.totalDebits).toBe(0);
    expect(summary.netChange).toBe(0);
    expect(summary.transactionCount).toBe(0);
  });
});

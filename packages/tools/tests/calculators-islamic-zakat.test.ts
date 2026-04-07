import { describe, it, expect } from 'vitest';
import { calculateZakat } from '../src/calculators/islamic';
import type { ZakatAssets, ZakatLiabilities } from '../src/calculators/islamic';

// Known internal constants (not exported, so we duplicate for test assertions)
const ZAKAT_RATE = 0.025;
const GOLD_NISAB_GRAMS = 85;
const SILVER_NISAB_GRAMS = 595;

// Standard test prices (per gram)
const GOLD_PRICE = 60; // $60/gram
const SILVER_PRICE = 0.75; // $0.75/gram

const nisabGold = GOLD_NISAB_GRAMS * GOLD_PRICE; // 85 * 60 = 5100
const nisabSilver = SILVER_NISAB_GRAMS * SILVER_PRICE; // 595 * 0.75 = 446.25

describe('Zakat Calculator', () => {
  describe('Constants', () => {
    it('uses 2.5% zakat rate', () => {
      const result = calculateZakat({ cashOnHand: 10000 }, {}, GOLD_PRICE, SILVER_PRICE);
      // 10000 * 0.025 = 250
      expect(result.zakatDue).toBeCloseTo(10000 * ZAKAT_RATE);
    });

    it('gold nisab is 85 grams', () => {
      const result = calculateZakat({ cashOnHand: 10000 }, {}, GOLD_PRICE, SILVER_PRICE);
      expect(result.nisabGold).toBeCloseTo(GOLD_NISAB_GRAMS * GOLD_PRICE);
    });

    it('silver nisab is 595 grams', () => {
      const result = calculateZakat({ cashOnHand: 10000 }, {}, GOLD_PRICE, SILVER_PRICE);
      expect(result.nisabSilver).toBeCloseTo(SILVER_NISAB_GRAMS * SILVER_PRICE);
    });
  });

  describe('Nisab threshold', () => {
    it('uses the lower of gold and silver nisab', () => {
      // Silver nisab (446.25) is lower than gold nisab (5100)
      const result = calculateZakat(
        { cashOnHand: 500 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      // 500 >= 446.25 so meetsNisab should be true
      expect(result.meetsNisab).toBe(true);
    });

    it('does not meet nisab when net worth is below threshold', () => {
      const result = calculateZakat(
        { cashOnHand: 400 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      // 400 < 446.25
      expect(result.meetsNisab).toBe(false);
      expect(result.zakatDue).toBe(0);
    });

    it('meets nisab just above threshold', () => {
      const result = calculateZakat(
        { cashOnHand: nisabSilver + 1 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.meetsNisab).toBe(true);
      expect(result.zakatDue).toBeCloseTo((nisabSilver + 1) * ZAKAT_RATE);
    });

    it('yields zero zakat when below nisab even with multiple assets', () => {
      const result = calculateZakat(
        { cashOnHand: 100, bankBalance: 100, savingsAccounts: 100 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      // 300 < 446.25
      expect(result.meetsNisab).toBe(false);
      expect(result.zakatDue).toBe(0);
      expect(result.breakdown.every(b => b.zakat === 0)).toBe(true);
    });
  });

  describe('Basic zakat calculation', () => {
    it('calculates 2.5% on cash above nisab', () => {
      const result = calculateZakat(
        { cashOnHand: 10000 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.totalAssets).toBe(10000);
      expect(result.totalLiabilities).toBe(0);
      expect(result.netWorth).toBe(10000);
      expect(result.zakatDue).toBeCloseTo(250); // 10000 * 0.025
    });

    it('deducts liabilities from net worth', () => {
      const result = calculateZakat(
        { cashOnHand: 10000 },
        { debts: 3000 },
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.totalAssets).toBe(10000);
      expect(result.totalLiabilities).toBe(3000);
      expect(result.netWorth).toBe(7000);
      expect(result.zakatDue).toBeCloseTo(175); // 7000 * 0.025
    });

    it('returns zero when liabilities exceed assets', () => {
      const result = calculateZakat(
        { cashOnHand: 1000 },
        { debts: 5000 },
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.netWorth).toBeLessThan(0);
      expect(result.meetsNisab).toBe(false);
      expect(result.zakatDue).toBe(0);
    });
  });

  describe('Asset categories', () => {
    it('sums all asset types correctly', () => {
      const assets: Partial<ZakatAssets> = {
        cashOnHand: 1000,
        bankBalance: 2000,
        savingsAccounts: 3000,
        stocks: 4000,
        mutualFunds: 500,
        bonds: 600,
        businessInventory: 700,
        businessCash: 800,
        accountsReceivable: 900,
        goldValue: 1000,
        silverValue: 200,
        rentalIncome: 300,
        otherAssets: 100,
      };
      const result = calculateZakat(assets, {}, GOLD_PRICE, SILVER_PRICE);
      expect(result.totalAssets).toBe(15100);
    });

    it('sums all liability types correctly', () => {
      const liabilities: Partial<ZakatLiabilities> = {
        debts: 1000,
        loans: 2000,
        unpaidBills: 500,
        otherLiabilities: 300,
      };
      const result = calculateZakat(
        { cashOnHand: 20000 },
        liabilities,
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.totalLiabilities).toBe(3800);
      expect(result.netWorth).toBe(16200);
      expect(result.zakatDue).toBeCloseTo(405); // 16200 * 0.025
    });

    it('handles partial assets (only some fields provided)', () => {
      const result = calculateZakat(
        { bankBalance: 5000, stocks: 3000 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.totalAssets).toBe(8000);
      expect(result.zakatDue).toBeCloseTo(200);
    });

    it('handles empty assets', () => {
      const result = calculateZakat({}, {}, GOLD_PRICE, SILVER_PRICE);
      expect(result.totalAssets).toBe(0);
      expect(result.meetsNisab).toBe(false);
      expect(result.zakatDue).toBe(0);
    });
  });

  describe('Breakdown', () => {
    it('generates breakdown per non-zero asset category', () => {
      const result = calculateZakat(
        { cashOnHand: 5000, bankBalance: 3000 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.breakdown.length).toBe(2);
      const cashEntry = result.breakdown.find(b => b.category === 'Cash on Hand');
      const bankEntry = result.breakdown.find(b => b.category === 'Bank Balance');
      expect(cashEntry).toBeDefined();
      expect(cashEntry!.amount).toBe(5000);
      expect(cashEntry!.zakat).toBeCloseTo(125);
      expect(bankEntry).toBeDefined();
      expect(bankEntry!.amount).toBe(3000);
      expect(bankEntry!.zakat).toBeCloseTo(75);
    });

    it('excludes zero-amount categories from breakdown', () => {
      const result = calculateZakat(
        { cashOnHand: 5000, bankBalance: 0 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.breakdown.every(b => b.amount > 0)).toBe(true);
    });

    it('sets breakdown zakat to zero when below nisab', () => {
      const result = calculateZakat(
        { cashOnHand: 100 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.breakdown.length).toBe(1);
      expect(result.breakdown[0].zakat).toBe(0);
    });
  });

  describe('Nisab amounts in result', () => {
    it('reports gold nisab value correctly', () => {
      const result = calculateZakat(
        { cashOnHand: 10000 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.nisabGold).toBeCloseTo(nisabGold);
    });

    it('reports silver nisab value correctly', () => {
      const result = calculateZakat(
        { cashOnHand: 10000 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.nisabSilver).toBeCloseTo(nisabSilver);
    });

    it('adjusts nisab with different metal prices', () => {
      const highGold = 200; // $200/gram
      const highSilver = 2; // $2/gram
      const result = calculateZakat(
        { cashOnHand: 50000 },
        {},
        highGold,
        highSilver,
      );
      expect(result.nisabGold).toBeCloseTo(85 * 200); // 17000
      expect(result.nisabSilver).toBeCloseTo(595 * 2); // 1190
    });
  });

  describe('Edge cases', () => {
    it('handles very large asset values', () => {
      const result = calculateZakat(
        { cashOnHand: 1_000_000_000 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.zakatDue).toBeCloseTo(25_000_000);
    });

    it('handles fractional amounts', () => {
      const result = calculateZakat(
        { cashOnHand: 10000.50 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.zakatDue).toBeCloseTo(250.0125);
    });

    it('handles liabilities bringing net worth just below nisab', () => {
      const result = calculateZakat(
        { cashOnHand: 500 },
        { debts: 100 },
        GOLD_PRICE,
        SILVER_PRICE,
      );
      // netWorth = 400 < 446.25
      expect(result.meetsNisab).toBe(false);
      expect(result.zakatDue).toBe(0);
    });

    it('handles all liabilities set to zero', () => {
      const result = calculateZakat(
        { cashOnHand: 10000 },
        { debts: 0, loans: 0, unpaidBills: 0, otherLiabilities: 0 },
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.totalLiabilities).toBe(0);
      expect(result.zakatDue).toBeCloseTo(250);
    });

    it('handles gold and silver as only assets', () => {
      const result = calculateZakat(
        { goldValue: 5000, silverValue: 3000 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.totalAssets).toBe(8000);
      expect(result.zakatDue).toBeCloseTo(200);
    });

    it('handles business assets only', () => {
      const result = calculateZakat(
        { businessInventory: 50000, businessCash: 20000, accountsReceivable: 10000 },
        {},
        GOLD_PRICE,
        SILVER_PRICE,
      );
      expect(result.totalAssets).toBe(80000);
      expect(result.zakatDue).toBeCloseTo(2000);
    });
  });
});

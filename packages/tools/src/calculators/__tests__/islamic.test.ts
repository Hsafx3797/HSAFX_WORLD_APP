import { describe, it, expect } from 'vitest';
import {
  calculateZakat,
  calculateInheritance,
  type ZakatAssets,
  type ZakatLiabilities,
  type Heir,
} from '../islamic';

// ==================== ZAKAT CALCULATOR ====================

describe('calculateZakat', () => {
  const defaultGoldPrice = 100; // per gram
  const defaultSilverPrice = 1; // per gram
  // nisabGold = 85 * 100 = 8500
  // nisabSilver = 595 * 1 = 595

  it('should calculate zakat for basic cash assets', () => {
    const assets: Partial<ZakatAssets> = { cashOnHand: 10000 };
    const liabilities: Partial<ZakatLiabilities> = {};
    const result = calculateZakat(assets, liabilities, defaultGoldPrice, defaultSilverPrice);

    expect(result.totalAssets).toBe(10000);
    expect(result.totalLiabilities).toBe(0);
    expect(result.netWorth).toBe(10000);
    expect(result.meetsNisab).toBe(true);
    expect(result.zakatDue).toBeCloseTo(250, 2); // 10000 * 0.025
  });

  it('should sum all asset categories correctly', () => {
    const assets: Partial<ZakatAssets> = {
      cashOnHand: 1000,
      bankBalance: 2000,
      savingsAccounts: 3000,
      stocks: 4000,
      mutualFunds: 500,
      bonds: 500,
      businessInventory: 1000,
      businessCash: 1000,
      accountsReceivable: 500,
      goldValue: 2000,
      silverValue: 500,
      rentalIncome: 1000,
      otherAssets: 500,
    };
    const result = calculateZakat(assets, {}, defaultGoldPrice, defaultSilverPrice);
    expect(result.totalAssets).toBe(17500);
  });

  it('should sum all liability categories correctly', () => {
    const liabilities: Partial<ZakatLiabilities> = {
      debts: 1000,
      loans: 2000,
      unpaidBills: 500,
      otherLiabilities: 500,
    };
    const result = calculateZakat({ cashOnHand: 20000 }, liabilities, defaultGoldPrice, defaultSilverPrice);
    expect(result.totalLiabilities).toBe(4000);
    expect(result.netWorth).toBe(16000);
  });

  it('should return zero zakat when below nisab threshold', () => {
    // netWorth = 400 < nisabSilver = 595
    const result = calculateZakat({ cashOnHand: 400 }, {}, defaultGoldPrice, defaultSilverPrice);
    expect(result.meetsNisab).toBe(false);
    expect(result.zakatDue).toBe(0);
  });

  it('should return zakat when exactly at nisab threshold', () => {
    // nisabSilver = 595
    const result = calculateZakat({ cashOnHand: 595 }, {}, defaultGoldPrice, defaultSilverPrice);
    expect(result.meetsNisab).toBe(true);
    expect(result.zakatDue).toBeCloseTo(595 * 0.025, 2);
  });

  it('should use silver nisab when it is lower than gold nisab', () => {
    // gold = 100/g -> nisabGold = 8500, silver = 1/g -> nisabSilver = 595
    const result = calculateZakat({ cashOnHand: 600 }, {}, 100, 1);
    expect(result.nisabGold).toBe(8500);
    expect(result.nisabSilver).toBe(595);
    expect(result.meetsNisab).toBe(true); // 600 >= 595
  });

  it('should use gold nisab when it is lower than silver nisab', () => {
    // gold = 50/g -> nisabGold = 4250, silver = 20/g -> nisabSilver = 11900
    const result = calculateZakat({ cashOnHand: 5000 }, {}, 50, 20);
    expect(result.nisabGold).toBe(4250);
    expect(result.nisabSilver).toBe(11900);
    expect(result.meetsNisab).toBe(true); // 5000 >= 4250
  });

  it('should not meet nisab when gold is lower and net worth is between thresholds', () => {
    // gold = 50/g -> nisabGold = 4250, silver = 20/g -> nisabSilver = 11900
    // 4000 < 4250 (lower threshold)
    const result = calculateZakat({ cashOnHand: 4000 }, {}, 50, 20);
    expect(result.meetsNisab).toBe(false);
  });

  it('should calculate nisab gold as 85 grams times price', () => {
    const result = calculateZakat({}, {}, 200, 1);
    expect(result.nisabGold).toBe(85 * 200);
  });

  it('should calculate nisab silver as 595 grams times price', () => {
    const result = calculateZakat({}, {}, 100, 5);
    expect(result.nisabSilver).toBe(595 * 5);
  });

  it('should handle zero assets and zero liabilities', () => {
    const result = calculateZakat({}, {}, defaultGoldPrice, defaultSilverPrice);
    expect(result.totalAssets).toBe(0);
    expect(result.totalLiabilities).toBe(0);
    expect(result.netWorth).toBe(0);
    expect(result.meetsNisab).toBe(false);
    expect(result.zakatDue).toBe(0);
    expect(result.breakdown).toHaveLength(0);
  });

  it('should handle negative net worth (liabilities exceed assets)', () => {
    const result = calculateZakat(
      { cashOnHand: 1000 },
      { debts: 5000 },
      defaultGoldPrice,
      defaultSilverPrice,
    );
    expect(result.netWorth).toBe(-4000);
    expect(result.meetsNisab).toBe(false);
    expect(result.zakatDue).toBe(0);
  });

  it('should apply 2.5% zakat rate on net worth', () => {
    const result = calculateZakat({ cashOnHand: 100000 }, {}, defaultGoldPrice, defaultSilverPrice);
    expect(result.zakatDue).toBeCloseTo(100000 * 0.025, 2);
  });

  it('should only include non-zero assets in breakdown', () => {
    const result = calculateZakat(
      { cashOnHand: 5000, goldValue: 3000 },
      {},
      defaultGoldPrice,
      defaultSilverPrice,
    );
    expect(result.breakdown).toHaveLength(2);
    expect(result.breakdown.map(b => b.category)).toEqual(['Cash on Hand', 'Gold']);
  });

  it('should calculate individual zakat per asset in breakdown', () => {
    const result = calculateZakat(
      { cashOnHand: 10000, bankBalance: 5000 },
      {},
      defaultGoldPrice,
      defaultSilverPrice,
    );
    const cashBreakdown = result.breakdown.find(b => b.category === 'Cash on Hand');
    const bankBreakdown = result.breakdown.find(b => b.category === 'Bank Balance');
    expect(cashBreakdown!.zakat).toBeCloseTo(10000 * 0.025, 2);
    expect(bankBreakdown!.zakat).toBeCloseTo(5000 * 0.025, 2);
  });

  it('should set breakdown zakat to zero when below nisab', () => {
    const result = calculateZakat({ cashOnHand: 100 }, {}, defaultGoldPrice, defaultSilverPrice);
    expect(result.meetsNisab).toBe(false);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0]!.zakat).toBe(0);
  });

  it('should handle only investment assets', () => {
    const assets: Partial<ZakatAssets> = { stocks: 20000, mutualFunds: 10000, bonds: 5000 };
    const result = calculateZakat(assets, {}, defaultGoldPrice, defaultSilverPrice);
    expect(result.totalAssets).toBe(35000);
    expect(result.zakatDue).toBeCloseTo(35000 * 0.025, 2);
  });

  it('should handle only precious metals', () => {
    const assets: Partial<ZakatAssets> = { goldValue: 10000, silverValue: 2000 };
    const result = calculateZakat(assets, {}, defaultGoldPrice, defaultSilverPrice);
    expect(result.totalAssets).toBe(12000);
    expect(result.zakatDue).toBeCloseTo(12000 * 0.025, 2);
  });

  it('should handle only business assets', () => {
    const assets: Partial<ZakatAssets> = {
      businessInventory: 50000,
      businessCash: 10000,
      accountsReceivable: 5000,
    };
    const result = calculateZakat(assets, {}, defaultGoldPrice, defaultSilverPrice);
    expect(result.totalAssets).toBe(65000);
  });

  it('should handle very large estate values', () => {
    const result = calculateZakat(
      { cashOnHand: 1_000_000_000 },
      {},
      defaultGoldPrice,
      defaultSilverPrice,
    );
    expect(result.zakatDue).toBeCloseTo(25_000_000, 0);
  });

  it('should correctly label all breakdown categories', () => {
    const assets: Partial<ZakatAssets> = {
      cashOnHand: 1,
      bankBalance: 1,
      savingsAccounts: 1,
      stocks: 1,
      mutualFunds: 1,
      bonds: 1,
      businessInventory: 1,
      businessCash: 1,
      accountsReceivable: 1,
      goldValue: 1,
      silverValue: 1,
      rentalIncome: 1,
      otherAssets: 1,
    };
    const result = calculateZakat(assets, {}, defaultGoldPrice, defaultSilverPrice);
    const categories = result.breakdown.map(b => b.category);
    expect(categories).toContain('Cash on Hand');
    expect(categories).toContain('Bank Balance');
    expect(categories).toContain('Savings Accounts');
    expect(categories).toContain('Stocks');
    expect(categories).toContain('Mutual Funds');
    expect(categories).toContain('Bonds');
    expect(categories).toContain('Business Inventory');
    expect(categories).toContain('Business Cash');
    expect(categories).toContain('Accounts Receivable');
    expect(categories).toContain('Gold');
    expect(categories).toContain('Silver');
    expect(categories).toContain('Rental Income');
    expect(categories).toContain('Other Assets');
  });

  it('should compute netWorth as totalAssets minus totalLiabilities', () => {
    const result = calculateZakat(
      { cashOnHand: 50000 },
      { debts: 10000, loans: 5000 },
      defaultGoldPrice,
      defaultSilverPrice,
    );
    expect(result.netWorth).toBe(result.totalAssets - result.totalLiabilities);
  });

  it('should deduct liabilities from zakat calculation but not from breakdown asset amounts', () => {
    const result = calculateZakat(
      { cashOnHand: 10000 },
      { debts: 2000 },
      defaultGoldPrice,
      defaultSilverPrice,
    );
    // zakatDue is based on net worth
    expect(result.zakatDue).toBeCloseTo(8000 * 0.025, 2);
    // breakdown shows asset amount without liability deduction
    expect(result.breakdown[0]!.amount).toBe(10000);
    expect(result.breakdown[0]!.zakat).toBeCloseTo(10000 * 0.025, 2);
  });

  it('should treat undefined asset fields as zero', () => {
    const result = calculateZakat(
      { cashOnHand: 1000 },
      {},
      defaultGoldPrice,
      defaultSilverPrice,
    );
    // Only cashOnHand is non-zero
    expect(result.totalAssets).toBe(1000);
    expect(result.breakdown).toHaveLength(1);
  });

  it('should treat undefined liability fields as zero', () => {
    const result = calculateZakat(
      { cashOnHand: 5000 },
      { debts: 1000 },
      defaultGoldPrice,
      defaultSilverPrice,
    );
    expect(result.totalLiabilities).toBe(1000);
  });
});

// ==================== INHERITANCE (FARAID) CALCULATOR ====================

describe('calculateInheritance', () => {
  it('should return zero distributable estate when debts exceed estate', () => {
    const result = calculateInheritance(10000, [], 15000, 0, 0);
    expect(result.distributableEstate).toBe(0);
    expect(result.shares).toHaveLength(0);
    expect(result.residue).toBe(0);
    expect(result.notes).toContain('Estate is insufficient to cover debts and expenses');
  });

  it('should limit bequests to 1/3 of estate', () => {
    const heirs: Heir[] = [{ relation: 'son', gender: 'male', count: 1 }];
    const result = calculateInheritance(90000, heirs, 0, 0, 40000);
    expect(result.bequests).toBe(30000); // 90000 / 3
    expect(result.notes).toContain('Bequests limited to 1/3 of estate');
  });

  it('should allow bequests within 1/3 limit', () => {
    const heirs: Heir[] = [{ relation: 'son', gender: 'male', count: 1 }];
    const result = calculateInheritance(90000, heirs, 0, 0, 20000);
    expect(result.bequests).toBe(20000);
    expect(result.notes).not.toContain('Bequests limited to 1/3 of estate');
  });

  it('should deduct debts and funeral costs from estate', () => {
    const heirs: Heir[] = [{ relation: 'son', gender: 'male', count: 1 }];
    const result = calculateInheritance(100000, heirs, 10000, 5000, 0);
    expect(result.distributableEstate).toBe(85000);
  });

  it('should give husband 1/2 when there are no descendants', () => {
    const heirs: Heir[] = [{ relation: 'husband', gender: 'male', count: 1 }];
    const result = calculateInheritance(100000, heirs);
    const husbandShare = result.shares.find(s => s.relation === 'husband');
    expect(husbandShare).toBeDefined();
    expect(husbandShare!.fraction).toBe('1/2');
    expect(husbandShare!.amount).toBeCloseTo(50000, 0);
    expect(husbandShare!.percentage).toBeCloseTo(50, 0);
  });

  it('should give husband 1/4 when there are descendants', () => {
    const heirs: Heir[] = [
      { relation: 'husband', gender: 'male', count: 1 },
      { relation: 'son', gender: 'male', count: 1 },
    ];
    const result = calculateInheritance(100000, heirs);
    const husbandShare = result.shares.find(s => s.relation === 'husband');
    expect(husbandShare!.fraction).toBe('1/4');
    expect(husbandShare!.amount).toBeCloseTo(25000, 0);
  });

  it('should give wife 1/8 when there are descendants', () => {
    const heirs: Heir[] = [
      { relation: 'wife', gender: 'female', count: 1 },
      { relation: 'son', gender: 'male', count: 1 },
    ];
    const result = calculateInheritance(1000000, heirs);
    const wifeShare = result.shares.find(s => s.relation === 'wife');
    expect(wifeShare!.fraction).toBe('1/8');
    expect(wifeShare!.amount).toBeCloseTo(125000, 0);
  });

  it('should give wife 1/4 when there are no descendants', () => {
    const heirs: Heir[] = [{ relation: 'wife', gender: 'female', count: 1 }];
    const result = calculateInheritance(100000, heirs);
    const wifeShare = result.shares.find(s => s.relation === 'wife');
    expect(wifeShare!.fraction).toBe('1/4');
    expect(wifeShare!.amount).toBeCloseTo(25000, 0);
  });

  it('should give son the full residue when he is sole heir', () => {
    const heirs: Heir[] = [{ relation: 'son', gender: 'male', count: 1 }];
    const result = calculateInheritance(100000, heirs);
    const sonShare = result.shares.find(s => s.relation === 'son');
    expect(sonShare!.amount).toBeCloseTo(100000, 0);
    expect(sonShare!.shareType).toBe('Residue');
  });

  it('should split residue equally among multiple sons', () => {
    const heirs: Heir[] = [{ relation: 'son', gender: 'male', count: 3 }];
    const result = calculateInheritance(90000, heirs);
    const sonShare = result.shares.find(s => s.relation === 'son');
    expect(sonShare!.amount).toBeCloseTo(90000, 0);
    expect(sonShare!.perPerson).toBeCloseTo(30000, 0);
  });

  it('should give single daughter 1/2 of estate', () => {
    const heirs: Heir[] = [{ relation: 'daughter', gender: 'female', count: 1 }];
    const result = calculateInheritance(100000, heirs);
    const daughterShare = result.shares.find(s => s.relation === 'daughter');
    expect(daughterShare!.fraction).toBe('1/2');
    expect(daughterShare!.amount).toBeCloseTo(50000, 0);
  });

  it('should give 2+ daughters 2/3 of estate', () => {
    const heirs: Heir[] = [{ relation: 'daughter', gender: 'female', count: 2 }];
    const result = calculateInheritance(100000, heirs);
    const daughterShare = result.shares.find(s => s.relation === 'daughter');
    expect(daughterShare!.fraction).toBe('2/3');
    expect(daughterShare!.amount).toBeCloseTo(66666.67, 0);
    expect(daughterShare!.perPerson).toBeCloseTo(33333.33, 0);
  });

  it('should give daughter residue when son is present (2:1 ratio)', () => {
    const heirs: Heir[] = [
      { relation: 'son', gender: 'male', count: 1 },
      { relation: 'daughter', gender: 'female', count: 1 },
    ];
    const result = calculateInheritance(90000, heirs);
    const sonShare = result.shares.find(s => s.relation === 'son');
    const daughterShare = result.shares.find(s => s.relation === 'daughter');
    // totalParts = 2+1=3, son gets 2/3, daughter gets 1/3
    expect(sonShare!.amount).toBeCloseTo(60000, 0);
    expect(daughterShare!.amount).toBeCloseTo(30000, 0);
    expect(sonShare!.shareType).toBe('Residue');
    expect(daughterShare!.shareType).toBe('Residue');
  });

  it('should give father 1/6 when son is present', () => {
    const heirs: Heir[] = [
      { relation: 'father', gender: 'male', count: 1 },
      { relation: 'son', gender: 'male', count: 1 },
    ];
    const result = calculateInheritance(120000, heirs);
    const fatherShare = result.shares.find(s => s.relation === 'father');
    expect(fatherShare!.fraction).toBe('1/6');
    expect(fatherShare!.amount).toBeCloseTo(20000, 0);
  });

  it('should give father residue when no son is present', () => {
    const heirs: Heir[] = [{ relation: 'father', gender: 'male', count: 1 }];
    const result = calculateInheritance(100000, heirs);
    const fatherShare = result.shares.find(s => s.relation === 'father');
    expect(fatherShare!.shareType).toBe('Residue');
    expect(fatherShare!.amount).toBeCloseTo(100000, 0);
  });

  it('should give mother 1/6 when descendants are present', () => {
    const heirs: Heir[] = [
      { relation: 'mother', gender: 'female', count: 1 },
      { relation: 'son', gender: 'male', count: 1 },
    ];
    const result = calculateInheritance(120000, heirs);
    const motherShare = result.shares.find(s => s.relation === 'mother');
    expect(motherShare!.fraction).toBe('1/6');
    expect(motherShare!.amount).toBeCloseTo(20000, 0);
  });

  it('should give mother 1/3 when no descendants are present', () => {
    const heirs: Heir[] = [{ relation: 'mother', gender: 'female', count: 1 }];
    const result = calculateInheritance(120000, heirs);
    const motherShare = result.shares.find(s => s.relation === 'mother');
    expect(motherShare!.fraction).toBe('1/3');
    expect(motherShare!.amount).toBeCloseTo(40000, 0);
  });

  it('should distribute wife + son correctly', () => {
    const heirs: Heir[] = [
      { relation: 'wife', gender: 'female', count: 1 },
      { relation: 'son', gender: 'male', count: 1 },
    ];
    const result = calculateInheritance(1000000, heirs);
    const wifeShare = result.shares.find(s => s.relation === 'wife')!;
    const sonShare = result.shares.find(s => s.relation === 'son')!;
    expect(wifeShare.amount).toBeCloseTo(125000, 0); // 1/8
    expect(sonShare.amount).toBeCloseTo(875000, 0); // 7/8 residue
    // Total should equal estate
    const total = result.shares.reduce((s, h) => s + h.amount, 0);
    expect(total).toBeCloseTo(1000000, 0);
  });

  it('should distribute wife + son + daughter with 2:1 residue ratio', () => {
    const heirs: Heir[] = [
      { relation: 'wife', gender: 'female', count: 1 },
      { relation: 'son', gender: 'male', count: 1 },
      { relation: 'daughter', gender: 'female', count: 1 },
    ];
    const result = calculateInheritance(1200000, heirs);
    const wifeShare = result.shares.find(s => s.relation === 'wife')!;
    const sonShare = result.shares.find(s => s.relation === 'son')!;
    const daughterShare = result.shares.find(s => s.relation === 'daughter')!;
    // wife = 1/8 * 1200000 = 150000
    expect(wifeShare.amount).toBeCloseTo(150000, 0);
    // residue = 1050000, son gets 2/3, daughter gets 1/3
    expect(sonShare.amount).toBeCloseTo(700000, 0);
    expect(daughterShare.amount).toBeCloseTo(350000, 0);
  });

  it('should apply Aul (proportional reduction) when shares exceed estate', () => {
    // husband + mother + 2 daughters = 1/4 + 1/6 + 2/3 = 13/12 > 1
    const heirs: Heir[] = [
      { relation: 'husband', gender: 'male', count: 1 },
      { relation: 'mother', gender: 'female', count: 1 },
      { relation: 'daughter', gender: 'female', count: 2 },
    ];
    const result = calculateInheritance(240000, heirs);
    expect(result.notes).toContain('Aul (proportional reduction) applied due to shares exceeding estate');
    const total = result.shares.reduce((s, h) => s + h.amount, 0);
    expect(total).toBeCloseTo(240000, 0);
  });

  it('should note Radd when there is excess and no residuary heirs', () => {
    // husband alone -> 1/2, leftover 1/2
    const heirs: Heir[] = [{ relation: 'husband', gender: 'male', count: 1 }];
    const result = calculateInheritance(100000, heirs);
    expect(result.notes).toContain('Radd (return) may apply - excess returned to eligible heirs');
    expect(result.residue).toBeCloseTo(50000, 0);
  });

  it('should set residue to zero when residuary heirs consume it', () => {
    const heirs: Heir[] = [
      { relation: 'wife', gender: 'female', count: 1 },
      { relation: 'son', gender: 'male', count: 1 },
    ];
    const result = calculateInheritance(100000, heirs);
    expect(result.residue).toBe(0);
  });

  it('should note "No rule found" for heirs without defined rules', () => {
    const heirs: Heir[] = [{ relation: 'uncle', gender: 'male', count: 1 }];
    const result = calculateInheritance(100000, heirs);
    expect(result.notes).toContain('No rule found for uncle');
    expect(result.shares).toHaveLength(0);
  });

  it('should note "No rule found" for grandfather', () => {
    const heirs: Heir[] = [{ relation: 'grandfather', gender: 'male', count: 1 }];
    const result = calculateInheritance(100000, heirs);
    expect(result.notes).toContain('No rule found for grandfather');
  });

  it('should format singular heir name correctly', () => {
    const heirs: Heir[] = [{ relation: 'wife', gender: 'female', count: 1 }];
    const result = calculateInheritance(100000, heirs);
    expect(result.shares[0]!.heir).toBe('Wife');
  });

  it('should format plural heir name correctly', () => {
    const heirs: Heir[] = [{ relation: 'son', gender: 'male', count: 3 }];
    const result = calculateInheritance(100000, heirs);
    expect(result.shares[0]!.heir).toBe('3 Sons');
  });

  it('should format plural daughter name correctly', () => {
    const heirs: Heir[] = [{ relation: 'daughter', gender: 'female', count: 2 }];
    const result = calculateInheritance(100000, heirs);
    expect(result.shares[0]!.heir).toBe('2 Daughters');
  });

  it('should calculate perPerson for multiple wives', () => {
    const heirs: Heir[] = [{ relation: 'wife', gender: 'female', count: 2 }];
    const result = calculateInheritance(100000, heirs);
    const wifeShare = result.shares.find(s => s.relation === 'wife')!;
    // wife no children -> 1/4 total, split between 2
    expect(wifeShare.amount).toBeCloseTo(25000, 0);
    expect(wifeShare.perPerson).toBeCloseTo(12500, 0);
  });

  it('should handle zero estate', () => {
    const heirs: Heir[] = [{ relation: 'son', gender: 'male', count: 1 }];
    const result = calculateInheritance(0, heirs);
    expect(result.distributableEstate).toBe(0);
    expect(result.shares).toHaveLength(0);
    expect(result.notes).toContain('Estate is insufficient to cover debts and expenses');
  });

  it('should return all metadata fields in result', () => {
    const heirs: Heir[] = [{ relation: 'son', gender: 'male', count: 1 }];
    const result = calculateInheritance(100000, heirs, 5000, 2000, 3000);
    expect(result.estate).toBe(100000);
    expect(result.debts).toBe(5000);
    expect(result.funeralCosts).toBe(2000);
    expect(result.bequests).toBe(3000);
    expect(result.distributableEstate).toBe(90000);
  });

  it('should ensure total allocated shares do not exceed distributable estate', () => {
    const heirs: Heir[] = [
      { relation: 'wife', gender: 'female', count: 1 },
      { relation: 'father', gender: 'male', count: 1 },
      { relation: 'mother', gender: 'female', count: 1 },
      { relation: 'son', gender: 'male', count: 2 },
      { relation: 'daughter', gender: 'female', count: 1 },
    ];
    const result = calculateInheritance(500000, heirs);
    const total = result.shares.reduce((s, h) => s + h.amount, 0);
    expect(total).toBeLessThanOrEqual(result.distributableEstate + 0.01);
  });

  it('should handle distributable estate with all deductions', () => {
    const heirs: Heir[] = [{ relation: 'son', gender: 'male', count: 1 }];
    const result = calculateInheritance(100000, heirs, 10000, 5000, 15000);
    // distributableEstate = 100000 - 10000 - 5000 - 15000 = 70000
    expect(result.distributableEstate).toBe(70000);
    expect(result.shares[0]!.amount).toBeCloseTo(70000, 0);
  });

  it('should default debts, funeralCosts, bequests to zero', () => {
    const heirs: Heir[] = [{ relation: 'son', gender: 'male', count: 1 }];
    const result = calculateInheritance(100000, heirs);
    expect(result.debts).toBe(0);
    expect(result.funeralCosts).toBe(0);
    expect(result.bequests).toBe(0);
    expect(result.distributableEstate).toBe(100000);
  });

  it('should handle complex scenario: wife + father + mother + son', () => {
    const heirs: Heir[] = [
      { relation: 'wife', gender: 'female', count: 1 },
      { relation: 'father', gender: 'male', count: 1 },
      { relation: 'mother', gender: 'female', count: 1 },
      { relation: 'son', gender: 'male', count: 1 },
    ];
    const estate = 240000;
    const result = calculateInheritance(estate, heirs);
    // wife with descendants: 1/8 = 30000
    // father with son: 1/6 = 40000
    // mother with descendants: 1/6 = 40000
    // totalFixed = 1/8 + 1/6 + 1/6 = 3/24 + 4/24 + 4/24 = 11/24
    // residue = 240000 * 13/24 = 130000
    // son gets full residue
    const wifeShare = result.shares.find(s => s.relation === 'wife')!;
    const fatherShare = result.shares.find(s => s.relation === 'father')!;
    const motherShare = result.shares.find(s => s.relation === 'mother')!;
    const sonShare = result.shares.find(s => s.relation === 'son')!;
    expect(wifeShare.amount).toBeCloseTo(30000, 0);
    expect(fatherShare.amount).toBeCloseTo(40000, 0);
    expect(motherShare.amount).toBeCloseTo(40000, 0);
    expect(sonShare.amount).toBeCloseTo(130000, 0);
    const total = result.shares.reduce((s, h) => s + h.amount, 0);
    expect(total).toBeCloseTo(estate, 0);
  });

  it('should include count in share details', () => {
    const heirs: Heir[] = [{ relation: 'daughter', gender: 'female', count: 2 }];
    const result = calculateInheritance(100000, heirs);
    expect(result.shares[0]!.count).toBe(2);
    expect(result.shares[0]!.relation).toBe('daughter');
  });

  it('should return empty notes for straightforward cases', () => {
    const heirs: Heir[] = [
      { relation: 'wife', gender: 'female', count: 1 },
      { relation: 'son', gender: 'male', count: 1 },
    ];
    const result = calculateInheritance(100000, heirs);
    expect(result.notes).toHaveLength(0);
  });
});

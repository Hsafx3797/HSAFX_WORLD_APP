import { describe, it, expect } from 'vitest';
import {
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateLoanPayment,
  calculateMortgage,
  calculateInvestmentGrowth,
  calculateRetirement,
  calculateROI,
  calculateBreakEven,
  calculateDiscount,
  calculateMarkup,
  calculateProfitMargin,
  calculateTip,
  formatCurrency,
} from '../financial';

// ==================== SIMPLE INTEREST ====================

describe('calculateSimpleInterest', () => {
  it('calculates interest for (1000, 5, 1)', () => {
    const result = calculateSimpleInterest(1000, 5, 1);
    expect(result.interest).toBeCloseTo(50, 2);
    expect(result.total).toBeCloseTo(1050, 2);
  });

  it('calculates interest for (10000, 10, 5)', () => {
    const result = calculateSimpleInterest(10000, 10, 5);
    expect(result.interest).toBeCloseTo(5000, 2);
    expect(result.total).toBeCloseTo(15000, 2);
  });

  it('returns zero interest when principal is 0', () => {
    const result = calculateSimpleInterest(0, 5, 1);
    expect(result.interest).toBe(0);
    expect(result.total).toBe(0);
  });

  it('returns zero interest when rate is 0', () => {
    const result = calculateSimpleInterest(1000, 0, 5);
    expect(result.interest).toBe(0);
    expect(result.total).toBe(1000);
  });

  it('preserves metadata fields', () => {
    const result = calculateSimpleInterest(5000, 3, 2);
    expect(result.principal).toBe(5000);
    expect(result.rate).toBe(3);
    expect(result.time).toBe(2);
  });
});

// ==================== COMPOUND INTEREST ====================

describe('calculateCompoundInterest', () => {
  it('monthly compounding yields more than simple interest', () => {
    const result = calculateCompoundInterest(1000, 5, 1, 12);
    expect(result.total).toBeGreaterThan(1050);
  });

  it('annual compounding (1000, 5, 1, 1) ≈ 1050', () => {
    const result = calculateCompoundInterest(1000, 5, 1, 1);
    expect(result.total).toBeCloseTo(1050, 0);
  });

  it('schedule has correct number of periods (n*t)', () => {
    const result = calculateCompoundInterest(1000, 5, 3, 4);
    expect(result.schedule).toHaveLength(12); // 4 * 3
  });

  it('(10000, 8, 10, 4) total > 0', () => {
    const result = calculateCompoundInterest(10000, 8, 10, 4);
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(10000);
  });

  it('interest field equals total - principal', () => {
    const result = calculateCompoundInterest(5000, 6, 5, 12);
    expect(result.interest).toBeCloseTo(result.total - result.principal, 2);
  });

  it('preserves metadata fields', () => {
    const result = calculateCompoundInterest(2000, 4, 2, 12);
    expect(result.principal).toBe(2000);
    expect(result.rate).toBe(4);
    expect(result.time).toBe(2);
    expect(result.compoundsPerYear).toBe(12);
  });

  it('defaults to 12 compounds per year', () => {
    const result = calculateCompoundInterest(1000, 5, 1);
    expect(result.compoundsPerYear).toBe(12);
    expect(result.schedule).toHaveLength(12);
  });

  it('schedule balances increase over time', () => {
    const result = calculateCompoundInterest(1000, 5, 2, 4);
    for (let i = 1; i < result.schedule.length; i++) {
      expect(result.schedule[i].balance).toBeGreaterThan(result.schedule[i - 1].balance);
    }
  });
});

// ==================== LOAN PAYMENT ====================

describe('calculateLoanPayment', () => {
  it('(200000, 4, 30) → monthlyPayment ≈ 954.83', () => {
    const result = calculateLoanPayment(200000, 4, 30);
    expect(result.monthlyPayment).toBeCloseTo(954.83, 0);
  });

  it('amortizationSchedule length equals termYears * 12', () => {
    const result = calculateLoanPayment(200000, 4, 30);
    expect(result.amortizationSchedule).toHaveLength(360);
  });

  it('last balance ≈ 0', () => {
    const result = calculateLoanPayment(200000, 4, 30);
    const last = result.amortizationSchedule[result.amortizationSchedule.length - 1];
    expect(last.balance).toBeCloseTo(0, 0);
  });

  it('totalPayment > principal', () => {
    const result = calculateLoanPayment(200000, 4, 30);
    expect(result.totalPayment).toBeGreaterThan(200000);
  });

  it('totalInterest = totalPayment - principal', () => {
    const result = calculateLoanPayment(150000, 5, 15);
    expect(result.totalInterest).toBeCloseTo(result.totalPayment - result.principal, 2);
  });

  it('termMonths matches termYears * 12', () => {
    const result = calculateLoanPayment(100000, 3.5, 20);
    expect(result.termMonths).toBe(240);
  });

  it('each schedule entry has consistent payment amount', () => {
    const result = calculateLoanPayment(100000, 6, 10);
    for (const entry of result.amortizationSchedule) {
      expect(entry.payment).toBeCloseTo(result.monthlyPayment, 2);
    }
  });
});

// ==================== MORTGAGE ====================

describe('calculateMortgage', () => {
  it('(300000, 60000, 4, 30) → loanToValue = 80, no PMI', () => {
    const result = calculateMortgage(300000, 60000, 4, 30);
    expect(result.loanToValue).toBeCloseTo(80, 2);
    expect(result.pmi).toBeUndefined();
  });

  it('(300000, 30000, 4, 30, 0.5) → loanToValue = 90, has PMI', () => {
    const result = calculateMortgage(300000, 30000, 4, 30, 0.5);
    expect(result.loanToValue).toBeCloseTo(90, 2);
    expect(result.pmi).toBeDefined();
    expect(result.pmi).toBeGreaterThan(0);
  });

  it('downPayment subtracted correctly from loan principal', () => {
    const result = calculateMortgage(300000, 60000, 4, 30);
    expect(result.principal).toBe(240000);
  });

  it('homePrice and downPayment stored correctly', () => {
    const result = calculateMortgage(400000, 80000, 3.5, 30);
    expect(result.homePrice).toBe(400000);
    expect(result.downPayment).toBe(80000);
  });

  it('no PMI when LTV ≤ 80 even if pmiRate provided', () => {
    const result = calculateMortgage(300000, 60000, 4, 30, 0.5);
    expect(result.pmi).toBeUndefined();
  });

  it('PMI calculated correctly for high LTV', () => {
    const result = calculateMortgage(300000, 15000, 4, 30, 0.5);
    const loanAmount = 285000;
    const expectedPmi = (loanAmount * 0.005) / 12;
    expect(result.pmi).toBeCloseTo(expectedPmi, 2);
  });
});

// ==================== INVESTMENT GROWTH ====================

describe('calculateInvestmentGrowth', () => {
  it('(10000, 500, 8, 30) → finalValue >> initial', () => {
    const result = calculateInvestmentGrowth(10000, 500, 8, 30);
    expect(result.finalValue).toBeGreaterThan(10000);
    expect(result.finalValue).toBeGreaterThan(100000);
  });

  it('yearlyBreakdown length = years', () => {
    const result = calculateInvestmentGrowth(10000, 500, 8, 30);
    expect(result.yearlyBreakdown).toHaveLength(30);
  });

  it('totalContributions = initial + monthly*12*years', () => {
    const result = calculateInvestmentGrowth(10000, 500, 8, 30);
    expect(result.totalContributions).toBeCloseTo(10000 + 500 * 12 * 30, 2);
  });

  it('totalEarnings = finalValue - totalContributions', () => {
    const result = calculateInvestmentGrowth(5000, 200, 7, 20);
    expect(result.totalEarnings).toBeCloseTo(result.finalValue - result.totalContributions, 2);
  });

  it('preserves metadata', () => {
    const result = calculateInvestmentGrowth(10000, 500, 8, 30);
    expect(result.initialInvestment).toBe(10000);
    expect(result.monthlyContribution).toBe(500);
    expect(result.annualReturn).toBe(8);
    expect(result.years).toBe(30);
  });

  it('yearly balances increase over time', () => {
    const result = calculateInvestmentGrowth(10000, 500, 8, 10);
    for (let i = 1; i < result.yearlyBreakdown.length; i++) {
      expect(result.yearlyBreakdown[i].balance).toBeGreaterThan(
        result.yearlyBreakdown[i - 1].balance
      );
    }
  });

  it('zero monthly contribution still grows', () => {
    const result = calculateInvestmentGrowth(10000, 0, 8, 5);
    expect(result.finalValue).toBeGreaterThan(10000);
    expect(result.totalContributions).toBe(10000);
  });
});

// ==================== RETIREMENT ====================

describe('calculateRetirement', () => {
  it('(30, 65, 50000, 500, 7, 4) → retirementSavings > 0', () => {
    const result = calculateRetirement(30, 65, 50000, 500, 7, 4);
    expect(result.retirementSavings).toBeGreaterThan(0);
  });

  it('yearsInRetirement = 90 - retirementAge', () => {
    const result = calculateRetirement(30, 65, 50000, 500, 7, 4);
    expect(result.yearsInRetirement).toBe(25);
  });

  it('monthlyRetirementIncome > 0', () => {
    const result = calculateRetirement(30, 65, 50000, 500, 7, 4);
    expect(result.monthlyRetirementIncome).toBeGreaterThan(0);
  });

  it('preserves input metadata', () => {
    const result = calculateRetirement(30, 65, 50000, 500, 7, 4);
    expect(result.currentAge).toBe(30);
    expect(result.retirementAge).toBe(65);
    expect(result.currentSavings).toBe(50000);
    expect(result.monthlyContribution).toBe(500);
    expect(result.annualReturn).toBe(7);
  });

  it('defaults withdrawal rate to 4%', () => {
    const resultDefault = calculateRetirement(30, 65, 50000, 500, 7);
    const resultExplicit = calculateRetirement(30, 65, 50000, 500, 7, 4);
    expect(resultDefault.monthlyRetirementIncome).toBeCloseTo(
      resultExplicit.monthlyRetirementIncome,
      2
    );
  });

  it('higher contributions yield higher retirement savings', () => {
    const low = calculateRetirement(30, 65, 50000, 200, 7);
    const high = calculateRetirement(30, 65, 50000, 1000, 7);
    expect(high.retirementSavings).toBeGreaterThan(low.retirementSavings);
  });

  it('yearsInRetirement is 0 when retirementAge >= 90', () => {
    const result = calculateRetirement(30, 90, 50000, 500, 7);
    expect(result.yearsInRetirement).toBe(0);
  });
});

// ==================== ROI ====================

describe('calculateROI', () => {
  it('(1000, 1500) → roi=50, gain=500', () => {
    const result = calculateROI(1000, 1500);
    expect(result.roi).toBeCloseTo(50, 2);
    expect(result.gain).toBeCloseTo(500, 2);
  });

  it('(1000, 1500, 2) → annualizedReturn defined', () => {
    const result = calculateROI(1000, 1500, 2);
    expect(result.annualizedReturn).toBeDefined();
    expect(result.annualizedReturn).toBeGreaterThan(0);
    expect(result.holdingPeriodYears).toBe(2);
  });

  it('(1000, 500) → roi = -50', () => {
    const result = calculateROI(1000, 500);
    expect(result.roi).toBeCloseTo(-50, 2);
    expect(result.gain).toBeCloseTo(-500, 2);
  });

  it('no annualizedReturn when holdingPeriodYears omitted', () => {
    const result = calculateROI(1000, 1500);
    expect(result.annualizedReturn).toBeUndefined();
    expect(result.holdingPeriodYears).toBeUndefined();
  });

  it('roi = 0 when initial equals final', () => {
    const result = calculateROI(1000, 1000);
    expect(result.roi).toBe(0);
    expect(result.gain).toBe(0);
  });

  it('annualizedReturn for 1 year matches simple ROI', () => {
    const result = calculateROI(1000, 1200, 1);
    expect(result.annualizedReturn).toBeCloseTo(20, 2);
    expect(result.roi).toBeCloseTo(20, 2);
  });
});

// ==================== BREAK-EVEN ====================

describe('calculateBreakEven', () => {
  it('(10000, 5, 15) → breakEvenUnits=1000, contributionMargin=10', () => {
    const result = calculateBreakEven(10000, 5, 15);
    expect(result.breakEvenUnits).toBeCloseTo(1000, 2);
    expect(result.contributionMargin).toBeCloseTo(10, 2);
  });

  it('breakEvenRevenue = breakEvenUnits * pricePerUnit', () => {
    const result = calculateBreakEven(10000, 5, 15);
    expect(result.breakEvenRevenue).toBeCloseTo(15000, 2);
  });

  it('contributionMarginRatio = contributionMargin / pricePerUnit', () => {
    const result = calculateBreakEven(10000, 5, 15);
    expect(result.contributionMarginRatio).toBeCloseTo(10 / 15, 4);
  });

  it('preserves input values', () => {
    const result = calculateBreakEven(20000, 8, 25);
    expect(result.fixedCosts).toBe(20000);
    expect(result.variableCostPerUnit).toBe(8);
    expect(result.pricePerUnit).toBe(25);
  });
});

// ==================== DISCOUNT ====================

describe('calculateDiscount', () => {
  it('(100, 20) → finalPrice=80, savings=20', () => {
    const result = calculateDiscount(100, 20);
    expect(result.finalPrice).toBeCloseTo(80, 2);
    expect(result.savings).toBeCloseTo(20, 2);
  });

  it('returns original price when discount is 0', () => {
    const result = calculateDiscount(100, 0);
    expect(result.finalPrice).toBeCloseTo(100, 2);
    expect(result.savings).toBeCloseTo(0, 2);
  });

  it('returns 0 price when discount is 100%', () => {
    const result = calculateDiscount(250, 100);
    expect(result.finalPrice).toBeCloseTo(0, 2);
    expect(result.savings).toBeCloseTo(250, 2);
  });

  it('preserves originalPrice and discount percent', () => {
    const result = calculateDiscount(100, 20);
    expect(result.originalPrice).toBe(100);
    expect(result.discount).toBe(20);
  });
});

// ==================== MARKUP ====================

describe('calculateMarkup', () => {
  it('(100, 50) → sellingPrice=150, profit=50', () => {
    const result = calculateMarkup(100, 50);
    expect(result.sellingPrice).toBeCloseTo(150, 2);
    expect(result.profit).toBeCloseTo(50, 2);
  });

  it('profitMargin is correctly calculated', () => {
    const result = calculateMarkup(100, 50);
    expect(result.profitMargin).toBeCloseTo(33.33, 1);
  });

  it('zero markup yields cost as selling price', () => {
    const result = calculateMarkup(100, 0);
    expect(result.sellingPrice).toBe(100);
    expect(result.profit).toBe(0);
  });

  it('preserves cost and markup percent', () => {
    const result = calculateMarkup(100, 50);
    expect(result.cost).toBe(100);
    expect(result.markup).toBe(50);
  });
});

// ==================== PROFIT MARGIN ====================

describe('calculateProfitMargin', () => {
  it('(150, 100) → profit=50, profitMargin ≈ 33.33', () => {
    const result = calculateProfitMargin(150, 100);
    expect(result.profit).toBeCloseTo(50, 2);
    expect(result.profitMargin).toBeCloseTo(33.33, 1);
  });

  it('markup is calculated correctly', () => {
    const result = calculateProfitMargin(150, 100);
    expect(result.markup).toBeCloseTo(50, 2);
  });

  it('zero profit when revenue equals cost', () => {
    const result = calculateProfitMargin(100, 100);
    expect(result.profit).toBe(0);
    expect(result.profitMargin).toBe(0);
    expect(result.markup).toBe(0);
  });

  it('preserves revenue and cost', () => {
    const result = calculateProfitMargin(200, 120);
    expect(result.revenue).toBe(200);
    expect(result.cost).toBe(120);
  });
});

// ==================== TIP ====================

describe('calculateTip', () => {
  it('(100, 15, 1) → tip=15, total=115, no perPerson', () => {
    const result = calculateTip(100, 15, 1);
    expect(result.tipAmount).toBeCloseTo(15, 2);
    expect(result.total).toBeCloseTo(115, 2);
    expect(result.perPerson).toBeUndefined();
    expect(result.tipPerPerson).toBeUndefined();
  });

  it('(100, 20, 4) → perPerson defined', () => {
    const result = calculateTip(100, 20, 4);
    expect(result.tipAmount).toBeCloseTo(20, 2);
    expect(result.total).toBeCloseTo(120, 2);
    expect(result.perPerson).toBeDefined();
    expect(result.perPerson).toBeCloseTo(30, 2);
    expect(result.tipPerPerson).toBeCloseTo(5, 2);
  });

  it('defaults to 1 person (no split)', () => {
    const result = calculateTip(50, 10);
    expect(result.perPerson).toBeUndefined();
    expect(result.tipPerPerson).toBeUndefined();
    expect(result.total).toBeCloseTo(55, 2);
  });

  it('preserves billAmount and tipPercent', () => {
    const result = calculateTip(80, 18, 2);
    expect(result.billAmount).toBe(80);
    expect(result.tipPercent).toBe(18);
  });
});

// ==================== FORMAT CURRENCY ====================

describe('formatCurrency', () => {
  it('(1234.56, "USD") contains "$" and "1,234.56"', () => {
    const result = formatCurrency(1234.56, 'USD');
    expect(result).toContain('$');
    expect(result).toContain('1,234.56');
  });

  it('defaults to USD', () => {
    const result = formatCurrency(100);
    expect(result).toContain('$');
    expect(result).toContain('100.00');
  });

  it('formats EUR currency', () => {
    const result = formatCurrency(1000, 'EUR', 'de-DE');
    expect(result).toContain('€');
  });

  it('formats zero correctly', () => {
    const result = formatCurrency(0, 'USD');
    expect(result).toContain('$');
    expect(result).toContain('0.00');
  });

  it('formats negative amounts', () => {
    const result = formatCurrency(-500, 'USD');
    expect(result).toContain('500.00');
  });
});

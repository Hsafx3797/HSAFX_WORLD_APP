import { describe, it, expect } from 'vitest';
import { writeOutput } from './helpers';
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
} from '../src/calculators/financial';

// ==================== SIMPLE INTEREST ====================

describe('calculateSimpleInterest', () => {
  it('basic calculation', () => {
    const r = calculateSimpleInterest(1000, 5, 2);
    writeOutput('calculators', 'simple-interest.json', JSON.stringify(r, null, 2));
    expect(r.principal).toBe(1000);
    expect(r.rate).toBe(5);
    expect(r.time).toBe(2);
    expect(r.interest).toBe(100);
    expect(r.total).toBe(1100);
  });

  it('zero rate', () => {
    const r = calculateSimpleInterest(1000, 0, 5);
    expect(r.interest).toBe(0);
    expect(r.total).toBe(1000);
  });

  it('zero period', () => {
    const r = calculateSimpleInterest(1000, 10, 0);
    expect(r.interest).toBe(0);
  });

  it('large principal', () => {
    const r = calculateSimpleInterest(1_000_000, 3.5, 10);
    expect(r.interest).toBe(350000);
    expect(r.total).toBe(1_350_000);
  });

  it('fractional rate', () => {
    const r = calculateSimpleInterest(5000, 2.75, 3);
    expect(r.interest).toBeCloseTo(412.5);
  });
});

// ==================== COMPOUND INTEREST ====================

describe('calculateCompoundInterest', () => {
  it('monthly compounding', () => {
    const r = calculateCompoundInterest(1000, 12, 1, 12);
    writeOutput('calculators', 'compound-interest.json', JSON.stringify(r, null, 2));
    expect(r.total).toBeCloseTo(1126.83, 2);
    expect(r.interest).toBeCloseTo(126.83, 2);
    expect(r.schedule).toHaveLength(12);
  });

  it('annual compounding', () => {
    const r = calculateCompoundInterest(1000, 10, 3, 1);
    expect(r.total).toBeCloseTo(1331, 0);
    expect(r.schedule).toHaveLength(3);
  });

  it('default compounds per year is 12', () => {
    const r = calculateCompoundInterest(1000, 5, 1);
    expect(r.compoundsPerYear).toBe(12);
    expect(r.schedule).toHaveLength(12);
  });

  it('schedule balances increase monotonically', () => {
    const r = calculateCompoundInterest(10000, 6, 5, 12);
    for (let i = 1; i < r.schedule.length; i++) {
      expect(r.schedule[i].balance).toBeGreaterThan(r.schedule[i - 1].balance);
    }
  });

  it('zero rate means no interest', () => {
    const r = calculateCompoundInterest(1000, 0, 5, 12);
    expect(r.interest).toBeCloseTo(0);
    expect(r.total).toBeCloseTo(1000);
  });
});

// ==================== LOAN PAYMENT ====================

describe('calculateLoanPayment', () => {
  it('standard auto loan', () => {
    const r = calculateLoanPayment(25000, 4.5, 5);
    writeOutput('calculators', 'loan-payment.json', JSON.stringify(r, null, 2));
    expect(r.termMonths).toBe(60);
    expect(r.monthlyPayment).toBeCloseTo(466.08, 0);
    expect(r.totalInterest).toBeGreaterThan(0);
    expect(r.totalPayment).toBeGreaterThan(r.principal);
  });

  it('amortization schedule has correct length', () => {
    const r = calculateLoanPayment(10000, 5, 2);
    expect(r.amortizationSchedule).toHaveLength(24);
  });

  it('amortization last balance is approximately zero', () => {
    const r = calculateLoanPayment(10000, 6, 3);
    const last = r.amortizationSchedule[r.amortizationSchedule.length - 1];
    expect(last.balance).toBeCloseTo(0, 0);
  });

  it('early payments are interest-heavy', () => {
    const r = calculateLoanPayment(200000, 5, 30);
    const first = r.amortizationSchedule[0];
    const last = r.amortizationSchedule[r.amortizationSchedule.length - 1];
    expect(first.interest).toBeGreaterThan(first.principal);
    expect(last.principal).toBeGreaterThan(last.interest);
  });
});

// ==================== MORTGAGE ====================

describe('calculateMortgage', () => {
  it('standard mortgage with 20% down', () => {
    const r = calculateMortgage(300000, 60000, 3.5, 30);
    writeOutput('calculators', 'mortgage.json', JSON.stringify(r, null, 2));
    expect(r.homePrice).toBe(300000);
    expect(r.downPayment).toBe(60000);
    expect(r.principal).toBe(240000);
    expect(r.loanToValue).toBe(80);
    expect(r.pmi).toBeUndefined();
  });

  it('mortgage with PMI (LTV > 80%)', () => {
    const r = calculateMortgage(300000, 30000, 3.5, 30, 0.5);
    expect(r.loanToValue).toBe(90);
    expect(r.pmi).toBeDefined();
    expect(r.pmi).toBeGreaterThan(0);
  });

  it('no PMI when LTV <= 80% even if rate supplied', () => {
    const r = calculateMortgage(200000, 50000, 4, 15, 0.5);
    expect(r.loanToValue).toBe(75);
    expect(r.pmi).toBeUndefined();
  });
});

// ==================== INVESTMENT GROWTH ====================

describe('calculateInvestmentGrowth', () => {
  it('growth with monthly contributions', () => {
    const r = calculateInvestmentGrowth(10000, 500, 7, 20);
    writeOutput('calculators', 'investment-growth.json', JSON.stringify(r, null, 2));
    expect(r.finalValue).toBeGreaterThan(r.totalContributions);
    expect(r.totalContributions).toBe(10000 + 500 * 12 * 20);
    expect(r.totalEarnings).toBeGreaterThan(0);
    expect(r.yearlyBreakdown).toHaveLength(20);
  });

  it('no contributions, just growth', () => {
    const r = calculateInvestmentGrowth(10000, 0, 10, 10);
    expect(r.totalContributions).toBe(10000);
    expect(r.finalValue).toBeGreaterThan(10000);
  });

  it('zero return preserves contributions', () => {
    const r = calculateInvestmentGrowth(1000, 100, 0, 5);
    expect(r.totalContributions).toBe(1000 + 100 * 12 * 5);
    expect(r.finalValue).toBeCloseTo(r.totalContributions);
  });

  it('yearly breakdown balances increase', () => {
    const r = calculateInvestmentGrowth(5000, 200, 8, 10);
    for (let i = 1; i < r.yearlyBreakdown.length; i++) {
      expect(r.yearlyBreakdown[i].balance).toBeGreaterThan(r.yearlyBreakdown[i - 1].balance);
    }
  });
});

// ==================== RETIREMENT ====================

describe('calculateRetirement', () => {
  // calculateRetirement(currentAge, retirementAge, currentSavings, monthlyContribution, annualReturn, withdrawalRate)
  it('basic retirement plan', () => {
    const r = calculateRetirement(30, 65, 50000, 1500, 7, 2);
    writeOutput('calculators', 'retirement.json', JSON.stringify(r, null, 2));
    expect(r.retirementAge - r.currentAge).toBe(35);
    expect(r.retirementSavings).toBeGreaterThan(0);
    expect(r.monthlyRetirementIncome).toBeGreaterThan(0);
    expect(r.monthlyContribution).toBe(1500);
  });

  it('already at retirement age', () => {
    const r = calculateRetirement(65, 65, 80000, 1000, 5, 2);
    expect(r.retirementAge - r.currentAge).toBe(0);
  });

  it('high savings rate', () => {
    const r1 = calculateRetirement(30, 65, 100000, 500, 7, 2);
    const r2 = calculateRetirement(30, 65, 100000, 2000, 7, 2);
    expect(r2.retirementSavings).toBeGreaterThan(r1.retirementSavings);
  });
});

// ==================== ROI ====================

describe('calculateROI', () => {
  it('positive ROI', () => {
    const r = calculateROI(1000, 1500, 2);
    writeOutput('calculators', 'roi.json', JSON.stringify(r, null, 2));
    expect(r.roi).toBe(50);
    expect(r.gain).toBe(500);
    expect(r.annualizedReturn).toBeGreaterThan(0);
  });

  it('negative ROI (loss)', () => {
    const r = calculateROI(1000, 800, 1);
    expect(r.roi).toBe(-20);
    expect(r.gain).toBe(-200);
  });

  it('same investment and return', () => {
    const r = calculateROI(5000, 5000, 3);
    expect(r.roi).toBe(0);
    expect(r.gain).toBe(0);
  });

  it('short period ROI', () => {
    const r = calculateROI(100, 110, 0.5);
    expect(r.roi).toBe(10);
    expect(r.annualizedReturn).toBeGreaterThan(10);
  });
});

// ==================== BREAK-EVEN ====================

describe('calculateBreakEven', () => {
  // calculateBreakEven(fixedCosts, variableCostPerUnit, pricePerUnit)
  it('basic break-even', () => {
    const r = calculateBreakEven(10000, 30, 50);
    writeOutput('calculators', 'break-even.json', JSON.stringify(r, null, 2));
    expect(r.breakEvenUnits).toBe(500);
    expect(r.breakEvenRevenue).toBe(25000);
    expect(r.contributionMargin).toBe(20);
  });

  it('high margin, low break-even', () => {
    const r = calculateBreakEven(1000, 10, 100);
    expect(r.breakEvenUnits).toBeCloseTo(11.11, 0);
  });

  it('variable cost equals price returns Infinity', () => {
    const r = calculateBreakEven(1000, 50, 50);
    expect(r.breakEvenUnits).toBe(Infinity);
  });

  it('variable cost exceeds price gives negative break-even', () => {
    const r = calculateBreakEven(1000, 50, 30);
    expect(r.breakEvenUnits).toBeLessThan(0);
  });
});

// ==================== DISCOUNT / MARKUP / PROFIT MARGIN ====================

describe('Discount, Markup, Profit Margin', () => {
  it('calculateDiscount', () => {
    expect(calculateDiscount(100, 20)).toEqual({
      originalPrice: 100,
      discount: 20,
      savings: 20,
      finalPrice: 80,
    });
  });

  it('calculateDiscount zero discount', () => {
    const r = calculateDiscount(99.99, 0);
    expect(r.finalPrice).toBe(99.99);
    expect(r.savings).toBe(0);
  });

  it('calculateDiscount 100% off', () => {
    const r = calculateDiscount(50, 100);
    expect(r.finalPrice).toBe(0);
  });

  it('calculateMarkup', () => {
    const r = calculateMarkup(80, 20);
    expect(r.sellingPrice).toBeCloseTo(96);
    expect(r.profit).toBeCloseTo(16);
  });

  it('calculateProfitMargin', () => {
    const r = calculateProfitMargin(100, 60);
    expect(r.profitMargin).toBe(40);
    expect(r.profit).toBe(40);
  });

  it('calculateProfitMargin with zero revenue returns -Infinity margin', () => {
    const r = calculateProfitMargin(0, 50);
    expect(r.profitMargin).toBe(-Infinity);
  });

  it('calculateProfitMargin negative margin (loss)', () => {
    const r = calculateProfitMargin(100, 120);
    expect(r.profitMargin).toBe(-20);
    expect(r.profit).toBe(-20);
  });
});

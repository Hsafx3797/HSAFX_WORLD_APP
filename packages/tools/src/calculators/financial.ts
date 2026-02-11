/**
 * Financial Calculator Library
 */

// ==================== INTEREST CALCULATIONS ====================

export interface SimpleInterestResult {
  principal: number;
  rate: number;
  time: number;
  interest: number;
  total: number;
}

export function calculateSimpleInterest(
  principal: number,
  annualRate: number, // as percentage (e.g., 5 for 5%)
  years: number
): SimpleInterestResult {
  const rate = annualRate / 100;
  const interest = principal * rate * years;
  
  return {
    principal,
    rate: annualRate,
    time: years,
    interest,
    total: principal + interest,
  };
}

export interface CompoundInterestResult {
  principal: number;
  rate: number;
  time: number;
  compoundsPerYear: number;
  interest: number;
  total: number;
  schedule: Array<{
    period: number;
    balance: number;
    interestEarned: number;
  }>;
}

export function calculateCompoundInterest(
  principal: number,
  annualRate: number, // as percentage
  years: number,
  compoundsPerYear: number = 12 // monthly by default
): CompoundInterestResult {
  const rate = annualRate / 100;
  const n = compoundsPerYear;
  const t = years;
  
  const total = principal * Math.pow(1 + rate / n, n * t);
  const interest = total - principal;
  
  // Calculate schedule
  const schedule: CompoundInterestResult['schedule'] = [];
  let balance = principal;
  const totalPeriods = n * t;
  
  for (let i = 1; i <= totalPeriods; i++) {
    const newBalance = principal * Math.pow(1 + rate / n, i);
    const interestEarned = newBalance - balance;
    schedule.push({
      period: i,
      balance: newBalance,
      interestEarned,
    });
    balance = newBalance;
  }
  
  return {
    principal,
    rate: annualRate,
    time: years,
    compoundsPerYear,
    interest,
    total,
    schedule,
  };
}

// ==================== LOAN CALCULATIONS ====================

export interface LoanPaymentResult {
  principal: number;
  rate: number;
  termMonths: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortizationSchedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

export function calculateLoanPayment(
  principal: number,
  annualRate: number, // as percentage
  termYears: number
): LoanPaymentResult {
  const monthlyRate = annualRate / 100 / 12;
  const termMonths = termYears * 12;
  
  // Monthly payment formula
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = totalPayment - principal;
  
  // Amortization schedule
  const schedule: LoanPaymentResult['amortizationSchedule'] = [];
  let balance = principal;
  
  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    
    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
    });
  }
  
  return {
    principal,
    rate: annualRate,
    termMonths,
    monthlyPayment,
    totalPayment,
    totalInterest,
    amortizationSchedule: schedule,
  };
}

// ==================== MORTGAGE CALCULATOR ====================

export interface MortgageResult extends LoanPaymentResult {
  downPayment: number;
  homePrice: number;
  loanToValue: number;
  pmi?: number;
}

export function calculateMortgage(
  homePrice: number,
  downPayment: number,
  annualRate: number,
  termYears: number,
  pmiRate?: number // optional PMI rate if LTV > 80%
): MortgageResult {
  const loanAmount = homePrice - downPayment;
  const loanToValue = (loanAmount / homePrice) * 100;
  
  const baseCalc = calculateLoanPayment(loanAmount, annualRate, termYears);
  
  // Calculate PMI if LTV > 80%
  let pmi: number | undefined;
  if (loanToValue > 80 && pmiRate) {
    pmi = (loanAmount * (pmiRate / 100)) / 12;
  }
  
  return {
    ...baseCalc,
    downPayment,
    homePrice,
    loanToValue,
    pmi,
  };
}

// ==================== INVESTMENT CALCULATIONS ====================

export interface InvestmentGrowthResult {
  initialInvestment: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  finalValue: number;
  totalContributions: number;
  totalEarnings: number;
  yearlyBreakdown: Array<{
    year: number;
    contributions: number;
    earnings: number;
    balance: number;
  }>;
}

export function calculateInvestmentGrowth(
  initialInvestment: number,
  monthlyContribution: number,
  annualReturn: number, // as percentage
  years: number
): InvestmentGrowthResult {
  const monthlyReturn = annualReturn / 100 / 12;
  
  let balance = initialInvestment;
  let totalContributions = initialInvestment;
  const yearlyBreakdown: InvestmentGrowthResult['yearlyBreakdown'] = [];
  
  for (let year = 1; year <= years; year++) {
    let yearStartBalance = balance;
    let yearContributions = 0;
    
    for (let month = 1; month <= 12; month++) {
      balance = balance * (1 + monthlyReturn) + monthlyContribution;
      yearContributions += monthlyContribution;
      totalContributions += monthlyContribution;
    }
    
    yearlyBreakdown.push({
      year,
      contributions: yearContributions,
      earnings: balance - yearStartBalance - yearContributions,
      balance,
    });
  }
  
  return {
    initialInvestment,
    monthlyContribution,
    annualReturn,
    years,
    finalValue: balance,
    totalContributions,
    totalEarnings: balance - totalContributions,
    yearlyBreakdown,
  };
}

// ==================== RETIREMENT CALCULATOR ====================

export interface RetirementResult {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  annualReturn: number;
  retirementSavings: number;
  monthlyRetirementIncome: number;
  yearsInRetirement: number;
}

export function calculateRetirement(
  currentAge: number,
  retirementAge: number,
  currentSavings: number,
  monthlyContribution: number,
  annualReturn: number, // as percentage
  withdrawalRate: number = 4 // safe withdrawal rate
): RetirementResult {
  const yearsToRetirement = retirementAge - currentAge;
  
  const growth = calculateInvestmentGrowth(
    currentSavings,
    monthlyContribution,
    annualReturn,
    yearsToRetirement
  );
  
  const retirementSavings = growth.finalValue;
  const annualIncome = retirementSavings * (withdrawalRate / 100);
  const monthlyRetirementIncome = annualIncome / 12;
  
  // Estimate years in retirement (assuming life expectancy of 90)
  const yearsInRetirement = Math.max(0, 90 - retirementAge);
  
  return {
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    annualReturn,
    retirementSavings,
    monthlyRetirementIncome,
    yearsInRetirement,
  };
}

// ==================== ROI CALCULATOR ====================

export interface ROIResult {
  initialInvestment: number;
  finalValue: number;
  gain: number;
  roi: number;
  annualizedReturn?: number;
  holdingPeriodYears?: number;
}

export function calculateROI(
  initialInvestment: number,
  finalValue: number,
  holdingPeriodYears?: number
): ROIResult {
  const gain = finalValue - initialInvestment;
  const roi = (gain / initialInvestment) * 100;
  
  let annualizedReturn: number | undefined;
  if (holdingPeriodYears && holdingPeriodYears > 0) {
    annualizedReturn = (Math.pow(finalValue / initialInvestment, 1 / holdingPeriodYears) - 1) * 100;
  }
  
  return {
    initialInvestment,
    finalValue,
    gain,
    roi,
    annualizedReturn,
    holdingPeriodYears,
  };
}

// ==================== BREAK-EVEN CALCULATOR ====================

export interface BreakEvenResult {
  fixedCosts: number;
  variableCostPerUnit: number;
  pricePerUnit: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  contributionMargin: number;
  contributionMarginRatio: number;
}

export function calculateBreakEven(
  fixedCosts: number,
  variableCostPerUnit: number,
  pricePerUnit: number
): BreakEvenResult {
  const contributionMargin = pricePerUnit - variableCostPerUnit;
  const contributionMarginRatio = contributionMargin / pricePerUnit;
  const breakEvenUnits = fixedCosts / contributionMargin;
  const breakEvenRevenue = breakEvenUnits * pricePerUnit;
  
  return {
    fixedCosts,
    variableCostPerUnit,
    pricePerUnit,
    breakEvenUnits,
    breakEvenRevenue,
    contributionMargin,
    contributionMarginRatio,
  };
}

// ==================== DISCOUNT/MARKUP CALCULATOR ====================

export function calculateDiscount(
  originalPrice: number,
  discountPercent: number
): { originalPrice: number; discount: number; finalPrice: number; savings: number } {
  const discount = originalPrice * (discountPercent / 100);
  const finalPrice = originalPrice - discount;
  
  return {
    originalPrice,
    discount: discountPercent,
    finalPrice,
    savings: discount,
  };
}

export function calculateMarkup(
  cost: number,
  markupPercent: number
): { cost: number; markup: number; sellingPrice: number; profit: number; profitMargin: number } {
  const markupAmount = cost * (markupPercent / 100);
  const sellingPrice = cost + markupAmount;
  const profitMargin = (markupAmount / sellingPrice) * 100;
  
  return {
    cost,
    markup: markupPercent,
    sellingPrice,
    profit: markupAmount,
    profitMargin,
  };
}

export function calculateProfitMargin(
  revenue: number,
  cost: number
): { revenue: number; cost: number; profit: number; profitMargin: number; markup: number } {
  const profit = revenue - cost;
  const profitMargin = (profit / revenue) * 100;
  const markup = (profit / cost) * 100;
  
  return {
    revenue,
    cost,
    profit,
    profitMargin,
    markup,
  };
}

// ==================== TIP CALCULATOR ====================

export interface TipResult {
  billAmount: number;
  tipPercent: number;
  tipAmount: number;
  total: number;
  perPerson?: number;
  tipPerPerson?: number;
}

export function calculateTip(
  billAmount: number,
  tipPercent: number,
  splitBetween: number = 1
): TipResult {
  const tipAmount = billAmount * (tipPercent / 100);
  const total = billAmount + tipAmount;
  
  return {
    billAmount,
    tipPercent,
    tipAmount,
    total,
    perPerson: splitBetween > 1 ? total / splitBetween : undefined,
    tipPerPerson: splitBetween > 1 ? tipAmount / splitBetween : undefined,
  };
}

// ==================== CURRENCY FORMATTING ====================

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

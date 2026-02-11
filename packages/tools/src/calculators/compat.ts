/**
 * Web Compatibility Layer for Calculators
 * Maps web's existing API to shared package functions
 */

// Re-export all from modules
export * from './math';
export * from './financial';
export * from './islamic';
export * from './units';
export * from './health';
export * from './expression';

// Import for aliasing and re-exporting with web-compatible names
import {
  calculateBmi as _calculateBmi,
  calculateAge as _calculateAge,
  calculateDateDifference as _calculateDateDifference,
} from './health';

import {
  calculateZakat as _calculateZakat,
  calculateInheritance as _calculateInheritance,
} from './islamic';

import {
  calculateCompoundInterest as _calculateCompoundInterest,
  calculateLoanPayment,
} from './financial';

import {
  percentageOf as _percentageOf,
  percentageChange as _percentageChange,
} from './math';

import {
  unitConversions,
  convertUnit,
} from './units';

import {
  evaluateSimpleExpression,
  scientific,
} from './expression';

// ==================== WEB-COMPATIBLE ALIASES ====================

// GPA Calculator types (web version)
export interface GradeEntry {
  course: string;
  grade: string;
  credits: number;
}

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};

export function calculateGpa(grades: GradeEntry[]): {
  gpa: number;
  totalCredits: number;
  totalPoints: number;
  letterGrade: string;
} {
  let totalPoints = 0;
  let totalCredits = 0;
  
  for (const entry of grades) {
    const gradePoint = GRADE_POINTS[entry.grade.toUpperCase()];
    if (gradePoint !== undefined) {
      totalPoints += gradePoint * entry.credits;
      totalCredits += entry.credits;
    }
  }
  
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  
  let letterGrade = 'F';
  if (gpa >= 3.7) letterGrade = 'A';
  else if (gpa >= 3.3) letterGrade = 'A-';
  else if (gpa >= 3.0) letterGrade = 'B+';
  else if (gpa >= 2.7) letterGrade = 'B';
  else if (gpa >= 2.3) letterGrade = 'B-';
  else if (gpa >= 2.0) letterGrade = 'C+';
  else if (gpa >= 1.7) letterGrade = 'C';
  else if (gpa >= 1.3) letterGrade = 'C-';
  else if (gpa >= 1.0) letterGrade = 'D';
  
  return {
    gpa: Math.round(gpa * 100) / 100,
    totalCredits,
    totalPoints: Math.round(totalPoints * 100) / 100,
    letterGrade,
  };
}

// Zakat with web-compatible interface
export interface ZakatInput {
  cash?: number;
  bankBalance?: number;
  goldGrams?: number;
  goldPricePerGram?: number;
  silverGrams?: number;
  silverPricePerGram?: number;
  gold?: { grams: number; pricePerGram: number };
  silver?: { grams: number; pricePerGram: number };
  stocks?: number;
  businessInventory?: number;
  receivables?: number;
  realEstate?: number;
  otherAssets?: number;
  liabilities?: number;
}

const NISAB_GOLD_GRAMS = 87.48;
const NISAB_SILVER_GRAMS = 612.36;
const ZAKAT_RATE = 0.025;

export function calculateZakat(input: ZakatInput): {
  totalAssets: number;
  netAssets: number;
  nisabGold: number;
  nisabSilver: number;
  zakatDue: number;
  isZakatApplicable: boolean;
  breakdown: Record<string, number>;
} {
  const goldGrams = input.goldGrams ?? input.gold?.grams ?? 0;
  const goldPricePerGram = input.goldPricePerGram ?? input.gold?.pricePerGram ?? 0;
  const silverGrams = input.silverGrams ?? input.silver?.grams ?? 0;
  const silverPricePerGram = input.silverPricePerGram ?? input.silver?.pricePerGram ?? 0;
  
  const goldValue = goldGrams * goldPricePerGram;
  const silverValue = silverGrams * silverPricePerGram;
  
  const breakdown = {
    cash: input.cash ?? 0,
    bankBalance: input.bankBalance ?? 0,
    goldValue,
    silverValue,
    stocks: input.stocks ?? 0,
    businessInventory: input.businessInventory ?? 0,
    receivables: input.receivables ?? 0,
    realEstate: input.realEstate ?? 0,
    otherAssets: input.otherAssets ?? 0,
  };
  
  const totalAssets = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const netAssets = totalAssets - (input.liabilities ?? 0);
  
  const effectiveGoldPrice = goldPricePerGram > 0 ? goldPricePerGram : 60;
  const effectiveSilverPrice = silverPricePerGram > 0 ? silverPricePerGram : 0.75;
  
  const nisabGold = NISAB_GOLD_GRAMS * effectiveGoldPrice;
  const nisabSilver = NISAB_SILVER_GRAMS * effectiveSilverPrice;
  const nisabThreshold = Math.min(nisabGold, nisabSilver);
  
  const isZakatApplicable = netAssets >= nisabThreshold;
  const zakatDue = isZakatApplicable ? netAssets * ZAKAT_RATE : 0;
  
  return {
    totalAssets: Math.round(totalAssets * 100) / 100,
    netAssets: Math.round(netAssets * 100) / 100,
    nisabGold: Math.round(nisabGold * 100) / 100,
    nisabSilver: Math.round(nisabSilver * 100) / 100,
    zakatDue: Math.round(zakatDue * 100) / 100,
    isZakatApplicable,
    breakdown,
  };
}

// Islamic Inheritance with web-compatible interface
export interface InheritanceData {
  estateValue: number;
  debts: number;
  funeralExpenses: number;
  bequests: number;
  hasHusband: boolean;
  numberOfWives: number;
  numberOfSons: number;
  numberOfDaughters: number;
  numberOfGrandsons: number;
  numberOfGranddaughters: number;
  hasFather: boolean;
  hasMother: boolean;
  hasGrandfather: boolean;
  hasPaternalGrandmother: boolean;
  hasMaternalGrandmother: boolean;
  numberOfFullBrothers: number;
  numberOfFullSisters: number;
  numberOfPaternalBrothers: number;
  numberOfPaternalSisters: number;
  numberOfMaternalBrothers: number;
  numberOfMaternalSisters: number;
}

// Keep original calculateIslamicInheritance export from web for now
// (The implementation is complex and differs from shared - will wire later)
export { calculateIslamicInheritance } from './islamic-compat';

// Percentage functions with web-compatible names
export const calculatePercentage = (value: number, percent: number): number => {
  return (value * percent) / 100;
};

export const percentageOf = (part: number, whole: number): number => {
  return (part / whole) * 100;
};

export const percentageChange = (oldValue: number, newValue: number): number => {
  return ((newValue - oldValue) / oldValue) * 100;
};

// Compound interest with web-compatible signature
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  n: number = 12
): { total: number; interest: number } {
  const result = _calculateCompoundInterest(principal, rate, time, n);
  return {
    total: Math.round(result.total * 100) / 100,
    interest: Math.round(result.interest * 100) / 100,
  };
}

// EMI calculator with web-compatible signature
export function calculateEmi(
  principal: number,
  annualRate: number,
  months: number
): { emi: number; totalPayment: number; totalInterest: number } {
  const years = months / 12;
  const result = calculateLoanPayment(principal, annualRate, years);
  return {
    emi: Math.round(result.monthlyPayment * 100) / 100,
    totalPayment: Math.round(result.totalPayment * 100) / 100,
    totalInterest: Math.round(result.totalInterest * 100) / 100,
  };
}

// BMI with web-compatible signature
export function calculateBmi(weightKg: number, heightM: number): { bmi: number; category: string } {
  const result = _calculateBmi(weightKg, heightM);
  return {
    bmi: result.bmi,
    category: result.category,
  };
}

// Age calculator with web-compatible signature
export function calculateAge(birthDate: Date): { years: number; months: number; days: number } {
  const result = _calculateAge(birthDate);
  return {
    years: result.years,
    months: result.months,
    days: result.days,
  };
}

// Date difference with web-compatible signature
export function calculateDateDifference(date1: Date, date2: Date): {
  days: number;
  weeks: number;
  months: number;
  years: number;
} {
  const result = _calculateDateDifference(date1, date2);
  return {
    days: result.days,
    weeks: result.weeks,
    months: result.months,
    years: result.years,
  };
}

// Expression evaluator with web-compatible signature
export function evaluateExpression(expr: string): number {
  return evaluateSimpleExpression(expr);
}

// Re-export unit conversions and scientific
export { unitConversions, convertUnit, scientific };

/**
 * Calculate Engine — Universal Calculator
 *
 * Wraps expression evaluation, financial, health, statistics,
 * and Islamic calculators behind one engine.
 */

import type { Engine, CalculateEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
import { evaluateExpression } from '../calculators/expression';
import { calculateStatistics, percentage, percentageOf, percentageChange, percentageDifference } from '../calculators/math';
import {
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateLoanPayment,
  calculateROI,
  calculateDiscount,
  calculateMarkup,
  calculateProfitMargin,
  calculateTip,
} from '../calculators/financial';
import {
  calculateBmi,
  calculateCalories,
  calculateAge,
  calculateDateDifference,
} from '../calculators/health';
import {
  calculateZakat,
  calculateInheritance,
} from '../calculators/islamic';
import { calculateGpa } from '../calculators/web';

// ---------------------------------------------------------------------------
// Timezone conversion helper
// ---------------------------------------------------------------------------

const TIMEZONE_OFFSETS: Record<string, number> = {
  'UTC': 0, 'GMT': 0, 'EST': -5, 'EDT': -4, 'CST': -6, 'CDT': -5,
  'MST': -7, 'MDT': -6, 'PST': -8, 'PDT': -7, 'AKST': -9, 'AKDT': -8,
  'HST': -10, 'AST': -4, 'NST': -3.5, 'CET': 1, 'CEST': 2, 'EET': 2,
  'EEST': 3, 'WET': 0, 'WEST': 1, 'IST': 5.5, 'JST': 9, 'KST': 9,
  'CST-CHINA': 8, 'AEST': 10, 'AEDT': 11, 'ACST': 9.5, 'ACDT': 10.5,
  'AWST': 8, 'NZST': 12, 'NZDT': 13, 'SGT': 8, 'HKT': 8, 'GST': 4,
  'MSK': 3, 'PKT': 5, 'ICT': 7, 'WIB': 7, 'PHT': 8, 'TRT': 3,
};

function convertTimezone(dateStr: string, fromTz: string, toTz: string) {
  const fromOffset = TIMEZONE_OFFSETS[fromTz.toUpperCase()];
  const toOffset = TIMEZONE_OFFSETS[toTz.toUpperCase()];
  if (fromOffset === undefined) throw new Error(`Unknown timezone: ${fromTz}. Available: ${Object.keys(TIMEZONE_OFFSETS).join(', ')}`);
  if (toOffset === undefined) throw new Error(`Unknown timezone: ${toTz}. Available: ${Object.keys(TIMEZONE_OFFSETS).join(', ')}`);

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) throw new Error(`Invalid date: ${dateStr}`);

  // Convert to UTC, then to target timezone
  const utcMs = date.getTime() - fromOffset * 3_600_000;
  const targetMs = utcMs + toOffset * 3_600_000;
  const targetDate = new Date(targetMs);

  return {
    original: { date: dateStr, timezone: fromTz, offsetHours: fromOffset },
    converted: { date: targetDate.toISOString(), timezone: toTz, offsetHours: toOffset },
    differenceHours: toOffset - fromOffset,
  };
}

// ---------------------------------------------------------------------------
// Calculator registry
// ---------------------------------------------------------------------------

type CalcFn = (inputs: Record<string, unknown>) => unknown;

const CALCULATORS: Record<string, CalcFn> = {
  'expression': (i) => {
    const expr = (i.expression as string) ?? '';
    return { result: evaluateExpression(expr) };
  },
  'statistics': (i) => {
    const values = i.values as number[];
    return calculateStatistics(values);
  },
  'simple-interest': (i) =>
    calculateSimpleInterest(i.principal as number, i.rate as number, i.time as number),
  'compound-interest': (i) =>
    calculateCompoundInterest(
      i.principal as number,
      i.rate as number,
      i.time as number,
      i.compoundsPerYear as number | undefined,
    ),
  'loan-payment': (i) =>
    calculateLoanPayment(
      i.principal as number,
      i.annualRate as number,
      i.termMonths as number,
    ),
  'roi': (i) =>
    calculateROI(i.investment as number, i.returnAmount as number),
  'discount': (i) =>
    calculateDiscount(i.originalPrice as number, i.discountPercent as number),
  'markup': (i) =>
    calculateMarkup(i.cost as number, i.markupPercent as number),
  'profit-margin': (i) =>
    calculateProfitMargin(i.revenue as number, i.cost as number),
  'tip': (i) =>
    calculateTip(i.billAmount as number, i.tipPercent as number, i.numberOfPeople as number | undefined),
  'bmi': (i) =>
    calculateBmi(i.weightKg as number, i.heightM as number),
  'calories': (i) =>
    calculateCalories(
      i.gender as 'male' | 'female',
      i.weightKg as number,
      i.heightCm as number,
      i.age as number,
      i.activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive',
    ),
  'age': (i) =>
    calculateAge((i.birthDate as string) ?? ''),
  'date-diff': (i) =>
    calculateDateDifference(
      (i.date1 as string) ?? '',
      (i.date2 as string) ?? '',
    ),
  'percentage': (i) => {
    const mode = (i.mode as string) ?? 'of';
    if (mode === 'what-percent') return { result: percentage(i.value as number, i.total as number), unit: '%' };
    if (mode === 'change') return { result: percentageChange(i.oldValue as number, i.newValue as number), unit: '%' };
    if (mode === 'difference') return { result: percentageDifference(i.value1 as number, i.value2 as number), unit: '%' };
    // Default: X% of Y
    return { result: percentageOf(i.percent as number, i.value as number) };
  },
  'gpa': (i) => {
    const grades = (i.grades as Array<{ course: string; grade: string; credits: number }>) ?? [];
    return calculateGpa(grades);
  },
  'zakat': (i) => {
    const assets = (i.assets as Record<string, number>) ?? {};
    const liabilities = (i.liabilities as Record<string, number>) ?? {};
    const goldPrice = (i.goldPricePerGram as number) ?? 70;
    const silverPrice = (i.silverPricePerGram as number) ?? 0.85;
    return calculateZakat(assets, liabilities, goldPrice, silverPrice);
  },
  'inheritance': (i) => {
    const estate = (i.estate as number) ?? 0;
    const heirs = (i.heirs as Array<{ relation: string; gender: string; count: number }>) ?? [];
    const debts = (i.debts as number) ?? 0;
    const funeralCosts = (i.funeralCosts as number) ?? 0;
    const bequests = (i.bequests as number) ?? 0;
    return calculateInheritance(estate, heirs as any, debts, funeralCosts, bequests);
  },
  'timezone': (i) => {
    const dateStr = (i.date as string) ?? new Date().toISOString();
    const fromTz = (i.fromTimezone as string) ?? 'UTC';
    const toTz = (i.toTimezone as string) ?? 'UTC';
    return convertTimezone(dateStr, fromTz, toTz);
  },
};

const TYPES = Object.keys(CALCULATORS).sort();

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const calculateEngine: Engine<CalculateEngineOptions> = {
  name: 'calculate',
  description: 'Expression evaluator, statistics, financial, health, percentage, GPA, Islamic (zakat/inheritance), and timezone calculators.',

  validate(options: CalculateEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    if (!CALCULATORS[options.type]) {
      errors.push(`Unknown calculator type "${options.type}". Available: ${TYPES.join(', ')}`);
    }
    if (!options.inputs || typeof options.inputs !== 'object') {
      errors.push('"inputs" must be an object with the required parameters');
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(_input: EngineInput, options: CalculateEngineOptions): EngineResult {
    const fn = CALCULATORS[options.type];
    if (!fn) {
      return { output: '', metadata: { error: `Unknown type: ${options.type}` } };
    }
    const result = fn(options.inputs);
    return {
      output: JSON.stringify(result, null, 2),
      metadata: { type: options.type, result: result as Record<string, unknown> },
    };
  },
};

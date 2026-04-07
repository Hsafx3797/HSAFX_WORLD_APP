import { describe, it, expect } from 'vitest';
import { writeOutput } from './helpers';
import {
  calculateBmi,
  calculateAge,
  calculateDateDifference,
  calculateCalories,
  calculateHeartRateZones,
  calculateBodyFat,
} from '../src/calculators/health';

// ==================== BMI ====================

describe('calculateBmi', () => {
  // NOTE: calculateBmi(weightKg, heightM) — height in METERS
  it('normal weight', () => {
    const r = calculateBmi(70, 1.75);
    writeOutput('calculators', 'bmi-normal.json', JSON.stringify(r, null, 2));
    expect(r.bmi).toBeCloseTo(22.86, 1);
    expect(r.category).toBe('Normal weight');
  });

  it('underweight', () => {
    const r = calculateBmi(45, 1.70);
    expect(r.bmi).toBeLessThan(18.5);
    expect(r.category).toBe('Underweight');
  });

  it('overweight', () => {
    const r = calculateBmi(85, 1.75);
    expect(r.bmi).toBeGreaterThan(25);
    expect(r.bmi).toBeLessThan(30);
    expect(r.category).toBe('Overweight');
  });

  it('obese class I', () => {
    const r = calculateBmi(100, 1.75);
    expect(r.bmi).toBeGreaterThanOrEqual(30);
    expect(r.bmi).toBeLessThan(35);
    expect(r.category).toBe('Obese Class I');
  });

  it('obese class II', () => {
    const r = calculateBmi(115, 1.75);
    expect(r.bmi).toBeGreaterThanOrEqual(35);
    expect(r.bmi).toBeLessThan(40);
    expect(r.category).toBe('Obese Class II');
  });

  it('obese class III', () => {
    const r = calculateBmi(140, 1.70);
    expect(r.bmi).toBeGreaterThanOrEqual(40);
    expect(r.category).toBe('Obese Class III');
  });

  it('edge: very low weight', () => {
    const r = calculateBmi(30, 1.80);
    expect(r.bmi).toBeLessThan(18.5);
  });

  it('edge: very tall', () => {
    const r = calculateBmi(80, 2.20);
    expect(r.bmi).toBeLessThan(18.5);
  });
});

// ==================== AGE ====================

describe('calculateAge', () => {
  it('basic age calculation', () => {
    const birthDate = new Date(1990, 0, 15); // Jan 15 1990
    const r = calculateAge(birthDate);
    writeOutput('calculators', 'age.json', JSON.stringify(r, null, 2));
    expect(r.years).toBeGreaterThanOrEqual(34);
    expect(r.months).toBeGreaterThanOrEqual(0);
    expect(r.months).toBeLessThan(12);
    expect(r.days).toBeGreaterThanOrEqual(0);
    expect(r.totalDays).toBeGreaterThan(12000);
  });

  it('today is birthday', () => {
    const today = new Date();
    const birthday = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    const r = calculateAge(birthday);
    expect(r.years).toBe(25);
    expect(r.months).toBe(0);
    expect(r.days).toBe(0);
  });

  it('recent birthdate (baby)', () => {
    const recent = new Date();
    recent.setMonth(recent.getMonth() - 3);
    const r = calculateAge(recent);
    expect(r.years).toBe(0);
    expect(r.months).toBeGreaterThanOrEqual(2);
    expect(r.months).toBeLessThanOrEqual(4);
  });

  it('birthday countdown is present', () => {
    const r = calculateAge(new Date(2000, 5, 15));
    expect(r.nextBirthday).toBeDefined();
    expect(r.daysUntilBirthday).toBeGreaterThanOrEqual(0);
  });
});

// ==================== DATE DIFFERENCE ====================

describe('calculateDateDifference', () => {
  it('same date', () => {
    const d = new Date(2024, 0, 1);
    const r = calculateDateDifference(d, d);
    expect(r.days).toBe(0);
  });

  it('one year apart', () => {
    const r = calculateDateDifference(new Date(2023, 0, 1), new Date(2024, 0, 1));
    writeOutput('calculators', 'date-diff.json', JSON.stringify(r, null, 2));
    expect(r.detailed.years).toBe(1);
    expect(r.days).toBe(365);
  });

  it('one month apart', () => {
    const r = calculateDateDifference(new Date(2024, 0, 1), new Date(2024, 1, 1));
    expect(r.detailed.months).toBeGreaterThanOrEqual(1);
    expect(r.days).toBe(31);
  });

  it('counts business days', () => {
    // Mon Jan 1 2024 to Fri Jan 5 2024 = 4 calendar days, business days < total
    const r = calculateDateDifference(new Date(2024, 0, 1), new Date(2024, 0, 5));
    expect(r.businessDays).toBeDefined();
    expect(r.businessDays).toBeGreaterThan(0);
    expect(r.businessDays).toBeLessThanOrEqual(r.days);
  });

  it('reverse order returns positive', () => {
    const r = calculateDateDifference(new Date(2025, 0, 1), new Date(2024, 0, 1));
    expect(r.days).toBeGreaterThan(0);
  });
});

// ==================== CALORIE CALCULATOR ====================

describe('calculateCalories', () => {
  // NOTE: calculateCalories(gender, weightKg, heightCm, age, activityLevel)
  it('male sedentary', () => {
    const r = calculateCalories('male', 70, 175, 30, 'sedentary');
    writeOutput('calculators', 'calories-male.json', JSON.stringify(r, null, 2));
    expect(r.bmr).toBeGreaterThan(1500);
    expect(r.tdee).toBeGreaterThan(r.bmr);
    expect(r.macros).toBeDefined();
    expect(r.macros.protein.grams).toBeGreaterThan(0);
    expect(r.macros.carbs.grams).toBeGreaterThan(0);
    expect(r.macros.fat.grams).toBeGreaterThan(0);
  });

  it('female active', () => {
    const r = calculateCalories('female', 60, 165, 25, 'active');
    expect(r.bmr).toBeGreaterThan(1200);
    expect(r.bmr).toBeLessThan(1500);
    expect(r.tdee).toBeGreaterThan(r.bmr * 1.5); // active multiplier
  });

  it('activity levels increase TDEE', () => {
    const levels = ['sedentary', 'light', 'moderate', 'active', 'veryActive'] as const;
    const results = levels.map(l => calculateCalories('male', 75, 180, 28, l));
    for (let i = 1; i < results.length; i++) {
      expect(results[i].tdee).toBeGreaterThan(results[i - 1].tdee);
    }
    // BMR should be the same across activity levels
    expect(results[0].bmr).toBe(results[4].bmr);
  });

  it('macro breakdown ratio sums close to TDEE calories', () => {
    const r = calculateCalories('male', 80, 180, 35, 'moderate');
    const macroCalories = r.macros.protein.calories + r.macros.carbs.calories + r.macros.fat.calories;
    expect(macroCalories).toBeCloseTo(r.tdee, -1);
  });
});

// ==================== HEART RATE ZONES ====================

describe('calculateHeartRateZones', () => {
  it('basic zones (age 30, resting 60)', () => {
    const r = calculateHeartRateZones(30, 60);
    writeOutput('calculators', 'heart-rate-zones.json', JSON.stringify(r, null, 2));
    expect(r.maxHeartRate).toBe(190);
    expect(r.zones).toHaveLength(5);
    // Zone 1 should start lowest
    expect(r.zones[0].min).toBeLessThan(r.zones[1].min);
    // Zone 5 should be highest
    expect(r.zones[4].max).toBeGreaterThan(r.zones[3].max);
  });

  it('older age has lower max HR', () => {
    const young = calculateHeartRateZones(20, 60);
    const old = calculateHeartRateZones(60, 60);
    expect(old.maxHeartRate).toBeLessThan(young.maxHeartRate);
  });

  it('higher resting HR shifts zones up', () => {
    const low = calculateHeartRateZones(30, 50);
    const high = calculateHeartRateZones(30, 80);
    expect(high.zones[0].min).toBeGreaterThan(low.zones[0].min);
  });

  it('Karvonen formula: zones use heart rate reserve', () => {
    const r = calculateHeartRateZones(30, 60);
    const hrr = r.maxHeartRate - 60; // heart rate reserve
    // Zone 1 should be around 50-60% of HRR + resting
    expect(r.zones[0].min).toBeCloseTo(60 + hrr * 0.5, 0);
  });
});

// ==================== BODY FAT ====================

describe('calculateBodyFat', () => {
  // NOTE: calculateBodyFat(gender, waistCm, neckCm, heightCm, hipsCm?)
  it('male body fat', () => {
    const r = calculateBodyFat('male', 85, 38, 180);
    writeOutput('calculators', 'body-fat-male.json', JSON.stringify(r, null, 2));
    expect(r.bodyFatPercentage).toBeGreaterThan(10);
    expect(r.bodyFatPercentage).toBeLessThan(30);
    expect(r.category).toBeDefined();
  });

  it('female body fat (requires hip)', () => {
    const r = calculateBodyFat('female', 75, 33, 165, 95);
    expect(r.bodyFatPercentage).toBeGreaterThan(15);
    expect(r.bodyFatPercentage).toBeLessThan(40);
    expect(r.category).toBeDefined();
  });

  it('lean male', () => {
    const r = calculateBodyFat('male', 72, 40, 185);
    expect(r.bodyFatPercentage).toBeLessThan(15);
  });

  it('result categories are meaningful', () => {
    const lean = calculateBodyFat('male', 70, 40, 185);
    const heavy = calculateBodyFat('male', 110, 35, 170);
    expect(lean.bodyFatPercentage).toBeLessThan(heavy.bodyFatPercentage);
  });
});

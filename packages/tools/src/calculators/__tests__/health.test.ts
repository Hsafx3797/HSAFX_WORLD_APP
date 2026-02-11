import { describe, it, expect } from 'vitest';
import {
  calculateBmi,
  calculateAge,
  calculateDateDifference,
  calculateCalories,
  calculateHeartRateZones,
  calculateBodyFat,
} from '../health';

// ==================== BMI CALCULATOR ====================

describe('calculateBmi', () => {
  it('returns correct BMI and "Normal weight" for (70, 1.75)', () => {
    const result = calculateBmi(70, 1.75);
    expect(result.bmi).toBeCloseTo(22.9, 1);
    expect(result.category).toBe('Normal weight');
  });

  it('returns "Underweight" for low weight (50, 1.70)', () => {
    const result = calculateBmi(50, 1.70);
    expect(result.bmi).toBeLessThan(18.5);
    expect(result.category).toBe('Underweight');
  });

  it('returns "Overweight" for (85, 1.70) — BMI 25-30', () => {
    const result = calculateBmi(85, 1.70);
    expect(result.bmi).toBeGreaterThanOrEqual(25);
    expect(result.bmi).toBeLessThan(30);
    expect(result.category).toBe('Overweight');
  });

  it('returns "Obese Class I" for (100, 1.70) — BMI 30-35', () => {
    const result = calculateBmi(100, 1.70);
    expect(result.bmi).toBeGreaterThanOrEqual(30);
    expect(result.bmi).toBeLessThan(35);
    expect(result.category).toBe('Obese Class I');
  });

  it('returns "Obese Class II" for (110, 1.70) — BMI 35-40', () => {
    // 110 / (1.70^2) = 110 / 2.89 ≈ 38.06 → Obese Class II
    const result = calculateBmi(110, 1.70);
    expect(result.bmi).toBeGreaterThanOrEqual(35);
    expect(result.bmi).toBeLessThan(40);
    expect(result.category).toBe('Obese Class II');
  });

  it('returns "Obese Class III" for (120, 1.70) — BMI ≥ 40', () => {
    const result = calculateBmi(120, 1.70);
    expect(result.bmi).toBeGreaterThanOrEqual(40);
    expect(result.category).toBe('Obese Class III');
  });

  it('returns healthy weight range that brackets normal BMI', () => {
    const result = calculateBmi(70, 1.75);
    expect(result.healthyWeightRange.min).toBeLessThan(70);
    expect(result.healthyWeightRange.max).toBeGreaterThan(70);
  });

  it('healthyWeightRange.min corresponds to BMI 18.5', () => {
    const h = 1.75;
    const result = calculateBmi(70, h);
    const expectedMin = Math.round(18.5 * h * h * 10) / 10;
    expect(result.healthyWeightRange.min).toBeCloseTo(expectedMin, 1);
  });

  it('healthyWeightRange.max corresponds to BMI 24.9', () => {
    const h = 1.75;
    const result = calculateBmi(70, h);
    const expectedMax = Math.round(24.9 * h * h * 10) / 10;
    expect(result.healthyWeightRange.max).toBeCloseTo(expectedMax, 1);
  });

  it('throws when height is 0', () => {
    expect(() => calculateBmi(70, 0)).toThrow('Height must be positive');
  });

  it('throws when height is negative', () => {
    expect(() => calculateBmi(70, -1)).toThrow('Height must be positive');
  });

  it('throws when weight is 0', () => {
    expect(() => calculateBmi(0, 1.75)).toThrow('Weight must be positive');
  });

  it('throws when weight is negative', () => {
    expect(() => calculateBmi(-5, 1.75)).toThrow('Weight must be positive');
  });

  it('includes a recommendation string', () => {
    const result = calculateBmi(70, 1.75);
    expect(typeof result.recommendation).toBe('string');
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});

// ==================== AGE CALCULATOR ====================

describe('calculateAge', () => {
  it('returns years, months, days as non-negative numbers', () => {
    const result = calculateAge('1990-06-15');
    expect(result.years).toBeGreaterThanOrEqual(0);
    expect(result.months).toBeGreaterThanOrEqual(0);
    expect(result.days).toBeGreaterThanOrEqual(0);
  });

  it('totalDays > 0 for a past date', () => {
    const result = calculateAge('2000-01-01');
    expect(result.totalDays).toBeGreaterThan(0);
  });

  it('nextBirthday is in the future', () => {
    const result = calculateAge('1995-03-20');
    expect(result.nextBirthday.getTime()).toBeGreaterThan(Date.now());
  });

  it('daysUntilBirthday > 0', () => {
    const result = calculateAge('1985-07-04');
    expect(result.daysUntilBirthday).toBeGreaterThan(0);
  });

  it('totalWeeks = floor(totalDays / 7)', () => {
    const result = calculateAge('2000-01-01');
    expect(result.totalWeeks).toBe(Math.floor(result.totalDays / 7));
  });

  it('totalMonths = years * 12 + months', () => {
    const result = calculateAge('1990-06-15');
    expect(result.totalMonths).toBe(result.years * 12 + result.months);
  });

  it('accepts a Date object', () => {
    const result = calculateAge(new Date('2000-05-10'));
    expect(result.years).toBeGreaterThan(0);
  });

  it('throws for invalid date string', () => {
    expect(() => calculateAge('not-a-date')).toThrow('Invalid birth date');
  });

  it('throws for future date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 5);
    expect(() => calculateAge(futureDate)).toThrow('Birth date cannot be in the future');
  });

  it('months is between 0 and 11', () => {
    const result = calculateAge('1990-01-01');
    expect(result.months).toBeGreaterThanOrEqual(0);
    expect(result.months).toBeLessThanOrEqual(11);
  });
});

// ==================== DATE DIFFERENCE CALCULATOR ====================

describe('calculateDateDifference', () => {
  it('same date → days = 0', () => {
    const result = calculateDateDifference('2024-06-01', '2024-06-01');
    expect(result.days).toBe(0);
  });

  it('2024-01-01 to 2024-01-31 → 30 days', () => {
    const result = calculateDateDifference('2024-01-01', '2024-01-31');
    expect(result.days).toBe(30);
  });

  it('includes businessDays count', () => {
    const result = calculateDateDifference('2024-01-01', '2024-01-31');
    expect(typeof result.businessDays).toBe('number');
    expect(result.businessDays).toBeGreaterThan(0);
  });

  it('businessDays ≤ days', () => {
    const result = calculateDateDifference('2024-01-01', '2024-01-31');
    expect(result.businessDays).toBeLessThanOrEqual(result.days);
  });

  it('provides detailed breakdown with years/months/days', () => {
    const result = calculateDateDifference('2020-01-01', '2024-06-15');
    expect(result.detailed.years).toBeGreaterThanOrEqual(4);
    expect(result.detailed.months).toBeGreaterThanOrEqual(0);
    expect(result.detailed.days).toBeGreaterThanOrEqual(0);
  });

  it('detailed breakdown for exactly one year', () => {
    const result = calculateDateDifference('2023-01-01', '2024-01-01');
    expect(result.detailed.years).toBe(1);
    expect(result.detailed.months).toBe(0);
    expect(result.detailed.days).toBe(0);
  });

  it('order of arguments does not matter (absolute difference)', () => {
    const a = calculateDateDifference('2024-01-01', '2024-03-01');
    const b = calculateDateDifference('2024-03-01', '2024-01-01');
    expect(a.days).toBe(b.days);
  });

  it('throws on invalid date', () => {
    expect(() => calculateDateDifference('not-a-date', '2024-01-01')).toThrow('Invalid date');
  });

  it('throws on second invalid date', () => {
    expect(() => calculateDateDifference('2024-01-01', 'bad')).toThrow('Invalid date');
  });

  it('hours, minutes, seconds are computed', () => {
    const result = calculateDateDifference('2024-01-01', '2024-01-02');
    expect(result.hours).toBe(24);
    expect(result.minutes).toBe(24 * 60);
    expect(result.seconds).toBe(24 * 60 * 60);
  });

  it('weeks = floor(days / 7)', () => {
    const result = calculateDateDifference('2024-01-01', '2024-02-01');
    expect(result.weeks).toBe(Math.floor(result.days / 7));
  });
});

// ==================== CALORIE CALCULATOR ====================

describe('calculateCalories', () => {
  it('male moderate: bmr > 0 and tdee > bmr', () => {
    const result = calculateCalories('male', 80, 180, 30, 'moderate');
    expect(result.bmr).toBeGreaterThan(0);
    expect(result.tdee).toBeGreaterThan(result.bmr);
  });

  it('female sedentary: bmr > 0', () => {
    const result = calculateCalories('female', 60, 165, 25, 'sedentary');
    expect(result.bmr).toBeGreaterThan(0);
  });

  it('forWeightLoss = tdee - 500', () => {
    const result = calculateCalories('male', 80, 180, 30, 'moderate');
    expect(result.forWeightLoss).toBe(result.tdee - 500);
  });

  it('forWeightGain = tdee + 500', () => {
    const result = calculateCalories('male', 80, 180, 30, 'moderate');
    expect(result.forWeightGain).toBe(result.tdee + 500);
  });

  it('macros.protein.grams > 0', () => {
    const result = calculateCalories('male', 80, 180, 30, 'moderate');
    expect(result.macros.protein.grams).toBeGreaterThan(0);
  });

  it('macros.carbs.grams > 0', () => {
    const result = calculateCalories('female', 60, 165, 25, 'moderate');
    expect(result.macros.carbs.grams).toBeGreaterThan(0);
  });

  it('macros.fat.grams > 0', () => {
    const result = calculateCalories('female', 60, 165, 25, 'moderate');
    expect(result.macros.fat.grams).toBeGreaterThan(0);
  });

  it('all activity levels produce different tdee values', () => {
    const levels = ['sedentary', 'light', 'moderate', 'active', 'veryActive'] as const;
    const tdees = levels.map(
      (lvl) => calculateCalories('male', 80, 180, 30, lvl).tdee,
    );
    const uniqueTdees = new Set(tdees);
    expect(uniqueTdees.size).toBe(5);
  });

  it('higher activity level → higher tdee', () => {
    const sedentary = calculateCalories('male', 80, 180, 30, 'sedentary').tdee;
    const active = calculateCalories('male', 80, 180, 30, 'active').tdee;
    expect(active).toBeGreaterThan(sedentary);
  });

  it('male BMR is higher than female for same inputs', () => {
    const m = calculateCalories('male', 70, 170, 30, 'sedentary').bmr;
    const f = calculateCalories('female', 70, 170, 30, 'sedentary').bmr;
    expect(m).toBeGreaterThan(f);
  });

  it('protein calories = grams * 4', () => {
    const result = calculateCalories('male', 80, 180, 30, 'moderate');
    // Both are rounded independently, so allow ±1
    expect(Math.abs(result.macros.protein.calories - result.macros.protein.grams * 4)).toBeLessThanOrEqual(4);
  });
});

// ==================== HEART RATE ZONES ====================

describe('calculateHeartRateZones', () => {
  it('maxHeartRate = 220 - age for age 30', () => {
    const result = calculateHeartRateZones(30);
    expect(result.maxHeartRate).toBe(190);
  });

  it('heartRateReserve = maxHR - restingHR for (30, 60)', () => {
    const result = calculateHeartRateZones(30, 60);
    expect(result.heartRateReserve).toBe(130);
  });

  it('returns exactly 5 zones', () => {
    const result = calculateHeartRateZones(30);
    expect(result.zones).toHaveLength(5);
  });

  it('each zone.min < zone.max', () => {
    const result = calculateHeartRateZones(30, 60);
    for (const zone of result.zones) {
      expect(zone.min).toBeLessThan(zone.max);
    }
  });

  it('Zone 1 starts at restingHR + HRR * 0.5', () => {
    const rhr = 60;
    const result = calculateHeartRateZones(30, rhr);
    const hrr = result.heartRateReserve;
    expect(result.zones[0].min).toBe(Math.round(rhr + hrr * 0.5));
  });

  it('Zone 5 max reaches restingHR + HRR * 1.0 (maxHR)', () => {
    const rhr = 60;
    const result = calculateHeartRateZones(30, rhr);
    const hrr = result.heartRateReserve;
    expect(result.zones[4].max).toBe(Math.round(rhr + hrr * 1.0));
  });

  it('default resting heart rate is 60', () => {
    const result = calculateHeartRateZones(25);
    expect(result.restingHeartRate).toBe(60);
  });

  it('zones are ordered (each subsequent zone starts higher)', () => {
    const result = calculateHeartRateZones(40, 65);
    for (let i = 1; i < result.zones.length; i++) {
      expect(result.zones[i].min).toBeGreaterThan(result.zones[i - 1].min);
    }
  });

  it('each zone has a non-empty name and purpose', () => {
    const result = calculateHeartRateZones(30);
    for (const zone of result.zones) {
      expect(zone.name.length).toBeGreaterThan(0);
      expect(zone.purpose.length).toBeGreaterThan(0);
    }
  });
});

// ==================== BODY FAT CALCULATOR ====================

describe('calculateBodyFat', () => {
  it('male: bodyFatPercentage > 0 for (male, 85, 38, 180)', () => {
    const result = calculateBodyFat('male', 85, 38, 180);
    expect(result.bodyFatPercentage).toBeGreaterThan(0);
  });

  it('female: bodyFatPercentage > 0 for (female, 75, 33, 165, 95)', () => {
    const result = calculateBodyFat('female', 75, 33, 165, 95);
    expect(result.bodyFatPercentage).toBeGreaterThan(0);
  });

  it('female without hips throws', () => {
    expect(() => calculateBodyFat('female', 75, 33, 165)).toThrow(
      'Hip measurement required for females',
    );
  });

  it('result has category, fatMass, leanMass', () => {
    const result = calculateBodyFat('male', 85, 38, 180);
    expect(typeof result.category).toBe('string');
    expect(typeof result.fatMass).toBe('number');
    expect(typeof result.leanMass).toBe('number');
  });

  it('bodyFatPercentage between 0 and 60', () => {
    const result = calculateBodyFat('male', 85, 38, 180);
    expect(result.bodyFatPercentage).toBeGreaterThanOrEqual(0);
    expect(result.bodyFatPercentage).toBeLessThanOrEqual(60);
  });

  it('fatMass + leanMass ≈ estimated weight', () => {
    const result = calculateBodyFat('male', 85, 38, 180);
    const estimatedWeight = (180 - 100) * 0.9;
    expect(result.fatMass + result.leanMass).toBeCloseTo(estimatedWeight, 0);
  });

  it('female fatMass + leanMass ≈ estimated weight', () => {
    const result = calculateBodyFat('female', 75, 33, 165, 95);
    const estimatedWeight = (165 - 100) * 0.85;
    expect(result.fatMass + result.leanMass).toBeCloseTo(estimatedWeight, 0);
  });

  it('male category matches expected ranges', () => {
    const result = calculateBodyFat('male', 85, 38, 180);
    const bf = result.bodyFatPercentage;
    if (bf < 6) expect(result.category).toBe('Essential Fat');
    else if (bf < 14) expect(result.category).toBe('Athletes');
    else if (bf < 18) expect(result.category).toBe('Fitness');
    else if (bf < 25) expect(result.category).toBe('Average');
    else expect(result.category).toBe('Obese');
  });

  it('bodyFatPercentage is clamped to [0, 60]', () => {
    // Even with extreme values, result should be clamped
    const result = calculateBodyFat('male', 200, 30, 150);
    expect(result.bodyFatPercentage).toBeLessThanOrEqual(60);
    expect(result.bodyFatPercentage).toBeGreaterThanOrEqual(0);
  });

  it('male with no hips does not throw', () => {
    expect(() => calculateBodyFat('male', 90, 40, 175)).not.toThrow();
  });
});

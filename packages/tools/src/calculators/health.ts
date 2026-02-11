/**
 * Health and Personal Calculators
 */

// ==================== BMI CALCULATOR ====================

export interface BMIResult {
  bmi: number;
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese Class I' | 'Obese Class II' | 'Obese Class III';
  healthyWeightRange: { min: number; max: number };
  recommendation: string;
}

export function calculateBmi(weightKg: number, heightM: number): BMIResult {
  if (heightM <= 0) throw new Error('Height must be positive');
  if (weightKg <= 0) throw new Error('Weight must be positive');
  
  const bmi = weightKg / (heightM * heightM);
  
  let category: BMIResult['category'];
  let recommendation: string;
  
  if (bmi < 18.5) {
    category = 'Underweight';
    recommendation = 'Consider consulting a healthcare provider about healthy weight gain.';
  } else if (bmi < 25) {
    category = 'Normal weight';
    recommendation = 'Maintain current healthy lifestyle.';
  } else if (bmi < 30) {
    category = 'Overweight';
    recommendation = 'Consider lifestyle changes for gradual weight loss.';
  } else if (bmi < 35) {
    category = 'Obese Class I';
    recommendation = 'Consult a healthcare provider about weight management.';
  } else if (bmi < 40) {
    category = 'Obese Class II';
    recommendation = 'Seek medical advice for weight management programs.';
  } else {
    category = 'Obese Class III';
    recommendation = 'Consult a healthcare provider for comprehensive treatment.';
  }
  
  // Calculate healthy weight range (BMI 18.5-24.9)
  const healthyWeightRange = {
    min: Math.round(18.5 * heightM * heightM * 10) / 10,
    max: Math.round(24.9 * heightM * heightM * 10) / 10,
  };
  
  return {
    bmi: Math.round(bmi * 10) / 10,
    category,
    healthyWeightRange,
    recommendation,
  };
}

// ==================== AGE CALCULATOR ====================

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  nextBirthday: Date;
  daysUntilBirthday: number;
}

export function calculateAge(birthDate: Date | string): AgeResult {
  const birth = new Date(birthDate);
  const today = new Date();
  
  if (isNaN(birth.getTime())) {
    throw new Error('Invalid birth date');
  }
  
  if (birth > today) {
    throw new Error('Birth date cannot be in the future');
  }
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Calculate total days
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.floor((today.getTime() - birth.getTime()) / msPerDay);
  
  // Next birthday
  let nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday <= today) {
    nextBirthday = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }
  const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - today.getTime()) / msPerDay);
  
  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
    nextBirthday,
    daysUntilBirthday,
  };
}

// ==================== DATE DIFFERENCE CALCULATOR ====================

export interface DateDifferenceResult {
  days: number;
  weeks: number;
  months: number;
  years: number;
  hours: number;
  minutes: number;
  seconds: number;
  businessDays: number;
  detailed: {
    years: number;
    months: number;
    days: number;
  };
}

export function calculateDateDifference(
  date1: Date | string,
  date2: Date | string,
  _excludeWeekends = false
): DateDifferenceResult {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    throw new Error('Invalid date(s)');
  }
  
  const startDate = d1 < d2 ? d1 : d2;
  const endDate = d1 < d2 ? d2 : d1;
  
  const msPerSecond = 1000;
  const msPerMinute = msPerSecond * 60;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  
  const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
  const days = Math.floor(diffMs / msPerDay);
  
  // Calculate business days
  let businessDays = 0;
  const tempDate = new Date(startDate);
  while (tempDate < endDate) {
    const dayOfWeek = tempDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  // Detailed breakdown
  let years = endDate.getFullYear() - startDate.getFullYear();
  let months = endDate.getMonth() - startDate.getMonth();
  let detailedDays = endDate.getDate() - startDate.getDate();
  
  if (detailedDays < 0) {
    months--;
    const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
    detailedDays += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return {
    days,
    weeks: Math.floor(days / 7),
    months: Math.floor(days / 30.44),
    years: Math.floor(days / 365.25),
    hours: Math.floor(diffMs / msPerHour),
    minutes: Math.floor(diffMs / msPerMinute),
    seconds: Math.floor(diffMs / msPerSecond),
    businessDays,
    detailed: {
      years,
      months,
      days: detailedDays,
    },
  };
}

// ==================== CALORIE CALCULATOR ====================

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

// Gender type is internal to avoid conflict with islamic.ts export
type Gender = 'male' | 'female';

export interface CalorieResult {
  bmr: number;
  tdee: number;
  forWeightLoss: number;
  forWeightGain: number;
  macros: {
    protein: { grams: number; calories: number };
    carbs: { grams: number; calories: number };
    fat: { grams: number; calories: number };
  };
}

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export function calculateCalories(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: ActivityLevel
): CalorieResult {
  // Mifflin-St Jeor Equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
  
  const tdee = bmr * activityMultipliers[activityLevel];
  
  // Recommended macros (balanced diet: 30% protein, 40% carbs, 30% fat)
  const proteinCals = tdee * 0.3;
  const carbsCals = tdee * 0.4;
  const fatCals = tdee * 0.3;
  
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    forWeightLoss: Math.round(tdee - 500), // 500 cal deficit
    forWeightGain: Math.round(tdee + 500), // 500 cal surplus
    macros: {
      protein: { grams: Math.round(proteinCals / 4), calories: Math.round(proteinCals) },
      carbs: { grams: Math.round(carbsCals / 4), calories: Math.round(carbsCals) },
      fat: { grams: Math.round(fatCals / 9), calories: Math.round(fatCals) },
    },
  };
}

// ==================== HEART RATE ZONES ====================

export interface HeartRateZones {
  maxHeartRate: number;
  restingHeartRate: number;
  heartRateReserve: number;
  zones: {
    name: string;
    percentage: string;
    min: number;
    max: number;
    purpose: string;
  }[];
}

export function calculateHeartRateZones(age: number, restingHeartRate: number = 60): HeartRateZones {
  const maxHeartRate = 220 - age;
  const heartRateReserve = maxHeartRate - restingHeartRate;
  
  const calculateZone = (minPct: number, maxPct: number) => ({
    min: Math.round(restingHeartRate + heartRateReserve * minPct),
    max: Math.round(restingHeartRate + heartRateReserve * maxPct),
  });
  
  return {
    maxHeartRate,
    restingHeartRate,
    heartRateReserve,
    zones: [
      { name: 'Zone 1 - Recovery', percentage: '50-60%', ...calculateZone(0.5, 0.6), purpose: 'Warm up, recovery' },
      { name: 'Zone 2 - Fat Burn', percentage: '60-70%', ...calculateZone(0.6, 0.7), purpose: 'Fat burning, endurance' },
      { name: 'Zone 3 - Aerobic', percentage: '70-80%', ...calculateZone(0.7, 0.8), purpose: 'Cardio fitness' },
      { name: 'Zone 4 - Anaerobic', percentage: '80-90%', ...calculateZone(0.8, 0.9), purpose: 'Speed, power' },
      { name: 'Zone 5 - Maximum', percentage: '90-100%', ...calculateZone(0.9, 1.0), purpose: 'Maximum effort' },
    ],
  };
}

// ==================== BODY FAT CALCULATOR (Navy Method) ====================

export interface BodyFatResult {
  bodyFatPercentage: number;
  category: string;
  fatMass: number;
  leanMass: number;
}

export function calculateBodyFat(
  gender: Gender,
  waistCm: number,
  neckCm: number,
  heightCm: number,
  hipsCm?: number // Required for females
): BodyFatResult {
  let bodyFatPercentage: number;
  
  if (gender === 'male') {
    bodyFatPercentage = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    if (!hipsCm) throw new Error('Hip measurement required for females');
    bodyFatPercentage = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipsCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
  }
  
  bodyFatPercentage = Math.max(0, Math.min(60, bodyFatPercentage));
  
  let category: string;
  if (gender === 'male') {
    if (bodyFatPercentage < 6) category = 'Essential Fat';
    else if (bodyFatPercentage < 14) category = 'Athletes';
    else if (bodyFatPercentage < 18) category = 'Fitness';
    else if (bodyFatPercentage < 25) category = 'Average';
    else category = 'Obese';
  } else {
    if (bodyFatPercentage < 14) category = 'Essential Fat';
    else if (bodyFatPercentage < 21) category = 'Athletes';
    else if (bodyFatPercentage < 25) category = 'Fitness';
    else if (bodyFatPercentage < 32) category = 'Average';
    else category = 'Obese';
  }
  
  // Estimate weight for fat/lean mass calculation (rough estimate)
  const estimatedWeight = (heightCm - 100) * (gender === 'male' ? 0.9 : 0.85);
  const fatMass = estimatedWeight * (bodyFatPercentage / 100);
  const leanMass = estimatedWeight - fatMass;
  
  return {
    bodyFatPercentage: Math.round(bodyFatPercentage * 10) / 10,
    category,
    fatMass: Math.round(fatMass * 10) / 10,
    leanMass: Math.round(leanMass * 10) / 10,
  };
}

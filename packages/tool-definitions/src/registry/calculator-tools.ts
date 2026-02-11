/**
 * Calculator Tools Registry
 * Category: Calculator
 * Subcategories: Health, Academic, Islamic, Date, Math
 */

import type { ToolMetadata } from '../types';

export const calculatorTools: ToolMetadata[] = [
  // =====================================================
  // HEALTH CALCULATORS
  // =====================================================

  {
    id: 'bmi-calculator', name: 'BMI Calculator', description: 'Calculate Body Mass Index', category: 'Calculator', subcategory: 'Health', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      {
        name: 'unitSystem', type: 'select', label: 'Unit System', default: 'metric', options: [
          { value: 'metric', label: 'Metric (kg, m)' },
          { value: 'imperial', label: 'Imperial (lb, ft/in)' },
        ]
      },
      { name: 'weight', type: 'number', label: 'Weight', description: 'kg (metric) or lb (imperial)', required: true, min: 1, max: 1000 },
      { name: 'height', type: 'number', label: 'Height', description: 'm (metric)', required: true, min: 0.5, max: 3, step: 0.01 },
      { name: 'heightFeet', type: 'number', label: 'Height (feet)', description: 'For imperial', min: 0, max: 8 },
      { name: 'heightInches', type: 'number', label: 'Height (inches)', description: 'For imperial', min: 0, max: 11 },
      {
        name: 'ageGroup', type: 'select', label: 'Age Group', default: 'adult', options: [
          { value: 'adult', label: 'Adult (20+)' },
          { value: 'teen', label: 'Teen (13-19)' },
          { value: 'child', label: 'Child (2-12)' },
        ]
      },
      {
        name: 'gender', type: 'select', label: 'Gender', description: 'For child/teen percentile charts', options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ]
      },
    ]
  },

  // =====================================================
  // ACADEMIC CALCULATORS
  // =====================================================

  {
    id: 'gpa-calculator', name: 'Grade & GPA Calculator', description: 'Calculate grade point average', category: 'Calculator', subcategory: 'Academic', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      {
        name: 'gradingScale', type: 'select', label: 'Grading Scale', default: '4.0', options: [
          { value: '4.0', label: '4.0 Scale (US Standard)' },
          { value: '4.3', label: '4.3 Scale (+/- grades)' },
          { value: '5.0', label: '5.0 Scale' },
          { value: '10.0', label: '10.0 Scale' },
          { value: '100', label: 'Percentage (100)' },
          { value: 'letter', label: 'Letter Grades (A-F)' },
        ]
      },
      {
        name: 'weightingMethod', type: 'select', label: 'Weighting Method', default: 'weighted', options: [
          { value: 'weighted', label: 'Weighted (by credits)' },
          { value: 'unweighted', label: 'Unweighted (simple avg)' },
        ]
      },
      { name: 'includeHonors', type: 'boolean', label: 'Include Honors/AP Boost', default: false },
      { name: 'honorsBoost', type: 'number', label: 'Honors Boost Value', default: 0.5, min: 0, max: 1, step: 0.1 },
      { name: 'apBoost', type: 'number', label: 'AP/IB Boost Value', default: 1.0, min: 0, max: 2, step: 0.1 },
      { name: 'grades', type: 'string', label: 'Grades (JSON array)', placeholder: '[{"course":"Math","grade":"A","credits":3,"type":"regular"}]', description: 'type: regular/honors/ap' },
    ]
  },

  // =====================================================
  // ISLAMIC CALCULATORS
  // =====================================================

  {
    id: 'inheritance-calculator', name: 'Islamic Inheritance Calculator', description: 'Calculate Islamic inheritance shares according to Sharia with proper blocking rules', category: 'Calculator', subcategory: 'Islamic', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      {
        name: 'schoolOfJurisprudence', type: 'select', label: 'School of Jurisprudence', default: 'hanafi', options: [
          { value: 'hanafi', label: 'Hanafi' },
          { value: 'maliki', label: 'Maliki' },
          { value: 'shafii', label: 'Shafi\'i' },
          { value: 'hanbali', label: 'Hanbali' },
        ]
      },
      { name: 'currency', type: 'string', label: 'Currency', default: 'USD', placeholder: 'USD, EUR, GBP...' },
      { name: 'estateValue', type: 'number', label: 'Total Estate Value', required: true, min: 0 },
      { name: 'debts', type: 'number', label: 'Debts', default: 0, min: 0 },
      { name: 'funeralExpenses', type: 'number', label: 'Funeral Expenses', default: 0, min: 0 },
      { name: 'bequests', type: 'number', label: 'Bequests (max 1/3)', default: 0, min: 0 },
      { name: 'hasHusband', type: 'boolean', label: 'Has Husband', default: false },
      { name: 'numberOfWives', type: 'number', label: 'Number of Wives', default: 0, min: 0, max: 4 },
      { name: 'numberOfSons', type: 'number', label: 'Number of Sons', default: 0, min: 0 },
      { name: 'numberOfDaughters', type: 'number', label: 'Number of Daughters', default: 0, min: 0 },
      { name: 'numberOfGrandsons', type: 'number', label: 'Grandsons (Son\'s Sons)', default: 0, min: 0 },
      { name: 'numberOfGranddaughters', type: 'number', label: 'Granddaughters (Son\'s Daughters)', default: 0, min: 0 },
      { name: 'hasFather', type: 'boolean', label: 'Father Living', default: false },
      { name: 'hasMother', type: 'boolean', label: 'Mother Living', default: false },
      { name: 'hasGrandfather', type: 'boolean', label: 'Grandfather (Father\'s Father)', default: false },
      { name: 'hasPaternalGrandmother', type: 'boolean', label: 'Paternal Grandmother', default: false },
      { name: 'hasMaternalGrandmother', type: 'boolean', label: 'Maternal Grandmother', default: false },
      { name: 'numberOfFullBrothers', type: 'number', label: 'Full Brothers', default: 0, min: 0 },
      { name: 'numberOfFullSisters', type: 'number', label: 'Full Sisters', default: 0, min: 0 },
      { name: 'numberOfPaternalBrothers', type: 'number', label: 'Paternal Half-Brothers', default: 0, min: 0 },
      { name: 'numberOfPaternalSisters', type: 'number', label: 'Paternal Half-Sisters', default: 0, min: 0 },
      { name: 'numberOfMaternalBrothers', type: 'number', label: 'Maternal Half-Brothers', default: 0, min: 0 },
      { name: 'numberOfMaternalSisters', type: 'number', label: 'Maternal Half-Sisters', default: 0, min: 0 },
      { name: 'showBlockingRules', type: 'boolean', label: 'Show Blocking Rules', default: true },
      { name: 'showCalculationSteps', type: 'boolean', label: 'Show Calculation Steps', default: false },
    ]
  },
  {
    id: 'zakat-calculator', name: 'Zakat Calculator', description: 'Calculate Islamic Zakat (2.5%) based on Nisab threshold', category: 'Calculator', subcategory: 'Islamic', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      {
        name: 'nisabStandard', type: 'select', label: 'Nisab Standard', default: 'silver', options: [
          { value: 'gold', label: 'Gold (87.48g / 3 oz)' },
          { value: 'silver', label: 'Silver (612.36g / 21 oz)' },
          { value: 'custom', label: 'Custom Nisab Value' },
        ]
      },
      { name: 'customNisab', type: 'number', label: 'Custom Nisab Value', description: 'If using custom nisab', min: 0 },
      { name: 'currency', type: 'string', label: 'Currency', default: 'USD', placeholder: 'USD, EUR, GBP...' },
      {
        name: 'zakatYear', type: 'select', label: 'Calculation Period', default: 'lunar', options: [
          { value: 'lunar', label: 'Lunar Year (354 days)' },
          { value: 'solar', label: 'Solar Year (365 days)' },
        ]
      },
      { name: 'cash', type: 'number', label: 'Cash at Home', default: 0, min: 0 },
      { name: 'bankBalance', type: 'number', label: 'Bank Balance', default: 0, min: 0 },
      { name: 'goldGrams', type: 'number', label: 'Gold (grams)', default: 0, min: 0, step: 0.01 },
      { name: 'goldPricePerGram', type: 'number', label: 'Gold Price/gram', default: 60, min: 0, step: 0.01 },
      { name: 'silverGrams', type: 'number', label: 'Silver (grams)', default: 0, min: 0, step: 0.01 },
      { name: 'silverPricePerGram', type: 'number', label: 'Silver Price/gram', default: 0.75, min: 0, step: 0.01 },
      { name: 'stocks', type: 'number', label: 'Stocks/Investments', default: 0, min: 0 },
      { name: 'crypto', type: 'number', label: 'Cryptocurrency', default: 0, min: 0 },
      { name: 'businessInventory', type: 'number', label: 'Business Inventory', default: 0, min: 0 },
      { name: 'receivables', type: 'number', label: 'Money Owed to You', default: 0, min: 0 },
      { name: 'realEstate', type: 'number', label: 'Investment Real Estate', default: 0, min: 0 },
      { name: 'retirement', type: 'number', label: 'Retirement Accounts', description: 'If accessible', default: 0, min: 0 },
      { name: 'otherAssets', type: 'number', label: 'Other Zakatable Assets', default: 0, min: 0 },
      { name: 'liabilities', type: 'number', label: 'Short-term Liabilities', default: 0, min: 0 },
      { name: 'showBreakdown', type: 'boolean', label: 'Show Detailed Breakdown', default: true },
    ]
  },

  // =====================================================
  // DATE CALCULATORS
  // =====================================================

  {
    id: 'timezone-converter', name: 'Time Zone Date-Time Conversion', description: 'Convert between timezones', category: 'Calculator', subcategory: 'Date', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'dateTime', type: 'string', label: 'Date/Time', placeholder: '2024-01-15 14:30:00' },
      { name: 'fromTimezone', type: 'string', label: 'From Timezone', default: 'UTC' },
      { name: 'toTimezone', type: 'string', label: 'To Timezone', default: 'America/New_York' },
      { name: 'showDstInfo', type: 'boolean', label: 'Show DST Information', default: false },
    ]
  },
  {
    id: 'age-calculator', name: 'Age Calculator', description: 'Calculate age from birth date', category: 'Calculator', subcategory: 'Date', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'birthDate', type: 'date', label: 'Birth Date', required: true },
      { name: 'calculationDate', type: 'date', label: 'Calculate As Of', description: 'Leave empty for today' },
      {
        name: 'outputFormat', type: 'select', label: 'Output Format', default: 'detailed', options: [
          { value: 'years', label: 'Years Only' },
          { value: 'months', label: 'Years & Months' },
          { value: 'detailed', label: 'Years, Months & Days' },
          { value: 'days', label: 'Total Days' },
          { value: 'all', label: 'All Formats' },
        ]
      },
    ]
  },
  {
    id: 'date-diff', name: 'Date Difference Calculator', description: 'Calculate difference between dates', category: 'Calculator', subcategory: 'Date', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'date1', type: 'date', label: 'Start Date', required: true },
      { name: 'date2', type: 'date', label: 'End Date', required: true },
      {
        name: 'outputUnit', type: 'select', label: 'Output Unit', default: 'auto', options: [
          { value: 'auto', label: 'Auto (best fit)' },
          { value: 'days', label: 'Days' },
          { value: 'weeks', label: 'Weeks' },
          { value: 'months', label: 'Months' },
          { value: 'years', label: 'Years' },
          { value: 'workdays', label: 'Business Days' },
        ]
      },
      { name: 'includeEndDate', type: 'boolean', label: 'Include End Date', default: false },
      { name: 'excludeWeekends', type: 'boolean', label: 'Exclude Weekends', default: false },
    ]
  },

  // =====================================================
  // MATH CALCULATORS
  // =====================================================

  {
    id: 'percentage-calculator', name: 'Percentage Calculator', description: 'Calculate percentages', category: 'Calculator', subcategory: 'Math', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      {
        name: 'operation', type: 'select', label: 'Operation', required: true, options: [
          { value: 'of', label: 'X% of Y' },
          { value: 'is', label: 'X is what % of Y' },
          { value: 'change', label: '% change from X to Y' },
          { value: 'increase', label: 'Increase X by Y%' },
          { value: 'decrease', label: 'Decrease X by Y%' },
        ]
      },
      { name: 'value', type: 'number', label: 'First Value', required: true },
      { name: 'percentage', type: 'number', label: 'Percentage / Second Value', required: true },
      { name: 'decimalPlaces', type: 'number', label: 'Decimal Places', default: 2, min: 0, max: 10 },
    ]
  },
  {
    id: 'expression-evaluator', name: 'Expression Evaluator', description: 'Evaluate math expressions', category: 'Calculator', subcategory: 'Math', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      {
        name: 'angleMode', type: 'select', label: 'Angle Mode', default: 'radians', options: [
          { value: 'radians', label: 'Radians' },
          { value: 'degrees', label: 'Degrees' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 10, min: 0, max: 20 },
    ]
  },
];

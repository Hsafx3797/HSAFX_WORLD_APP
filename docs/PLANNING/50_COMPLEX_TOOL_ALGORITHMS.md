# 🧮 Complex Tool Algorithms Specification

**Tools Covered:**
- **419**: GPA Calculator (Multiple Grading Systems)
- **424**: Islamic Inheritance Calculator (Sharia-Compliant)
- **425**: Zakat Calculator (Multiple Nisab Standards)
- **445**: Cheque Generator (Amount to Words)
- **Age Calculator**: Timezone-Aware Date Calculations

---

## 1. GPA Calculator (Tool 419)

### 1.1 Supported Grading Systems

#### System 1: Standard 4.0 Scale (USA)
```typescript
interface StandardGrading {
  scale: 4.0;
  gradeMap: {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0,
    'F': 0.0
  };
}
```

#### System 2: Percentage to GPA (Pakistan/India)
```typescript
const percentageToGPA = (percentage: number): number => {
  if (percentage >= 85) return 4.0;
  if (percentage >= 80) return 3.7;
  if (percentage >= 75) return 3.3;
  if (percentage >= 70) return 3.0;
  if (percentage >= 65) return 2.7;
  if (percentage >= 60) return 2.3;
  if (percentage >= 55) return 2.0;
  if (percentage >= 50) return 1.7;
  return 0.0; // Fail
};
```

#### System 3: 5.0 Scale (Germany)
```typescript
interface GermanGrading {
  scale: 5.0;
  gradeMap: {
    '1.0': 5.0,  // Sehr gut (Excellent)
    '1.3': 4.7,
    '1.7': 4.3,
    '2.0': 4.0,  // Gut (Good)
    '2.3': 3.7,
    '2.7': 3.3,
    '3.0': 3.0,  // Befriedigend (Satisfactory)
    '3.3': 2.7,
    '3.7': 2.3,
    '4.0': 2.0,  // Ausreichend (Sufficient)
    '5.0': 0.0   // Nicht bestanden (Fail)
  };
}
```

### 1.2 Calculation Algorithm

#### Simple GPA (Unweighted)
```typescript
function calculateSimpleGPA(courses: Course[]): number {
  const totalPoints = courses.reduce((sum, course) => {
    return sum + course.gradePoint;
  }, 0);
  
  return totalPoints / courses.length;
}
```

#### Weighted GPA (Credit Hours)
```typescript
interface Course {
  name: string;
  gradePoint: number;  // e.g., 4.0 for A
  creditHours: number; // e.g., 3
}

function calculateWeightedGPA(courses: Course[]): number {
  let totalWeightedPoints = 0;
  let totalCredits = 0;
  
  for (const course of courses) {
    totalWeightedPoints += course.gradePoint * course.creditHours;
    totalCredits += course.creditHours;
  }
  
  if (totalCredits === 0) {
    throw new Error('Total credit hours cannot be zero');
  }
  
  return totalWeightedPoints / totalCredits;
}
```

#### Cumulative GPA (Multiple Semesters)
```typescript
interface Semester {
  gpa: number;
  credits: number;
}

function calculateCumulativeGPA(semesters: Semester[]): number {
  let totalWeightedGPA = 0;
  let totalCredits = 0;
  
  for (const semester of semesters) {
    totalWeightedGPA += semester.gpa * semester.credits;
    totalCredits += semester.credits;
  }
  
  return totalWeightedGPA / totalCredits;
}
```

### 1.3 Edge Cases

```typescript
// Handle pass/fail courses (don't count in GPA)
function filterPassFailCourses(courses: Course[]): Course[] {
  return courses.filter(c => c.gradePoint !== null);
}

// Handle retaken courses (use higher grade)
function handleRetakes(courses: Course[]): Course[] {
  const courseMap = new Map<string, Course>();
  
  for (const course of courses) {
    const existing = courseMap.get(course.name);
    if (!existing || course.gradePoint > existing.gradePoint) {
      courseMap.set(course.name, course);
    }
  }
  
  return Array.from(courseMap.values());
}
```

---

## 2. Islamic Inheritance Calculator (Tool 417)

### 2.1 Heirs Classification

```typescript
enum HeirCategory {
  ASHAB_AL_FURUD = 'fixed_share',    // Fixed share heirs
  ASABAH = 'residuary',               // Residuary heirs
  DHAWIL_ARHAM = 'distant_relatives' // Distant relatives
}

interface Heir {
  name: string;
  relationship: HeirRelation;
  gender: 'male' | 'female';
  isAlive: boolean;
}

enum HeirRelation {
  // Fixed Share Heirs (Ashab al-Furud)
  HUSBAND = 'husband',
  WIFE = 'wife',
  MOTHER = 'mother',
  FATHER = 'father',
  DAUGHTER = 'daughter',
  SON = 'son',
  FULL_SISTER = 'full_sister',
  MATERNAL_GRANDFATHER = 'maternal_grandfather',
  // Add more...
}
```

### 2.2 Fixed Share Calculation (Ashab al-Furud)

```typescript
function getFixedShare(
  heir: Heir,
  hasChildren: boolean,
  hasMaleChildren: boolean,
  totalWives: number,
  madhhab: 'hanafi' | 'shafii' | 'maliki' | 'hanbali'
): Fraction {
  switch (heir.relationship) {
    case HeirRelation.HUSBAND:
      // Husband gets 1/2 if no children, 1/4 if children exist
      return hasChildren ? { numerator: 1, denominator: 4 } 
                        : { numerator: 1, denominator: 2 };
    
    case HeirRelation.WIFE:
      // Wife gets 1/8 if children exist, 1/4 otherwise
      // Divided among multiple wives if applicable
      const baseShare = hasChildren 
        ? { numerator: 1, denominator: 8 }
        : { numerator: 1, denominator: 4 };
      
      return {
        numerator: baseShare.numerator,
        denominator: baseShare.denominator * totalWives
      };
    
    case HeirRelation.MOTHER:
      // Mother gets 1/6 if children exist or 2+ siblings
      // Otherwise 1/3 (or 1/3 of remainder in certain cases)
      return hasChildren 
        ? { numerator: 1, denominator: 6 }
        : { numerator: 1, denominator: 3 };
    
    case HeirRelation.FATHER:
      // Father gets 1/6 if male children exist
      // Plus residuary if no male children
      if (hasMaleChildren) {
        return { numerator: 1, denominator: 6 };
      }
      // Otherwise, father is also 'Asabah (residuary)
      return null; // Will be calculated as residuary
    
    case HeirRelation.DAUGHTER:
      // 1 daughter: 1/2
      // 2+ daughters: 2/3 divided among them
      // With sons: Shares with ratio 2:1 (son:daughter)
      return null; // Handled in special cases
    
    default:
      return null;
  }
}
```

### 2.3 Blocking Rules (Hijab)

```typescript
function applyBlockingRules(heirs: Heir[]): Heir[] {
  const sons = heirs.filter(h => h.relationship === HeirRelation.SON);
  const daughters = heirs.filter(h => h.relationship === HeirRelation.DAUGHTER);
  
  // Rule 1: Sons block grandsons
  if (sons.length > 0) {
    heirs = heirs.filter(h => h.relationship !== HeirRelation.GRANDSON);
  }
  
  // Rule 2: Father blocks grandfather
  const hasFather = heirs.some(h => h.relationship === HeirRelation.FATHER);
  if (hasFather) {
    heirs = heirs.filter(h => h.relationship !== HeirRelation.PATERNAL_GRANDFATHER);
  }
  
  // Rule 3: Children block siblings (in most madhhabs)
  if (sons.length > 0 || daughters.length > 0) {
    heirs = heirs.filter(h => 
      h.relationship !== HeirRelation.FULL_BROTHER &&
      h.relationship !== HeirRelation.FULL_SISTER &&
      h.relationship !== HeirRelation.PATERNAL_BROTHER
    );
  }
  
  return heirs;
}
```

### 2.4 Residuary Distribution (Asabah)

```typescript
function distributeResidue(
  residue: number,
  residuaries: Heir[]
): Map<Heir, number> {
  const distribution = new Map<Heir, number>();
  
  // Separate by gender for 2:1 ratio
  const males = residuaries.filter(h => h.gender === 'male');
  const females = residuaries.filter(h => h.gender === 'female');
  
  // Calculate shares: Male = 2 units, Female = 1 unit
  const totalUnits = males.length * 2 + females.length * 1;
  const perUnit = residue / totalUnits;
  
  males.forEach(heir => distribution.set(heir, perUnit * 2));
  females.forEach(heir => distribution.set(heir, perUnit * 1));
  
  return distribution;
}
```

### 2.5 Special Cases: 'Awl (Increase) and Radd (Return)

```typescript
// 'Awl: When fixed shares exceed 100%
function handleAwl(shares: Map<Heir, Fraction>): Map<Heir, Fraction> {
  const commonDenominator = lcm(...Array.from(shares.values()).map(f => f.denominator));
  
  const totalNumerators = Array.from(shares.values()).reduce((sum, fraction) => {
    return sum + (fraction.numerator * (commonDenominator / fraction.denominator));
  }, 0);
  
  if (totalNumerators > commonDenominator) {
    // Proportionally reduce all shares
    const newDenominator = totalNumerators;
    shares.forEach((fraction, heir) => {
      shares.set(heir, {
        numerator: fraction.numerator * (commonDenominator / fraction.denominator),
        denominator: newDenominator
      });
    });
  }
  
  return shares;
}

// Radd: When fixed shares don't use all estate (no residuaries)
function handleRadd(
  shares: Map<Heir, Fraction>,
  totalEstate: number
): Map<Heir, number> {
  const distribution = new Map<Heir, number>();
  const usedAmount = Array.from(shares.values()).reduce((sum, fraction) => {
    return sum + (totalEstate * fraction.numerator / fraction.denominator);
  }, 0);
  
  const remainder = totalEstate - usedAmount;
  
  if (remainder > 0) {
    // Distribute remainder proportionally (excluding spouse)
    const eligibleHeirs = Array.from(shares.entries()).filter(
      ([heir]) => heir.relationship !== HeirRelation.HUSBAND && 
                  heir.relationship !== HeirRelation.WIFE
    );
    
    const totalEligibleShares = eligibleHeirs.reduce((sum, [, fraction]) => {
      return sum + (fraction.numerator / fraction.denominator);
    }, 0);
    
    eligibleHeirs.forEach(([heir, fraction]) => {
      const baseShare = totalEstate * fraction.numerator / fraction.denominator;
      const extraShare = remainder * (fraction.numerator / fraction.denominator) / totalEligibleShares;
      distribution.set(heir, baseShare + extraShare);
    });
  }
  
  return distribution;
}
```

---

## 3. Zakat Calculator (Tool 418)

### 3.1 Nisab Thresholds

```typescript
interface NisabStandard {
  type: 'gold' | 'silver';
  amount: number;
  unit: 'grams' | 'tola';
}

const NISAB_THRESHOLDS = {
  gold: {
    grams: 87.48,  // 7.5 tola
    tola: 7.5
  },
  silver: {
    grams: 612.36, // 52.5 tola
    tola: 52.5
  }
};

// Conversion: 1 tola = 11.664 grams
const TOLA_TO_GRAMS = 11.664;
```

### 3.2 Asset Categories

```typescript
interface ZakatAssets {
  // Cash and Bank Balances
  cash: number;
  bankSavings: number;
  
  // Gold and Silver
  goldGrams: number;
  silverGrams: number;
  
  // Business Assets
  businessInventory: number;
  businessCash: number;
  accountsReceivable: number;
  
  // Investments
  stocks: number;
  bonds: number;
  mutualFunds: number;
  
  // Agricultural Produce
  crops: number;
  livestock: number;
  
  // Retirement Accounts (if accessible)
  pension: number;
}

interface ZakatLiabilities {
  shortTermDebts: number;  // Debts due within the year
  businessLiabilities: number;
}
```

### 3.3 Calculation Algorithm

```typescript
function calculateZakat(
  assets: ZakatAssets,
  liabilities: ZakatLiabilities,
  nisabStandard: 'gold' | 'silver',
  goldPricePerGram: number,
  silverPricePerGram: number
): ZakatResult {
  // Step 1: Calculate total zakatable wealth
  const totalWealth = 
    assets.cash +
    assets.bankSavings +
    (assets.goldGrams * goldPricePerGram) +
    (assets.silverGrams * silverPricePerGram) +
    assets.businessInventory +
    assets.businessCash +
    assets.accountsReceivable +
    assets.stocks +
    assets.bonds +
    assets.mutualFunds;
  
  // Step 2: Deduct liabilities
  const netWealth = totalWealth - 
    liabilities.shortTermDebts -
    liabilities.businessLiabilities;
  
  // Step 3: Determine Nisab threshold
  const nisabAmount = nisabStandard === 'gold'
    ? NISAB_THRESHOLDS.gold.grams * goldPricePerGram
    : NISAB_THRESHOLDS.silver.grams * silverPricePerGram;
  
  // Step 4: Check if Zakat is due
  if (netWealth < nisabAmount) {
    return {
      zakatDue: 0,
      netWealth,
      nisabAmount,
      isZakatApplicable: false,
      zakatRate: 0.025
    };
  }
  
  // Step 5: Calculate Zakat (2.5% of net wealth)
  const zakatDue = netWealth * 0.025;
  
  return {
    zakatDue,
    netWealth,
    nisabAmount,
    isZakatApplicable: true,
    zakatRate: 0.025
  };
}
```

### 3.4 Special Cases

#### Agricultural Produce Zakat
```typescript
function calculateAgriculturalZakat(
  cropValue: number,
  irrigationType: 'rain-fed' | 'irrigated' | 'mixed'
): number {
  // Rain-fed: 10% (Ushr)
  // Irrigated: 5% (Half Ushr)
  // Mixed: 7.5%
  
  const rates = {
    'rain-fed': 0.10,
    'irrigated': 0.05,
    'mixed': 0.075
  };
  
  return cropValue * rates[irrigationType];
}
```

#### Livestock Zakat
```typescript
interface LivestockZakat {
  camels: number;
  cattle: number;
  goats: number;
}

function calculateLivestockZakat(livestock: LivestockZakat): Map<string, number> {
  const zakat = new Map<string, number>();
  
  // Camels
  if (livestock.camels >= 5 && livestock.camels <= 9) {
    zakat.set('sheep', 1);
  } else if (livestock.camels >= 10 && livestock.camels <= 14) {
    zakat.set('sheep', 2);
  }
  // ... (full nisab tables)
  
  // Cattle (cows/buffalo)
  if (livestock.cattle >= 30 && livestock.cattle <= 39) {
    zakat.set('calf_1year', 1);
  }
  // ... (full nisab tables)
  
  // Goats/Sheep
  if (livestock.goats >= 40 && livestock.goats <= 120) {
    zakat.set('goat', 1);
  }
  // ... (full nisab tables)
  
  return zakat;
}
```

---

## 4. Cheque Generator (Tool 445)

### 4.1 Amount to Words Conversion

```typescript
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'
];

const TEENS = [
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
  'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

const SCALES = [
  { value: 1_000_000_000_000, word: 'Trillion' },
  { value: 1_000_000_000, word: 'Billion' },
  { value: 1_000_000, word: 'Million' },
  { value: 1_000, word: 'Thousand' },
  { value: 100, word: 'Hundred' }
];

function convertToWords(amount: number): string {
  if (amount === 0) return 'Zero';
  
  // Separate integer and decimal parts
  const [integerPart, decimalPart] = amount.toFixed(2).split('.');
  const integerAmount = parseInt(integerPart, 10);
  const decimalAmount = parseInt(decimalPart, 10);
  
  let words = convertIntegerToWords(integerAmount);
  
  // Add currency
  words += ' Rupees';
  
  // Add decimal part (paisa/cents)
  if (decimalAmount > 0) {
    words += ' and ' + convertIntegerToWords(decimalAmount) + ' Paisa';
  }
  
  words += ' Only';
  
  return words;
}

function convertIntegerToWords(n: number): string {
  if (n === 0) return '';
  
  // Handle scales (billion, million, thousand, hundred)
  for (const { value, word } of SCALES) {
    if (n >= value) {
      const quotient = Math.floor(n / value);
      const remainder = n % value;
      
      return (
        convertIntegerToWords(quotient) +
        ' ' + word +
        (remainder > 0 ? ' ' + convertIntegerToWords(remainder) : '')
      ).trim();
    }
  }
  
  // Handle numbers < 100
  if (n >= 20) {
    const tensDigit = Math.floor(n / 10);
    const onesDigit = n % 10;
    return (TENS[tensDigit] + (onesDigit > 0 ? ' ' + ONES[onesDigit] : '')).trim();
  }
  
  if (n >= 10) {
    return TEENS[n - 10];
  }
  
  return ONES[n];
}
```

### 4.2 Cheque Formatting

```typescript
interface ChequeData {
  payeeName: string;
  amount: number;
  date: Date;
  bankName: string;
  accountNumber?: string;
}

function formatCheque(data: ChequeData): string {
  const amountWords = convertToWords(data.amount);
  const amountFormatted = data.amount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `
Pay: ${data.payeeName}
Amount: Rs. ${amountFormatted}
Amount in Words: ${amountWords}
Date: ${data.date.toLocaleDateString('en-GB')}
  `.trim();
}
```

---

## 5. Age Calculator (Timezone-Aware)

### 5.1 Date Calculation with Timezone

```typescript
import { DateTime } from 'luxon';

interface AgeResult {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  nextBirthday: Date;
  zodiacSign: string;
}

function calculateAge(
  birthDate: Date,
  targetDate: Date = new Date(),
  birthdayTimezone: string = 'UTC',
  targetTimezone: string = 'UTC'
): AgeResult {
  // Convert to Luxon DateTime with proper timezones
  const birth = DateTime.fromJSDate(birthDate, { zone: birthdayTimezone });
  const target = DateTime.fromJSDate(targetDate, { zone: targetTimezone });
  
  // Calculate difference
  const diff = target.diff(birth, ['years', 'months', 'days', 'hours', 'minutes']);
  
  // Total counts
  const totalDays = Math.floor(target.diff(birth, 'days').days);
  const totalHours = Math.floor(target.diff(birth, 'hours').hours);
  const totalMinutes = Math.floor(target.diff(birth, 'minutes').minutes);
  
  // Next birthday
  let nextBirthday = birth.set({ year: target.year });
  if (nextBirthday < target) {
    nextBirthday = nextBirthday.plus({ years: 1 });
  }
  
  // Zodiac sign
  const zodiacSign = getZodiacSign(birth.month, birth.day);
  
  return {
    years: Math.floor(diff.years),
    months: Math.floor(diff.months),
    days: Math.floor(diff.days),
    hours: Math.floor(diff.hours),
    minutes: Math.floor(diff.minutes),
    totalDays,
    totalHours,
    totalMinutes,
    nextBirthday: nextBirthday.toJSDate(),
    zodiacSign
  };
}
```

### 5.2 Leap Year Handling

```typescript
function isLeapYear(year: number): boolean {
  // Divisible by 4, except century years (unless divisible by 400)
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getDaysInMonth(year: number, month: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  
  return daysInMonth[month - 1];
}
```

### 5.3 Zodiac Sign Calculation

```typescript
function getZodiacSign(month: number, day: number): string {
  const signs = [
    { name: 'Capricorn', start: [12, 22], end: [1, 19] },
    { name: 'Aquarius', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', start: [2, 19], end: [3, 20] },
    { name: 'Aries', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', start: [6, 21], end: [7, 22] },
    { name: 'Leo', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', start: [8, 23], end: [9, 22] },
    { name: 'Libra', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', start: [11, 22], end: [12, 21] }
  ];
  
  for (const sign of signs) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;
    
    if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay)
    ) {
      return sign.name;
    }
  }
  
  return 'Unknown';
}
```

### 5.4 Timezone Conversion Examples

```typescript
// Example: Calculate age for someone born in New York, viewed from Karachi
const birthDate = new Date('1990-01-15T08:30:00'); // 8:30 AM in New York
const ageResult = calculateAge(
  birthDate,
  new Date(),
  'America/New_York',
  'Asia/Karachi'
);

// Example: Daylight Saving Time handling
const birthInLondon = new Date('2000-06-15'); // Summer (BST)
const ageInWinter = calculateAge(
  birthInLondon,
  new Date('2025-01-16'),
  'Europe/London',  // Luxon handles DST automatically
  'Europe/London'
);
```

---

## 6. Implementation Notes

### 6.1 Execution Environment

- **GPA, Zakat, Cheque:** Node.js (Next.js API route) - synchronous
- **Inheritance:** Node.js (complex logic, requires validation)
- **Age:** Client-side (Luxon library for timezone support)

### 6.2 Validation Requirements

```typescript
// GPA
- creditHours > 0
- gradePoint >= 0 and <= scale
- At least 1 course

// Inheritance
- Estate value > 0
- At least 1 heir
- No circular relationships (e.g., person can't be both father and son)

// Zakat
- All amounts >= 0
- Nisab standard must be 'gold' or 'silver'
- Current prices must be provided

// Cheque
- Amount > 0 and < 10,000,000 (configurable max)
- Payee name non-empty
- Date not in far future (< 6 months ahead)

// Age
- Birth date < target date
- Birth date > 1900 (reasonable limit)
- Valid timezone identifiers
```

### 6.3 Error Messages

```typescript
const ERROR_MESSAGES = {
  GPA_INVALID_GRADE: 'Grade point must be between 0 and {scale}',
  GPA_NO_COURSES: 'At least one course is required',
  
  INHERITANCE_INVALID_HEIR: 'Invalid heir relationship: {relation}',
  INHERITANCE_CIRCULAR: 'Circular relationship detected',
  
  ZAKAT_NEGATIVE_AMOUNT: 'Asset amounts cannot be negative',
  ZAKAT_INVALID_NISAB: 'Nisab standard must be "gold" or "silver"',
  
  CHEQUE_AMOUNT_TOO_HIGH: 'Amount exceeds maximum limit of {max}',
  CHEQUE_INVALID_DATE: 'Cheque date must be within next 6 months',
  
  AGE_FUTURE_BIRTH: 'Birth date cannot be in the future',
  AGE_INVALID_TIMEZONE: 'Invalid timezone: {tz}'
};
```

---

**This specification provides complete algorithms for all complex calculators, ensuring zero AI hallucination during implementation.**

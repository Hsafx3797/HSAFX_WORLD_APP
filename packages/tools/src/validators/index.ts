/**
 * Validators Library
 * Common validation utilities for forms and data
 */

// ==================== STRING VALIDATORS ====================

export function isEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

export function isURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isPhoneNumber(value: string, countryCode?: string): boolean {
  // Remove common formatting characters
  const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
  
  // Basic international format
  if (/^\+?[1-9]\d{6,14}$/.test(cleaned)) {
    return true;
  }
  
  // Country-specific validation
  if (countryCode) {
    const patterns: Record<string, RegExp> = {
      US: /^1?\d{10}$/,
      UK: /^44\d{10}$|^0\d{10}$/,
      SA: /^966\d{9}$|^0\d{9}$/,
      AE: /^971\d{9}$|^0\d{9}$/,
    };
    
    if (patterns[countryCode]) {
      return patterns[countryCode].test(cleaned);
    }
  }
  
  return false;
}

export function isAlpha(value: string): boolean {
  return /^[a-zA-Z]+$/.test(value);
}

export function isAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value);
}

export function isNumeric(value: string): boolean {
  return /^-?\d+\.?\d*$/.test(value);
}

export function isInteger(value: string): boolean {
  return /^-?\d+$/.test(value);
}

export function isHexColor(value: string): boolean {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
}

export function isIPv4(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === String(num);
  });
}

export function isIPv6(value: string): boolean {
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^::1$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/;
  return ipv6Regex.test(value);
}

export function isMACAddress(value: string): boolean {
  return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(value);
}

export function isUUID(value: string, version?: 1 | 3 | 4 | 5): boolean {
  const patterns: Record<number | 'any', RegExp> = {
    1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    3: /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    any: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  };
  
  return patterns[version || 'any'].test(value);
}

export function isSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isBase64(value: string): boolean {
  try {
    return btoa(atob(value)) === value;
  } catch {
    return false;
  }
}

export function isJSON(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function isJWT(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  
  try {
    parts.forEach(part => {
      atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    });
    return true;
  } catch {
    return false;
  }
}

// ==================== DATE VALIDATORS ====================

export function isDate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(value);
}

export function isPastDate(value: string | Date): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && date < new Date();
}

export function isFutureDate(value: string | Date): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && date > new Date();
}

export function isDateBetween(value: string | Date, min: Date, max: Date): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && date >= min && date <= max;
}

// ==================== NUMBER VALIDATORS ====================

export function isPositive(value: number): boolean {
  return value > 0;
}

export function isNegative(value: number): boolean {
  return value < 0;
}

export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function isPort(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 65535;
}

// ==================== CREDIT CARD VALIDATORS ====================

export function isCreditCard(value: string): boolean {
  // Remove spaces and dashes
  const cleaned = value.replace(/[\s-]/g, '');
  
  // Check if all digits
  if (!/^\d{13,19}$/.test(cleaned)) return false;
  
  // Luhn algorithm
  return luhnCheck(cleaned);
}

export function getCreditCardType(value: string): string | null {
  const cleaned = value.replace(/[\s-]/g, '');
  
  const patterns: [string, RegExp][] = [
    ['Visa', /^4[0-9]{12}(?:[0-9]{3})?$/],
    ['MasterCard', /^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7(?:[01][0-9]|20))[0-9]{12}$/],
    ['American Express', /^3[47][0-9]{13}$/],
    ['Discover', /^6(?:011|5[0-9]{2})[0-9]{12}$/],
    ['Diners Club', /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/],
    ['JCB', /^(?:2131|1800|35\d{3})\d{11}$/],
    ['Mada', /^(4(0(0861|1757|7(197|395)|9201)|1(0685|7633|9593)|2(281(7|8|9)|8(331|67(1|2|3)))|3(1361|2328|4107|9954)|4(0(533|647|795)|5564|6(393|404|672))|5(5(036|708)|7865|8456)|6(2220|854(0|1|2|3))|8(301(0|1|2)|4783|609(4|5|6)|931(7|8|9))|93428)|5(0(4300|8160)|13213|2(1076|4(130|514)|9(415|741))|3(0906|1095|2013|5(825|989)|6023|7767|9931)|4(3(085|357)|9760)|5(4180|7606|8563)|8(5265|8(8(4(5|6|7|8|9)|5(0|1))|98(2|3))|9(005|206)))|6(0(4906|5141)|36120)|9682(0(1|2|3|4|5|6|7|8|9)|1(0|1)))$/],
  ];
  
  for (const [name, pattern] of patterns) {
    if (pattern.test(cleaned)) {
      return name;
    }
  }
  
  return null;
}

function luhnCheck(value: string): boolean {
  let sum = 0;
  let isEven = false;
  
  for (let i = value.length - 1; i >= 0; i--) {
    let digit = parseInt(value[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

export function isCVV(value: string, cardType?: string): boolean {
  const length = cardType === 'American Express' ? 4 : 3;
  return new RegExp(`^\\d{${length}}$`).test(value);
}

export function isExpiryDate(value: string): boolean {
  const match = value.match(/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/);
  if (!match) return false;
  
  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);
  
  if (year < 100) {
    year += 2000;
  }
  
  const now = new Date();
  const expiry = new Date(year, month, 0); // Last day of month
  
  return expiry >= now;
}

// ==================== IDENTIFICATION VALIDATORS ====================

export function isIBAN(value: string): boolean {
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(cleaned)) {
    return false;
  }
  
  // Rearrange for checksum
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  
  // Convert letters to numbers (A=10, B=11, etc.)
  const numeric = rearranged.split('').map(char => {
    const code = char.charCodeAt(0);
    return code >= 65 ? (code - 55).toString() : char;
  }).join('');
  
  // Perform mod 97
  let remainder = numeric;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(9);
  }
  
  return parseInt(remainder, 10) === 1;
}

export function isSWIFT(value: string): boolean {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value.toUpperCase());
}

export function isSSN(value: string): boolean {
  const cleaned = value.replace(/[-\s]/g, '');
  return /^\d{9}$/.test(cleaned) && !/^(?:000|666|9\d{2})\d{6}$/.test(cleaned);
}

export function isPassportNumber(value: string, countryCode?: string): boolean {
  if (countryCode) {
    const patterns: Record<string, RegExp> = {
      US: /^[0-9]{9}$/,
      UK: /^[0-9]{9}$/,
      SA: /^[A-Z][0-9]{8}$/,
      AE: /^[A-Z0-9]{9}$/,
    };
    
    if (patterns[countryCode]) {
      return patterns[countryCode].test(value);
    }
  }
  
  // Generic: 6-9 alphanumeric characters
  return /^[A-Z0-9]{6,9}$/i.test(value);
}

// ==================== SHIPPING VALIDATORS ====================

export function isContainerNumber(value: string): boolean {
  // ISO 6346 format: 4 letters + 7 digits
  const cleaned = value.replace(/[\s-]/g, '').toUpperCase();
  
  if (!/^[A-Z]{4}\d{7}$/.test(cleaned)) {
    return false;
  }
  
  // Check digit validation
  const letterValues: Record<string, number> = {
    A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20,
    K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31,
    U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
  };
  
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = cleaned[i];
    const value = letterValues[char] ?? parseInt(char, 10);
    sum += value * Math.pow(2, i);
  }
  
  const checkDigit = sum % 11 % 10;
  return checkDigit === parseInt(cleaned[10], 10);
}

export function isTrackingNumber(value: string, carrier?: string): boolean {
  const cleaned = value.replace(/[\s-]/g, '').toUpperCase();
  
  const patterns: Record<string, RegExp[]> = {
    UPS: [
      /^1Z[A-Z0-9]{16}$/,
      /^T\d{10}$/,
      /^\d{9}$/,
      /^\d{12}$/,
    ],
    FedEx: [
      /^\d{12}$/,
      /^\d{15}$/,
      /^\d{20}$/,
      /^\d{22}$/,
    ],
    USPS: [
      /^9\d{21}$/,
      /^9\d{15}$/,
      /^[A-Z]{2}\d{9}US$/,
    ],
    DHL: [
      /^\d{10}$/,
      /^\d{11}$/,
      /^[A-Z]{3}\d{7}$/,
    ],
  };
  
  if (carrier && patterns[carrier]) {
    return patterns[carrier].some(p => p.test(cleaned));
  }
  
  // Check all carriers
  return Object.values(patterns).flat().some(p => p.test(cleaned));
}

export function isBillOfLading(value: string): boolean {
  // Common B/L format: 4-5 letter prefix + 9-12 digits
  const cleaned = value.replace(/[\s-]/g, '').toUpperCase();
  return /^[A-Z]{4,5}\d{9,12}$/.test(cleaned);
}

// ==================== PASSWORD VALIDATORS ====================

export interface PasswordStrength {
  score: number; // 0-4
  level: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    noCommonPatterns: boolean;
  };
}

const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
];

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommonPatterns: !COMMON_PASSWORDS.some(p => 
      password.toLowerCase().includes(p)
    ),
  };
  
  if (!requirements.minLength) feedback.push('Use at least 8 characters');
  if (!requirements.hasUppercase) feedback.push('Add uppercase letters');
  if (!requirements.hasLowercase) feedback.push('Add lowercase letters');
  if (!requirements.hasNumber) feedback.push('Add numbers');
  if (!requirements.hasSpecial) feedback.push('Add special characters');
  if (!requirements.noCommonPatterns) feedback.push('Avoid common passwords');
  
  const passedCount = Object.values(requirements).filter(Boolean).length;
  
  let score: number;
  let level: PasswordStrength['level'];
  
  if (passedCount <= 2) {
    score = 0;
    level = 'very-weak';
  } else if (passedCount === 3) {
    score = 1;
    level = 'weak';
  } else if (passedCount === 4) {
    score = 2;
    level = 'fair';
  } else if (passedCount === 5) {
    score = 3;
    level = 'strong';
  } else {
    score = 4;
    level = 'very-strong';
  }
  
  // Bonus for length
  if (password.length >= 12 && score < 4) {
    score++;
    level = ['very-weak', 'weak', 'fair', 'strong', 'very-strong'][score] as PasswordStrength['level'];
  }
  
  return { score, level, feedback, requirements };
}

// ==================== VIN VALIDATOR ====================

export interface VINInfo {
  valid: boolean;
  wmi: string;
  vds: string;
  vis: string;
  year: string | null;
  manufacturer: string | null;
}

const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

const VIN_YEAR_CODES: Record<string, string> = {
  A: '1980', B: '1981', C: '1982', D: '1983', E: '1984',
  F: '1985', G: '1986', H: '1987', J: '1988', K: '1989',
  L: '1990', M: '1991', N: '1992', P: '1993', R: '1994',
  S: '1995', T: '1996', V: '1997', W: '1998', X: '1999',
  Y: '2000', '1': '2001', '2': '2002', '3': '2003', '4': '2004',
  '5': '2005', '6': '2006', '7': '2007', '8': '2008', '9': '2009',
};

export function validateVIN(vin: string): VINInfo {
  const cleaned = vin.replace(/[\s-]/g, '').toUpperCase();
  
  const result: VINInfo = {
    valid: false,
    wmi: cleaned.slice(0, 3),
    vds: cleaned.slice(3, 9),
    vis: cleaned.slice(9, 17),
    year: null,
    manufacturer: null,
  };
  
  // Check length
  if (cleaned.length !== 17) {
    return result;
  }
  
  // Check for invalid characters (I, O, Q not allowed)
  if (/[IOQ]/.test(cleaned)) {
    return result;
  }
  
  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = cleaned[i];
    const value = VIN_TRANSLITERATION[char] ?? parseInt(char, 10);
    sum += value * VIN_WEIGHTS[i];
  }
  
  const checkDigit = sum % 11;
  const expectedCheck = checkDigit === 10 ? 'X' : checkDigit.toString();
  
  if (cleaned[8] !== expectedCheck) {
    return result;
  }
  
  result.valid = true;
  result.year = VIN_YEAR_CODES[cleaned[9]] || null;
  
  // Basic manufacturer lookup
  const wmiManufacturers: Record<string, string> = {
    '1G': 'General Motors', '1F': 'Ford', '1C': 'Chrysler',
    '2G': 'GM Canada', '2F': 'Ford Canada',
    '3G': 'GM Mexico', '3F': 'Ford Mexico',
    'JT': 'Toyota', 'JH': 'Honda', 'JN': 'Nissan',
    'WA': 'Audi', 'WB': 'BMW', 'WD': 'Mercedes-Benz',
    'WV': 'Volkswagen', 'WP': 'Porsche',
    'SA': 'Land Rover', 'SJ': 'Jaguar',
    'YV': 'Volvo', 'ZA': 'Alfa Romeo', 'ZF': 'Ferrari',
  };
  
  result.manufacturer = wmiManufacturers[cleaned.slice(0, 2)] || null;
  
  return result;
}

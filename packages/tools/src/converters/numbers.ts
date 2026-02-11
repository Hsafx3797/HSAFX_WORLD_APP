/**
 * Number Base Converter Library
 */

// ==================== BASE CONVERSION ====================

export function convertBase(
  value: string,
  fromBase: number,
  toBase: number
): string {
  if (fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
    throw new Error('Base must be between 2 and 36');
  }
  
  // Parse the input value in the source base
  const decimal = parseInt(value, fromBase);
  
  if (isNaN(decimal)) {
    throw new Error(`Invalid value "${value}" for base ${fromBase}`);
  }
  
  // Convert to target base
  return decimal.toString(toBase).toUpperCase();
}

export function binaryToDecimal(binary: string): number {
  return parseInt(binary, 2);
}

export function decimalToBinary(decimal: number): string {
  return decimal.toString(2);
}

export function hexToDecimal(hex: string): number {
  return parseInt(hex, 16);
}

export function decimalToHex(decimal: number): string {
  return decimal.toString(16).toUpperCase();
}

export function octalToDecimal(octal: string): number {
  return parseInt(octal, 8);
}

export function decimalToOctal(decimal: number): string {
  return decimal.toString(8);
}

// ==================== BINARY OPERATIONS ====================

export function binaryToHex(binary: string): string {
  return convertBase(binary, 2, 16);
}

export function hexToBinary(hex: string): string {
  // Pad to multiple of 4 bits
  const binary = parseInt(hex, 16).toString(2);
  return binary.padStart(Math.ceil(binary.length / 4) * 4, '0');
}

export function binaryToOctal(binary: string): string {
  return convertBase(binary, 2, 8);
}

export function octalToBinary(octal: string): string {
  // Pad to multiple of 3 bits
  const binary = parseInt(octal, 8).toString(2);
  return binary.padStart(Math.ceil(binary.length / 3) * 3, '0');
}

// ==================== ASCII/TEXT CONVERSION ====================

export function textToAscii(text: string): number[] {
  return Array.from(text).map(char => char.charCodeAt(0));
}

export function asciiToText(codes: number[]): string {
  return codes.map(code => String.fromCharCode(code)).join('');
}

export function textToBinary(text: string): string {
  return Array.from(text)
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');
}

export function binaryToText(binary: string): string {
  return binary
    .split(/\s+/)
    .filter(b => b)
    .map(b => String.fromCharCode(parseInt(b, 2)))
    .join('');
}

export function textToHex(text: string): string {
  return Array.from(text)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ');
}

export function hexToText(hex: string): string {
  return hex
    .split(/\s+/)
    .filter(h => h)
    .map(h => String.fromCharCode(parseInt(h, 16)))
    .join('');
}

export function textToOctal(text: string): string {
  return Array.from(text)
    .map(char => char.charCodeAt(0).toString(8).padStart(3, '0'))
    .join(' ');
}

export function octalToText(octal: string): string {
  return octal
    .split(/\s+/)
    .filter(o => o)
    .map(o => String.fromCharCode(parseInt(o, 8)))
    .join('');
}

// ==================== ROMAN NUMERALS ====================

const romanNumerals: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

const romanToValue: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

export function decimalToRoman(num: number): string {
  if (num < 1 || num > 3999) {
    throw new Error('Number must be between 1 and 3999');
  }
  
  let result = '';
  let remaining = num;
  
  for (const [value, symbol] of romanNumerals) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  
  return result;
}

export function romanToDecimal(roman: string): number {
  const normalized = roman.toUpperCase();
  let result = 0;
  
  for (let i = 0; i < normalized.length; i++) {
    const current = romanToValue[normalized[i]];
    const next = romanToValue[normalized[i + 1]];
    
    if (!current) {
      throw new Error(`Invalid Roman numeral character: ${normalized[i]}`);
    }
    
    if (next && current < next) {
      result -= current;
    } else {
      result += current;
    }
  }
  
  return result;
}

// ==================== SCIENTIFIC NOTATION ====================

export function toScientificNotation(num: number, precision = 6): string {
  return num.toExponential(precision);
}

export function fromScientificNotation(sci: string): number {
  return parseFloat(sci);
}

// ==================== FRACTION CONVERSION ====================

export interface Fraction {
  numerator: number;
  denominator: number;
  whole?: number;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function decimalToFraction(decimal: number, maxDenominator = 10000): Fraction {
  const whole = Math.floor(Math.abs(decimal));
  let frac = Math.abs(decimal) - whole;
  
  if (frac === 0) {
    return { numerator: decimal < 0 ? -whole : whole, denominator: 1 };
  }
  
  let bestNumerator = 1;
  let bestDenominator = 1;
  let bestError = Math.abs(frac - bestNumerator / bestDenominator);
  
  for (let d = 2; d <= maxDenominator && bestError > 0; d++) {
    const n = Math.round(frac * d);
    const error = Math.abs(frac - n / d);
    if (error < bestError) {
      bestNumerator = n;
      bestDenominator = d;
      bestError = error;
    }
  }
  
  // Simplify
  const divisor = gcd(bestNumerator, bestDenominator);
  bestNumerator /= divisor;
  bestDenominator /= divisor;
  
  // Add whole number if present
  if (whole > 0) {
    return {
      whole: decimal < 0 ? -whole : whole,
      numerator: bestNumerator,
      denominator: bestDenominator,
    };
  }
  
  return {
    numerator: decimal < 0 ? -bestNumerator : bestNumerator,
    denominator: bestDenominator,
  };
}

export function fractionToDecimal(fraction: Fraction): number {
  const base = (fraction.whole || 0);
  return base + fraction.numerator / fraction.denominator;
}

export function simplifyFraction(numerator: number, denominator: number): Fraction {
  const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

// ==================== COMPREHENSIVE CONVERTER ====================

export interface NumberConversionResult {
  decimal: number;
  binary: string;
  octal: string;
  hexadecimal: string;
  roman?: string;
  scientific: string;
  fraction?: Fraction;
}

export function convertNumber(value: string | number, fromBase = 10): NumberConversionResult {
  let decimal: number;
  
  if (typeof value === 'string') {
    decimal = parseInt(value, fromBase);
  } else {
    decimal = value;
  }
  
  if (isNaN(decimal)) {
    throw new Error('Invalid number');
  }
  
  const result: NumberConversionResult = {
    decimal,
    binary: decimal.toString(2),
    octal: decimal.toString(8),
    hexadecimal: decimal.toString(16).toUpperCase(),
    scientific: decimal.toExponential(),
  };
  
  // Only add roman for valid range
  if (decimal >= 1 && decimal <= 3999 && Number.isInteger(decimal)) {
    result.roman = decimalToRoman(decimal);
  }
  
  // Only add fraction for non-integers
  if (!Number.isInteger(decimal)) {
    result.fraction = decimalToFraction(decimal);
  }
  
  return result;
}

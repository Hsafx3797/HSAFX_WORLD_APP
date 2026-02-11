import { describe, it, expect } from 'vitest';
import {
  convertBase,
  binaryToDecimal,
  decimalToBinary,
  hexToDecimal,
  decimalToHex,
  octalToDecimal,
  decimalToOctal,
  binaryToHex,
  hexToBinary,
  binaryToOctal,
  octalToBinary,
  textToAscii,
  asciiToText,
  textToBinary,
  binaryToText,
  textToHex,
  hexToText,
  textToOctal,
  octalToText,
  decimalToRoman,
  romanToDecimal,
  toScientificNotation,
  fromScientificNotation,
  decimalToFraction,
  fractionToDecimal,
  simplifyFraction,
  convertNumber,
} from '../numbers';

// ==================== convertBase ====================

describe('convertBase', () => {
  it('converts binary to decimal string', () => {
    expect(convertBase('1010', 2, 10)).toBe('10');
  });

  it('converts decimal to binary string', () => {
    expect(convertBase('10', 10, 2)).toBe('1010');
  });

  it('converts hex to octal', () => {
    expect(convertBase('FF', 16, 8)).toBe('377');
  });

  it('converts octal to hex', () => {
    expect(convertBase('377', 8, 16)).toBe('FF');
  });

  it('supports base 36', () => {
    expect(convertBase('Z', 36, 10)).toBe('35');
  });

  it('converts base 10 to base 36', () => {
    expect(convertBase('35', 10, 36)).toBe('Z');
  });

  it('throws for base less than 2', () => {
    expect(() => convertBase('10', 1, 10)).toThrow('Base must be between 2 and 36');
  });

  it('throws for base greater than 36', () => {
    expect(() => convertBase('10', 10, 37)).toThrow('Base must be between 2 and 36');
  });

  it('throws for invalid value in given base', () => {
    expect(() => convertBase('GG', 16, 10)).toThrow('Invalid value');
  });

  it('throws for non-numeric value in binary base', () => {
    expect(() => convertBase('ZZZ', 2, 10)).toThrow('Invalid value');
  });
});

// ==================== binaryToDecimal / decimalToBinary ====================

describe('binaryToDecimal', () => {
  it('converts 1010 to 10', () => {
    expect(binaryToDecimal('1010')).toBe(10);
  });

  it('converts 0 to 0', () => {
    expect(binaryToDecimal('0')).toBe(0);
  });

  it('converts 11111111 to 255', () => {
    expect(binaryToDecimal('11111111')).toBe(255);
  });
});

describe('decimalToBinary', () => {
  it('converts 10 to 1010', () => {
    expect(decimalToBinary(10)).toBe('1010');
  });

  it('converts 0 to 0', () => {
    expect(decimalToBinary(0)).toBe('0');
  });

  it('converts 255 to 11111111', () => {
    expect(decimalToBinary(255)).toBe('11111111');
  });
});

// ==================== hexToDecimal / decimalToHex ====================

describe('hexToDecimal', () => {
  it('converts FF to 255', () => {
    expect(hexToDecimal('FF')).toBe(255);
  });

  it('converts 0 to 0', () => {
    expect(hexToDecimal('0')).toBe(0);
  });

  it('converts 1A to 26', () => {
    expect(hexToDecimal('1A')).toBe(26);
  });
});

describe('decimalToHex', () => {
  it('converts 255 to FF', () => {
    expect(decimalToHex(255)).toBe('FF');
  });

  it('converts 0 to 0', () => {
    expect(decimalToHex(0)).toBe('0');
  });

  it('converts 26 to 1A', () => {
    expect(decimalToHex(26)).toBe('1A');
  });
});

// ==================== octalToDecimal / decimalToOctal ====================

describe('octalToDecimal', () => {
  it('converts 17 to 15', () => {
    expect(octalToDecimal('17')).toBe(15);
  });

  it('converts 0 to 0', () => {
    expect(octalToDecimal('0')).toBe(0);
  });

  it('converts 377 to 255', () => {
    expect(octalToDecimal('377')).toBe(255);
  });
});

describe('decimalToOctal', () => {
  it('converts 15 to 17', () => {
    expect(decimalToOctal(15)).toBe('17');
  });

  it('converts 0 to 0', () => {
    expect(decimalToOctal(0)).toBe('0');
  });

  it('converts 255 to 377', () => {
    expect(decimalToOctal(255)).toBe('377');
  });
});

// ==================== binaryToHex / hexToBinary ====================

describe('binaryToHex', () => {
  it('converts 1010 to A', () => {
    expect(binaryToHex('1010')).toBe('A');
  });

  it('converts 11111111 to FF', () => {
    expect(binaryToHex('11111111')).toBe('FF');
  });

  it('converts 0 to 0', () => {
    expect(binaryToHex('0')).toBe('0');
  });
});

describe('hexToBinary', () => {
  it('converts FF to 11111111 (padded to multiple of 4)', () => {
    expect(hexToBinary('FF')).toBe('11111111');
  });

  it('converts A to 1010', () => {
    expect(hexToBinary('A')).toBe('1010');
  });

  it('converts 1 to 0001 (padded)', () => {
    expect(hexToBinary('1')).toBe('0001');
  });
});

// ==================== binaryToOctal / octalToBinary ====================

describe('binaryToOctal', () => {
  it('converts 1010 to 12', () => {
    expect(binaryToOctal('1010')).toBe('12');
  });

  it('converts 11111111 to 377', () => {
    expect(binaryToOctal('11111111')).toBe('377');
  });
});

describe('octalToBinary', () => {
  it('converts 12 to 001010 (padded to multiple of 3)', () => {
    expect(octalToBinary('12')).toBe('001010');
  });

  it('converts 377 to 011111111 (padded to multiple of 3)', () => {
    expect(octalToBinary('377')).toBe('011111111');
  });

  it('converts 7 to 111', () => {
    expect(octalToBinary('7')).toBe('111');
  });
});

// ==================== textToAscii / asciiToText ====================

describe('textToAscii', () => {
  it('converts ABC to [65,66,67]', () => {
    expect(textToAscii('ABC')).toEqual([65, 66, 67]);
  });

  it('converts empty string to empty array', () => {
    expect(textToAscii('')).toEqual([]);
  });

  it('converts space to [32]', () => {
    expect(textToAscii(' ')).toEqual([32]);
  });
});

describe('asciiToText', () => {
  it('converts [65,66,67] to ABC', () => {
    expect(asciiToText([65, 66, 67])).toBe('ABC');
  });

  it('converts empty array to empty string', () => {
    expect(asciiToText([])).toBe('');
  });

  it('converts [72,101,108,108,111] to Hello', () => {
    expect(asciiToText([72, 101, 108, 108, 111])).toBe('Hello');
  });
});

// ==================== textToBinary / binaryToText ====================

describe('textToBinary / binaryToText round trip', () => {
  it('round trips Hello', () => {
    const binary = textToBinary('Hello');
    expect(binaryToText(binary)).toBe('Hello');
  });

  it('converts A to 01000001', () => {
    expect(textToBinary('A')).toBe('01000001');
  });

  it('converts space-separated binary back to text', () => {
    expect(binaryToText('01001000 01101001')).toBe('Hi');
  });
});

// ==================== textToHex / hexToText ====================

describe('textToHex / hexToText round trip', () => {
  it('round trips Hello', () => {
    const hex = textToHex('Hello');
    expect(hexToText(hex)).toBe('Hello');
  });

  it('converts A to 41', () => {
    expect(textToHex('A')).toBe('41');
  });

  it('converts space-separated hex back to text', () => {
    expect(hexToText('48 69')).toBe('Hi');
  });
});

// ==================== textToOctal / octalToText ====================

describe('textToOctal / octalToText round trip', () => {
  it('round trips Hello', () => {
    const octal = textToOctal('Hello');
    expect(octalToText(octal)).toBe('Hello');
  });

  it('converts A to 101 (padded to 3 digits)', () => {
    expect(textToOctal('A')).toBe('101');
  });

  it('converts space-separated octal back to text', () => {
    expect(octalToText('110 151')).toBe('Hi');
  });
});

// ==================== decimalToRoman ====================

describe('decimalToRoman', () => {
  it('converts 1 to I', () => {
    expect(decimalToRoman(1)).toBe('I');
  });

  it('converts 4 to IV', () => {
    expect(decimalToRoman(4)).toBe('IV');
  });

  it('converts 9 to IX', () => {
    expect(decimalToRoman(9)).toBe('IX');
  });

  it('converts 14 to XIV', () => {
    expect(decimalToRoman(14)).toBe('XIV');
  });

  it('converts 1994 to MCMXCIV', () => {
    expect(decimalToRoman(1994)).toBe('MCMXCIV');
  });

  it('converts 3999 to MMMCMXCIX', () => {
    expect(decimalToRoman(3999)).toBe('MMMCMXCIX');
  });

  it('throws for 0', () => {
    expect(() => decimalToRoman(0)).toThrow('Number must be between 1 and 3999');
  });

  it('throws for 4000', () => {
    expect(() => decimalToRoman(4000)).toThrow('Number must be between 1 and 3999');
  });

  it('throws for negative number', () => {
    expect(() => decimalToRoman(-1)).toThrow('Number must be between 1 and 3999');
  });
});

// ==================== romanToDecimal ====================

describe('romanToDecimal', () => {
  it('converts XIV to 14', () => {
    expect(romanToDecimal('XIV')).toBe(14);
  });

  it('converts MCMXCIV to 1994', () => {
    expect(romanToDecimal('MCMXCIV')).toBe(1994);
  });

  it('is case insensitive (xiv → 14)', () => {
    expect(romanToDecimal('xiv')).toBe(14);
  });

  it('converts mixed case mcmxciv to 1994', () => {
    expect(romanToDecimal('mcmxciv')).toBe(1994);
  });

  it('converts I to 1', () => {
    expect(romanToDecimal('I')).toBe(1);
  });

  it('throws for invalid character', () => {
    expect(() => romanToDecimal('XYZ')).toThrow('Invalid Roman numeral character');
  });

  it('throws for digit in roman string', () => {
    expect(() => romanToDecimal('X2V')).toThrow('Invalid Roman numeral character');
  });
});

// ==================== toScientificNotation / fromScientificNotation ====================

describe('toScientificNotation', () => {
  it('converts 12345 with precision 2 to 1.23e+4', () => {
    expect(toScientificNotation(12345, 2)).toBe('1.23e+4');
  });

  it('converts 0 with default precision', () => {
    expect(toScientificNotation(0)).toBe('0.000000e+0');
  });

  it('converts 1 with precision 0', () => {
    expect(toScientificNotation(1, 0)).toBe('1e+0');
  });

  it('converts negative number', () => {
    expect(toScientificNotation(-5000, 1)).toBe('-5.0e+3');
  });
});

describe('fromScientificNotation', () => {
  it('parses 1.23e4 to 12300', () => {
    expect(fromScientificNotation('1.23e4')).toBe(12300);
  });

  it('parses 1.23e+4 to 12300', () => {
    expect(fromScientificNotation('1.23e+4')).toBe(12300);
  });

  it('parses 5e-3 to 0.005', () => {
    expect(fromScientificNotation('5e-3')).toBe(0.005);
  });

  it('parses 0e+0 to 0', () => {
    expect(fromScientificNotation('0e+0')).toBe(0);
  });
});

// ==================== decimalToFraction ====================

describe('decimalToFraction', () => {
  it('converts 0.5 to 1/2', () => {
    const f = decimalToFraction(0.5);
    expect(f.numerator).toBe(1);
    expect(f.denominator).toBe(2);
  });

  it('converts 0.333... ≈ 1/3', () => {
    const f = decimalToFraction(1 / 3);
    expect(f.numerator).toBe(1);
    expect(f.denominator).toBe(3);
  });

  it('converts 0.25 to 1/4', () => {
    const f = decimalToFraction(0.25);
    expect(f.numerator).toBe(1);
    expect(f.denominator).toBe(4);
  });

  it('converts 2.5 with whole part', () => {
    const f = decimalToFraction(2.5);
    expect(f.whole).toBe(2);
    expect(f.numerator).toBe(1);
    expect(f.denominator).toBe(2);
  });

  it('converts integer 5 to 5/1', () => {
    const f = decimalToFraction(5);
    expect(f.numerator).toBe(5);
    expect(f.denominator).toBe(1);
  });

  it('converts 0.75 to 3/4', () => {
    const f = decimalToFraction(0.75);
    expect(f.numerator).toBe(3);
    expect(f.denominator).toBe(4);
  });
});

// ==================== fractionToDecimal ====================

describe('fractionToDecimal', () => {
  it('converts 1/2 to 0.5', () => {
    expect(fractionToDecimal({ numerator: 1, denominator: 2 })).toBe(0.5);
  });

  it('converts 3/4 to 0.75', () => {
    expect(fractionToDecimal({ numerator: 3, denominator: 4 })).toBe(0.75);
  });

  it('converts whole + fraction (whole:2, 1/2) to 2.5', () => {
    expect(fractionToDecimal({ whole: 2, numerator: 1, denominator: 2 })).toBe(2.5);
  });

  it('converts 1/3 to ~0.333', () => {
    expect(fractionToDecimal({ numerator: 1, denominator: 3 })).toBeCloseTo(0.333, 2);
  });
});

// ==================== simplifyFraction ====================

describe('simplifyFraction', () => {
  it('simplifies 4/8 to 1/2', () => {
    const f = simplifyFraction(4, 8);
    expect(f.numerator).toBe(1);
    expect(f.denominator).toBe(2);
  });

  it('simplifies 6/9 to 2/3', () => {
    const f = simplifyFraction(6, 9);
    expect(f.numerator).toBe(2);
    expect(f.denominator).toBe(3);
  });

  it('keeps 1/7 as is', () => {
    const f = simplifyFraction(1, 7);
    expect(f.numerator).toBe(1);
    expect(f.denominator).toBe(7);
  });

  it('simplifies 100/200 to 1/2', () => {
    const f = simplifyFraction(100, 200);
    expect(f.numerator).toBe(1);
    expect(f.denominator).toBe(2);
  });
});

// ==================== convertNumber ====================

describe('convertNumber', () => {
  it('converts 255 and returns all fields', () => {
    const r = convertNumber(255);
    expect(r.decimal).toBe(255);
    expect(r.binary).toBe('11111111');
    expect(r.octal).toBe('377');
    expect(r.hexadecimal).toBe('FF');
    expect(r.roman).toBe('CCLV');
    expect(r.scientific).toBe('2.55e+2');
  });

  it('converts string value with fromBase', () => {
    const r = convertNumber('FF', 16);
    expect(r.decimal).toBe(255);
    expect(r.binary).toBe('11111111');
  });

  it('includes roman for value in range 1–3999', () => {
    const r = convertNumber(1);
    expect(r.roman).toBe('I');
  });

  it('omits roman for value 0', () => {
    const r = convertNumber(0);
    expect(r.roman).toBeUndefined();
  });

  it('omits roman for value > 3999', () => {
    const r = convertNumber(4000);
    expect(r.roman).toBeUndefined();
  });

  it('throws for invalid number', () => {
    expect(() => convertNumber('not_a_number')).toThrow('Invalid number');
  });

  it('handles large number 65535', () => {
    const r = convertNumber(65535);
    expect(r.hexadecimal).toBe('FFFF');
    expect(r.binary).toBe('1111111111111111');
  });
});

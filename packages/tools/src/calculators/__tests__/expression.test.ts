import { describe, it, expect } from 'vitest';
import { scientific, evaluateExpression, evaluateSimpleExpression } from '../expression';

// ==================== SCIENTIFIC CALCULATOR ====================

describe('scientific', () => {
  // ---------- factorial ----------
  describe('factorial', () => {
    it('factorial(0) → 1', () => {
      expect(scientific.factorial(0)).toBe(1);
    });
    it('factorial(1) → 1', () => {
      expect(scientific.factorial(1)).toBe(1);
    });
    it('factorial(5) → 120', () => {
      expect(scientific.factorial(5)).toBe(120);
    });
    it('factorial(10) → 3628800', () => {
      expect(scientific.factorial(10)).toBe(3628800);
    });
    it('factorial(negative) throws', () => {
      expect(() => scientific.factorial(-1)).toThrow('Factorial of negative number');
    });
    it('factorial(float) throws', () => {
      expect(() => scientific.factorial(2.5)).toThrow('Factorial requires integer');
    });
  });

  // ---------- power ----------
  describe('power', () => {
    it('power(2,3) → 8', () => {
      expect(scientific.power(2, 3)).toBe(8);
    });
    it('power(2,0) → 1', () => {
      expect(scientific.power(2, 0)).toBe(1);
    });
    it('power(5,2) → 25', () => {
      expect(scientific.power(5, 2)).toBe(25);
    });
  });

  // ---------- sqrt ----------
  describe('sqrt', () => {
    it('sqrt(9) → 3', () => {
      expect(scientific.sqrt(9)).toBe(3);
    });
    it('sqrt(0) → 0', () => {
      expect(scientific.sqrt(0)).toBe(0);
    });
    it('sqrt(negative) throws', () => {
      expect(() => scientific.sqrt(-4)).toThrow('Cannot compute square root of negative number');
    });
  });

  // ---------- cbrt ----------
  describe('cbrt', () => {
    it('cbrt(27) → 3', () => {
      expect(scientific.cbrt(27)).toBe(3);
    });
    it('cbrt(-8) → -2', () => {
      expect(scientific.cbrt(-8)).toBe(-2);
    });
    it('cbrt(0) → 0', () => {
      expect(scientific.cbrt(0)).toBe(0);
    });
  });

  // ---------- log10 ----------
  describe('log10', () => {
    it('log10(100) → 2', () => {
      expect(scientific.log10(100)).toBe(2);
    });
    it('log10(1000) → 3', () => {
      expect(scientific.log10(1000)).toBe(3);
    });
    it('log10(0) throws', () => {
      expect(() => scientific.log10(0)).toThrow('Logarithm undefined for non-positive numbers');
    });
    it('log10(-1) throws', () => {
      expect(() => scientific.log10(-1)).toThrow('Logarithm undefined for non-positive numbers');
    });
  });

  // ---------- ln ----------
  describe('ln', () => {
    it('ln(Math.E) → 1', () => {
      expect(scientific.ln(Math.E)).toBeCloseTo(1);
    });
    it('ln(1) → 0', () => {
      expect(scientific.ln(1)).toBe(0);
    });
    it('ln(0) throws', () => {
      expect(() => scientific.ln(0)).toThrow('Natural log undefined for non-positive numbers');
    });
    it('ln(-1) throws', () => {
      expect(() => scientific.ln(-1)).toThrow('Natural log undefined for non-positive numbers');
    });
  });

  // ---------- log2 ----------
  describe('log2', () => {
    it('log2(8) → 3', () => {
      expect(scientific.log2(8)).toBe(3);
    });
    it('log2(1) → 0', () => {
      expect(scientific.log2(1)).toBe(0);
    });
    it('log2(0) throws', () => {
      expect(() => scientific.log2(0)).toThrow('Log base 2 undefined for non-positive numbers');
    });
  });

  // ---------- exp ----------
  describe('exp', () => {
    it('exp(0) → 1', () => {
      expect(scientific.exp(0)).toBe(1);
    });
    it('exp(1) ≈ Math.E', () => {
      expect(scientific.exp(1)).toBeCloseTo(Math.E);
    });
  });

  // ---------- sin ----------
  describe('sin', () => {
    it('sin(0) → 0', () => {
      expect(scientific.sin(0)).toBeCloseTo(0);
    });
    it('sin(90) → 1', () => {
      expect(scientific.sin(90)).toBeCloseTo(1);
    });
    it('sin(30) ≈ 0.5', () => {
      expect(scientific.sin(30)).toBeCloseTo(0.5);
    });
    it('sin(180) ≈ 0', () => {
      expect(scientific.sin(180)).toBeCloseTo(0);
    });
  });

  // ---------- cos ----------
  describe('cos', () => {
    it('cos(0) → 1', () => {
      expect(scientific.cos(0)).toBeCloseTo(1);
    });
    it('cos(90) ≈ 0', () => {
      expect(scientific.cos(90)).toBeCloseTo(0);
    });
    it('cos(60) ≈ 0.5', () => {
      expect(scientific.cos(60)).toBeCloseTo(0.5);
    });
    it('cos(180) ≈ -1', () => {
      expect(scientific.cos(180)).toBeCloseTo(-1);
    });
  });

  // ---------- tan ----------
  describe('tan', () => {
    it('tan(0) → 0', () => {
      expect(scientific.tan(0)).toBeCloseTo(0);
    });
    it('tan(45) ≈ 1', () => {
      expect(scientific.tan(45)).toBeCloseTo(1);
    });
  });

  // ---------- asin ----------
  describe('asin', () => {
    it('asin(0) → 0', () => {
      expect(scientific.asin(0)).toBeCloseTo(0);
    });
    it('asin(1) → 90', () => {
      expect(scientific.asin(1)).toBeCloseTo(90);
    });
    it('asin(0.5) → 30', () => {
      expect(scientific.asin(0.5)).toBeCloseTo(30);
    });
    it('asin(2) throws', () => {
      expect(() => scientific.asin(2)).toThrow('asin domain error');
    });
    it('asin(-2) throws', () => {
      expect(() => scientific.asin(-2)).toThrow('asin domain error');
    });
  });

  // ---------- acos ----------
  describe('acos', () => {
    it('acos(1) → 0', () => {
      expect(scientific.acos(1)).toBeCloseTo(0);
    });
    it('acos(0) → 90', () => {
      expect(scientific.acos(0)).toBeCloseTo(90);
    });
    it('acos(0.5) → 60', () => {
      expect(scientific.acos(0.5)).toBeCloseTo(60);
    });
    it('acos(2) throws', () => {
      expect(() => scientific.acos(2)).toThrow('acos domain error');
    });
  });

  // ---------- atan ----------
  describe('atan', () => {
    it('atan(0) → 0', () => {
      expect(scientific.atan(0)).toBeCloseTo(0);
    });
    it('atan(1) → 45', () => {
      expect(scientific.atan(1)).toBeCloseTo(45);
    });
  });

  // ---------- atan2 ----------
  describe('atan2', () => {
    it('atan2(1,1) → 45', () => {
      expect(scientific.atan2(1, 1)).toBeCloseTo(45);
    });
    it('atan2(0,1) → 0', () => {
      expect(scientific.atan2(0, 1)).toBeCloseTo(0);
    });
    it('atan2(1,0) → 90', () => {
      expect(scientific.atan2(1, 0)).toBeCloseTo(90);
    });
  });

  // ---------- hyperbolic ----------
  describe('sinh', () => {
    it('sinh(0) → 0', () => {
      expect(scientific.sinh(0)).toBe(0);
    });
    it('sinh(1) ≈ 1.1752', () => {
      expect(scientific.sinh(1)).toBeCloseTo(1.1752, 3);
    });
  });

  describe('cosh', () => {
    it('cosh(0) → 1', () => {
      expect(scientific.cosh(0)).toBe(1);
    });
    it('cosh(1) ≈ 1.5431', () => {
      expect(scientific.cosh(1)).toBeCloseTo(1.5431, 3);
    });
  });

  describe('tanh', () => {
    it('tanh(0) → 0', () => {
      expect(scientific.tanh(0)).toBe(0);
    });
    it('tanh(1) ≈ 0.7616', () => {
      expect(scientific.tanh(1)).toBeCloseTo(0.7616, 3);
    });
  });

  describe('asinh', () => {
    it('asinh(0) → 0', () => {
      expect(scientific.asinh(0)).toBe(0);
    });
    it('asinh(1) ≈ 0.8814', () => {
      expect(scientific.asinh(1)).toBeCloseTo(0.8814, 3);
    });
  });

  describe('acosh', () => {
    it('acosh(1) → 0', () => {
      expect(scientific.acosh(1)).toBe(0);
    });
    it('acosh(2) ≈ 1.3170', () => {
      expect(scientific.acosh(2)).toBeCloseTo(1.317, 3);
    });
    it('acosh(0.5) throws', () => {
      expect(() => scientific.acosh(0.5)).toThrow('acosh domain error');
    });
  });

  describe('atanh', () => {
    it('atanh(0) → 0', () => {
      expect(scientific.atanh(0)).toBe(0);
    });
    it('atanh(0.5) ≈ 0.5493', () => {
      expect(scientific.atanh(0.5)).toBeCloseTo(0.5493, 3);
    });
    it('atanh(1) throws', () => {
      expect(() => scientific.atanh(1)).toThrow('atanh domain error');
    });
    it('atanh(-1) throws', () => {
      expect(() => scientific.atanh(-1)).toThrow('atanh domain error');
    });
  });

  // ---------- rounding / misc ----------
  describe('abs', () => {
    it('abs(-5) → 5', () => {
      expect(scientific.abs(-5)).toBe(5);
    });
    it('abs(5) → 5', () => {
      expect(scientific.abs(5)).toBe(5);
    });
  });

  describe('ceil', () => {
    it('ceil(1.1) → 2', () => {
      expect(scientific.ceil(1.1)).toBe(2);
    });
    it('ceil(-1.1) → -1', () => {
      expect(scientific.ceil(-1.1)).toBe(-1);
    });
  });

  describe('floor', () => {
    it('floor(1.9) → 1', () => {
      expect(scientific.floor(1.9)).toBe(1);
    });
    it('floor(-1.1) → -2', () => {
      expect(scientific.floor(-1.1)).toBe(-2);
    });
  });

  describe('round', () => {
    it('round(1.5) → 2', () => {
      expect(scientific.round(1.5)).toBe(2);
    });
    it('round(1.4) → 1', () => {
      expect(scientific.round(1.4)).toBe(1);
    });
  });

  describe('sign', () => {
    it('sign(-3) → -1', () => {
      expect(scientific.sign(-3)).toBe(-1);
    });
    it('sign(0) → 0', () => {
      expect(scientific.sign(0)).toBe(0);
    });
    it('sign(7) → 1', () => {
      expect(scientific.sign(7)).toBe(1);
    });
  });

  // ---------- constants ----------
  describe('constants', () => {
    it('PI ≈ 3.14159', () => {
      expect(scientific.PI).toBeCloseTo(3.14159, 4);
    });
    it('E ≈ 2.71828', () => {
      expect(scientific.E).toBeCloseTo(2.71828, 4);
    });
  });
});

// ==================== evaluateExpression ====================

describe('evaluateExpression', () => {
  // ---------- basic arithmetic ----------
  describe('basic arithmetic', () => {
    it("'2+3' → 5", () => {
      expect(evaluateExpression('2+3')).toBe(5);
    });
    it("'10-4' → 6", () => {
      expect(evaluateExpression('10-4')).toBe(6);
    });
    it("'3*4' → 12", () => {
      expect(evaluateExpression('3*4')).toBe(12);
    });
    it("'10/2' → 5", () => {
      expect(evaluateExpression('10/2')).toBe(5);
    });
  });

  // ---------- precedence ----------
  describe('operator precedence', () => {
    it("'2+3*4' → 14", () => {
      expect(evaluateExpression('2+3*4')).toBe(14);
    });
    it("'(2+3)*4' → 20", () => {
      expect(evaluateExpression('(2+3)*4')).toBe(20);
    });
    it("'2*(3+4)' → 14", () => {
      expect(evaluateExpression('2*(3+4)')).toBe(14);
    });
  });

  // ---------- power ----------
  describe('power operator', () => {
    it("'2^3' → 8", () => {
      expect(evaluateExpression('2^3')).toBe(8);
    });
    it("'2^10' → 1024", () => {
      expect(evaluateExpression('2^10')).toBe(1024);
    });
    it("'3^0' → 1", () => {
      expect(evaluateExpression('3^0')).toBe(1);
    });
  });

  // ---------- modulo ----------
  describe('modulo', () => {
    it("'10%3' → 1", () => {
      expect(evaluateExpression('10%3')).toBe(1);
    });
    it("'7%2' → 1", () => {
      expect(evaluateExpression('7%2')).toBe(1);
    });
  });

  // ---------- unary minus ----------
  describe('unary minus', () => {
    it("'-5' → -5", () => {
      expect(evaluateExpression('-5')).toBe(-5);
    });
    it("'(-3)*2' → -6", () => {
      expect(evaluateExpression('(-3)*2')).toBe(-6);
    });
    it("'-2+5' → 3", () => {
      expect(evaluateExpression('-2+5')).toBe(3);
    });
  });

  // ---------- functions ----------
  describe('functions', () => {
    it("'sqrt(16)' → 4", () => {
      expect(evaluateExpression('sqrt(16)')).toBe(4);
    });
    it("'sin(90)' → 1", () => {
      expect(evaluateExpression('sin(90)')).toBeCloseTo(1);
    });
    it("'cos(0)' → 1", () => {
      expect(evaluateExpression('cos(0)')).toBeCloseTo(1);
    });
    it("'abs(-42)' → 42", () => {
      expect(evaluateExpression('abs(-42)')).toBe(42);
    });
    it("'pow(2,8)' → 256", () => {
      expect(evaluateExpression('pow(2,8)')).toBe(256);
    });
    it("'ceil(2.3)' → 3", () => {
      expect(evaluateExpression('ceil(2.3)')).toBe(3);
    });
    it("'floor(2.9)' → 2", () => {
      expect(evaluateExpression('floor(2.9)')).toBe(2);
    });
  });

  // ---------- constants ----------
  describe('constants', () => {
    it("'pi' ≈ 3.14159", () => {
      expect(evaluateExpression('pi')).toBeCloseTo(3.14159, 4);
    });
    it("'e' ≈ 2.71828", () => {
      expect(evaluateExpression('e')).toBeCloseTo(2.71828, 4);
    });
    it("'phi' ≈ 1.618", () => {
      expect(evaluateExpression('phi')).toBeCloseTo(1.618, 3);
    });
  });

  // ---------- nested / complex ----------
  describe('nested and complex expressions', () => {
    it("'sqrt(pow(3,2)+pow(4,2))' → 5", () => {
      expect(evaluateExpression('sqrt(pow(3,2)+pow(4,2))')).toBeCloseTo(5);
    });
    it("'2*pi' ≈ 6.28318", () => {
      expect(evaluateExpression('2*pi')).toBeCloseTo(2 * Math.PI, 4);
    });
    it("'exp(0)+1' → 2", () => {
      expect(evaluateExpression('exp(0)+1')).toBe(2);
    });
    it("'max(3,7)' → 7", () => {
      expect(evaluateExpression('max(3,7)')).toBe(7);
    });
    it("'min(3,7)' → 3", () => {
      expect(evaluateExpression('min(3,7)')).toBe(3);
    });
  });

  // ---------- error cases ----------
  describe('error cases', () => {
    it('division by zero throws', () => {
      expect(() => evaluateExpression('1/0')).toThrow();
    });
    it('invalid expression throws', () => {
      expect(() => evaluateExpression('2++3')).toThrow();
    });
    it('empty string throws', () => {
      expect(() => evaluateExpression('')).toThrow('Empty expression');
    });
    it('whitespace-only throws', () => {
      expect(() => evaluateExpression('   ')).toThrow('Empty expression');
    });
    it('mismatched opening paren throws', () => {
      expect(() => evaluateExpression('(2+3')).toThrow();
    });
    it('mismatched closing paren throws', () => {
      expect(() => evaluateExpression('2+3)')).toThrow();
    });
    it('unknown identifier throws', () => {
      expect(() => evaluateExpression('foo(1)')).toThrow();
    });
  });
});

// ==================== evaluateSimpleExpression ====================

describe('evaluateSimpleExpression', () => {
  describe('valid expressions', () => {
    it("'2+3' → 5", () => {
      expect(evaluateSimpleExpression('2+3')).toBe(5);
    });
    it("'(10+5)/3' → 5", () => {
      expect(evaluateSimpleExpression('(10+5)/3')).toBe(5);
    });
    it("'10-4' → 6", () => {
      expect(evaluateSimpleExpression('10-4')).toBe(6);
    });
    it("'3*4' → 12", () => {
      expect(evaluateSimpleExpression('3*4')).toBe(12);
    });
    it("'2.5+1.5' → 4", () => {
      expect(evaluateSimpleExpression('2.5+1.5')).toBe(4);
    });
    it("'(2+3)*(4-1)' → 15", () => {
      expect(evaluateSimpleExpression('(2+3)*(4-1)')).toBe(15);
    });
  });

  describe('error cases', () => {
    it('invalid chars throws (letters)', () => {
      expect(() => evaluateSimpleExpression('2+abc')).toThrow('Invalid expression');
    });
    it('invalid chars throws (special)', () => {
      expect(() => evaluateSimpleExpression('2+3; alert(1)')).toThrow('Invalid expression');
    });
    it('invalid expression throws', () => {
      expect(() => evaluateSimpleExpression('+')).toThrow();
    });
    it('empty string throws', () => {
      expect(() => evaluateSimpleExpression('')).toThrow();
    });
  });
});

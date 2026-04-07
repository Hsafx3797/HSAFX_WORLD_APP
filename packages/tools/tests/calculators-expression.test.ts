/**
 * Tests for calculators/expression.ts
 * scientific object (30+ methods), evaluateExpression, evaluateSimpleExpression
 */
import { describe, it, expect } from 'vitest';

import {
  scientific,
  evaluateExpression,
  evaluateSimpleExpression,
} from '../src/calculators/expression';

// =====================================================================
// SCIENTIFIC CALCULATOR OBJECT
// =====================================================================
describe('scientific.factorial', () => {
  it('returns 1 for 0', () => expect(scientific.factorial(0)).toBe(1));
  it('returns 1 for 1', () => expect(scientific.factorial(1)).toBe(1));
  it('returns 120 for 5', () => expect(scientific.factorial(5)).toBe(120));
  it('returns 3628800 for 10', () => expect(scientific.factorial(10)).toBe(3628800));
  it('throws for negative', () => expect(() => scientific.factorial(-1)).toThrow('negative'));
  it('throws for non-integer', () => expect(() => scientific.factorial(1.5)).toThrow('integer'));
});

describe('scientific.power', () => {
  it('computes 2^3 = 8', () => expect(scientific.power(2, 3)).toBe(8));
  it('computes 5^0 = 1', () => expect(scientific.power(5, 0)).toBe(1));
});

describe('scientific.sqrt', () => {
  it('computes sqrt(9) = 3', () => expect(scientific.sqrt(9)).toBe(3));
  it('computes sqrt(0) = 0', () => expect(scientific.sqrt(0)).toBe(0));
  it('throws for negative', () => expect(() => scientific.sqrt(-1)).toThrow());
});

describe('scientific.cbrt', () => {
  it('computes cbrt(27) = 3', () => expect(scientific.cbrt(27)).toBe(3));
  it('computes cbrt(-8) = -2', () => expect(scientific.cbrt(-8)).toBe(-2));
});

describe('scientific.log10', () => {
  it('computes log10(100) = 2', () => expect(scientific.log10(100)).toBe(2));
  it('throws for 0', () => expect(() => scientific.log10(0)).toThrow());
  it('throws for negative', () => expect(() => scientific.log10(-5)).toThrow());
});

describe('scientific.ln', () => {
  it('computes ln(1) = 0', () => expect(scientific.ln(1)).toBe(0));
  it('computes ln(e) ≈ 1', () => expect(scientific.ln(Math.E)).toBeCloseTo(1));
  it('throws for 0', () => expect(() => scientific.ln(0)).toThrow());
});

describe('scientific.log2', () => {
  it('computes log2(8) = 3', () => expect(scientific.log2(8)).toBe(3));
  it('throws for 0', () => expect(() => scientific.log2(0)).toThrow());
});

describe('scientific.exp', () => {
  it('computes exp(0) = 1', () => expect(scientific.exp(0)).toBe(1));
  it('computes exp(1) ≈ e', () => expect(scientific.exp(1)).toBeCloseTo(Math.E));
});

describe('scientific trigonometry (degrees)', () => {
  it('sin(0) = 0', () => expect(scientific.sin(0)).toBeCloseTo(0));
  it('sin(90) = 1', () => expect(scientific.sin(90)).toBeCloseTo(1));
  it('cos(0) = 1', () => expect(scientific.cos(0)).toBeCloseTo(1));
  it('cos(180) = -1', () => expect(scientific.cos(180)).toBeCloseTo(-1));
  it('tan(45) ≈ 1', () => expect(scientific.tan(45)).toBeCloseTo(1));
});

describe('scientific inverse trig (returns degrees)', () => {
  it('asin(1) = 90', () => expect(scientific.asin(1)).toBeCloseTo(90));
  it('acos(0) = 90', () => expect(scientific.acos(0)).toBeCloseTo(90));
  it('atan(1) = 45', () => expect(scientific.atan(1)).toBeCloseTo(45));
  it('atan2(1,1) = 45', () => expect(scientific.atan2(1, 1)).toBeCloseTo(45));
  it('asin throws for out of range', () => expect(() => scientific.asin(2)).toThrow());
  it('acos throws for out of range', () => expect(() => scientific.acos(2)).toThrow());
});

describe('scientific hyperbolic', () => {
  it('sinh(0) = 0', () => expect(scientific.sinh(0)).toBeCloseTo(0));
  it('cosh(0) = 1', () => expect(scientific.cosh(0)).toBeCloseTo(1));
  it('tanh(0) = 0', () => expect(scientific.tanh(0)).toBeCloseTo(0));
  it('asinh(0) = 0', () => expect(scientific.asinh(0)).toBeCloseTo(0));
  it('acosh(1) = 0', () => expect(scientific.acosh(1)).toBeCloseTo(0));
  it('acosh throws for < 1', () => expect(() => scientific.acosh(0.5)).toThrow());
  it('atanh(0) = 0', () => expect(scientific.atanh(0)).toBeCloseTo(0));
  it('atanh throws for >= 1', () => expect(() => scientific.atanh(1)).toThrow());
  it('atanh throws for <= -1', () => expect(() => scientific.atanh(-1)).toThrow());
});

describe('scientific utility methods', () => {
  it('abs(-5) = 5', () => expect(scientific.abs(-5)).toBe(5));
  it('ceil(1.1) = 2', () => expect(scientific.ceil(1.1)).toBe(2));
  it('floor(1.9) = 1', () => expect(scientific.floor(1.9)).toBe(1));
  it('round(1.5) = 2', () => expect(scientific.round(1.5)).toBe(2));
  it('sign(-10) = -1', () => expect(scientific.sign(-10)).toBe(-1));
  it('sign(0) = 0', () => expect(scientific.sign(0)).toBe(0));
  it('sign(10) = 1', () => expect(scientific.sign(10)).toBe(1));
});

describe('scientific constants', () => {
  it('PI ≈ 3.14159', () => expect(scientific.PI).toBeCloseTo(3.14159, 4));
  it('E ≈ 2.71828', () => expect(scientific.E).toBeCloseTo(2.71828, 4));
});

// =====================================================================
// EXPRESSION EVALUATOR
// =====================================================================
describe('evaluateExpression', () => {
  // Basic arithmetic
  it('evaluates addition: 2+3 = 5', () => expect(evaluateExpression('2+3')).toBe(5));
  it('evaluates subtraction: 10-4 = 6', () => expect(evaluateExpression('10-4')).toBe(6));
  it('evaluates multiplication: 3*4 = 12', () => expect(evaluateExpression('3*4')).toBe(12));
  it('evaluates division: 15/3 = 5', () => expect(evaluateExpression('15/3')).toBe(5));
  it('evaluates modulo: 10%3 = 1', () => expect(evaluateExpression('10%3')).toBe(1));
  it('evaluates power: 2^10 = 1024', () => expect(evaluateExpression('2^10')).toBe(1024));

  // Operator precedence
  it('respects precedence: 2+3*4 = 14', () => expect(evaluateExpression('2+3*4')).toBe(14));
  it('respects parentheses: (2+3)*4 = 20', () => expect(evaluateExpression('(2+3)*4')).toBe(20));
  it('nested parentheses: ((2+3)*4)-5 = 15', () => expect(evaluateExpression('((2+3)*4)-5')).toBe(15));

  // Unary minus
  it('handles unary minus: -5+3 = -2', () => expect(evaluateExpression('-5+3')).toBe(-2));

  // Floating point
  it('handles decimals: 1.5+2.5 = 4', () => expect(evaluateExpression('1.5+2.5')).toBe(4));

  // Functions
  it('evaluates sqrt(16) = 4', () => expect(evaluateExpression('sqrt(16)')).toBe(4));
  it('evaluates abs(-7) = 7', () => expect(evaluateExpression('abs(-7)')).toBe(7));
  it('evaluates pow(2,8) = 256', () => expect(evaluateExpression('pow(2,8)')).toBe(256));
  it('evaluates sin(90) = 1', () => expect(evaluateExpression('sin(90)')).toBeCloseTo(1));
  it('evaluates cos(0) = 1', () => expect(evaluateExpression('cos(0)')).toBeCloseTo(1));
  it('evaluates log10(1000) = 3', () => expect(evaluateExpression('log10(1000)')).toBeCloseTo(3));
  it('evaluates ceil(1.2) = 2', () => expect(evaluateExpression('ceil(1.2)')).toBe(2));
  it('evaluates floor(1.8) = 1', () => expect(evaluateExpression('floor(1.8)')).toBe(1));
  it('evaluates min(3,7) = 3', () => expect(evaluateExpression('min(3,7)')).toBe(3));
  it('evaluates max(3,7) = 7', () => expect(evaluateExpression('max(3,7)')).toBe(7));
  it('evaluates factorial(5) = 120', () => expect(evaluateExpression('factorial(5)')).toBe(120));

  // Constants
  it('evaluates pi ≈ 3.14159', () => expect(evaluateExpression('pi')).toBeCloseTo(Math.PI));
  it('evaluates e ≈ 2.71828', () => expect(evaluateExpression('e')).toBeCloseTo(Math.E));
  it('evaluates 2*pi ≈ 6.28318', () => expect(evaluateExpression('2*pi')).toBeCloseTo(2 * Math.PI));

  // Complex expressions
  it('evaluates sqrt(9) + pow(2,3) = 11', () => expect(evaluateExpression('sqrt(9) + pow(2,3)')).toBe(11));

  // Error cases
  it('throws on empty expression', () => expect(() => evaluateExpression('')).toThrow());
  it('throws on division by zero', () => expect(() => evaluateExpression('1/0')).toThrow());
  it('throws on mismatched parentheses', () => expect(() => evaluateExpression('(1+2')).toThrow());
  it('throws on unknown identifier', () => expect(() => evaluateExpression('xyz')).toThrow());
  it('throws on unexpected character', () => expect(() => evaluateExpression('1 @ 2')).toThrow());
});

// =====================================================================
// SIMPLE EXPRESSION EVALUATOR
// =====================================================================
describe('evaluateSimpleExpression', () => {
  it('evaluates basic math: 2+3*4 = 14', () => expect(evaluateSimpleExpression('2+3*4')).toBe(14));
  it('evaluates with parentheses: (2+3)*4 = 20', () => expect(evaluateSimpleExpression('(2+3)*4')).toBe(20));
  it('evaluates decimals: 1.5 + 2.5 = 4', () => expect(evaluateSimpleExpression('1.5+2.5')).toBe(4));
  it('throws on non-math characters', () => expect(() => evaluateSimpleExpression('sin(90)')).toThrow('only basic math'));
});

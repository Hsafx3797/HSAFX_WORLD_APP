import { describe, it, expect } from 'vitest';
import { writeOutput } from './helpers';
import {
  add, subtract, multiply, divide, modulo, power, sqrt, nthRoot,
  calculateStatistics,
  degreesToRadians, radiansToDegrees,
  sin, cos, tan, asin, acos, atan, atan2,
  log, log10, log2, logBase, exp,
  factorial, permutations, combinations,
  gcd, lcm, isPrime, primeFactors,
  fibonacci, fibonacciSequence,
  percentage, percentageOf, percentageChange, percentageDifference,
  round, roundUp, roundDown,
  circleFromRadius, rectangleMetrics, triangleMetrics,
  pythagorean, distance2D,
} from '../src/calculators/math';
import { scientific, evaluateExpression } from '../src/calculators/expression';

// ==================== BASIC OPERATIONS ====================

describe('Basic arithmetic', () => {
  it('add', () => {
    expect(add(1, 2)).toBe(3);
    expect(add(1, 2, 3, 4, 5)).toBe(15);
    expect(add(-5, 5)).toBe(0);
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    expect(add()).toBe(0);
  });

  it('subtract', () => {
    expect(subtract(10, 3)).toBe(7);
    expect(subtract(0, 0)).toBe(0);
    expect(subtract(-5, -3)).toBe(-2);
  });

  it('multiply', () => {
    expect(multiply(3, 4)).toBe(12);
    expect(multiply(2, 3, 4)).toBe(24);
    expect(multiply(-2, 3)).toBe(-6);
    expect(multiply(0, 999)).toBe(0);
    expect(multiply()).toBe(1);
  });

  it('divide', () => {
    expect(divide(10, 2)).toBe(5);
    expect(divide(7, 3)).toBeCloseTo(2.3333);
    expect(divide(-10, 2)).toBe(-5);
  });

  it('divide by zero throws', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('modulo', () => {
    expect(modulo(10, 3)).toBe(1);
    expect(modulo(15, 5)).toBe(0);
    expect(modulo(-10, 3)).toBe(-1);
  });

  it('power', () => {
    expect(power(2, 10)).toBe(1024);
    expect(power(5, 0)).toBe(1);
    expect(power(2, -1)).toBe(0.5);
  });

  it('sqrt', () => {
    expect(sqrt(9)).toBe(3);
    expect(sqrt(0)).toBe(0);
    expect(sqrt(2)).toBeCloseTo(1.4142);
  });

  it('sqrt of negative throws', () => {
    expect(() => sqrt(-1)).toThrow();
  });

  it('nthRoot', () => {
    expect(nthRoot(27, 3)).toBeCloseTo(3);
    expect(nthRoot(16, 4)).toBe(2);
    expect(nthRoot(-27, 3)).toBeCloseTo(-3);
  });

  it('nthRoot even root of negative throws', () => {
    expect(() => nthRoot(-4, 2)).toThrow();
  });

  it('edge: Infinity arithmetic', () => {
    expect(add(Infinity, 1)).toBe(Infinity);
    expect(multiply(Infinity, 0)).toBeNaN();
  });

  it('edge: NaN arithmetic', () => {
    expect(add(NaN, 1)).toBeNaN();
    expect(multiply(NaN, 5)).toBeNaN();
  });

  it('edge: MAX_SAFE_INTEGER', () => {
    const max = Number.MAX_SAFE_INTEGER;
    expect(add(max, 0)).toBe(max);
    expect(subtract(max, max)).toBe(0);
  });
});

// ==================== STATISTICS ====================

describe('calculateStatistics', () => {
  it('basic dataset', () => {
    const r = calculateStatistics([1, 2, 3, 4, 5]);
    writeOutput('calculators', 'statistics-basic.json', JSON.stringify(r, null, 2));
    expect(r.count).toBe(5);
    expect(r.sum).toBe(15);
    expect(r.mean).toBe(3);
    expect(r.median).toBe(3);
    expect(r.min).toBe(1);
    expect(r.max).toBe(5);
    expect(r.range).toBe(4);
    expect(r.variance).toBe(2);
    expect(r.standardDeviation).toBeCloseTo(1.4142);
  });

  it('single element', () => {
    const r = calculateStatistics([42]);
    expect(r.count).toBe(1);
    expect(r.mean).toBe(42);
    expect(r.median).toBe(42);
    expect(r.variance).toBe(0);
  });

  it('even-count array median', () => {
    const r = calculateStatistics([1, 2, 3, 4]);
    expect(r.median).toBe(2.5);
  });

  it('mode detection', () => {
    const r = calculateStatistics([1, 2, 2, 3, 3, 3, 4]);
    expect(r.mode).toContain(3);
  });

  it('negative values', () => {
    const r = calculateStatistics([-5, -3, -1, 0, 1]);
    expect(r.mean).toBeCloseTo(-1.6);
    expect(r.min).toBe(-5);
    expect(r.max).toBe(1);
  });

  it('empty array throws', () => {
    expect(() => calculateStatistics([])).toThrow();
  });

  it('large dataset', () => {
    const data = Array.from({ length: 10000 }, (_, i) => i);
    const r = calculateStatistics(data);
    expect(r.count).toBe(10000);
    expect(r.mean).toBeCloseTo(4999.5);
  });

  it('dataset with duplicates', () => {
    const r = calculateStatistics([1, 1, 1, 1, 1]);
    expect(r.variance).toBe(0);
    expect(r.standardDeviation).toBe(0);
    expect(r.mode).toEqual([1]);
  });

  it('quartiles', () => {
    const r = calculateStatistics([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(r.quartiles.q1).toBeDefined();
    expect(r.quartiles.q3).toBeDefined();
    expect(r.iqr).toBe(r.quartiles.q3 - r.quartiles.q1);
  });
});

// ==================== TRIGONOMETRY ====================

describe('Trigonometry', () => {
  it('degreesToRadians', () => {
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
    expect(degreesToRadians(0)).toBe(0);
  });

  it('radiansToDegrees', () => {
    expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
    expect(radiansToDegrees(0)).toBe(0);
  });

  it('sin in degrees', () => {
    expect(sin(90, true)).toBeCloseTo(1);
    expect(sin(0, true)).toBeCloseTo(0);
    expect(sin(30, true)).toBeCloseTo(0.5);
  });

  it('cos in degrees', () => {
    expect(cos(0, true)).toBeCloseTo(1);
    expect(cos(90, true)).toBeCloseTo(0);
    expect(cos(60, true)).toBeCloseTo(0.5);
  });

  it('tan in degrees', () => {
    expect(tan(45, true)).toBeCloseTo(1);
    expect(tan(0, true)).toBeCloseTo(0);
  });

  it('inverse trig', () => {
    expect(asin(1, true)).toBeCloseTo(90);
    expect(acos(0, true)).toBeCloseTo(90);
    expect(atan(1, true)).toBeCloseTo(45);
  });

  it('atan2', () => {
    expect(atan2(1, 1, true)).toBeCloseTo(45);
    expect(atan2(0, 1, true)).toBeCloseTo(0);
  });
});

// ==================== LOGARITHMS ====================

describe('Logarithms', () => {
  it('natural log', () => {
    expect(log(Math.E)).toBeCloseTo(1);
    expect(log(1)).toBe(0);
  });

  it('log10', () => {
    expect(log10(100)).toBeCloseTo(2);
    expect(log10(1)).toBe(0);
  });

  it('log2', () => {
    expect(log2(8)).toBeCloseTo(3);
    expect(log2(1)).toBe(0);
  });

  it('logBase', () => {
    expect(logBase(8, 2)).toBeCloseTo(3);
    expect(logBase(81, 3)).toBeCloseTo(4);
  });

  it('log of non-positive throws', () => {
    expect(() => log(0)).toThrow();
    expect(() => log(-1)).toThrow();
    expect(() => log10(0)).toThrow();
    expect(() => log2(-5)).toThrow();
  });

  it('logBase invalid args throw', () => {
    expect(() => logBase(10, 1)).toThrow(); // base 1 is invalid
    expect(() => logBase(10, 0)).toThrow();
    expect(() => logBase(0, 2)).toThrow();
  });

  it('exp', () => {
    expect(exp(0)).toBe(1);
    expect(exp(1)).toBeCloseTo(Math.E);
  });
});

// ==================== NUMBER THEORY ====================

describe('Number theory', () => {
  it('factorial', () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(1)).toBe(1);
    expect(factorial(5)).toBe(120);
    expect(factorial(10)).toBe(3628800);
  });

  it('factorial of negative throws', () => {
    expect(() => factorial(-1)).toThrow();
  });

  it('factorial of non-integer throws', () => {
    expect(() => factorial(3.5)).toThrow();
  });

  it('permutations', () => {
    expect(permutations(5, 2)).toBe(20);
    expect(permutations(10, 3)).toBe(720);
    expect(permutations(5, 5)).toBe(120);
    expect(permutations(5, 6)).toBe(0); // r > n
  });

  it('combinations', () => {
    expect(combinations(5, 2)).toBe(10);
    expect(combinations(10, 3)).toBe(120);
    expect(combinations(5, 0)).toBe(1);
    expect(combinations(5, 5)).toBe(1);
    expect(combinations(5, 6)).toBe(0);
  });

  it('gcd', () => {
    expect(gcd(12, 8)).toBe(4);
    expect(gcd(100, 75)).toBe(25);
    expect(gcd(7, 13)).toBe(1);
    expect(gcd(-12, 8)).toBe(4);
  });

  it('lcm', () => {
    expect(lcm(4, 6)).toBe(12);
    expect(lcm(3, 5)).toBe(15);
    expect(lcm(12, 18)).toBe(36);
  });

  it('isPrime', () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(3)).toBe(true);
    expect(isPrime(7)).toBe(true);
    expect(isPrime(97)).toBe(true);
    expect(isPrime(0)).toBe(false);
    expect(isPrime(1)).toBe(false);
    expect(isPrime(4)).toBe(false);
    expect(isPrime(-5)).toBe(false);
  });

  it('primeFactors', () => {
    expect(primeFactors(12)).toEqual([2, 2, 3]);
    expect(primeFactors(100)).toEqual([2, 2, 5, 5]);
    expect(primeFactors(7)).toEqual([7]);
    expect(primeFactors(1)).toEqual([]);
  });

  it('fibonacci', () => {
    expect(fibonacci(0)).toBe(0);
    expect(fibonacci(1)).toBe(1);
    expect(fibonacci(10)).toBe(55);
    expect(fibonacci(20)).toBe(6765);
  });

  it('fibonacci negative throws', () => {
    expect(() => fibonacci(-1)).toThrow();
  });

  it('fibonacciSequence', () => {
    expect(fibonacciSequence(0)).toEqual([]);
    expect(fibonacciSequence(1)).toEqual([0]);
    expect(fibonacciSequence(8)).toEqual([0, 1, 1, 2, 3, 5, 8, 13]);
  });
});

// ==================== PERCENTAGE ====================

describe('Percentage calculations', () => {
  it('percentage', () => {
    expect(percentage(25, 100)).toBe(25);
    expect(percentage(1, 3)).toBeCloseTo(33.3333);
  });

  it('percentage of zero total throws', () => {
    expect(() => percentage(5, 0)).toThrow();
  });

  it('percentageOf', () => {
    expect(percentageOf(50, 200)).toBe(100);
    expect(percentageOf(10, 50)).toBe(5);
  });

  it('percentageChange', () => {
    expect(percentageChange(100, 150)).toBe(50);
    expect(percentageChange(200, 100)).toBe(-50);
  });

  it('percentageChange from zero throws', () => {
    expect(() => percentageChange(0, 100)).toThrow();
  });

  it('percentageDifference', () => {
    expect(percentageDifference(10, 20)).toBeCloseTo(66.6667);
    expect(percentageDifference(0, 0)).toBe(0);
  });
});

// ==================== ROUNDING ====================

describe('Rounding', () => {
  it('round', () => {
    expect(round(3.456, 2)).toBe(3.46);
    expect(round(3.454, 2)).toBe(3.45);
    expect(round(3.5)).toBe(4);
  });

  it('roundUp', () => {
    expect(roundUp(3.001, 2)).toBe(3.01);
    expect(roundUp(3.1)).toBe(4);
  });

  it('roundDown', () => {
    expect(roundDown(3.999, 2)).toBe(3.99);
    expect(roundDown(3.9)).toBe(3);
  });
});

// ==================== GEOMETRY ====================

describe('Geometry', () => {
  it('circleFromRadius', () => {
    const c = circleFromRadius(5);
    writeOutput('calculators', 'circle.json', JSON.stringify(c, null, 2));
    expect(c.diameter).toBe(10);
    expect(c.circumference).toBeCloseTo(31.4159);
    expect(c.area).toBeCloseTo(78.5398);
  });

  it('rectangleMetrics', () => {
    const r = rectangleMetrics(3, 4);
    expect(r.area).toBe(12);
    expect(r.perimeter).toBe(14);
    expect(r.diagonal).toBe(5);
  });

  it('triangleMetrics equilateral', () => {
    const t = triangleMetrics(5, 5, 5);
    expect(t.isValid).toBe(true);
    expect(t.type).toBe('equilateral');
    expect(t.perimeter).toBe(15);
    expect(t.area).toBeCloseTo(10.8253);
  });

  it('triangleMetrics invalid triangle', () => {
    const t = triangleMetrics(1, 2, 10);
    expect(t.isValid).toBe(false);
    expect(t.area).toBe(0);
  });

  it('triangleMetrics isosceles', () => {
    const t = triangleMetrics(5, 5, 3);
    expect(t.type).toBe('isosceles');
  });

  it('triangleMetrics scalene', () => {
    const t = triangleMetrics(3, 4, 5);
    expect(t.type).toBe('scalene');
    expect(t.area).toBe(6);
  });

  it('pythagorean', () => {
    expect(pythagorean(3, 4)).toBe(5);
    expect(pythagorean(5, 12)).toBe(13);
  });

  it('distance2D', () => {
    expect(distance2D(0, 0, 3, 4)).toBe(5);
    expect(distance2D(1, 1, 1, 1)).toBe(0);
  });
});

// ==================== SCIENTIFIC CALCULATOR ====================

describe('Scientific calculator object', () => {
  it('factorial', () => {
    expect(scientific.factorial(5)).toBe(120);
    expect(() => scientific.factorial(-1)).toThrow();
  });

  it('trig functions (degrees)', () => {
    expect(scientific.sin(90)).toBeCloseTo(1);
    expect(scientific.cos(0)).toBe(1);
    expect(scientific.tan(45)).toBeCloseTo(1);
  });

  it('inverse trig (returns degrees)', () => {
    expect(scientific.asin(1)).toBeCloseTo(90);
    expect(scientific.acos(1)).toBeCloseTo(0);
    expect(scientific.atan(1)).toBeCloseTo(45);
  });

  it('asin/acos domain error', () => {
    expect(() => scientific.asin(2)).toThrow();
    expect(() => scientific.acos(-2)).toThrow();
  });

  it('hyperbolic functions', () => {
    expect(scientific.sinh(0)).toBe(0);
    expect(scientific.cosh(0)).toBe(1);
    expect(scientific.tanh(0)).toBe(0);
  });

  it('acosh domain error', () => {
    expect(() => scientific.acosh(0)).toThrow();
  });

  it('atanh domain error', () => {
    expect(() => scientific.atanh(1)).toThrow();
    expect(() => scientific.atanh(-1)).toThrow();
  });

  it('log functions', () => {
    expect(scientific.ln(Math.E)).toBeCloseTo(1);
    expect(scientific.log10(100)).toBeCloseTo(2);
    expect(scientific.log2(8)).toBeCloseTo(3);
  });

  it('constants', () => {
    expect(scientific.PI).toBe(Math.PI);
    expect(scientific.E).toBe(Math.E);
  });

  it('utility functions', () => {
    expect(scientific.abs(-5)).toBe(5);
    expect(scientific.ceil(4.1)).toBe(5);
    expect(scientific.floor(4.9)).toBe(4);
    expect(scientific.round(4.5)).toBe(5);
    expect(scientific.sign(-3)).toBe(-1);
  });
});

// ==================== EXPRESSION EVALUATOR ====================

describe('Expression evaluator', () => {
  it('basic arithmetic', () => {
    expect(evaluateExpression('2 + 3')).toBe(5);
    expect(evaluateExpression('10 - 4')).toBe(6);
    expect(evaluateExpression('3 * 4')).toBe(12);
    expect(evaluateExpression('10 / 4')).toBe(2.5);
  });

  it('operator precedence', () => {
    expect(evaluateExpression('2 + 3 * 4')).toBe(14);
    expect(evaluateExpression('(2 + 3) * 4')).toBe(20);
  });

  it('exponentiation', () => {
    expect(evaluateExpression('2 ^ 10')).toBe(1024);
  });

  it('modulo', () => {
    expect(evaluateExpression('10 % 3')).toBe(1);
  });

  it('unary minus', () => {
    expect(evaluateExpression('-5 + 10')).toBe(5);
  });

  it('nested parentheses', () => {
    expect(evaluateExpression('((2 + 3) * (4 + 1))')).toBe(25);
  });

  it('built-in functions', () => {
    expect(evaluateExpression('sqrt(16)')).toBe(4);
    expect(evaluateExpression('abs(-42)')).toBe(42);
    expect(evaluateExpression('ceil(4.1)')).toBe(5);
    expect(evaluateExpression('floor(4.9)')).toBe(4);
  });

  it('trig functions', () => {
    expect(evaluateExpression('sin(90)')).toBeCloseTo(1);
    expect(evaluateExpression('cos(0)')).toBe(1);
  });

  it('constants', () => {
    expect(evaluateExpression('pi')).toBeCloseTo(Math.PI);
    expect(evaluateExpression('e')).toBeCloseTo(Math.E);
  });

  it('complex expressions', () => {
    expect(evaluateExpression('sqrt(3^2 + 4^2)')).toBeCloseTo(5);
    expect(evaluateExpression('2 * pi')).toBeCloseTo(6.2832);
  });

  it('multi-arg functions', () => {
    expect(evaluateExpression('pow(2, 10)')).toBe(1024);
    // evaluateExpression only supports 2-arg min
    expect(evaluateExpression('min(3, 1)')).toBe(1);
    // evaluateExpression only supports 2-arg max
    expect(evaluateExpression('max(3, 1)')).toBe(3);
  });

  // INJECTION TESTING — expression evaluator is a prime target
  it('rejects unknown identifiers (no arbitrary code exec)', () => {
    expect(() => evaluateExpression('process')).toThrow();
    expect(() => evaluateExpression('require("child_process")')).toThrow();
    expect(() => evaluateExpression('eval("1+1")')).toThrow();
  });

  it('rejects prototype pollution attempts', () => {
    expect(() => evaluateExpression('constructor')).toThrow();
    expect(() => evaluateExpression('__proto__')).toThrow();
  });

  it('rejects XSS in expression', () => {
    expect(() => evaluateExpression('<script>alert(1)</script>')).toThrow();
    expect(() => evaluateExpression('alert(1)')).toThrow(); // alert is not a known function
  });

  it('rejects SQL injection in expression', () => {
    expect(() => evaluateExpression("' OR '1'='1")).toThrow();
    expect(() => evaluateExpression('1; DROP TABLE users')).toThrow();
  });

  it('rejects template injection in expression', () => {
    expect(() => evaluateExpression('${7*7}')).toThrow();
    expect(() => evaluateExpression('{{7*7}}')).toThrow();
  });

  it('rejects command injection in expression', () => {
    expect(() => evaluateExpression('; rm -rf /')).toThrow();
    expect(() => evaluateExpression('`whoami`')).toThrow();
  });

  it('rejects path traversal in expression', () => {
    expect(() => evaluateExpression('../../../etc/passwd')).toThrow();
  });

  it('handles division by zero in expression', () => {
    expect(() => evaluateExpression('1 / 0')).toThrow(/division by zero/i);
  });

  it('handles deeply nested parens', () => {
    expect(evaluateExpression('((((((1 + 1))))))')).toBe(2);
  });

  it('handles whitespace-only expression', () => {
    expect(() => evaluateExpression('   ')).toThrow();
  });

  it('handles empty expression', () => {
    expect(() => evaluateExpression('')).toThrow();
  });
});

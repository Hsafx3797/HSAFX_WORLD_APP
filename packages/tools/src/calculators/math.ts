/**
 * Math Calculator Library
 */

// ==================== BASIC OPERATIONS ====================

export function add(...numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(...numbers: number[]): number {
  return numbers.reduce((a, b) => a * b, 1);
}

export function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}

export function modulo(a: number, b: number): number {
  return a % b;
}

export function power(base: number, exponent: number): number {
  return Math.pow(base, exponent);
}

export function sqrt(n: number): number {
  if (n < 0) throw new Error('Cannot compute square root of negative number');
  return Math.sqrt(n);
}

export function nthRoot(n: number, root: number): number {
  if (n < 0 && root % 2 === 0) {
    throw new Error('Cannot compute even root of negative number');
  }
  return Math.pow(Math.abs(n), 1 / root) * (n < 0 ? -1 : 1);
}

// ==================== STATISTICS ====================

export interface StatisticsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  variance: number;
  standardDeviation: number;
  sampleVariance: number;
  sampleStandardDeviation: number;
  quartiles: { q1: number; q2: number; q3: number };
  iqr: number;
}

export function calculateStatistics(values: number[]): StatisticsResult {
  if (values.length === 0) {
    throw new Error('Cannot calculate statistics of empty array');
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  
  // Mode
  const frequency = new Map<number, number>();
  values.forEach(v => frequency.set(v, (frequency.get(v) || 0) + 1));
  const maxFreq = Math.max(...frequency.values());
  const mode = [...frequency.entries()]
    .filter(([_, count]) => count === maxFreq)
    .map(([value]) => value);
  
  // Variance
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
  const standardDeviation = Math.sqrt(variance);
  
  // Sample variance (n-1)
  const sampleVariance = n > 1 
    ? values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1)
    : 0;
  const sampleStandardDeviation = Math.sqrt(sampleVariance);
  
  // Quartiles
  const q1Index = Math.floor(n / 4);
  const q3Index = Math.floor(3 * n / 4);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  return {
    count: n,
    sum,
    mean,
    median,
    mode,
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0],
    variance,
    standardDeviation,
    sampleVariance,
    sampleStandardDeviation,
    quartiles: { q1, q2: median, q3 },
    iqr,
  };
}

// ==================== TRIGONOMETRY ====================

export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function sin(angle: number, inDegrees = false): number {
  return Math.sin(inDegrees ? degreesToRadians(angle) : angle);
}

export function cos(angle: number, inDegrees = false): number {
  return Math.cos(inDegrees ? degreesToRadians(angle) : angle);
}

export function tan(angle: number, inDegrees = false): number {
  return Math.tan(inDegrees ? degreesToRadians(angle) : angle);
}

export function asin(value: number, inDegrees = false): number {
  const result = Math.asin(value);
  return inDegrees ? radiansToDegrees(result) : result;
}

export function acos(value: number, inDegrees = false): number {
  const result = Math.acos(value);
  return inDegrees ? radiansToDegrees(result) : result;
}

export function atan(value: number, inDegrees = false): number {
  const result = Math.atan(value);
  return inDegrees ? radiansToDegrees(result) : result;
}

export function atan2(y: number, x: number, inDegrees = false): number {
  const result = Math.atan2(y, x);
  return inDegrees ? radiansToDegrees(result) : result;
}

// ==================== LOGARITHMS ====================

export function log(n: number): number {
  if (n <= 0) throw new Error('Logarithm undefined for non-positive numbers');
  return Math.log(n);
}

export function log10(n: number): number {
  if (n <= 0) throw new Error('Logarithm undefined for non-positive numbers');
  return Math.log10(n);
}

export function log2(n: number): number {
  if (n <= 0) throw new Error('Logarithm undefined for non-positive numbers');
  return Math.log2(n);
}

export function logBase(n: number, base: number): number {
  if (n <= 0 || base <= 0 || base === 1) {
    throw new Error('Invalid logarithm arguments');
  }
  return Math.log(n) / Math.log(base);
}

export function exp(n: number): number {
  return Math.exp(n);
}

// ==================== NUMBER THEORY ====================

export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('Factorial is only defined for non-negative integers');
  }
  if (n === 0 || n === 1) return 1;
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

export function permutations(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / factorial(n - r);
}

export function combinations(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export function primeFactors(n: number): number[] {
  const factors: number[] = [];
  let d = 2;
  
  while (n > 1) {
    while (n % d === 0) {
      factors.push(d);
      n /= d;
    }
    d++;
    if (d * d > n) {
      if (n > 1) factors.push(n);
      break;
    }
  }
  
  return factors;
}

export function fibonacci(n: number): number {
  if (n < 0) throw new Error('Fibonacci is not defined for negative numbers');
  if (n <= 1) return n;
  
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

export function fibonacciSequence(length: number): number[] {
  if (length <= 0) return [];
  if (length === 1) return [0];
  
  const seq = [0, 1];
  for (let i = 2; i < length; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq;
}

// ==================== PERCENTAGE CALCULATIONS ====================

export function percentage(value: number, total: number): number {
  if (total === 0) throw new Error('Cannot calculate percentage of zero');
  return (value / total) * 100;
}

export function percentageOf(percent: number, value: number): number {
  return (percent / 100) * value;
}

export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) throw new Error('Cannot calculate percentage change from zero');
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}

export function percentageDifference(value1: number, value2: number): number {
  const avg = (Math.abs(value1) + Math.abs(value2)) / 2;
  if (avg === 0) return 0;
  return (Math.abs(value1 - value2) / avg) * 100;
}

// ==================== ROUNDING ====================

export function round(n: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

export function roundUp(n: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.ceil(n * factor) / factor;
}

export function roundDown(n: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(n * factor) / factor;
}

export function truncate(n: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.trunc(n * factor) / factor;
}

// ==================== GEOMETRY ====================

export interface CircleMetrics {
  radius: number;
  diameter: number;
  circumference: number;
  area: number;
}

export function circleFromRadius(radius: number): CircleMetrics {
  return {
    radius,
    diameter: radius * 2,
    circumference: 2 * Math.PI * radius,
    area: Math.PI * radius * radius,
  };
}

export interface RectangleMetrics {
  width: number;
  height: number;
  area: number;
  perimeter: number;
  diagonal: number;
}

export function rectangleMetrics(width: number, height: number): RectangleMetrics {
  return {
    width,
    height,
    area: width * height,
    perimeter: 2 * (width + height),
    diagonal: Math.sqrt(width * width + height * height),
  };
}

export interface TriangleMetrics {
  a: number;
  b: number;
  c: number;
  area: number;
  perimeter: number;
  isValid: boolean;
  type: 'equilateral' | 'isosceles' | 'scalene';
}

export function triangleMetrics(a: number, b: number, c: number): TriangleMetrics {
  // Check if valid triangle
  const isValid = a + b > c && a + c > b && b + c > a;
  
  if (!isValid) {
    return { a, b, c, area: 0, perimeter: 0, isValid: false, type: 'scalene' };
  }
  
  const perimeter = a + b + c;
  const s = perimeter / 2; // semi-perimeter
  const area = Math.sqrt(s * (s - a) * (s - b) * (s - c)); // Heron's formula
  
  let type: 'equilateral' | 'isosceles' | 'scalene';
  if (a === b && b === c) {
    type = 'equilateral';
  } else if (a === b || b === c || a === c) {
    type = 'isosceles';
  } else {
    type = 'scalene';
  }
  
  return { a, b, c, area, perimeter, isValid, type };
}

export function pythagorean(a: number, b: number): number {
  return Math.sqrt(a * a + b * b);
}

export function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function distance3D(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number
): number {
  return Math.sqrt(
    Math.pow(x2 - x1, 2) + 
    Math.pow(y2 - y1, 2) + 
    Math.pow(z2 - z1, 2)
  );
}

import { describe, it, expect } from 'vitest';
import {
  convertUnit,
  getUnitsForCategory,
  getAllCategories,
  metersToFeet,
  feetToMeters,
  poundsToKilograms,
  kilogramsToPounds,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  milesToKilometers,
  kilometersToMiles,
  litersToGallons,
  gallonsToLiters,
} from '../src/calculators/units';

// ═══════════════════════════════════════════════
// Category / Unit Listing
// ═══════════════════════════════════════════════

describe('getAllCategories', () => {
  it('returns known categories', () => {
    const cats = getAllCategories();
    expect(cats).toContain('length');
    expect(cats).toContain('weight');
    expect(cats).toContain('temperature');
    expect(cats).toContain('volume');
    expect(cats).toContain('area');
    expect(cats).toContain('speed');
    expect(cats).toContain('time');
    expect(cats).toContain('pressure');
    expect(cats).toContain('energy');
    expect(cats).toContain('power');
    expect(cats).toContain('angle');
    expect(cats).toContain('frequency');
    expect(cats.length).toBeGreaterThanOrEqual(15);
  });
});

describe('getUnitsForCategory', () => {
  it('lists length units', () => {
    const u = getUnitsForCategory('length');
    expect(u).toContain('meter');
    expect(u).toContain('foot');
    expect(u).toContain('mile');
  });
  it('lists temperature units', () => {
    const u = getUnitsForCategory('temperature');
    expect(u).toContain('celsius');
    expect(u).toContain('fahrenheit');
    expect(u).toContain('kelvin');
  });
});

// ═══════════════════════════════════════════════
// convertUnit dispatcher
// ═══════════════════════════════════════════════

describe('convertUnit', () => {
  it('length: meter → foot', () => {
    expect(convertUnit(1, 'meter', 'foot', 'length')).toBeCloseTo(3.28084, 3);
  });
  it('length: mile → kilometer', () => {
    expect(convertUnit(1, 'mile', 'kilometer', 'length')).toBeCloseTo(1.60934, 3);
  });
  it('weight: kilogram → pound', () => {
    expect(convertUnit(1, 'kilogram', 'pound', 'weight')).toBeCloseTo(2.20462, 3);
  });
  it('temperature: celsius → fahrenheit', () => {
    expect(convertUnit(100, 'celsius', 'fahrenheit', 'temperature')).toBeCloseTo(212, 0);
  });
  it('temperature: fahrenheit → celsius', () => {
    expect(convertUnit(32, 'fahrenheit', 'celsius', 'temperature')).toBeCloseTo(0, 1);
  });
  it('temperature: celsius → kelvin', () => {
    expect(convertUnit(0, 'celsius', 'kelvin', 'temperature')).toBeCloseTo(273.15, 2);
  });
  it('temperature: kelvin → fahrenheit', () => {
    expect(convertUnit(373.15, 'kelvin', 'fahrenheit', 'temperature')).toBeCloseTo(212, 0);
  });
  it('volume: liter → gallon', () => {
    expect(convertUnit(1, 'liter', 'gallon', 'volume')).toBeCloseTo(0.264172, 4);
  });
  it('area: squareMeter → squareFoot', () => {
    expect(convertUnit(1, 'squareMeter', 'squareFoot', 'area')).toBeCloseTo(10.7639, 2);
  });
  it('speed: meterPerSecond → kilometerPerHour', () => {
    expect(convertUnit(1, 'meterPerSecond', 'kilometerPerHour', 'speed')).toBeCloseTo(3.6, 1);
  });
  it('time: hour → minute', () => {
    expect(convertUnit(1, 'hour', 'minute', 'time')).toBeCloseTo(60, 0);
  });
  it('pressure: atmosphere → pascal', () => {
    expect(convertUnit(1, 'atmosphere', 'pascal', 'pressure')).toBeCloseTo(101325, -2);
  });
  it('energy: kilocalorie → joule', () => {
    expect(convertUnit(1, 'kilocalorie', 'joule', 'energy')).toBeCloseTo(4184, -1);
  });
  it('angle: degree → radian', () => {
    expect(convertUnit(180, 'degree', 'radian', 'angle')).toBeCloseTo(Math.PI, 2);
  });
  it('zero stays zero (length)', () => {
    expect(convertUnit(0, 'meter', 'foot', 'length')).toBe(0);
  });
  it('negative values', () => {
    expect(convertUnit(-40, 'celsius', 'fahrenheit', 'temperature')).toBeCloseTo(-40, 0);
  });
  it('throws on invalid unit', () => {
    expect(() => convertUnit(1, 'bogus', 'meter', 'length')).toThrow();
  });
});

// ═══════════════════════════════════════════════
// Shorthand functions
// ═══════════════════════════════════════════════

describe('shorthand conversions', () => {
  it('metersToFeet', () => expect(metersToFeet(1)).toBeCloseTo(3.28084, 3));
  it('feetToMeters', () => expect(feetToMeters(1)).toBeCloseTo(0.3048, 3));
  it('poundsToKilograms', () => expect(poundsToKilograms(1)).toBeCloseTo(0.453592, 3));
  it('kilogramsToPounds', () => expect(kilogramsToPounds(1)).toBeCloseTo(2.20462, 3));
  it('celsiusToFahrenheit boiling', () => expect(celsiusToFahrenheit(100)).toBeCloseTo(212, 0));
  it('fahrenheitToCelsius freezing', () => expect(fahrenheitToCelsius(32)).toBeCloseTo(0, 1));
  it('milesToKilometers', () => expect(milesToKilometers(1)).toBeCloseTo(1.60934, 3));
  it('kilometersToMiles', () => expect(kilometersToMiles(1)).toBeCloseTo(0.621371, 3));
  it('litersToGallons', () => expect(litersToGallons(1)).toBeCloseTo(0.264172, 4));
  it('gallonsToLiters', () => expect(gallonsToLiters(1)).toBeCloseTo(3.78541, 3));
});

// ═══════════════════════════════════════════════
// Identity / Roundtrip
// ═══════════════════════════════════════════════

describe('roundtrip conversions', () => {
  it('meters → feet → meters', () => {
    expect(feetToMeters(metersToFeet(5))).toBeCloseTo(5, 4);
  });
  it('kg → lb → kg', () => {
    expect(poundsToKilograms(kilogramsToPounds(10))).toBeCloseTo(10, 3);
  });
  it('C → F → C', () => {
    expect(fahrenheitToCelsius(celsiusToFahrenheit(37))).toBeCloseTo(37, 2);
  });
  it('miles → km → miles', () => {
    expect(kilometersToMiles(milesToKilometers(26.2))).toBeCloseTo(26.2, 2);
  });
  it('liters → gallons → liters', () => {
    expect(gallonsToLiters(litersToGallons(3.5))).toBeCloseTo(3.5, 3);
  });
});

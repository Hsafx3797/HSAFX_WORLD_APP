import { describe, it, expect } from 'vitest';
import {
  convertLength,
  convertWeight,
  convertTemperature,
  convertVolume,
  convertArea,
  convertSpeed,
  convertTime,
  convertDigital,
  convertPressure,
  convertEnergy,
  convertPower,
  convertAngle,
  convertFrequency,
  convertCurrency,
  convert,
  unitLists,
} from '../src/converters/units';

// ── Length ───────────────────────────────────────────────
describe('convertLength', () => {
  it('converts meters to kilometers', () => {
    expect(convertLength(1000, 'm', 'km')).toBeCloseTo(1);
  });
  it('converts miles to kilometers', () => {
    expect(convertLength(1, 'mi', 'km')).toBeCloseTo(1.60934, 3);
  });
  it('converts feet to meters', () => {
    expect(convertLength(1, 'ft', 'm')).toBeCloseTo(0.3048, 4);
  });
  it('converts inches to centimeters', () => {
    expect(convertLength(1, 'in', 'cm')).toBeCloseTo(2.54, 2);
  });
  it('converts nautical miles to kilometers', () => {
    expect(convertLength(1, 'nmi', 'km')).toBeCloseTo(1.852, 3);
  });
  it('identity conversion', () => {
    expect(convertLength(42, 'm', 'm')).toBeCloseTo(42);
  });
  it('converts zero', () => {
    expect(convertLength(0, 'km', 'mi')).toBe(0);
  });
  it('handles very large values', () => {
    const ly = convertLength(1, 'ly', 'm');
    expect(ly).toBeGreaterThan(9e15);
  });
  it('handles micrometers to nanometers', () => {
    expect(convertLength(1, 'μm', 'nm')).toBeCloseTo(1000);
  });
});

// ── Weight ──────────────────────────────────────────────
describe('convertWeight', () => {
  it('converts kilograms to pounds', () => {
    expect(convertWeight(1, 'kg', 'lb')).toBeCloseTo(2.20462, 3);
  });
  it('converts grams to ounces', () => {
    expect(convertWeight(100, 'g', 'oz')).toBeCloseTo(3.5274, 2);
  });
  it('converts tonnes to kilograms', () => {
    expect(convertWeight(1, 't', 'kg')).toBeCloseTo(1000);
  });
  it('identity conversion', () => {
    expect(convertWeight(5, 'kg', 'kg')).toBeCloseTo(5);
  });
  it('converts zero', () => {
    expect(convertWeight(0, 'lb', 'kg')).toBe(0);
  });
});

// ── Temperature ─────────────────────────────────────────
describe('convertTemperature', () => {
  it('0°C = 32°F', () => {
    expect(convertTemperature(0, 'C', 'F')).toBeCloseTo(32);
  });
  it('100°C = 212°F', () => {
    expect(convertTemperature(100, 'C', 'F')).toBeCloseTo(212);
  });
  it('32°F = 0°C', () => {
    expect(convertTemperature(32, 'F', 'C')).toBeCloseTo(0);
  });
  it('0°C = 273.15K', () => {
    expect(convertTemperature(0, 'C', 'K')).toBeCloseTo(273.15);
  });
  it('0K = -273.15°C', () => {
    expect(convertTemperature(0, 'K', 'C')).toBeCloseTo(-273.15);
  });
  it('0°C in Rankine', () => {
    expect(convertTemperature(0, 'C', 'R')).toBeCloseTo(491.67, 1);
  });
  it('identity conversion', () => {
    expect(convertTemperature(37, 'C', 'C')).toBeCloseTo(37);
  });
  it('-40 is same in C and F', () => {
    expect(convertTemperature(-40, 'C', 'F')).toBeCloseTo(-40);
  });
});

// ── Volume ──────────────────────────────────────────────
describe('convertVolume', () => {
  it('converts liters to gallons (US)', () => {
    expect(convertVolume(1, 'l', 'gal')).toBeCloseTo(0.264172, 3);
  });
  it('converts milliliters to fluid ounces', () => {
    expect(convertVolume(29.5735, 'ml', 'fl oz')).toBeCloseTo(1, 0);
  });
  it('converts 1 cubic meter to liters', () => {
    expect(convertVolume(1, 'm3', 'l')).toBeCloseTo(1000);
  });
  it('identity', () => {
    expect(convertVolume(3, 'l', 'l')).toBeCloseTo(3);
  });
});

// ── Area ────────────────────────────────────────────────
describe('convertArea', () => {
  it('converts square meters to square feet', () => {
    expect(convertArea(1, 'm2', 'ft2')).toBeCloseTo(10.7639, 2);
  });
  it('converts hectares to acres', () => {
    expect(convertArea(1, 'ha', 'ac')).toBeCloseTo(2.47105, 3);
  });
  it('converts square kilometers to square miles', () => {
    expect(convertArea(1, 'km2', 'mi2')).toBeCloseTo(0.386102, 3);
  });
  it('identity', () => {
    expect(convertArea(7, 'm2', 'm2')).toBeCloseTo(7);
  });
});

// ── Speed ───────────────────────────────────────────────
describe('convertSpeed', () => {
  it('converts km/h to mph', () => {
    expect(convertSpeed(100, 'km/h', 'mph')).toBeCloseTo(62.1371, 2);
  });
  it('converts m/s to km/h', () => {
    expect(convertSpeed(1, 'm/s', 'km/h')).toBeCloseTo(3.6);
  });
  it('converts knots to km/h', () => {
    expect(convertSpeed(1, 'kn', 'km/h')).toBeCloseTo(1.852, 3);
  });
  it('identity', () => {
    expect(convertSpeed(50, 'mph', 'mph')).toBeCloseTo(50);
  });
});

// ── Time ────────────────────────────────────────────────
describe('convertTime', () => {
  it('converts hours to minutes', () => {
    expect(convertTime(1, 'h', 'min')).toBeCloseTo(60);
  });
  it('converts days to seconds', () => {
    expect(convertTime(1, 'd', 's')).toBeCloseTo(86400);
  });
  it('converts weeks to days', () => {
    expect(convertTime(1, 'wk', 'd')).toBeCloseTo(7);
  });
  it('converts years to days', () => {
    expect(convertTime(1, 'yr', 'd')).toBeCloseTo(365.25, 1);
  });
  it('converts nanoseconds to microseconds', () => {
    expect(convertTime(1000, 'ns', 'μs')).toBeCloseTo(1);
  });
  it('identity', () => {
    expect(convertTime(42, 's', 's')).toBeCloseTo(42);
  });
});

// ── Digital ─────────────────────────────────────────────
describe('convertDigital', () => {
  it('converts gigabytes to megabytes', () => {
    expect(convertDigital(1, 'gb', 'mb')).toBeCloseTo(1024);
  });
  it('converts terabytes to gigabytes', () => {
    expect(convertDigital(1, 'tb', 'gb')).toBeCloseTo(1024);
  });
  it('converts megabytes to bits', () => {
    expect(convertDigital(1, 'mb', 'bit')).toBeCloseTo(1024 * 1024 * 8);
  });
  it('converts kilobytes to bytes', () => {
    expect(convertDigital(1, 'kb', 'b')).toBeCloseTo(1024);
  });
  it('identity', () => {
    expect(convertDigital(100, 'gb', 'gb')).toBeCloseTo(100);
  });
});

// ── Pressure ────────────────────────────────────────────
describe('convertPressure', () => {
  it('converts atmospheres to psi', () => {
    expect(convertPressure(1, 'atm', 'psi')).toBeCloseTo(14.696, 1);
  });
  it('converts bar to pascal', () => {
    expect(convertPressure(1, 'bar', 'pa')).toBeCloseTo(100000);
  });
  it('converts atm to mmhg', () => {
    expect(convertPressure(1, 'atm', 'mmhg')).toBeCloseTo(760, 0);
  });
  it('identity', () => {
    expect(convertPressure(5, 'pa', 'pa')).toBeCloseTo(5);
  });
});

// ── Energy ──────────────────────────────────────────────
describe('convertEnergy', () => {
  it('converts kilowatt-hours to joules', () => {
    expect(convertEnergy(1, 'kwh', 'j')).toBeCloseTo(3600000);
  });
  it('converts calories to joules', () => {
    expect(convertEnergy(1, 'cal', 'j')).toBeCloseTo(4.184, 2);
  });
  it('converts kilocalories to calories', () => {
    expect(convertEnergy(1, 'kcal', 'cal')).toBeCloseTo(1000);
  });
  it('identity', () => {
    expect(convertEnergy(10, 'j', 'j')).toBeCloseTo(10);
  });
});

// ── Power ───────────────────────────────────────────────
describe('convertPower', () => {
  it('converts kilowatts to horsepower', () => {
    expect(convertPower(1, 'kw', 'hp')).toBeCloseTo(1.34102, 2);
  });
  it('converts watts to kilowatts', () => {
    expect(convertPower(1000, 'w', 'kw')).toBeCloseTo(1);
  });
  it('identity', () => {
    expect(convertPower(3, 'w', 'w')).toBeCloseTo(3);
  });
});

// ── Angle ───────────────────────────────────────────────
describe('convertAngle', () => {
  it('180 degrees = π radians', () => {
    expect(convertAngle(180, 'deg', 'rad')).toBeCloseTo(Math.PI);
  });
  it('1 turn = 360 degrees', () => {
    expect(convertAngle(1, 'turn', 'deg')).toBeCloseTo(360);
  });
  it('90 degrees to gradians', () => {
    expect(convertAngle(90, 'deg', 'grad')).toBeCloseTo(100);
  });
  it('identity', () => {
    expect(convertAngle(45, 'deg', 'deg')).toBeCloseTo(45);
  });
});

// ── Frequency ───────────────────────────────────────────
describe('convertFrequency', () => {
  it('converts GHz to MHz', () => {
    expect(convertFrequency(1, 'ghz', 'mhz')).toBeCloseTo(1000);
  });
  it('converts kHz to Hz', () => {
    expect(convertFrequency(1, 'khz', 'hz')).toBeCloseTo(1000);
  });
  it('identity', () => {
    expect(convertFrequency(50, 'hz', 'hz')).toBeCloseTo(50);
  });
});

// ── Currency (static reference rates) ────────────────────────
describe('convertCurrency', () => {
  it('converts USD to SAR (×3.75)', () => {
    expect(convertCurrency(1, 'USD', 'SAR')).toBeCloseTo(3.75);
  });
  it('converts EUR to USD', () => {
    const eur = convertCurrency(1, 'EUR', 'USD');
    expect(eur).toBeGreaterThan(0);
  });
  it('identity USD → USD', () => {
    expect(convertCurrency(100, 'USD', 'USD')).toBeCloseTo(100);
  });
  it('converts zero', () => {
    expect(convertCurrency(0, 'USD', 'EUR')).toBe(0);
  });
});

// ── Unified convert() ──────────────────────────────────
describe('convert() unified dispatcher', () => {
  it('dispatches to length', () => {
    expect(convert(1000, 'm', 'km', 'length')).toBeCloseTo(1);
  });
  it('dispatches to weight', () => {
    expect(convert(1, 'kg', 'lb', 'weight')).toBeCloseTo(2.20462, 3);
  });
  it('dispatches to temperature', () => {
    expect(convert(100, 'C', 'F', 'temperature')).toBeCloseTo(212);
  });
  it('dispatches to digital', () => {
    expect(convert(1, 'gb', 'mb', 'digital')).toBeCloseTo(1024);
  });
  it('dispatches to angle', () => {
    expect(convert(180, 'deg', 'rad', 'angle')).toBeCloseTo(Math.PI);
  });
  it('dispatches to currency', () => {
    expect(convert(1, 'USD', 'SAR', 'currency')).toBeCloseTo(3.75);
  });
});

// ── unitLists ───────────────────────────────────────────
describe('unitLists', () => {
  it('has all 14 categories', () => {
    const expected = [
      'length', 'weight', 'temperature', 'volume', 'area',
      'speed', 'time', 'digital', 'pressure', 'energy',
      'power', 'angle', 'frequency', 'currency',
    ];
    for (const cat of expected) {
      expect(unitLists).toHaveProperty(cat);
    }
  });
  it('each category has at least 2 units', () => {
    for (const cat of Object.keys(unitLists)) {
      expect(unitLists[cat as keyof typeof unitLists].length).toBeGreaterThanOrEqual(2);
    }
  });
});

// ── Edge cases ──────────────────────────────────────────
describe('edge cases', () => {
  it('negative value preserves sign', () => {
    expect(convertLength(-5, 'km', 'm')).toBeCloseTo(-5000);
  });
  it('very small value', () => {
    expect(convertLength(1e-10, 'm', 'nm')).toBeCloseTo(0.1);
  });
  it('large value precision', () => {
    expect(convertDigital(1, 'pb', 'b')).toBeGreaterThan(1e15);
  });
});

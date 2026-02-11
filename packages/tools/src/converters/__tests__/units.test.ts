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
} from '../units';

// ==================== LENGTH ====================

describe('convertLength', () => {
  it('converts km to m', () => {
    expect(convertLength(1, 'km', 'm')).toBe(1000);
  });

  it('converts mi to km', () => {
    expect(convertLength(1, 'mi', 'km')).toBeCloseTo(1.609344, 3);
  });

  it('converts ft to in', () => {
    expect(convertLength(1, 'ft', 'in')).toBeCloseTo(12, 5);
  });

  it('converts m to cm', () => {
    expect(convertLength(1, 'm', 'cm')).toBe(100);
  });

  it('converts nmi to km', () => {
    expect(convertLength(1, 'nmi', 'km')).toBeCloseTo(1.852, 3);
  });

  it('is case-insensitive', () => {
    expect(convertLength(1, 'KM', 'm')).toBe(1000);
  });

  it('throws for unknown unit', () => {
    expect(() => convertLength(1, 'lightyear', 'm')).toThrow('Unknown length unit');
  });
});

// ==================== WEIGHT ====================

describe('convertWeight', () => {
  it('converts kg to lb', () => {
    expect(convertWeight(1, 'kg', 'lb')).toBeCloseTo(2.20462, 3);
  });

  it('converts lb to kg', () => {
    expect(convertWeight(1, 'lb', 'kg')).toBeCloseTo(0.453592, 3);
  });

  it('converts kg to g', () => {
    expect(convertWeight(1, 'kg', 'g')).toBe(1000);
  });

  it('converts oz to g', () => {
    expect(convertWeight(1, 'oz', 'g')).toBeCloseTo(28.3495, 2);
  });

  it('converts t to kg', () => {
    expect(convertWeight(1, 't', 'kg')).toBe(1000);
  });

  it('throws for unknown unit', () => {
    expect(() => convertWeight(1, 'unknown', 'kg')).toThrow('Unknown weight unit');
  });
});

// ==================== TEMPERATURE ====================

describe('convertTemperature', () => {
  it('converts 0°C to 32°F', () => {
    expect(convertTemperature(0, 'C', 'F')).toBe(32);
  });

  it('converts 100°C to 212°F', () => {
    expect(convertTemperature(100, 'C', 'F')).toBe(212);
  });

  it('converts 0°C to 273.15K', () => {
    expect(convertTemperature(0, 'C', 'K')).toBe(273.15);
  });

  it('converts -40°F to -40°C', () => {
    expect(convertTemperature(-40, 'F', 'C')).toBeCloseTo(-40, 5);
  });

  it('converts 0K to -273.15°C', () => {
    expect(convertTemperature(0, 'K', 'C')).toBeCloseTo(-273.15, 5);
  });

  it('converts Celsius to Rankine', () => {
    // 0°C = 273.15K = 491.67R
    expect(convertTemperature(0, 'C', 'R')).toBeCloseTo(491.67, 2);
  });

  it('converts Rankine to Celsius', () => {
    expect(convertTemperature(491.67, 'R', 'C')).toBeCloseTo(0, 2);
  });

  it('converts Rankine to Fahrenheit', () => {
    // 491.67R → 0°C → 32°F
    expect(convertTemperature(491.67, 'R', 'F')).toBeCloseTo(32, 1);
  });

  it('accepts full name CELSIUS', () => {
    expect(convertTemperature(100, 'CELSIUS', 'FAHRENHEIT')).toBe(212);
  });

  it('accepts full name KELVIN', () => {
    expect(convertTemperature(273.15, 'KELVIN', 'CELSIUS')).toBeCloseTo(0, 5);
  });

  it('throws for unknown from-unit', () => {
    expect(() => convertTemperature(0, 'X', 'C')).toThrow('Unknown temperature unit');
  });

  it('throws for unknown to-unit', () => {
    expect(() => convertTemperature(0, 'C', 'X')).toThrow('Unknown temperature unit');
  });
});

// ==================== VOLUME ====================

describe('convertVolume', () => {
  it('converts l to ml', () => {
    expect(convertVolume(1, 'l', 'ml')).toBe(1000);
  });

  it('converts gal to l', () => {
    expect(convertVolume(1, 'gal', 'l')).toBeCloseTo(3.78541, 3);
  });

  it('converts m3 to l', () => {
    expect(convertVolume(1, 'm3', 'l')).toBe(1000);
  });

  it('converts cup to ml', () => {
    expect(convertVolume(1, 'cup', 'ml')).toBeCloseTo(236.588, 1);
  });

  it('throws for unknown unit', () => {
    expect(() => convertVolume(1, 'barrel', 'l')).toThrow('Unknown volume unit');
  });
});

// ==================== AREA ====================

describe('convertArea', () => {
  it('converts km2 to m2', () => {
    expect(convertArea(1, 'km2', 'm2')).toBe(1e6);
  });

  it('converts ac to ha', () => {
    expect(convertArea(1, 'ac', 'ha')).toBeCloseTo(0.40469, 3);
  });

  it('converts ha to m2', () => {
    expect(convertArea(1, 'ha', 'm2')).toBe(10000);
  });

  it('converts mi2 to km2', () => {
    expect(convertArea(1, 'mi2', 'km2')).toBeCloseTo(2.58999, 3);
  });

  it('throws for unknown unit', () => {
    expect(() => convertArea(1, 'plot', 'm2')).toThrow('Unknown area unit');
  });
});

// ==================== SPEED ====================

describe('convertSpeed', () => {
  it('converts km/h to m/s', () => {
    expect(convertSpeed(1, 'km/h', 'm/s')).toBeCloseTo(0.277778, 3);
  });

  it('converts mph to km/h', () => {
    expect(convertSpeed(1, 'mph', 'km/h')).toBeCloseTo(1.60934, 3);
  });

  it('converts c (speed of light) to m/s', () => {
    expect(convertSpeed(1, 'c', 'm/s')).toBeCloseTo(299792458, 0);
  });

  it('converts kn to km/h', () => {
    expect(convertSpeed(1, 'kn', 'km/h')).toBeCloseTo(1.852, 2);
  });

  it('converts mach to m/s', () => {
    expect(convertSpeed(1, 'mach', 'm/s')).toBeCloseTo(340.29, 1);
  });

  it('throws for unknown unit', () => {
    expect(() => convertSpeed(1, 'warp', 'm/s')).toThrow('Unknown speed unit');
  });
});

// ==================== TIME ====================

describe('convertTime', () => {
  it('converts h to min', () => {
    expect(convertTime(1, 'h', 'min')).toBe(60);
  });

  it('converts d to h', () => {
    expect(convertTime(1, 'd', 'h')).toBe(24);
  });

  it('converts wk to d', () => {
    expect(convertTime(1, 'wk', 'd')).toBe(7);
  });

  it('converts min to s', () => {
    expect(convertTime(1, 'min', 's')).toBe(60);
  });

  it('converts s to ms', () => {
    expect(convertTime(1, 's', 'ms')).toBe(1000);
  });

  it('throws for unknown unit', () => {
    expect(() => convertTime(1, 'fortnight', 's')).toThrow('Unknown time unit');
  });
});

// ==================== DIGITAL STORAGE ====================

describe('convertDigital', () => {
  it('converts gb to mb', () => {
    expect(convertDigital(1, 'gb', 'mb')).toBe(1024);
  });

  it('converts tb to gb', () => {
    expect(convertDigital(1, 'tb', 'gb')).toBe(1024);
  });

  it('converts mb to kb', () => {
    expect(convertDigital(1, 'mb', 'kb')).toBe(1024);
  });

  it('converts kb to b', () => {
    expect(convertDigital(1, 'kb', 'b')).toBe(1024);
  });

  it('converts gb to b', () => {
    expect(convertDigital(1, 'gb', 'b')).toBe(1024 ** 3);
  });

  it('throws for unknown unit', () => {
    expect(() => convertDigital(1, 'zb', 'gb')).toThrow('Unknown digital unit');
  });
});

// ==================== PRESSURE ====================

describe('convertPressure', () => {
  it('converts atm to pa', () => {
    expect(convertPressure(1, 'atm', 'pa')).toBe(101325);
  });

  it('converts bar to psi', () => {
    expect(convertPressure(1, 'bar', 'psi')).toBeCloseTo(14.5038, 2);
  });

  it('converts kpa to pa', () => {
    expect(convertPressure(1, 'kpa', 'pa')).toBe(1000);
  });

  it('converts atm to bar', () => {
    expect(convertPressure(1, 'atm', 'bar')).toBeCloseTo(1.01325, 3);
  });

  it('throws for unknown unit', () => {
    expect(() => convertPressure(1, 'psf', 'pa')).toThrow('Unknown pressure unit');
  });
});

// ==================== ENERGY ====================

describe('convertEnergy', () => {
  it('converts kwh to j', () => {
    expect(convertEnergy(1, 'kwh', 'j')).toBe(3600000);
  });

  it('converts cal to j', () => {
    expect(convertEnergy(1, 'cal', 'j')).toBeCloseTo(4.184, 3);
  });

  it('converts kj to j', () => {
    expect(convertEnergy(1, 'kj', 'j')).toBe(1000);
  });

  it('converts btu to j', () => {
    expect(convertEnergy(1, 'btu', 'j')).toBeCloseTo(1055.06, 1);
  });

  it('throws for unknown unit', () => {
    expect(() => convertEnergy(1, 'erg', 'j')).toThrow('Unknown energy unit');
  });
});

// ==================== POWER ====================

describe('convertPower', () => {
  it('converts hp to w', () => {
    expect(convertPower(1, 'hp', 'w')).toBeCloseTo(745.7, 1);
  });

  it('converts kw to w', () => {
    expect(convertPower(1, 'kw', 'w')).toBe(1000);
  });

  it('converts mw to kw', () => {
    expect(convertPower(1, 'mw', 'kw')).toBe(1000);
  });

  it('converts gw to mw', () => {
    expect(convertPower(1, 'gw', 'mw')).toBe(1000);
  });

  it('throws for unknown unit', () => {
    expect(() => convertPower(1, 'torque', 'w')).toThrow('Unknown power unit');
  });
});

// ==================== ANGLE ====================

describe('convertAngle', () => {
  it('converts 180 deg to π rad', () => {
    expect(convertAngle(180, 'deg', 'rad')).toBeCloseTo(Math.PI, 3);
  });

  it('converts 1 turn to 360 deg', () => {
    expect(convertAngle(1, 'turn', 'deg')).toBe(360);
  });

  it('converts 360 deg to 1 turn', () => {
    expect(convertAngle(360, 'deg', 'turn')).toBeCloseTo(1, 5);
  });

  it('converts 90 deg to 100 grad', () => {
    expect(convertAngle(90, 'deg', 'grad')).toBeCloseTo(100, 2);
  });

  it('throws for unknown unit', () => {
    expect(() => convertAngle(1, 'circle', 'deg')).toThrow('Unknown angle unit');
  });
});

// ==================== FREQUENCY ====================

describe('convertFrequency', () => {
  it('converts ghz to mhz', () => {
    expect(convertFrequency(1, 'ghz', 'mhz')).toBe(1000);
  });

  it('converts mhz to khz', () => {
    expect(convertFrequency(1, 'mhz', 'khz')).toBe(1000);
  });

  it('converts khz to hz', () => {
    expect(convertFrequency(1, 'khz', 'hz')).toBe(1000);
  });

  it('converts thz to ghz', () => {
    expect(convertFrequency(1, 'thz', 'ghz')).toBe(1000);
  });

  it('throws for unknown unit', () => {
    expect(() => convertFrequency(1, 'baud', 'hz')).toThrow('Unknown frequency unit');
  });
});

// ==================== CURRENCY ====================

describe('convertCurrency', () => {
  it('converts USD to EUR', () => {
    expect(convertCurrency(1, 'USD', 'EUR')).toBeCloseTo(0.92, 2);
  });

  it('converts EUR to USD', () => {
    expect(convertCurrency(1, 'EUR', 'USD')).toBeCloseTo(1 / 0.92, 2);
  });

  it('converts USD to GBP', () => {
    expect(convertCurrency(1, 'USD', 'GBP')).toBeCloseTo(0.79, 2);
  });

  it('converts same currency to same value', () => {
    expect(convertCurrency(100, 'USD', 'USD')).toBe(100);
  });

  it('throws for unknown currency', () => {
    expect(() => convertCurrency(1, 'USD', 'XYZ')).toThrow('Unknown currency');
  });

  it('throws for unknown from-currency', () => {
    expect(() => convertCurrency(1, 'ABC', 'EUR')).toThrow('Unknown currency');
  });
});

// ==================== UNIFIED CONVERTER ====================

describe('convert', () => {
  it('delegates length conversions', () => {
    expect(convert(1, 'km', 'm', 'length')).toBe(1000);
  });

  it('delegates weight conversions', () => {
    expect(convert(1, 'kg', 'g', 'weight')).toBe(1000);
  });

  it('delegates temperature conversions', () => {
    expect(convert(100, 'C', 'F', 'temperature')).toBe(212);
  });

  it('delegates volume conversions', () => {
    expect(convert(1, 'l', 'ml', 'volume')).toBe(1000);
  });

  it('delegates area conversions', () => {
    expect(convert(1, 'km2', 'm2', 'area')).toBe(1e6);
  });

  it('delegates speed conversions', () => {
    expect(convert(1, 'km/h', 'm/s', 'speed')).toBeCloseTo(0.278, 2);
  });

  it('delegates time conversions', () => {
    expect(convert(1, 'h', 'min', 'time')).toBe(60);
  });

  it('delegates digital conversions', () => {
    expect(convert(1, 'gb', 'mb', 'digital')).toBe(1024);
  });

  it('delegates pressure conversions', () => {
    expect(convert(1, 'atm', 'pa', 'pressure')).toBe(101325);
  });

  it('delegates energy conversions', () => {
    expect(convert(1, 'kwh', 'j', 'energy')).toBe(3600000);
  });

  it('delegates power conversions', () => {
    expect(convert(1, 'kw', 'w', 'power')).toBe(1000);
  });

  it('delegates angle conversions', () => {
    expect(convert(1, 'turn', 'deg', 'angle')).toBe(360);
  });

  it('delegates frequency conversions', () => {
    expect(convert(1, 'ghz', 'mhz', 'frequency')).toBe(1000);
  });

  it('delegates currency conversions', () => {
    expect(convert(1, 'USD', 'EUR', 'currency')).toBeCloseTo(0.92, 2);
  });

  it('throws for unknown type', () => {
    expect(() => convert(1, 'a', 'b', 'unknown' as any)).toThrow('Unknown unit type');
  });
});

// ==================== UNIT LISTS ====================

describe('unitLists', () => {
  const expectedCategories = [
    'length',
    'weight',
    'volume',
    'area',
    'speed',
    'time',
    'digital',
    'pressure',
    'energy',
    'power',
    'angle',
    'frequency',
    'currency',
    'temperature',
  ];

  it('has all expected category keys', () => {
    for (const cat of expectedCategories) {
      expect(unitLists).toHaveProperty(cat);
    }
  });

  it.each(expectedCategories)('%s list is a non-empty array', (cat) => {
    const list = unitLists[cat as keyof typeof unitLists];
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it('temperature list contains C, F, K, R', () => {
    expect(unitLists.temperature).toEqual(expect.arrayContaining(['C', 'F', 'K', 'R']));
  });

  it('length list contains m, km, mi, ft', () => {
    expect(unitLists.length).toEqual(expect.arrayContaining(['m', 'km', 'mi', 'ft']));
  });

  it('currency list contains USD, EUR, GBP', () => {
    expect(unitLists.currency).toEqual(expect.arrayContaining(['USD', 'EUR', 'GBP']));
  });
});

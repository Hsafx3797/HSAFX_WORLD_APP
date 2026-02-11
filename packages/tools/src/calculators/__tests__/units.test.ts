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
  unitConversions,
} from '../units';

// ==================== convertUnit ====================

describe('convertUnit', () => {
  // --- Length ---
  it('should convert meters to feet', () => {
    expect(convertUnit(1, 'meter', 'foot', 'length')).toBeCloseTo(3.28084, 3);
  });

  it('should convert feet to meters', () => {
    expect(convertUnit(1, 'foot', 'meter', 'length')).toBeCloseTo(0.3048, 3);
  });

  it('should convert kilometers to miles', () => {
    expect(convertUnit(1, 'kilometer', 'mile', 'length')).toBeCloseTo(0.621371, 3);
  });

  it('should convert miles to kilometers', () => {
    expect(convertUnit(1, 'mile', 'kilometer', 'length')).toBeCloseTo(1.60934, 3);
  });

  it('should convert meters to inches', () => {
    expect(convertUnit(1, 'meter', 'inch', 'length')).toBeCloseTo(39.3701, 2);
  });

  it('should convert centimeters to inches', () => {
    // 1 cm -> base = 1/100 = 0.01 m -> * 39.3701 = 0.393701
    expect(convertUnit(1, 'centimeter', 'inch', 'length')).toBeCloseTo(0.393701, 3);
  });

  it('should return same value when converting same unit', () => {
    expect(convertUnit(42, 'meter', 'meter', 'length')).toBeCloseTo(42, 5);
  });

  it('should handle zero value', () => {
    expect(convertUnit(0, 'meter', 'foot', 'length')).toBe(0);
  });

  it('should handle negative values for non-temperature', () => {
    // -10 meters to feet
    expect(convertUnit(-10, 'meter', 'foot', 'length')).toBeCloseTo(-32.8084, 2);
  });

  it('should convert large values', () => {
    expect(convertUnit(1000, 'meter', 'kilometer', 'length')).toBeCloseTo(1, 5);
  });

  // --- Weight ---
  it('should convert kilograms to pounds', () => {
    expect(convertUnit(1, 'kilogram', 'pound', 'weight')).toBeCloseTo(2.20462, 3);
  });

  it('should convert pounds to kilograms', () => {
    expect(convertUnit(1, 'pound', 'kilogram', 'weight')).toBeCloseTo(0.45359, 3);
  });

  it('should convert kilograms to grams', () => {
    expect(convertUnit(1, 'kilogram', 'gram', 'weight')).toBeCloseTo(1000, 0);
  });

  it('should convert ounces to grams', () => {
    // 1 oz -> base = 1/35.274 kg -> * 1000 g/kg
    expect(convertUnit(1, 'ounce', 'gram', 'weight')).toBeCloseTo(28.3495, 1);
  });

  it('should convert stone to kilograms', () => {
    // 1 stone -> base = 1/0.157473 = 6.35029 kg
    expect(convertUnit(1, 'stone', 'kilogram', 'weight')).toBeCloseTo(6.35029, 1);
  });

  // --- Temperature ---
  it('should convert 0°C to 32°F', () => {
    expect(convertUnit(0, 'celsius', 'fahrenheit', 'temperature')).toBeCloseTo(32, 2);
  });

  it('should convert 100°C to 212°F', () => {
    expect(convertUnit(100, 'celsius', 'fahrenheit', 'temperature')).toBeCloseTo(212, 2);
  });

  it('should convert 32°F to 0°C', () => {
    expect(convertUnit(32, 'fahrenheit', 'celsius', 'temperature')).toBeCloseTo(0, 2);
  });

  it('should convert 212°F to 100°C', () => {
    expect(convertUnit(212, 'fahrenheit', 'celsius', 'temperature')).toBeCloseTo(100, 2);
  });

  it('should convert 0°C to 273.15K', () => {
    expect(convertUnit(0, 'celsius', 'kelvin', 'temperature')).toBeCloseTo(273.15, 2);
  });

  it('should convert 273.15K to 0°C', () => {
    expect(convertUnit(273.15, 'kelvin', 'celsius', 'temperature')).toBeCloseTo(0, 2);
  });

  it('should convert -40°C to -40°F (crossover point)', () => {
    expect(convertUnit(-40, 'celsius', 'fahrenheit', 'temperature')).toBeCloseTo(-40, 2);
  });

  it('should convert celsius to rankine', () => {
    // 0°C -> (0+273.15)*1.8 = 491.67
    expect(convertUnit(0, 'celsius', 'rankine', 'temperature')).toBeCloseTo(491.67, 1);
  });

  it('should convert rankine to fahrenheit', () => {
    // 491.67 R -> celsius = (491.67-491.67)*5/9 = 0 -> fahrenheit = 0*9/5+32 = 32
    expect(convertUnit(491.67, 'rankine', 'fahrenheit', 'temperature')).toBeCloseTo(32, 1);
  });

  it('should convert celsius to reaumur', () => {
    // 100°C -> 100 * 0.8 = 80 Re
    expect(convertUnit(100, 'celsius', 'reaumur', 'temperature')).toBeCloseTo(80, 2);
  });

  it('should convert reaumur to celsius', () => {
    // 80 Re -> celsius = 80 * 1.25 = 100
    expect(convertUnit(80, 'reaumur', 'celsius', 'temperature')).toBeCloseTo(100, 2);
  });

  // --- Volume ---
  it('should convert liters to gallons', () => {
    expect(convertUnit(1, 'liter', 'gallon', 'volume')).toBeCloseTo(0.264172, 3);
  });

  it('should convert gallons to liters', () => {
    expect(convertUnit(1, 'gallon', 'liter', 'volume')).toBeCloseTo(3.78541, 2);
  });

  it('should convert liters to milliliters', () => {
    expect(convertUnit(1, 'liter', 'milliliter', 'volume')).toBeCloseTo(1000, 0);
  });

  // --- Area ---
  it('should convert square meters to square feet', () => {
    expect(convertUnit(1, 'squareMeter', 'squareFoot', 'area')).toBeCloseTo(10.7639, 2);
  });

  it('should convert acres to hectares', () => {
    // 1 acre -> base = 1/0.000247105 sqm -> * 0.0001 = 0.4047 hectare
    expect(convertUnit(1, 'acre', 'hectare', 'area')).toBeCloseTo(0.4047, 2);
  });

  // --- Speed ---
  it('should convert m/s to km/h', () => {
    expect(convertUnit(1, 'meterPerSecond', 'kilometerPerHour', 'speed')).toBeCloseTo(3.6, 2);
  });

  it('should convert m/s to mph', () => {
    expect(convertUnit(1, 'meterPerSecond', 'milePerHour', 'speed')).toBeCloseTo(2.23694, 3);
  });

  // --- Data ---
  it('should convert bytes to kilobytes', () => {
    expect(convertUnit(1000, 'byte', 'kilobyte', 'data')).toBeCloseTo(1, 2);
  });

  it('should convert megabytes to bytes', () => {
    expect(convertUnit(1, 'megabyte', 'byte', 'data')).toBeCloseTo(1000000, 0);
  });

  // --- Time ---
  it('should convert hours to minutes', () => {
    // 1 hour -> base = 1 / (1/3600) = 3600 seconds -> * (1/60) = 60 minutes
    expect(convertUnit(1, 'hour', 'minute', 'time')).toBeCloseTo(60, 2);
  });

  it('should convert days to hours', () => {
    // 1 day -> base = 86400 seconds -> * (1/3600) = 24 hours
    expect(convertUnit(1, 'day', 'hour', 'time')).toBeCloseTo(24, 2);
  });

  // --- Pressure ---
  it('should convert atmospheres to psi', () => {
    // 1 atm -> base = 1/0.00000986923 Pa -> * 0.000145038 = ~14.696 psi
    expect(convertUnit(1, 'atmosphere', 'psi', 'pressure')).toBeCloseTo(14.696, 0);
  });

  // --- Energy ---
  it('should convert kilocalories to joules', () => {
    // 1 kcal -> base = 1/0.000239006 J -> * 1 = ~4184 J
    expect(convertUnit(1, 'kilocalorie', 'joule', 'energy')).toBeCloseTo(4184, 0);
  });

  // --- Power ---
  it('should convert horsepower to watts', () => {
    // 1 hp -> base = 1/0.00134102 W -> * 1 = ~745.7 W
    expect(convertUnit(1, 'horsepower', 'watt', 'power')).toBeCloseTo(745.7, 0);
  });

  // --- Angle ---
  it('should convert degrees to radians', () => {
    // 180° -> base = 180/1 deg -> * 0.0174533 = ~3.14159
    expect(convertUnit(180, 'degree', 'radian', 'angle')).toBeCloseTo(Math.PI, 3);
  });

  // --- Force ---
  it('should convert newtons to pound-force', () => {
    expect(convertUnit(1, 'newton', 'poundForce', 'force')).toBeCloseTo(0.224809, 3);
  });

  // --- Error handling ---
  it('should throw error for invalid fromUnit', () => {
    expect(() => convertUnit(1, 'invalid', 'meter', 'length')).toThrow('Invalid unit');
  });

  it('should throw error for invalid toUnit', () => {
    expect(() => convertUnit(1, 'meter', 'invalid', 'length')).toThrow('Invalid unit');
  });

  it('should throw error when both units are invalid', () => {
    expect(() => convertUnit(1, 'foo', 'bar', 'length')).toThrow('Invalid unit');
  });
});

// ==================== getUnitsForCategory ====================

describe('getUnitsForCategory', () => {
  it('should return all length units', () => {
    const units = getUnitsForCategory('length');
    expect(units).toContain('meter');
    expect(units).toContain('kilometer');
    expect(units).toContain('foot');
    expect(units).toContain('mile');
    expect(units).toContain('inch');
    expect(units).toContain('yard');
    expect(units).toContain('nauticalMile');
    expect(units).toHaveLength(10);
  });

  it('should return all weight units', () => {
    const units = getUnitsForCategory('weight');
    expect(units).toContain('kilogram');
    expect(units).toContain('pound');
    expect(units).toContain('ounce');
    expect(units).toContain('gram');
    expect(units).toHaveLength(10);
  });

  it('should return all temperature units', () => {
    const units = getUnitsForCategory('temperature');
    expect(units).toContain('celsius');
    expect(units).toContain('fahrenheit');
    expect(units).toContain('kelvin');
    expect(units).toContain('rankine');
    expect(units).toContain('reaumur');
    expect(units).toHaveLength(5);
  });

  it('should return all volume units', () => {
    const units = getUnitsForCategory('volume');
    expect(units).toContain('liter');
    expect(units).toContain('gallon');
    expect(units).toContain('milliliter');
    expect(units).toHaveLength(10);
  });

  it('should return all area units', () => {
    const units = getUnitsForCategory('area');
    expect(units).toContain('squareMeter');
    expect(units).toContain('acre');
    expect(units).toContain('hectare');
    expect(units).toHaveLength(10);
  });

  it('should return all speed units', () => {
    const units = getUnitsForCategory('speed');
    expect(units).toContain('meterPerSecond');
    expect(units).toContain('kilometerPerHour');
    expect(units).toHaveLength(6);
  });

  it('should return all time units', () => {
    const units = getUnitsForCategory('time');
    expect(units).toContain('second');
    expect(units).toContain('minute');
    expect(units).toContain('hour');
    expect(units).toContain('day');
    expect(units).toHaveLength(11);
  });

  it('should return only strings', () => {
    const units = getUnitsForCategory('length');
    units.forEach(u => expect(typeof u).toBe('string'));
  });
});

// ==================== getAllCategories ====================

describe('getAllCategories', () => {
  it('should return an array', () => {
    expect(Array.isArray(getAllCategories())).toBe(true);
  });

  it('should return 24 categories', () => {
    expect(getAllCategories()).toHaveLength(24);
  });

  it('should contain core categories', () => {
    const categories = getAllCategories();
    expect(categories).toContain('length');
    expect(categories).toContain('weight');
    expect(categories).toContain('temperature');
    expect(categories).toContain('volume');
    expect(categories).toContain('area');
    expect(categories).toContain('speed');
    expect(categories).toContain('time');
  });

  it('should contain specialized categories', () => {
    const categories = getAllCategories();
    expect(categories).toContain('pressure');
    expect(categories).toContain('energy');
    expect(categories).toContain('power');
    expect(categories).toContain('frequency');
    expect(categories).toContain('force');
    expect(categories).toContain('torque');
    expect(categories).toContain('angle');
  });

  it('should contain niche categories', () => {
    const categories = getAllCategories();
    expect(categories).toContain('cooking');
    expect(categories).toContain('paperSize');
    expect(categories).toContain('radiation');
    expect(categories).toContain('density');
    expect(categories).toContain('illumination');
    expect(categories).toContain('magnetic');
    expect(categories).toContain('fuelConsumption');
  });

  it('should match keys of unitConversions', () => {
    expect(getAllCategories()).toEqual(Object.keys(unitConversions));
  });
});

// ==================== Convenience Wrappers ====================

describe('metersToFeet', () => {
  it('should convert 1 meter to ~3.28084 feet', () => {
    expect(metersToFeet(1)).toBeCloseTo(3.28084, 3);
  });

  it('should convert 0 meters to 0 feet', () => {
    expect(metersToFeet(0)).toBe(0);
  });

  it('should convert 10 meters to ~32.8084 feet', () => {
    expect(metersToFeet(10)).toBeCloseTo(32.8084, 2);
  });
});

describe('feetToMeters', () => {
  it('should convert 1 foot to ~0.3048 meters', () => {
    expect(feetToMeters(1)).toBeCloseTo(0.3048, 3);
  });

  it('should convert 3.28084 feet to ~1 meter', () => {
    expect(feetToMeters(3.28084)).toBeCloseTo(1, 3);
  });
});

describe('poundsToKilograms', () => {
  it('should convert 1 pound to ~0.4536 kg', () => {
    expect(poundsToKilograms(1)).toBeCloseTo(0.4536, 3);
  });

  it('should convert 2.20462 pounds to ~1 kg', () => {
    expect(poundsToKilograms(2.20462)).toBeCloseTo(1, 3);
  });
});

describe('kilogramsToPounds', () => {
  it('should convert 1 kg to ~2.20462 pounds', () => {
    expect(kilogramsToPounds(1)).toBeCloseTo(2.20462, 3);
  });

  it('should convert 0 kg to 0 pounds', () => {
    expect(kilogramsToPounds(0)).toBe(0);
  });
});

describe('celsiusToFahrenheit', () => {
  it('should convert 0°C to 32°F', () => {
    expect(celsiusToFahrenheit(0)).toBeCloseTo(32, 2);
  });

  it('should convert 100°C to 212°F', () => {
    expect(celsiusToFahrenheit(100)).toBeCloseTo(212, 2);
  });

  it('should convert -40°C to -40°F', () => {
    expect(celsiusToFahrenheit(-40)).toBeCloseTo(-40, 2);
  });
});

describe('fahrenheitToCelsius', () => {
  it('should convert 32°F to 0°C', () => {
    expect(fahrenheitToCelsius(32)).toBeCloseTo(0, 2);
  });

  it('should convert 212°F to 100°C', () => {
    expect(fahrenheitToCelsius(212)).toBeCloseTo(100, 2);
  });

  it('should convert -40°F to -40°C', () => {
    expect(fahrenheitToCelsius(-40)).toBeCloseTo(-40, 2);
  });
});

describe('milesToKilometers', () => {
  it('should convert 1 mile to ~1.60934 km', () => {
    expect(milesToKilometers(1)).toBeCloseTo(1.60934, 3);
  });

  it('should convert 0 miles to 0 km', () => {
    expect(milesToKilometers(0)).toBe(0);
  });
});

describe('kilometersToMiles', () => {
  it('should convert 1 km to ~0.621371 miles', () => {
    expect(kilometersToMiles(1)).toBeCloseTo(0.621371, 3);
  });

  it('should convert 1.60934 km to ~1 mile', () => {
    expect(kilometersToMiles(1.60934)).toBeCloseTo(1, 3);
  });
});

describe('litersToGallons', () => {
  it('should convert 1 liter to ~0.264172 gallons', () => {
    expect(litersToGallons(1)).toBeCloseTo(0.264172, 3);
  });

  it('should convert 0 liters to 0 gallons', () => {
    expect(litersToGallons(0)).toBe(0);
  });
});

describe('gallonsToLiters', () => {
  it('should convert 1 gallon to ~3.78541 liters', () => {
    expect(gallonsToLiters(1)).toBeCloseTo(3.78541, 2);
  });

  it('should convert 0 gallons to 0 liters', () => {
    expect(gallonsToLiters(0)).toBe(0);
  });
});

// ==================== Round-trip conversions ====================

describe('round-trip conversions', () => {
  it('should round-trip meters -> feet -> meters', () => {
    const original = 7.5;
    const converted = feetToMeters(metersToFeet(original));
    expect(converted).toBeCloseTo(original, 3);
  });

  it('should round-trip celsius -> fahrenheit -> celsius', () => {
    const original = 37;
    const converted = fahrenheitToCelsius(celsiusToFahrenheit(original));
    expect(converted).toBeCloseTo(original, 3);
  });

  it('should round-trip kilograms -> pounds -> kilograms', () => {
    const original = 80;
    const converted = poundsToKilograms(kilogramsToPounds(original));
    expect(converted).toBeCloseTo(original, 3);
  });

  it('should round-trip miles -> kilometers -> miles', () => {
    const original = 26.2;
    const converted = kilometersToMiles(milesToKilometers(original));
    expect(converted).toBeCloseTo(original, 2);
  });

  it('should round-trip liters -> gallons -> liters', () => {
    const original = 10;
    const converted = gallonsToLiters(litersToGallons(original));
    expect(converted).toBeCloseTo(original, 2);
  });
});

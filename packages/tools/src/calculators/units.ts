/**
 * Unit Conversion Library
 * Comprehensive unit conversions across all common categories
 */

// ==================== CONVERSION FACTORS ====================

export const unitConversions = {
  // Length
  length: {
    meter: 1,
    kilometer: 0.001,
    centimeter: 100,
    millimeter: 1000,
    mile: 0.000621371,
    yard: 1.09361,
    foot: 3.28084,
    inch: 39.3701,
    nauticalMile: 0.000539957,
    lightYear: 1.057e-16,
  },
  
  // Weight/Mass
  weight: {
    kilogram: 1,
    gram: 1000,
    milligram: 1000000,
    pound: 2.20462,
    ounce: 35.274,
    ton: 0.001,
    tonne: 0.001,
    stone: 0.157473,
    troyOunce: 32.1507,
    carat: 5000,
  },
  
  // Temperature (special handling required)
  temperature: {
    celsius: (c: number) => c,
    fahrenheit: (c: number) => (c * 9/5) + 32,
    kelvin: (c: number) => c + 273.15,
    rankine: (c: number) => (c + 273.15) * 1.8,
    reaumur: (c: number) => c * 0.8,
  },
  
  // Volume
  volume: {
    liter: 1,
    milliliter: 1000,
    cubicMeter: 0.001,
    gallon: 0.264172,
    quart: 1.05669,
    pint: 2.11338,
    cup: 4.22675,
    fluidOunce: 33.814,
    tablespoon: 67.628,
    teaspoon: 202.884,
  },
  
  // Area
  area: {
    squareMeter: 1,
    squareKilometer: 0.000001,
    squareFoot: 10.7639,
    squareYard: 1.19599,
    acre: 0.000247105,
    hectare: 0.0001,
    squareInch: 1550,
    squareMile: 3.861e-7,
    squareCentimeter: 10000,
    squareMillimeter: 1000000,
  },
  
  // Speed
  speed: {
    meterPerSecond: 1,
    kilometerPerHour: 3.6,
    milePerHour: 2.23694,
    knot: 1.94384,
    footPerSecond: 3.28084,
    mach: 0.00293858,
  },
  
  // Data (bytes)
  data: {
    byte: 1,
    kilobyte: 0.001,
    megabyte: 0.000001,
    gigabyte: 0.000000001,
    terabyte: 0.000000000001,
    bit: 8,
    kilobit: 0.008,
    megabit: 0.000008,
  },
  
  // Time
  time: {
    second: 1,
    millisecond: 1000,
    microsecond: 1000000,
    nanosecond: 1000000000,
    minute: 1/60,
    hour: 1/3600,
    day: 1/86400,
    week: 1/604800,
    month: 1/2592000,
    year: 1/31536000,
    decade: 1/315360000,
  },
  
  // Pressure
  pressure: {
    pascal: 1,
    kilopascal: 0.001,
    bar: 0.00001,
    psi: 0.000145038,
    atmosphere: 0.00000986923,
    mmHg: 0.00750062,
    torr: 0.00750062,
  },
  
  // Energy
  energy: {
    joule: 1,
    kilojoule: 0.001,
    calorie: 0.239006,
    kilocalorie: 0.000239006,
    wattHour: 0.000277778,
    kilowattHour: 0.000000277778,
    electronvolt: 6.242e+18,
    btu: 0.000947817,
    footPound: 0.737562,
  },
  
  // Power
  power: {
    watt: 1,
    kilowatt: 0.001,
    megawatt: 0.000001,
    horsepower: 0.00134102,
    btuPerHour: 3.41214,
    footPoundPerSecond: 0.737562,
  },
  
  // Frequency
  frequency: {
    hertz: 1,
    kilohertz: 0.001,
    megahertz: 0.000001,
    gigahertz: 0.000000001,
    rpm: 60,
  },
  
  // Data Storage (binary)
  dataStorage: {
    byte: 1,
    kilobyte: 1/1000,
    megabyte: 1/1000000,
    gigabyte: 1/1000000000,
    terabyte: 1/1000000000000,
    petabyte: 1/1000000000000000,
    kibibyte: 1/1024,
    mebibyte: 1/1048576,
    gibibyte: 1/1073741824,
    bit: 8,
  },
  
  // Electric
  electric: {
    ampere: 1,
    milliampere: 1000,
    microampere: 1000000,
    volt: 1,
    millivolt: 1000,
    kilovolt: 0.001,
    ohm: 1,
    kilohm: 0.001,
    megohm: 0.000001,
  },
  
  // Angle
  angle: {
    degree: 1,
    radian: 0.0174533,
    gradian: 1.11111,
    turn: 0.00277778,
    arcMinute: 60,
    arcSecond: 3600,
  },
  
  // Force
  force: {
    newton: 1,
    kilonewton: 0.001,
    poundForce: 0.224809,
    kilogramForce: 0.101972,
    dyne: 100000,
  },
  
  // Torque
  torque: {
    newtonMeter: 1,
    kilonewtonMeter: 0.001,
    footPound: 0.737562,
    inchPound: 8.85075,
  },
  
  // Fuel Consumption
  fuelConsumption: {
    kilometerPerLiter: 1,
    milePerGallon: 2.35215,
    literPer100km: 100,
    gallonPer100miles: 62.1371,
  },
  
  // Radiation
  radiation: {
    becquerel: 1,
    curie: 2.7e-11,
    gray: 1,
    sievert: 1,
    roentgen: 258,
  },
  
  // Density
  density: {
    kilogramPerCubicMeter: 1,
    gramPerCubicCentimeter: 0.001,
    poundPerCubicFoot: 0.0624279,
    specificGravity: 0.001,
  },
  
  // Illumination
  illumination: {
    lux: 1,
    lumen: 1,
    candela: 1,
    footCandle: 0.0929030,
  },
  
  // Magnetic
  magnetic: {
    tesla: 1,
    gauss: 10000,
    weber: 1,
    maxwell: 100000000,
    henry: 1,
  },
  
  // Cooking
  cooking: {
    cup: 1,
    tablespoon: 16,
    teaspoon: 48,
    fluidOunce: 8,
    milliliter: 236.588,
    liter: 0.236588,
    stick: 2, // sticks of butter
  },
  
  // Paper Size (in mm width)
  paperSize: {
    a0: 841,
    a1: 594,
    a2: 420,
    a3: 297,
    a4: 210,
    a5: 148,
    a6: 105,
    letter: 216,
    legal: 216,
    tabloid: 279,
    points: 0.352778,
    picas: 4.23333,
  },
};

export type UnitCategory = keyof typeof unitConversions;

// ==================== CONVERSION FUNCTION ====================

export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
  category: UnitCategory
): number {
  const conversions = unitConversions[category];
  
  if (category === 'temperature') {
    // Special handling for temperature
    const tempConversions = conversions as { 
      celsius: (c: number) => number; 
      fahrenheit: (c: number) => number; 
      kelvin: (c: number) => number;
      rankine: (c: number) => number;
      reaumur: (c: number) => number;
    };
    
    // First convert to Celsius
    let celsius: number;
    switch (fromUnit) {
      case 'fahrenheit': celsius = (value - 32) * 5/9; break;
      case 'kelvin': celsius = value - 273.15; break;
      case 'rankine': celsius = (value - 491.67) * 5/9; break;
      case 'reaumur': celsius = value * 1.25; break;
      default: celsius = value;
    }
    
    // Then convert from Celsius to target
    return tempConversions[toUnit as keyof typeof tempConversions](celsius);
  }
  
  // For other conversions
  const factors = conversions as Record<string, number>;
  const fromFactor = factors[fromUnit];
  const toFactor = factors[toUnit];
  
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Invalid unit: ${fromUnit} or ${toUnit}`);
  }
  
  const baseValue = value / fromFactor;
  return baseValue * toFactor;
}

// ==================== UNIT LISTS ====================

export function getUnitsForCategory(category: UnitCategory): string[] {
  const conversions = unitConversions[category];
  return Object.keys(conversions);
}

export function getAllCategories(): UnitCategory[] {
  return Object.keys(unitConversions) as UnitCategory[];
}

// ==================== COMMON CONVERSIONS ====================

export function metersToFeet(meters: number): number {
  return convertUnit(meters, 'meter', 'foot', 'length');
}

export function feetToMeters(feet: number): number {
  return convertUnit(feet, 'foot', 'meter', 'length');
}

export function poundsToKilograms(pounds: number): number {
  return convertUnit(pounds, 'pound', 'kilogram', 'weight');
}

export function kilogramsToPounds(kilograms: number): number {
  return convertUnit(kilograms, 'kilogram', 'pound', 'weight');
}

export function celsiusToFahrenheit(celsius: number): number {
  return convertUnit(celsius, 'celsius', 'fahrenheit', 'temperature');
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return convertUnit(fahrenheit, 'fahrenheit', 'celsius', 'temperature');
}

export function milesToKilometers(miles: number): number {
  return convertUnit(miles, 'mile', 'kilometer', 'length');
}

export function kilometersToMiles(kilometers: number): number {
  return convertUnit(kilometers, 'kilometer', 'mile', 'length');
}

export function litersToGallons(liters: number): number {
  return convertUnit(liters, 'liter', 'gallon', 'volume');
}

export function gallonsToLiters(gallons: number): number {
  return convertUnit(gallons, 'gallon', 'liter', 'volume');
}

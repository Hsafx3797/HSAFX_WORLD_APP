/**
 * Unit Converter Library
 * Comprehensive unit conversions for various measurement types
 */

// ==================== LENGTH ====================

const lengthUnits: Record<string, number> = {
  // Metric
  m: 1,
  km: 1000,
  cm: 0.01,
  mm: 0.001,
  μm: 1e-6,
  nm: 1e-9,
  pm: 1e-12,
  // Imperial
  mi: 1609.344,
  yd: 0.9144,
  ft: 0.3048,
  in: 0.0254,
  // Nautical
  nmi: 1852,
  // Astronomical
  au: 149597870700,
  ly: 9.4607e15,
  pc: 3.0857e16,
};

export function convertLength(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = lengthUnits[from.toLowerCase()];
  const toFactor = lengthUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown length unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== WEIGHT/MASS ====================

const weightUnits: Record<string, number> = {
  // Metric
  kg: 1,
  g: 0.001,
  mg: 1e-6,
  μg: 1e-9,
  t: 1000, // metric ton
  // Imperial
  lb: 0.453592,
  oz: 0.0283495,
  st: 6.35029, // stone
  // Other
  ct: 0.0002, // carat
  gr: 0.0000648, // grain
};

export function convertWeight(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = weightUnits[from.toLowerCase()];
  const toFactor = weightUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown weight unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== TEMPERATURE ====================

export function convertTemperature(
  value: number,
  from: string,
  to: string
): number {
  // Convert to Celsius first
  let celsius: number;
  
  switch (from.toUpperCase()) {
    case 'C':
    case 'CELSIUS':
      celsius = value;
      break;
    case 'F':
    case 'FAHRENHEIT':
      celsius = (value - 32) * 5 / 9;
      break;
    case 'K':
    case 'KELVIN':
      celsius = value - 273.15;
      break;
    case 'R':
    case 'RANKINE':
      celsius = (value - 491.67) * 5 / 9;
      break;
    default:
      throw new Error(`Unknown temperature unit: ${from}`);
  }
  
  // Convert from Celsius to target
  switch (to.toUpperCase()) {
    case 'C':
    case 'CELSIUS':
      return celsius;
    case 'F':
    case 'FAHRENHEIT':
      return celsius * 9 / 5 + 32;
    case 'K':
    case 'KELVIN':
      return celsius + 273.15;
    case 'R':
    case 'RANKINE':
      return (celsius + 273.15) * 9 / 5;
    default:
      throw new Error(`Unknown temperature unit: ${to}`);
  }
}

// ==================== VOLUME ====================

const volumeUnits: Record<string, number> = {
  // Metric
  l: 1,
  ml: 0.001,
  cl: 0.01,
  dl: 0.1,
  m3: 1000,
  cm3: 0.001,
  mm3: 1e-6,
  // US
  gal: 3.78541,
  qt: 0.946353,
  pt: 0.473176,
  cup: 0.236588,
  'fl oz': 0.0295735,
  tbsp: 0.0147868,
  tsp: 0.00492892,
  // Imperial
  'imp gal': 4.54609,
  'imp qt': 1.13652,
  'imp pt': 0.568261,
  'imp fl oz': 0.0284131,
};

export function convertVolume(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = volumeUnits[from.toLowerCase()];
  const toFactor = volumeUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown volume unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== AREA ====================

const areaUnits: Record<string, number> = {
  // Metric
  'm2': 1,
  'km2': 1e6,
  'cm2': 0.0001,
  'mm2': 1e-6,
  ha: 10000,
  a: 100, // are
  // Imperial
  'mi2': 2589988.11,
  'yd2': 0.836127,
  'ft2': 0.092903,
  'in2': 0.00064516,
  ac: 4046.86, // acre
};

export function convertArea(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = areaUnits[from.toLowerCase()];
  const toFactor = areaUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown area unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== SPEED ====================

const speedUnits: Record<string, number> = {
  'm/s': 1,
  'km/h': 0.277778,
  'km/s': 1000,
  mph: 0.44704,
  fps: 0.3048,
  kn: 0.514444, // knots
  mach: 340.29, // at sea level
  c: 299792458, // speed of light
};

export function convertSpeed(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = speedUnits[from.toLowerCase()];
  const toFactor = speedUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown speed unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== TIME ====================

const timeUnits: Record<string, number> = {
  s: 1,
  ms: 0.001,
  μs: 1e-6,
  ns: 1e-9,
  min: 60,
  h: 3600,
  d: 86400,
  wk: 604800,
  mo: 2629746, // average month
  yr: 31556952, // average year
  decade: 315569520,
  century: 3155695200,
};

export function convertTime(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = timeUnits[from.toLowerCase()];
  const toFactor = timeUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown time unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== DIGITAL STORAGE ====================

const digitalUnits: Record<string, number> = {
  b: 1, // bytes
  kb: 1024,
  mb: 1024 ** 2,
  gb: 1024 ** 3,
  tb: 1024 ** 4,
  pb: 1024 ** 5,
  eb: 1024 ** 6,
  // SI units
  kib: 1024,
  mib: 1024 ** 2,
  gib: 1024 ** 3,
  tib: 1024 ** 4,
  pib: 1024 ** 5,
  // Bits
  bit: 0.125,
  kbit: 128,
  mbit: 131072,
  gbit: 134217728,
};

export function convertDigital(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = digitalUnits[from.toLowerCase()];
  const toFactor = digitalUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown digital unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== PRESSURE ====================

const pressureUnits: Record<string, number> = {
  pa: 1,
  kpa: 1000,
  mpa: 1e6,
  bar: 100000,
  mbar: 100,
  atm: 101325,
  psi: 6894.76,
  torr: 133.322,
  mmhg: 133.322,
  inhg: 3386.39,
};

export function convertPressure(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = pressureUnits[from.toLowerCase()];
  const toFactor = pressureUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown pressure unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== ENERGY ====================

const energyUnits: Record<string, number> = {
  j: 1,
  kj: 1000,
  mj: 1e6,
  gj: 1e9,
  cal: 4.184,
  kcal: 4184,
  wh: 3600,
  kwh: 3.6e6,
  mwh: 3.6e9,
  ev: 1.60218e-19,
  btu: 1055.06,
  'ft-lb': 1.35582,
};

export function convertEnergy(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = energyUnits[from.toLowerCase()];
  const toFactor = energyUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown energy unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== POWER ====================

const powerUnits: Record<string, number> = {
  w: 1,
  kw: 1000,
  mw: 1e6,
  gw: 1e9,
  hp: 745.7, // mechanical horsepower
  'hp(m)': 735.5, // metric horsepower
  'btu/h': 0.293071,
  'ft-lb/s': 1.35582,
};

export function convertPower(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = powerUnits[from.toLowerCase()];
  const toFactor = powerUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown power unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== ANGLE ====================

const angleUnits: Record<string, number> = {
  deg: 1,
  rad: 57.2958,
  grad: 0.9,
  arcmin: 1/60,
  arcsec: 1/3600,
  turn: 360,
};

export function convertAngle(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = angleUnits[from.toLowerCase()];
  const toFactor = angleUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown angle unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== FREQUENCY ====================

const frequencyUnits: Record<string, number> = {
  hz: 1,
  khz: 1000,
  mhz: 1e6,
  ghz: 1e9,
  thz: 1e12,
  rpm: 1/60,
};

export function convertFrequency(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = frequencyUnits[from.toLowerCase()];
  const toFactor = frequencyUnits[to.toLowerCase()];
  
  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown frequency unit: ${!fromFactor ? from : to}`);
  }
  
  return (value * fromFactor) / toFactor;
}

// ==================== CURRENCY (placeholder rates) ====================

// Note: In production, these should be fetched from a real-time API
const currencyRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  CNY: 7.24,
  INR: 83.12,
  AUD: 1.53,
  CAD: 1.36,
  SGD: 1.34,
  AED: 3.67,
  SAR: 3.75,
  MYR: 4.72,
};

export function convertCurrency(
  value: number,
  from: string,
  to: string
): number {
  const fromRate = currencyRates[from.toUpperCase()];
  const toRate = currencyRates[to.toUpperCase()];
  
  if (!fromRate || !toRate) {
    throw new Error(`Unknown currency: ${!fromRate ? from : to}`);
  }
  
  return (value / fromRate) * toRate;
}

// ==================== UNIFIED CONVERTER ====================

export type UnitType = 
  | 'length' 
  | 'weight' 
  | 'temperature' 
  | 'volume' 
  | 'area' 
  | 'speed' 
  | 'time' 
  | 'digital' 
  | 'pressure' 
  | 'energy' 
  | 'power' 
  | 'angle' 
  | 'frequency' 
  | 'currency';

export function convert(
  value: number,
  from: string,
  to: string,
  type: UnitType
): number {
  switch (type) {
    case 'length':
      return convertLength(value, from, to);
    case 'weight':
      return convertWeight(value, from, to);
    case 'temperature':
      return convertTemperature(value, from, to);
    case 'volume':
      return convertVolume(value, from, to);
    case 'area':
      return convertArea(value, from, to);
    case 'speed':
      return convertSpeed(value, from, to);
    case 'time':
      return convertTime(value, from, to);
    case 'digital':
      return convertDigital(value, from, to);
    case 'pressure':
      return convertPressure(value, from, to);
    case 'energy':
      return convertEnergy(value, from, to);
    case 'power':
      return convertPower(value, from, to);
    case 'angle':
      return convertAngle(value, from, to);
    case 'frequency':
      return convertFrequency(value, from, to);
    case 'currency':
      return convertCurrency(value, from, to);
    default:
      throw new Error(`Unknown unit type: ${type}`);
  }
}

// Export unit lists for UI
export const unitLists = {
  length: Object.keys(lengthUnits),
  weight: Object.keys(weightUnits),
  volume: Object.keys(volumeUnits),
  area: Object.keys(areaUnits),
  speed: Object.keys(speedUnits),
  time: Object.keys(timeUnits),
  digital: Object.keys(digitalUnits),
  pressure: Object.keys(pressureUnits),
  energy: Object.keys(energyUnits),
  power: Object.keys(powerUnits),
  angle: Object.keys(angleUnits),
  frequency: Object.keys(frequencyUnits),
  currency: Object.keys(currencyRates),
  temperature: ['C', 'F', 'K', 'R'],
};

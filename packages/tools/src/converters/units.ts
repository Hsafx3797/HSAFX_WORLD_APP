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

// ==================== CURRENCY (static reference rates) ====================

/**
 * Static exchange rates relative to USD = 1.
 * These are approximate mid-market rates and are NOT live.
 * For live rates, supply your own via the customRates parameter.
 */
export const CURRENCY_RATES_DATE = '2025-01-15';

const currencyRates: Record<string, number> = {
  // Major
  USD: 1,
  EUR: 0.97,
  GBP: 0.82,
  JPY: 156.0,
  CHF: 0.91,
  // Asia-Pacific
  CNY: 7.33,
  INR: 86.0,
  AUD: 1.61,
  SGD: 1.37,
  HKD: 7.82,
  KRW: 1450,
  TWD: 32.7,
  THB: 34.5,
  MYR: 4.50,
  PHP: 58.0,
  IDR: 16200,
  VND: 25400,
  // Americas
  CAD: 1.44,
  BRL: 6.10,
  MXN: 20.5,
  ARS: 1050,
  CLP: 1000,
  COP: 4350,
  // Middle East & Africa
  AED: 3.6725,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.377,
  OMR: 0.385,
  EGP: 50.5,
  ZAR: 18.5,
  NGN: 1550,
  KES: 154,
  // Europe (non-EUR)
  SEK: 11.1,
  NOK: 11.4,
  DKK: 7.22,
  PLN: 4.15,
  CZK: 24.2,
  HUF: 405,
  RON: 4.82,
  TRY: 35.5,
  RUB: 102,
  UAH: 41.5,
  // Crypto-adjacent stablecoins (pegged)
  USDT: 1,
  USDC: 1,
  // Precious metals (troy oz in USD)
  XAU: 0.000378,
  XAG: 0.0328,
};

export function convertCurrency(
  value: number,
  from: string,
  to: string,
  customRates?: Record<string, number>
): number {
  const rates = customRates || currencyRates;
  const fromRate = rates[from.toUpperCase()];
  const toRate = rates[to.toUpperCase()];
  
  if (fromRate === undefined || !fromRate) {
    throw new Error(`Unknown currency: ${from}. Available: ${Object.keys(rates).join(', ')}`);
  }
  if (toRate === undefined) {
    throw new Error(`Unknown currency: ${to}. Available: ${Object.keys(rates).join(', ')}`);
  }
  
  return (value / fromRate) * toRate;
}

// ==================== UNIFIED CONVERTER ====================

// ==================== ELECTRIC (Current) ====================

const electricUnits: Record<string, number> = {
  a: 1,           // ampere
  ka: 1e3,        // kiloampere
  ma: 1e-3,       // milliampere
  'µa': 1e-6,     // microampere
  na: 1e-9,       // nanoampere
  pa: 1e-12,      // picoampere
};

export function convertElectric(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = electricUnits[from.toLowerCase()];
  const toFactor = electricUnits[to.toLowerCase()];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown electric current unit: ${fromFactor === undefined ? from : to}. Available: ${Object.keys(electricUnits).join(', ')}`);
  }
  return (value * fromFactor) / toFactor;
}

// ==================== FORCE ====================

const forceUnits: Record<string, number> = {
  n: 1,            // Newton (base)
  kn: 1000,        // kilonewton
  mn: 0.001,       // millinewton
  dyn: 1e-5,       // dyne
  lbf: 4.44822,    // pound-force
  kgf: 9.80665,    // kilogram-force
  ozf: 0.278014,   // ounce-force
  pdl: 0.138255,   // poundal
  kip: 4448.22,    // kilopound-force
  tf: 9806.65,     // tonne-force (metric)
};

export function convertForce(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = forceUnits[from.toLowerCase()];
  const toFactor = forceUnits[to.toLowerCase()];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown force unit: ${fromFactor === undefined ? from : to}. Available: ${Object.keys(forceUnits).join(', ')}`);
  }
  return (value * fromFactor) / toFactor;
}

// ==================== TORQUE ====================

const torqueUnits: Record<string, number> = {
  'n-m': 1,           // Newton-meter (base)
  'kn-m': 1000,       // kilonewton-meter
  'ft-lbf': 1.35582,  // foot pound-force
  'in-lbf': 0.112985, // inch pound-force
  'kgf-m': 9.80665,   // kilogram-force meter
  'kgf-cm': 0.0980665,// kilogram-force centimeter
  'dyn-cm': 1e-7,     // dyne centimeter
  'ozf-in': 0.00706155,// ounce-force inch
  'ozf-ft': 0.084739, // ounce-force foot
};

export function convertTorque(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = torqueUnits[from.toLowerCase()];
  const toFactor = torqueUnits[to.toLowerCase()];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown torque unit: ${fromFactor === undefined ? from : to}. Available: ${Object.keys(torqueUnits).join(', ')}`);
  }
  return (value * fromFactor) / toFactor;
}

// ==================== FUEL CONSUMPTION ====================
// Uses km/L as internal base; L/100km is inverse, MPG uses mile/gallon factors.

export function convertFuelConsumption(
  value: number,
  from: string,
  to: string
): number {
  if (value <= 0) throw new Error('Fuel consumption value must be positive');

  // Convert to km/L first
  let kmPerL: number;
  switch (from.toLowerCase()) {
    case 'km/l':      kmPerL = value; break;
    case 'l/100km':   kmPerL = 100 / value; break;
    case 'mpg-us':    kmPerL = value * 0.425144; break;
    case 'mpg-uk':    kmPerL = value * 0.354006; break;
    case 'mi/l':      kmPerL = value * 1.60934; break;
    case 'km/gal-us': kmPerL = value / 3.78541; break;
    case 'km/gal-uk': kmPerL = value / 4.54609; break;
    default:
      throw new Error(`Unknown fuel consumption unit: ${from}. Available: km/l, l/100km, mpg-us, mpg-uk, mi/l, km/gal-us, km/gal-uk`);
  }

  // Convert from km/L to target
  switch (to.toLowerCase()) {
    case 'km/l':      return kmPerL;
    case 'l/100km':   return 100 / kmPerL;
    case 'mpg-us':    return kmPerL / 0.425144;
    case 'mpg-uk':    return kmPerL / 0.354006;
    case 'mi/l':      return kmPerL / 1.60934;
    case 'km/gal-us': return kmPerL * 3.78541;
    case 'km/gal-uk': return kmPerL * 4.54609;
    default:
      throw new Error(`Unknown fuel consumption unit: ${to}. Available: km/l, l/100km, mpg-us, mpg-uk, mi/l, km/gal-us, km/gal-uk`);
  }
}

// ==================== RADIATION (Absorbed / Equivalent Dose) ====================

const radiationUnits: Record<string, number> = {
  gy: 1,          // Gray (absorbed dose, base)
  mgy: 0.001,
  'µgy': 1e-6,
  kgy: 1000,
  rad: 0.01,      // 1 rad = 0.01 Gy
  mrad: 1e-5,
  sv: 1,          // Sievert (equivalent dose; = Gy when Q=1, i.e. X-ray/gamma)
  msv: 0.001,
  'µsv': 1e-6,
  rem: 0.01,      // 1 rem = 0.01 Sv
  mrem: 1e-5,
};

export function convertRadiation(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = radiationUnits[from.toLowerCase()];
  const toFactor = radiationUnits[to.toLowerCase()];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown radiation unit: ${fromFactor === undefined ? from : to}. Available: ${Object.keys(radiationUnits).join(', ')}`);
  }
  return (value * fromFactor) / toFactor;
}

// ==================== DENSITY ====================

const densityUnits: Record<string, number> = {
  'kg/m3': 1,          // base
  'g/cm3': 1000,
  'g/ml': 1000,        // same as g/cm³
  'g/l': 1,
  'kg/l': 1000,
  'lb/ft3': 16.0185,
  'lb/gal': 119.826,   // US gallon
  'oz/in3': 1729.994,
  'slug/ft3': 515.379,
  't/m3': 1000,        // metric ton per m³
};

export function convertDensity(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = densityUnits[from.toLowerCase()];
  const toFactor = densityUnits[to.toLowerCase()];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown density unit: ${fromFactor === undefined ? from : to}. Available: ${Object.keys(densityUnits).join(', ')}`);
  }
  return (value * fromFactor) / toFactor;
}

// ==================== ILLUMINATION (Illuminance) ====================

const illuminationUnits: Record<string, number> = {
  lux: 1,            // lumen/m² (base)
  mlux: 0.001,
  klux: 1000,
  fc: 10.7639,       // foot-candle = lumen/ft²
  phot: 10000,       // 1 phot = 10,000 lux
  nox: 0.001,        // used for night measurements
};

export function convertIllumination(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = illuminationUnits[from.toLowerCase()];
  const toFactor = illuminationUnits[to.toLowerCase()];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown illumination unit: ${fromFactor === undefined ? from : to}. Available: ${Object.keys(illuminationUnits).join(', ')}`);
  }
  return (value * fromFactor) / toFactor;
}

// ==================== MAGNETIC (Flux Density) ====================

const magneticUnits: Record<string, number> = {
  t: 1,             // Tesla (base)
  mt: 0.001,        // millitesla
  'µt': 1e-6,       // microtesla
  nt: 1e-9,         // nanotesla
  gauss: 1e-4,      // 1 gauss = 100 µT = 0.0001 T
  kgauss: 0.1,      // kilogauss
  gamma: 1e-9,      // 1 gamma = 1 nT
  'wb/m2': 1,       // Weber per m² = Tesla
};

export function convertMagnetic(
  value: number,
  from: string,
  to: string
): number {
  const fromFactor = magneticUnits[from.toLowerCase()];
  const toFactor = magneticUnits[to.toLowerCase()];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown magnetic unit: ${fromFactor === undefined ? from : to}. Available: ${Object.keys(magneticUnits).join(', ')}`);
  }
  return (value * fromFactor) / toFactor;
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
  | 'currency'
  | 'electric'
  | 'force'
  | 'torque'
  | 'fuel-consumption'
  | 'radiation'
  | 'density'
  | 'illumination'
  | 'magnetic';

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
    case 'electric':
      return convertElectric(value, from, to);
    case 'force':
      return convertForce(value, from, to);
    case 'torque':
      return convertTorque(value, from, to);
    case 'fuel-consumption':
      return convertFuelConsumption(value, from, to);
    case 'radiation':
      return convertRadiation(value, from, to);
    case 'density':
      return convertDensity(value, from, to);
    case 'illumination':
      return convertIllumination(value, from, to);
    case 'magnetic':
      return convertMagnetic(value, from, to);
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
  electric: Object.keys(electricUnits),
  force: Object.keys(forceUnits),
  torque: Object.keys(torqueUnits),
  'fuel-consumption': ['km/l', 'l/100km', 'mpg-us', 'mpg-uk', 'mi/l', 'km/gal-us', 'km/gal-uk'],
  radiation: Object.keys(radiationUnits),
  density: Object.keys(densityUnits),
  illumination: Object.keys(illuminationUnits),
  magnetic: Object.keys(magneticUnits),
  temperature: ['C', 'F', 'K', 'R'],
};

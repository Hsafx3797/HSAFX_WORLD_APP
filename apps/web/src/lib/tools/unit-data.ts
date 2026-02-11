/**
 * Unit Converter Data Definitions
 * Centralized unit definitions for the unit converter tool.
 * This file contains all unit categories and their conversion formulas.
 */

// ============== TYPES ==============
export interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  /** Convert from this unit to the category's base unit */
  toBase: (value: number) => number;
  /** Convert from the category's base unit to this unit */
  fromBase: (value: number) => number;
}

export interface UnitCategory {
  id: string;
  name: string;
  icon: string;
  baseUnit: string;
  units: UnitDefinition[];
}

// ============== UNIT DEFINITIONS ==============
export const unitCategories: UnitCategory[] = [
  {
    id: 'length',
    name: 'Length',
    icon: '📏',
    baseUnit: 'meter',
    units: [
      { id: 'millimeter', name: 'Millimeter', symbol: 'mm', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { id: 'centimeter', name: 'Centimeter', symbol: 'cm', toBase: v => v / 100, fromBase: v => v * 100 },
      { id: 'meter', name: 'Meter', symbol: 'm', toBase: v => v, fromBase: v => v },
      { id: 'kilometer', name: 'Kilometer', symbol: 'km', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { id: 'inch', name: 'Inch', symbol: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
      { id: 'foot', name: 'Foot', symbol: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
      { id: 'yard', name: 'Yard', symbol: 'yd', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
      { id: 'mile', name: 'Mile', symbol: 'mi', toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
      { id: 'nautical-mile', name: 'Nautical Mile', symbol: 'nmi', toBase: v => v * 1852, fromBase: v => v / 1852 },
    ],
  },
  {
    id: 'weight',
    name: 'Weight',
    icon: '⚖️',
    baseUnit: 'kilogram',
    units: [
      { id: 'milligram', name: 'Milligram', symbol: 'mg', toBase: v => v / 1000000, fromBase: v => v * 1000000 },
      { id: 'gram', name: 'Gram', symbol: 'g', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { id: 'kilogram', name: 'Kilogram', symbol: 'kg', toBase: v => v, fromBase: v => v },
      { id: 'metric-ton', name: 'Metric Ton', symbol: 't', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { id: 'ounce', name: 'Ounce', symbol: 'oz', toBase: v => v * 0.028349523125, fromBase: v => v / 0.028349523125 },
      { id: 'pound', name: 'Pound', symbol: 'lb', toBase: v => v * 0.45359237, fromBase: v => v / 0.45359237 },
      { id: 'stone', name: 'Stone', symbol: 'st', toBase: v => v * 6.35029318, fromBase: v => v / 6.35029318 },
      { id: 'us-ton', name: 'US Ton', symbol: 'ton', toBase: v => v * 907.18474, fromBase: v => v / 907.18474 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    icon: '🌡️',
    baseUnit: 'celsius',
    units: [
      { id: 'celsius', name: 'Celsius', symbol: '°C', toBase: v => v, fromBase: v => v },
      { id: 'fahrenheit', name: 'Fahrenheit', symbol: '°F', toBase: v => (v - 32) * 5/9, fromBase: v => v * 9/5 + 32 },
      { id: 'kelvin', name: 'Kelvin', symbol: 'K', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
      { id: 'rankine', name: 'Rankine', symbol: '°R', toBase: v => (v - 491.67) * 5/9, fromBase: v => v * 9/5 + 491.67 },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    icon: '📐',
    baseUnit: 'square-meter',
    units: [
      { id: 'square-millimeter', name: 'Square Millimeter', symbol: 'mm²', toBase: v => v / 1000000, fromBase: v => v * 1000000 },
      { id: 'square-centimeter', name: 'Square Centimeter', symbol: 'cm²', toBase: v => v / 10000, fromBase: v => v * 10000 },
      { id: 'square-meter', name: 'Square Meter', symbol: 'm²', toBase: v => v, fromBase: v => v },
      { id: 'square-kilometer', name: 'Square Kilometer', symbol: 'km²', toBase: v => v * 1000000, fromBase: v => v / 1000000 },
      { id: 'hectare', name: 'Hectare', symbol: 'ha', toBase: v => v * 10000, fromBase: v => v / 10000 },
      { id: 'acre', name: 'Acre', symbol: 'ac', toBase: v => v * 4046.8564224, fromBase: v => v / 4046.8564224 },
      { id: 'square-foot', name: 'Square Foot', symbol: 'ft²', toBase: v => v * 0.09290304, fromBase: v => v / 0.09290304 },
      { id: 'square-yard', name: 'Square Yard', symbol: 'yd²', toBase: v => v * 0.83612736, fromBase: v => v / 0.83612736 },
      { id: 'square-mile', name: 'Square Mile', symbol: 'mi²', toBase: v => v * 2589988.110336, fromBase: v => v / 2589988.110336 },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    icon: '🧪',
    baseUnit: 'liter',
    units: [
      { id: 'milliliter', name: 'Milliliter', symbol: 'mL', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { id: 'liter', name: 'Liter', symbol: 'L', toBase: v => v, fromBase: v => v },
      { id: 'cubic-meter', name: 'Cubic Meter', symbol: 'm³', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { id: 'gallon-us', name: 'US Gallon', symbol: 'gal', toBase: v => v * 3.785411784, fromBase: v => v / 3.785411784 },
      { id: 'gallon-uk', name: 'UK Gallon', symbol: 'gal(UK)', toBase: v => v * 4.54609, fromBase: v => v / 4.54609 },
      { id: 'quart', name: 'Quart', symbol: 'qt', toBase: v => v * 0.946352946, fromBase: v => v / 0.946352946 },
      { id: 'pint', name: 'Pint', symbol: 'pt', toBase: v => v * 0.473176473, fromBase: v => v / 0.473176473 },
      { id: 'cup', name: 'Cup', symbol: 'cup', toBase: v => v * 0.2365882365, fromBase: v => v / 0.2365882365 },
      { id: 'fluid-ounce', name: 'Fluid Ounce', symbol: 'fl oz', toBase: v => v * 0.0295735295625, fromBase: v => v / 0.0295735295625 },
      { id: 'tablespoon', name: 'Tablespoon', symbol: 'tbsp', toBase: v => v * 0.01478676478125, fromBase: v => v / 0.01478676478125 },
      { id: 'teaspoon', name: 'Teaspoon', symbol: 'tsp', toBase: v => v * 0.00492892159375, fromBase: v => v / 0.00492892159375 },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    icon: '🚀',
    baseUnit: 'meter-per-second',
    units: [
      { id: 'meter-per-second', name: 'Meters per Second', symbol: 'm/s', toBase: v => v, fromBase: v => v },
      { id: 'kilometer-per-hour', name: 'Kilometers per Hour', symbol: 'km/h', toBase: v => v / 3.6, fromBase: v => v * 3.6 },
      { id: 'mile-per-hour', name: 'Miles per Hour', symbol: 'mph', toBase: v => v * 0.44704, fromBase: v => v / 0.44704 },
      { id: 'knot', name: 'Knot', symbol: 'kn', toBase: v => v * 0.514444, fromBase: v => v / 0.514444 },
      { id: 'foot-per-second', name: 'Feet per Second', symbol: 'ft/s', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
      { id: 'mach', name: 'Mach (at sea level)', symbol: 'Ma', toBase: v => v * 343, fromBase: v => v / 343 },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    icon: '⏱️',
    baseUnit: 'second',
    units: [
      { id: 'millisecond', name: 'Millisecond', symbol: 'ms', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { id: 'second', name: 'Second', symbol: 's', toBase: v => v, fromBase: v => v },
      { id: 'minute', name: 'Minute', symbol: 'min', toBase: v => v * 60, fromBase: v => v / 60 },
      { id: 'hour', name: 'Hour', symbol: 'h', toBase: v => v * 3600, fromBase: v => v / 3600 },
      { id: 'day', name: 'Day', symbol: 'd', toBase: v => v * 86400, fromBase: v => v / 86400 },
      { id: 'week', name: 'Week', symbol: 'wk', toBase: v => v * 604800, fromBase: v => v / 604800 },
      { id: 'month', name: 'Month (30 days)', symbol: 'mo', toBase: v => v * 2592000, fromBase: v => v / 2592000 },
      { id: 'year', name: 'Year (365 days)', symbol: 'yr', toBase: v => v * 31536000, fromBase: v => v / 31536000 },
    ],
  },
  {
    id: 'data',
    name: 'Digital Storage',
    icon: '💾',
    baseUnit: 'byte',
    units: [
      { id: 'bit', name: 'Bit', symbol: 'b', toBase: v => v / 8, fromBase: v => v * 8 },
      { id: 'byte', name: 'Byte', symbol: 'B', toBase: v => v, fromBase: v => v },
      { id: 'kilobyte', name: 'Kilobyte', symbol: 'KB', toBase: v => v * 1024, fromBase: v => v / 1024 },
      { id: 'megabyte', name: 'Megabyte', symbol: 'MB', toBase: v => v * 1048576, fromBase: v => v / 1048576 },
      { id: 'gigabyte', name: 'Gigabyte', symbol: 'GB', toBase: v => v * 1073741824, fromBase: v => v / 1073741824 },
      { id: 'terabyte', name: 'Terabyte', symbol: 'TB', toBase: v => v * 1099511627776, fromBase: v => v / 1099511627776 },
      { id: 'petabyte', name: 'Petabyte', symbol: 'PB', toBase: v => v * 1125899906842624, fromBase: v => v / 1125899906842624 },
    ],
  },
  {
    id: 'energy',
    name: 'Energy',
    icon: '⚡',
    baseUnit: 'joule',
    units: [
      { id: 'joule', name: 'Joule', symbol: 'J', toBase: v => v, fromBase: v => v },
      { id: 'kilojoule', name: 'Kilojoule', symbol: 'kJ', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { id: 'calorie', name: 'Calorie', symbol: 'cal', toBase: v => v * 4.184, fromBase: v => v / 4.184 },
      { id: 'kilocalorie', name: 'Kilocalorie', symbol: 'kcal', toBase: v => v * 4184, fromBase: v => v / 4184 },
      { id: 'watt-hour', name: 'Watt Hour', symbol: 'Wh', toBase: v => v * 3600, fromBase: v => v / 3600 },
      { id: 'kilowatt-hour', name: 'Kilowatt Hour', symbol: 'kWh', toBase: v => v * 3600000, fromBase: v => v / 3600000 },
      { id: 'electronvolt', name: 'Electron Volt', symbol: 'eV', toBase: v => v * 1.602176634e-19, fromBase: v => v / 1.602176634e-19 },
      { id: 'btu', name: 'BTU', symbol: 'BTU', toBase: v => v * 1055.06, fromBase: v => v / 1055.06 },
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    icon: '🔧',
    baseUnit: 'pascal',
    units: [
      { id: 'pascal', name: 'Pascal', symbol: 'Pa', toBase: v => v, fromBase: v => v },
      { id: 'kilopascal', name: 'Kilopascal', symbol: 'kPa', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { id: 'bar', name: 'Bar', symbol: 'bar', toBase: v => v * 100000, fromBase: v => v / 100000 },
      { id: 'atmosphere', name: 'Atmosphere', symbol: 'atm', toBase: v => v * 101325, fromBase: v => v / 101325 },
      { id: 'psi', name: 'PSI', symbol: 'psi', toBase: v => v * 6894.757293168, fromBase: v => v / 6894.757293168 },
      { id: 'mmhg', name: 'mmHg', symbol: 'mmHg', toBase: v => v * 133.322387415, fromBase: v => v / 133.322387415 },
      { id: 'torr', name: 'Torr', symbol: 'Torr', toBase: v => v * 133.322368421, fromBase: v => v / 133.322368421 },
    ],
  },
];

// ============== HELPER FUNCTIONS ==============

/**
 * Get a category by ID
 */
export function getCategoryById(categoryId: string): UnitCategory | undefined {
  return unitCategories.find(c => c.id === categoryId);
}

/**
 * Get a unit definition from a category
 */
export function getUnitById(categoryId: string, unitId: string): UnitDefinition | undefined {
  const category = getCategoryById(categoryId);
  return category?.units.find(u => u.id === unitId);
}

/**
 * Convert a value between two units in the same category
 */
export function convertUnit(
  categoryId: string,
  fromUnitId: string,
  toUnitId: string,
  value: number
): number {
  const fromUnit = getUnitById(categoryId, fromUnitId);
  const toUnit = getUnitById(categoryId, toUnitId);
  
  if (!fromUnit || !toUnit) {
    throw new Error(`Invalid unit conversion: ${fromUnitId} -> ${toUnitId}`);
  }
  
  const baseValue = fromUnit.toBase(value);
  return toUnit.fromBase(baseValue);
}

/**
 * Get all unit category IDs
 */
export function getCategoryIds(): string[] {
  return unitCategories.map(c => c.id);
}

/**
 * Format a converted value for display
 */
export function formatConvertedValue(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '—';
  if (Math.abs(value) < 0.0001 || Math.abs(value) >= 1e10) {
    return value.toExponential(6);
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 10 });
}

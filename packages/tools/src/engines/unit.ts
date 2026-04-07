/**
 * Unit Engine — Universal Unit Converter
 *
 * Wraps all category-specific converters (length, weight, temperature,
 * volume, area, speed, time, digital, pressure, energy, power, angle,
 * frequency, currency) behind one engine.
 */

import type { Engine, UnitEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
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
  convertElectric,
  convertForce,
  convertTorque,
  convertFuelConsumption,
  convertRadiation,
  convertDensity,
  convertIllumination,
  convertMagnetic,
  CURRENCY_RATES_DATE,
} from '../converters/units';

// ---------------------------------------------------------------------------
// Category → converter mapping
// ---------------------------------------------------------------------------

type UnitFn = (value: number, from: string, to: string) => number;

const CATEGORIES: Record<string, UnitFn> = {
  length:             convertLength,
  weight:             convertWeight,
  temperature:        convertTemperature,
  volume:             convertVolume,
  area:               convertArea,
  speed:              convertSpeed,
  time:               convertTime,
  digital:            convertDigital,
  pressure:           convertPressure,
  energy:             convertEnergy,
  power:              convertPower,
  angle:              convertAngle,
  frequency:          convertFrequency,
  currency:           convertCurrency,
  electric:           convertElectric,
  force:              convertForce,
  torque:             convertTorque,
  'fuel-consumption': convertFuelConsumption,
  radiation:          convertRadiation,
  density:            convertDensity,
  illumination:       convertIllumination,
  magnetic:           convertMagnetic,
};

const CATEGORY_NAMES = Object.keys(CATEGORIES).sort();

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const unitEngine: Engine<UnitEngineOptions> = {
  name: 'unit',
  description: 'Convert between measurement units across 22 categories (length, weight, temperature, volume, area, speed, time, digital, pressure, energy, power, angle, frequency, currency, electric, force, torque, fuel consumption, radiation, density, illumination, magnetic).',

  validate(options: UnitEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    if (!CATEGORIES[options.category]) {
      errors.push(`Unknown category "${options.category}". Available: ${CATEGORY_NAMES.join(', ')}`);
    }
    if (typeof options.value !== 'number' || isNaN(options.value)) {
      errors.push('value must be a valid number');
    }
    if (!options.from) errors.push('"from" unit is required');
    if (!options.to) errors.push('"to" unit is required');
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(_input: EngineInput, options: UnitEngineOptions): EngineResult {
    const fn = CATEGORIES[options.category];
    if (!fn) {
      return { output: '', metadata: { error: `Unknown category: ${options.category}` } };
    }
    const result = fn(options.value, options.from, options.to);
    const metadata: Record<string, unknown> = {
      category: options.category, from: options.from, to: options.to, value: options.value, result,
    };
    if (options.category === 'currency') {
      metadata.ratesDate = CURRENCY_RATES_DATE;
      metadata.disclaimer = `Static rates as of ${CURRENCY_RATES_DATE}. For live rates, supply customRates.`;
    }
    return {
      output: `${options.value} ${options.from} = ${result} ${options.to}`,
      metadata,
    };
  },
};

/**
 * Converter Tools Registry
 * Category: Converter
 * Subcategory: Unit
 */

import type { ToolMetadata } from '../types';

export const converterTools: ToolMetadata[] = [
  // =====================================================
  // UNIT CONVERTERS
  // =====================================================

  {
    id: 'length-converter', name: 'Length/Distance Converter', description: 'Convert length: mm, cm, m, km, inch, foot, yard, mile, nautical mile, light-year', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'nanometer', label: 'Nanometer (nm)' }, { value: 'micrometer', label: 'Micrometer (µm)' }, { value: 'millimeter', label: 'Millimeter (mm)' },
          { value: 'centimeter', label: 'Centimeter (cm)' }, { value: 'meter', label: 'Meter (m)' }, { value: 'kilometer', label: 'Kilometer (km)' },
          { value: 'inch', label: 'Inch (in)' }, { value: 'foot', label: 'Foot (ft)' }, { value: 'yard', label: 'Yard (yd)' },
          { value: 'mile', label: 'Mile (mi)' }, { value: 'nauticalMile', label: 'Nautical Mile (nmi)' }, { value: 'lightYear', label: 'Light Year (ly)' },
          { value: 'angstrom', label: 'Ångström (Å)' }, { value: 'parsec', label: 'Parsec (pc)' }, { value: 'astronomicalUnit', label: 'Astronomical Unit (AU)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'nanometer', label: 'Nanometer (nm)' }, { value: 'micrometer', label: 'Micrometer (µm)' }, { value: 'millimeter', label: 'Millimeter (mm)' },
          { value: 'centimeter', label: 'Centimeter (cm)' }, { value: 'meter', label: 'Meter (m)' }, { value: 'kilometer', label: 'Kilometer (km)' },
          { value: 'inch', label: 'Inch (in)' }, { value: 'foot', label: 'Foot (ft)' }, { value: 'yard', label: 'Yard (yd)' },
          { value: 'mile', label: 'Mile (mi)' }, { value: 'nauticalMile', label: 'Nautical Mile (nmi)' }, { value: 'lightYear', label: 'Light Year (ly)' },
          { value: 'angstrom', label: 'Ångström (Å)' }, { value: 'parsec', label: 'Parsec (pc)' }, { value: 'astronomicalUnit', label: 'Astronomical Unit (AU)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 6, min: 0, max: 15 },
    ]
  },
  {
    id: 'weight-converter', name: 'Weight/Mass Converter', description: 'Convert weight: mg, g, kg, tonne, ounce, pound, stone, ton, troy ounce, carat', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'microgram', label: 'Microgram (µg)' }, { value: 'milligram', label: 'Milligram (mg)' }, { value: 'gram', label: 'Gram (g)' },
          { value: 'kilogram', label: 'Kilogram (kg)' }, { value: 'metricTonne', label: 'Metric Tonne (t)' },
          { value: 'ounce', label: 'Ounce (oz)' }, { value: 'pound', label: 'Pound (lb)' }, { value: 'stone', label: 'Stone (st)' },
          { value: 'shortTon', label: 'Short Ton (US)' }, { value: 'longTon', label: 'Long Ton (UK)' },
          { value: 'troyOunce', label: 'Troy Ounce (ozt)' }, { value: 'carat', label: 'Carat (ct)' }, { value: 'grain', label: 'Grain (gr)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'microgram', label: 'Microgram (µg)' }, { value: 'milligram', label: 'Milligram (mg)' }, { value: 'gram', label: 'Gram (g)' },
          { value: 'kilogram', label: 'Kilogram (kg)' }, { value: 'metricTonne', label: 'Metric Tonne (t)' },
          { value: 'ounce', label: 'Ounce (oz)' }, { value: 'pound', label: 'Pound (lb)' }, { value: 'stone', label: 'Stone (st)' },
          { value: 'shortTon', label: 'Short Ton (US)' }, { value: 'longTon', label: 'Long Ton (UK)' },
          { value: 'troyOunce', label: 'Troy Ounce (ozt)' }, { value: 'carat', label: 'Carat (ct)' }, { value: 'grain', label: 'Grain (gr)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 6, min: 0, max: 15 },
    ]
  },
  {
    id: 'temperature-converter', name: 'Temperature Converter', description: 'Convert temp: Celsius, Fahrenheit, Kelvin, Rankine, Réaumur', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'celsius', label: 'Celsius (°C)' }, { value: 'fahrenheit', label: 'Fahrenheit (°F)' }, { value: 'kelvin', label: 'Kelvin (K)' },
          { value: 'rankine', label: 'Rankine (°R)' }, { value: 'reaumur', label: 'Réaumur (°Ré)' }, { value: 'delisle', label: 'Delisle (°De)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'celsius', label: 'Celsius (°C)' }, { value: 'fahrenheit', label: 'Fahrenheit (°F)' }, { value: 'kelvin', label: 'Kelvin (K)' },
          { value: 'rankine', label: 'Rankine (°R)' }, { value: 'reaumur', label: 'Réaumur (°Ré)' }, { value: 'delisle', label: 'Delisle (°De)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 2, min: 0, max: 10 },
    ]
  },
  {
    id: 'area-converter', name: 'Area Converter', description: 'Convert area: mm², cm², m², km², hectare, sq inch, sq foot, acre, sq mile', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'squareMillimeter', label: 'Square Millimeter (mm²)' }, { value: 'squareCentimeter', label: 'Square Centimeter (cm²)' },
          { value: 'squareMeter', label: 'Square Meter (m²)' }, { value: 'squareKilometer', label: 'Square Kilometer (km²)' },
          { value: 'hectare', label: 'Hectare (ha)' }, { value: 'are', label: 'Are (a)' },
          { value: 'squareInch', label: 'Square Inch (in²)' }, { value: 'squareFoot', label: 'Square Foot (ft²)' },
          { value: 'squareYard', label: 'Square Yard (yd²)' }, { value: 'squareMile', label: 'Square Mile (mi²)' }, { value: 'acre', label: 'Acre (ac)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'squareMillimeter', label: 'Square Millimeter (mm²)' }, { value: 'squareCentimeter', label: 'Square Centimeter (cm²)' },
          { value: 'squareMeter', label: 'Square Meter (m²)' }, { value: 'squareKilometer', label: 'Square Kilometer (km²)' },
          { value: 'hectare', label: 'Hectare (ha)' }, { value: 'are', label: 'Are (a)' },
          { value: 'squareInch', label: 'Square Inch (in²)' }, { value: 'squareFoot', label: 'Square Foot (ft²)' },
          { value: 'squareYard', label: 'Square Yard (yd²)' }, { value: 'squareMile', label: 'Square Mile (mi²)' }, { value: 'acre', label: 'Acre (ac)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 6, min: 0, max: 15 },
    ]
  },
  {
    id: 'volume-converter', name: 'Volume Converter', description: 'Convert volume: ml, liter, cubic meter, fl oz, cup, pint, quart, gallon', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'measurementSystem', type: 'select', label: 'Measurement System', default: 'us', options: [
          { value: 'us', label: 'US Customary' }, { value: 'imperial', label: 'Imperial (UK)' }, { value: 'metric', label: 'Metric' },
        ]
      },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'milliliter', label: 'Milliliter (ml)' }, { value: 'liter', label: 'Liter (L)' },
          { value: 'cubicCentimeter', label: 'Cubic Centimeter (cm³)' }, { value: 'cubicMeter', label: 'Cubic Meter (m³)' },
          { value: 'cubicInch', label: 'Cubic Inch (in³)' }, { value: 'cubicFoot', label: 'Cubic Foot (ft³)' },
          { value: 'fluidOunce', label: 'Fluid Ounce (fl oz)' }, { value: 'cup', label: 'Cup' },
          { value: 'pint', label: 'Pint (pt)' }, { value: 'quart', label: 'Quart (qt)' }, { value: 'gallon', label: 'Gallon (gal)' },
          { value: 'tablespoon', label: 'Tablespoon (tbsp)' }, { value: 'teaspoon', label: 'Teaspoon (tsp)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'milliliter', label: 'Milliliter (ml)' }, { value: 'liter', label: 'Liter (L)' },
          { value: 'cubicCentimeter', label: 'Cubic Centimeter (cm³)' }, { value: 'cubicMeter', label: 'Cubic Meter (m³)' },
          { value: 'cubicInch', label: 'Cubic Inch (in³)' }, { value: 'cubicFoot', label: 'Cubic Foot (ft³)' },
          { value: 'fluidOunce', label: 'Fluid Ounce (fl oz)' }, { value: 'cup', label: 'Cup' },
          { value: 'pint', label: 'Pint (pt)' }, { value: 'quart', label: 'Quart (qt)' }, { value: 'gallon', label: 'Gallon (gal)' },
          { value: 'tablespoon', label: 'Tablespoon (tbsp)' }, { value: 'teaspoon', label: 'Teaspoon (tsp)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 4, min: 0, max: 15 },
    ]
  },
  {
    id: 'time-converter', name: 'Time Duration Converter', description: 'Convert time: second, minute, hour, day, week, month, year, decade', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'nanosecond', label: 'Nanosecond (ns)' }, { value: 'microsecond', label: 'Microsecond (µs)' }, { value: 'millisecond', label: 'Millisecond (ms)' },
          { value: 'second', label: 'Second (s)' }, { value: 'minute', label: 'Minute (min)' }, { value: 'hour', label: 'Hour (h)' },
          { value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month (30 days)' },
          { value: 'year', label: 'Year (365 days)' }, { value: 'decade', label: 'Decade' }, { value: 'century', label: 'Century' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'nanosecond', label: 'Nanosecond (ns)' }, { value: 'microsecond', label: 'Microsecond (µs)' }, { value: 'millisecond', label: 'Millisecond (ms)' },
          { value: 'second', label: 'Second (s)' }, { value: 'minute', label: 'Minute (min)' }, { value: 'hour', label: 'Hour (h)' },
          { value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month (30 days)' },
          { value: 'year', label: 'Year (365 days)' }, { value: 'decade', label: 'Decade' }, { value: 'century', label: 'Century' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 4, min: 0, max: 15 },
    ]
  },
  {
    id: 'speed-converter', name: 'Speed/Velocity Converter', description: 'Convert speed: km/h, m/s, mph, knots, ft/s, Mach', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'meterPerSecond', label: 'Meters per Second (m/s)' }, { value: 'kilometerPerHour', label: 'Kilometers per Hour (km/h)' },
          { value: 'milePerHour', label: 'Miles per Hour (mph)' }, { value: 'footPerSecond', label: 'Feet per Second (ft/s)' },
          { value: 'knot', label: 'Knots (kn)' }, { value: 'mach', label: 'Mach (at sea level)' },
          { value: 'speedOfLight', label: 'Speed of Light (c)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'meterPerSecond', label: 'Meters per Second (m/s)' }, { value: 'kilometerPerHour', label: 'Kilometers per Hour (km/h)' },
          { value: 'milePerHour', label: 'Miles per Hour (mph)' }, { value: 'footPerSecond', label: 'Feet per Second (ft/s)' },
          { value: 'knot', label: 'Knots (kn)' }, { value: 'mach', label: 'Mach (at sea level)' },
          { value: 'speedOfLight', label: 'Speed of Light (c)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 4, min: 0, max: 15 },
    ]
  },
  {
    id: 'energy-converter', name: 'Energy Converter', description: 'Convert energy: Joule, calorie, BTU, kWh, eV, foot-pound', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'joule', label: 'Joule (J)' }, { value: 'kilojoule', label: 'Kilojoule (kJ)' }, { value: 'megajoule', label: 'Megajoule (MJ)' },
          { value: 'calorie', label: 'Calorie (cal)' }, { value: 'kilocalorie', label: 'Kilocalorie (kcal)' },
          { value: 'wattHour', label: 'Watt Hour (Wh)' }, { value: 'kilowattHour', label: 'Kilowatt Hour (kWh)' },
          { value: 'btu', label: 'BTU' }, { value: 'electronVolt', label: 'Electron Volt (eV)' },
          { value: 'footPound', label: 'Foot-Pound (ft⋅lbf)' }, { value: 'therm', label: 'Therm' }, { value: 'erg', label: 'Erg' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'joule', label: 'Joule (J)' }, { value: 'kilojoule', label: 'Kilojoule (kJ)' }, { value: 'megajoule', label: 'Megajoule (MJ)' },
          { value: 'calorie', label: 'Calorie (cal)' }, { value: 'kilocalorie', label: 'Kilocalorie (kcal)' },
          { value: 'wattHour', label: 'Watt Hour (Wh)' }, { value: 'kilowattHour', label: 'Kilowatt Hour (kWh)' },
          { value: 'btu', label: 'BTU' }, { value: 'electronVolt', label: 'Electron Volt (eV)' },
          { value: 'footPound', label: 'Foot-Pound (ft⋅lbf)' }, { value: 'therm', label: 'Therm' }, { value: 'erg', label: 'Erg' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 6, min: 0, max: 15 },
    ]
  },
  {
    id: 'pressure-converter', name: 'Pressure Converter', description: 'Convert pressure: Pascal, bar, atmosphere, PSI, mmHg, Torr', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'pascal', label: 'Pascal (Pa)' }, { value: 'kilopascal', label: 'Kilopascal (kPa)' }, { value: 'megapascal', label: 'Megapascal (MPa)' },
          { value: 'bar', label: 'Bar' }, { value: 'millibar', label: 'Millibar (mbar)' },
          { value: 'psi', label: 'PSI (lb/in²)' }, { value: 'atmosphere', label: 'Atmosphere (atm)' },
          { value: 'mmHg', label: 'mmHg (Torr)' }, { value: 'inHg', label: 'Inches of Mercury (inHg)' },
          { value: 'cmH2O', label: 'cm of Water (cmH₂O)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'pascal', label: 'Pascal (Pa)' }, { value: 'kilopascal', label: 'Kilopascal (kPa)' }, { value: 'megapascal', label: 'Megapascal (MPa)' },
          { value: 'bar', label: 'Bar' }, { value: 'millibar', label: 'Millibar (mbar)' },
          { value: 'psi', label: 'PSI (lb/in²)' }, { value: 'atmosphere', label: 'Atmosphere (atm)' },
          { value: 'mmHg', label: 'mmHg (Torr)' }, { value: 'inHg', label: 'Inches of Mercury (inHg)' },
          { value: 'cmH2O', label: 'cm of Water (cmH₂O)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 4, min: 0, max: 15 },
    ]
  },
  {
    id: 'power-converter', name: 'Power Converter', description: 'Convert power: Watt, kilowatt, horsepower, BTU/hour', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'watt', label: 'Watt (W)' }, { value: 'kilowatt', label: 'Kilowatt (kW)' }, { value: 'megawatt', label: 'Megawatt (MW)' },
          { value: 'horsepower', label: 'Horsepower (hp)' }, { value: 'metricHorsepower', label: 'Metric Horsepower (PS)' },
          { value: 'btuPerHour', label: 'BTU/hour' }, { value: 'footPoundPerSecond', label: 'Foot-pound/second' },
          { value: 'tonOfRefrigeration', label: 'Ton of Refrigeration' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'watt', label: 'Watt (W)' }, { value: 'kilowatt', label: 'Kilowatt (kW)' }, { value: 'megawatt', label: 'Megawatt (MW)' },
          { value: 'horsepower', label: 'Horsepower (hp)' }, { value: 'metricHorsepower', label: 'Metric Horsepower (PS)' },
          { value: 'btuPerHour', label: 'BTU/hour' }, { value: 'footPoundPerSecond', label: 'Foot-pound/second' },
          { value: 'tonOfRefrigeration', label: 'Ton of Refrigeration' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 4, min: 0, max: 15 },
    ]
  },
  {
    id: 'frequency-converter', name: 'Frequency Converter', description: 'Convert frequency: Hz, kHz, MHz, GHz, RPM', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'hertz', label: 'Hertz (Hz)' }, { value: 'kilohertz', label: 'Kilohertz (kHz)' },
          { value: 'megahertz', label: 'Megahertz (MHz)' }, { value: 'gigahertz', label: 'Gigahertz (GHz)' }, { value: 'terahertz', label: 'Terahertz (THz)' },
          { value: 'rpm', label: 'RPM (rev/min)' }, { value: 'rps', label: 'RPS (rev/sec)' },
          { value: 'radianPerSecond', label: 'Radian/second (rad/s)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'hertz', label: 'Hertz (Hz)' }, { value: 'kilohertz', label: 'Kilohertz (kHz)' },
          { value: 'megahertz', label: 'Megahertz (MHz)' }, { value: 'gigahertz', label: 'Gigahertz (GHz)' }, { value: 'terahertz', label: 'Terahertz (THz)' },
          { value: 'rpm', label: 'RPM (rev/min)' }, { value: 'rps', label: 'RPS (rev/sec)' },
          { value: 'radianPerSecond', label: 'Radian/second (rad/s)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 4, min: 0, max: 15 },
    ]
  },
  {
    id: 'data-storage-converter', name: 'Data/Digital Storage Converter', description: 'Convert data: bit, byte, KB, MB, GB, TB, PB, KiB, MiB, GiB', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'unitStandard', type: 'select', label: 'Unit Standard', default: 'decimal', options: [
          { value: 'decimal', label: 'Decimal (SI: KB=1000 bytes)' },
          { value: 'binary', label: 'Binary (IEC: KiB=1024 bytes)' },
        ]
      },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'bit', label: 'Bit (b)' }, { value: 'nibble', label: 'Nibble (4 bits)' }, { value: 'byte', label: 'Byte (B)' },
          { value: 'kilobyte', label: 'Kilobyte (KB)' }, { value: 'megabyte', label: 'Megabyte (MB)' },
          { value: 'gigabyte', label: 'Gigabyte (GB)' }, { value: 'terabyte', label: 'Terabyte (TB)' },
          { value: 'petabyte', label: 'Petabyte (PB)' }, { value: 'exabyte', label: 'Exabyte (EB)' },
          { value: 'kibibyte', label: 'Kibibyte (KiB)' }, { value: 'mebibyte', label: 'Mebibyte (MiB)' },
          { value: 'gibibyte', label: 'Gibibyte (GiB)' }, { value: 'tebibyte', label: 'Tebibyte (TiB)' },
          { value: 'pebibyte', label: 'Pebibyte (PiB)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'bit', label: 'Bit (b)' }, { value: 'nibble', label: 'Nibble (4 bits)' }, { value: 'byte', label: 'Byte (B)' },
          { value: 'kilobyte', label: 'Kilobyte (KB)' }, { value: 'megabyte', label: 'Megabyte (MB)' },
          { value: 'gigabyte', label: 'Gigabyte (GB)' }, { value: 'terabyte', label: 'Terabyte (TB)' },
          { value: 'petabyte', label: 'Petabyte (PB)' }, { value: 'exabyte', label: 'Exabyte (EB)' },
          { value: 'kibibyte', label: 'Kibibyte (KiB)' }, { value: 'mebibyte', label: 'Mebibyte (MiB)' },
          { value: 'gibibyte', label: 'Gibibyte (GiB)' }, { value: 'tebibyte', label: 'Tebibyte (TiB)' },
          { value: 'pebibyte', label: 'Pebibyte (PiB)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 4, min: 0, max: 15 },
    ]
  },
  {
    id: 'electric-converter', name: 'Electric Current & Voltage Converter', description: 'Convert electric: Ampere, Volt, Ohm, milliampere, kilovolt', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      {
        name: 'conversionMode', type: 'select', label: 'Conversion Mode', default: 'direct', options: [
          { value: 'direct', label: 'Direct Unit Conversion' },
          { value: 'ohmsLaw', label: "Ohm's Law Calculator (V=IR)" },
          { value: 'powerLaw', label: 'Power Law Calculator (P=IV)' },
        ]
      },
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'electricQuantity', type: 'select', label: 'Quantity Type', default: 'current', options: [
          { value: 'current', label: 'Current (Amperes)' },
          { value: 'voltage', label: 'Voltage (Volts)' },
          { value: 'resistance', label: 'Resistance (Ohms)' },
          { value: 'power', label: 'Power (Watts)' },
        ]
      },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'ampere', label: 'Ampere (A)' }, { value: 'milliampere', label: 'Milliampere (mA)' }, { value: 'microampere', label: 'Microampere (µA)' },
          { value: 'volt', label: 'Volt (V)' }, { value: 'millivolt', label: 'Millivolt (mV)' }, { value: 'kilovolt', label: 'Kilovolt (kV)' },
          { value: 'ohm', label: 'Ohm (Ω)' }, { value: 'kilohm', label: 'Kilohm (kΩ)' }, { value: 'megohm', label: 'Megohm (MΩ)' },
          { value: 'siemens', label: 'Siemens (S)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'ampere', label: 'Ampere (A)' }, { value: 'milliampere', label: 'Milliampere (mA)' }, { value: 'microampere', label: 'Microampere (µA)' },
          { value: 'volt', label: 'Volt (V)' }, { value: 'millivolt', label: 'Millivolt (mV)' }, { value: 'kilovolt', label: 'Kilovolt (kV)' },
          { value: 'ohm', label: 'Ohm (Ω)' }, { value: 'kilohm', label: 'Kilohm (kΩ)' }, { value: 'megohm', label: 'Megohm (MΩ)' },
          { value: 'siemens', label: 'Siemens (S)' },
        ]
      },
      { name: 'voltage', type: 'number', label: 'Voltage (V)', description: "For Ohm's Law calculation" },
      { name: 'current', type: 'number', label: 'Current (A)', description: "For Ohm's Law calculation" },
      { name: 'resistance', type: 'number', label: 'Resistance (Ω)', description: "For Ohm's Law calculation" },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 4, min: 0, max: 15 },
    ]
  },
  {
    id: 'angle-converter', name: 'Angle Converter', description: 'Convert angles: degree, radian, gradian, turn, arc minute, arc second', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'degree', label: 'Degree (°)' }, { value: 'radian', label: 'Radian (rad)' }, { value: 'gradian', label: 'Gradian (gon)' },
          { value: 'turn', label: 'Turn (rev)' }, { value: 'arcMinute', label: 'Arc Minute (\')' }, { value: 'arcSecond', label: 'Arc Second (\'\')' },
          { value: 'milliradian', label: 'Milliradian (mrad)' }, { value: 'minuteOfArc', label: 'MOA (Minute of Arc)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'degree', label: 'Degree (°)' }, { value: 'radian', label: 'Radian (rad)' }, { value: 'gradian', label: 'Gradian (gon)' },
          { value: 'turn', label: 'Turn (rev)' }, { value: 'arcMinute', label: 'Arc Minute (\')' }, { value: 'arcSecond', label: 'Arc Second (\'\')' },
          { value: 'milliradian', label: 'Milliradian (mrad)' }, { value: 'minuteOfArc', label: 'MOA (Minute of Arc)' },
        ]
      },
      { name: 'normalize', type: 'boolean', label: 'Normalize to 0-360°', default: false },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 6, min: 0, max: 15 },
    ]
  },
  {
    id: 'force-converter', name: 'Force Converter', description: 'Convert force: Newton, pound-force, kilogram-force, dyne', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'newton', label: 'Newton (N)' }, { value: 'kilonewton', label: 'Kilonewton (kN)' }, { value: 'meganewton', label: 'Meganewton (MN)' },
          { value: 'poundForce', label: 'Pound-force (lbf)' }, { value: 'kilogramForce', label: 'Kilogram-force (kgf)' },
          { value: 'dyne', label: 'Dyne (dyn)' }, { value: 'poundal', label: 'Poundal (pdl)' }, { value: 'sthene', label: 'Sthène (sn)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'newton', label: 'Newton (N)' }, { value: 'kilonewton', label: 'Kilonewton (kN)' }, { value: 'meganewton', label: 'Meganewton (MN)' },
          { value: 'poundForce', label: 'Pound-force (lbf)' }, { value: 'kilogramForce', label: 'Kilogram-force (kgf)' },
          { value: 'dyne', label: 'Dyne (dyn)' }, { value: 'poundal', label: 'Poundal (pdl)' }, { value: 'sthene', label: 'Sthène (sn)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 6, min: 0, max: 15 },
    ]
  },
  {
    id: 'torque-converter', name: 'Torque Converter', description: 'Convert torque: Newton-meter, foot-pound, inch-pound', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'newtonMeter', label: 'Newton-meter (N⋅m)' }, { value: 'kilonewtonMeter', label: 'Kilonewton-meter (kN⋅m)' },
          { value: 'footPound', label: 'Foot-pound (ft⋅lbf)' }, { value: 'inchPound', label: 'Inch-pound (in⋅lbf)' },
          { value: 'inchOunce', label: 'Inch-ounce (in⋅ozf)' }, { value: 'kilogramMeter', label: 'Kilogram-meter (kgf⋅m)' },
          { value: 'dyneCentimeter', label: 'Dyne-centimeter (dyn⋅cm)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'newtonMeter', label: 'Newton-meter (N⋅m)' }, { value: 'kilonewtonMeter', label: 'Kilonewton-meter (kN⋅m)' },
          { value: 'footPound', label: 'Foot-pound (ft⋅lbf)' }, { value: 'inchPound', label: 'Inch-pound (in⋅lbf)' },
          { value: 'inchOunce', label: 'Inch-ounce (in⋅ozf)' }, { value: 'kilogramMeter', label: 'Kilogram-meter (kgf⋅m)' },
          { value: 'dyneCentimeter', label: 'Dyne-centimeter (dyn⋅cm)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 4, min: 0, max: 15 },
    ]
  },
  {
    id: 'fuel-consumption-converter', name: 'Fuel Consumption Converter', description: 'Convert fuel: MPG, km/L, L/100km', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'measurementType', type: 'select', label: 'Type', default: 'us', options: [
          { value: 'us', label: 'US Gallon' },
          { value: 'imperial', label: 'Imperial (UK) Gallon' },
        ]
      },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'kilometerPerLiter', label: 'km/L' }, { value: 'milePerGallonUS', label: 'MPG (US)' }, { value: 'milePerGallonUK', label: 'MPG (UK)' },
          { value: 'literPer100km', label: 'L/100km' }, { value: 'gallonPer100miles', label: 'gal/100mi' },
          { value: 'milePerLiter', label: 'mi/L' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'kilometerPerLiter', label: 'km/L' }, { value: 'milePerGallonUS', label: 'MPG (US)' }, { value: 'milePerGallonUK', label: 'MPG (UK)' },
          { value: 'literPer100km', label: 'L/100km' }, { value: 'gallonPer100miles', label: 'gal/100mi' },
          { value: 'milePerLiter', label: 'mi/L' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 2, min: 0, max: 10 },
    ]
  },
  {
    id: 'radiation-converter', name: 'Radiation Converter', description: 'Convert radiation: Becquerel, curie, gray, sievert, roentgen', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'radiationType', type: 'select', label: 'Radiation Type', default: 'activity', options: [
          { value: 'activity', label: 'Activity (Bq, Ci)' },
          { value: 'absorbedDose', label: 'Absorbed Dose (Gy, rad)' },
          { value: 'equivalentDose', label: 'Equivalent Dose (Sv, rem)' },
          { value: 'exposure', label: 'Exposure (R, C/kg)' },
        ]
      },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'becquerel', label: 'Becquerel (Bq)' }, { value: 'kilobecquerel', label: 'Kilobecquerel (kBq)' }, { value: 'megabecquerel', label: 'Megabecquerel (MBq)' },
          { value: 'curie', label: 'Curie (Ci)' }, { value: 'millicurie', label: 'Millicurie (mCi)' }, { value: 'microcurie', label: 'Microcurie (µCi)' },
          { value: 'gray', label: 'Gray (Gy)' }, { value: 'milligray', label: 'Milligray (mGy)' }, { value: 'rad', label: 'Rad' },
          { value: 'sievert', label: 'Sievert (Sv)' }, { value: 'millisievert', label: 'Millisievert (mSv)' }, { value: 'microsievert', label: 'Microsievert (µSv)' },
          { value: 'rem', label: 'Rem' }, { value: 'millirem', label: 'Millirem (mrem)' },
          { value: 'roentgen', label: 'Roentgen (R)' }, { value: 'coulombPerKg', label: 'Coulomb/kg (C/kg)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'becquerel', label: 'Becquerel (Bq)' }, { value: 'kilobecquerel', label: 'Kilobecquerel (kBq)' }, { value: 'megabecquerel', label: 'Megabecquerel (MBq)' },
          { value: 'curie', label: 'Curie (Ci)' }, { value: 'millicurie', label: 'Millicurie (mCi)' }, { value: 'microcurie', label: 'Microcurie (µCi)' },
          { value: 'gray', label: 'Gray (Gy)' }, { value: 'milligray', label: 'Milligray (mGy)' }, { value: 'rad', label: 'Rad' },
          { value: 'sievert', label: 'Sievert (Sv)' }, { value: 'millisievert', label: 'Millisievert (mSv)' }, { value: 'microsievert', label: 'Microsievert (µSv)' },
          { value: 'rem', label: 'Rem' }, { value: 'millirem', label: 'Millirem (mrem)' },
          { value: 'roentgen', label: 'Roentgen (R)' }, { value: 'coulombPerKg', label: 'Coulomb/kg (C/kg)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 6, min: 0, max: 15 },
    ]
  },
  {
    id: 'density-converter', name: 'Density Converter', description: 'Convert density: kg/m³, g/cm³, lb/ft³, specific gravity', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'kilogramPerCubicMeter', label: 'kg/m³' }, { value: 'gramPerCubicCentimeter', label: 'g/cm³' }, { value: 'gramPerMilliliter', label: 'g/mL' },
          { value: 'kilogramPerLiter', label: 'kg/L' }, { value: 'poundPerCubicFoot', label: 'lb/ft³' }, { value: 'poundPerCubicInch', label: 'lb/in³' },
          { value: 'poundPerGallon', label: 'lb/gal (US)' }, { value: 'ouncePerCubicInch', label: 'oz/in³' },
          { value: 'specificGravity', label: 'Specific Gravity (water=1)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'kilogramPerCubicMeter', label: 'kg/m³' }, { value: 'gramPerCubicCentimeter', label: 'g/cm³' }, { value: 'gramPerMilliliter', label: 'g/mL' },
          { value: 'kilogramPerLiter', label: 'kg/L' }, { value: 'poundPerCubicFoot', label: 'lb/ft³' }, { value: 'poundPerCubicInch', label: 'lb/in³' },
          { value: 'poundPerGallon', label: 'lb/gal (US)' }, { value: 'ouncePerCubicInch', label: 'oz/in³' },
          { value: 'specificGravity', label: 'Specific Gravity (water=1)' },
        ]
      },
      { name: 'referenceTemperature', type: 'number', label: 'Reference Temp (°C)', default: 20, description: 'For specific gravity calculation' },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 6, min: 0, max: 15 },
    ]
  },
  {
    id: 'illumination-converter', name: 'Illumination Converter', description: 'Convert light: lux, lumen, candela, foot-candle', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'lightQuantity', type: 'select', label: 'Quantity Type', default: 'illuminance', options: [
          { value: 'illuminance', label: 'Illuminance (lux, fc)' },
          { value: 'luminousFlux', label: 'Luminous Flux (lumen)' },
          { value: 'luminousIntensity', label: 'Luminous Intensity (candela)' },
          { value: 'luminance', label: 'Luminance (cd/m²)' },
        ]
      },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'lux', label: 'Lux (lx)' }, { value: 'footCandle', label: 'Foot-candle (fc)' }, { value: 'phot', label: 'Phot (ph)' },
          { value: 'lumen', label: 'Lumen (lm)' }, { value: 'candela', label: 'Candela (cd)' },
          { value: 'candelaPrSqMeter', label: 'cd/m² (Nit)' }, { value: 'footLambert', label: 'Foot-lambert (fL)' }, { value: 'lambert', label: 'Lambert (L)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'lux', label: 'Lux (lx)' }, { value: 'footCandle', label: 'Foot-candle (fc)' }, { value: 'phot', label: 'Phot (ph)' },
          { value: 'lumen', label: 'Lumen (lm)' }, { value: 'candela', label: 'Candela (cd)' },
          { value: 'candelaPrSqMeter', label: 'cd/m² (Nit)' }, { value: 'footLambert', label: 'Foot-lambert (fL)' }, { value: 'lambert', label: 'Lambert (L)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 4, min: 0, max: 15 },
    ]
  },
  {
    id: 'magnetic-converter', name: 'Magnetic Field Converter', description: 'Convert magnetic: Tesla, gauss, weber, henry', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'fieldType', type: 'select', label: 'Field Type', default: 'fluxDensity', options: [
          { value: 'fluxDensity', label: 'Magnetic Flux Density (B)' },
          { value: 'flux', label: 'Magnetic Flux (Φ)' },
          { value: 'fieldStrength', label: 'Magnetic Field Strength (H)' },
          { value: 'inductance', label: 'Inductance (L)' },
        ]
      },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'tesla', label: 'Tesla (T)' }, { value: 'millitesla', label: 'Millitesla (mT)' }, { value: 'microtesla', label: 'Microtesla (µT)' },
          { value: 'gauss', label: 'Gauss (G)' }, { value: 'weber', label: 'Weber (Wb)' }, { value: 'maxwell', label: 'Maxwell (Mx)' },
          { value: 'henry', label: 'Henry (H)' }, { value: 'millihenry', label: 'Millihenry (mH)' }, { value: 'microhenry', label: 'Microhenry (µH)' },
          { value: 'amperePerMeter', label: 'Ampere/meter (A/m)' }, { value: 'oersted', label: 'Oersted (Oe)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'tesla', label: 'Tesla (T)' }, { value: 'millitesla', label: 'Millitesla (mT)' }, { value: 'microtesla', label: 'Microtesla (µT)' },
          { value: 'gauss', label: 'Gauss (G)' }, { value: 'weber', label: 'Weber (Wb)' }, { value: 'maxwell', label: 'Maxwell (Mx)' },
          { value: 'henry', label: 'Henry (H)' }, { value: 'millihenry', label: 'Millihenry (mH)' }, { value: 'microhenry', label: 'Microhenry (µH)' },
          { value: 'amperePerMeter', label: 'Ampere/meter (A/m)' }, { value: 'oersted', label: 'Oersted (Oe)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 6, min: 0, max: 15 },
    ]
  },
  {
    id: 'cooking-converter', name: 'Cooking & Recipe Converter', description: 'Convert cooking: cup, tablespoon, teaspoon, fluid ounce, stick of butter', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'value', type: 'number', label: 'Value', required: true },
      {
        name: 'ingredient', type: 'select', label: 'Ingredient (for weight)', default: 'water', options: [
          { value: 'water', label: 'Water / Liquid' },
          { value: 'flour', label: 'All-Purpose Flour' },
          { value: 'sugar', label: 'Granulated Sugar' },
          { value: 'brownSugar', label: 'Brown Sugar (packed)' },
          { value: 'powderedSugar', label: 'Powdered Sugar' },
          { value: 'butter', label: 'Butter' },
          { value: 'oil', label: 'Oil (vegetable/olive)' },
          { value: 'honey', label: 'Honey / Syrup' },
          { value: 'milk', label: 'Milk' },
          { value: 'cream', label: 'Heavy Cream' },
          { value: 'rice', label: 'Rice (uncooked)' },
          { value: 'oats', label: 'Oats' },
          { value: 'cocoa', label: 'Cocoa Powder' },
          { value: 'salt', label: 'Salt' },
        ]
      },
      {
        name: 'measurementSystem', type: 'select', label: 'System', default: 'us', options: [
          { value: 'us', label: 'US Customary' }, { value: 'metric', label: 'Metric' }, { value: 'imperial', label: 'Imperial (UK)' },
        ]
      },
      {
        name: 'from', type: 'select', label: 'From', required: true, options: [
          { value: 'cup', label: 'Cup' }, { value: 'tablespoon', label: 'Tablespoon (tbsp)' }, { value: 'teaspoon', label: 'Teaspoon (tsp)' },
          { value: 'fluidOunce', label: 'Fluid Ounce (fl oz)' }, { value: 'milliliter', label: 'Milliliter (ml)' }, { value: 'liter', label: 'Liter (L)' },
          { value: 'pint', label: 'Pint' }, { value: 'quart', label: 'Quart' },
          { value: 'gram', label: 'Gram (g)' }, { value: 'ounce', label: 'Ounce (oz)' }, { value: 'pound', label: 'Pound (lb)' },
          { value: 'pinch', label: 'Pinch' }, { value: 'dash', label: 'Dash' }, { value: 'stick', label: 'Stick (butter)' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To', required: true, options: [
          { value: 'cup', label: 'Cup' }, { value: 'tablespoon', label: 'Tablespoon (tbsp)' }, { value: 'teaspoon', label: 'Teaspoon (tsp)' },
          { value: 'fluidOunce', label: 'Fluid Ounce (fl oz)' }, { value: 'milliliter', label: 'Milliliter (ml)' }, { value: 'liter', label: 'Liter (L)' },
          { value: 'pint', label: 'Pint' }, { value: 'quart', label: 'Quart' },
          { value: 'gram', label: 'Gram (g)' }, { value: 'ounce', label: 'Ounce (oz)' }, { value: 'pound', label: 'Pound (lb)' },
          { value: 'pinch', label: 'Pinch' }, { value: 'dash', label: 'Dash' }, { value: 'stick', label: 'Stick (butter)' },
        ]
      },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 2, min: 0, max: 6 },
    ]
  },
  {
    id: 'paper-size-converter', name: 'Paper & Printing Sizes Converter', description: 'Convert paper: A-series, US Letter, Legal, points, picas', category: 'Converter', subcategory: 'Unit', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      {
        name: 'conversionMode', type: 'select', label: 'Mode', default: 'paperSize', options: [
          { value: 'paperSize', label: 'Paper Size Lookup' },
          { value: 'typographic', label: 'Typographic Units' },
          { value: 'custom', label: 'Custom Dimensions' },
        ]
      },
      {
        name: 'paperSize', type: 'select', label: 'Paper Size', options: [
          { value: 'a0', label: 'A0 (841×1189 mm)' }, { value: 'a1', label: 'A1 (594×841 mm)' }, { value: 'a2', label: 'A2 (420×594 mm)' },
          { value: 'a3', label: 'A3 (297×420 mm)' }, { value: 'a4', label: 'A4 (210×297 mm)' }, { value: 'a5', label: 'A5 (148×210 mm)' },
          { value: 'a6', label: 'A6 (105×148 mm)' }, { value: 'a7', label: 'A7 (74×105 mm)' }, { value: 'a8', label: 'A8 (52×74 mm)' },
          { value: 'b0', label: 'B0 (1000×1414 mm)' }, { value: 'b1', label: 'B1 (707×1000 mm)' }, { value: 'b2', label: 'B2 (500×707 mm)' },
          { value: 'b3', label: 'B3 (353×500 mm)' }, { value: 'b4', label: 'B4 (250×353 mm)' }, { value: 'b5', label: 'B5 (176×250 mm)' },
          { value: 'letter', label: 'US Letter (8.5×11 in)' }, { value: 'legal', label: 'US Legal (8.5×14 in)' },
          { value: 'tabloid', label: 'Tabloid (11×17 in)' }, { value: 'ledger', label: 'Ledger (17×11 in)' },
          { value: 'executive', label: 'Executive (7.25×10.5 in)' },
        ]
      },
      {
        name: 'orientation', type: 'select', label: 'Orientation', default: 'portrait', options: [
          { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' },
        ]
      },
      {
        name: 'outputUnit', type: 'select', label: 'Output Unit', default: 'mm', options: [
          { value: 'mm', label: 'Millimeters (mm)' }, { value: 'cm', label: 'Centimeters (cm)' }, { value: 'inch', label: 'Inches (in)' },
          { value: 'point', label: 'Points (pt)' }, { value: 'pica', label: 'Picas (pc)' }, { value: 'pixel', label: 'Pixels (at DPI)' },
        ]
      },
      { name: 'value', type: 'number', label: 'Value', description: 'For typographic conversion' },
      {
        name: 'from', type: 'select', label: 'From Unit', options: [
          { value: 'point', label: 'Point (pt)' }, { value: 'pica', label: 'Pica (pc)' }, { value: 'inch', label: 'Inch (in)' },
          { value: 'mm', label: 'Millimeter (mm)' }, { value: 'cm', label: 'Centimeter (cm)' },
          { value: 'pixel', label: 'Pixel (at DPI)' }, { value: 'em', label: 'Em' }, { value: 'cicero', label: 'Cicero' },
        ]
      },
      {
        name: 'to', type: 'select', label: 'To Unit', options: [
          { value: 'point', label: 'Point (pt)' }, { value: 'pica', label: 'Pica (pc)' }, { value: 'inch', label: 'Inch (in)' },
          { value: 'mm', label: 'Millimeter (mm)' }, { value: 'cm', label: 'Centimeter (cm)' },
          { value: 'pixel', label: 'Pixel (at DPI)' }, { value: 'em', label: 'Em' }, { value: 'cicero', label: 'Cicero' },
        ]
      },
      { name: 'dpi', type: 'number', label: 'DPI (for pixels)', default: 300, min: 72, max: 1200 },
      { name: 'fontSize', type: 'number', label: 'Font Size (pt)', default: 12, description: 'Base size for Em calculations' },
      { name: 'precision', type: 'number', label: 'Decimal Precision', default: 2, min: 0, max: 6 },
    ]
  },
];

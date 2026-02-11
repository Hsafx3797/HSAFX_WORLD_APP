import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  hexToRgba,
  rgbaToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  hslToHex,
  rgbToHsv,
  hsvToRgb,
  rgbToCmyk,
  cmykToRgb,
  parseColor,
  toRgbString,
  toRgbaString,
  toHslString,
  toHslaString,
  luminance,
  contrastRatio,
  isLight,
  getContrastColor,
  mix,
  lighten,
  darken,
  saturate,
  desaturate,
  complement,
  grayscale,
  invert,
} from '../colors';

// ==================== HEX CONVERSIONS ====================

describe('hexToRgb', () => {
  it('converts #ff0000 to red', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts #00ff00 to green', () => {
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('converts #0000ff to blue', () => {
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('converts #ffffff to white', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts #000000 to black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('handles shorthand #f00', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('handles shorthand #fff', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('works without # prefix', () => {
    expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts mid-gray #808080', () => {
    expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 });
  });
});

describe('rgbToHex', () => {
  it('converts red to #ff0000', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
  });

  it('converts green to #00ff00', () => {
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
  });

  it('converts blue to #0000ff', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff');
  });

  it('converts white to #ffffff', () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
  });

  it('converts black to #000000', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('pads single-digit hex values', () => {
    expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
  });

  it('clamps values above 255', () => {
    expect(rgbToHex({ r: 300, g: 0, b: 0 })).toBe('#ff0000');
  });

  it('clamps negative values to 0', () => {
    expect(rgbToHex({ r: -10, g: 0, b: 0 })).toBe('#000000');
  });
});

describe('hexToRgba', () => {
  it('converts 8-digit hex with full alpha', () => {
    expect(hexToRgba('#ff0000ff')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('converts 8-digit hex with half alpha', () => {
    const result = hexToRgba('#ff000080');
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
    expect(result.a).toBeCloseTo(128 / 255, 2);
  });

  it('converts 8-digit hex with zero alpha', () => {
    expect(hexToRgba('#ff000000')).toEqual({ r: 255, g: 0, b: 0, a: 0 });
  });

  it('converts 4-digit shorthand #f00f', () => {
    expect(hexToRgba('#f00f')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('falls back to alpha=1 for 6-digit hex', () => {
    expect(hexToRgba('#ff0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });
});

describe('rgbaToHex', () => {
  it('appends ff for full alpha', () => {
    expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 1 })).toBe('#ff0000ff');
  });

  it('appends 00 for zero alpha', () => {
    expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 0 })).toBe('#ff000000');
  });

  it('appends 80 for ~0.5 alpha', () => {
    expect(rgbaToHex({ r: 255, g: 255, b: 255, a: 0.5 })).toBe('#ffffff80');
  });
});

// ==================== HSL CONVERSIONS ====================

describe('rgbToHsl', () => {
  it('converts red', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts green', () => {
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
  });

  it('converts blue', () => {
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
  });

  it('converts white', () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('converts black', () => {
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('converts mid-gray', () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 });
  });

  it('converts cyan', () => {
    expect(rgbToHsl({ r: 0, g: 255, b: 255 })).toEqual({ h: 180, s: 100, l: 50 });
  });

  it('converts yellow', () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 0 })).toEqual({ h: 60, s: 100, l: 50 });
  });
});

describe('hslToRgb', () => {
  it('converts achromatic (s=0) gray', () => {
    expect(hslToRgb({ h: 0, s: 0, l: 50 })).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('converts achromatic white', () => {
    expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts achromatic black', () => {
    expect(hslToRgb({ h: 0, s: 0, l: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('converts chromatic red', () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts chromatic green', () => {
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('converts chromatic blue', () => {
    expect(hslToRgb({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
  });
});

describe('hexToHsl', () => {
  it('converts #ff0000 to hsl(0,100,50)', () => {
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts #00ff00 to hsl(120,100,50)', () => {
    expect(hexToHsl('#00ff00')).toEqual({ h: 120, s: 100, l: 50 });
  });

  it('converts #ffffff to hsl(0,0,100)', () => {
    expect(hexToHsl('#ffffff')).toEqual({ h: 0, s: 0, l: 100 });
  });
});

describe('hslToHex', () => {
  it('converts hsl(0,100,50) to #ff0000', () => {
    expect(hslToHex({ h: 0, s: 100, l: 50 })).toBe('#ff0000');
  });

  it('converts hsl(120,100,50) to #00ff00', () => {
    expect(hslToHex({ h: 120, s: 100, l: 50 })).toBe('#00ff00');
  });

  it('converts hsl(240,100,50) to #0000ff', () => {
    expect(hslToHex({ h: 240, s: 100, l: 50 })).toBe('#0000ff');
  });
});

// ==================== HSV CONVERSIONS ====================

describe('rgbToHsv', () => {
  it('converts red', () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, v: 100 });
  });

  it('converts green', () => {
    expect(rgbToHsv({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, v: 100 });
  });

  it('converts blue', () => {
    expect(rgbToHsv({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, v: 100 });
  });

  it('converts black', () => {
    expect(rgbToHsv({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, v: 0 });
  });

  it('converts white', () => {
    expect(rgbToHsv({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, v: 100 });
  });

  it('converts yellow', () => {
    expect(rgbToHsv({ r: 255, g: 255, b: 0 })).toEqual({ h: 60, s: 100, v: 100 });
  });
});

describe('hsvToRgb', () => {
  it('sector 0: red (h=0)', () => {
    expect(hsvToRgb({ h: 0, s: 100, v: 100 })).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('sector 1: yellow (h=60)', () => {
    expect(hsvToRgb({ h: 60, s: 100, v: 100 })).toEqual({ r: 255, g: 255, b: 0 });
  });

  it('sector 2: green (h=120)', () => {
    expect(hsvToRgb({ h: 120, s: 100, v: 100 })).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('sector 3: cyan (h=180)', () => {
    expect(hsvToRgb({ h: 180, s: 100, v: 100 })).toEqual({ r: 0, g: 255, b: 255 });
  });

  it('sector 4: blue (h=240)', () => {
    expect(hsvToRgb({ h: 240, s: 100, v: 100 })).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('sector 5: magenta (h=300)', () => {
    expect(hsvToRgb({ h: 300, s: 100, v: 100 })).toEqual({ r: 255, g: 0, b: 255 });
  });

  it('achromatic black (s=0, v=0)', () => {
    expect(hsvToRgb({ h: 0, s: 0, v: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('achromatic white (s=0, v=100)', () => {
    expect(hsvToRgb({ h: 0, s: 0, v: 100 })).toEqual({ r: 255, g: 255, b: 255 });
  });
});

// ==================== CMYK CONVERSIONS ====================

describe('rgbToCmyk', () => {
  it('converts red', () => {
    expect(rgbToCmyk({ r: 255, g: 0, b: 0 })).toEqual({ c: 0, m: 100, y: 100, k: 0 });
  });

  it('converts green', () => {
    expect(rgbToCmyk({ r: 0, g: 255, b: 0 })).toEqual({ c: 100, m: 0, y: 100, k: 0 });
  });

  it('converts blue', () => {
    expect(rgbToCmyk({ r: 0, g: 0, b: 255 })).toEqual({ c: 100, m: 100, y: 0, k: 0 });
  });

  it('converts white', () => {
    expect(rgbToCmyk({ r: 255, g: 255, b: 255 })).toEqual({ c: 0, m: 0, y: 0, k: 0 });
  });

  it('converts black (k=100)', () => {
    expect(rgbToCmyk({ r: 0, g: 0, b: 0 })).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });

  it('converts yellow', () => {
    expect(rgbToCmyk({ r: 255, g: 255, b: 0 })).toEqual({ c: 0, m: 0, y: 100, k: 0 });
  });
});

describe('cmykToRgb', () => {
  it('converts pure red cmyk', () => {
    expect(cmykToRgb({ c: 0, m: 100, y: 100, k: 0 })).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts white cmyk', () => {
    expect(cmykToRgb({ c: 0, m: 0, y: 0, k: 0 })).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts black cmyk', () => {
    expect(cmykToRgb({ c: 0, m: 0, y: 0, k: 100 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('round-trips red through cmyk', () => {
    const original = { r: 255, g: 0, b: 0 };
    expect(cmykToRgb(rgbToCmyk(original))).toEqual(original);
  });

  it('round-trips green through cmyk', () => {
    const original = { r: 0, g: 255, b: 0 };
    expect(cmykToRgb(rgbToCmyk(original))).toEqual(original);
  });
});

// ==================== CSS STRING PARSING ====================

describe('parseColor', () => {
  it('parses hex #ff0000', () => {
    expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('parses shorthand hex #f00', () => {
    expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('parses rgb() string', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('parses rgba() string', () => {
    expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
  });

  it('parses hsl() string', () => {
    const result = parseColor('hsl(0, 100%, 50%)');
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
    expect(result.a).toBe(1);
  });

  it('parses hsla() string', () => {
    const result = parseColor('hsla(0, 100%, 50%, 0.5)');
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
    expect(result.a).toBe(0.5);
  });

  it('parses named color "red"', () => {
    expect(parseColor('red')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('parses named color "white"', () => {
    expect(parseColor('white')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('parses named color "black"', () => {
    expect(parseColor('black')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it('parses named color "blue"', () => {
    expect(parseColor('blue')).toEqual({ r: 0, g: 0, b: 255, a: 1 });
  });

  it('handles leading/trailing whitespace', () => {
    expect(parseColor('  #ff0000  ')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('handles uppercase input', () => {
    expect(parseColor('#FF0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('throws on invalid color string', () => {
    expect(() => parseColor('notacolor')).toThrow('Unable to parse color');
  });

  it('throws on empty string', () => {
    expect(() => parseColor('')).toThrow('Unable to parse color');
  });
});

// ==================== CSS STRING FORMATTING ====================

describe('toRgbString', () => {
  it('formats RGB correctly', () => {
    expect(toRgbString({ r: 255, g: 0, b: 0 })).toBe('rgb(255, 0, 0)');
  });

  it('formats black', () => {
    expect(toRgbString({ r: 0, g: 0, b: 0 })).toBe('rgb(0, 0, 0)');
  });
});

describe('toRgbaString', () => {
  it('formats RGBA correctly', () => {
    expect(toRgbaString({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('formats with alpha=1', () => {
    expect(toRgbaString({ r: 0, g: 255, b: 0, a: 1 })).toBe('rgba(0, 255, 0, 1)');
  });
});

describe('toHslString', () => {
  it('formats HSL correctly', () => {
    expect(toHslString({ h: 0, s: 100, l: 50 })).toBe('hsl(0, 100%, 50%)');
  });

  it('formats achromatic', () => {
    expect(toHslString({ h: 0, s: 0, l: 0 })).toBe('hsl(0, 0%, 0%)');
  });
});

describe('toHslaString', () => {
  it('formats HSLA correctly', () => {
    expect(toHslaString({ h: 0, s: 100, l: 50, a: 0.5 })).toBe('hsla(0, 100%, 50%, 0.5)');
  });

  it('formats with alpha=1', () => {
    expect(toHslaString({ h: 120, s: 100, l: 50, a: 1 })).toBe('hsla(120, 100%, 50%, 1)');
  });
});

// ==================== UTILITIES ====================

describe('luminance', () => {
  it('returns 0 for black', () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 4);
  });

  it('returns 1 for white', () => {
    expect(luminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 4);
  });

  it('returns ~0.2126 for pure red', () => {
    expect(luminance({ r: 255, g: 0, b: 0 })).toBeCloseTo(0.2126, 3);
  });
});

describe('contrastRatio', () => {
  it('returns 21 for white vs black', () => {
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    expect(contrastRatio(white, black)).toBeCloseTo(21, 0);
  });

  it('returns 1 for same color', () => {
    const red = { r: 255, g: 0, b: 0 };
    expect(contrastRatio(red, red)).toBeCloseTo(1, 2);
  });

  it('is commutative (order does not matter)', () => {
    const white = { r: 255, g: 255, b: 255 };
    const red = { r: 255, g: 0, b: 0 };
    expect(contrastRatio(white, red)).toBeCloseTo(contrastRatio(red, white), 4);
  });
});

describe('isLight', () => {
  it('returns true for white', () => {
    expect(isLight({ r: 255, g: 255, b: 255 })).toBe(true);
  });

  it('returns false for black', () => {
    expect(isLight({ r: 0, g: 0, b: 0 })).toBe(false);
  });

  it('returns true for yellow (high luminance)', () => {
    expect(isLight({ r: 255, g: 255, b: 0 })).toBe(true);
  });

  it('returns false for dark blue', () => {
    expect(isLight({ r: 0, g: 0, b: 128 })).toBe(false);
  });
});

describe('getContrastColor', () => {
  it('returns black for white background', () => {
    expect(getContrastColor({ r: 255, g: 255, b: 255 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns white for black background', () => {
    expect(getContrastColor({ r: 0, g: 0, b: 0 })).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns white for dark blue', () => {
    expect(getContrastColor({ r: 0, g: 0, b: 128 })).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns black for yellow', () => {
    expect(getContrastColor({ r: 255, g: 255, b: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe('mix', () => {
  it('mixes 50/50 black and white to gray', () => {
    const result = mix({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 0.5);
    expect(result).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('weight=0 returns first color', () => {
    const result = mix({ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }, 0);
    expect(result).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('weight=1 returns second color', () => {
    const result = mix({ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }, 1);
    expect(result).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('weighted mix (0.25)', () => {
    const result = mix({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 0.25);
    expect(result).toEqual({ r: 64, g: 64, b: 64 });
  });

  it('uses default weight of 0.5', () => {
    const result = mix({ r: 0, g: 0, b: 0 }, { r: 254, g: 254, b: 254 });
    expect(result).toEqual({ r: 127, g: 127, b: 127 });
  });
});

describe('lighten', () => {
  it('lightens red by 20', () => {
    const result = lighten({ r: 255, g: 0, b: 0 }, 20);
    const hsl = rgbToHsl(result);
    expect(hsl.l).toBe(70);
  });

  it('does not exceed l=100', () => {
    const result = lighten({ r: 255, g: 255, b: 255 }, 50);
    expect(result).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('darken', () => {
  it('darkens red by 20', () => {
    const result = darken({ r: 255, g: 0, b: 0 }, 20);
    const hsl = rgbToHsl(result);
    expect(hsl.l).toBe(30);
  });

  it('does not go below l=0', () => {
    const result = darken({ r: 0, g: 0, b: 0 }, 50);
    expect(result).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe('saturate', () => {
  it('saturates a desaturated color', () => {
    const gray = { r: 128, g: 128, b: 128 };
    const result = saturate(gray, 50);
    const hsl = rgbToHsl(result);
    expect(hsl.s).toBe(50);
  });

  it('does not exceed s=100', () => {
    const result = saturate({ r: 255, g: 0, b: 0 }, 50);
    const hsl = rgbToHsl(result);
    expect(hsl.s).toBeLessThanOrEqual(100);
  });
});

describe('desaturate', () => {
  it('desaturates a saturated color', () => {
    const result = desaturate({ r: 255, g: 0, b: 0 }, 50);
    const hsl = rgbToHsl(result);
    expect(hsl.s).toBe(50);
  });

  it('fully desaturates to gray', () => {
    const result = desaturate({ r: 255, g: 0, b: 0 }, 100);
    const hsl = rgbToHsl(result);
    expect(hsl.s).toBe(0);
  });
});

describe('complement', () => {
  it('complement of red is cyan', () => {
    const result = complement({ r: 255, g: 0, b: 0 });
    expect(result).toEqual({ r: 0, g: 255, b: 255 });
  });

  it('complement of green (h=120) shifts to magenta area (h=300)', () => {
    const result = complement({ r: 0, g: 255, b: 0 });
    const hsl = rgbToHsl(result);
    expect(hsl.h).toBe(300);
  });

  it('complement of blue (h=240) shifts to yellow (h=60)', () => {
    const result = complement({ r: 0, g: 0, b: 255 });
    const hsl = rgbToHsl(result);
    expect(hsl.h).toBe(60);
  });
});

describe('grayscale', () => {
  it('white stays white', () => {
    expect(grayscale({ r: 255, g: 255, b: 255 })).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('black stays black', () => {
    expect(grayscale({ r: 0, g: 0, b: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('uses weighted average (0.299r + 0.587g + 0.114b)', () => {
    const result = grayscale({ r: 255, g: 0, b: 0 });
    const expected = Math.round(0.299 * 255);
    expect(result).toEqual({ r: expected, g: expected, b: expected });
  });

  it('green has higher weight than red', () => {
    const redGray = grayscale({ r: 255, g: 0, b: 0 });
    const greenGray = grayscale({ r: 0, g: 255, b: 0 });
    expect(greenGray.r).toBeGreaterThan(redGray.r);
  });
});

describe('invert', () => {
  it('inverts white to black', () => {
    expect(invert({ r: 255, g: 255, b: 255 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('inverts black to white', () => {
    expect(invert({ r: 0, g: 0, b: 0 })).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('inverts red to cyan', () => {
    expect(invert({ r: 255, g: 0, b: 0 })).toEqual({ r: 0, g: 255, b: 255 });
  });

  it('double invert returns original', () => {
    const original = { r: 123, g: 45, b: 67 };
    expect(invert(invert(original))).toEqual(original);
  });
});

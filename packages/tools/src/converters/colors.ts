/**
 * Color Converter Library
 * Convert between various color formats
 */

// ==================== TYPES ====================

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSLA extends HSL {
  a: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface LAB {
  l: number;
  a: number;
  b: number;
}

// ==================== HEX CONVERSIONS ====================

export function hexToRgb(hex: string): RGB {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Handle shorthand (e.g., #fff)
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function hexToRgba(hex: string): RGBA {
  hex = hex.replace(/^#/, '');
  
  if (hex.length === 4) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  const num = parseInt(hex, 16);
  
  if (hex.length === 8) {
    return {
      r: (num >> 24) & 255,
      g: (num >> 16) & 255,
      b: (num >> 8) & 255,
      a: (num & 255) / 255,
    };
  }
  
  return {
    ...hexToRgb(hex),
    a: 1,
  };
}

export function rgbaToHex(rgba: RGBA): string {
  const rgb = rgbToHex(rgba);
  const alpha = Math.round(rgba.a * 255).toString(16).padStart(2, '0');
  return `${rgb}${alpha}`;
}

// ==================== HSL CONVERSIONS ====================

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

// ==================== HSV CONVERSIONS ====================

export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  
  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;
  
  let r: number, g: number, b: number;
  
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = 0; g = 0; b = 0;
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ==================== CMYK CONVERSIONS ====================

export function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const k = 1 - Math.max(r, g, b);
  
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  
  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

export function cmykToRgb(cmyk: CMYK): RGB {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;
  
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

// ==================== CSS STRING PARSING ====================

export function parseColor(color: string): RGBA {
  color = color.trim().toLowerCase();
  
  // Hex
  if (color.startsWith('#')) {
    return hexToRgba(color);
  }
  
  // RGB/RGBA
  const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
      a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1,
    };
  }
  
  // HSL/HSLA
  const hslMatch = color.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*([\d.]+))?\s*\)/);
  if (hslMatch) {
    const rgb = hslToRgb({
      h: parseInt(hslMatch[1]),
      s: parseInt(hslMatch[2]),
      l: parseInt(hslMatch[3]),
    });
    return {
      ...rgb,
      a: hslMatch[4] ? parseFloat(hslMatch[4]) : 1,
    };
  }
  
  // Named colors (subset)
  const namedColors: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    gray: '#808080',
    grey: '#808080',
    orange: '#ffa500',
    pink: '#ffc0cb',
    purple: '#800080',
    brown: '#a52a2a',
  };
  
  if (namedColors[color]) {
    return hexToRgba(namedColors[color]);
  }
  
  throw new Error(`Unable to parse color: ${color}`);
}

// ==================== CSS STRING FORMATTING ====================

export function toRgbString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function toRgbaString(rgba: RGBA): string {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}

export function toHslString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

export function toHslaString(hsla: HSLA): string {
  return `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${hsla.a})`;
}

// ==================== UTILITIES ====================

export function luminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(color1: RGB, color2: RGB): number {
  const l1 = luminance(color1);
  const l2 = luminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isLight(rgb: RGB): boolean {
  return luminance(rgb) > 0.179;
}

export function getContrastColor(rgb: RGB): RGB {
  return isLight(rgb) ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
}

export function mix(color1: RGB, color2: RGB, weight = 0.5): RGB {
  return {
    r: Math.round(color1.r * (1 - weight) + color2.r * weight),
    g: Math.round(color1.g * (1 - weight) + color2.g * weight),
    b: Math.round(color1.b * (1 - weight) + color2.b * weight),
  };
}

export function lighten(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.min(100, hsl.l + amount);
  return hslToRgb(hsl);
}

export function darken(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.max(0, hsl.l - amount);
  return hslToRgb(hsl);
}

export function saturate(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.s = Math.min(100, hsl.s + amount);
  return hslToRgb(hsl);
}

export function desaturate(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.s = Math.max(0, hsl.s - amount);
  return hslToRgb(hsl);
}

export function complement(rgb: RGB): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.h = (hsl.h + 180) % 360;
  return hslToRgb(hsl);
}

export function grayscale(rgb: RGB): RGB {
  const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
  return { r: gray, g: gray, b: gray };
}

export function invert(rgb: RGB): RGB {
  return {
    r: 255 - rgb.r,
    g: 255 - rgb.g,
    b: 255 - rgb.b,
  };
}

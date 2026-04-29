/**
 * Theme System Utilities
 * 
 * OKLCH color space utilities, contrast checking, and CSS variable helpers.
 * Uses culori for perceptually uniform color transformations.
 * 
 * @see docs/BUILT/09_THEME_SYSTEM.md
 */

import { oklch, formatHex, formatCss, converter, parse } from 'culori';
import { hex as wcagHex, score } from 'wcag-contrast';
import type { OklchColor } from './types';

// Convert any color to OKLCH
const toOklch = converter('oklch');

/**
 * Parse any color string to OKLCH format
 */
export function parseToOklch(color: string): OklchColor | null {
  const parsed = toOklch(color) as Record<string, unknown> | undefined;
  if (!parsed) return null;
  
  return {
    l: (parsed.l as number) ?? 0,
    c: (parsed.c as number) ?? 0,
    h: (parsed.h as number) ?? 0,
    alpha: parsed.alpha as number | undefined,
  };
}

/**
 * Create an OKLCH color object
 */
export function createOklch(l: number, c: number, h: number, alpha?: number): OklchColor {
  return { l, c, h, alpha };
}

/**
 * Convert OKLCH to CSS string
 */
export function oklchToCss(color: OklchColor): string {
  const culoriColor = oklch({
    mode: 'oklch',
    l: color.l,
    c: color.c,
    h: color.h,
    alpha: color.alpha,
  });
  return formatCss(culoriColor) ?? 'oklch(0 0 0)';
}

/**
 * Convert OKLCH to HEX string (for user display)
 */
export function oklchToHex(color: OklchColor): string {
  const culoriColor = oklch({
    mode: 'oklch',
    l: color.l,
    c: color.c,
    h: color.h,
    alpha: color.alpha,
  });
  return formatHex(culoriColor) ?? '#000000';
}

/**
 * Convert HEX to OKLCH
 */
export function hexToOklch(hex: string): OklchColor | null {
  return parseToOklch(hex);
}

/**
 * Clamp OKLCH values to valid ranges
 */
export function clampOklch(color: OklchColor): OklchColor {
  return {
    l: Math.max(0, Math.min(1, color.l)),
    c: Math.max(0, Math.min(0.4, color.c)), // Max chroma for display compatibility
    h: ((color.h % 360) + 360) % 360, // Normalize hue to 0-360
    alpha: color.alpha !== undefined ? Math.max(0, Math.min(1, color.alpha)) : undefined,
  };
}

/**
 * Adjust lightness of an OKLCH color
 */
export function adjustLightness(color: OklchColor, delta: number): OklchColor {
  return clampOklch({
    ...color,
    l: color.l + delta,
  });
}

/**
 * Adjust chroma of an OKLCH color
 */
export function adjustChroma(color: OklchColor, factor: number): OklchColor {
  return clampOklch({
    ...color,
    c: color.c * factor,
  });
}

/**
 * Shift hue of an OKLCH color
 */
export function shiftHue(color: OklchColor, degrees: number): OklchColor {
  return {
    ...color,
    h: ((color.h + degrees) % 360 + 360) % 360,
  };
}

/**
 * Calculate contrast ratio between two colors (WCAG 2.1)
 * Returns a ratio between 1 and 21
 */
export function getContrastRatio(color1: OklchColor, color2: OklchColor): number {
  const hex1 = oklchToHex(color1);
  const hex2 = oklchToHex(color2);
  return wcagHex(hex1, hex2);
}

/**
 * Check if contrast meets WCAG AA standard (4.5:1 for normal text)
 */
export function meetsContrastAA(foreground: OklchColor, background: OklchColor): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/**
 * Check if contrast meets WCAG AAA standard (7:1 for normal text)
 */
export function meetsContrastAAA(foreground: OklchColor, background: OklchColor): boolean {
  return getContrastRatio(foreground, background) >= 7;
}

/**
 * Get WCAG score for contrast ratio
 */
export function getContrastScore(foreground: OklchColor, background: OklchColor): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  const ratio = getContrastRatio(foreground, background);
  return score(ratio);
}

/**
 * Adjust foreground lightness to meet minimum contrast ratio
 */
export function ensureContrast(
  foreground: OklchColor,
  background: OklchColor,
  minRatio: number = 4.5,
  maxIterations: number = 20
): OklchColor {
  let adjusted = { ...foreground };
  const bgLightness = background.l;
  const direction = bgLightness > 0.5 ? -1 : 1; // Darken on light bg, lighten on dark bg
  const bgHex = oklchToHex(background); // Cache — background doesn't change
  
  let iterations = 0;
  while (iterations < maxIterations) {
    const fgHex = oklchToHex(adjusted);
    if (wcagHex(fgHex, bgHex) >= minRatio) break;
    adjusted = adjustLightness(adjusted, direction * 0.05);
    iterations++;
  }
  
  return adjusted;
}

/**
 * Generate a foreground color that contrasts well with the background
 */
export function generateContrastingForeground(
  background: OklchColor,
  hue?: number,
  minRatio: number = 4.5
): OklchColor {
  const isLightBg = background.l > 0.5;
  const baseForeground = createOklch(
    isLightBg ? 0.2 : 0.95,
    0.01,
    hue ?? background.h
  );
  
  return ensureContrast(baseForeground, background, minRatio);
}

/**
 * Mix two OKLCH colors
 */
export function mixColors(color1: OklchColor, color2: OklchColor, ratio: number = 0.5): OklchColor {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  
  // Handle hue wrapping for proper interpolation
  let h1 = color1.h;
  let h2 = color2.h;
  const hueDiff = h2 - h1;
  
  if (Math.abs(hueDiff) > 180) {
    if (hueDiff > 0) {
      h1 += 360;
    } else {
      h2 += 360;
    }
  }
  
  return clampOklch({
    l: color1.l + (color2.l - color1.l) * clampedRatio,
    c: color1.c + (color2.c - color1.c) * clampedRatio,
    h: (h1 + (h2 - h1) * clampedRatio) % 360,
    alpha: (color1.alpha ?? 1) + ((color2.alpha ?? 1) - (color1.alpha ?? 1)) * clampedRatio,
  });
}

/**
 * Derive a muted version of a color
 */
export function muteColor(color: OklchColor, factor: number = 0.3): OklchColor {
  return clampOklch({
    ...color,
    c: color.c * factor,
  });
}

/**
 * Get a complementary color (180° hue shift)
 */
export function getComplementary(color: OklchColor): OklchColor {
  return shiftHue(color, 180);
}

/**
 * Get analogous colors (±30° hue shift)
 */
export function getAnalogous(color: OklchColor): [OklchColor, OklchColor] {
  return [shiftHue(color, -30), shiftHue(color, 30)];
}

/**
 * Get triadic colors (±120° hue shift)
 */
export function getTriadic(color: OklchColor): [OklchColor, OklchColor] {
  return [shiftHue(color, 120), shiftHue(color, 240)];
}

/**
 * Generate a chart color palette from a base color
 */
export function generateChartPalette(baseColor: OklchColor, count: number = 5): OklchColor[] {
  const palette: OklchColor[] = [];
  const hueStep = 360 / count;
  
  for (let i = 0; i < count; i++) {
    palette.push(
      clampOklch({
        l: 0.55 + (i * 0.05), // Vary lightness slightly
        c: Math.max(0.15, baseColor.c * (1 - i * 0.1)), // Decrease chroma
        h: (baseColor.h + i * hueStep) % 360,
      })
    );
  }
  
  return palette;
}

/**
 * Convert CSS variables map to inline style string
 */
export function cssVarsToStyleString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

/**
 * Convert CSS variables map to React style object
 */
export function cssVarsToStyleObject(vars: Record<string, string>): Record<string, string> {
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    style[key] = value;
  }
  return style;
}

/**
 * Apply CSS variables to document root
 */
export function applyCssVarsToRoot(vars: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

/**
 * Remove CSS variables from document root
 */
export function removeCssVarsFromRoot(keys: string[]): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  for (const key of keys) {
    root.style.removeProperty(key);
  }
}

/**
 * Get computed CSS variable value from document
 */
export function getComputedCssVar(varName: string): string {
  if (typeof document === 'undefined') return '';
  
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

/**
 * Check if a color string is valid
 */
export function isValidColor(color: string): boolean {
  try {
    const parsed = parse(color);
    return parsed !== undefined;
  } catch {
    return false;
  }
}

/**
 * Normalize any color to HEX format
 */
export function normalizeToHex(color: string): string {
  const oklchColor = parseToOklch(color);
  if (!oklchColor) return '#000000';
  return oklchToHex(oklchColor);
}

/**
 * Validate and normalize a theme intent color
 */
export function validateAndNormalizeColor(color: string): string {
  const parsed = parseToOklch(color);
  
  if (!parsed) {
    // Fallback to neutral gray if color is invalid
    return 'oklch(0.5 0 0)';
  }
  
  // If chroma is too high for the given lightness, reduce it
  if (parsed.c > 0.4) {
    return oklchToCss({ ...parsed, c: 0.4 });
  }
  
  return oklchToCss(parsed);
}

/**
 * Constants for common OKLCH colors
 */
export const OKLCH_COLORS = {
  white: createOklch(1, 0, 0),
  black: createOklch(0, 0, 0),
  transparent: createOklch(0, 0, 0, 0),
  
  // Neutrals (for default theme)
  neutral50: createOklch(0.985, 0, 0),
  neutral100: createOklch(0.967, 0.001, 286),
  neutral200: createOklch(0.92, 0.004, 286),
  neutral300: createOklch(0.87, 0.006, 286),
  neutral400: createOklch(0.705, 0.015, 286),
  neutral500: createOklch(0.552, 0.016, 286),
  neutral600: createOklch(0.442, 0.012, 286),
  neutral700: createOklch(0.371, 0.01, 286),
  neutral800: createOklch(0.274, 0.006, 286),
  neutral900: createOklch(0.21, 0.006, 286),
  neutral950: createOklch(0.141, 0.005, 286),
} as const;

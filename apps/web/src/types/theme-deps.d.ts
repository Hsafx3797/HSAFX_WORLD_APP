/**
 * Type declarations for culori and wcag-contrast libraries
 * These libraries don't ship with TypeScript types
 */

declare module 'culori' {
  export interface OklchColor {
    mode: 'oklch';
    l: number;
    c: number;
    h?: number;
    alpha?: number;
  }

  export interface RgbColor {
    mode: 'rgb';
    r: number;
    g: number;
    b: number;
    alpha?: number;
  }

  export type Color = OklchColor | RgbColor | Record<string, unknown>;

  /** Parse a CSS color string and convert to oklch */
  export function oklch(color: string | Record<string, unknown> | undefined): OklchColor | undefined;

  /** Convert any color to hex format */
  export function formatHex(color: Color | undefined): string | undefined;

  /** Format any color as CSS string */
  export function formatCss(color: Color | undefined): string | undefined;

  /** Create a converter function for a specific color mode */
  export function converter(mode: string): (color: Color | string | undefined) => Color | undefined;

  /** Parse a CSS color string */
  export function parse(color: string): Color | undefined;
}

declare module 'wcag-contrast' {
  /** Calculate contrast ratio between two hex colors */
  export function hex(color1: string, color2: string): number;

  /** Get WCAG score for a contrast ratio */
  export function score(ratio: number): 'AAA' | 'AA' | 'AA Large' | 'Fail';
}

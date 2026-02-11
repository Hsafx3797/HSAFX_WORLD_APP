declare module 'culori' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function oklch(color: string | Record<string, unknown>): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function formatHex(color: any): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function formatCss(color: any): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function converter(mode: string): (color: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function parse(color: string): any;
}

declare module 'wcag-contrast' {
  export function hex(color1: string, color2: string): number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function score(ratio: number): any;
}

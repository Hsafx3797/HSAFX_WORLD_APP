/**
 * CSS Generators
 * Generate gradients, shadows, borders, filters, animations, etc.
 */

// ==================== GRADIENTS ====================

export interface GradientStop {
  color: string;
  position: number;
}

export function generateLinearGradient(stops: GradientStop[], angle = 90): string {
  const colorStops = stops
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(', ');
  return `linear-gradient(${angle}deg, ${colorStops})`;
}

export function generateRadialGradient(
  stops: GradientStop[],
  shape: 'circle' | 'ellipse' = 'circle',
  position = 'center'
): string {
  const colorStops = stops
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(', ');
  return `radial-gradient(${shape} at ${position}, ${colorStops})`;
}

export function generateConicGradient(stops: GradientStop[], angle = 0, position = 'center'): string {
  const colorStops = stops
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(', ');
  return `conic-gradient(from ${angle}deg at ${position}, ${colorStops})`;
}

// ==================== SHADOWS ====================

export interface BoxShadowOptions {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadRadius: number;
  color: string;
  inset?: boolean;
}

export function generateBoxShadow(shadows: BoxShadowOptions[]): string {
  return shadows
    .map(s => {
      const inset = s.inset ? 'inset ' : '';
      return `${inset}${s.offsetX}px ${s.offsetY}px ${s.blurRadius}px ${s.spreadRadius}px ${s.color}`;
    })
    .join(', ');
}

export interface TextShadowOptions {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  color: string;
}

export function generateTextShadow(shadows: TextShadowOptions[]): string {
  return shadows
    .map(s => `${s.offsetX}px ${s.offsetY}px ${s.blurRadius}px ${s.color}`)
    .join(', ');
}

// ==================== BORDERS ====================

export function generateBorderRadius(options: {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
  unit?: 'px' | '%' | 'em' | 'rem';
}): string {
  const { topLeft, topRight, bottomRight, bottomLeft, unit = 'px' } = options;
  if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
    return `${topLeft}${unit}`;
  }
  return `${topLeft}${unit} ${topRight}${unit} ${bottomRight}${unit} ${bottomLeft}${unit}`;
}

export function generateBorder(options: {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset' | 'none';
  color: string;
  unit?: 'px' | 'em' | 'rem';
}): string {
  const { width, style, color, unit = 'px' } = options;
  return `${width}${unit} ${style} ${color}`;
}

// ==================== FILTERS ====================

export interface FilterOptions {
  blur?: number;
  brightness?: number;
  contrast?: number;
  grayscale?: number;
  hueRotate?: number;
  invert?: number;
  opacity?: number;
  saturate?: number;
  sepia?: number;
}

export function generateFilter(options: FilterOptions): string {
  const filters: string[] = [];
  
  if (options.blur !== undefined) filters.push(`blur(${options.blur}px)`);
  if (options.brightness !== undefined) filters.push(`brightness(${options.brightness}%)`);
  if (options.contrast !== undefined) filters.push(`contrast(${options.contrast}%)`);
  if (options.grayscale !== undefined) filters.push(`grayscale(${options.grayscale}%)`);
  if (options.hueRotate !== undefined) filters.push(`hue-rotate(${options.hueRotate}deg)`);
  if (options.invert !== undefined) filters.push(`invert(${options.invert}%)`);
  if (options.opacity !== undefined) filters.push(`opacity(${options.opacity}%)`);
  if (options.saturate !== undefined) filters.push(`saturate(${options.saturate}%)`);
  if (options.sepia !== undefined) filters.push(`sepia(${options.sepia}%)`);
  
  return filters.join(' ') || 'none';
}

// ==================== TRANSFORMS ====================

export interface TransformOptions {
  translateX?: number;
  translateY?: number;
  translateZ?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  skewX?: number;
  skewY?: number;
  perspective?: number;
}

export function generateTransform(options: TransformOptions, unit = 'px'): string {
  const transforms: string[] = [];
  
  if (options.perspective !== undefined) transforms.push(`perspective(${options.perspective}${unit})`);
  if (options.translateX !== undefined) transforms.push(`translateX(${options.translateX}${unit})`);
  if (options.translateY !== undefined) transforms.push(`translateY(${options.translateY}${unit})`);
  if (options.translateZ !== undefined) transforms.push(`translateZ(${options.translateZ}${unit})`);
  if (options.rotate !== undefined) transforms.push(`rotate(${options.rotate}deg)`);
  if (options.rotateX !== undefined) transforms.push(`rotateX(${options.rotateX}deg)`);
  if (options.rotateY !== undefined) transforms.push(`rotateY(${options.rotateY}deg)`);
  if (options.rotateZ !== undefined) transforms.push(`rotateZ(${options.rotateZ}deg)`);
  if (options.scaleX !== undefined) transforms.push(`scaleX(${options.scaleX})`);
  if (options.scaleY !== undefined) transforms.push(`scaleY(${options.scaleY})`);
  if (options.scaleZ !== undefined) transforms.push(`scaleZ(${options.scaleZ})`);
  if (options.skewX !== undefined) transforms.push(`skewX(${options.skewX}deg)`);
  if (options.skewY !== undefined) transforms.push(`skewY(${options.skewY}deg)`);
  
  return transforms.join(' ') || 'none';
}

// ==================== ANIMATIONS ====================

export interface AnimationKeyframe {
  offset: number; // 0-100
  properties: Record<string, string>;
}

export function generateKeyframes(name: string, keyframes: AnimationKeyframe[]): string {
  const frames = keyframes
    .sort((a, b) => a.offset - b.offset)
    .map(kf => {
      const props = Object.entries(kf.properties)
        .map(([key, value]) => `    ${key}: ${value};`)
        .join('\n');
      return `  ${kf.offset}% {\n${props}\n  }`;
    })
    .join('\n');
  
  return `@keyframes ${name} {\n${frames}\n}`;
}

export interface AnimationOptions {
  name: string;
  duration: string;
  timingFunction?: string;
  delay?: string;
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  playState?: 'running' | 'paused';
}

export function generateAnimation(options: AnimationOptions): string {
  const parts = [
    options.name,
    options.duration,
    options.timingFunction || 'ease',
    options.delay || '0s',
    options.iterationCount?.toString() || '1',
    options.direction || 'normal',
    options.fillMode || 'none',
    options.playState || 'running',
  ];
  return parts.join(' ');
}

// ==================== TRANSITIONS ====================

export interface TransitionOptions {
  property: string;
  duration: string;
  timingFunction?: string;
  delay?: string;
}

export function generateTransition(transitions: TransitionOptions[]): string {
  return transitions
    .map(t => `${t.property} ${t.duration} ${t.timingFunction || 'ease'} ${t.delay || '0s'}`)
    .join(', ');
}

// ==================== FLEXBOX ====================

export interface FlexboxOptions {
  display?: 'flex' | 'inline-flex';
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline';
  alignContent?: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  gap?: string;
}

export function generateFlexbox(options: FlexboxOptions): string {
  const properties: string[] = [];
  
  properties.push(`display: ${options.display || 'flex'};`);
  if (options.flexDirection) properties.push(`flex-direction: ${options.flexDirection};`);
  if (options.flexWrap) properties.push(`flex-wrap: ${options.flexWrap};`);
  if (options.justifyContent) properties.push(`justify-content: ${options.justifyContent};`);
  if (options.alignItems) properties.push(`align-items: ${options.alignItems};`);
  if (options.alignContent) properties.push(`align-content: ${options.alignContent};`);
  if (options.gap) properties.push(`gap: ${options.gap};`);
  
  return properties.join('\n');
}

// ==================== GRID ====================

export interface GridOptions {
  display?: 'grid' | 'inline-grid';
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridTemplateAreas?: string[];
  gap?: string;
  justifyItems?: 'start' | 'end' | 'center' | 'stretch';
  alignItems?: 'start' | 'end' | 'center' | 'stretch';
  justifyContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
  alignContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
}

export function generateGrid(options: GridOptions): string {
  const properties: string[] = [];
  
  properties.push(`display: ${options.display || 'grid'};`);
  if (options.gridTemplateColumns) properties.push(`grid-template-columns: ${options.gridTemplateColumns};`);
  if (options.gridTemplateRows) properties.push(`grid-template-rows: ${options.gridTemplateRows};`);
  if (options.gridTemplateAreas) {
    const areas = options.gridTemplateAreas.map(a => `"${a}"`).join('\n    ');
    properties.push(`grid-template-areas:\n    ${areas};`);
  }
  if (options.gap) properties.push(`gap: ${options.gap};`);
  if (options.justifyItems) properties.push(`justify-items: ${options.justifyItems};`);
  if (options.alignItems) properties.push(`align-items: ${options.alignItems};`);
  if (options.justifyContent) properties.push(`justify-content: ${options.justifyContent};`);
  if (options.alignContent) properties.push(`align-content: ${options.alignContent};`);
  
  return properties.join('\n');
}

// ==================== CLAMP ====================

export function generateClamp(min: string, preferred: string, max: string): string {
  return `clamp(${min}, ${preferred}, ${max})`;
}

// ==================== MEDIA QUERY ====================

export interface MediaQueryOptions {
  type?: 'screen' | 'print' | 'all';
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  orientation?: 'portrait' | 'landscape';
  prefersColorScheme?: 'light' | 'dark';
  prefersReducedMotion?: 'no-preference' | 'reduce';
}

export function generateMediaQuery(options: MediaQueryOptions, content: string): string {
  const conditions: string[] = [];
  
  if (options.type) conditions.push(options.type);
  if (options.minWidth) conditions.push(`(min-width: ${options.minWidth})`);
  if (options.maxWidth) conditions.push(`(max-width: ${options.maxWidth})`);
  if (options.minHeight) conditions.push(`(min-height: ${options.minHeight})`);
  if (options.maxHeight) conditions.push(`(max-height: ${options.maxHeight})`);
  if (options.orientation) conditions.push(`(orientation: ${options.orientation})`);
  if (options.prefersColorScheme) conditions.push(`(prefers-color-scheme: ${options.prefersColorScheme})`);
  if (options.prefersReducedMotion) conditions.push(`(prefers-reduced-motion: ${options.prefersReducedMotion})`);
  
  const query = conditions.join(' and ') || 'all';
  return `@media ${query} {\n${content}\n}`;
}

// ==================== CSS VARIABLE ====================

export function generateCssVariable(name: string, value: string): string {
  return `--${name}: ${value};`;
}

export function generateCssVariables(variables: Record<string, string>): string {
  return Object.entries(variables)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join('\n');
}

// ==================== COLOR FUNCTIONS ====================

export function generateRgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function generateHsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

export function hexToRgba(hex: string, alpha = 1): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Web CSS Generators - Exact copy from apps/web/src/lib/tools/css-generators.ts
 * This is the canonical source for all CSS generator implementations used by the web app.
 */

export interface GradientStop {
  color: string;
  position: number;
}

// Linear gradient generator
export function generateLinearGradient(
  stops: GradientStop[],
  angle = 90
): string {
  const colorStops = stops
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(', ');
  
  return `linear-gradient(${angle}deg, ${colorStops})`;
}

// Radial gradient generator
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

// Conic gradient generator
export function generateConicGradient(
  stops: GradientStop[],
  angle = 0,
  position = 'center'
): string {
  const colorStops = stops
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(', ');
  
  return `conic-gradient(from ${angle}deg at ${position}, ${colorStops})`;
}

// Box shadow generator
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

// Text shadow generator
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

// Border radius generator
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

// Filter generator
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

// Transform generator
export interface TransformOptions {
  translateX?: number;
  translateY?: number;
  translateZ?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  skewX?: number;
  skewY?: number;
}

export function generateTransform(options: TransformOptions): string {
  const transforms: string[] = [];
  
  if (options.translateX !== undefined || options.translateY !== undefined) {
    const x = options.translateX || 0;
    const y = options.translateY || 0;
    transforms.push(`translate(${x}px, ${y}px)`);
  }
  if (options.translateZ !== undefined) transforms.push(`translateZ(${options.translateZ}px)`);
  
  if (options.scaleX !== undefined || options.scaleY !== undefined) {
    const x = options.scaleX ?? 1;
    const y = options.scaleY ?? 1;
    transforms.push(`scale(${x}, ${y})`);
  }
  if (options.scaleZ !== undefined) transforms.push(`scaleZ(${options.scaleZ})`);
  
  if (options.rotateX !== undefined) transforms.push(`rotateX(${options.rotateX}deg)`);
  if (options.rotateY !== undefined) transforms.push(`rotateY(${options.rotateY}deg)`);
  if (options.rotateZ !== undefined) transforms.push(`rotate(${options.rotateZ}deg)`);
  
  if (options.skewX !== undefined) transforms.push(`skewX(${options.skewX}deg)`);
  if (options.skewY !== undefined) transforms.push(`skewY(${options.skewY}deg)`);
  
  return transforms.join(' ') || 'none';
}

// Animation/Keyframes generator
export interface KeyframeStep {
  percentage: number;
  properties: Record<string, string>;
}

export function generateKeyframes(name: string, steps: KeyframeStep[]): string {
  const sortedSteps = steps.sort((a, b) => a.percentage - b.percentage);
  
  const keyframeRules = sortedSteps.map(step => {
    const props = Object.entries(step.properties)
      .map(([key, value]) => `    ${key}: ${value};`)
      .join('\n');
    return `  ${step.percentage}% {\n${props}\n  }`;
  });
  
  return `@keyframes ${name} {\n${keyframeRules.join('\n')}\n}`;
}

// Animation shorthand generator
export interface AnimationOptions {
  name: string;
  duration: number;
  timingFunction?: string;
  delay?: number;
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  playState?: 'running' | 'paused';
}

export function generateAnimation(options: AnimationOptions): string {
  const {
    name,
    duration,
    timingFunction = 'ease',
    delay = 0,
    iterationCount = 1,
    direction = 'normal',
    fillMode = 'none',
    playState = 'running',
  } = options;
  
  return `${name} ${duration}s ${timingFunction} ${delay}s ${iterationCount} ${direction} ${fillMode} ${playState}`;
}

// Transition generator
export interface TransitionOptions {
  property: string;
  duration: number;
  timingFunction?: string;
  delay?: number;
}

export function generateTransition(transitions: TransitionOptions[]): string {
  return transitions
    .map(t => `${t.property} ${t.duration}s ${t.timingFunction || 'ease'} ${t.delay || 0}s`)
    .join(', ');
}

// Flex container generator
export interface FlexContainerOptions {
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch';
  gap?: number;
}

export function generateFlexContainer(options: FlexContainerOptions): Record<string, string> {
  const css: Record<string, string> = { display: 'flex' };
  
  if (options.direction) css['flex-direction'] = options.direction;
  if (options.wrap) css['flex-wrap'] = options.wrap;
  if (options.justifyContent) css['justify-content'] = options.justifyContent;
  if (options.alignItems) css['align-items'] = options.alignItems;
  if (options.alignContent) css['align-content'] = options.alignContent;
  if (options.gap !== undefined) css['gap'] = `${options.gap}px`;
  
  return css;
}

// Grid container generator
export interface GridContainerOptions {
  columns?: string;
  rows?: string;
  gap?: number | { row: number; column: number };
  justifyItems?: 'start' | 'end' | 'center' | 'stretch';
  alignItems?: 'start' | 'end' | 'center' | 'stretch';
  justifyContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
  alignContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
}

export function generateGridContainer(options: GridContainerOptions): Record<string, string> {
  const css: Record<string, string> = { display: 'grid' };
  
  if (options.columns) css['grid-template-columns'] = options.columns;
  if (options.rows) css['grid-template-rows'] = options.rows;
  
  if (options.gap !== undefined) {
    if (typeof options.gap === 'number') {
      css['gap'] = `${options.gap}px`;
    } else {
      css['row-gap'] = `${options.gap.row}px`;
      css['column-gap'] = `${options.gap.column}px`;
    }
  }
  
  if (options.justifyItems) css['justify-items'] = options.justifyItems;
  if (options.alignItems) css['align-items'] = options.alignItems;
  if (options.justifyContent) css['justify-content'] = options.justifyContent;
  if (options.alignContent) css['align-content'] = options.alignContent;
  
  return css;
}

// Media query generator
export function generateMediaQuery(
  breakpoint: number,
  type: 'min-width' | 'max-width' | 'min-height' | 'max-height',
  css: string
): string {
  return `@media (${type}: ${breakpoint}px) {\n${css}\n}`;
}

// Clamp generator (fluid typography/spacing)
export function generateClamp(
  minValue: number,
  preferredValue: number,
  maxValue: number,
  unit: 'px' | 'rem' | 'em' = 'px',
  preferredUnit: 'vw' | 'vh' | '%' = 'vw'
): string {
  return `clamp(${minValue}${unit}, ${preferredValue}${preferredUnit}, ${maxValue}${unit})`;
}

// CSS variable generator
export function generateCssVariables(variables: Record<string, string>): string {
  return Object.entries(variables)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join('\n');
}

// Complete CSS class generator
export function generateCssClass(className: string, properties: Record<string, string>): string {
  const props = Object.entries(properties)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  
  return `.${className} {\n${props}\n}`;
}

// Tailwind to CSS converter (basic)
const tailwindMap: Record<string, Record<string, string>> = {
  'flex': { display: 'flex' },
  'grid': { display: 'grid' },
  'hidden': { display: 'none' },
  'block': { display: 'block' },
  'inline': { display: 'inline' },
  'inline-block': { display: 'inline-block' },
  'items-center': { 'align-items': 'center' },
  'items-start': { 'align-items': 'flex-start' },
  'items-end': { 'align-items': 'flex-end' },
  'justify-center': { 'justify-content': 'center' },
  'justify-between': { 'justify-content': 'space-between' },
  'justify-around': { 'justify-content': 'space-around' },
  'text-center': { 'text-align': 'center' },
  'text-left': { 'text-align': 'left' },
  'text-right': { 'text-align': 'right' },
  'font-bold': { 'font-weight': 'bold' },
  'font-semibold': { 'font-weight': '600' },
  'font-medium': { 'font-weight': '500' },
  'font-normal': { 'font-weight': '400' },
  'font-light': { 'font-weight': '300' },
  'italic': { 'font-style': 'italic' },
  'underline': { 'text-decoration': 'underline' },
  'line-through': { 'text-decoration': 'line-through' },
  'uppercase': { 'text-transform': 'uppercase' },
  'lowercase': { 'text-transform': 'lowercase' },
  'capitalize': { 'text-transform': 'capitalize' },
  'truncate': { 'overflow': 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' },
  'overflow-hidden': { 'overflow': 'hidden' },
  'overflow-auto': { 'overflow': 'auto' },
  'overflow-scroll': { 'overflow': 'scroll' },
  'relative': { 'position': 'relative' },
  'absolute': { 'position': 'absolute' },
  'fixed': { 'position': 'fixed' },
  'sticky': { 'position': 'sticky' },
  'rounded': { 'border-radius': '0.25rem' },
  'rounded-full': { 'border-radius': '9999px' },
  'rounded-none': { 'border-radius': '0' },
  'shadow': { 'box-shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
  'shadow-lg': { 'box-shadow': '0 10px 15px -3px rgb(0 0 0 / 0.1)' },
  'shadow-none': { 'box-shadow': 'none' },
};

export function tailwindToCss(classes: string): Record<string, string> {
  const result: Record<string, string> = {};
  const classNames = classes.split(/\s+/).filter(Boolean);
  
  for (const className of classNames) {
    if (tailwindMap[className]) {
      Object.assign(result, tailwindMap[className]);
      continue;
    }
    
    // Handle spacing utilities (p-4, m-4, etc.)
    const spacingMatch = className.match(/^(p|m|px|py|mx|my|pt|pb|pl|pr|mt|mb|ml|mr)-(\d+)$/);
    if (spacingMatch) {
      const type = spacingMatch[1]!;
      const size = spacingMatch[2]!;
      const value = `${parseInt(size, 10) * 0.25}rem`;
      const propMap: Record<string, string[]> = {
        'p': ['padding'],
        'm': ['margin'],
        'px': ['padding-left', 'padding-right'],
        'py': ['padding-top', 'padding-bottom'],
        'mx': ['margin-left', 'margin-right'],
        'my': ['margin-top', 'margin-bottom'],
        'pt': ['padding-top'],
        'pb': ['padding-bottom'],
        'pl': ['padding-left'],
        'pr': ['padding-right'],
        'mt': ['margin-top'],
        'mb': ['margin-bottom'],
        'ml': ['margin-left'],
        'mr': ['margin-right'],
      };
      
      const props = propMap[type];
      if (props) {
        props.forEach((prop: string) => result[prop] = value);
      }
      continue;
    }
    
    // Handle text size utilities (text-sm, text-lg, etc.)
    const textSizeMap: Record<string, string> = {
      'text-xs': '0.75rem',
      'text-sm': '0.875rem',
      'text-base': '1rem',
      'text-lg': '1.125rem',
      'text-xl': '1.25rem',
      'text-2xl': '1.5rem',
      'text-3xl': '1.875rem',
      'text-4xl': '2.25rem',
    };
    
    if (textSizeMap[className]) {
      result['font-size'] = textSizeMap[className];
      continue;
    }
    
    // Handle width/height utilities (w-full, h-screen, etc.)
    const sizeMap: Record<string, Record<string, string>> = {
      'w-full': { width: '100%' },
      'w-screen': { width: '100vw' },
      'w-auto': { width: 'auto' },
      'h-full': { height: '100%' },
      'h-screen': { height: '100vh' },
      'h-auto': { height: 'auto' },
      'min-w-0': { 'min-width': '0' },
      'min-h-0': { 'min-height': '0' },
      'max-w-full': { 'max-width': '100%' },
      'max-h-full': { 'max-height': '100%' },
    };
    
    if (sizeMap[className]) {
      Object.assign(result, sizeMap[className]);
    }
  }
  
  return result;
}

// CSS to object converter
export function cssToObject(css: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  const declarations = css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .split(';')
    .filter(d => d.trim());
  
  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex !== -1) {
      const property = declaration.slice(0, colonIndex).trim();
      const value = declaration.slice(colonIndex + 1).trim();
      if (property && value) {
        result[property] = value;
      }
    }
  }
  
  return result;
}

// Object to CSS converter
export function objectToCss(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([property, value]) => `${property}: ${value};`)
    .join('\n');
}

// Clip-path generator
export function generateClipPath(shape: string, points?: number[][]): string {
  switch (shape) {
    case 'circle':
      return 'clip-path: circle(50% at 50% 50%);';
    case 'ellipse':
      return 'clip-path: ellipse(50% 30% at 50% 50%);';
    case 'inset':
      return 'clip-path: inset(10% 20% 10% 20% round 10px);';
    case 'polygon':
      if (points && points.length > 0) {
        const pointsStr = points.map(p => `${p[0] ?? 0}% ${p[1] ?? 0}%`).join(', ');
        return `clip-path: polygon(${pointsStr});`;
      }
      // Default triangle
      return 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%);';
    case 'triangle':
      return 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%);';
    case 'pentagon':
      return 'clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);';
    case 'hexagon':
      return 'clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);';
    case 'star':
      return 'clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);';
    case 'arrow-right':
      return 'clip-path: polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%);';
    case 'arrow-left':
      return 'clip-path: polygon(40% 0%, 40% 20%, 100% 20%, 100% 80%, 40% 80%, 40% 100%, 0% 50%);';
    default:
      return 'clip-path: none;';
  }
}

// Typography generator
export function generateTypography(options: {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  textDecoration?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
}): string {
  const rules: string[] = [];
  
  if (options.fontFamily) rules.push(`font-family: ${options.fontFamily};`);
  if (options.fontSize) rules.push(`font-size: ${options.fontSize};`);
  if (options.fontWeight) rules.push(`font-weight: ${options.fontWeight};`);
  if (options.lineHeight) rules.push(`line-height: ${options.lineHeight};`);
  if (options.letterSpacing) rules.push(`letter-spacing: ${options.letterSpacing};`);
  if (options.textTransform) rules.push(`text-transform: ${options.textTransform};`);
  if (options.textDecoration) rules.push(`text-decoration: ${options.textDecoration};`);
  if (options.textAlign) rules.push(`text-align: ${options.textAlign};`);
  if (options.color) rules.push(`color: ${options.color};`);
  
  return rules.join('\n');
}

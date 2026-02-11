import { describe, it, expect } from 'vitest';
import {
  generateLinearGradient,
  generateRadialGradient,
  generateConicGradient,
  generateBoxShadow,
  generateTextShadow,
  generateBorderRadius,
  generateBorder,
  generateFilter,
  generateTransform,
  generateKeyframes,
  generateAnimation,
  generateTransition,
  generateFlexbox,
  generateGrid,
  generateClamp,
  generateMediaQuery,
  generateCssVariable,
  generateCssVariables,
  generateRgba,
  generateHsla,
  hexToRgba,
} from '../css';

// ==================== GRADIENTS ====================

describe('generateLinearGradient', () => {
  it('should generate a linear gradient with two stops', () => {
    const result = generateLinearGradient(
      [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 100 },
      ],
      90
    );
    expect(result).toBe('linear-gradient(90deg, #ff0000 0%, #0000ff 100%)');
  });

  it('should use default angle of 90 when not specified', () => {
    const result = generateLinearGradient([
      { color: 'red', position: 0 },
      { color: 'blue', position: 100 },
    ]);
    expect(result).toContain('90deg');
  });

  it('should sort stops by position', () => {
    const result = generateLinearGradient([
      { color: 'blue', position: 100 },
      { color: 'red', position: 0 },
      { color: 'green', position: 50 },
    ]);
    expect(result).toBe('linear-gradient(90deg, red 0%, green 50%, blue 100%)');
  });

  it('should handle a custom angle', () => {
    const result = generateLinearGradient(
      [{ color: 'red', position: 0 }, { color: 'blue', position: 100 }],
      45
    );
    expect(result).toBe('linear-gradient(45deg, red 0%, blue 100%)');
  });

  it('should handle a single stop', () => {
    const result = generateLinearGradient([{ color: '#fff', position: 50 }]);
    expect(result).toBe('linear-gradient(90deg, #fff 50%)');
  });

  it('should handle 0 degree angle', () => {
    const result = generateLinearGradient(
      [{ color: 'red', position: 0 }, { color: 'blue', position: 100 }],
      0
    );
    expect(result).toContain('0deg');
  });

  it('should handle negative angle', () => {
    const result = generateLinearGradient(
      [{ color: 'red', position: 0 }, { color: 'blue', position: 100 }],
      -45
    );
    expect(result).toBe('linear-gradient(-45deg, red 0%, blue 100%)');
  });
});

describe('generateRadialGradient', () => {
  it('should generate a radial gradient with default shape and position', () => {
    const result = generateRadialGradient([
      { color: 'red', position: 0 },
      { color: 'blue', position: 100 },
    ]);
    expect(result).toBe('radial-gradient(circle at center, red 0%, blue 100%)');
  });

  it('should accept ellipse shape', () => {
    const result = generateRadialGradient(
      [{ color: 'red', position: 0 }, { color: 'blue', position: 100 }],
      'ellipse'
    );
    expect(result).toContain('ellipse at center');
  });

  it('should accept custom position', () => {
    const result = generateRadialGradient(
      [{ color: 'red', position: 0 }, { color: 'blue', position: 100 }],
      'circle',
      'top left'
    );
    expect(result).toContain('circle at top left');
  });

  it('should sort stops by position', () => {
    const result = generateRadialGradient([
      { color: 'blue', position: 100 },
      { color: 'red', position: 0 },
    ]);
    expect(result).toBe('radial-gradient(circle at center, red 0%, blue 100%)');
  });

  it('should handle three stops', () => {
    const result = generateRadialGradient([
      { color: 'red', position: 0 },
      { color: 'green', position: 50 },
      { color: 'blue', position: 100 },
    ]);
    expect(result).toContain('red 0%, green 50%, blue 100%');
  });
});

describe('generateConicGradient', () => {
  it('should generate a conic gradient with defaults', () => {
    const result = generateConicGradient([
      { color: 'red', position: 0 },
      { color: 'blue', position: 100 },
    ]);
    expect(result).toBe('conic-gradient(from 0deg at center, red 0%, blue 100%)');
  });

  it('should accept custom angle', () => {
    const result = generateConicGradient(
      [{ color: 'red', position: 0 }, { color: 'blue', position: 100 }],
      45
    );
    expect(result).toContain('from 45deg');
  });

  it('should accept custom position', () => {
    const result = generateConicGradient(
      [{ color: 'red', position: 0 }, { color: 'blue', position: 100 }],
      0,
      '50% 50%'
    );
    expect(result).toContain('at 50% 50%');
  });

  it('should sort stops by position', () => {
    const result = generateConicGradient([
      { color: 'blue', position: 100 },
      { color: 'red', position: 0 },
    ]);
    expect(result).toContain('red 0%, blue 100%');
  });
});

// ==================== SHADOWS ====================

describe('generateBoxShadow', () => {
  it('should generate a single box shadow', () => {
    const result = generateBoxShadow([
      { offsetX: 2, offsetY: 4, blurRadius: 6, spreadRadius: 0, color: 'rgba(0,0,0,0.5)' },
    ]);
    expect(result).toBe('2px 4px 6px 0px rgba(0,0,0,0.5)');
  });

  it('should generate an inset box shadow', () => {
    const result = generateBoxShadow([
      { offsetX: 0, offsetY: 0, blurRadius: 10, spreadRadius: 5, color: '#000', inset: true },
    ]);
    expect(result).toBe('inset 0px 0px 10px 5px #000');
  });

  it('should generate multiple box shadows separated by comma', () => {
    const result = generateBoxShadow([
      { offsetX: 1, offsetY: 2, blurRadius: 3, spreadRadius: 0, color: 'red' },
      { offsetX: 4, offsetY: 5, blurRadius: 6, spreadRadius: 1, color: 'blue' },
    ]);
    expect(result).toBe('1px 2px 3px 0px red, 4px 5px 6px 1px blue');
  });

  it('should handle inset false explicitly', () => {
    const result = generateBoxShadow([
      { offsetX: 1, offsetY: 1, blurRadius: 1, spreadRadius: 1, color: '#fff', inset: false },
    ]);
    expect(result).toBe('1px 1px 1px 1px #fff');
    expect(result).not.toContain('inset');
  });

  it('should handle negative offsets', () => {
    const result = generateBoxShadow([
      { offsetX: -3, offsetY: -5, blurRadius: 10, spreadRadius: 0, color: '#333' },
    ]);
    expect(result).toBe('-3px -5px 10px 0px #333');
  });
});

describe('generateTextShadow', () => {
  it('should generate a single text shadow', () => {
    const result = generateTextShadow([
      { offsetX: 1, offsetY: 1, blurRadius: 2, color: '#000' },
    ]);
    expect(result).toBe('1px 1px 2px #000');
  });

  it('should generate multiple text shadows', () => {
    const result = generateTextShadow([
      { offsetX: 1, offsetY: 1, blurRadius: 2, color: 'red' },
      { offsetX: 2, offsetY: 2, blurRadius: 4, color: 'blue' },
    ]);
    expect(result).toBe('1px 1px 2px red, 2px 2px 4px blue');
  });

  it('should handle zero values', () => {
    const result = generateTextShadow([
      { offsetX: 0, offsetY: 0, blurRadius: 0, color: 'transparent' },
    ]);
    expect(result).toBe('0px 0px 0px transparent');
  });
});

// ==================== BORDERS ====================

describe('generateBorderRadius', () => {
  it('should generate shorthand when all corners are equal', () => {
    const result = generateBorderRadius({
      topLeft: 10,
      topRight: 10,
      bottomRight: 10,
      bottomLeft: 10,
    });
    expect(result).toBe('10px');
  });

  it('should generate longhand when corners differ', () => {
    const result = generateBorderRadius({
      topLeft: 5,
      topRight: 10,
      bottomRight: 15,
      bottomLeft: 20,
    });
    expect(result).toBe('5px 10px 15px 20px');
  });

  it('should use custom unit', () => {
    const result = generateBorderRadius({
      topLeft: 50,
      topRight: 50,
      bottomRight: 50,
      bottomLeft: 50,
      unit: '%',
    });
    expect(result).toBe('50%');
  });

  it('should use custom unit with different corners', () => {
    const result = generateBorderRadius({
      topLeft: 1,
      topRight: 2,
      bottomRight: 3,
      bottomLeft: 4,
      unit: 'em',
    });
    expect(result).toBe('1em 2em 3em 4em');
  });

  it('should default to px unit', () => {
    const result = generateBorderRadius({
      topLeft: 0,
      topRight: 0,
      bottomRight: 0,
      bottomLeft: 0,
    });
    expect(result).toBe('0px');
  });

  it('should use rem unit', () => {
    const result = generateBorderRadius({
      topLeft: 1,
      topRight: 1,
      bottomRight: 1,
      bottomLeft: 1,
      unit: 'rem',
    });
    expect(result).toBe('1rem');
  });
});

describe('generateBorder', () => {
  it('should generate a border shorthand', () => {
    const result = generateBorder({ width: 1, style: 'solid', color: '#000' });
    expect(result).toBe('1px solid #000');
  });

  it('should handle dashed style', () => {
    const result = generateBorder({ width: 2, style: 'dashed', color: 'red' });
    expect(result).toBe('2px dashed red');
  });

  it('should handle dotted style', () => {
    const result = generateBorder({ width: 3, style: 'dotted', color: 'blue' });
    expect(result).toBe('3px dotted blue');
  });

  it('should use custom unit', () => {
    const result = generateBorder({ width: 0.5, style: 'solid', color: '#ccc', unit: 'em' });
    expect(result).toBe('0.5em solid #ccc');
  });

  it('should handle none style', () => {
    const result = generateBorder({ width: 0, style: 'none', color: 'transparent' });
    expect(result).toBe('0px none transparent');
  });
});

// ==================== FILTERS ====================

describe('generateFilter', () => {
  it('should generate blur filter', () => {
    expect(generateFilter({ blur: 5 })).toBe('blur(5px)');
  });

  it('should generate brightness filter', () => {
    expect(generateFilter({ brightness: 120 })).toBe('brightness(120%)');
  });

  it('should generate contrast filter', () => {
    expect(generateFilter({ contrast: 150 })).toBe('contrast(150%)');
  });

  it('should generate grayscale filter', () => {
    expect(generateFilter({ grayscale: 100 })).toBe('grayscale(100%)');
  });

  it('should generate hue-rotate filter', () => {
    expect(generateFilter({ hueRotate: 90 })).toBe('hue-rotate(90deg)');
  });

  it('should generate invert filter', () => {
    expect(generateFilter({ invert: 100 })).toBe('invert(100%)');
  });

  it('should generate opacity filter', () => {
    expect(generateFilter({ opacity: 50 })).toBe('opacity(50%)');
  });

  it('should generate saturate filter', () => {
    expect(generateFilter({ saturate: 200 })).toBe('saturate(200%)');
  });

  it('should generate sepia filter', () => {
    expect(generateFilter({ sepia: 80 })).toBe('sepia(80%)');
  });

  it('should combine multiple filters', () => {
    const result = generateFilter({ blur: 2, brightness: 110, contrast: 90 });
    expect(result).toBe('blur(2px) brightness(110%) contrast(90%)');
  });

  it('should return "none" when no filters specified', () => {
    expect(generateFilter({})).toBe('none');
  });

  it('should handle zero values', () => {
    expect(generateFilter({ blur: 0 })).toBe('blur(0px)');
  });
});

// ==================== TRANSFORMS ====================

describe('generateTransform', () => {
  it('should generate translateX', () => {
    expect(generateTransform({ translateX: 10 })).toBe('translateX(10px)');
  });

  it('should generate translateY', () => {
    expect(generateTransform({ translateY: 20 })).toBe('translateY(20px)');
  });

  it('should generate translateZ', () => {
    expect(generateTransform({ translateZ: 30 })).toBe('translateZ(30px)');
  });

  it('should generate rotate', () => {
    expect(generateTransform({ rotate: 45 })).toBe('rotate(45deg)');
  });

  it('should generate scaleX', () => {
    expect(generateTransform({ scaleX: 1.5 })).toBe('scaleX(1.5)');
  });

  it('should generate scaleY', () => {
    expect(generateTransform({ scaleY: 2 })).toBe('scaleY(2)');
  });

  it('should generate skewX', () => {
    expect(generateTransform({ skewX: 10 })).toBe('skewX(10deg)');
  });

  it('should generate skewY', () => {
    expect(generateTransform({ skewY: 15 })).toBe('skewY(15deg)');
  });

  it('should generate perspective', () => {
    expect(generateTransform({ perspective: 500 })).toBe('perspective(500px)');
  });

  it('should combine multiple transforms in correct order', () => {
    const result = generateTransform({ perspective: 100, translateX: 10, rotate: 45 });
    expect(result).toBe('perspective(100px) translateX(10px) rotate(45deg)');
  });

  it('should return "none" when no transforms specified', () => {
    expect(generateTransform({})).toBe('none');
  });

  it('should use custom unit for translation values', () => {
    expect(generateTransform({ translateX: 5 }, 'em')).toBe('translateX(5em)');
  });

  it('should apply custom unit to perspective', () => {
    expect(generateTransform({ perspective: 800 }, 'rem')).toBe('perspective(800rem)');
  });

  it('should generate rotateX, rotateY, rotateZ', () => {
    const result = generateTransform({ rotateX: 30, rotateY: 60, rotateZ: 90 });
    expect(result).toBe('rotateX(30deg) rotateY(60deg) rotateZ(90deg)');
  });

  it('should generate scaleZ', () => {
    expect(generateTransform({ scaleZ: 0.5 })).toBe('scaleZ(0.5)');
  });
});

// ==================== ANIMATIONS ====================

describe('generateKeyframes', () => {
  it('should generate a simple keyframe animation', () => {
    const result = generateKeyframes('fadeIn', [
      { offset: 0, properties: { opacity: '0' } },
      { offset: 100, properties: { opacity: '1' } },
    ]);
    expect(result).toContain('@keyframes fadeIn');
    expect(result).toContain('0% {');
    expect(result).toContain('opacity: 0;');
    expect(result).toContain('100% {');
    expect(result).toContain('opacity: 1;');
  });

  it('should sort keyframes by offset', () => {
    const result = generateKeyframes('slide', [
      { offset: 100, properties: { transform: 'translateX(100px)' } },
      { offset: 0, properties: { transform: 'translateX(0)' } },
    ]);
    const idx0 = result.indexOf('0% {');
    const idx100 = result.indexOf('100% {');
    expect(idx0).toBeLessThan(idx100);
  });

  it('should handle multiple properties in a keyframe', () => {
    const result = generateKeyframes('complex', [
      { offset: 0, properties: { opacity: '0', transform: 'scale(0.5)' } },
      { offset: 100, properties: { opacity: '1', transform: 'scale(1)' } },
    ]);
    expect(result).toContain('opacity: 0;');
    expect(result).toContain('transform: scale(0.5);');
  });

  it('should handle three keyframes', () => {
    const result = generateKeyframes('bounce', [
      { offset: 0, properties: { top: '0px' } },
      { offset: 50, properties: { top: '-20px' } },
      { offset: 100, properties: { top: '0px' } },
    ]);
    expect(result).toContain('50% {');
    expect(result).toContain('top: -20px;');
  });
});

describe('generateAnimation', () => {
  it('should generate animation shorthand with defaults', () => {
    const result = generateAnimation({ name: 'fadeIn', duration: '1s' });
    expect(result).toBe('fadeIn 1s ease 0s 1 normal none running');
  });

  it('should use custom timing function', () => {
    const result = generateAnimation({
      name: 'slide',
      duration: '0.5s',
      timingFunction: 'linear',
    });
    expect(result).toContain('linear');
  });

  it('should use custom delay', () => {
    const result = generateAnimation({
      name: 'pop',
      duration: '0.3s',
      delay: '0.2s',
    });
    expect(result).toContain('0.2s');
  });

  it('should handle infinite iteration count', () => {
    const result = generateAnimation({
      name: 'spin',
      duration: '2s',
      iterationCount: 'infinite',
    });
    expect(result).toContain('infinite');
  });

  it('should handle alternate direction', () => {
    const result = generateAnimation({
      name: 'pulse',
      duration: '1s',
      direction: 'alternate',
    });
    expect(result).toContain('alternate');
  });

  it('should handle forwards fill mode', () => {
    const result = generateAnimation({
      name: 'fadeOut',
      duration: '0.5s',
      fillMode: 'forwards',
    });
    expect(result).toContain('forwards');
  });

  it('should handle paused play state', () => {
    const result = generateAnimation({
      name: 'test',
      duration: '1s',
      playState: 'paused',
    });
    expect(result).toContain('paused');
  });
});

// ==================== TRANSITIONS ====================

describe('generateTransition', () => {
  it('should generate a single transition', () => {
    const result = generateTransition([
      { property: 'opacity', duration: '0.3s' },
    ]);
    expect(result).toBe('opacity 0.3s ease 0s');
  });

  it('should generate multiple transitions', () => {
    const result = generateTransition([
      { property: 'opacity', duration: '0.3s' },
      { property: 'transform', duration: '0.5s' },
    ]);
    expect(result).toBe('opacity 0.3s ease 0s, transform 0.5s ease 0s');
  });

  it('should use custom timing function and delay', () => {
    const result = generateTransition([
      { property: 'all', duration: '1s', timingFunction: 'ease-in-out', delay: '0.1s' },
    ]);
    expect(result).toBe('all 1s ease-in-out 0.1s');
  });

  it('should default timing to ease and delay to 0s', () => {
    const result = generateTransition([{ property: 'color', duration: '0.2s' }]);
    expect(result).toContain('ease');
    expect(result).toContain('0s');
  });
});

// ==================== FLEXBOX ====================

describe('generateFlexbox', () => {
  it('should generate display: flex by default', () => {
    const result = generateFlexbox({});
    expect(result).toContain('display: flex;');
  });

  it('should use inline-flex when specified', () => {
    const result = generateFlexbox({ display: 'inline-flex' });
    expect(result).toContain('display: inline-flex;');
  });

  it('should include flex-direction', () => {
    const result = generateFlexbox({ flexDirection: 'column' });
    expect(result).toContain('flex-direction: column;');
  });

  it('should include flex-wrap', () => {
    const result = generateFlexbox({ flexWrap: 'wrap' });
    expect(result).toContain('flex-wrap: wrap;');
  });

  it('should include justify-content', () => {
    const result = generateFlexbox({ justifyContent: 'space-between' });
    expect(result).toContain('justify-content: space-between;');
  });

  it('should include align-items', () => {
    const result = generateFlexbox({ alignItems: 'center' });
    expect(result).toContain('align-items: center;');
  });

  it('should include align-content', () => {
    const result = generateFlexbox({ alignContent: 'flex-end' });
    expect(result).toContain('align-content: flex-end;');
  });

  it('should include gap', () => {
    const result = generateFlexbox({ gap: '16px' });
    expect(result).toContain('gap: 16px;');
  });

  it('should combine all properties', () => {
    const result = generateFlexbox({
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'center',
      alignItems: 'stretch',
      gap: '8px',
    });
    expect(result).toContain('display: flex;');
    expect(result).toContain('flex-direction: row;');
    expect(result).toContain('flex-wrap: nowrap;');
    expect(result).toContain('justify-content: center;');
    expect(result).toContain('align-items: stretch;');
    expect(result).toContain('gap: 8px;');
  });
});

// ==================== GRID ====================

describe('generateGrid', () => {
  it('should generate display: grid by default', () => {
    const result = generateGrid({});
    expect(result).toContain('display: grid;');
  });

  it('should use inline-grid when specified', () => {
    const result = generateGrid({ display: 'inline-grid' });
    expect(result).toContain('display: inline-grid;');
  });

  it('should include grid-template-columns', () => {
    const result = generateGrid({ gridTemplateColumns: '1fr 1fr 1fr' });
    expect(result).toContain('grid-template-columns: 1fr 1fr 1fr;');
  });

  it('should include grid-template-rows', () => {
    const result = generateGrid({ gridTemplateRows: 'auto 1fr auto' });
    expect(result).toContain('grid-template-rows: auto 1fr auto;');
  });

  it('should include grid-template-areas', () => {
    const result = generateGrid({
      gridTemplateAreas: ['header header', 'sidebar main', 'footer footer'],
    });
    expect(result).toContain('grid-template-areas:');
    expect(result).toContain('"header header"');
    expect(result).toContain('"sidebar main"');
    expect(result).toContain('"footer footer"');
  });

  it('should include gap', () => {
    const result = generateGrid({ gap: '20px' });
    expect(result).toContain('gap: 20px;');
  });

  it('should include justify-items', () => {
    const result = generateGrid({ justifyItems: 'center' });
    expect(result).toContain('justify-items: center;');
  });

  it('should include align-items', () => {
    const result = generateGrid({ alignItems: 'start' });
    expect(result).toContain('align-items: start;');
  });

  it('should include justify-content', () => {
    const result = generateGrid({ justifyContent: 'space-evenly' });
    expect(result).toContain('justify-content: space-evenly;');
  });

  it('should include align-content', () => {
    const result = generateGrid({ alignContent: 'stretch' });
    expect(result).toContain('align-content: stretch;');
  });
});

// ==================== CLAMP ====================

describe('generateClamp', () => {
  it('should generate a clamp value', () => {
    expect(generateClamp('1rem', '2.5vw', '3rem')).toBe('clamp(1rem, 2.5vw, 3rem)');
  });

  it('should handle pixel values', () => {
    expect(generateClamp('12px', '1.5vw', '24px')).toBe('clamp(12px, 1.5vw, 24px)');
  });

  it('should handle calc expressions', () => {
    expect(generateClamp('16px', 'calc(1rem + 1vw)', '32px')).toBe(
      'clamp(16px, calc(1rem + 1vw), 32px)'
    );
  });
});

// ==================== MEDIA QUERY ====================

describe('generateMediaQuery', () => {
  it('should generate a media query with min-width', () => {
    const result = generateMediaQuery({ minWidth: '768px' }, '.container { width: 100%; }');
    expect(result).toContain('@media (min-width: 768px)');
    expect(result).toContain('.container { width: 100%; }');
  });

  it('should generate with screen type', () => {
    const result = generateMediaQuery({ type: 'screen', minWidth: '1024px' }, 'body {}');
    expect(result).toContain('@media screen and (min-width: 1024px)');
  });

  it('should generate with max-width', () => {
    const result = generateMediaQuery({ maxWidth: '600px' }, 'div {}');
    expect(result).toContain('(max-width: 600px)');
  });

  it('should combine min and max width', () => {
    const result = generateMediaQuery(
      { minWidth: '768px', maxWidth: '1200px' },
      'section {}'
    );
    expect(result).toContain('(min-width: 768px) and (max-width: 1200px)');
  });

  it('should handle orientation', () => {
    const result = generateMediaQuery({ orientation: 'landscape' }, 'img {}');
    expect(result).toContain('(orientation: landscape)');
  });

  it('should handle prefers-color-scheme', () => {
    const result = generateMediaQuery({ prefersColorScheme: 'dark' }, ':root {}');
    expect(result).toContain('(prefers-color-scheme: dark)');
  });

  it('should handle prefers-reduced-motion', () => {
    const result = generateMediaQuery({ prefersReducedMotion: 'reduce' }, '* {}');
    expect(result).toContain('(prefers-reduced-motion: reduce)');
  });

  it('should default to "all" when no conditions', () => {
    const result = generateMediaQuery({}, 'body {}');
    expect(result).toBe('@media all {\nbody {}\n}');
  });

  it('should handle min-height and max-height', () => {
    const result = generateMediaQuery(
      { minHeight: '500px', maxHeight: '900px' },
      '.box {}'
    );
    expect(result).toContain('(min-height: 500px)');
    expect(result).toContain('(max-height: 900px)');
  });
});

// ==================== CSS VARIABLE ====================

describe('generateCssVariable', () => {
  it('should generate a single CSS variable', () => {
    expect(generateCssVariable('primary', '#3b82f6')).toBe('--primary: #3b82f6;');
  });

  it('should handle complex value', () => {
    expect(generateCssVariable('font-stack', '"Helvetica Neue", sans-serif')).toBe(
      '--font-stack: "Helvetica Neue", sans-serif;'
    );
  });

  it('should handle numeric values as strings', () => {
    expect(generateCssVariable('spacing', '16px')).toBe('--spacing: 16px;');
  });
});

describe('generateCssVariables', () => {
  it('should generate multiple CSS variables with indentation', () => {
    const result = generateCssVariables({
      primary: '#3b82f6',
      secondary: '#10b981',
    });
    expect(result).toContain('  --primary: #3b82f6;');
    expect(result).toContain('  --secondary: #10b981;');
  });

  it('should handle a single variable', () => {
    const result = generateCssVariables({ color: 'red' });
    expect(result).toBe('  --color: red;');
  });

  it('should join variables with newlines', () => {
    const result = generateCssVariables({ a: '1', b: '2', c: '3' });
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
  });
});

// ==================== COLOR FUNCTIONS ====================

describe('generateRgba', () => {
  it('should generate rgba color', () => {
    expect(generateRgba(255, 0, 0, 1)).toBe('rgba(255, 0, 0, 1)');
  });

  it('should handle fractional alpha', () => {
    expect(generateRgba(0, 128, 255, 0.5)).toBe('rgba(0, 128, 255, 0.5)');
  });

  it('should handle zero alpha', () => {
    expect(generateRgba(0, 0, 0, 0)).toBe('rgba(0, 0, 0, 0)');
  });
});

describe('generateHsla', () => {
  it('should generate hsla color', () => {
    expect(generateHsla(0, 100, 50, 1)).toBe('hsla(0, 100%, 50%, 1)');
  });

  it('should handle fractional alpha', () => {
    expect(generateHsla(210, 50, 60, 0.75)).toBe('hsla(210, 50%, 60%, 0.75)');
  });

  it('should handle zero saturation', () => {
    expect(generateHsla(0, 0, 50, 1)).toBe('hsla(0, 0%, 50%, 1)');
  });
});

describe('hexToRgba', () => {
  it('should convert hex to rgba with default alpha', () => {
    expect(hexToRgba('#ff0000')).toBe('rgba(255, 0, 0, 1)');
  });

  it('should convert hex to rgba with custom alpha', () => {
    expect(hexToRgba('#00ff00', 0.5)).toBe('rgba(0, 255, 0, 0.5)');
  });

  it('should handle hex without hash', () => {
    expect(hexToRgba('0000ff', 0.8)).toBe('rgba(0, 0, 255, 0.8)');
  });

  it('should convert black', () => {
    expect(hexToRgba('#000000')).toBe('rgba(0, 0, 0, 1)');
  });

  it('should convert white', () => {
    expect(hexToRgba('#ffffff')).toBe('rgba(255, 255, 255, 1)');
  });

  it('should handle alpha of 0', () => {
    expect(hexToRgba('#abcdef', 0)).toBe('rgba(171, 205, 239, 0)');
  });
});

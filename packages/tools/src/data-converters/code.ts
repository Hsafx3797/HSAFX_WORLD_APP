/**
 * Code Transformation Utilities
 */

/**
 * Convert TypeScript to JavaScript (basic transpilation)
 */
export function typeScriptToJavaScript(ts: string): string {
  let js = ts;
  
  // Remove type annotations from variables
  js = js.replace(/:\s*(string|number|boolean|any|unknown|void|never|object)\s*(?=[=;,)\]])/g, '');
  
  // Remove type annotations from function parameters
  js = js.replace(/(\w+)\s*:\s*[A-Za-z<>\[\]|&\s,{}]+(?=[,)])/g, '$1');
  
  // Remove return type annotations
  js = js.replace(/\)\s*:\s*[A-Za-z<>\[\]|&\s,{}]+\s*(?={)/g, ') ');
  
  // Remove interface declarations
  js = js.replace(/interface\s+\w+\s*\{[^}]*\}\n?/g, '');
  
  // Remove type declarations
  js = js.replace(/type\s+\w+\s*=\s*[^;]+;\n?/g, '');
  
  // Remove generic type parameters from function calls
  js = js.replace(/<[A-Za-z<>\[\]|&\s,]+>\(/g, '(');
  
  // Remove 'as Type' casts
  js = js.replace(/\s+as\s+[A-Za-z<>\[\]|&\s,{}]+(?=[;,)\]])/g, '');
  
  // Remove 'readonly' modifier
  js = js.replace(/readonly\s+/g, '');
  
  // Remove 'private', 'public', 'protected' modifiers in class properties
  js = js.replace(/(private|public|protected)\s+/g, '');
  
  // Remove ! non-null assertion
  js = js.replace(/(\w)!(?=\.|\[|\))/g, '$1');
  
  // Clean up multiple blank lines
  js = js.replace(/\n{3,}/g, '\n\n');
  
  return js.trim();
}

/**
 * Convert SCSS to CSS (basic features only)
 */
export function scssToCss(scss: string): string {
  let css = scss;
  
  // Store and replace variables
  const variables: Record<string, string> = {};
  const varMatches = css.matchAll(/\$([a-zA-Z_-]+)\s*:\s*([^;]+);/g);
  for (const match of varMatches) {
    variables[match[1]!] = match[2]!.trim();
  }
  
  // Remove variable declarations
  css = css.replace(/\$[a-zA-Z_-]+\s*:\s*[^;]+;\n?/g, '');
  
  // Replace variable usages
  for (const [name, value] of Object.entries(variables)) {
    css = css.replace(new RegExp(`\\$${name}\\b`, 'g'), value);
  }
  
  // Flatten nested selectors (simplified - handles one level)
  css = flattenNestedCss(css);
  
  // Remove SCSS comments that aren't CSS compatible
  css = css.replace(/\/\/[^\n]*/g, '');
  
  // Remove @import (should be handled by build tools)
  css = css.replace(/@import\s+['"][^'"]+['"];\n?/g, '');
  
  // Remove @use and @forward
  css = css.replace(/@(?:use|forward)\s+['"][^'"]+['"][^;]*;\n?/g, '');
  
  // Clean up
  css = css.replace(/\n{3,}/g, '\n\n').trim();
  
  return css;
}

function flattenNestedCss(scss: string): string {
  const result: string[] = [];
  const lines = scss.split('\n');
  const selectorStack: string[] = [];
  let currentProperties: string[] = [];
  let braceDepth = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Count braces
    const openBraces = (trimmed.match(/{/g) || []).length;
    const closeBraces = (trimmed.match(/}/g) || []).length;
    
    if (trimmed.endsWith('{') && !trimmed.startsWith('@')) {
      // New selector
      if (currentProperties.length > 0 && selectorStack.length > 0) {
        result.push(`${selectorStack.join(' ')} {\n${currentProperties.join('\n')}\n}`);
        currentProperties = [];
      }
      
      const selector = trimmed.slice(0, -1).trim();
      
      // Handle & parent reference
      if (selector.startsWith('&')) {
        const parentSelector = selectorStack[selectorStack.length - 1] || '';
        const newSelector = selector.replace(/^&/, parentSelector);
        selectorStack.push(newSelector);
      } else {
        selectorStack.push(selector);
      }
      
      braceDepth += openBraces;
    } else if (trimmed === '}') {
      braceDepth -= closeBraces;
      
      if (currentProperties.length > 0 && selectorStack.length > 0) {
        result.push(`${selectorStack.join(' ')} {\n${currentProperties.join('\n')}\n}`);
        currentProperties = [];
      }
      
      selectorStack.pop();
    } else if (trimmed.includes(':') && !trimmed.startsWith('@') && !trimmed.startsWith('//')) {
      // Property
      currentProperties.push(`  ${trimmed}`);
    } else if (trimmed.startsWith('@media') || trimmed.startsWith('@keyframes')) {
      result.push(trimmed);
    }
  }
  
  return result.join('\n\n');
}

/**
 * Minify CSS
 */
export function minifyCss(css: string): string {
  let minified = css;
  
  // Remove comments
  minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove newlines and extra spaces
  minified = minified.replace(/\s+/g, ' ');
  
  // Remove spaces around braces, colons, semicolons
  minified = minified.replace(/\s*{\s*/g, '{');
  minified = minified.replace(/\s*}\s*/g, '}');
  minified = minified.replace(/\s*:\s*/g, ':');
  minified = minified.replace(/\s*;\s*/g, ';');
  minified = minified.replace(/\s*,\s*/g, ',');
  
  // Remove last semicolon before closing brace
  minified = minified.replace(/;}/g, '}');
  
  return minified.trim();
}

/**
 * Beautify/format CSS
 */
export function beautifyCss(css: string): string {
  // First minify to normalize
  let formatted = minifyCss(css);
  
  // Add newlines after opening braces
  formatted = formatted.replace(/{/g, ' {\n  ');
  
  // Add newlines before closing braces
  formatted = formatted.replace(/}/g, '\n}\n');
  
  // Add newlines after semicolons (inside blocks)
  formatted = formatted.replace(/;(?!})/g, ';\n  ');
  
  // Clean up
  formatted = formatted.replace(/\n\s*\n/g, '\n');
  formatted = formatted.replace(/{\s+}/g, '{}');
  
  return formatted.trim();
}

/**
 * Convert ES6 modules to CommonJS
 */
export function es6ToCommonJs(code: string): string {
  let result = code;
  
  // Convert default exports
  result = result.replace(/export\s+default\s+/g, 'module.exports = ');
  
  // Convert named exports at declaration
  result = result.replace(/export\s+(const|let|var|function|class)\s+(\w+)/g, '$1 $2');
  
  // Track exports to add at end
  const namedExports: string[] = [];
  const exportMatches = code.matchAll(/export\s+(?:const|let|var|function|class)\s+(\w+)/g);
  for (const match of exportMatches) {
    namedExports.push(match[1]!);
  }
  
  // Convert import statements
  // import { x, y } from 'module'
  result = result.replace(
    /import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]/g,
    (_, imports, module) => {
      const names = imports.split(',').map((n: string) => n.trim());
      return `const { ${names.join(', ')} } = require('${module}')`;
    }
  );
  
  // import x from 'module'
  result = result.replace(
    /import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g,
    `const $1 = require('$2')`
  );
  
  // import * as x from 'module'
  result = result.replace(
    /import\s*\*\s*as\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g,
    `const $1 = require('$2')`
  );
  
  // Add exports object for named exports
  if (namedExports.length > 0) {
    result += `\n\nmodule.exports = { ${namedExports.join(', ')} };`;
  }
  
  return result;
}

/**
 * Convert CommonJS to ES6 modules
 */
export function commonJsToEs6(code: string): string {
  let result = code;
  
  // Convert require to import
  result = result.replace(
    /const\s*{\s*([^}]+)\s*}\s*=\s*require\(['"]([^'"]+)['"]\)/g,
    `import { $1 } from '$2'`
  );
  
  result = result.replace(
    /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g,
    `import $1 from '$2'`
  );
  
  // Convert module.exports
  result = result.replace(/module\.exports\s*=\s*{([^}]+)}/g, (_, exports) => {
    const names = exports.split(',').map((n: string) => n.trim().split(':')[0]!.trim());
    return `export { ${names.join(', ')} }`;
  });
  
  result = result.replace(/module\.exports\s*=\s*(\w+)/g, 'export default $1');
  
  // Convert exports.x = 
  result = result.replace(/exports\.(\w+)\s*=/g, 'export const $1 =');
  
  return result;
}

/**
 * Convert arrow functions to regular functions
 */
export function arrowToFunction(code: string): string {
  // Handle arrow functions with block body: (args) => { ... }
  let result = code.replace(
    /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*{/g,
    'function $1($2) {'
  );
  
  // Handle arrow functions with expression body: (args) => expr
  result = result.replace(
    /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*([^{;]+);/g,
    'function $1($2) { return $3; }'
  );
  
  // Handle single param arrow functions: x => expr
  result = result.replace(
    /const\s+(\w+)\s*=\s*(\w+)\s*=>\s*([^{;]+);/g,
    'function $1($2) { return $3; }'
  );
  
  return result;
}

/**
 * Add 'use strict' to JavaScript code
 */
export function addUseStrict(code: string): string {
  if (code.trim().startsWith("'use strict'") || code.trim().startsWith('"use strict"')) {
    return code;
  }
  return `'use strict';\n\n${code}`;
}

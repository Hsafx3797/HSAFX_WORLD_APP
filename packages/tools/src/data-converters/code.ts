/**
 * Code Transformation Utilities
 */

/**
 * Convert TypeScript to JavaScript (basic transpilation).
 * Handles: type annotations, interfaces, enums, type aliases, generics,
 * access modifiers, readonly, abstract, declare, implements, satisfies.
 */
export function typeScriptToJavaScript(ts: string): string {
  let js = ts;

  // Phase 1: Remove TS-only declaration blocks (brace-counted for multi-line)
  js = removeTsDeclarationBlocks(js);

  // Remove type alias declarations
  js = js.replace(/type\s+\w+(?:\s*<[^>]*>)?\s*=\s*[^;]+;\n?/g, '');

  // Remove 'declare' lines without braces
  js = js.replace(/^[ \t]*declare\s+(?:const|let|var|function)\b[^;]*;\s*\n?/gm, '');

  // Phase 2: Remove inline type annotations

  // Variable type annotations: const x: string = 5
  js = js.replace(/:\s*(string|number|boolean|bigint|symbol|any|unknown|void|never|object)\s*(?=[=;,)\]])/g, '');

  // Function parameter types: (param: Type, param2: Type)
  js = js.replace(/(\w+)\s*:\s*[A-Za-z<>\[\]|&\s{}]+(?=[,)])/g, '$1');

  // Return type annotations: ): Type {
  js = js.replace(/\)\s*:\s*[A-Za-z<>\[\]|&\s,{}]+\s*(?={)/g, ') ');

  // Generic type parameters from function calls
  js = js.replace(/<[A-Za-z<>\[\]|&\s,]+>\(/g, '(');

  // 'as Type' casts (including 'as const')
  js = js.replace(/\s+as\s+[A-Za-z<>\[\]|&\s,{}]+(?=[;,)\]])/g, '');

  // 'satisfies Type'
  js = js.replace(/\s+satisfies\s+[A-Za-z_$][\w$<>\[\]|&\s,{}]*(?=[;,)\]\n])/g, '');

  // Phase 3: Remove TS keywords
  js = js.replace(/\breadonly\s+/g, '');
  js = js.replace(/\b(private|public|protected)\s+/g, '');
  js = js.replace(/\babstract\s+/g, '');
  js = js.replace(/\boverride\s+/g, '');

  // 'implements ...' from class declarations
  js = js.replace(/\s+implements\s+[\w$<>,.\s]+(?=\s*\{)/g, '');

  // Non-null assertion
  js = js.replace(/(\w)!(?=\.|\[|\))/g, '$1');

  // Clean up multiple blank lines
  js = js.replace(/\n{3,}/g, '\n\n');

  return js.trim();
}

/**
 * Remove interface, enum, namespace, and module blocks using brace counting.
 * Handles multi-line and nested braces correctly.
 */
function removeTsDeclarationBlocks(code: string): string {
  const blockPattern = /^[ \t]*(?:export\s+)?(?:declare\s+)?(?:abstract\s+)?(?:interface|(?:const\s+)?enum|namespace|module)\s+/m;

  let result = code;
  let match;
  while ((match = blockPattern.exec(result)) !== null) {
    const start = match.index;
    const braceIdx = result.indexOf('{', start);
    if (braceIdx === -1) break;
    if (braceIdx - start > 200) break; // safety: brace too far from keyword

    let depth = 1;
    let pos = braceIdx + 1;
    while (pos < result.length && depth > 0) {
      if (result[pos] === '{') depth++;
      else if (result[pos] === '}') depth--;
      pos++;
    }

    // Skip trailing newline
    if (pos < result.length && result[pos] === '\n') pos++;

    result = result.slice(0, start) + result.slice(pos);
  }

  return result;
}

/**
 * Convert SCSS to CSS (basic features).
 * Handles: variables, nesting (multi-level), & parent refs, interpolation,
 * simple @mixin/@include, @extend removal, SCSS comments, @import/@use/@forward.
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

  // Replace interpolation #{$var} with variable values
  for (const [name, value] of Object.entries(variables)) {
    css = css.replace(new RegExp(`#\\{\\$${name}\\}`, 'g'), value);
  }
  // Also replace any remaining #{$var} that weren't in our map (leave as-is without #{})
  css = css.replace(/#\{\$([a-zA-Z_-]+)\}/g, '$1');

  // Collect simple @mixin blocks (no parameters)
  const mixins: Record<string, string> = {};
  const mixinRe = /@mixin\s+([\w-]+)\s*\{/g;
  let mm;
  while ((mm = mixinRe.exec(css)) !== null) {
    const mixinStart = mm.index;
    const braceStart = css.indexOf('{', mixinStart + mm[0].length - 1);
    let depth = 1, p = braceStart + 1;
    while (p < css.length && depth > 0) {
      if (css[p] === '{') depth++;
      else if (css[p] === '}') depth--;
      p++;
    }
    const body = css.slice(braceStart + 1, p - 1).trim();
    mixins[mm[1]!] = body;
  }

  // Remove @mixin declarations
  const mixinBlockRe = /@mixin\s+[\w-]+\s*\{/;
  let mr;
  while ((mr = mixinBlockRe.exec(css)) !== null) {
    const s = mr.index;
    const b = css.indexOf('{', s);
    let depth = 1, p = b + 1;
    while (p < css.length && depth > 0) {
      if (css[p] === '{') depth++;
      else if (css[p] === '}') depth--;
      p++;
    }
    if (p < css.length && css[p] === '\n') p++;
    css = css.slice(0, s) + css.slice(p);
  }

  // Replace @include with mixin content
  for (const [name, content] of Object.entries(mixins)) {
    css = css.replace(new RegExp(`@include\\s+${name}\\s*;`, 'g'), content);
  }

  // Remove @extend lines (cannot be flattened without full stylesheet context)
  css = css.replace(/@extend\s+[^;]+;\s*\n?/g, '');

  // Flatten nested selectors (multi-level with proper & handling)
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
  // resolvedStack: the fully resolved selector at each nesting level
  const resolvedStack: string[] = [];
  let currentProperties: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.endsWith('{') && !trimmed.startsWith('@')) {
      // Emit any pending properties before entering a deeper nesting level
      if (currentProperties.length > 0 && resolvedStack.length > 0) {
        result.push(`${resolvedStack[resolvedStack.length - 1]} {\n${currentProperties.join('\n')}\n}`);
        currentProperties = [];
      }

      const selector = trimmed.slice(0, -1).trim();
      const parent = resolvedStack.length > 0 ? resolvedStack[resolvedStack.length - 1]! : '';

      if (selector.includes('&')) {
        // Replace all & references with the parent selector
        resolvedStack.push(selector.replace(/&/g, parent));
      } else if (parent) {
        resolvedStack.push(`${parent} ${selector}`);
      } else {
        resolvedStack.push(selector);
      }
    } else if (trimmed === '}') {
      // Emit pending properties for the current selector, then pop
      if (currentProperties.length > 0 && resolvedStack.length > 0) {
        result.push(`${resolvedStack[resolvedStack.length - 1]} {\n${currentProperties.join('\n')}\n}`);
        currentProperties = [];
      }
      resolvedStack.pop();
    } else if (trimmed.includes(':') && !trimmed.startsWith('@') && !trimmed.startsWith('//')) {
      // CSS property
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

// ============================================================
// Formatting & CSS utilities (moved from compat.ts)
// ============================================================

/**
 * Format SQL (basic)
 */
export function formatSql(sql: string): string {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 
                    'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
                    'INNER JOIN', 'OUTER JOIN', 'ON', 'INSERT INTO', 'VALUES',
                    'UPDATE', 'SET', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
  
  let result = sql;
  for (const keyword of keywords) {
    result = result.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), `\n${keyword}`);
  }
  return result.trim().replace(/\n+/g, '\n');
}

/**
 * Format GraphQL (basic)
 */
export function formatGraphql(graphql: string): string {
  let result = graphql;
  result = result.replace(/\{/g, ' {\n  ');
  result = result.replace(/\}/g, '\n}');
  result = result.replace(/,\s*/g, '\n  ');
  return result.replace(/\n+/g, '\n').trim();
}

/**
 * Format Markdown (basic normalization)
 */
export function formatMarkdown(markdown: string): string {
  let result = markdown;
  // Normalize headers
  result = result.replace(/^(#{1,6})\s*/gm, '$1 ');
  // Normalize lists
  result = result.replace(/^\s*[-*+]\s+/gm, '- ');
  // Normalize blank lines
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}

/**
 * Format HTML (basic indentation)
 */
export function formatHtml(html: string, indentSize = 2): string {
  let result = html;
  const indent = ' '.repeat(indentSize);
  let level = 0;
  
  result = result.replace(/>\s*</g, '>\n<');
  
  const lines = result.split('\n');
  const formatted = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.match(/^<\/\w/)) level--;
    const indented = indent.repeat(Math.max(0, level)) + trimmed;
    if (trimmed.match(/^<\w[^>]*[^\/]>$/) && !trimmed.match(/^<(br|hr|img|input|meta|link)/i)) {
      level++;
    }
    return indented;
  });
  
  return formatted.join('\n');
}

/**
 * Convert Markdown to HTML (basic)
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Code blocks
  html = html.replace(/```(\w*)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  
  return html;
}

/**
 * LESS to CSS (basic)
 */
export function lessToCss(less: string): string {
  let css = less;
  // Remove LESS variables
  css = css.replace(/@(\w+):\s*([^;]+);/g, '');
  // Replace variable usage
  css = css.replace(/@(\w+)/g, 'var(--$1)');
  return css;
}

/**
 * Stylus to CSS (basic)
 */
export function stylusToCss(stylus: string): string {
  let css = stylus;
  // Add braces and semicolons
  css = css.replace(/^(\s*)(\S.*)$/gm, (_, indent, content) => {
    if (content.includes(':') && !content.includes('{')) {
      return `${indent}${content};`;
    }
    return `${indent}${content}`;
  });
  return css;
}

/**
 * PostCSS to CSS (passthrough - PostCSS is already CSS)
 */
export function postcssToCss(postcss: string): string {
  return postcss;
}

/**
 * CSS to JS objects
 */
export function cssToJsObjects(css: string): string {
  const rules: Record<string, Record<string, string>> = {};
  const ruleMatches = css.matchAll(/([^{]+)\{([^}]+)\}/g);
  
  for (const match of ruleMatches) {
    const selector = match[1]!.trim();
    const properties = match[2]!.trim();
    
    const props: Record<string, string> = {};
    const propMatches = properties.matchAll(/([^:]+):\s*([^;]+);?/g);
    for (const propMatch of propMatches) {
      const propName = propMatch[1]!.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      props[propName] = propMatch[2]!.trim();
    }
    
    rules[selector] = props;
  }
  
  return JSON.stringify(rules, null, 2);
}

/**
 * CSS variables to JSON
 */
export function cssVariablesToJson(css: string): string {
  const variables: Record<string, string> = {};
  const matches = css.matchAll(/--([^:]+):\s*([^;]+);/g);
  
  for (const match of matches) {
    variables[match[1]!.trim()] = match[2]!.trim();
  }
  
  return JSON.stringify(variables, null, 2);
}

/**
 * Tailwind to CSS tokens
 */
export function tailwindToCssTokens(config: string): string {
  try {
    const colorMatch = config.match(/colors:\s*\{([^}]+)\}/);
    const spacingMatch = config.match(/spacing:\s*\{([^}]+)\}/);
    
    return JSON.stringify({
      colors: colorMatch ? 'extracted' : 'not found',
      spacing: spacingMatch ? 'extracted' : 'not found',
      note: 'Full Tailwind config parsing requires the tailwindcss package'
    }, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

/**
 * View AST (basic)
 */
export function viewAst(code: string, language = 'javascript'): string {
  const tokens: { type: string; value: string }[] = [];
  
  const patterns = [
    { type: 'keyword', pattern: /\b(const|let|var|function|class|if|else|for|while|return|import|export)\b/g },
    { type: 'string', pattern: /'[^']*'|"[^"]*"|`[^`]*`/g },
    { type: 'number', pattern: /\b\d+\.?\d*\b/g },
    { type: 'identifier', pattern: /\b[a-zA-Z_]\w*\b/g },
    { type: 'operator', pattern: /[+\-*/%=<>!&|^~?:]+/g },
    { type: 'punctuation', pattern: /[(){}[\];,]/g },
  ];
  
  for (const { type, pattern } of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      tokens.push({ type, value: match[0] });
    }
  }
  
  return JSON.stringify({
    language,
    tokenCount: tokens.length,
    tokens: tokens.slice(0, 50)
  }, null, 2);
}

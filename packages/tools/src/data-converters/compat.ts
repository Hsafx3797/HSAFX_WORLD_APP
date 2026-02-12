/**
 * Web Compatibility Layer
 * Re-exports data converter functions with aliases matching web app's expected API
 * This allows apps/web to import from @hsafx/tool-execution instead of local converters
 */

// JSON operations
export {
  formatJson,
  minifyJson,
  sortJsonKeys,
  jsonToNdjson,
  ndjsonToJson,
  jsonToUrlParams,
  urlParamsToJson,
  jsonToFormData,
  queryStringToJson,
  jsonToQueryString,
  base64ToJson,
  jsonToBase64,
  jsonDiff,
} from './json';

// YAML operations
export {
  jsonToYaml,
  yamlToJson,
  formatYaml,
  envToYaml,
} from './yaml';

// XML operations
export {
  escapeXml,
  jsonToXml,
  xmlToJson,
  formatXml,
  validateXml,
  testXPath,
} from './xml';

// CSV/TSV operations
export {
  jsonToCsv,
  csvToJson,
  jsonToTsv,
  tsvToJson,
  tsvToCsv,
  csvToTsv,
  validateCsv,
  markdownTableToJson,
  jsonToMarkdownTable,
} from './csv';

// Format converters (TOML, INI, Properties, ENV, etc.)
export {
  jsonToToml,
  iniToJson,
  jsonToIni,
  jsonToProperties,
  propertiesToJson,
  envToJson,
  jsonToEnv,
  envToDockerCompose,
  normalizeLineEndings,
  convertIndentation,
  sortKeys,
} from './format';

// Validation utilities
export {
  validateJson,
  validateYaml,
  testRegex,
  testJsonPath,
  parseSemver,
  parseCronExpression,
  lineDiff,
} from './validate';

// DevOps tools
export {
  lintDockerfile,
  dockerComposeV2ToV3,
  dockerComposeToKubernetes,
  kubernetesToDockerCompose,
  lintKubernetesYaml,
} from './devops';

// API/HTTP tools
export {
  decodeJwt,
  curlToFetch,
  curlToAxios,
  fetchToCurl,
  parseHttpHeaders,
  jsonToHttpHeaders,
  urlToOpenApiPath,
  parseUrl,
  buildUrl,
} from './api';

// Schema converters
export {
  jsonSchemaToTypeScript,
  jsonSchemaToZod,
  jsonSchemaToJoi,
  typeScriptToJsonSchema,
  inferJsonSchema,
} from './schema';

// Alias for web compatibility (web uses lowercase 'typescript')
export { jsonSchemaToTypeScript as jsonSchemaToTypescript } from './schema';

// Code transforms
export {
  typeScriptToJavaScript,
  scssToCss,
  minifyCss,
  beautifyCss,
  es6ToCommonJs,
  commonJsToEs6,
  arrowToFunction,
  addUseStrict,
} from './code';

// Alias for web compatibility (web uses lowercase 'javascript')
export { typeScriptToJavaScript as typescriptToJavascript } from './code';

// Specialized converters
export {
  avroToJsonSchema,
  openapi2ToOpenapi3,
  openapiToTypescript,
  openapiToGraphql,
  graphqlToOpenapi,
  graphqlToTypescript,
  helmToKubernetes,
  terraformToCloudformation,
  terraformToPulumi,
  dartToJavascript,
  reasonmlToJavascript,
} from './specialized';

// ============================================================
// Functions that need to be added or are in other modules
// These stubs maintain API compatibility
// ============================================================

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Unescape HTML entities
 */
export function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * URL encode
 */
export function escapeUrl(text: string): string {
  return encodeURIComponent(text);
}

/**
 * URL decode
 */
export function unescapeUrl(text: string): string {
  return decodeURIComponent(text);
}

/**
 * Escape SQL special characters
 */
export function escapeSql(text: string): string {
  return text.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

/**
 * Convert text to HTML list
 */
export function textToHtmlList(text: string, ordered = false): string {
  const lines = text.split('\n').filter(Boolean);
  const tag = ordered ? 'ol' : 'ul';
  const items = lines.map(line => `  <li>${escapeHtml(line.trim())}</li>`).join('\n');
  return `<${tag}>\n${items}\n</${tag}>`;
}

/**
 * Timestamp to date string
 */
export function timestampToDate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Date string to timestamp
 */
export function dateToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime();
}

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
 * HTTP headers to JSON (alias)
 */
export { parseHttpHeaders as httpHeadersToJson } from './api';

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
  // PostCSS is mostly CSS with some extensions
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
 * API response to mock data
 */
export function apiResponseToMock(json: string): string {
  try {
    const data = JSON.parse(json);
    return JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      meta: {
        mockGenerated: true,
        originalType: Array.isArray(data) ? 'array' : typeof data
      }
    }, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

/**
 * Image data URL to base64
 */
export function imageToBase64FromDataUrl(dataUrl: string): { base64: string; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { base64: '', mimeType: '' };
  }
  return { base64: match[2]!, mimeType: match[1]! };
}

/**
 * Base64 to data URL
 */
export function base64ToDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * JSON Schema to OpenAPI
 */
export function jsonSchemaToOpenapi(schema: string): string {
  try {
    const parsed = JSON.parse(schema);
    const openapi = {
      openapi: '3.0.0',
      info: {
        title: parsed.title || 'API',
        version: '1.0.0'
      },
      paths: {},
      components: {
        schemas: {
          [parsed.title || 'Schema']: parsed
        }
      }
    };
    return JSON.stringify(openapi, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

/**
 * SQL to NoSQL (basic query conversion)
 */
export function sqlToNoSql(sql: string): string {
  const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
  if (!selectMatch) {
    return JSON.stringify({ error: 'Only SELECT queries supported' });
  }
  
  const fields = selectMatch[1]!.split(',').map(f => f.trim());
  const collection = selectMatch[2];
  const where = selectMatch[3];
  
  const query: Record<string, unknown> = {};
  if (where) {
    const conditions = where.split(/\s+AND\s+/i);
    for (const cond of conditions) {
      const match = cond.match(/(\w+)\s*=\s*'?([^']+)'?/);
      if (match) {
        query[match[1]!] = match[2];
      }
    }
  }
  
  const projection = fields[0] === '*' ? {} : Object.fromEntries(fields.map(f => [f, 1]));
  
  return JSON.stringify({
    collection,
    query,
    projection
  }, null, 2);
}

/**
 * Kubernetes to Kustomize
 */
export function kubernetesToKustomize(k8sYaml: string): string {
  // Extract resource name from YAML
  const nameMatch = k8sYaml.match(/name:\s*(\S+)/);
  const kindMatch = k8sYaml.match(/kind:\s*(\S+)/);
  
  const name = nameMatch ? nameMatch[1] : 'resource';
  const kind = kindMatch ? kindMatch[1]!.toLowerCase() : 'deployment';
  
  const kustomization = `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ${kind}.yaml

namePrefix: dev-

commonLabels:
  app: ${name}
  environment: development
`;
  
  return kustomization;
}

/**
 * View AST (basic)
 */
export function viewAst(code: string, language = 'javascript'): string {
  // Basic AST-like representation
  const tokens: { type: string; value: string }[] = [];
  
  // Tokenize basic patterns
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
    tokens: tokens.slice(0, 50) // Limit output
  }, null, 2);
}

/**
 * Schema diff
 */
export function schemaDiff(schema1: string, schema2: string): string {
  try {
    const s1 = JSON.parse(schema1);
    const s2 = JSON.parse(schema2);
    
    const added: string[] = [];
    const removed: string[] = [];
    const changed: string[] = [];
    
    const props1 = s1.properties || {};
    const props2 = s2.properties || {};
    
    for (const key of Object.keys(props2)) {
      if (!(key in props1)) added.push(key);
    }
    
    for (const key of Object.keys(props1)) {
      if (!(key in props2)) removed.push(key);
      else if (JSON.stringify(props1[key]) !== JSON.stringify(props2[key])) {
        changed.push(key);
      }
    }
    
    return JSON.stringify({ added, removed, changed }, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

/**
 * Config diff
 */
export function configDiff(config1: string, config2: string): string {
  return schemaDiff(config1, config2);
}

/**
 * OpenAPI diff
 */
export function openapiDiff(spec1: string, spec2: string): string {
  try {
    const s1 = JSON.parse(spec1);
    const s2 = JSON.parse(spec2);
    
    const paths1 = Object.keys(s1.paths || {});
    const paths2 = Object.keys(s2.paths || {});
    
    const added = paths2.filter(p => !paths1.includes(p));
    const removed = paths1.filter(p => !paths2.includes(p));
    
    return JSON.stringify({
      versionChange: { from: s1.info?.version, to: s2.info?.version },
      paths: { added, removed }
    }, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

/**
 * GraphQL schema diff
 */
export function graphqlSchemaDiff(schema1: string, schema2: string): string {
  const typeRegex = /type\s+(\w+)/g;
  
  const types1: string[] = [];
  const types2: string[] = [];
  
  let match;
  while ((match = typeRegex.exec(schema1)) !== null) {
    types1.push(match[1]!);
  }
  
  typeRegex.lastIndex = 0;
  while ((match = typeRegex.exec(schema2)) !== null) {
    types2.push(match[1]!);
  }
  
  const added = types2.filter(t => !types1.includes(t));
  const removed = types1.filter(t => !types2.includes(t));
  
  return JSON.stringify({ types: { added, removed } }, null, 2);
}

/**
 * cURL to HTTPie
 */
export function curlToHttpie(curl: string): string {
  let httpie = 'http';
  
  // Extract method
  const methodMatch = curl.match(/-X\s+(\w+)/);
  if (methodMatch) {
    httpie = `http ${methodMatch[1]}`;
  }
  
  // Extract URL
  const urlMatch = curl.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/);
  if (urlMatch) {
    httpie += ` ${urlMatch[1]}`;
  }
  
  // Extract headers
  const headerMatches = curl.matchAll(/-H\s+['"]([^'"]+)['"]/g);
  for (const match of headerMatches) {
    const header = match[1]!;
    const [key, value] = header.split(':').map(s => s.trim());
    httpie += ` '${key}:${value}'`;
  }
  
  return httpie;
}

/**
 * URL to cURL
 */
export function urlToCurl(url: string, method = 'GET'): string {
  return `curl -X ${method} '${url}'`;
}

/**
 * Punycode encode (basic)
 */
export function punycodeEncode(text: string): string {
  try {
    // Use built-in URL API for IDN encoding
    const url = new URL(`http://${text}`);
    return url.hostname;
  } catch {
    return text;
  }
}

/**
 * Punycode decode (basic)
 */
export function punycodeDecode(text: string): string {
  // Basic punycode decoding
  if (!text.startsWith('xn--')) return text;
  return text; // Would need full punycode library for proper decode
}

/**
 * UTF-8 to UTF-16
 */
export function utf8ToUtf16(text: string, endianness: 'le' | 'be' = 'le'): string {
  const codeUnits: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (endianness === 'le') {
      codeUnits.push((code & 0xFF).toString(16).padStart(2, '0'));
      codeUnits.push((code >> 8).toString(16).padStart(2, '0'));
    } else {
      codeUnits.push((code >> 8).toString(16).padStart(2, '0'));
      codeUnits.push((code & 0xFF).toString(16).padStart(2, '0'));
    }
  }
  return codeUnits.join('');
}

/**
 * UTF-16 to UTF-8
 */
export function utf16ToUtf8(hexString: string, _endianness: 'le' | 'be' = 'le'): string {
  const bytes = hexString.match(/.{1,4}/g) || [];
  return bytes.map(b => String.fromCharCode(parseInt(b, 16))).join('');
}

/**
 * Unicode normalize
 */
export function unicodeNormalize(text: string, form: 'NFC' | 'NFD' | 'NFKC' | 'NFKD' = 'NFC'): string {
  return text.normalize(form);
}

/**
 * Unicode code points
 */
export function unicodeCodePoints(text: string): string {
  const codePoints = [...text].map(char => {
    const cp = char.codePointAt(0);
    return {
      char,
      codePoint: cp,
      hex: `U+${cp?.toString(16).toUpperCase().padStart(4, '0')}`
    };
  });
  return JSON.stringify(codePoints, null, 2);
}

/**
 * Convert number base
 */
export function convertBase(value: string, fromBase: number, toBase: number): string {
  const decimal = parseInt(value, fromBase);
  return decimal.toString(toBase);
}

/**
 * Tailwind to CSS tokens
 */
export function tailwindToCssTokens(config: string): string {
  try {
    // Basic extraction of theme values from Tailwind config
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

// ============================================================
// Color Converters
// ============================================================

/**
 * Hex to RGB
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return JSON.stringify({ error: 'Invalid hex color' });
  }
  return JSON.stringify({
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16)
  });
}

/**
 * RGB to Hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Hex to HSL
 */
export function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return JSON.stringify({ error: 'Invalid hex color' });
  }
  
  let r = parseInt(result[1]!, 16) / 255;
  let g = parseInt(result[2]!, 16) / 255;
  let b = parseInt(result[3]!, 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
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
  
  return JSON.stringify({
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  });
}

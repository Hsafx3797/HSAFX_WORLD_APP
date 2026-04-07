/**
 * API Engine — API Tool Conversions
 *
 * Wraps curl→fetch, curl→axios, fetch→curl, curl→httpie,
 * JWT decode, HTTP header parsing, URL parsing, etc.
 */

import type { Engine, ApiEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
import {
  curlToFetch,
  curlToAxios,
  fetchToCurl,
  parseHttpHeaders,
  jsonToHttpHeaders,
  parseUrl,
  decodeJwt,
  curlToHttpie,
  apiResponseToMock,
} from '../data-converters/api';

// ---------------------------------------------------------------------------
// Beautify helper — auto-detect JSON/XML and pretty-print
// ---------------------------------------------------------------------------

function beautifyApiResponse(input: string): string {
  const trimmed = input.trim();

  // Try JSON first
  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // not JSON
  }

  // Try XML/HTML — simple indent-based beautifier
  if (trimmed.startsWith('<')) {
    return beautifyXml(trimmed);
  }

  // Fallback: return as-is
  return input;
}

function beautifyXml(xml: string): string {
  // Remove existing whitespace between tags
  let result = xml.replace(/>\s+</g, '><');
  const lines: string[] = [];
  let indent = 0;

  // Split on tag boundaries
  const tokens = result.match(/<[^>]+>|[^<]+/g) || [];
  for (const token of tokens) {
    const trimmedToken = token.trim();
    if (!trimmedToken) continue;

    if (trimmedToken.startsWith('</')) {
      // Closing tag
      indent = Math.max(0, indent - 1);
      lines.push('  '.repeat(indent) + trimmedToken);
    } else if (trimmedToken.startsWith('<') && trimmedToken.endsWith('/>')) {
      // Self-closing tag
      lines.push('  '.repeat(indent) + trimmedToken);
    } else if (trimmedToken.startsWith('<?') || trimmedToken.startsWith('<!')) {
      // Declaration / comment
      lines.push('  '.repeat(indent) + trimmedToken);
    } else if (trimmedToken.startsWith('<')) {
      // Opening tag
      lines.push('  '.repeat(indent) + trimmedToken);
      indent++;
    } else {
      // Text content
      lines.push('  '.repeat(indent) + trimmedToken);
    }
  }
  return lines.join('\n');
}

function decodeBase64Json(input: string): string {
  try {
    const decoded = atob(input.trim());
    const parsed = JSON.parse(decoded);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return JSON.stringify({ error: 'Invalid base64-encoded JSON' });
  }
}

// ---------------------------------------------------------------------------
// Operation registry
// ---------------------------------------------------------------------------

type ApiFn = (input: string) => string;

const CONVERT_ROUTES: Record<string, ApiFn> = {
  'curl:fetch':     curlToFetch,
  'curl:axios':     curlToAxios,
  'fetch:curl':     fetchToCurl,
  'curl:httpie':    curlToHttpie,
  'headers:json':   parseHttpHeaders,
  'json:headers':   jsonToHttpHeaders,
};

const PARSE_OPS: Record<string, ApiFn> = {
  'jwt':        decodeJwt,
  'url':        parseUrl,
  'headers':    parseHttpHeaders,
  'mock':       apiResponseToMock,
  'base64json': decodeBase64Json,
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const apiEngine: Engine<ApiEngineOptions> = {
  name: 'api',
  description: 'Convert between API formats (curl/fetch/axios/httpie) and parse JWTs, URLs, headers.',

  validate(options: ApiEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    if (options.operation === 'convert') {
      const key = `${options.from}:${options.to}`;
      if (!CONVERT_ROUTES[key]) {
        errors.push(`No conversion route "${options.from}" → "${options.to}". Available: ${Object.keys(CONVERT_ROUTES).join(', ')}`);
      }
    } else if (options.operation === 'parse') {
      if (!options.parseType || !PARSE_OPS[options.parseType]) {
        errors.push(`Unknown parse type "${options.parseType}". Available: ${Object.keys(PARSE_OPS).join(', ')}`);
      }
    } else if (options.operation === 'beautify') {
      // no extra validation needed
    } else {
      errors.push(`Invalid operation "${options.operation}". Must be "convert", "parse", or "beautify".`);
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: ApiEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : JSON.stringify(input);

    if (options.operation === 'convert') {
      const key = `${options.from}:${options.to}`;
      const fn = CONVERT_ROUTES[key];
      if (!fn) return { output: text, metadata: { error: `No route: ${key}` } };
      return { output: fn(text), metadata: { operation: 'convert', from: options.from, to: options.to } };
    }

    if (options.operation === 'beautify') {
      return { output: beautifyApiResponse(text), metadata: { operation: 'beautify' } };
    }

    // parse
    const fn = PARSE_OPS[options.parseType!];
    if (!fn) return { output: text, metadata: { error: `Unknown parse type: ${options.parseType}` } };
    return { output: fn(text), metadata: { operation: 'parse', parseType: options.parseType } };
  },
};

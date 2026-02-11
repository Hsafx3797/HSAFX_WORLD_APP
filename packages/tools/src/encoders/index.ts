/**
 * Encoders/Decoders Library
 * Encoding and decoding utilities
 */

// ==================== BASE64 ====================

export function encodeBase64(input: string): string {
  if (typeof btoa !== 'undefined') {
    // Browser
    return btoa(unescape(encodeURIComponent(input)));
  }
  // Node.js
  return Buffer.from(input, 'utf-8').toString('base64');
}

export function decodeBase64(input: string): string {
  if (typeof atob !== 'undefined') {
    // Browser
    return decodeURIComponent(escape(atob(input)));
  }
  // Node.js
  return Buffer.from(input, 'base64').toString('utf-8');
}

export function encodeBase64Url(input: string): string {
  return encodeBase64(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeBase64Url(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeBase64(base64);
}

// ==================== URL ENCODING ====================

export function encodeURL(input: string): string {
  return encodeURIComponent(input);
}

export function decodeURL(input: string): string {
  return decodeURIComponent(input);
}

export function encodeURLComponent(input: string): string {
  return encodeURIComponent(input)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

export function parseQueryString(query: string): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  
  const searchParams = new URLSearchParams(query);
  
  searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });
  
  return params;
}

export function buildQueryString(params: Record<string, string | number | boolean | string[]>): string {
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, v));
    } else {
      searchParams.append(key, String(value));
    }
  }
  
  return searchParams.toString();
}

// ==================== HTML ENTITIES ====================

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

const HTML_ENTITIES_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(HTML_ENTITIES).map(([k, v]) => [v, k])
);

// Add named entities
const NAMED_ENTITIES: Record<string, string> = {
  '&nbsp;': '\u00A0',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&euro;': '€',
  '&pound;': '£',
  '&yen;': '¥',
  '&cent;': '¢',
  '&deg;': '°',
  '&plusmn;': '±',
  '&times;': '×',
  '&divide;': '÷',
  '&frac12;': '½',
  '&frac14;': '¼',
  '&frac34;': '¾',
  '&hellip;': '…',
  '&mdash;': '—',
  '&ndash;': '–',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
  '&bull;': '•',
  '&larr;': '←',
  '&rarr;': '→',
  '&uarr;': '↑',
  '&darr;': '↓',
};

Object.assign(HTML_ENTITIES_REVERSE, 
  Object.fromEntries(Object.entries(NAMED_ENTITIES).map(([k, v]) => [k, v]))
);

export function encodeHTML(input: string): string {
  return input.replace(/[&<>"'`=\/]/g, char => HTML_ENTITIES[char] || char);
}

export function decodeHTML(input: string): string {
  // Decode named entities
  let result = input.replace(/&[a-zA-Z]+;/g, entity => 
    HTML_ENTITIES_REVERSE[entity] || NAMED_ENTITIES[entity] || entity
  );
  
  // Decode numeric entities (&#123; or &#x7B;)
  result = result.replace(/&#(\d+);/g, (_, code) => 
    String.fromCharCode(parseInt(code, 10))
  );
  
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => 
    String.fromCharCode(parseInt(code, 16))
  );
  
  return result;
}

// ==================== UNICODE ====================

export function encodeUnicode(input: string): string {
  return input.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code > 127) {
      return '\\u' + code.toString(16).padStart(4, '0');
    }
    return char;
  }).join('');
}

export function decodeUnicode(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => 
    String.fromCharCode(parseInt(code, 16))
  );
}

export function toCodePoints(input: string): number[] {
  const codePoints: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.codePointAt(i);
    if (code !== undefined) {
      codePoints.push(code);
      if (code > 0xFFFF) i++; // Skip surrogate pair
    }
  }
  return codePoints;
}

export function fromCodePoints(codePoints: number[]): string {
  return String.fromCodePoint(...codePoints);
}

// ==================== HEX ====================

export function encodeHex(input: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function decodeHex(input: string): string {
  const bytes = new Uint8Array(input.length / 2);
  for (let i = 0; i < input.length; i += 2) {
    bytes[i / 2] = parseInt(input.slice(i, i + 2), 16);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

// ==================== BINARY ====================

export function encodeBinary(input: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  return Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join(' ');
}

export function decodeBinary(input: string): string {
  const bytes = input.split(/\s+/).map(b => parseInt(b, 2));
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}

// ==================== ASCII ====================

export function encodeASCII(input: string): number[] {
  return input.split('').map(char => char.charCodeAt(0));
}

export function decodeASCII(codes: number[]): string {
  return String.fromCharCode(...codes);
}

export function toASCIITable(input: string): { char: string; dec: number; hex: string; bin: string }[] {
  return input.split('').map(char => {
    const code = char.charCodeAt(0);
    return {
      char: char === ' ' ? '(space)' : char,
      dec: code,
      hex: '0x' + code.toString(16).toUpperCase().padStart(2, '0'),
      bin: code.toString(2).padStart(8, '0'),
    };
  });
}

// ==================== ROT13 / CAESAR CIPHER ====================

export function rot13(input: string): string {
  return input.replace(/[a-zA-Z]/g, char => {
    const code = char.charCodeAt(0);
    const base = code < 91 ? 65 : 97;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

export function caesarCipher(input: string, shift: number): string {
  shift = ((shift % 26) + 26) % 26; // Normalize shift
  
  return input.replace(/[a-zA-Z]/g, char => {
    const code = char.charCodeAt(0);
    const base = code < 91 ? 65 : 97;
    return String.fromCharCode(((code - base + shift) % 26) + base);
  });
}

// ==================== MORSE CODE ====================

const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/',
};

const MORSE_CODE_REVERSE = Object.fromEntries(
  Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
);

export function encodeMorse(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .map(char => MORSE_CODE[char] || char)
    .join(' ');
}

export function decodeMorse(input: string): string {
  return input
    .split(' ')
    .map(code => MORSE_CODE_REVERSE[code] || code)
    .join('');
}

// ==================== NATO PHONETIC ALPHABET ====================

const NATO_ALPHABET: Record<string, string> = {
  'A': 'Alpha', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo',
  'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliet',
  'K': 'Kilo', 'L': 'Lima', 'M': 'Mike', 'N': 'November', 'O': 'Oscar',
  'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
  'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray', 'Y': 'Yankee',
  'Z': 'Zulu',
  '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
  '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Niner',
};

const NATO_REVERSE = Object.fromEntries(
  Object.entries(NATO_ALPHABET).map(([k, v]) => [v.toLowerCase(), k])
);

export function encodeNATO(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .map(char => NATO_ALPHABET[char] || char)
    .join(' ');
}

export function decodeNATO(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .map(word => NATO_REVERSE[word] || word)
    .join('');
}

// ==================== PUNYCODE ====================

// Simplified punycode for internationalized domain names
export function encodePunycode(input: string): string {
  try {
    // Use URL API for punycode encoding
    const url = new URL(`http://${input}`);
    return url.hostname;
  } catch {
    return input;
  }
}

export function decodePunycode(input: string): string {
  try {
    const url = new URL(`http://${input}`);
    // Browser automatically decodes punycode in href
    return new URL(url.href).hostname;
  } catch {
    return input;
  }
}

// ==================== JWT ====================

export interface JWTPayload {
  [key: string]: unknown;
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
}

export interface DecodedJWT {
  header: {
    alg: string;
    typ: string;
    [key: string]: unknown;
  };
  payload: JWTPayload;
  signature: string;
  isExpired: boolean;
}

export function decodeJWT(token: string): DecodedJWT | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    const signature = parts[2];
    
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp ? payload.exp < now : false;
    
    return { header, payload, signature, isExpired };
  } catch {
    return null;
  }
}

// Note: JWT signing requires crypto libraries and should be done server-side

// ==================== DATA URI ====================

export function encodeDataURI(content: string, mimeType: string = 'text/plain'): string {
  const base64 = encodeBase64(content);
  return `data:${mimeType};base64,${base64}`;
}

export function decodeDataURI(uri: string): { mimeType: string; content: string } | null {
  const match = uri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  
  return {
    mimeType: match[1],
    content: decodeBase64(match[2]),
  };
}

// ==================== ESCAPE/UNESCAPE ====================

export function escapeJSON(input: string): string {
  return JSON.stringify(input).slice(1, -1);
}

export function unescapeJSON(input: string): string {
  return JSON.parse(`"${input}"`);
}

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function escapeCSV(input: string): string {
  if (/[,"\n\r]/.test(input)) {
    return `"${input.replace(/"/g, '""')}"`;
  }
  return input;
}

export function escapeXML(input: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };
  
  return input.replace(/[&<>"']/g, char => entities[char]);
}

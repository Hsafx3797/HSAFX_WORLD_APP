/**
 * Data Converter Utility Functions
 * Escape/unescape, encoding, color conversion, and misc utilities
 * (Moved from compat.ts)
 */

// ============================================================
// Escape / Unescape Utilities
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
 * Escape SQL special characters for safe string literals.
 *
 * WARNING: This is a display/formatting utility. For actual database queries,
 * always use parameterized queries / prepared statements instead.
 */
export function escapeSql(text: string): string {
  return text
    .replace(/\0/g, '')           // Strip null bytes
    .replace(/\\/g, '\\\\')       // Backslash (must be first after null)
    .replace(/'/g, "''")          // Single quote
    .replace(/"/g, '\\"')         // Double quote
    .replace(/`/g, '\\`')         // Backtick (MySQL identifiers)
    .replace(/--/g, '\\-\\-')     // Line comment
    .replace(/\/\*/g, '\\/\\*')   // Block comment open
    .replace(/\*\//g, '\\*\\/')   // Block comment close
    .replace(/;/g, '\\;')         // Statement terminator
    // eslint-disable-next-line no-control-regex
    .replace(/[\x01-\x1f\x7f]/g, ''); // Strip remaining control characters
}

// ============================================================
// HTML / Text Utilities
// ============================================================

/**
 * Convert text to HTML list
 */
export function textToHtmlList(text: string, ordered = false): string {
  const lines = text.split('\n').filter(Boolean);
  const tag = ordered ? 'ol' : 'ul';
  const items = lines.map(line => `  <li>${escapeHtml(line.trim())}</li>`).join('\n');
  return `<${tag}>\n${items}\n</${tag}>`;
}

// ============================================================
// Date / Time Utilities
// ============================================================

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

// ============================================================
// Base64 / Data URL Utilities
// ============================================================

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

// ============================================================
// Encoding Utilities
// ============================================================

/**
 * Punycode encode (basic)
 */
export function punycodeEncode(text: string): string {
  try {
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
  if (!text.startsWith('xn--')) return text;
  return text;
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

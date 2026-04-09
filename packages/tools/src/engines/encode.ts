/**
 * Encode Engine — Universal Encoder / Decoder
 *
 * Replaces 38+ individual encode/decode functions with one engine
 * that routes to the correct codec by name.
 */

import type { Engine, EncodeEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
import {
  encodeBase64, decodeBase64,
  encodeBase64Url, decodeBase64Url,
  encodeURL, decodeURL,
  encodeHTML, decodeHTML,
  encodeUnicode, decodeUnicode,
  encodeHex, decodeHex,
  encodeBinary, decodeBinary,
  encodeMorse, decodeMorse,
  encodeNATO, decodeNATO,
  rot13, caesarCipher,
  encodePunycode, decodePunycode,
  encodeURLComponent,
} from '../encoders';

// ---------------------------------------------------------------------------
// Inline codecs for missing encodings
// ---------------------------------------------------------------------------

// Base32 encoding (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function encodeBase32(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  while (bits.length % 5 !== 0) bits += '0';
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    result += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  while (result.length % 8 !== 0) result += '=';
  return result;
}
function decodeBase32(input: string): string {
  const cleaned = input.replace(/=+$/, '').toUpperCase();
  let bits = '';
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Base58 (Bitcoin-style)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function encodeBase58(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let num = BigInt(0);
  for (const b of bytes) num = num * BigInt(256) + BigInt(b);
  let result = '';
  while (num > 0) {
    result = BASE58_ALPHABET[Number(num % BigInt(58))] + result;
    num = num / BigInt(58);
  }
  for (const b of bytes) { if (b === 0) result = '1' + result; else break; }
  return result || '1';
}
function decodeBase58(input: string): string {
  let num = BigInt(0);
  for (const ch of input) {
    const idx = BASE58_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    num = num * BigInt(58) + BigInt(idx);
  }
  const hex = num.toString(16);
  const padded = hex.length % 2 ? '0' + hex : hex;
  const bytes: number[] = [];
  for (let i = 0; i < padded.length; i += 2) {
    bytes.push(parseInt(padded.slice(i, i + 2), 16));
  }
  let leadingOnes = 0;
  for (const ch of input) { if (ch === '1') leadingOnes++; else break; }
  const prefix = new Array(leadingOnes).fill(0);
  return new TextDecoder().decode(new Uint8Array([...prefix, ...bytes]));
}

// Base91
const BASE91_TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';
function encodeBase91(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let result = '';
  let n = 0, b = 0;
  for (const byte of bytes) {
    b |= byte << n;
    n += 8;
    if (n > 13) {
      let v = b & 8191;
      if (v > 88) { b >>= 13; n -= 13; }
      else { v = b & 16383; b >>= 14; n -= 14; }
      result += BASE91_TABLE[v % 91] + BASE91_TABLE[Math.floor(v / 91)];
    }
  }
  if (n) {
    result += BASE91_TABLE[b % 91];
    if (n > 7 || b > 90) result += BASE91_TABLE[Math.floor(b / 91)];
  }
  return result;
}
function decodeBase91(input: string): string {
  const bytes: number[] = [];
  let n = 0, b = 0, v = -1;
  for (const ch of input) {
    const c = BASE91_TABLE.indexOf(ch);
    if (c === -1) continue;
    if (v < 0) { v = c; continue; }
    v += c * 91;
    b |= v << n;
    n += (v & 8191) > 88 ? 13 : 14;
    while (n >= 8) {
      bytes.push(b & 255);
      b >>= 8;
      n -= 8;
    }
    v = -1;
  }
  if (v > -1) {
    bytes.push((b | v << n) & 255);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Octal
function encodeOctal(input: string): string {
  return [...new TextEncoder().encode(input)].map(b => b.toString(8).padStart(3, '0')).join(' ');
}
function decodeOctal(input: string): string {
  const parts = input.trim().split(/\s+/);
  const bytes = parts.map(p => parseInt(p, 8));
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// ROT47
function rot47(input: string): string {
  return input.split('').map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 33 && code <= 126) return String.fromCharCode(33 + ((code - 33 + 47) % 94));
    return ch;
  }).join('');
}

// Atbash
function atbash(input: string): string {
  return input.split('').map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCharCode(90 - (code - 65));
    if (code >= 97 && code <= 122) return String.fromCharCode(122 - (code - 97));
    return ch;
  }).join('');
}

// Vigenere
function vigenereEncode(input: string, key: string): string {
  const k = key.toUpperCase();
  let ki = 0;
  return input.split('').map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      const shift = k.charCodeAt(ki % k.length) - 65;
      ki++;
      return String.fromCharCode(((code - 65 + shift) % 26) + 65);
    }
    if (code >= 97 && code <= 122) {
      const shift = k.charCodeAt(ki % k.length) - 65;
      ki++;
      return String.fromCharCode(((code - 97 + shift) % 26) + 97);
    }
    return ch;
  }).join('');
}
function vigenereDecode(input: string, key: string): string {
  const k = key.toUpperCase();
  let ki = 0;
  return input.split('').map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      const shift = k.charCodeAt(ki % k.length) - 65;
      ki++;
      return String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
    }
    if (code >= 97 && code <= 122) {
      const shift = k.charCodeAt(ki % k.length) - 65;
      ki++;
      return String.fromCharCode(((code - 97 - shift + 26) % 26) + 97);
    }
    return ch;
  }).join('');
}

// Playfair cipher
function buildPlayfairGrid(key: string): string[][] {
  const seen = new Set<string>();
  const chars: string[] = [];
  for (const ch of (key.toUpperCase() + 'ABCDEFGHIKLMNOPQRSTUVWXYZ')) {
    const c = ch === 'J' ? 'I' : ch;
    if (/[A-Z]/.test(c) && !seen.has(c)) { seen.add(c); chars.push(c); }
  }
  const grid: string[][] = [];
  for (let i = 0; i < 5; i++) grid.push(chars.slice(i * 5, i * 5 + 5));
  return grid;
}
function findInGrid(grid: string[][], ch: string): [number, number] {
  const c = ch === 'J' ? 'I' : ch;
  for (let r = 0; r < 5; r++) for (let col = 0; col < 5; col++) if (grid[r][col] === c) return [r, col];
  return [0, 0];
}
function playfairEncode(input: string, key: string): string {
  const grid = buildPlayfairGrid(key);
  const clean = input.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  const pairs: string[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    const a = clean[i];
    const b = i + 1 < clean.length ? (clean[i + 1] === a ? 'X' : clean[i + 1]) : 'X';
    if (clean[i + 1] === a) i--;
    pairs.push(a + b);
  }
  return pairs.map(pair => {
    const [r1, c1] = findInGrid(grid, pair[0]);
    const [r2, c2] = findInGrid(grid, pair[1]);
    if (r1 === r2) return grid[r1][(c1 + 1) % 5] + grid[r2][(c2 + 1) % 5];
    if (c1 === c2) return grid[(r1 + 1) % 5][c1] + grid[(r2 + 1) % 5][c2];
    return grid[r1][c2] + grid[r2][c1];
  }).join('');
}
function playfairDecode(input: string, key: string): string {
  const grid = buildPlayfairGrid(key);
  const clean = input.toUpperCase().replace(/[^A-Z]/g, '');
  const pairs: string[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    pairs.push(clean[i] + (clean[i + 1] ?? 'X'));
  }
  return pairs.map(pair => {
    const [r1, c1] = findInGrid(grid, pair[0]);
    const [r2, c2] = findInGrid(grid, pair[1]);
    if (r1 === r2) return grid[r1][(c1 + 4) % 5] + grid[r2][(c2 + 4) % 5];
    if (c1 === c2) return grid[(r1 + 4) % 5][c1] + grid[(r2 + 4) % 5][c2];
    return grid[r1][c2] + grid[r2][c1];
  }).join('');
}

// Bacon cipher
const BACON_MAP: Record<string, string> = {
  A:'AAAAA',B:'AAAAB',C:'AAABA',D:'AAABB',E:'AABAA',F:'AABAB',G:'AABBA',H:'AABBB',
  I:'ABAAA',J:'ABAAB',K:'ABABA',L:'ABABB',M:'ABBAA',N:'ABBAB',O:'ABBBA',P:'ABBBB',
  Q:'BAAAA',R:'BAAAB',S:'BAABA',T:'BAABB',U:'BABAA',V:'BABAB',W:'BABBA',X:'BABBB',
  Y:'BBAAA',Z:'BBAAB',
};
const BACON_REVERSE = Object.fromEntries(Object.entries(BACON_MAP).map(([k, v]) => [v, k]));
function baconEncode(input: string): string {
  return input.toUpperCase().split('').map(ch => BACON_MAP[ch] ?? ch).join(' ');
}
function baconDecode(input: string): string {
  return input.split(/\s+/).map(g => BACON_REVERSE[g] ?? g).join('');
}

// Rail fence cipher
function railFenceEncode(input: string, rails: number): string {
  if (rails <= 1) return input;
  const fence: string[][] = Array.from({ length: rails }, () => []);
  let rail = 0, dir = 1;
  for (const ch of input) {
    fence[rail].push(ch);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  return fence.map(r => r.join('')).join('');
}
function railFenceDecode(input: string, rails: number): string {
  if (rails <= 1) return input;
  const n = input.length;
  const pattern: number[] = [];
  let rail = 0, dir = 1;
  for (let i = 0; i < n; i++) {
    pattern.push(rail);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  const counts = new Array(rails).fill(0);
  for (const r of pattern) counts[r]++;
  const offsets = [0];
  for (let i = 1; i < rails; i++) offsets.push(offsets[i - 1] + counts[i - 1]);
  const result = new Array(n);
  const pos = [...offsets];
  for (let i = 0; i < n; i++) {
    const r = pattern[i];
    result[i] = input[pos[r]++];
  }
  return result.join('');
}

// Braille
const BRAILLE_MAP: Record<string, string> = {
  a:'⠁',b:'⠃',c:'⠉',d:'⠙',e:'⠑',f:'⠋',g:'⠛',h:'⠓',i:'⠊',j:'⠚',
  k:'⠅',l:'⠇',m:'⠍',n:'⠝',o:'⠕',p:'⠏',q:'⠟',r:'⠗',s:'⠎',t:'⠞',
  u:'⠥',v:'⠧',w:'⠺',x:'⠭',y:'⠽',z:'⠵',
  '1':'⠼⠁','2':'⠼⠃','3':'⠼⠉','4':'⠼⠙','5':'⠼⠑',
  '6':'⠼⠋','7':'⠼⠛','8':'⠼⠓','9':'⠼⠊','0':'⠼⠚',
  ' ':'⠀','.':'⠲',',':'⠂','!':'⠖','?':'⠦',';':'⠆',':':'⠒',
};
const BRAILLE_REVERSE = Object.fromEntries(Object.entries(BRAILLE_MAP).map(([k, v]) => [v, k]));
function encodeBraille(input: string): string {
  return input.toLowerCase().split('').map(ch => BRAILLE_MAP[ch] ?? ch).join('');
}
function decodeBraille(input: string): string {
  let result = '';
  let i = 0;
  const chars = [...input]; // proper code-point iteration
  while (i < chars.length) {
    // Check two-char combos first (number prefix)
    if (i + 1 < chars.length) {
      const pair = chars[i] + chars[i + 1];
      if (BRAILLE_REVERSE[pair]) { result += BRAILLE_REVERSE[pair]; i += 2; continue; }
    }
    result += BRAILLE_REVERSE[chars[i]] ?? chars[i];
    i++;
  }
  return result;
}

// JSON escape/unescape
function jsonEscape(input: string): string {
  return JSON.stringify(input).slice(1, -1);
}
function jsonUnescape(input: string): string {
  try { return JSON.parse(`"${input}"`); } catch { return input; }
}

// XML escape/unescape
function xmlEscape(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
function xmlUnescape(input: string): string {
  return input
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

// ASCII code
function asciiEncode(input: string): string {
  return input.split('').map(ch => ch.charCodeAt(0)).join(' ');
}
function asciiDecode(input: string): string {
  return input.trim().split(/\s+/).map(n => String.fromCharCode(parseInt(n, 10))).join('');
}

// Unicode escape
function unicodeEscapeEncode(input: string): string {
  return input.split('').map(ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')).join('');
}
function unicodeEscapeDecode(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Tap code
const TAP_GRID = [
  ['A','B','C','D','E'],
  ['F','G','H','I','J'],
  ['K','L','M','N','O'],
  ['P','Q','R','S','T'],
  ['U','V','W','X','Y'],
  // Z = K (row 3 col 1 by convention, or separate)
];
function tapEncode(input: string): string {
  return input.toUpperCase().replace(/K/g, 'C').split('').map(ch => {
    if (ch === ' ') return '/ /';
    for (let r = 0; r < TAP_GRID.length; r++) {
      const c = TAP_GRID[r].indexOf(ch);
      if (c !== -1) return '.'.repeat(r + 1) + ' ' + '.'.repeat(c + 1);
    }
    if (ch === 'Z') return '...... .....'; // special
    return ch;
  }).join('  ');
}
function tapDecode(input: string): string {
  return input.split(/\s{2,}/).map(group => {
    if (group.trim() === '/ /') return ' ';
    const parts = group.trim().split(/\s+/);
    if (parts.length === 2) {
      const r = parts[0].length - 1;
      const c = parts[1].length - 1;
      return TAP_GRID[r]?.[c] ?? '?';
    }
    return group;
  }).join('');
}

// URL slug
function urlSlug(input: string): string {
  return input.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// URL unscrambler
function urlUnscramble(input: string): string {
  try {
    const url = new URL(input);
    const parts = [
      `Protocol: ${url.protocol}`,
      `Host: ${url.hostname}`,
      url.port ? `Port: ${url.port}` : '',
      `Path: ${url.pathname}`,
      url.search ? `Query: ${url.search}` : '',
      url.hash ? `Hash: ${url.hash}` : '',
    ].filter(Boolean);
    return parts.join('\n');
  } catch {
    return decodeURIComponent(input);
  }
}

// Binary to Hex and Hex to Binary
function binaryToHex(input: string): string {
  return input.trim().split(/\s+/).map(b => parseInt(b, 2).toString(16).padStart(2, '0')).join(' ');
}
function hexToBinary(input: string): string {
  return input.trim().split(/\s+/).map(h => parseInt(h, 16).toString(2).padStart(8, '0')).join(' ');
}

// Caesar bruteforce
function caesarBruteforce(input: string): string {
  const results: string[] = [];
  for (let s = 1; s <= 25; s++) {
    results.push(`Shift ${s.toString().padStart(2, ' ')}: ${caesarCipher(input, s)}`);
  }
  return results.join('\n');
}

// ---------------------------------------------------------------------------
// Codec registry
// ---------------------------------------------------------------------------

type CodecFn = (input: string) => string;
type CodecEntry = { encode: CodecFn; decode: CodecFn };

function buildCodecs(): Record<string, CodecEntry> {
  return {
    'base64':     { encode: encodeBase64,     decode: decodeBase64 },
    'base64url':  { encode: encodeBase64Url,  decode: decodeBase64Url },
    'url':        { encode: encodeURL,         decode: decodeURL },
    'url-component': { encode: encodeURLComponent, decode: decodeURL },
    'html':       { encode: encodeHTML,        decode: decodeHTML },
    'unicode':    { encode: encodeUnicode,     decode: decodeUnicode },
    'hex':        { encode: encodeHex,         decode: decodeHex },
    'binary':     { encode: encodeBinary,      decode: decodeBinary },
    'morse':      { encode: encodeMorse,       decode: decodeMorse },
    'nato':       { encode: encodeNATO,        decode: decodeNATO },
    'rot13':      { encode: rot13,             decode: rot13 },
    'punycode':   { encode: encodePunycode,    decode: decodePunycode },
    'base32':     { encode: encodeBase32,      decode: decodeBase32 },
    'base58':     { encode: encodeBase58,      decode: decodeBase58 },
    'base91':     { encode: encodeBase91,      decode: decodeBase91 },
    'octal':      { encode: encodeOctal,       decode: decodeOctal },
    'braille':    { encode: encodeBraille,     decode: decodeBraille },
    'json':       { encode: jsonEscape,        decode: jsonUnescape },
    'xml':        { encode: xmlEscape,         decode: xmlUnescape },
    'ascii':      { encode: asciiEncode,       decode: asciiDecode },
    'unicode-escape': { encode: unicodeEscapeEncode, decode: unicodeEscapeDecode },
    'tap':        { encode: tapEncode,         decode: tapDecode },
  };
}

const CODECS = buildCodecs();

// Special codecs (one-directional or parameterized)
const SPECIAL_CODECS: Record<string, string> = {
  'rot47': 'rot47',
  'atbash': 'atbash',
  'caesar': 'caesar',
  'vigenere': 'vigenere',
  'playfair': 'playfair',
  'bacon': 'bacon',
  'rail-fence': 'rail-fence',
  'url-slug': 'url-slug',
  'url-unscramble': 'url-unscramble',
  'binary-to-hex': 'binary-to-hex',
  'hex-to-binary': 'hex-to-binary',
  'caesar-bruteforce': 'caesar-bruteforce',
  'utf8-to-utf16': 'utf8-to-utf16',
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const encodeEngine: Engine<EncodeEngineOptions> = {
  name: 'encode',
  description: 'Universal encoder/decoder — route to any codec by name.',

  validate(options: EncodeEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    const validOps = ['encode', 'decode'];
    if (!validOps.includes(options.operation)) {
      errors.push(`Invalid operation "${options.operation}". Must be one of: ${validOps.join(', ')}`);
    }
    const allCodecs = [...Object.keys(CODECS), ...Object.keys(SPECIAL_CODECS)];
    if (!CODECS[options.codec] && !SPECIAL_CODECS[options.codec]) {
      errors.push(`Unknown codec "${options.codec}". Available: ${allCodecs.join(', ')}`);
    }
    if (options.codec === 'caesar') {
      if (options.shift !== undefined && (options.shift < 0 || options.shift > 25)) {
        errors.push('Caesar shift must be between 0 and 25');
      }
    }
    if (options.codec === 'vigenere' && !options.key) {
      errors.push('key is required for vigenere codec');
    }
    if (options.codec === 'playfair' && !options.key) {
      errors.push('key is required for playfair codec');
    }
    if (options.codec === 'rail-fence') {
      if (options.rails !== undefined && (options.rails < 2 || options.rails > 20)) {
        errors.push('rails must be between 2 and 20');
      }
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: EncodeEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : String(input);
    const { codec, operation, shift, key, rails } = options;

    // Special codecs
    switch (codec) {
      case 'caesar': {
        const s = shift ?? 13;
        const effectiveShift = operation === 'decode' ? (26 - s) % 26 : s;
        return { output: caesarCipher(text, effectiveShift), metadata: { codec, operation, shift: s } };
      }
      case 'rot47':
        return { output: rot47(text), metadata: { codec } };
      case 'atbash':
        return { output: atbash(text), metadata: { codec } };
      case 'vigenere': {
        const k = key ?? 'KEY';
        const fn = operation === 'encode' ? vigenereEncode : vigenereDecode;
        return { output: fn(text, k), metadata: { codec, operation } };
      }
      case 'playfair': {
        const k = key ?? 'KEYWORD';
        const fn = operation === 'encode' ? playfairEncode : playfairDecode;
        return { output: fn(text, k), metadata: { codec, operation } };
      }
      case 'bacon': {
        const fn = operation === 'encode' ? baconEncode : baconDecode;
        return { output: fn(text), metadata: { codec, operation } };
      }
      case 'rail-fence': {
        const r = rails ?? 3;
        const fn = operation === 'encode' ? railFenceEncode : railFenceDecode;
        return { output: fn(text, r), metadata: { codec, operation, rails: r } };
      }
      case 'url-slug':
        return { output: urlSlug(text), metadata: { codec } };
      case 'url-unscramble':
        return { output: urlUnscramble(text), metadata: { codec } };
      case 'binary-to-hex':
        return { output: binaryToHex(text), metadata: { codec } };
      case 'hex-to-binary':
        return { output: hexToBinary(text), metadata: { codec } };
      case 'caesar-bruteforce':
        return { output: caesarBruteforce(text), metadata: { codec } };
      case 'utf8-to-utf16': {
        // Show each UTF-16 code unit in hex (JS strings are natively UTF-16)
        const units: string[] = [];
        for (let i = 0; i < text.length; i++) {
          units.push(text.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'));
        }
        return {
          output: units.join(' '),
          metadata: { codec, codeUnits: units.length, hasSurrogates: units.some((_, idx) => text.charCodeAt(idx) >= 0xD800 && text.charCodeAt(idx) <= 0xDFFF) },
        };
      }
    }

    // Standard codecs
    const entry = CODECS[codec];
    if (!entry) {
      return { output: text, metadata: { error: `Unknown codec: ${codec}` } };
    }

    const fn = operation === 'encode' ? entry.encode : entry.decode;
    return { output: fn(text), metadata: { codec, operation } };
  },
};

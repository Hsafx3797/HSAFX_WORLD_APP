/**
 * Unicode Engine — Unicode Text Style Transforms
 *
 * Converts text to Unicode mathematical/decorative variants:
 * small caps, superscript, subscript, fullwidth, circled, squared,
 * fraktur, double-struck, monospace, bold, italic, etc.
 *
 * Also handles fun transforms: upside-down, zalgo, clap, leet speak, etc.
 */

import type { Engine, EngineInput, EngineResult, ValidationOutcome } from './types';

// ---------------------------------------------------------------------------
// Unicode character maps
// ---------------------------------------------------------------------------

export interface UnicodeEngineOptions extends Record<string, unknown> {
  style: string;
  intensity?: 'low' | 'medium' | 'high'; // for zalgo
}

const SMALL_CAPS: Record<string, string> = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ',
  i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ',
  q: 'ǫ', r: 'ʀ', s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
  y: 'ʏ', z: 'ᴢ',
};

const SUPERSCRIPT: Record<string, string> = {
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ',
  i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ',
  r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶',
  '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
};

const SUBSCRIPT: Record<string, string> = {
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ',
  n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆',
  '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
};

const UPSIDE_DOWN: Record<string, string> = {
  a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ',
  i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd',
  q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x',
  y: 'ʎ', z: 'z',
  A: '∀', B: 'ᗺ', C: 'Ɔ', D: 'ᗡ', E: 'Ǝ', F: 'Ⅎ', G: '⅁', H: 'H',
  I: 'I', J: 'ſ', K: 'ʞ', L: '˥', M: 'W', N: 'N', O: 'O', P: 'Ԁ',
  Q: 'Q', R: 'ᴚ', S: 'S', T: '⊥', U: '∩', V: 'Λ', W: 'M', X: 'X',
  Y: '⅄', Z: 'Z',
  '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ',
  '8': '8', '9': '6', '0': '0',
  '.': '˙', ',': "'", "'": ',', '"': ',,', '!': '¡', '?': '¿',
  '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{',
  '<': '>', '>': '<', '_': '‾', ';': '؛', '&': '⅋',
};

const CIRCLED: Record<string, string> = {
  A: 'Ⓐ', B: 'Ⓑ', C: 'Ⓒ', D: 'Ⓓ', E: 'Ⓔ', F: 'Ⓕ', G: 'Ⓖ', H: 'Ⓗ',
  I: 'Ⓘ', J: 'Ⓙ', K: 'Ⓚ', L: 'Ⓛ', M: 'Ⓜ', N: 'Ⓝ', O: 'Ⓞ', P: 'Ⓟ',
  Q: 'Ⓠ', R: 'Ⓡ', S: 'Ⓢ', T: 'Ⓣ', U: 'Ⓤ', V: 'Ⓥ', W: 'Ⓦ', X: 'Ⓧ',
  Y: 'Ⓨ', Z: 'Ⓩ',
  a: 'ⓐ', b: 'ⓑ', c: 'ⓒ', d: 'ⓓ', e: 'ⓔ', f: 'ⓕ', g: 'ⓖ', h: 'ⓗ',
  i: 'ⓘ', j: 'ⓙ', k: 'ⓚ', l: 'ⓛ', m: 'ⓜ', n: 'ⓝ', o: 'ⓞ', p: 'ⓟ',
  q: 'ⓠ', r: 'ⓡ', s: 'ⓢ', t: 'ⓣ', u: 'ⓤ', v: 'ⓥ', w: 'ⓦ', x: 'ⓧ',
  y: 'ⓨ', z: 'ⓩ',
  '0': '⓪', '1': '①', '2': '②', '3': '③', '4': '④', '5': '⑤', '6': '⑥',
  '7': '⑦', '8': '⑧', '9': '⑨',
};

const SQUARED: Record<string, string> = {
  A: '🄰', B: '🄱', C: '🄲', D: '🄳', E: '🄴', F: '🄵', G: '🄶', H: '🄷',
  I: '🄸', J: '🄹', K: '🄺', L: '🄻', M: '🄼', N: '🄽', O: '🄾', P: '🄿',
  Q: '🅀', R: '🅁', S: '🅂', T: '🅃', U: '🅄', V: '🅅', W: '🅆', X: '🅇',
  Y: '🅈', Z: '🅉',
};

const LEET_MAP: Record<string, string> = {
  a: '4', b: '8', c: '(', d: 'd', e: '3', f: 'f', g: '6', h: 'h',
  i: '1', j: 'j', k: 'k', l: '|', m: 'm', n: 'n', o: '0', p: 'p',
  q: 'q', r: 'r', s: '5', t: '7', u: 'u', v: 'v', w: 'w', x: 'x',
  y: 'y', z: '2',
};

// Math Unicode ranges (offset from standard ASCII)
function mathOffset(text: string, upperStart: number, lowerStart: number, digitStart?: number): string {
  return text.split('').map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(upperStart + (code - 65));
    if (code >= 97 && code <= 122) return String.fromCodePoint(lowerStart + (code - 97));
    if (digitStart !== undefined && code >= 48 && code <= 57) return String.fromCodePoint(digitStart + (code - 48));
    return ch;
  }).join('');
}

// Zalgo diacritics
const ZALGO_UP = ['\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306', '\u0310', '\u0352', '\u0357', '\u0351', '\u0307', '\u0308', '\u030a', '\u0342', '\u0343', '\u0344', '\u034a', '\u034b', '\u034c', '\u0303', '\u0302', '\u030c', '\u0350', '\u0300', '\u0301', '\u030b', '\u030f', '\u0312', '\u0313', '\u0314', '\u033d', '\u0309', '\u0363', '\u0364', '\u0365', '\u0366', '\u0367', '\u0368', '\u0369', '\u036a', '\u036b', '\u036c', '\u036d', '\u036e', '\u036f', '\u0346', '\u034d', '\u034e'];
const ZALGO_MID = ['\u0315', '\u031b', '\u0340', '\u0341', '\u0358', '\u0321', '\u0322', '\u0327', '\u0328', '\u0334', '\u0335', '\u0336', '\u034f', '\u035c', '\u035d', '\u035e', '\u035f', '\u0360', '\u0362', '\u0338', '\u0337', '\u0361', '\u0489'];
const ZALGO_DOWN = ['\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e', '\u031f', '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032a', '\u032b', '\u032c', '\u032d', '\u032e', '\u032f', '\u0330', '\u0331', '\u0332', '\u0333', '\u0339', '\u033a', '\u033b', '\u033c', '\u0345', '\u0347', '\u0348', '\u0349', '\u034d', '\u034e', '\u0353', '\u0354', '\u0355', '\u0356', '\u0359', '\u035a', '\u0323'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// UwU transform
function uwuify(text: string): string {
  return text
    .replace(/[rl]/g, 'w')
    .replace(/[RL]/g, 'W')
    .replace(/n([aeiou])/g, 'ny$1')
    .replace(/N([aeiou])/g, 'Ny$1')
    .replace(/N([AEIOU])/g, 'NY$1')
    .replace(/ove/g, 'uv')
    + ' UwU';
}

// Pirate speak transform
function piratify(text: string): string {
  const replacements: [RegExp, string][] = [
    [/\byou\b/gi, 'ye'],
    [/\byour\b/gi, 'yer'],
    [/\bare\b/gi, 'be'],
    [/\bis\b/gi, 'be'],
    [/\bmy\b/gi, 'me'],
    [/\bfriend\b/gi, 'matey'],
    [/\bfriends\b/gi, 'crew'],
    [/\bhello\b/gi, 'ahoy'],
    [/\bhi\b/gi, 'ahoy'],
    [/\bthe\b/gi, "th'"],
    [/\bof\b/gi, "o'"],
    [/\bfor\b/gi, 'fer'],
    [/\bto\b/gi, "t'"],
    [/\band\b/gi, "n'"],
    [/\bpeople\b/gi, 'scallywags'],
    [/\bboy\b/gi, 'lad'],
    [/\bgirl\b/gi, 'lass'],
    [/\bman\b/gi, 'landlubber'],
    [/\bmoney\b/gi, 'doubloons'],
    [/\bfood\b/gi, 'grub'],
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return 'Arrr! ' + result;
}

// Yoda speak transform
function yodaify(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.map(s => {
    const words = s.trim().split(/\s+/);
    if (words.length < 4) return s;
    // Move last 2 words to front
    const last2 = words.splice(-2);
    return [...last2, ...words].join(' ');
  }).join(' ');
}

// Shakespearean transform
function shakespearify(text: string): string {
  const replacements: [RegExp, string][] = [
    [/\byou\b/gi, 'thou'],
    [/\byour\b/gi, 'thy'],
    [/\bare\b/gi, 'art'],
    [/\bis\b/gi, "'tis"],
    [/\bdo\b/gi, 'doth'],
    [/\bhave\b/gi, 'hath'],
    [/\bwill\b/gi, 'shall'],
    [/\byes\b/gi, 'aye'],
    [/\bno\b/gi, 'nay'],
    [/\bplease\b/gi, 'prithee'],
    [/\bthank you\b/gi, 'I giveth thee thanks'],
    [/\bwhere\b/gi, 'whither'],
    [/\bwhy\b/gi, 'wherefore'],
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// Pig Latin
function pigLatinify(text: string): string {
  return text.split(/\b/).map(word => {
    if (!/^[a-zA-Z]+$/.test(word)) return word;
    const vowels = /^[aeiouAEIOU]/;
    if (vowels.test(word)) return word + 'way';
    const match = word.match(/^([^aeiouAEIOU]+)(.*)/);
    if (!match) return word + 'ay';
    const [, consonants, rest] = match;
    return rest + consonants.toLowerCase() + 'ay';
  }).join('');
}

// Meme caption
function memeCaption(text: string): string {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length >= 2) {
    return lines[0].toUpperCase() + '\n\n' + lines[lines.length - 1].toUpperCase();
  }
  const words = text.split(/\s+/);
  const mid = Math.ceil(words.length / 2);
  return words.slice(0, mid).join(' ').toUpperCase() + '\n\n' + words.slice(mid).join(' ').toUpperCase();
}

// ---------------------------------------------------------------------------
// Style dispatch
// ---------------------------------------------------------------------------

function applyUnicodeStyle(text: string, style: string, intensity?: string): string {
  switch (style) {
    case 'small-caps':
      return text.split('').map(ch => SMALL_CAPS[ch.toLowerCase()] ?? ch).join('');
    case 'superscript':
      return text.split('').map(ch => SUPERSCRIPT[ch.toLowerCase()] ?? ch).join('');
    case 'subscript':
      return text.split('').map(ch => SUBSCRIPT[ch.toLowerCase()] ?? ch).join('');
    case 'fullwidth':
      return text.split('').map(ch => {
        const code = ch.charCodeAt(0);
        if (code >= 33 && code <= 126) return String.fromCodePoint(code + 0xFF00 - 0x20);
        if (ch === ' ') return '\u3000';
        return ch;
      }).join('');
    case 'halfwidth':
      return text.split('').map(ch => {
        const code = ch.charCodeAt(0);
        if (code >= 0xFF01 && code <= 0xFF5E) return String.fromCodePoint(code - 0xFF00 + 0x20);
        if (code === 0x3000) return ' ';
        return ch;
      }).join('');
    case 'circled':
    case 'bubble-text':
      return text.split('').map(ch => CIRCLED[ch] ?? ch).join('');
    case 'squared':
      return text.split('').map(ch => SQUARED[ch.toUpperCase()] ?? ch).join('');
    case 'math-bold':
      return mathOffset(text, 0x1D400, 0x1D41A, 0x1D7CE);
    case 'math-italic':
      return mathOffset(text, 0x1D434, 0x1D44E);
    case 'fraktur':
      return mathOffset(text, 0x1D504, 0x1D51E);
    case 'double-struck':
      return mathOffset(text, 0x1D538, 0x1D552, 0x1D7D8);
    case 'monospace-unicode':
      return mathOffset(text, 0x1D670, 0x1D68A, 0x1D7F6);
    case 'mirror-text':
    case 'reverse-letters':
      return text.split('').reverse().join('');
    case 'upside-down':
    case 'rotated-text':
      return text.split('').reverse().map(ch => UPSIDE_DOWN[ch] ?? ch).join('');
    case 'zalgo': {
      const counts = intensity === 'high' ? [8, 4, 8] : intensity === 'low' ? [1, 1, 1] : [3, 2, 3];
      return text.split('').map(ch => {
        if (/\s/.test(ch)) return ch;
        let result = ch;
        for (let i = 0; i < counts[0]; i++) result += randomFrom(ZALGO_UP);
        for (let i = 0; i < counts[1]; i++) result += randomFrom(ZALGO_MID);
        for (let i = 0; i < counts[2]; i++) result += randomFrom(ZALGO_DOWN);
        return result;
      }).join('');
    }
    case 'clap':
      return text.split(/\s+/).join(' 👏 ');
    case 'sparkle':
      return '✨ ' + text.split(/\s+/).join(' ✨ ') + ' ✨';
    case 'emoji-wrap':
      return '🎉 ' + text + ' 🎉';
    case 'emoji-case': {
      const emojiMap: Record<string, string> = {
        a: '🅰️', b: '🅱️', o: '🅾️', i: 'ℹ️', p: '🅿️', m: 'Ⓜ️',
      };
      return text.split('').map(ch => emojiMap[ch.toLowerCase()] ?? ch).join('');
    }
    case 'emoji-translator':
      return text
        .replace(/\bhappy\b/gi, '😊')
        .replace(/\bsad\b/gi, '😢')
        .replace(/\blove\b/gi, '❤️')
        .replace(/\bheart\b/gi, '❤️')
        .replace(/\bfire\b/gi, '🔥')
        .replace(/\bstar\b/gi, '⭐')
        .replace(/\bsun\b/gi, '☀️')
        .replace(/\brain\b/gi, '🌧️')
        .replace(/\bwater\b/gi, '💧')
        .replace(/\bmusic\b/gi, '🎵')
        .replace(/\bdog\b/gi, '🐕')
        .replace(/\bcat\b/gi, '🐱')
        .replace(/\bfood\b/gi, '🍔')
        .replace(/\bcoffee\b/gi, '☕')
        .replace(/\bphone\b/gi, '📱');
    case 'leet-speak':
      return text.split('').map(ch => LEET_MAP[ch.toLowerCase()] ?? ch).join('');
    case 'uwu-speak':
      return uwuify(text);
    case 'pirate-speak':
      return piratify(text);
    case 'yoda-speak':
      return yodaify(text);
    case 'shakespearean':
      return shakespearify(text);
    case 'pig-latin':
      return pigLatinify(text);
    case 'meme-caption':
      return memeCaption(text);
    case 'normalize':
      return text.normalize('NFC');
    case 'code-point':
      return [...text].map(ch => `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`).join(' ');
    case 'strip-bidi':
      return text.replace(/[\u200E\u200F\u200B\u200C\u200D\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/g, '');
    case 'spoiler-text':
      return [...text].map(ch => ch === ' ' ? ' ' : `||${ch}||`).join('');
    default:
      return text;
  }
}

// ---------------------------------------------------------------------------
// All supported styles
// ---------------------------------------------------------------------------

const VALID_STYLES = [
  'small-caps', 'superscript', 'subscript', 'mirror-text', 'fullwidth', 'halfwidth',
  'circled', 'squared', 'bubble-text', 'math-bold', 'math-italic', 'fraktur',
  'double-struck', 'monospace-unicode', 'rotated-text', 'upside-down', 'emoji-case',
  'emoji-wrap', 'emoji-translator', 'zalgo', 'clap', 'sparkle', 'spoiler-text',
  'leet-speak', 'pirate-speak', 'uwu-speak', 'yoda-speak', 'shakespearean',
  'meme-caption', 'pig-latin', 'reverse-letters',
  'normalize', 'code-point', 'strip-bidi',
];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const unicodeEngine: Engine<UnicodeEngineOptions> = {
  name: 'unicode',
  description: 'Unicode text style transforms — decorative fonts, fun text effects, and novelty translators.',

  validate(options: UnicodeEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    if (!VALID_STYLES.includes(options.style)) {
      errors.push(`Unknown style "${options.style}". Available: ${VALID_STYLES.join(', ')}`);
    }
    if (options.intensity) {
      const validIntensities = ['low', 'medium', 'high'];
      if (!validIntensities.includes(options.intensity)) {
        errors.push(`Invalid intensity "${options.intensity}". Must be one of: ${validIntensities.join(', ')}`);
      }
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: UnicodeEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : String(input);
    const output = applyUnicodeStyle(text, options.style, options.intensity);
    return { output, metadata: { style: options.style } };
  },
};

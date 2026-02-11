/**
 * Web Generators - Exact copy from apps/web/src/lib/tools/generators.ts
 * This is the canonical source for all generator implementations used by the web app.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getCrypto = (): Crypto => (globalThis as any).crypto;

// ==================== UUID GENERATORS ====================

export function generateUuidV1(): string {
  const now = Date.now();
  const uuid = 'xxxxxxxx-xxxx-1xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (now + Math.random() * 16) % 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  return uuid;
}

export function generateUuidV4(): string {
  const bytes = new Uint8Array(16);
  getCrypto().getRandomValues(bytes);
  
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function generateUuidV5(namespace: string, name: string): string {
  // Simplified V5 - in production use crypto
  const combined = namespace + name;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(parseInt(hex[16] || '0', 16) & 0x3 | 0x8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`;
}

export function generateUuidV7(): string {
  const now = Date.now();
  const hex = now.toString(16).padStart(12, '0');
  const randomBits = () => Math.floor(Math.random() * 16).toString(16);
  
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-7${randomBits()}${randomBits()}${randomBits()}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${randomBits()}${randomBits()}${randomBits()}-${Array(12).fill(0).map(randomBits).join('')}`;
}

export function generateNanoId(size = 21): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = new Uint8Array(size);
  getCrypto().getRandomValues(bytes);
  return Array.from(bytes, b => alphabet[b & 63]).join('');
}

export function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = () => Math.random().toString(36).slice(2, 8);
  return 'c' + timestamp + randomPart() + randomPart();
}

export function generateUlid(): string {
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const ENCODING_LEN = ENCODING.length;
  
  let time = Date.now();
  let timeChars = '';
  for (let i = 9; i >= 0; i--) {
    timeChars = ENCODING[time % ENCODING_LEN] + timeChars;
    time = Math.floor(time / ENCODING_LEN);
  }
  
  let randomChars = '';
  for (let i = 0; i < 16; i++) {
    randomChars += ENCODING[Math.floor(Math.random() * ENCODING_LEN)];
  }
  
  return timeChars + randomChars;
}

export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return timestamp + random;
}

// ==================== PASSWORD GENERATORS ====================

export interface PasswordOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  excludeAmbiguous?: boolean;
}

export function generatePassword(
  options: PasswordOptions | number = {}
): string {
  // Support both object and number (legacy) signature
  const opts: PasswordOptions = typeof options === 'number' 
    ? { length: options }
    : options;
    
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false,
  } = opts;
  
  let chars = '';
  if (uppercase) chars += excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) chars += excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += excludeAmbiguous ? '23456789' : '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
  
  const bytes = new Uint8Array(length);
  getCrypto().getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export function generatePassphrase(wordCount = 4, separator = '-'): string {
  const words = [
    'apple', 'banana', 'cherry', 'dragon', 'eagle', 'falcon', 'galaxy', 'harbor',
    'island', 'jungle', 'knight', 'lemon', 'mango', 'noble', 'ocean', 'planet',
    'quantum', 'rocket', 'silver', 'thunder', 'ultra', 'violet', 'wonder', 'xenon',
    'yellow', 'zenith', 'anchor', 'bridge', 'castle', 'delta', 'ember', 'frost',
    'garden', 'horizon', 'ivory', 'jasper', 'karma', 'lotus', 'mirror', 'nebula',
    'oracle', 'phoenix', 'quartz', 'rainbow', 'shadow', 'temple', 'unity', 'vertex',
  ];
  
  const bytes = new Uint8Array(wordCount);
  getCrypto().getRandomValues(bytes);
  return Array.from(bytes, b => words[b % words.length]).join(separator);
}

// ==================== HASH GENERATOR ====================

export async function generateHash(
  text: string,
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const encoder = new (globalThis as any).TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await getCrypto().subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== FAKE DATA GENERATORS ====================

export function generateFakeEmail(): string {
  const domains = ['example.com', 'test.org', 'mail.net', 'demo.io'];
  const names = ['john', 'jane', 'alex', 'sam', 'chris', 'taylor', 'jordan', 'casey'];
  const name = names[Math.floor(Math.random() * names.length)];
  const num = Math.floor(Math.random() * 1000);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${name}${num}@${domain}`;
}

export function generateFakeName(): string {
  const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

export function generateFakePhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const subscriber = Math.floor(Math.random() * 9000) + 1000;
  return `+1 (${areaCode}) ${exchange}-${subscriber}`;
}

export function generateFakeAddress(): string {
  const streets = ['Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Main', 'Park', 'Lake', 'Hill', 'River'];
  const types = ['St', 'Ave', 'Rd', 'Blvd', 'Dr', 'Ln'];
  const cities = ['Springfield', 'Madison', 'Franklin', 'Clinton', 'Georgetown', 'Salem', 'Bristol'];
  const states = ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
  
  const num = Math.floor(Math.random() * 9000) + 100;
  const street = streets[Math.floor(Math.random() * streets.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  const zip = Math.floor(Math.random() * 90000) + 10000;
  
  return `${num} ${street} ${type}, ${city}, ${state} ${zip}`;
}

// ==================== RANDOM UTILITIES ====================

export function generateRandomColor(format: 'hex' | 'rgb' | 'hsl' = 'hex'): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  
  switch (format) {
    case 'rgb':
      return `rgb(${r}, ${g}, ${b})`;
    case 'hsl': {
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const l = (max + min) / 2;
      let h = 0, s = 0;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r / 255: h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6; break;
          case g / 255: h = ((b / 255 - r / 255) / d + 2) / 6; break;
          case b / 255: h = ((r / 255 - g / 255) / d + 4) / 6; break;
        }
      }
      return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }
    default:
      return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomString(length: number, charset = 'alphanumeric'): string {
  let chars = '';
  switch (charset) {
    case 'alpha':
      chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      break;
    case 'numeric':
      chars = '0123456789';
      break;
    case 'hex':
      chars = '0123456789abcdef';
      break;
    default:
      chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  }
  
  const bytes = new Uint8Array(length);
  getCrypto().getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export function generateRandomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return new Date(startTime + Math.random() * (endTime - startTime));
}

// ==================== CHECKSUM ====================

export function generateChecksum(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// ==================== SQL GENERATOR ====================

export function generateSqlInsert(tableName: string, data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  
  const columns = Object.keys(data[0]!);
  const values = data.map(row => {
    const vals = columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      return String(val);
    });
    return `(${vals.join(', ')})`;
  });
  
  return `INSERT INTO ${tableName} (${columns.join(', ')})\nVALUES\n${values.join(',\n')};`;
}

// ==================== REGEX GENERATORS ====================

export function generateEmailRegex(): string {
  return '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
}

export function generateUrlRegex(): string {
  return '^https?:\\/\\/[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&\'()*+,;=.]+$';
}

export function generatePhoneRegex(): string {
  return '^\\+?[1-9]\\d{1,14}$';
}

// ==================== TIMESTAMP GENERATOR ====================

export function generateTimestamp(format: 'unix' | 'iso' | 'rfc2822' = 'iso'): string {
  const now = new Date();
  switch (format) {
    case 'unix':
      return Math.floor(now.getTime() / 1000).toString();
    case 'rfc2822':
      return now.toUTCString();
    default:
      return now.toISOString();
  }
}

// ==================== API KEY / JWT ====================

export function generateApiKey(prefix = 'sk', length = 24): string {
  const bytes = new Uint8Array(length);
  getCrypto().getRandomValues(bytes);
  const key = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${key}`;
}

export function generateJwt(
  payload: Record<string, unknown>,
  secret = 'your-secret-key',
  expiresIn = '1h'
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const now = Math.floor(Date.now() / 1000);
  const expMatch = expiresIn.match(/^(\d+)([smhd])$/);
  let exp = now + 3600;
  if (expMatch) {
    const value = parseInt(expMatch[1], 10);
    switch (expMatch[2]) {
      case 's': exp = now + value; break;
      case 'm': exp = now + value * 60; break;
      case 'h': exp = now + value * 3600; break;
      case 'd': exp = now + value * 86400; break;
    }
  }
  
  const fullPayload = { ...payload, iat: now, exp };
  
  const encode = (obj: unknown) => {
    const json = JSON.stringify(obj);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const NodeBuffer = (globalThis as any).Buffer;
    if (typeof NodeBuffer !== 'undefined') {
      return NodeBuffer.from(json).toString('base64url');
    }
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  
  const headerEncoded = encode(header);
  const payloadEncoded = encode(fullPayload);
  const signature = encode({ mock: 'signature', secret: secret.slice(0, 4) + '...' });
  
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

// ==================== LOREM IPSUM ====================

export function generateLoremIpsum(paragraphs = 1, wordsPerParagraph = 50): string {
  const words = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
    'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
    'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
  ];
  
  const result: string[] = [];
  
  for (let p = 0; p < paragraphs; p++) {
    const sentences: string[] = [];
    let wordCount = 0;
    
    while (wordCount < wordsPerParagraph) {
      const sentenceLength = Math.floor(Math.random() * 10) + 5;
      const sentenceWords: string[] = [];
      
      for (let i = 0; i < sentenceLength && wordCount < wordsPerParagraph; i++) {
        let word = words[Math.floor(Math.random() * words.length)];
        if (i === 0) word = word.charAt(0).toUpperCase() + word.slice(1);
        sentenceWords.push(word);
        wordCount++;
      }
      
      sentences.push(sentenceWords.join(' ') + '.');
    }
    
    result.push(sentences.join(' '));
  }
  
  return result.join('\n\n');
}

// ==================== USERNAME GENERATOR ====================

export function generateUsername(style = 'adjective-noun'): string {
  const adjectives = ['swift', 'bright', 'silent', 'cosmic', 'fierce', 'golden', 'mystic', 'noble', 'rapid', 'shadow'];
  const nouns = ['wolf', 'hawk', 'tiger', 'dragon', 'phoenix', 'falcon', 'panther', 'fox', 'eagle', 'raven'];
  const names = ['alex', 'jordan', 'taylor', 'casey', 'morgan', 'riley', 'skyler', 'avery', 'quinn', 'blake'];
  
  if (style === 'name-number') {
    const name = names[Math.floor(Math.random() * names.length)];
    const num = Math.floor(Math.random() * 9000) + 1000;
    return `${name}${num}`;
  }
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}_${noun}`;
}

// ==================== QUOTE GENERATOR ====================

export function generateQuote(): string {
  const quotes = [
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
    { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
    { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
    { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
    { text: 'The only thing we have to fear is fear itself.', author: 'Franklin D. Roosevelt' },
    { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
    { text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon' },
  ];
  
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  return `"${quote.text}"\n— ${quote.author}`;
}

// ==================== RANDOM NUMBERS ARRAY ====================

export function generateRandomNumbers(min: number, max: number, count: number, unique = false): string {
  if (unique && (max - min + 1) < count) {
    throw new Error('Cannot generate that many unique numbers in the given range');
  }
  
  const result: number[] = [];
  const used = new Set<number>();
  
  while (result.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!unique || !used.has(num)) {
      result.push(num);
      used.add(num);
    }
  }
  
  return result.join(', ');
}

// ==================== QR CODE DATA ====================

export function generateQrCode(text: string, size = 200): string {
  // For actual QR code, use a library. This returns the text that would be encoded.
  return JSON.stringify({ text, size, type: 'qr-code-data' });
}

// ==================== SIGNATURE GENERATOR ====================

export function generateSignature(name: string, style = 'formal'): string {
  switch (style) {
    case 'casual':
      return `Thanks,\n${name}`;
    case 'minimal':
      return `- ${name}`;
    default:
      return `Best regards,\n\n${name}`;
  }
}

// ==================== COLOR PALETTE ====================

export function generateColorPalette(baseColor: string, count = 5): string[] {
  // Parse hex color
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Convert to HSL
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r / 255: h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) * 60; break;
      case g / 255: h = ((b / 255 - r / 255) / d + 2) * 60; break;
      case b / 255: h = ((r / 255 - g / 255) / d + 4) * 60; break;
    }
  }
  
  const hslToHex = (h: number, s: number, l: number): string => {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r1 = 0, g1 = 0, b1 = 0;
    if (h < 60) { r1 = c; g1 = x; }
    else if (h < 120) { r1 = x; g1 = c; }
    else if (h < 180) { g1 = c; b1 = x; }
    else if (h < 240) { g1 = x; b1 = c; }
    else if (h < 300) { r1 = x; b1 = c; }
    else { r1 = c; b1 = x; }
    
    const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return '#' + toHex(r1) + toHex(g1) + toHex(b1);
  };
  
  // Generate palette with count colors using distributed hue
  const palette: string[] = [baseColor];
  const step = 360 / count;
  
  for (let i = 1; i < count; i++) {
    palette.push(hslToHex(h + (step * i), s, l));
  }
  
  return palette;
}

// ==================== PLACEHOLDER IMAGE ====================

export function generatePlaceholderImage(width: number, height: number, text?: string): string {
  const displayText = text || `${width}x${height}`;
  return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(displayText)}`;
}

// ==================== FAVICON HTML ====================

export function generateFaviconHtml(iconPath: string, sizes: number[] = [16, 32, 180]): string {
  const tags: string[] = [];
  
  for (const size of sizes) {
    if (size === 180) {
      tags.push(`<link rel="apple-touch-icon" sizes="180x180" href="${iconPath}">`);
    } else {
      tags.push(`<link rel="icon" type="image/png" sizes="${size}x${size}" href="${iconPath}">`);
    }
  }
  
  return tags.join('\n');
}

// ==================== VCARD QR GENERATOR ====================

export interface VCardData {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  organization?: string;
  title?: string;
  url?: string;
  address?: string;
}

export function generateVCardQr(data: VCardData): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.firstName}${data.lastName ? ' ' + data.lastName : ''}`,
    `N:${data.lastName || ''};${data.firstName};;;`,
  ];
  
  if (data.phone) lines.push(`TEL:${data.phone}`);
  if (data.email) lines.push(`EMAIL:${data.email}`);
  if (data.organization) lines.push(`ORG:${data.organization}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.url) lines.push(`URL:${data.url}`);
  if (data.address) lines.push(`ADR:;;${data.address};;;;`);
  
  lines.push('END:VCARD');
  
  const vcard = lines.join('\n');
  // Return QR code URL for the vCard data
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(vcard)}`;
}

// ==================== EMOJI SEARCH ====================

const emojiData: Record<string, string> = {
  smile: '😊', laugh: '😂', heart: '❤️', fire: '🔥', star: '⭐',
  thumbsup: '👍', ok: '👌', clap: '👏', wave: '👋', pray: '🙏',
  sun: '☀️', moon: '🌙', cloud: '☁️', rain: '🌧️', snow: '❄️',
  check: '✅', cross: '❌', warning: '⚠️', info: 'ℹ️', question: '❓',
  lock: '🔒', key: '🔑', gear: '⚙️', tool: '🔧', plug: '🔌',
  rocket: '🚀', plane: '✈️', car: '🚗', train: '🚂', ship: '🚢',
  coffee: '☕', pizza: '🍕', burger: '🍔', apple: '🍎', banana: '🍌',
  cat: '🐱', dog: '🐕', bird: '🐦', fish: '🐟', butterfly: '🦋',
  music: '🎵', video: '🎬', camera: '📷', phone: '📱', laptop: '💻',
  book: '📚', pen: '✏️', folder: '📁', mail: '📧', calendar: '📅',
};

export function searchEmoji(query: string): { name: string; emoji: string }[] {
  const q = query.toLowerCase();
  return Object.entries(emojiData)
    .filter(([name]) => name.includes(q))
    .map(([name, emoji]) => ({ name, emoji }))
    .slice(0, 10);
}

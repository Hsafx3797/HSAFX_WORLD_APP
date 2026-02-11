/**
 * Generators Web Compatibility Layer
 * 
 * Additional generators matching web app API
 */

// Get crypto for cross-environment support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getCrypto = (): Crypto => (globalThis as any).crypto;

// ==================== UUID VARIANTS ====================

export function generateUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateUuidV7(): string {
  const now = Date.now();
  const hex = now.toString(16).padStart(12, '0');
  const randomBits = () => Math.floor(Math.random() * 16).toString(16);
  
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-7${randomBits()}${randomBits()}${randomBits()}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${randomBits()}${randomBits()}${randomBits()}-${Array(12).fill(0).map(randomBits).join('')}`;
}

export function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = () => Math.random().toString(36).slice(2, 8);
  return 'c' + timestamp + randomPart() + randomPart();
}

export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return timestamp + random;
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
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
}

export function generateRandomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return new Date(startTime + Math.random() * (endTime - startTime));
}

// ==================== HASH GENERATOR ====================

export async function generateHash(text: string, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const encoder = new (globalThis as any).TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await getCrypto().subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
  
  const firstRow = data[0]!;
  const columns = Object.keys(firstRow);
  const values = data.map((row) => {
    const vals = columns.map((col) => {
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

// ==================== SLUG GENERATOR ====================

export function generateSlugFromText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ==================== COLOR GENERATOR ====================

export function generateRandomColorMultiFormat(format: 'hex' | 'rgb' | 'hsl' = 'hex'): string {
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

// ==================== QR CODE DATA ====================

export function generateQrCodeData(text: string, size = 200): { text: string; size: number } {
  return { text, size };
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
  
  const paragraphsArr: string[] = [];
  
  for (let p = 0; p < paragraphs; p++) {
    const sentences: string[] = [];
    let wordCount = 0;
    
    while (wordCount < wordsPerParagraph) {
      const sentenceLength = Math.floor(Math.random() * 10) + 5;
      const sentenceWords: string[] = [];
      
      for (let i = 0; i < sentenceLength && wordCount < wordsPerParagraph; i++) {
        let word = words[Math.floor(Math.random() * words.length)];
        if (i === 0) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        sentenceWords.push(word);
        wordCount++;
      }
      
      sentences.push(sentenceWords.join(' ') + '.');
    }
    
    paragraphsArr.push(sentences.join(' '));
  }
  
  return paragraphsArr.join('\n\n');
}

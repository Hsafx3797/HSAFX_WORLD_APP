/**
 * Generators Library
 * Random data generation utilities
 */

// ==================== BASIC GENERATORS ====================

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateNanoId(size: number = 21): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let id = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < size; i++) {
      id += alphabet[bytes[i] % alphabet.length];
    }
  } else {
    for (let i = 0; i < size; i++) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  
  return id;
}

export function generateSlug(length: number = 8): string {
  const words = [
    'swift', 'bold', 'keen', 'bright', 'calm', 'cool', 'epic', 'fast',
    'glow', 'haze', 'jade', 'kind', 'leaf', 'mint', 'nova', 'opal',
    'peak', 'quartz', 'rose', 'sage', 'tide', 'unity', 'vibe', 'wave',
    'zero', 'alpha', 'beta', 'cyber', 'delta', 'echo', 'flux', 'grid',
  ];
  
  const selected: string[] = [];
  for (let i = 0; i < Math.ceil(length / 5); i++) {
    selected.push(words[Math.floor(Math.random() * words.length)]);
  }
  
  return selected.join('-').slice(0, length);
}

// ==================== PASSWORD GENERATOR ====================

export interface PasswordOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeAmbiguous?: boolean;
  excludeChars?: string;
  requireEveryType?: boolean;
}

export function generatePassword(options: PasswordOptions = {}): string {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeAmbiguous = false,
    excludeChars = '',
    requireEveryType = true,
  } = options;
  
  let uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowercase = 'abcdefghijklmnopqrstuvwxyz';
  let numbers = '0123456789';
  let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (excludeAmbiguous) {
    uppercase = uppercase.replace(/[IO]/g, '');
    lowercase = lowercase.replace(/[l]/g, '');
    numbers = numbers.replace(/[01]/g, '');
  }
  
  for (const char of excludeChars) {
    uppercase = uppercase.replace(char, '');
    lowercase = lowercase.replace(char, '');
    numbers = numbers.replace(char, '');
    symbols = symbols.replace(char, '');
  }
  
  let chars = '';
  const required: string[] = [];
  
  if (includeUppercase) {
    chars += uppercase;
    if (requireEveryType && uppercase.length > 0) {
      required.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
    }
  }
  if (includeLowercase) {
    chars += lowercase;
    if (requireEveryType && lowercase.length > 0) {
      required.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
    }
  }
  if (includeNumbers) {
    chars += numbers;
    if (requireEveryType && numbers.length > 0) {
      required.push(numbers[Math.floor(Math.random() * numbers.length)]);
    }
  }
  if (includeSymbols) {
    chars += symbols;
    if (requireEveryType && symbols.length > 0) {
      required.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }
  }
  
  if (chars.length === 0) {
    throw new Error('No character types selected');
  }
  
  let password = '';
  const remainingLength = length - required.length;
  
  for (let i = 0; i < remainingLength; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Insert required characters at random positions
  for (const char of required) {
    const pos = Math.floor(Math.random() * (password.length + 1));
    password = password.slice(0, pos) + char + password.slice(pos);
  }
  
  return password;
}

export function generatePassphrase(wordCount: number = 4, separator: string = '-'): string {
  const wordList = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'academy', 'access', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire',
    'across', 'action', 'actor', 'actual', 'adapt', 'add', 'addict', 'address',
    'adjust', 'admit', 'adult', 'advance', 'advice', 'affair', 'afford', 'afraid',
    'again', 'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle',
    'alarm', 'album', 'alcohol', 'alert', 'alien', 'allow', 'almost', 'alone',
    'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
    'amount', 'anchor', 'ancient', 'anger', 'angle', 'animal', 'annual', 'another',
    'answer', 'antenna', 'antique', 'anxiety', 'apart', 'apology', 'appear', 'apple',
    'approve', 'april', 'arch', 'arctic', 'area', 'arena', 'argue', 'armor',
    'army', 'around', 'arrive', 'arrow', 'artist', 'artwork', 'aspect', 'assault',
    'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend',
    'attract', 'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn',
    'average', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward',
    'badge', 'balance', 'bamboo', 'banana', 'banner', 'barrel', 'basket', 'battery',
    'beach', 'beauty', 'because', 'become', 'bedroom', 'before', 'begin', 'believe',
    'below', 'bench', 'benefit', 'best', 'better', 'between', 'beyond', 'bicycle',
    'blank', 'blast', 'blend', 'bless', 'blind', 'block', 'blood', 'blossom',
    'blue', 'board', 'boat', 'body', 'bomb', 'bone', 'bonus', 'book',
    'border', 'boring', 'borrow', 'bottle', 'bottom', 'bounce', 'brain', 'brand',
    'brave', 'bread', 'break', 'breeze', 'brick', 'bridge', 'brief', 'bright',
    'bring', 'broken', 'brother', 'brown', 'brush', 'bubble', 'budget', 'build',
    'bullet', 'bundle', 'burden', 'burger', 'burst', 'business', 'butter', 'buyer',
    'cabin', 'cable', 'cage', 'cake', 'calendar', 'camera', 'camp', 'canal',
    'cancel', 'candle', 'candy', 'capable', 'capital', 'captain', 'carbon', 'card',
    'cargo', 'carpet', 'carry', 'cart', 'case', 'cash', 'castle', 'casual',
    'catalog', 'catch', 'category', 'cattle', 'caught', 'cause', 'ceiling', 'celery',
    'cement', 'center', 'century', 'cereal', 'certain', 'chair', 'chalk', 'champion',
  ];
  
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(wordList[Math.floor(Math.random() * wordList.length)]);
  }
  
  return words.join(separator);
}

// ==================== DATA GENERATORS ====================

export interface PersonData {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  birthDate: string;
  ssn: string;
}

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Ahmed', 'Fatima', 'Mohammed', 'Aisha',
  'Ali', 'Maryam', 'Omar', 'Noor', 'Hassan', 'Sara', 'Yusuf', 'Layla',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Al-Said', 'Al-Hassan', 'Al-Ahmad', 'Al-Ali', 'Khan', 'Ahmed', 'Ibrahim', 'Hussein',
];

const CITIES = [
  { city: 'New York', state: 'NY', zip: '10001' },
  { city: 'Los Angeles', state: 'CA', zip: '90001' },
  { city: 'Chicago', state: 'IL', zip: '60601' },
  { city: 'Houston', state: 'TX', zip: '77001' },
  { city: 'Phoenix', state: 'AZ', zip: '85001' },
  { city: 'Philadelphia', state: 'PA', zip: '19101' },
  { city: 'San Antonio', state: 'TX', zip: '78201' },
  { city: 'San Diego', state: 'CA', zip: '92101' },
  { city: 'Dallas', state: 'TX', zip: '75201' },
  { city: 'San Jose', state: 'CA', zip: '95101' },
];

const STREET_NAMES = [
  'Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Washington', 'Park',
  'Lake', 'Hill', 'Forest', 'River', 'Valley', 'Spring', 'Sunset', 'Highland',
];

const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Rd', 'Way', 'Ct'];

export function generatePerson(): PersonData {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const cityData = CITIES[Math.floor(Math.random() * CITIES.length)];
  
  const streetNum = Math.floor(Math.random() * 9999) + 1;
  const streetName = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
  const streetType = STREET_TYPES[Math.floor(Math.random() * STREET_TYPES.length)];
  
  const year = Math.floor(Math.random() * 50) + 1950;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    address: {
      street: `${streetNum} ${streetName} ${streetType}`,
      city: cityData.city,
      state: cityData.state,
      zip: cityData.zip,
      country: 'USA',
    },
    birthDate: `${year}-${month}-${day}`,
    ssn: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`,
  };
}

export interface CompanyData {
  name: string;
  suffix: string;
  fullName: string;
  industry: string;
  catchPhrase: string;
  website: string;
  email: string;
  phone: string;
}

const COMPANY_PREFIXES = [
  'Global', 'United', 'First', 'National', 'Pacific', 'Atlantic', 'Western', 'Eastern',
  'Prime', 'Elite', 'Next', 'Future', 'Digital', 'Tech', 'Smart', 'Bright',
];

const COMPANY_NAMES = [
  'Systems', 'Solutions', 'Technologies', 'Industries', 'Dynamics', 'Networks', 'Labs', 'Works',
  'Group', 'Partners', 'Associates', 'Enterprises', 'Holdings', 'Capital', 'Ventures', 'Corp',
];

const COMPANY_SUFFIXES = ['Inc', 'LLC', 'Corp', 'Ltd', 'Co', 'Group', 'Holdings'];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Energy',
  'Telecommunications', 'Transportation', 'Construction', 'Education', 'Media', 'Consulting',
];

const CATCH_PHRASES = [
  'Empowering innovation', 'Building tomorrow', 'Connecting possibilities', 'Driving excellence',
  'Creating value', 'Transforming industries', 'Enabling growth', 'Inspiring change',
];

export function generateCompany(): CompanyData {
  const prefix = COMPANY_PREFIXES[Math.floor(Math.random() * COMPANY_PREFIXES.length)];
  const name = COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)];
  const suffix = COMPANY_SUFFIXES[Math.floor(Math.random() * COMPANY_SUFFIXES.length)];
  
  const fullName = `${prefix} ${name}`;
  const domain = fullName.toLowerCase().replace(/\s+/g, '');
  
  return {
    name: fullName,
    suffix,
    fullName: `${fullName}, ${suffix}`,
    industry: INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)],
    catchPhrase: CATCH_PHRASES[Math.floor(Math.random() * CATCH_PHRASES.length)],
    website: `https://www.${domain}.com`,
    email: `info@${domain}.com`,
    phone: `1-800-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
  };
}

// ==================== CREDIT CARD GENERATOR ====================

export interface CreditCardData {
  number: string;
  type: string;
  expiryMonth: string;
  expiryYear: string;
  expiry: string;
  cvv: string;
  holder: string;
}

export function generateCreditCard(type?: 'visa' | 'mastercard' | 'amex' | 'discover'): CreditCardData {
  const types = {
    visa: { prefix: '4', length: 16, cvvLength: 3 },
    mastercard: { prefix: '5' + (Math.floor(Math.random() * 5) + 1), length: 16, cvvLength: 3 },
    amex: { prefix: '3' + (Math.random() < 0.5 ? '4' : '7'), length: 15, cvvLength: 4 },
    discover: { prefix: '6011', length: 16, cvvLength: 3 },
  };
  
  const selectedType = type || (['visa', 'mastercard', 'amex', 'discover'] as const)[Math.floor(Math.random() * 4)];
  const config = types[selectedType];
  
  // Generate number (without check digit)
  let number = config.prefix;
  while (number.length < config.length - 1) {
    number += Math.floor(Math.random() * 10);
  }
  
  // Calculate check digit (Luhn algorithm)
  let sum = 0;
  for (let i = 0; i < number.length; i++) {
    let digit = parseInt(number[number.length - 1 - i], 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  number += checkDigit;
  
  // Generate expiry (1-5 years from now)
  const now = new Date();
  const futureYear = now.getFullYear() + Math.floor(Math.random() * 5) + 1;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const year = String(futureYear).slice(-2);
  
  // Generate CVV
  let cvv = '';
  for (let i = 0; i < config.cvvLength; i++) {
    cvv += Math.floor(Math.random() * 10);
  }
  
  // Generate holder name
  const person = generatePerson();
  
  return {
    number,
    type: selectedType.charAt(0).toUpperCase() + selectedType.slice(1),
    expiryMonth: month,
    expiryYear: year,
    expiry: `${month}/${year}`,
    cvv,
    holder: person.fullName.toUpperCase(),
  };
}

// ==================== HASH/CHECKSUM GENERATORS ====================

export async function generateMD5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => {
    // MD5 not supported in WebCrypto, use simple hash
    return simpleHash(input);
  });
  
  if (hashBuffer instanceof ArrayBuffer) {
    return bufferToHex(hashBuffer);
  }
  
  return hashBuffer as string;
}

export async function generateSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

export async function generateSHA512(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return bufferToHex(hashBuffer);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ==================== QR CODE DATA GENERATOR ====================

export interface QRCodeData {
  wifi: (ssid: string, password: string, encryption?: 'WPA' | 'WEP' | 'nopass') => string;
  vcard: (data: { firstName: string; lastName: string; email?: string; phone?: string; organization?: string; title?: string; website?: string }) => string;
  sms: (phone: string, message?: string) => string;
  email: (to: string, subject?: string, body?: string) => string;
  phone: (number: string) => string;
  geo: (lat: number, lng: number) => string;
  url: (url: string) => string;
  text: (text: string) => string;
}

export const qrCodeData: QRCodeData = {
  wifi: (ssid, password, encryption = 'WPA') => {
    return `WIFI:T:${encryption};S:${ssid};P:${password};;`;
  },
  
  vcard: (data) => {
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    vcard += `N:${data.lastName};${data.firstName};;;\n`;
    vcard += `FN:${data.firstName} ${data.lastName}\n`;
    if (data.email) vcard += `EMAIL:${data.email}\n`;
    if (data.phone) vcard += `TEL:${data.phone}\n`;
    if (data.organization) vcard += `ORG:${data.organization}\n`;
    if (data.title) vcard += `TITLE:${data.title}\n`;
    if (data.website) vcard += `URL:${data.website}\n`;
    vcard += 'END:VCARD';
    return vcard;
  },
  
  sms: (phone, message) => {
    return message ? `SMSTO:${phone}:${message}` : `SMSTO:${phone}`;
  },
  
  email: (to, subject, body) => {
    let mailto = `mailto:${to}`;
    const params: string[] = [];
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);
    if (params.length > 0) mailto += '?' + params.join('&');
    return mailto;
  },
  
  phone: (number) => `tel:${number}`,
  
  geo: (lat, lng) => `geo:${lat},${lng}`,
  
  url: (url) => url,
  
  text: (text) => text,
};

// ==================== COLOR GENERATORS ====================

export function generateRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

export function generateColorPalette(baseColor: string, count: number = 5): string[] {
  const palette: string[] = [baseColor];
  
  // Parse base color
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Generate variations
  for (let i = 1; i < count; i++) {
    const factor = 0.2 * i;
    const newR = Math.min(255, Math.round(r + (255 - r) * factor));
    const newG = Math.min(255, Math.round(g + (255 - g) * factor));
    const newB = Math.min(255, Math.round(b + (255 - b) * factor));
    
    palette.push(
      '#' + 
      newR.toString(16).padStart(2, '0') +
      newG.toString(16).padStart(2, '0') +
      newB.toString(16).padStart(2, '0')
    );
  }
  
  return palette;
}

export function generateGradient(color1: string, color2: string, steps: number = 5): string[] {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.slice(0, 2), 16);
  const g1 = parseInt(hex1.slice(2, 4), 16);
  const b1 = parseInt(hex1.slice(4, 6), 16);
  
  const r2 = parseInt(hex2.slice(0, 2), 16);
  const g2 = parseInt(hex2.slice(2, 4), 16);
  const b2 = parseInt(hex2.slice(4, 6), 16);
  
  const gradient: string[] = [];
  
  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    gradient.push(
      '#' +
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0')
    );
  }
  
  return gradient;
}

// ==================== RE-EXPORTS ====================
export * from './seo';
export * from './css';

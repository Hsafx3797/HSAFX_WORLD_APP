/**
 * Formatters Library
 * Text and data formatting utilities
 */

// ==================== STRING FORMATTERS ====================

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  const minorWords = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor',
    'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'is', 'it',
  ]);
  
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0 || !minorWords.has(word)) {
        return capitalize(word);
      }
      return word;
    })
    .join(' ');
}

export function sentenceCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, (match) => match.toUpperCase());
}

export function camelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

export function pascalCase(str: string): string {
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s\-]+/g, '_')
    .toLowerCase();
}

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function constantCase(str: string): string {
  return snakeCase(str).toUpperCase();
}

export function dotCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1.$2')
    .replace(/[\s_\-]+/g, '.')
    .toLowerCase();
}

export function pathCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1/$2')
    .replace(/[\s_\-]+/g, '/')
    .toLowerCase();
}

export function swapCase(str: string): string {
  return str
    .split('')
    .map(char => {
      if (char === char.toUpperCase()) {
        return char.toLowerCase();
      }
      return char.toUpperCase();
    })
    .join('');
}

// ==================== NUMBER FORMATTERS ====================

export function formatNumber(
  value: number,
  options: {
    decimals?: number;
    thousandsSeparator?: string;
    decimalSeparator?: string;
    prefix?: string;
    suffix?: string;
  } = {}
): string {
  const {
    decimals = 2,
    thousandsSeparator = ',',
    decimalSeparator = '.',
    prefix = '',
    suffix = '',
  } = options;
  
  const [intPart, decPart] = value.toFixed(decimals).split('.');
  
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  
  let result = formattedInt;
  if (decimals > 0 && decPart) {
    result += decimalSeparator + decPart;
  }
  
  return prefix + result + suffix;
}

export function formatCurrency(
  value: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
}

export function formatPercentage(
  value: number,
  decimals: number = 2
): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export function formatBytes(
  bytes: number,
  decimals: number = 2,
  useBinary: boolean = true
): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = useBinary ? 1024 : 1000;
  const units = useBinary
    ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  
  return `${value.toFixed(decimals)} ${units[i]}`;
}

export function formatDuration(
  seconds: number,
  options: {
    format?: 'short' | 'long' | 'colon';
    includeMilliseconds?: boolean;
  } = {}
): string {
  const { format = 'colon', includeMilliseconds = false } = options;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  
  if (format === 'colon') {
    let result = '';
    if (hours > 0) {
      result += `${hours}:${minutes.toString().padStart(2, '0')}:`;
    } else {
      result += `${minutes}:`;
    }
    result += secs.toString().padStart(2, '0');
    if (includeMilliseconds) {
      result += `.${ms.toString().padStart(3, '0')}`;
    }
    return result;
  }
  
  const parts: string[] = [];
  
  if (format === 'short') {
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    if (includeMilliseconds && ms > 0) parts.push(`${ms}ms`);
  } else {
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
    if (includeMilliseconds && ms > 0) parts.push(`${ms} millisecond${ms !== 1 ? 's' : ''}`);
  }
  
  return parts.join(' ');
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  const absDiff = Math.abs(diff);
  const isPast = diff > 0;
  
  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  let value: number;
  let unit: string;
  
  if (seconds < 60) {
    value = seconds;
    unit = 'second';
  } else if (minutes < 60) {
    value = minutes;
    unit = 'minute';
  } else if (hours < 24) {
    value = hours;
    unit = 'hour';
  } else if (days < 7) {
    value = days;
    unit = 'day';
  } else if (weeks < 4) {
    value = weeks;
    unit = 'week';
  } else if (months < 12) {
    value = months;
    unit = 'month';
  } else {
    value = years;
    unit = 'year';
  }
  
  const plural = value !== 1 ? 's' : '';
  const direction = isPast ? 'ago' : 'from now';
  
  return `${value} ${unit}${plural} ${direction}`;
}

// ==================== PHONE NUMBER FORMATTER ====================

export function formatPhoneNumber(
  phone: string,
  format: 'national' | 'international' | 'e164' = 'national',
  countryCode: string = 'US'
): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  const formats: Record<string, Record<string, (d: string) => string>> = {
    US: {
      national: (d) => {
        if (d.length === 10) {
          return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
        }
        if (d.length === 11 && d[0] === '1') {
          return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
        }
        return d;
      },
      international: (d) => {
        if (d.length === 10) {
          return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
        }
        return d;
      },
      e164: (d) => {
        if (d.length === 10) return `+1${d}`;
        if (d.length === 11 && d[0] === '1') return `+${d}`;
        return d;
      },
    },
    UK: {
      national: (d) => {
        if (d.length === 11 && d[0] === '0') {
          return `${d.slice(0, 5)} ${d.slice(5)}`;
        }
        return d;
      },
      international: (d) => {
        if (d.length === 11 && d[0] === '0') {
          return `+44 ${d.slice(1, 5)} ${d.slice(5)}`;
        }
        return d;
      },
      e164: (d) => {
        if (d.length === 11 && d[0] === '0') {
          return `+44${d.slice(1)}`;
        }
        return d;
      },
    },
    SA: {
      national: (d) => {
        if (d.length === 10 && d[0] === '0') {
          return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
        }
        return d;
      },
      international: (d) => {
        if (d.length === 10 && d[0] === '0') {
          return `+966 ${d.slice(1, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
        }
        return d;
      },
      e164: (d) => {
        if (d.length === 10 && d[0] === '0') {
          return `+966${d.slice(1)}`;
        }
        return d;
      },
    },
  };
  
  const formatter = formats[countryCode]?.[format];
  return formatter ? formatter(digits) : digits;
}

// ==================== CREDIT CARD FORMATTER ====================

export function formatCreditCard(number: string, separator: string = ' '): string {
  const digits = number.replace(/\D/g, '');
  
  // Detect card type for proper formatting
  if (digits.startsWith('34') || digits.startsWith('37')) {
    // American Express: 4-6-5
    return [
      digits.slice(0, 4),
      digits.slice(4, 10),
      digits.slice(10, 15),
    ].filter(Boolean).join(separator);
  }
  
  // Default: 4-4-4-4
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }
  
  return groups.join(separator);
}

export function maskCreditCard(number: string, visibleDigits: number = 4): string {
  const digits = number.replace(/\D/g, '');
  const masked = '*'.repeat(digits.length - visibleDigits) + digits.slice(-visibleDigits);
  return formatCreditCard(masked);
}

// ==================== ADDRESS FORMATTER ====================

export interface Address {
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export function formatAddress(
  address: Address,
  format: 'single-line' | 'multi-line' = 'multi-line'
): string {
  const parts: string[] = [];
  
  if (address.street) parts.push(address.street);
  if (address.street2) parts.push(address.street2);
  
  const cityStateZip: string[] = [];
  if (address.city) cityStateZip.push(address.city);
  if (address.state) {
    if (address.city) {
      cityStateZip[cityStateZip.length - 1] += ',';
    }
    cityStateZip.push(address.state);
  }
  if (address.zip) cityStateZip.push(address.zip);
  
  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(' '));
  }
  
  if (address.country) parts.push(address.country);
  
  return format === 'single-line' ? parts.join(', ') : parts.join('\n');
}

// ==================== NAME FORMATTER ====================

export interface PersonName {
  prefix?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
}

export function formatName(
  name: PersonName,
  format: 'full' | 'formal' | 'initials' | 'last-first' = 'full'
): string {
  switch (format) {
    case 'full': {
      const parts = [
        name.prefix,
        name.firstName,
        name.middleName,
        name.lastName,
        name.suffix,
      ].filter(Boolean);
      return parts.join(' ');
    }
    
    case 'formal': {
      const parts = [
        name.prefix,
        name.firstName?.[0] ? `${name.firstName[0]}.` : null,
        name.middleName?.[0] ? `${name.middleName[0]}.` : null,
        name.lastName,
        name.suffix,
      ].filter(Boolean);
      return parts.join(' ');
    }
    
    case 'initials': {
      const initials = [
        name.firstName?.[0],
        name.middleName?.[0],
        name.lastName?.[0],
      ].filter(Boolean);
      return initials.join('').toUpperCase();
    }
    
    case 'last-first': {
      if (!name.lastName) {
        return name.firstName || '';
      }
      if (!name.firstName) {
        return name.lastName;
      }
      return `${name.lastName}, ${name.firstName}`;
    }
    
    default:
      return '';
  }
}

// ==================== LIST FORMATTERS ====================

export function formatList(
  items: string[],
  options: {
    conjunction?: 'and' | 'or';
    serial?: boolean;
    limit?: number;
    moreText?: string;
  } = {}
): string {
  const {
    conjunction = 'and',
    serial = true,
    limit,
    moreText = 'more',
  } = options;
  
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  
  let displayItems = items;
  let remaining = 0;
  
  if (limit && items.length > limit) {
    displayItems = items.slice(0, limit);
    remaining = items.length - limit;
  }
  
  if (remaining > 0) {
    displayItems = [...displayItems, `${remaining} ${moreText}`];
  }
  
  if (displayItems.length === 2) {
    return `${displayItems[0]} ${conjunction} ${displayItems[1]}`;
  }
  
  const lastItem = displayItems.pop();
  const separator = serial ? `, ${conjunction} ` : ` ${conjunction} `;
  
  return `${displayItems.join(', ')}${separator}${lastItem}`;
}

// ==================== TRUNCATION ====================

export function truncate(
  str: string,
  maxLength: number,
  options: {
    ellipsis?: string;
    wordBoundary?: boolean;
  } = {}
): string {
  const { ellipsis = '...', wordBoundary = false } = options;
  
  if (str.length <= maxLength) return str;
  
  const truncateAt = maxLength - ellipsis.length;
  
  if (wordBoundary) {
    const lastSpace = str.lastIndexOf(' ', truncateAt);
    if (lastSpace > 0) {
      return str.slice(0, lastSpace) + ellipsis;
    }
  }
  
  return str.slice(0, truncateAt) + ellipsis;
}

export function truncateMiddle(
  str: string,
  maxLength: number,
  separator: string = '...'
): string {
  if (str.length <= maxLength) return str;
  
  const availableLength = maxLength - separator.length;
  const startLength = Math.ceil(availableLength / 2);
  const endLength = Math.floor(availableLength / 2);
  
  return str.slice(0, startLength) + separator + str.slice(-endLength);
}

// ==================== SLUG FORMATTER ====================

export function slugify(
  str: string,
  options: {
    separator?: string;
    lowercase?: boolean;
    strict?: boolean;
  } = {}
): string {
  const { separator = '-', lowercase = true, strict = true } = options;
  
  let slug = str
    // Normalize unicode characters
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces and underscores with separator
    .replace(/[\s_]+/g, separator);
  
  if (strict) {
    // Remove everything except alphanumeric and separator
    slug = slug.replace(new RegExp(`[^a-zA-Z0-9${separator}]`, 'g'), '');
  }
  
  // Remove consecutive separators
  slug = slug.replace(new RegExp(`${separator}+`, 'g'), separator);
  
  // Remove leading/trailing separators
  slug = slug.replace(new RegExp(`^${separator}|${separator}$`, 'g'), '');
  
  if (lowercase) {
    slug = slug.toLowerCase();
  }
  
  return slug;
}

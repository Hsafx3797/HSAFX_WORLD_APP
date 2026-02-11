/**
 * Web Validators - Exact copy from apps/web/src/lib/tools/validators.ts
 * This is the canonical source for all validator implementations used by the web app.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

// ==================== STRING VALIDATORS ====================

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid = emailRegex.test(email);
  return {
    valid,
    error: valid ? undefined : 'Invalid email format',
    details: valid ? {
      localPart: email.split('@')[0],
      domain: email.split('@')[1],
    } : undefined,
  };
}

export function validateUrl(url: string): ValidationResult {
  try {
    const parsed = new URL(url);
    return {
      valid: true,
      details: {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        pathname: parsed.pathname,
        search: parsed.search || undefined,
        hash: parsed.hash || undefined,
      },
    };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function validateUuid(uuid: string): ValidationResult {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const valid = uuidRegex.test(uuid);
  
  let version: number | undefined;
  if (valid) {
    version = parseInt(uuid.charAt(14), 16);
  }
  
  return {
    valid,
    error: valid ? undefined : 'Invalid UUID format',
    details: valid ? { version } : undefined,
  };
}

export function validateIpAddress(ip: string): ValidationResult {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^::1$|^([0-9a-fA-F]{1,4}:)*:([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
  
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.').map(Number);
    const valid = parts.every((p) => p >= 0 && p <= 255);
    return {
      valid,
      error: valid ? undefined : 'Invalid IPv4 address',
      details: valid ? { type: 'IPv4', octets: parts } : undefined,
    };
  }
  
  if (ipv6Regex.test(ip)) {
    return {
      valid: true,
      details: { type: 'IPv6' },
    };
  }
  
  return { valid: false, error: 'Invalid IP address format' };
}

export function validateCreditCard(cardNumber: string): ValidationResult {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return { valid: false, error: 'Invalid card number length' };
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  const valid = sum % 10 === 0;
  
  // Detect card type
  let cardType: string | undefined;
  if (/^4/.test(cleaned)) cardType = 'Visa';
  else if (/^5[1-5]/.test(cleaned)) cardType = 'Mastercard';
  else if (/^3[47]/.test(cleaned)) cardType = 'American Express';
  else if (/^6(?:011|5)/.test(cleaned)) cardType = 'Discover';
  
  return {
    valid,
    error: valid ? undefined : 'Invalid credit card number',
    details: valid ? { cardType, maskedNumber: `****${cleaned.slice(-4)}` } : undefined,
  };
}

export function validatePhoneNumber(phone: string): ValidationResult {
  // Remove common formatting chars
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // E.164 format: optional + followed by 1-15 digits
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  const valid = phoneRegex.test(cleaned);
  
  return {
    valid,
    error: valid ? undefined : 'Invalid phone number format',
    details: valid ? {
      hasCountryCode: cleaned.startsWith('+'),
      length: cleaned.replace('+', '').length,
    } : undefined,
  };
}

export function validateMacAddress(mac: string): ValidationResult {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{4}\.){2}([0-9A-Fa-f]{4})$/;
  const valid = macRegex.test(mac);
  
  return {
    valid,
    error: valid ? undefined : 'Invalid MAC address format',
    details: valid ? {
      normalized: mac.replace(/[:\-\.]/g, ':').toUpperCase(),
    } : undefined,
  };
}

// ==================== ISBN VALIDATOR ====================

export function validateIsbn(isbn: string): ValidationResult {
  const cleaned = isbn.replace(/[\-\s]/g, '');
  
  if (cleaned.length === 10) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const char = cleaned.charAt(i);
      if (!/\d/.test(char)) return { valid: false, error: 'Invalid ISBN-10' };
      sum += parseInt(char, 10) * (10 - i);
    }
    const check = cleaned.charAt(9).toUpperCase();
    if (check === 'X') sum += 10;
    else if (/\d/.test(check)) sum += parseInt(check, 10);
    else return { valid: false, error: 'Invalid ISBN-10' };
    
    const valid = sum % 11 === 0;
    return {
      valid,
      error: valid ? undefined : 'Invalid ISBN-10 checksum',
      details: valid ? { type: 'ISBN-10' } : undefined,
    };
  }
  
  if (cleaned.length === 13) {
    if (!/^\d{13}$/.test(cleaned)) return { valid: false, error: 'Invalid ISBN-13' };
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned.charAt(i), 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const valid = checkDigit === parseInt(cleaned.charAt(12), 10);
    
    return {
      valid,
      error: valid ? undefined : 'Invalid ISBN-13 checksum',
      details: valid ? { type: 'ISBN-13' } : undefined,
    };
  }
  
  return { valid: false, error: 'ISBN must be 10 or 13 digits' };
}

// ==================== IBAN VALIDATOR ====================

export function validateIban(iban: string): ValidationResult {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  
  if (cleaned.length < 15 || cleaned.length > 34) {
    return { valid: false, error: 'Invalid IBAN length' };
  }
  
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
    return { valid: false, error: 'Invalid IBAN format' };
  }
  
  // Mod 97 check
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numericIban = rearranged.replace(/[A-Z]/g, (char) => 
    (char.charCodeAt(0) - 55).toString()
  );
  
  let remainder = numericIban;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(9);
  }
  
  const valid = parseInt(remainder, 10) % 97 === 1;
  
  return {
    valid,
    error: valid ? undefined : 'Invalid IBAN checksum',
    details: valid ? {
      countryCode: cleaned.slice(0, 2),
      checkDigits: cleaned.slice(2, 4),
    } : undefined,
  };
}

// ==================== HEX COLOR VALIDATOR ====================

export function validateHexColor(color: string): ValidationResult {
  const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/;
  const valid = hexRegex.test(color);
  
  let normalized = color;
  if (valid && !color.startsWith('#')) {
    normalized = '#' + color;
  }
  
  return {
    valid,
    error: valid ? undefined : 'Invalid hex color format',
    details: valid ? {
      normalized,
      hasAlpha: color.replace('#', '').length > 6,
    } : undefined,
  };
}

// ==================== DATE VALIDATOR ====================

export function validateDate(dateStr: string, format = 'YYYY-MM-DD'): ValidationResult {
  let regex: RegExp;
  
  switch (format) {
    case 'YYYY-MM-DD':
      regex = /^\d{4}-\d{2}-\d{2}$/;
      break;
    case 'DD/MM/YYYY':
      regex = /^\d{2}\/\d{2}\/\d{4}$/;
      break;
    case 'MM/DD/YYYY':
      regex = /^\d{2}\/\d{2}\/\d{4}$/;
      break;
    default:
      return { valid: false, error: 'Unsupported date format' };
  }
  
  if (!regex.test(dateStr)) {
    return { valid: false, error: `Date doesn't match format ${format}` };
  }
  
  const date = new Date(dateStr);
  const valid = !isNaN(date.getTime());
  
  return {
    valid,
    error: valid ? undefined : 'Invalid date',
    details: valid ? { timestamp: date.getTime(), iso: date.toISOString() } : undefined,
  };
}

// ==================== SEMVER VALIDATOR ====================

export function validateSemver(version: string): ValidationResult {
  const semverRegex = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  const match = semverRegex.exec(version);
  
  if (!match) {
    return { valid: false, error: 'Invalid semantic version format' };
  }
  
  return {
    valid: true,
    details: {
      major: parseInt(match[1] ?? '0', 10),
      minor: parseInt(match[2] ?? '0', 10),
      patch: parseInt(match[3] ?? '0', 10),
      prerelease: match[4] ?? undefined,
      build: match[5] ?? undefined,
    },
  };
}

// ==================== TIME VALIDATOR ====================

export function validateTime24h(time: string): ValidationResult {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
  const match = timeRegex.exec(time);
  
  if (!match) {
    return { valid: false, error: 'Invalid 24-hour time format' };
  }
  
  return {
    valid: true,
    details: {
      hours: parseInt(match[1] ?? '0', 10),
      minutes: parseInt(match[2] ?? '0', 10),
      seconds: match[3] ? parseInt(match[3], 10) : undefined,
    },
  };
}

// ==================== SLUG VALIDATOR ====================

export function validateSlug(slug: string): ValidationResult {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const valid = slugRegex.test(slug);
  
  return {
    valid,
    error: valid ? undefined : 'Invalid slug format (use lowercase letters, numbers, and hyphens)',
    details: valid ? { length: slug.length } : undefined,
  };
}

// ==================== BASE64 VALIDATOR ====================

export function validateBase64(str: string): ValidationResult {
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  const valid = base64Regex.test(str) && str.length % 4 === 0;
  
  return {
    valid,
    error: valid ? undefined : 'Invalid Base64 format',
    details: valid ? { length: str.length, decodedLength: Math.floor(str.length * 3 / 4) } : undefined,
  };
}

// ==================== JWT VALIDATOR ====================

export function validateJwt(token: string): ValidationResult {
  const parts = token.split('.');
  
  if (parts.length !== 3) {
    return { valid: false, error: 'JWT must have 3 parts' };
  }
  
  try {
    const decode = (str: string) => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const NodeBuffer = (globalThis as any).Buffer;
      if (typeof NodeBuffer !== 'undefined') {
        return NodeBuffer.from(padded, 'base64').toString('utf-8');
      }
      if (typeof atob !== 'undefined') {
        return atob(padded);
      }
      throw new Error('No decoder available');
    };
    
    const header = JSON.parse(decode(parts[0]!));
    const payload = JSON.parse(decode(parts[1]!));
    
    return {
      valid: true,
      details: {
        algorithm: header.alg,
        type: header.typ,
        issuer: payload.iss,
        subject: payload.sub,
        expiration: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
      },
    };
  } catch {
    return { valid: false, error: 'Invalid JWT structure' };
  }
}

// ==================== CRON VALIDATOR ====================

export function validateCronExpression(cron: string): ValidationResult {
  const parts = cron.trim().split(/\s+/);
  
  if (parts.length !== 5 && parts.length !== 6) {
    return { valid: false, error: 'Cron expression must have 5 or 6 fields' };
  }
  
  const fieldPatterns = [
    /^(\*|([0-5]?\d)(-([0-5]?\d))?(,([0-5]?\d)(-([0-5]?\d))?)*)(\/\d+)?$/,
    /^(\*|([0-5]?\d)(-([0-5]?\d))?(,([0-5]?\d)(-([0-5]?\d))?)*)(\/\d+)?$/,
    /^(\*|(1?\d|2[0-3])(-\d+)?(,\d+(-\d+)?)*)(\/\d+)?$/,
    /^(\*|([1-9]|[12]\d|3[01])(-\d+)?(,\d+(-\d+)?)*)(\/\d+)?$/,
    /^(\*|([1-9]|1[0-2])(-\d+)?(,\d+(-\d+)?)*)(\/\d+)?$/,
    /^(\*|[0-6](-[0-6])?(,[0-6](-[0-6])?)*)(\/\d+)?$/,
  ];
  
  const fieldNames = parts.length === 6
    ? ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek']
    : ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
  
  for (let i = 0; i < parts.length; i++) {
    const patternIdx = parts.length === 6 ? i : i;
    if (!fieldPatterns[patternIdx]?.test(parts[i]!)) {
      return { valid: false, error: `Invalid ${fieldNames[i]} field` };
    }
  }
  
  const details: Record<string, string> = {};
  parts.forEach((part, i) => {
    details[fieldNames[i]!] = part;
  });
  
  return {
    valid: true,
    details,
  };
}

// ==================== PASSWORD STRENGTH VALIDATOR ====================

export function validatePasswordStrength(password: string): ValidationResult {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  const strength = score <= 2 ? 'weak' : score <= 3 ? 'fair' : score <= 4 ? 'good' : 'strong';
  
  return {
    valid: score >= 3,
    error: score < 3 ? 'Password is too weak' : undefined,
    details: {
      score,
      strength,
      ...checks,
    },
  };
}

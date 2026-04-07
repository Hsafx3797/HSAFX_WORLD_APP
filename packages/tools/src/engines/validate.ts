/**
 * Validate Engine — Universal Validator
 *
 * Wraps all validation functions from the validators module
 * into a single engine that takes a type name and returns
 * { valid, details }.
 */

import type { Engine, ValidateEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
import {
  isEmail, isURL, isPhoneNumber,
  isAlpha, isAlphanumeric, isNumeric, isInteger,
  isHexColor, isIPv4, isIPv6, isMACAddress,
  isUUID, isSlug, isBase64, isJSON, isJWT,
  isDate, isISODate,
  isCreditCard, getCreditCardType,
  isIBAN, isSWIFT, isSSN,
  isContainerNumber, isTrackingNumber, isBillOfLading,
  checkPasswordStrength,
} from '../validators';

// ---------------------------------------------------------------------------
// Validator registry
// ---------------------------------------------------------------------------

type ValidatorFn = (value: string, opts: ValidateEngineOptions) => {
  valid: boolean;
  details?: Record<string, unknown>;
};

const VALIDATORS: Record<string, ValidatorFn> = {
  'email':            (v, o) => {
    if (o.strict) {
      // RFC 5322-ish: require local@domain.tld, no consecutive dots, no leading/trailing dot
      const strict = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(v);
      return { valid: strict };
    }
    return { valid: isEmail(v) };
  },
  'url':              (v, o) => {
    if (o.strict) {
      // Strict: must have protocol
      const strict = /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v);
      return { valid: strict };
    }
    return { valid: isURL(v) };
  },
  'phone':            (v, o) => ({ valid: isPhoneNumber(v, o.countryCode) }),
  'alpha':            (v) => ({ valid: isAlpha(v) }),
  'alphanumeric':     (v) => ({ valid: isAlphanumeric(v) }),
  'numeric':          (v) => ({ valid: isNumeric(v) }),
  'integer':          (v) => ({ valid: isInteger(v) }),
  'hex-color':        (v) => ({ valid: isHexColor(v) }),
  'ipv4':             (v) => ({ valid: isIPv4(v) }),
  'ipv6':             (v) => ({ valid: isIPv6(v) }),
  'mac-address':      (v) => ({ valid: isMACAddress(v) }),
  'uuid':             (v, o) => ({ valid: isUUID(v, o.version as 1 | 3 | 4 | 5 | undefined) }),
  'slug':             (v) => ({ valid: isSlug(v) }),
  'base64':           (v) => ({ valid: isBase64(v) }),
  'json':             (v, o) => {
    if (o.strict) {
      // Strict: must parse AND no trailing commas
      if (/,\s*[}\]]/.test(v)) return { valid: false, details: { reason: 'trailing comma' } };
      try { JSON.parse(v); return { valid: true }; }
      catch { return { valid: false }; }
    }
    return { valid: isJSON(v) };
  },
  'jwt':              (v) => ({ valid: isJWT(v) }),
  'date':             (v) => ({ valid: isDate(v) }),
  'iso-date':         (v) => ({ valid: isISODate(v) }),
  'credit-card':      (v) => ({
    valid: isCreditCard(v),
    details: { type: getCreditCardType(v) },
  }),
  'iban':             (v) => ({ valid: isIBAN(v) }),
  'swift':            (v) => ({ valid: isSWIFT(v) }),
  'ssn':              (v) => ({ valid: isSSN(v) }),
  'container-number': (v) => ({ valid: isContainerNumber(v) }),
  'tracking-number':  (v, o) => ({ valid: isTrackingNumber(v, o.carrier) }),
  'bill-of-lading':   (v) => ({ valid: isBillOfLading(v) }),
  'password-strength': (v) => {
    const result = checkPasswordStrength(v);
    return { valid: result.score >= 3, details: result as unknown as Record<string, unknown> };
  },
  'cron': (v) => {
    const parts = v.trim().split(/\s+/);
    const valid = parts.length >= 5 && parts.length <= 7;
    return { valid, details: { fields: parts.length } };
  },
  'semver': (v) => {
    const valid = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/.test(v.trim());
    return { valid };
  },
  'xml': (v) => {
    const trimmed = v.trim();
    // Must start with < and end with a closing tag
    if (!/^\s*</.test(trimmed) || !/<\/[^>]+>\s*$/.test(trimmed)) return { valid: false };
    // Count opening vs closing angle brackets (basic balance check)
    const opens = (trimmed.match(/</g) || []).length;
    const closes = (trimmed.match(/>/g) || []).length;
    if (opens !== closes) return { valid: false };
    // Must have at least one closing tag
    if (!/<\/\w/.test(trimmed)) return { valid: false };
    return { valid: true };
  },
  'yaml': (v) => {
    const trimmed = v.trim();
    if (!trimmed) return { valid: false };
    // Tabs are invalid in YAML
    if (trimmed.includes('\t')) return { valid: false };
    const lines = trimmed.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    if (lines.length === 0) return { valid: false };
    // At least one line should look like a key-value pair or list item
    const hasStructure = lines.some(l => /^\s*[\w"'-]+\s*:/.test(l) || /^\s*-\s/.test(l));
    return { valid: hasStructure };
  },
  'csv': (v) => {
    const lines = v.trim().split('\n');
    if (lines.length === 0) return { valid: false };
    const cols = lines[0]!.split(',').length;
    const valid = lines.every(l => l.split(',').length === cols);
    return { valid, details: { rows: lines.length, columns: cols } };
  },
  'json-schema': (v) => {
    try { const obj = JSON.parse(v); return { valid: typeof obj === 'object' && ('type' in obj || '$schema' in obj || 'properties' in obj) }; }
    catch { return { valid: false }; }
  },
  'openapi': (v) => {
    // Try JSON first, then fall back to YAML-like keyword checks
    try {
      const obj = JSON.parse(v);
      const hasVersion = 'openapi' in obj || 'swagger' in obj;
      const hasInfo = 'info' in obj;
      const hasPaths = 'paths' in obj;
      return { valid: hasVersion && hasInfo && hasPaths };
    } catch {
      // YAML-like: require version field + info + paths
      const hasVersion = /^(openapi|swagger)\s*:/m.test(v);
      const hasInfo = /^info\s*:/m.test(v);
      const hasPaths = /^paths\s*:/m.test(v);
      return { valid: hasVersion && hasInfo && hasPaths };
    }
  },
  'graphql-schema': (v) => {
    const valid = /type\s+\w+/.test(v) || /schema\s*\{/.test(v);
    return { valid };
  },
  'sql': (v) => {
    const keywords = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|BEGIN|COMMIT)\b/i;
    return { valid: keywords.test(v.trim()) };
  },
  'docker-compose': (v) => {
    const hasServices = /^services\s*:/m.test(v);
    // Must have services block; version is optional in Compose v2+
    return { valid: hasServices };
  },
  'kubernetes': (v) => {
    const hasApiVersion = /^apiVersion\s*:/m.test(v);
    const hasKind = /^kind\s*:/m.test(v);
    return { valid: hasApiVersion && hasKind };
  },
  'terraform': (v) => {
    const valid = /resource\s+"/.test(v) || /provider\s+"/.test(v) || /variable\s+"/.test(v);
    return { valid };
  },
  'jsonpath': (v) => {
    const valid = v.startsWith('$') || v.startsWith('@');
    return { valid };
  },
  'xpath': (v) => {
    const valid = v.startsWith('/') || v.startsWith('.') || v.includes('::');
    return { valid };
  },
  'regex': (v) => {
    try { new RegExp(v); return { valid: true }; }
    catch { return { valid: false }; }
  },
};

const TYPES = Object.keys(VALIDATORS).sort();

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const validateEngine: Engine<ValidateEngineOptions> = {
  name: 'validate',
  description: 'Validate strings against known patterns (email, URL, UUID, IBAN, credit card, etc.).',

  validate(options: ValidateEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    if (!VALIDATORS[options.type]) {
      errors.push(`Unknown validation type "${options.type}". Available: ${TYPES.join(', ')}`);
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: ValidateEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : String(input);
    const fn = VALIDATORS[options.type];
    if (!fn) {
      return { output: JSON.stringify({ valid: false, error: `Unknown type: ${options.type}` }) };
    }
    const result = fn(text, options);
    return {
      output: JSON.stringify(result, null, 2),
      metadata: { type: options.type, ...result },
    };
  },
};

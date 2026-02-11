/**
 * Structured Logger for HSAFX World App
 *
 * Features:
 * - JSON output in production, pretty-print in development
 * - PII redaction (email, tokens, IP addresses)
 * - Request-ID correlation
 * - Child logger support for domain-scoped logging
 *
 * Usage:
 *   import { logger } from '@hsafx/shared/logger';
 *   logger.info('Tool executed', { toolId: 'json-formatter', userId: 'abc' });
 *   const child = logger.child({ module: 'billing' });
 *   child.warn('Low balance', { userId: 'abc', balance: 5 });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  msg: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  fatal(msg: string, data?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}

// ─── PII Redaction ────────────────────────────────────────────────────────────

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const TOKEN_KEYS = new Set([
  'token', 'sessionToken', 'session_token', 'apiKey', 'api_key',
  'password', 'secret', 'authorization', 'cookie', 'accessToken',
  'refreshToken', 'access_token', 'refresh_token',
]);
const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

function redactEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '[REDACTED_EMAIL]';
  return `${local[0]}***@${domain[0]}***.${domain.split('.').pop()}`;
}

function redactValue(key: string, value: unknown, isProduction: boolean): unknown {
  // Redact known sensitive keys
  if (TOKEN_KEYS.has(key)) {
    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    // Redact emails
    let result = value.replace(EMAIL_RE, (match) => redactEmail(match));

    // Redact IP addresses in production only
    if (isProduction) {
      result = result.replace(IP_RE, '[REDACTED_IP]');
    }

    return result;
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return redactObject(value as Record<string, unknown>, isProduction);
  }

  return value;
}

function redactObject(obj: Record<string, unknown>, isProduction: boolean): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = redactValue(key, value, isProduction);
  }
  return result;
}

// ─── Logger Implementation ────────────────────────────────────────────────────

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

function getMinLevel(): LogLevel {
  const env = typeof process !== 'undefined' ? process.env.LOG_LEVEL : undefined;
  if (env && env in LOG_LEVELS) return env as LogLevel;
  return isProduction() ? 'info' : 'debug';
}

function isProduction(): boolean {
  if (typeof process === 'undefined') return false;
  return process.env.NODE_ENV === 'production';
}

function createLoggerImpl(bindings: Record<string, unknown> = {}): Logger {
  const minLevel = LOG_LEVELS[getMinLevel()];
  const prod = isProduction();

  function log(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < minLevel) return;

    const entry: LogEntry = {
      level,
      msg,
      timestamp: new Date().toISOString(),
      ...bindings,
      ...(data ? redactObject(data, prod) : {}),
    };

    if (prod) {
      // JSON output for production (machine-parseable)
      const output = JSON.stringify(entry);
      if (level === 'error' || level === 'fatal') {
        console.error(output);
      } else if (level === 'warn') {
        console.warn(output);
      } else {
        console.log(output);
      }
    } else {
      // Pretty output for development
      const prefix = `[${level.toUpperCase().padEnd(5)}]`;
      const bindingsStr = Object.keys(bindings).length > 0
        ? ` (${Object.entries(bindings).map(([k, v]) => `${k}=${v}`).join(', ')})`
        : '';
      const dataStr = data && Object.keys(data).length > 0
        ? ` ${JSON.stringify(redactObject(data, prod), null, 0)}`
        : '';

      const output = `${prefix}${bindingsStr} ${msg}${dataStr}`;
      if (level === 'error' || level === 'fatal') {
        console.error(output);
      } else if (level === 'warn') {
        console.warn(output);
      } else if (level === 'debug') {
        console.debug(output);
      } else {
        console.log(output);
      }
    }
  }

  return {
    debug: (msg, data) => log('debug', msg, data),
    info: (msg, data) => log('info', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    error: (msg, data) => log('error', msg, data),
    fatal: (msg, data) => log('fatal', msg, data),
    child: (childBindings) => createLoggerImpl({ ...bindings, ...childBindings }),
  };
}

/** Root logger instance */
export const logger = createLoggerImpl();

/** Create a module-scoped logger */
export function createLogger(module: string): Logger {
  return logger.child({ module });
}

export default logger;

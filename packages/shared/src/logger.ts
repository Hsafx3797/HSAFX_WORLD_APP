/**
 * Structured Logger for HSAFX World App
 *
 * Powered by pino — fast, JSON-native structured logging.
 *
 * Features:
 * - JSON output in production, pretty-print in development (via pino-pretty)
 * - PII redaction (email, tokens, IP addresses)
 * - Child logger support for domain-scoped logging
 *
 * Usage:
 *   import { logger } from '@hsafx/shared/logger';
 *   logger.info('Tool executed', { toolId: 'json-formatter', userId: 'abc' });
 *   const child = logger.child({ module: 'billing' });
 *   child.warn('Low balance', { userId: 'abc', balance: 5 });
 */

import pino from 'pino';

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
  if (TOKEN_KEYS.has(key)) {
    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    let result = value.replace(EMAIL_RE, (match) => redactEmail(match));
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

/** Sanitize an object for safe logging (PII redaction). */
export function sanitizeForLogging(obj: Record<string, unknown>): Record<string, unknown> {
  return redactObject(obj, true);
}

// ─── Pino instance ────────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }),
});

// ─── Wrapper (preserves PII redaction + stable public API) ────────────────────

function wrapPino(p: pino.Logger): Logger {
  function log(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
    const cleaned = data ? redactObject(data, isProd) : undefined;
    if (cleaned) {
      p[level](cleaned, msg);
    } else {
      p[level](msg);
    }
  }

  return {
    debug: (msg, data) => log('debug', msg, data),
    info: (msg, data) => log('info', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    error: (msg, data) => log('error', msg, data),
    fatal: (msg, data) => log('fatal', msg, data),
    child: (bindings) => wrapPino(p.child(bindings)),
  };
}

/** Root logger instance */
export const logger: Logger = wrapPino(pinoLogger);

/** Create a module-scoped logger */
export function createLogger(module: string): Logger {
  return logger.child({ module });
}

export default logger;

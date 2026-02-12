/**
 * Admin Panel Auth — BetterAuth server instance
 * Shares the same database as the web app but runs on the admin domain.
 * Only email+password sign-in — no social providers needed for admin.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@hsafx/db';
import * as schema from '@hsafx/db/schema';

let _auth: ReturnType<typeof betterAuth> | undefined;

function createAuth() {
  const secret = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.AUTH_URL || process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required for admin panel');
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.oauthConnections,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Admin accounts are pre-created
    },
    session: {
      expiresIn: 60 * 60 * 24, // 24 hours per admin spec
      updateAge: 60 * 60, // 1 hour
      cookieCache: {
        enabled: true,
        maxAge: 60 * 2, // 2 minutes
      },
    },
    advanced: {
      cookiePrefix: '__hsafx',
    },
    rateLimit: {
      window: 60,
      max: 20,
      customRules: {
        '/api/auth/sign-in/email': { window: 300, max: 5 }, // 5 per 5 min
      },
    },
    secret,
    baseURL,
    trustedOrigins: [baseURL],
  });
}

export function getAuth() {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

type AuthType = ReturnType<typeof betterAuth>;
export const auth = new Proxy({} as AuthType, {
  get(_target, prop) {
    const instance = getAuth();
    const value = instance[prop as keyof typeof instance];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

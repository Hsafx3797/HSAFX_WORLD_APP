import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { twoFactor } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@hsafx/db';
import * as schema from '@hsafx/db/schema';
import { sendEmail } from '@/lib/email';
import {
  checkLoginAttempt,
  recordFailedLogin,
  resetLoginFailures,
  verifyCaptcha,
} from '@/lib/login-security';
import { getRedis } from '@/lib/redis';

// Lazy initialization to avoid build-time errors
let _auth: ReturnType<typeof betterAuth> | undefined;

function createAuth() {
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET environment variable is required');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.oauthConnections,
        twoFactor: schema.twoFactor,
      },
    }),
    plugins: [
      twoFactor({
        issuer: 'HSAFX World',
      }),
    ],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      // Password reset configuration
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          template: 'password-reset',
          variables: { resetLink: url, userName: user.name ?? user.email.split('@')[0] },
          userId: user.id,
        });
      },
    },
    // Redis-backed secondary storage for session caching (graceful degradation)
    secondaryStorage: process.env.UPSTASH_REDIS_REST_URL
      ? {
          get: async (key: string) => {
            const redis = getRedis();
            return (await redis.get<string>(key)) ?? null;
          },
          set: async (key: string, value: string, ttl?: number) => {
            const redis = getRedis();
            if (ttl) {
              await redis.set(key, value, { ex: ttl });
            } else {
              await redis.set(key, value);
            }
          },
          delete: async (key: string) => {
            const redis = getRedis();
            await redis.del(key);
          },
        }
      : undefined,
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          template: 'email-verification',
          variables: { verifyLink: url, userName: user.name ?? user.email.split('@')[0] },
          userId: user.id,
        });
      },
    },
    account: {
      // Allow linking multiple OAuth providers to a single account
      accountLinking: {
        enabled: true,
        trustedProviders: ['google', 'github', 'facebook'],
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        enabled: !!process.env.GOOGLE_CLIENT_ID,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        enabled: !!process.env.GITHUB_CLIENT_ID,
      },
      facebook: {
        clientId: process.env.META_CLIENT_ID || '',
        clientSecret: process.env.META_CLIENT_SECRET || '',
        enabled: !!process.env.META_CLIENT_ID,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days (idle timeout)
      updateAge: 60 * 60, // 1 hour — rolling: session extends on activity
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes — reduce DB lookups for session validation
      },
    },
    advanced: {
      cookiePrefix: '__hsafx',
    },
    rateLimit: {
      window: 60, // 1 minute window
      max: 30, // 30 requests per window default
      customRules: {
        '/api/auth/sign-in/email': { window: 60, max: 5 },
        '/api/auth/sign-up/email': { window: 60, max: 3 },
        '/api/auth/forgot-password': { window: 300, max: 3 }, // 3 per 5 min
        '/api/auth/reset-password': { window: 300, max: 5 },
        '/api/auth/two-factor/*': { window: 10, max: 3 },
      },
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-in/email') return;

        const ip =
          ctx.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          ctx.headers?.get('x-real-ip') ||
          '127.0.0.1';
        const body = ctx.body as { email?: string; captchaToken?: string } | undefined;
        const email = body?.email;

        if (!email) return; // Let better-auth handle validation

        const check = await checkLoginAttempt(ip, email);

        if (!check.allowed) {
          return new Response(
            JSON.stringify({
              error: 'Too many failed attempts. Please try again later.',
              code: 'LOGIN_LOCKED',
              retryAfter: check.retryAfterSeconds,
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(check.retryAfterSeconds),
              },
            },
          );
        }

        if (check.requiresCaptcha) {
          const captchaToken = body?.captchaToken;
          if (!captchaToken) {
            return new Response(
              JSON.stringify({
                error: 'CAPTCHA verification required.',
                code: 'CAPTCHA_REQUIRED',
              }),
              { status: 403, headers: { 'Content-Type': 'application/json' } },
            );
          }
          const valid = await verifyCaptcha(captchaToken);
          if (!valid) {
            return new Response(
              JSON.stringify({
                error: 'CAPTCHA verification failed.',
                code: 'CAPTCHA_INVALID',
              }),
              { status: 403, headers: { 'Content-Type': 'application/json' } },
            );
          }
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-in/email') return;

        const ip =
          ctx.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          ctx.headers?.get('x-real-ip') ||
          '127.0.0.1';
        const body = ctx.body as { email?: string } | undefined;
        const email = body?.email;

        if (!email) return;

        // Check if sign-in succeeded (2xx) or failed (4xx)
        if (ctx.context.responseHeaders?.get('set-cookie')) {
          // Success — session cookie was set
          await resetLoginFailures(ip, email);
        } else {
          // Failure — no session cookie
          await recordFailedLogin(ip, email);
        }
      }),
    },
  });
}

// Getter for auth - only initializes at runtime
export function getAuth() {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

// For backwards compatibility - provides a proxy that initializes on first use
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

export type Session = Awaited<ReturnType<AuthType['api']['getSession']>>;

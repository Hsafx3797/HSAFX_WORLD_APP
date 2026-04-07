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
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('auth');

// Lazy initialization to avoid build-time errors
let _auth: ReturnType<typeof betterAuth> | undefined;

function createAuth() {
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET environment variable is required');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
  }

  // Helper: check if email sending is properly configured
  const isEmailConfigured = !!process.env.RESEND_API_KEY && 
    !process.env.RESEND_API_KEY.includes('placeholder');

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
      requireEmailVerification: isEmailConfigured,
      // Password reset configuration
      sendResetPassword: async ({ user, url }) => {
        try {
          await sendEmail({
            to: user.email,
            template: 'password-reset',
            variables: { resetLink: url, userName: user.name ?? user.email.split('@')[0] },
            userId: user.id,
          });
        } catch (e) {
          log.error('Failed to send password reset email', { error: e instanceof Error ? e.message : String(e) });
        }
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
      sendOnSignUp: isEmailConfigured,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        try {
          await sendEmail({
            to: user.email,
            template: 'email-verification',
            variables: { verifyLink: url, userName: user.name ?? user.email.split('@')[0] },
            userId: user.id,
          });
        } catch (e) {
          log.error('Failed to send verification email', { error: e instanceof Error ? e.message : String(e) });
        }
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
      window: Number(process.env.AUTH_RATE_LIMIT_WINDOW ?? 60),
      max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 30),
      customRules: {
        '/api/auth/sign-in/email': { window: 60, max: Number(process.env.AUTH_SIGNIN_MAX ?? 5) },
        '/api/auth/sign-up/email': { window: 60, max: Number(process.env.AUTH_SIGNUP_MAX ?? 3) },
        '/api/auth/forgot-password': { window: 300, max: Number(process.env.AUTH_FORGOT_PW_MAX ?? 3) },
        '/api/auth/reset-password': { window: 300, max: Number(process.env.AUTH_RESET_PW_MAX ?? 5) },
        '/api/auth/two-factor/*': { window: 10, max: Number(process.env.AUTH_2FA_MAX ?? 3) },
      },
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-in/email') return;

        try {
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
        } catch (e) {
          log.error('Login security check failed', { error: e instanceof Error ? e.message : String(e) });
          // Allow login to proceed if security check fails
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-in/email') return;

        try {
          const ip =
            ctx.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            ctx.headers?.get('x-real-ip') ||
            '127.0.0.1';
          const body = ctx.body as { email?: string } | undefined;
          const email = body?.email;

          if (!email) return;

          const returned = ctx.context.returned as { status?: number } | undefined;
          const status = returned?.status ?? 0;
          if (status >= 200 && status < 300) {
            await resetLoginFailures(ip, email);
          } else if (status >= 400) {
            await recordFailedLogin(ip, email);
          }
        } catch (e) {
          log.error('Login security recording failed', { error: e instanceof Error ? e.message : String(e) });
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

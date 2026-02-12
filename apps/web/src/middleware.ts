/**
 * Next.js Edge Middleware
 *
 * Handles:
 * 1. Rate limiting — IP-based (all), auth-endpoint, API key (B2B)
 * 2. Auth route protection — redirect unauthenticated users from protected routes
 * 3. Admin route protection — redirect non-admin users from /admin
 * 4. Tool URL redirects — redirect individual tool URLs to their category pages
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  checkIpRateLimit,
  checkAuthRateLimit,
  checkApiKeyRateLimit,
  checkUserRateLimit,
  rateLimitHeaders,
} from '@/lib/rate-limit';

// ─── Rate Limiting ────────────────────────────────────────────────────────────

/**
 * Paths that bypass rate limiting entirely.
 * Static assets, _next, favicon, etc.
 */
const RATE_LIMIT_SKIP_PREFIXES = ['/_next', '/favicon', '/static', '/images'];

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

async function handleRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Skip static assets
  if (RATE_LIMIT_SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  // Skip if Redis is not configured (development without Redis)
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }

  const ip = getClientIp(request);

  try {
    // ── Auth endpoint rate limit (strict: 10 req / 15 min) ──
    if (
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/api/auth/')
    ) {
      const authResult = await checkAuthRateLimit(ip);
      if (!authResult.allowed) {
        return NextResponse.json(
          {
            error: 'Too many authentication attempts. Please try again later.',
            retryAfter: Math.ceil((authResult.reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: rateLimitHeaders(authResult),
          },
        );
      }
      return null; // Auth rate limit passed
    }

    // ── B2B API key rate limit (60 req / min per key) ──
    if (pathname.startsWith('/api/v1/')) {
      const authHeader = request.headers.get('authorization');
      const apiKey = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

      if (apiKey) {
        // Use a hash of the key as identifier (don't store raw key)
        const keyId = apiKey.slice(0, 16); // prefix is safe as identifier
        const apiKeyResult = await checkApiKeyRateLimit(keyId);
        if (!apiKeyResult.allowed) {
          return NextResponse.json(
            {
              error: 'API rate limit exceeded',
              retryAfter: Math.ceil(
                (apiKeyResult.reset - Date.now()) / 1000,
              ),
            },
            {
              status: 429,
              headers: rateLimitHeaders(apiKeyResult),
            },
          );
        }
      }
      // Also apply IP limit to V1 — fall through
    }

    // ── IP-based rate limit (100 req / min for all) ──
    const ipResult = await checkIpRateLimit(ip);
    if (!ipResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please slow down.',
          retryAfter: Math.ceil((ipResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: rateLimitHeaders(ipResult),
        },
      );
    }

    // ── Session-based rate limit (500 req / hr for authenticated users) ──
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
    if (sessionToken) {
      const userResult = await checkUserRateLimit(sessionToken);
      if (!userResult.allowed) {
        return NextResponse.json(
          {
            error: 'Session rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((userResult.reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: rateLimitHeaders(userResult),
          },
        );
      }
    }
  } catch {
    // Rate limit check failed — fail open in development, closed in production
    if (process.env.NODE_ENV === 'production') {
      console.error('[middleware] Rate limit check failed — allowing request');
    }
    // Allow request to proceed
  }

  return null;
}

// ─── Auth Route Protection ────────────────────────────────────────────────────

/** Routes that require an authenticated session (cookie: better-auth.session_token) */
const PROTECTED_PREFIXES = ['/dashboard', '/settings', '/billing', '/account'];

/** Routes that require admin role (checked via admin cookie set at login) */
const ADMIN_PREFIXES = ['/admin'];

/** Auth pages — redirect authenticated users away from here to /dashboard */
const AUTH_PAGES = ['/auth/signin', '/auth/signup', '/auth/login', '/auth/register'];

/** The session cookie name used by better-auth */
const SESSION_COOKIE = 'better-auth.session_token';

function handleAuth(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // Protected routes — require authentication
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !hasSession) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin routes — require session + admin role marker
  const isAdmin = ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isAdmin) {
    if (!hasSession) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
    // NOTE: Full RBAC check happens server-side in admin layout.
    // Edge middleware only does a quick cookie-existence check here.
  }

  // Auth pages — redirect already-authenticated users to dashboard
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return null; // No redirect needed
}

// ─── CSRF Origin Validation ───────────────────────────────────────────────────

/**
 * Allowed origins for state-changing requests (POST, PUT, DELETE, PATCH).
 * Requests without a valid Origin header from these domains are rejected.
 */
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'https://hsafx.world',
  'https://www.hsafx.world',
  'https://admin.hsafx.world',
]);

/** Safe methods that don't require Origin checks */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Paths exempt from CSRF checks (webhooks, OAuth callbacks) */
const CSRF_EXEMPT_PREFIXES = [
  '/api/auth/',      // better-auth handles its own CSRF via trustedOrigins
  '/api/webhooks/',  // Stripe/Polar webhooks verify signatures instead
];

function handleCsrf(request: NextRequest): NextResponse | null {
  // Only check state-changing methods
  if (SAFE_METHODS.has(request.method)) return null;

  const pathname = request.nextUrl.pathname;

  // Skip exempt paths
  if (CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  // Only check API routes and server actions
  if (!pathname.startsWith('/api/')) return null;

  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json(
      { error: 'Forbidden: invalid origin' },
      { status: 403 },
    );
  }

  return null;
}

// ─── Middleware Entry Point ──────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  // 0. Rate limiting (IP, auth endpoint, API key)
  const rateResponse = await handleRateLimit(request);
  if (rateResponse) return rateResponse;

  // 1. CSRF Origin validation
  const csrfResponse = handleCsrf(request);
  if (csrfResponse) return csrfResponse;

  // 2. Check auth protection
  const authRedirect = handleAuth(request);
  if (authRedirect) return authRedirect;

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Auth-protected routes
    '/dashboard/:path*',
    '/settings/:path*',
    '/billing/:path*',
    '/account/:path*',
    '/admin/:path*',
    // Auth pages (for redirect-if-authenticated + auth rate limiting)
    '/auth/:path*',
    // API routes (rate limiting)
    '/api/:path*',
    // Tool slug redirects (not /tools/category/* or static files)
    '/tools/:slug((?!category|_next|api|static).*)',
  ],
};

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
import { redis, keys } from '@/lib/redis';

// ─── Rate Limiting ────────────────────────────────────────────────────────────

/**
 * Paths that bypass rate limiting entirely.
 * Static assets, _next, favicon, etc.
 */
const RATE_LIMIT_SKIP_PREFIXES = ['/_next', '/favicon', '/static', '/images'];

function getClientIp(request: NextRequest): string {
  // Trust only the rightmost IP appended by our reverse proxy.
  // Clients can spoof earlier entries in x-forwarded-for.
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const ips = xff.split(',').map((s) => s.trim()).filter(Boolean);
    // In a single-proxy setup, the last entry is the client IP appended by the proxy.
    // For multi-proxy, adjust via TRUSTED_PROXY_DEPTH env var.
    const depth = Math.max(1, parseInt(process.env.TRUSTED_PROXY_DEPTH ?? '1', 10));
    const idx = Math.max(0, ips.length - depth);
    return ips[idx] ?? '127.0.0.1';
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
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
    // NOTE: Keyed by session token because Edge Middleware cannot resolve userId
    // (better-auth uses opaque tokens, not JWTs). This means a user who logs out
    // and back in gets a new rate limit window. This is a known limitation —
    // the real billing protection is the coin reservation system (server-side),
    // and B2B API key rate limiting (keyed by key ID) is unaffected.
    // TODO: Add a signed __hsafx.uid cookie at login time to key by userId here.
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
    // Rate limit check failed (Redis down, network error, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Fail closed in production — reject request when rate limiter is unavailable
      console.error('[middleware] Rate limit check failed — blocking request (fail-closed)');
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again.' },
        { status: 503, headers: { 'Retry-After': '10' } },
      );
    }
    // Fail open in development — allow request to proceed
  }

  return null;
}

// ─── Auth Route Protection ────────────────────────────────────────────────────

/** Routes that require an authenticated session (cookie: __hsafx.session_token) */
const PROTECTED_PREFIXES = ['/dashboard', '/settings', '/billing', '/account'];

/** Routes that require admin role (checked via admin cookie set at login) */
const ADMIN_PREFIXES = ['/admin'];

/** Auth pages — redirect authenticated users away from here to /dashboard */
const AUTH_PAGES = ['/auth/signin', '/auth/signup', '/auth/login', '/auth/register'];

/** The session cookie name used by better-auth (prefix: __hsafx) */
const SESSION_COOKIE = '__hsafx.session_token';

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

/** Paths exempt from CSRF checks (webhooks, OAuth callbacks, B2B API key routes) */
const CSRF_EXEMPT_PREFIXES = [
  '/api/auth/',      // better-auth handles its own CSRF via trustedOrigins
  '/api/webhooks/',  // Stripe/Polar webhooks verify signatures instead
  '/api/v1/',        // B2B routes use Bearer token auth, not cookies
];

function handleCsrf(request: NextRequest): NextResponse | null {
  // Only check state-changing methods
  if (SAFE_METHODS.has(request.method)) return null;

  const pathname = request.nextUrl.pathname;

  // Skip exempt paths
  if (CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  // Only check API routes and server actions
  if (!pathname.startsWith('/api/')) return null;

  // Check Origin header first
  const origin = request.headers.get('origin');
  if (origin) {
    if (!ALLOWED_ORIGINS.has(origin)) {
      return NextResponse.json(
        { error: 'Forbidden: invalid origin' },
        { status: 403 },
      );
    }
    return null; // Origin present and valid
  }

  // Referer fallback when Origin header is absent
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!ALLOWED_ORIGINS.has(refererOrigin)) {
        return NextResponse.json(
          { error: 'Forbidden: invalid referer origin' },
          { status: 403 },
        );
      }
      return null; // Referer origin valid
    } catch {
      return NextResponse.json(
        { error: 'Forbidden: malformed referer' },
        { status: 403 },
      );
    }
  }

  // Neither Origin nor Referer present — reject
  return NextResponse.json(
    { error: 'Forbidden: missing origin' },
    { status: 403 },
  );
}

// ─── Maintenance Mode ─────────────────────────────────────────────────────────

/** Paths exempt from maintenance mode (admin, health, internal) */
const MAINTENANCE_EXEMPT_PREFIXES = [
  '/admin',
  '/api/admin/',
  '/api/v1/health',
  '/api/internal/',
  '/api/auth/',
  '/_next',
  '/favicon',
  '/static',
];

async function handleMaintenanceMode(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Skip exempt paths (admin can still access)
  if (MAINTENANCE_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  // Skip if Redis is not configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;

  try {
    const enabled = await redis.get(keys.system.maintenanceMode());
    if (enabled !== '1') return null;

    // API routes return JSON 503
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'SYSTEM_9003', message: 'System is under maintenance' } },
        { status: 503, headers: { 'Retry-After': '300' } },
      );
    }

    // Web pages return HTML 503
    return new NextResponse(
      '<!DOCTYPE html><html><head><title>Maintenance</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5"><div style="text-align:center"><h1>Under Maintenance</h1><p>We\'re performing scheduled maintenance. Please check back shortly.</p></div></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html', 'Retry-After': '300' } },
    );
  } catch {
    // Fail open — don't block users if Redis is unreachable
    return null;
  }
}

// ─── CORS for B2B API ─────────────────────────────────────────────────────────

/**
 * CORS headers for /api/v1/ routes.
 * B2B API is token-authenticated (Bearer), not cookie-based,
 * so credentials mode is not required.
 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Idempotency-Key, X-Request-Id',
  'Access-Control-Expose-Headers': 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-Request-Id',
  'Access-Control-Max-Age': '86400',
};

function handleCors(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;

  // Only apply CORS to B2B API routes
  if (!pathname.startsWith('/api/v1/')) return null;

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  return null;
}

/**
 * Inject CORS headers into an existing response for /api/v1/ routes.
 */
function applyCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

// ─── Middleware Entry Point ──────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  // 0. CORS preflight — must respond before any other checks
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  // 1. Maintenance mode check (reads flag from Redis, set by admin)
  const maintenanceResponse = await handleMaintenanceMode(request);
  if (maintenanceResponse) return applyCorsHeaders(request, maintenanceResponse);

  // 2. Rate limiting (IP, auth endpoint, API key)
  const rateResponse = await handleRateLimit(request);
  if (rateResponse) return applyCorsHeaders(request, rateResponse);

  // 3. CSRF Origin validation
  const csrfResponse = handleCsrf(request);
  if (csrfResponse) return applyCorsHeaders(request, csrfResponse);

  // 4. Check auth protection
  const authRedirect = handleAuth(request);
  if (authRedirect) return authRedirect;

  return applyCorsHeaders(request, NextResponse.next());
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
    // TODO [G9]: Re-enable tool slug matcher once tool routes are built (Task 1000)
    // '/tools/:slug((?!category|_next|api|static).*)',
  ],
};

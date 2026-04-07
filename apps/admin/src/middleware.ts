/**
 * Admin Panel Middleware
 *
 * Protects all admin routes by verifying session cookies.
 * Unauthenticated users are redirected to /login.
 * Authenticated users without a valid 2FA session cookie are
 * redirected to /verify-2fa (server-enforced, not client-cooperative).
 */

import { NextResponse, type NextRequest } from 'next/server';

// ─── CSRF Origin Validation ──────────────────────────────────────────────────

const DEFAULT_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://admin.hsafx.world',
  'https://hsafx.world',
];

const ALLOWED_ORIGINS = new Set(
  process.env.ADMIN_ALLOWED_ORIGINS
    ? process.env.ADMIN_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ORIGINS,
);

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const CSRF_EXEMPT_PREFIXES = ['/api/auth/']; // better-auth manages its own CSRF

// ─── 2FA cookie verification (Edge-compatible Web Crypto) ────────────────────

const TFA_COOKIE_NAME = 'admin_2fa_session';
const TFA_COOKIE_MAX_AGE_MS = 60 * 60 * 24 * 1000; // 24 hours

/**
 * Verify the signed 2FA cookie using Web Crypto API (Edge-compatible).
 * Token format: `userId:timestamp:hmacHex`
 * Returns userId if valid, null otherwise.
 */
async function verifyTfaCookie(token: string): Promise<string | null> {
  const secret = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || '';
  if (!secret) return null;

  const parts = token.split(':');
  if (parts.length !== 3) return null;

  const [userId, timestamp, sig] = parts;
  if (!userId || !timestamp || !sig) return null;

  // Check expiry
  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > TFA_COOKIE_MAX_AGE_MS) return null;

  // Verify HMAC-SHA256 signature using Web Crypto (constant-time)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const payload = `${userId}:${timestamp}`;
  // Decode the hex signature back to bytes for constant-time verify
  const sigBytes = new Uint8Array(sig.length / 2);
  for (let i = 0; i < sigBytes.length; i++) {
    sigBytes[i] = parseInt(sig.slice(i * 2, i * 2 + 2), 16);
  }
  if (sigBytes.some(b => isNaN(b))) return null;
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));

  if (!valid) return null;

  return userId;
}

// ─── Path classification ─────────────────────────────────────────────────────

// Routes that don't require authentication at all
const PUBLIC_PATHS = new Set(['/login', '/api/auth']);

// Routes that require authentication but NOT 2FA verification
const AUTH_ONLY_PATHS = new Set(['/verify-2fa', '/api/admin/2fa/session-verify', '/api/admin/session']);

function isPublicPath(pathname: string): boolean {
  for (const path of PUBLIC_PATHS) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return true;
    }
  }
  return false;
}

function isAuthOnlyPath(pathname: string): boolean {
  for (const path of AUTH_ONLY_PATHS) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return true;
    }
  }
  // Also allow the 2FA setup/status API (needed during onboarding)
  if (pathname.startsWith('/api/admin/2fa')) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ── CSRF Origin validation on state-changing requests ──
  if (!SAFE_METHODS.has(request.method) && pathname.startsWith('/api/')) {
    if (!CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) {
      const origin = request.headers.get('origin');
      if (origin) {
        if (!ALLOWED_ORIGINS.has(origin)) {
          return NextResponse.json(
            { error: 'Forbidden: invalid origin' },
            { status: 403 },
          );
        }
      } else {
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
          } catch {
            return NextResponse.json(
              { error: 'Forbidden: malformed referer' },
              { status: 403 },
            );
          }
        } else {
          // Neither Origin nor Referer — reject
          return NextResponse.json(
            { error: 'Forbidden: missing origin' },
            { status: 403 },
          );
        }
      }
    }
  }

  // Check for session cookie (__hsafx prefix)
  const sessionCookie =
    request.cookies.get('__hsafx.session_token') ||
    request.cookies.get('__Secure-__hsafx.session_token');

  const isAuthenticated = !!sessionCookie?.value;
  const isPublic = isPublicPath(pathname);
  const isAuthOnly = isAuthOnlyPath(pathname);

  // Redirect authenticated users away from login page
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For authenticated users on protected (non-auth-only) routes,
  // verify the signed 2FA session cookie server-side.
  if (isAuthenticated && !isPublic && !isAuthOnly) {
    const tfaCookie = request.cookies.get(TFA_COOKIE_NAME)?.value;
    if (!tfaCookie) {
      return NextResponse.redirect(new URL('/verify-2fa', request.url));
    }
    const verifiedUserId = await verifyTfaCookie(tfaCookie);
    if (!verifiedUserId) {
      // Invalid or expired 2FA cookie — force re-verification
      const response = NextResponse.redirect(new URL('/verify-2fa', request.url));
      response.cookies.delete(TFA_COOKIE_NAME);
      return response;
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

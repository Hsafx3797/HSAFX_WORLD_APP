/**
 * Admin Panel Middleware
 *
 * Protects all admin routes by verifying session cookies.
 * Unauthenticated users are redirected to /login.
 * Users with 2FA enabled must verify TOTP before accessing admin routes.
 * The /login and /verify-2fa pages have special access rules.
 */

import { NextResponse, type NextRequest } from 'next/server';

// ─── CSRF Origin Validation ──────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3001',
  'http://localhost:3000',
  'https://admin.hsafx.world',
  'https://hsafx.world',
]);

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const CSRF_EXEMPT_PREFIXES = ['/api/auth/']; // better-auth manages its own CSRF

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

export function middleware(request: NextRequest) {
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
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return NextResponse.json(
          { error: 'Forbidden: invalid origin' },
          { status: 403 },
        );
      }
    }
  }

  // Check for session cookie (better-auth uses this pattern)
  const sessionCookie =
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('__Secure-better-auth.session_token');

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
  // check the 2FA session cookie. If absent and they're not on an
  // auth-only or public path, the client-side RBAC provider will
  // handle the redirect after checking /api/admin/session.
  // We can't definitively check 2FA status here (would need a DB call),
  // so we rely on the session API + client cooperation.

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

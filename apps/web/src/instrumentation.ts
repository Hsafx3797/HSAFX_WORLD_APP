/**
 * Next.js Instrumentation — startup-time validation
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Validates that critical environment variables are present before
 * the server starts handling requests. Fails loud and early in production.
 */

export async function register() {
  // Only validate on the Node.js server runtime (not Edge)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const required: { name: string; condition: () => boolean }[] = [
    // ── Core infrastructure ──
    {
      name: 'DATABASE_URL',
      condition: () => !!process.env.DATABASE_URL,
    },
    {
      name: 'UPSTASH_REDIS_REST_URL',
      condition: () => !!process.env.UPSTASH_REDIS_REST_URL,
    },
    {
      name: 'UPSTASH_REDIS_REST_TOKEN',
      condition: () => !!process.env.UPSTASH_REDIS_REST_TOKEN,
    },
    // ── Authentication ──
    {
      name: 'BETTER_AUTH_SECRET',
      condition: () => !!process.env.BETTER_AUTH_SECRET,
    },
    {
      name: 'NEXT_PUBLIC_APP_URL',
      condition: () => !!process.env.NEXT_PUBLIC_APP_URL,
    },
    // ── Internal services ──
    {
      name: 'INTERNAL_API_SECRET',
      condition: () => !!process.env.INTERNAL_API_SECRET,
    },
    {
      name: 'CRON_SECRET',
      condition: () => !!process.env.CRON_SECRET,
    },
  ];

  // Optional but recommended — warn if missing so bad config doesn't hide at runtime
  const recommended: { name: string; condition: () => boolean }[] = [
    { name: 'RESEND_API_KEY', condition: () => !!process.env.RESEND_API_KEY },
    { name: 'STRIPE_SECRET_KEY', condition: () => !!process.env.STRIPE_SECRET_KEY },
    { name: 'STRIPE_WEBHOOK_SECRET', condition: () => !!process.env.STRIPE_WEBHOOK_SECRET },
    { name: 'POLAR_ACCESS_TOKEN', condition: () => !!process.env.POLAR_ACCESS_TOKEN },
    { name: 'POLAR_WEBHOOK_SECRET', condition: () => !!process.env.POLAR_WEBHOOK_SECRET },
  ];

  const missing = required.filter((v) => !v.condition()).map((v) => v.name);

  if (missing.length > 0) {
    const message = `[instrumentation] Missing required environment variables: ${missing.join(', ')}`;

    if (process.env.NODE_ENV === 'production') {
      // Hard fail in production — do not start a broken server
      throw new Error(message);
    }

    // Warn in development/test — allow startup for local dev without full infra
    console.warn(message);
  }

  // Warn about recommended vars (dev + production)
  const missingRecommended = recommended.filter((v) => !v.condition()).map((v) => v.name);
  if (missingRecommended.length > 0) {
    console.warn(
      `[instrumentation] Missing recommended environment variables (features may be unavailable): ${missingRecommended.join(', ')}`,
    );
  }
}

/**
 * Next.js Instrumentation — startup-time validation for Admin Panel
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Validates that critical environment variables are present before
 * the server starts handling requests. Fails loud and early in production.
 */

export async function register() {
  // Only validate on the Node.js server runtime (not Edge)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const required: { name: string; condition: () => boolean }[] = [
    {
      name: 'DATABASE_URL',
      condition: () => !!process.env.DATABASE_URL,
    },
    {
      name: 'BETTER_AUTH_SECRET or AUTH_SECRET',
      condition: () =>
        !!(process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET),
    },
    {
      name: 'NEXT_PUBLIC_APP_URL',
      condition: () => !!process.env.NEXT_PUBLIC_APP_URL,
    },
    {
      name: 'UPSTASH_REDIS_REST_URL',
      condition: () => !!process.env.UPSTASH_REDIS_REST_URL,
    },
    {
      name: 'UPSTASH_REDIS_REST_TOKEN',
      condition: () => !!process.env.UPSTASH_REDIS_REST_TOKEN,
    },
  ];

  const missing = required.filter((v) => !v.condition()).map((v) => v.name);

  if (missing.length > 0) {
    const message = `[admin:instrumentation] Missing required environment variables: ${missing.join(', ')}`;

    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }

    console.warn(message);
  }
}

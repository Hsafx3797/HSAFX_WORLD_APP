/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  reactStrictMode: true,
  serverExternalPackages: [
    '@opentelemetry/sdk-node',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/resources',
    '@opentelemetry/api',
    '@opentelemetry/semantic-conventions',
    'prom-client',
    'pino',
    'pino-pretty',
  ],
  transpilePackages: [
    '@hsafx/config',
    '@hsafx/db',
    '@hsafx/schemas',
    '@hsafx/shared',
    '@hsafx/api',
    '@hsafx/theme',
    '@hsafx/tool-execution',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google avatars
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub avatars
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com', // Facebook avatars
      },
      {
        protocol: 'https',
        hostname: 'uploads.hsafx.world', // R2 uploads
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_FASTAPI_URL: process.env.NEXT_PUBLIC_FASTAPI_URL,
  },
  webpack: (config, { isServer, nextRuntime, webpack }) => {
    if (isServer && nextRuntime === 'nodejs') {
      // @opentelemetry/sdk-node transitively imports gRPC exporters we don't use.
      // serverExternalPackages doesn't apply to instrumentation.ts, so we
      // explicitly tell webpack to treat these as Node.js native requires.
      config.externals.push(
        '@opentelemetry/sdk-node',
        '@opentelemetry/exporter-trace-otlp-http',
        '@opentelemetry/resources',
        '@opentelemetry/api',
        '@opentelemetry/semantic-conventions',
        'prom-client',
        'pino',
        'pino-pretty',
      );
    }

    if (isServer && nextRuntime === 'edge') {
      // Edge runtime can't bundle Node.js-only telemetry packages.
      // Replace the real telemetry module with a noop for the Edge build.
      // instrumentation.ts guards with NEXT_RUNTIME !== 'nodejs' so
      // telemetry code is never actually called in Edge.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /lib\/telemetry$/,
          resolve(__dirname, 'src/lib/telemetry-noop.ts'),
        ),
      );
    }

    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.upstash.io https://*.polar.sh https://*.stripe.com",
              "frame-src 'self' https://*.stripe.com https://*.hcaptcha.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      {
        // Serve WASM binaries with the correct MIME type
        source: '/wasm/:path*',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async rewrites() {
    // NOTE: Rewrite disabled — B2B API routes are served by Next.js API routes
    // in apps/web/src/app/api/v1/. Only enable when FastAPI handles /api/v1/*.
    // return [
    //   {
    //     source: '/api/v1/:path*',
    //     destination: `${process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'}/api/v1/:path*`,
    //   },
    // ];
    return [];
  },
  async redirects() {
    return [
      { source: '/login', destination: '/auth/signin', permanent: true },
      { source: '/register', destination: '/auth/signup', permanent: true },
      { source: '/auth/login', destination: '/auth/signin', permanent: true },
      { source: '/auth/register', destination: '/auth/signup', permanent: true },
    ];
  },
};

export default nextConfig;

// Edge-safe noop — replaces telemetry.ts in Edge builds via webpack alias.
// The actual telemetry code uses Node.js-only packages (@opentelemetry, prom-client)
// that can't be bundled for the Edge runtime. Since instrumentation.ts guards with
// NEXT_RUNTIME !== 'nodejs', telemetry is never called in Edge — this noop satisfies webpack.
export function initTracing() {}

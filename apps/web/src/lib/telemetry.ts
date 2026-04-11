/**
 * OpenTelemetry Distributed Tracing & Prometheus Metrics
 *
 * Tracing: Enabled when OTEL_EXPORTER_OTLP_ENDPOINT is set.
 *          Exports traces via OTLP/HTTP to any compatible collector (Jaeger, Grafana Tempo, etc.)
 *
 * Metrics: prom-client counters/histograms, scraped via GET /api/metrics.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { trace, SpanStatusCode, type Span } from '@opentelemetry/api';
import client from 'prom-client';

// ─── OTel SDK ───────────────────────────────────────────────

let _sdk: NodeSDK | null = null;

export function initTracing(): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    console.info('[telemetry] OTEL_EXPORTER_OTLP_ENDPOINT not set — tracing disabled');
    return;
  }

  if (_sdk) return;

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'hsafx-web',
    [ATTR_SERVICE_VERSION]: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
    'deployment.environment': process.env.NODE_ENV ?? 'development',
  });

  _sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
  });

  _sdk.start();
  console.info(`[telemetry] OTel tracing started → ${endpoint}`);
}

export function shutdownTracing(): Promise<void> {
  return _sdk?.shutdown() ?? Promise.resolve();
}

// ─── Tracer helper ──────────────────────────────────────────

const tracer = trace.getTracer('hsafx-web');

export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err instanceof Error ? err.message : String(err) });
      span.recordException(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      span.end();
    }
  });
}

// ─── Prometheus Metrics ─────────────────────────────────────

// Guard: prom-client is externalized (shared singleton) but this module
// can be evaluated by multiple webpack route bundles — avoid double-registration.
function getOrCreate<T extends client.Metric>(name: string, create: () => T): T {
  return (client.register.getSingleMetric(name) as T | undefined) ?? create();
}

if (!client.register.getSingleMetric('hsafx_process_cpu_user_seconds_total')) {
  client.collectDefaultMetrics({ prefix: 'hsafx_' });
}

export const httpRequestDuration = getOrCreate('hsafx_http_request_duration_seconds', () => new client.Histogram({
  name: 'hsafx_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
}));

export const engineExecutionDuration = getOrCreate('hsafx_engine_execution_duration_seconds', () => new client.Histogram({
  name: 'hsafx_engine_execution_duration_seconds',
  help: 'Engine execution duration in seconds',
  labelNames: ['engine', 'backend', 'status'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
}));

export const engineExecutionTotal = getOrCreate('hsafx_engine_executions_total', () => new client.Counter({
  name: 'hsafx_engine_executions_total',
  help: 'Total engine executions',
  labelNames: ['engine', 'backend', 'status'] as const,
}));

export const apiKeyAuthTotal = getOrCreate('hsafx_api_key_auth_total', () => new client.Counter({
  name: 'hsafx_api_key_auth_total',
  help: 'Total API key authentication attempts',
  labelNames: ['result'] as const,
}));

export const jobsTotal = getOrCreate('hsafx_jobs_total', () => new client.Counter({
  name: 'hsafx_jobs_total',
  help: 'Total jobs created',
  labelNames: ['engine', 'status'] as const,
}));

export const metricsRegistry = client.register;

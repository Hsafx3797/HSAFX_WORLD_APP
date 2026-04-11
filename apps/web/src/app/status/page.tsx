'use client';

import { useState, useEffect, useCallback } from 'react';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'checking';
  latency?: number;
  message?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || '';

async function checkEndpoint(url: string, timeout = 5000): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(id);
    return { ok: res.ok, latency: Date.now() - start };
  } catch {
    return { ok: false, latency: Date.now() - start };
  }
}

export default function StatusPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Web Application', status: 'checking' },
    { name: 'API Server', status: 'checking' },
    { name: 'Authentication', status: 'checking' },
    { name: 'Database', status: 'checking' },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runChecks = useCallback(async () => {
    setIsRefreshing(true);
    const results: HealthCheck[] = [];

    // Check 1: Web Application (self-ping)
    const webResult = await checkEndpoint(`${API_BASE}/api/health`);
    results.push({
      name: 'Web Application',
      status: webResult.ok ? 'healthy' : 'down',
      latency: webResult.latency,
      message: webResult.ok ? 'Responding normally' : 'Not responding',
    });

    // Check 2: API Server (FastAPI backend)
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const apiResult = await checkEndpoint(`${apiBase}/health`);
    results.push({
      name: 'API Server',
      status: apiResult.ok ? 'healthy' : apiResult.latency > 3000 ? 'degraded' : 'down',
      latency: apiResult.latency,
      message: apiResult.ok
        ? `Responding in ${apiResult.latency}ms`
        : 'Not responding',
    });

    // Check 3: Authentication
    const authResult = await checkEndpoint(`${API_BASE}/api/auth/session`);
    results.push({
      name: 'Authentication',
      status: authResult.ok ? 'healthy' : 'down',
      latency: authResult.latency,
      message: authResult.ok ? 'Auth service operational' : 'Auth service unavailable',
    });

    // Check 4: Database (through API)
    // We use a tRPC call alternative — the billing plans endpoint is a lightweight DB query
    const dbResult = await checkEndpoint(`${API_BASE}/api/trpc/billing.getPlans`);
    results.push({
      name: 'Database',
      status: dbResult.ok ? 'healthy' : dbResult.latency > 3000 ? 'degraded' : 'down',
      latency: dbResult.latency,
      message: dbResult.ok ? 'Connected and responding' : 'Connection issue',
    });

    setChecks(results);
    setLastChecked(new Date());
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    runChecks();
    const interval = setInterval(runChecks, 60_000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [runChecks]);

  const overallStatus = checks.every((c) => c.status === 'healthy')
    ? 'operational'
    : checks.some((c) => c.status === 'down')
      ? 'outage'
      : checks.some((c) => c.status === 'checking')
        ? 'checking'
        : 'degraded';

  const statusColors: Record<string, string> = {
    healthy: 'bg-success',
    degraded: 'bg-warning',
    down: 'bg-destructive',
    checking: 'bg-muted-foreground animate-pulse',
  };

  const overallColors: Record<string, string> = {
    operational: 'text-success bg-success/10 border-success/30',
    degraded: 'text-warning bg-warning/10 border-warning/30',
    outage: 'text-destructive bg-destructive/10 border-destructive/30',
    checking: 'text-muted-foreground bg-muted border-border',
  };

  const overallLabels: Record<string, string> = {
    operational: 'All Systems Operational',
    degraded: 'Partial Service Degradation',
    outage: 'Service Outage Detected',
    checking: 'Checking Status…',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">System Status</h1>
          <p className="text-muted-foreground">
            Real-time health checks for HSAFX World services
          </p>
        </div>

        {/* Overall Status Banner */}
        <div className={`rounded-lg border p-6 text-center mb-8 ${overallColors[overallStatus]}`}>
          <p className="text-xl font-semibold">{overallLabels[overallStatus]}</p>
          {lastChecked && (
            <p className="text-sm mt-1 opacity-75">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Health Checks */}
        <div className="space-y-3 mb-8">
          {checks.map((check) => (
            <div
              key={check.name}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusColors[check.status]}`} />
                <div>
                  <p className="font-medium">{check.name}</p>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                </div>
              </div>
              {check.latency !== undefined && (
                <span className="text-sm text-muted-foreground font-mono">
                  {check.latency}ms
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={runChecks}
            disabled={isRefreshing}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isRefreshing ? 'Checking…' : 'Refresh Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

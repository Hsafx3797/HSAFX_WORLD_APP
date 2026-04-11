'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  canceled: 'destructive',
  past_due: 'destructive',
  suspended: 'outline',
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function B2bDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { data: sub, isLoading: subLoading } = trpc.b2b.getMySubscription.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: usage, isLoading: usageLoading } = trpc.b2b.getMyUsage.useQuery(undefined, {
    enabled: !!user,
  });
  const portalMutation = trpc.b2b.createPortalSession.useMutation();
  const [processing, setProcessing] = useState(false);

  // Handle checkout success redirect
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast.success('Subscription activated! Your API plan is now active.');
      // Clean up the query param
      router.replace('/dashboard/api');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [authLoading, user, router]);

  if (authLoading || subLoading || !user) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // No B2B subscription
  if (!sub) {
    return (
      <div className="container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">API Subscription</h1>
          <p className="text-muted-foreground mt-1">Manage your B2B API subscription</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No API Subscription</h3>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have an active B2B API plan. Subscribe to access our engine APIs programmatically.
            </p>
            <Button asChild>
              <Link href="/pricing">View API Plans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const price = (sub.billingCycle === 'monthly' ? sub.priceMonthlyCents : sub.priceYearlyCents) ?? 0;
  const statusColor = STATUS_COLORS[sub.status] ?? 'outline';

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your B2B API subscription and view usage</p>
      </div>

      {/* Plan Overview */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                {sub.planName}
                <Badge variant={statusColor}>{sub.status.replace('_', ' ')}</Badge>
                {sub.cancelAtPeriodEnd && <Badge variant="outline">Canceling at period end</Badge>}
              </CardTitle>
              <CardDescription className="mt-1">
                {formatPrice(price)} / {sub.billingCycle === 'monthly' ? 'month' : 'year'}
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/pricing">Change Plan</Link>
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                setProcessing(true);
                try {
                  const result = await portalMutation.mutateAsync();
                  if (result.portalUrl) window.location.href = result.portalUrl;
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to open billing portal');
                } finally {
                  setProcessing(false);
                }
              }}
              disabled={processing}
            >
              {processing ? 'Loading...' : 'Manage Billing'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Billing Cycle</p>
              <p className="font-semibold capitalize">{sub.billingCycle}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Current Period Start</p>
              <p className="font-semibold">
                {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : '—'}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Current Period End</p>
              <p className="font-semibold">
                {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>API Usage — Current Period</CardTitle>
          <CardDescription>Operations used per suite this billing cycle</CardDescription>
        </CardHeader>
        <CardContent>
          {usageLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : !usage || usage.usage.length === 0 ? (
            <p className="text-sm text-muted-foreground">No usage recorded this period.</p>
          ) : (
            <div className="space-y-4">
              {usage.usage.map((u) => {
                const pct = u.monthlyLimit > 0 ? Math.min((u.usageCount / u.monthlyLimit) * 100, 100) : 0;
                const isHigh = pct >= 80;
                return (
                  <div key={u.suiteId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{u.suiteName}</span>
                      <span className="text-xs text-muted-foreground">
                        {u.usageCount.toLocaleString()} / {u.monthlyLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${isHigh ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/api/usage">View Detailed Usage →</Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1">API Keys</h3>
            <p className="text-sm text-muted-foreground mb-3">Manage your API keys and scopes</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/api-keys">Manage Keys</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1">API Documentation</h3>
            <p className="text-sm text-muted-foreground mb-3">Explore engine API reference and examples</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/api-docs">View Docs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

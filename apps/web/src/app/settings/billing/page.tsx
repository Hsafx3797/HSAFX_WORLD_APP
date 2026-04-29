'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/use-subscription';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function BillingSettingsPage() {
  const { subscription, isLoading: subLoading, isPro, isAdvance } = useSubscription();
  const { data: allPlans } = trpc.billing.getPlans.useQuery();
  const { data: b2bSub } = trpc.b2b.getMySubscription.useQuery();
  const portalMutation = trpc.b2b.createPortalSession.useMutation();
  const [processing, setProcessing] = useState(false);

  const hasPaid = isPro || isAdvance;
  const currentPlanSlug = subscription?.plan ?? 'free';
  const currentPlan = allPlans?.find(p => p.slug === currentPlanSlug);

  const handleReactivate = async () => {
    setProcessing(true);
    // Reactivate handled via Polar portal
    setProcessing(false);
  };

  if (subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/settings" className="hover:text-foreground">Settings</Link>
            <span>/</span>
            <span>Billing</span>
          </div>
          <h1 className="text-3xl font-bold">Billing & Payments</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription, payment methods, and view invoices
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl space-y-8">
          {/* Current Plan Overview */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Current Plan</h2>
              <Link href="/pricing" className="text-sm text-primary hover:underline">Change Plan</Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold text-lg">{currentPlan?.name ?? 'Free'} Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.status === 'active'
                      ? subscription.cancelAtPeriodEnd
                        ? `Cancels on ${new Date(subscription.currentPeriodEnd || '').toLocaleDateString()}`
                        : `Renews on ${new Date(subscription.currentPeriodEnd || '').toLocaleDateString()}`
                      : 'No active subscription'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  ${((currentPlan?.priceMonthlyCents ?? 0) / 100).toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </div>
            </div>

            {subscription?.cancelAtPeriodEnd && (
              <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm">Your subscription is set to cancel. You keep access until the end of your billing period.</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleReactivate} disabled={processing}>
                  {processing ? 'Processing...' : 'Reactivate'}
                </Button>
              </div>
            )}

          </section>

          {/* Payment Methods — Managed externally by Polar */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Payment methods are managed through Polar. Both subscriptions and coin purchases are handled through Polar.
            </p>
            {hasPaid && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/subscription">Manage Subscription</Link>
              </Button>
            )}
          </section>

          {/* B2B API Subscription */}
          {b2bSub && (
            <section className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">API Subscription</h2>
                <Badge variant={b2bSub.status === 'active' ? 'default' : 'destructive'}>{b2bSub.status}</Badge>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{b2bSub.planName} Plan</h3>
                    <p className="text-sm text-muted-foreground capitalize">{b2bSub.billingCycle} billing</p>
                  </div>
                  <p className="text-xl font-bold">
                    ${(((b2bSub.billingCycle === 'monthly' ? b2bSub.priceMonthlyCents : b2bSub.priceYearlyCents) ?? 0) / 100).toFixed(0)}
                    <span className="text-sm font-normal text-muted-foreground">/{b2bSub.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/api">View Dashboard</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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
            </section>
          )}

        </div>
      </div>
    </div>
  );
}

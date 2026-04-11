'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/use-subscription';
import { useCoins } from '@/hooks/use-coins';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BillingSettingsPage() {
  const { subscription, isLoading: subLoading, isPro, isAdvance, cancel, reactivate } = useSubscription();
  const { balance } = useCoins();
  const { data: allPlans } = trpc.billing.getPlans.useQuery();
  const { data: invoiceData, isLoading: invLoading } = trpc.billing.getInvoices.useQuery({ page: 1, pageSize: 20 });
  const [processing, setProcessing] = useState(false);

  const hasPaid = isPro || isAdvance;
  const currentPlanSlug = subscription?.plan ?? 'free';
  const currentPlan = allPlans?.find(p => p.slug === currentPlanSlug);
  const invoices = invoiceData?.items ?? [];

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel? You keep access until the end of your billing period.')) return;
    setProcessing(true);
    const result = await cancel(false);
    if (!result.success) alert(result.error);
    setProcessing(false);
  };

  const handleReactivate = async () => {
    setProcessing(true);
    const result = await reactivate();
    if (!result.success) alert(result.error);
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

            {/* Coin Balance */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="font-medium">Coin Balance</h3>
                <p className="text-sm text-muted-foreground">For premium tool usage</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold">{balance}</span>
                <Link
                  href="/dashboard/coins"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Buy Coins
                </Link>
              </div>
            </div>
          </section>

          {/* Payment Methods — Managed externally by Polar/Stripe */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Payment methods are managed by our payment providers. Subscriptions are handled through Polar, and coin purchases through Stripe.
            </p>
            {hasPaid && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/subscription">Manage Subscription</Link>
              </Button>
            )}
          </section>

          {/* Billing History — from DB */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6">Billing History</h2>

            {invLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-4 bg-muted rounded w-16" />
                  </div>
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No invoices yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Invoice #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border last:border-0">
                        <td className="py-4 px-4 text-sm">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4 font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="py-4 px-4 text-sm font-medium">${(inv.amountCents / 100).toFixed(2)} {inv.currency}</td>
                        <td className="py-4 px-4">
                          <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'pending' ? 'secondary' : 'destructive'}>
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Cancel Subscription */}
          {hasPaid && !subscription?.cancelAtPeriodEnd && (
            <section className="bg-card border border-destructive/30 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-destructive">Cancel Subscription</h2>
              <p className="text-sm text-muted-foreground mb-4">
                If you cancel your subscription, you&apos;ll lose access to premium features at the end of your current billing period.
              </p>
              <Button variant="outline" className="text-destructive border-destructive" onClick={handleCancel} disabled={processing}>
                {processing ? 'Processing...' : 'Cancel Subscription'}
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    subscription,
    isLoading,
    isPro,
    cancel,
    reactivate,
    manageBilling,
  } = useSubscription();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    setProcessing(true);
    const result = await cancel(false);
    
    if (!result.success) {
      alert(result.error);
    }
    
    setProcessing(false);
  };

  const handleReactivate = async () => {
    setProcessing(true);
    const result = await reactivate();
    
    if (!result.success) {
      alert(result.error);
    }
    
    setProcessing(false);
  };

  const handleManageBilling = async () => {
    setProcessing(true);
    const result = await manageBilling();
    
    if (result.success && result.portalUrl) {
      window.location.href = result.portalUrl;
    } else {
      alert(result.error || 'Failed to open billing portal');
    }
    
    setProcessing(false);
  };

  if (authLoading || isLoading || !user) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and billing</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan: <span className="capitalize">{user.tier}</span>
                {isPro && <Badge variant="default">Active</Badge>}
                {subscription?.cancelAtPeriodEnd && <Badge variant="warning">Canceling</Badge>}
              </CardTitle>
              <CardDescription>
                {subscription?.status === 'active'
                  ? `Your subscription ${subscription.cancelAtPeriodEnd ? 'will end' : 'renews'} on ${subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}`
                  : 'You are currently on the free plan'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPro ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-1">Plan</h4>
                  <p className="text-2xl font-bold capitalize">{subscription?.plan || user.tier}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-1">Status</h4>
                  <p className="text-2xl font-bold capitalize">{subscription?.status || 'Active'}</p>
                </div>
              </div>

              {subscription?.cancelAtPeriodEnd && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm">
                    Your subscription is set to cancel at the end of your billing period. You will retain access until{' '}
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : 'the end of your billing period'}
                    .
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleReactivate} disabled={processing}>
                    {processing ? 'Processing...' : 'Reactivate Subscription'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Upgrade to Pro to unlock premium features and more tools
              </p>
              <Button onClick={() => router.push('/pricing')}>View Plans</Button>
            </div>
          )}
        </CardContent>
        {isPro && !subscription?.cancelAtPeriodEnd && (
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={handleManageBilling} disabled={processing}>
              Manage Billing
            </Button>
            <Button variant="ghost" className="text-destructive" onClick={handleCancel} disabled={processing}>
              Cancel Subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Your Plan Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isPro ? (
              <>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unlimited tool executions</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Access to all Pro tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority processing</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>API access</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>500 coins per month</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>100 tool executions per day</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Access to free tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>10 daily bonus coins</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>No API access</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>No Pro tools access</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCoins } from '@/hooks/use-coins';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { balance, dailyBonusAvailable, claimDailyBonus } = useCoins();
  const { subscription, isPro } = useSubscription();

  if (authLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleClaimBonus = async () => {
    const result = await claimDailyBonus();
    if (result.success) {
      // Show success toast
    }
  };

  return (
    <div className="container py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user.name || user.email.split('@')[0]}!</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your account
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Coin Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Coin Balance</CardDescription>
            <CardTitle className="text-3xl">{balance}</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyBonusAvailable && (
              <Button size="sm" onClick={handleClaimBonus}>
                Claim Daily Bonus
              </Button>
            )}
            {!dailyBonusAvailable && (
              <p className="text-sm text-muted-foreground">Daily bonus claimed</p>
            )}
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Subscription</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <span className="capitalize">{user.tier}</span>
              <Badge variant={isPro ? 'default' : 'secondary'}>
                {isPro ? 'Active' : 'Free'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isPro && (
              <Link href="/pricing">
                <Button size="sm" variant="outline">
                  Upgrade
                </Button>
              </Link>
            )}
            {isPro && subscription?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tools Used */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tools Available</CardDescription>
            <CardTitle className="text-3xl">448+</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/tools">
              <Button size="sm" variant="outline">
                Browse Tools
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Executions Today */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Executions Today</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/history">
              <Button size="sm" variant="outline">
                View History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/tools">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold">Use a Tool</h3>
                  <p className="text-sm text-muted-foreground">Browse 448+ available tools</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/favorites">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold">Favorites</h3>
                  <p className="text-sm text-muted-foreground">Access your saved tools</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/history">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold">History</h3>
                  <p className="text-sm text-muted-foreground">View recent activity</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/api-keys">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-chart-4"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold">API Keys</h3>
                  <p className="text-sm text-muted-foreground">Manage API access</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold">Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage your account</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pricing">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold">Upgrade</h3>
                  <p className="text-sm text-muted-foreground">Get more features</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <p>No recent activity</p>
              <p className="text-sm mt-1">Start using tools to see your history here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

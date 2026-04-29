'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCoins } from '@/hooks/use-coins';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CoinsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { balance, transactions, dailyBonusAvailable, claimDailyBonus, purchaseCoins, isLoading } = useCoins();
  const { data: coinPacks, isLoading: packsLoading } = trpc.billing.getCoinPacks.useQuery();
  const { data: subscriptionData, isLoading: subLoading } = trpc.billing.getMySubscription.useQuery(
    undefined,
    { enabled: !!user },
  );
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }
    if (!authLoading && !subLoading && user && subscriptionData) {
      const isPaid =
        subscriptionData.plan.slug !== 'free' &&
        subscriptionData.derivedStatus !== 'expired';
      if (!isPaid) router.push('/pricing');
    }
  }, [authLoading, subLoading, user, subscriptionData, router]);

  const handleClaimBonus = async () => {
    const result = await claimDailyBonus();
    if (!result.success) alert(result.error);
  };

  const handlePurchase = async (packId: string) => {
    setPurchasing(true);
    const result = await purchaseCoins(packId);
    if (result.success && result.checkoutUrl) window.location.href = result.checkoutUrl;
    else alert(result.error || 'Failed to create checkout');
    setPurchasing(false);
  };

  if (authLoading || !user || subLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Coins</h1>
        <p className="text-muted-foreground mt-1">Manage your coin balance and purchase more</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Balance Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardDescription>Current Balance</CardDescription>
              <CardTitle className="text-4xl">{balance} coins</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyBonusAvailable ? (
                <Button className="w-full" onClick={handleClaimBonus} disabled={isLoading}>
                  {isLoading ? 'Claiming...' : 'Claim Daily Bonus (+10 coins)'}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Daily bonus already claimed. Come back tomorrow!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Purchase Options — from DB */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Coins</CardTitle>
              <CardDescription>Get more coins to use premium tools</CardDescription>
            </CardHeader>
            <CardContent>
              {packsLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-7 bg-muted rounded w-24 mb-2" />
                      <div className="h-5 bg-muted rounded w-16 mb-4" />
                      <div className="h-9 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(coinPacks ?? []).map((pack, idx) => {
                    const isPopular = idx === 1; // second pack highlighted
                    const pricePerCoin = pack.priceInCents / pack.coins;
                    return (
                      <div
                        key={pack.id}
                        className={`relative p-4 border rounded-lg ${isPopular ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                      >
                        {isPopular && <Badge className="absolute -top-2 -right-2" variant="default">Popular</Badge>}
                        <div className="text-2xl font-bold">{pack.coins.toLocaleString()} coins</div>
                        <div className="text-lg text-muted-foreground">${(pack.priceInCents / 100).toFixed(2)}</div>
                        {pack.bonusCoins > 0 && (
                          <Badge variant="secondary" className="mt-1">+{pack.bonusCoins} bonus</Badge>
                        )}
                        <div className="text-sm text-muted-foreground mb-4">
                          {pricePerCoin.toFixed(1)}¢ per coin
                        </div>
                        <Button
                          variant={isPopular ? 'default' : 'outline'}
                          className="w-full"
                          onClick={() => handlePurchase(pack.id)}
                          disabled={purchasing}
                        >
                          {purchasing ? 'Processing...' : 'Purchase'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your recent coin transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium capitalize">
                        {tx.transactionType.replace('_', ' ')}
                      </p>
                      {tx.description && (
                        <p className="text-sm text-muted-foreground">{tx.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          tx.amount > 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}{tx.amount} coins
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance: {tx.balanceAfter}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

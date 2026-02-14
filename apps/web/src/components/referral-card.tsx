'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function ReferralCard() {
  const [copied, setCopied] = useState(false);
  const statsQuery = trpc.user.getReferralStats.useQuery();

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopy = async () => {
    if (!statsQuery.data?.referralCode) return;
    const link = `${appUrl}?ref=${statsQuery.data.referralCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (statsQuery.isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-5 bg-muted rounded w-1/3 mb-4" />
        <div className="h-4 bg-muted rounded w-2/3 mb-6" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  const data = statsQuery.data;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🎁</span>
        <h3 className="text-lg font-semibold">Refer a Friend</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Invite friends and earn 50 coins for each signup!
      </p>

      {/* Referral Link */}
      <div className="flex items-center gap-2 mb-6">
        <code className="flex-1 px-3 py-2 bg-muted border border-border rounded text-sm font-mono truncate">
          {data?.referralCode
            ? `${appUrl}?ref=${data.referralCode}`
            : 'Loading...'}
        </code>
        <button
          onClick={handleCopy}
          disabled={!data?.referralCode}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold">{data?.totalReferred ?? 0}</p>
          <p className="text-xs text-muted-foreground">Referred</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold">{data?.totalActivated ?? 0}</p>
          <p className="text-xs text-muted-foreground">Activated</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold text-amber-500">
            {data?.totalCoinsEarned ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Coins Earned</p>
        </div>
      </div>
    </div>
  );
}

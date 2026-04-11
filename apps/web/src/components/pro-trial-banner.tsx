'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface ToolMetadata {
  id: string;
  tier: string;
}
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProTrialBannerProps {
  tool: ToolMetadata;
  onTrialActivated: () => void;
}

export function ProTrialBanner({ tool, onTrialActivated }: ProTrialBannerProps) {
  const { isAuthenticated } = useAuth();
  const { isPro, isAdvance } = useSubscription();
  const [trialUsed, setTrialUsed] = useState(false);

  // Only show for pro tools when user is free/guest
  if (tool.tier !== 'pro' || isPro || isAdvance) return null;

  const trialQuery = trpc.tools.getTrialStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const useTrialMutation = trpc.tools.useProTrial.useMutation({
    onSuccess: () => {
      setTrialUsed(true);
      trialQuery.refetch();
      onTrialActivated();
      toast.success('Free trial activated! You can now use this tool.');
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
        <p className="text-sm text-foreground">
          ⭐ This is a <strong>Pro</strong> tool. Sign in to get 1 free trial per day.
        </p>
      </div>
    );
  }

  const remaining = trialQuery.data?.trialsRemaining ?? 0;

  if (trialUsed) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/10 p-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-success text-success-foreground">✓ Trial Active</Badge>
          <p className="text-sm text-foreground">
            You&apos;re using a free trial of this Pro tool. Enjoy!
          </p>
        </div>
      </div>
    );
  }

  if (remaining > 0) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-warning text-warning-foreground">⭐ Free Trial</Badge>
            <p className="text-sm text-foreground">
              This is a Pro tool. You have <strong>{remaining} free trial{remaining !== 1 ? 's' : ''}</strong> remaining today.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => useTrialMutation.mutate({ toolId: tool.id })}
            disabled={useTrialMutation.isPending}
            className="shrink-0"
          >
            {useTrialMutation.isPending ? 'Activating...' : 'Try for Free'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            ⭐ This is a <strong>Pro</strong> tool. You&apos;ve used your free trial today.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upgrade to Pro for unlimited access, or come back tomorrow for another free trial.
          </p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0" asChild>
          <a href="/pricing">Upgrade to Pro</a>
        </Button>
      </div>
    </div>
  );
}

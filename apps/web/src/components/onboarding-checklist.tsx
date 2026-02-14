'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const CHECKLIST_STEPS = [
  { key: 'use_tool', label: 'Use your first tool', href: '/tools' },
  { key: 'favorite_tool', label: 'Favorite a tool', href: '/tools' },
  { key: 'claim_bonus', label: 'Claim daily bonus', href: '/dashboard' },
  { key: 'complete_profile', label: 'Complete your profile', href: '/settings' },
  { key: 'try_pro_tool', label: 'Try a Pro tool', href: '/tools' },
] as const;

export function OnboardingChecklist() {
  const checklistQuery = trpc.user.getChecklist.useQuery();
  const completeMutation = trpc.user.completeChecklistStep.useMutation({
    onSuccess: (data) => {
      if (!data.alreadyCompleted && data.coinsAwarded > 0) {
        toast.success(`+${data.coinsAwarded} coins earned!`);
      }
      checklistQuery.refetch();
    },
  });

  const progress = useMemo(() => checklistQuery.data ?? {}, [checklistQuery.data]);
  const completedCount = CHECKLIST_STEPS.filter((s) => progress[s.key]).length;
  const allDone = completedCount === CHECKLIST_STEPS.length;

  const markStep = useCallback(
    (step: string) => {
      if (!progress[step]) {
        completeMutation.mutate({ step });
      }
    },
    [progress, completeMutation],
  );

  if (allDone) return null;

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Getting Started</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{CHECKLIST_STEPS.length} · 5 coins each
          </span>
        </CardTitle>
        {/* Progress bar */}
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(completedCount / CHECKLIST_STEPS.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {CHECKLIST_STEPS.map((step) => {
          const done = !!progress[step.key];
          return (
            <Link
              key={step.key}
              href={step.href}
              onClick={() => markStep(step.key)}
              className={`flex items-center gap-3 rounded-lg p-2.5 transition-colors ${
                done
                  ? 'text-muted-foreground line-through'
                  : 'hover:bg-muted'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border'
                }`}
              >
                {done ? '✓' : ''}
              </span>
              <span className="text-sm">{step.label}</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

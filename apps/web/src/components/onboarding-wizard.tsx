'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { CATEGORY_ENGINES } from '@/lib/engine-constants';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<string, string> = {
  text: '📝',
  data: '📊',
  media: '🎨',
  generate: '⚡',
  calculate: '🔢',
  convert: '🔄',
  validate: '✅',
};

const engineCategories = Object.keys(CATEGORY_ENGINES);

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [recommendedTools, setRecommendedTools] = useState<
    { id: string; name: string; category: string }[]
  >([]);

  const completeMutation = trpc.user.completeOnboarding.useMutation({
    onSuccess: () => {
      toast.success('Welcome aboard! 25 bonus coins added to your balance!');
      onComplete();
    },
  });

  const skipMutation = trpc.user.skipOnboarding.useMutation({
    onSuccess: () => onComplete(),
  });

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }, []);

  const goToStep2 = useCallback(() => {
    // Build recommended engines from selected categories (up to 6)
    const engines: typeof recommendedTools = [];
    for (const cat of selectedCategories) {
      const catEngines = CATEGORY_ENGINES[cat] ?? [];
      const picks = catEngines
        .slice(0, 2)
        .map((e) => ({
          id: e,
          name: e,
          category: cat,
        }));
      engines.push(...picks);
      if (engines.length >= 6) break;
    }
    setRecommendedTools(engines.slice(0, 6));
    setStep(2);
  }, [selectedCategories]);

  const goToStep3 = useCallback(() => {
    setStep(3);
  }, []);

  const handleTryTool = useCallback(
    (toolId: string) => {
      completeMutation.mutate({
        selectedCategories,
        firstToolUsed: toolId,
      });
      // TODO: Navigate to /tools/${toolId} once tool routes are built (Task 1000)
      router.push('/dashboard');
    },
    [completeMutation, selectedCategories, router],
  );

  const handleFinish = useCallback(() => {
    completeMutation.mutate({ selectedCategories });
  }, [completeMutation, selectedCategories]);

  const handleSkip = useCallback(() => {
    skipMutation.mutate();
  }, [skipMutation]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4">
      <div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-2xl">
        {/* Progress Indicator */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-1">Welcome to HSAFX World!</h2>
            <p className="text-muted-foreground mb-6">
              What do you mainly work with? Pick one or more:
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {engineCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                    selectedCategories.includes(cat)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <span className="text-2xl">{CATEGORY_ICONS[cat] ?? '🛠️'}</span>
                  <span className="font-medium">{cat}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip
              </Button>
              <Button
                onClick={goToStep2}
                disabled={selectedCategories.length === 0}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Recommended Tools */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-1">Your Recommended Tools</h2>
            <p className="text-muted-foreground mb-6">
              Based on your interests, here are some tools to get you started:
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {recommendedTools.map((tool) => (
                <Card
                  key={tool.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleTryTool(tool.id)}
                >
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">
                      {CATEGORY_ICONS[tool.category] ?? '🛠️'} {tool.category}
                    </p>
                    <p className="font-medium mt-1 truncate">{tool.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={goToStep3}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 3: Try One Now */}
        {step === 3 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">You&apos;re All Set!</h2>
            <p className="text-muted-foreground mb-2">
              Complete the wizard to earn <span className="font-bold text-primary">25 bonus coins</span>.
            </p>
            <p className="text-muted-foreground mb-6 text-sm">
              Try a tool from your recommendations, or jump right into the dashboard.
            </p>
            {recommendedTools.length > 0 && (
              <Button
                className="mb-3 w-full"
                onClick={() => handleTryTool(recommendedTools[0]!.id)}
              >
                Try {recommendedTools[0]!.name}
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleFinish}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? 'Saving…' : 'Go to Dashboard'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

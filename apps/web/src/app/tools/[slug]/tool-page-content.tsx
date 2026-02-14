'use client';

import { useState } from 'react';
import type { ToolMetadata } from '@/lib/tools/types';
import { ToolExecutor } from './tool-executor';
import { ProTrialBanner } from '@/components/pro-trial-banner';

interface ToolPageContentProps {
  tool: ToolMetadata;
}

export function ToolPageContent({ tool }: ToolPageContentProps) {
  const [trialActive, setTrialActive] = useState(false);

  return (
    <div className="space-y-4">
      {tool.tier === 'pro' && (
        <ProTrialBanner tool={tool} onTrialActivated={() => setTrialActive(true)} />
      )}
      <ToolExecutor tool={tool} />
    </div>
  );
}

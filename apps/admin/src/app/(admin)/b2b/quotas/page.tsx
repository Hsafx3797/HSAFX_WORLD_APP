/**
 * B2B Quotas Management Page
 * Matrix view of plan × suite quotas with inline editing.
 */

'use client';

import { useState, useCallback } from 'react';
import { Save } from 'lucide-react';
import { useB2bPlans, useB2bSuites, useB2bQuotas, useB2bQuotaMutations } from '@/lib/hooks';
import { Button } from '@/components/ui';
import { toast } from 'sonner';

export default function B2bQuotasPage() {
  const { plans, isLoading: plansLoading } = useB2bPlans();
  const { suites, isLoading: suitesLoading } = useB2bSuites();
  const { quotas, isLoading: quotasLoading, refresh } = useB2bQuotas();
  const mutations = useB2bQuotaMutations();

  // Track edited cells: key = `${planId}:${suiteId}`, value = monthlyLimit
  const [edits, setEdits] = useState<Record<string, number>>({});

  const getQuota = (planId: string, suiteId: string) =>
    quotas.find((q) => q.b2bPlanId === planId && q.b2bSuiteId === suiteId);

  const getCellKey = (planId: string, suiteId: string) => `${planId}:${suiteId}`;

  const getCellValue = (planId: string, suiteId: string): string => {
    const key = getCellKey(planId, suiteId);
    if (key in edits) return String(edits[key]);
    const q = getQuota(planId, suiteId);
    return q ? String(q.monthlyLimit) : '';
  };

  const handleEdit = (planId: string, suiteId: string, value: string) => {
    const key = getCellKey(planId, suiteId);
    const num = parseInt(value, 10);
    if (value === '' || value === '0') {
      setEdits((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    if (!isNaN(num) && num > 0) {
      setEdits((prev) => ({ ...prev, [key]: num }));
    }
  };

  const isDirty = (planId: string, suiteId: string): boolean => {
    const key = getCellKey(planId, suiteId);
    if (!(key in edits)) return false;
    const existing = getQuota(planId, suiteId);
    return !existing || existing.monthlyLimit !== edits[key];
  };

  const hasDirtyEdits = Object.keys(edits).some((key) => {
    const [planId, suiteId] = key.split(':');
    return isDirty(planId, suiteId);
  });

  const handleSaveAll = useCallback(async () => {
    const dirtyKeys = Object.keys(edits).filter((key) => {
      const [planId, suiteId] = key.split(':');
      return isDirty(planId, suiteId);
    });

    let saved = 0;
    for (const key of dirtyKeys) {
      const [planId, suiteId] = key.split(':');
      try {
        await mutations.upsert({ b2bPlanId: planId, b2bSuiteId: suiteId, monthlyLimit: edits[key] });
        saved++;
      } catch {
        toast.error(`Failed to save quota for ${key}`);
      }
    }

    if (saved > 0) {
      toast.success(`Saved ${saved} quota${saved > 1 ? 's' : ''}`);
      setEdits({});
      refresh();
    }
  }, [edits, mutations, refresh]);

  const isLoading = plansLoading || suitesLoading || quotasLoading;
  const activePlans = plans.filter((p) => p.isActive);
  const activeSuites = suites.filter((s) => s.isActive);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">B2B Quotas</h1>
          <p className="text-sm text-muted-foreground">Set monthly operation limits per plan per suite</p>
        </div>
        {hasDirtyEdits && (
          <Button onClick={handleSaveAll} loading={mutations.loading} icon={<Save className="h-4 w-4" />}>
            Save Changes
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : activePlans.length === 0 || activeSuites.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {activePlans.length === 0 ? 'No active B2B plans. Create plans first.' : 'No active B2B suites. Create suites first.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted/50">
                  Plan \ Suite
                </th>
                {activeSuites.map((suite) => (
                  <th key={suite.id} className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-35">
                    {suite.name}
                    <div className="text-[10px] font-normal normal-case">{suite.slug}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {activePlans.map((plan) => (
                <tr key={plan.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground sticky left-0 bg-background border-r border-border">
                    {plan.name}
                    <div className="text-xs text-muted-foreground font-normal">{plan.slug}</div>
                  </td>
                  {activeSuites.map((suite) => (
                    <td key={suite.id} className="px-2 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        value={getCellValue(plan.id, suite.id)}
                        onChange={(e) => handleEdit(plan.id, suite.id, e.target.value)}
                        placeholder="—"
                        className={`w-full px-2 py-1.5 text-sm text-center rounded border ${
                          isDirty(plan.id, suite.id)
                            ? 'border-primary bg-primary/5 font-semibold'
                            : 'border-input bg-background'
                        } focus:ring-2 focus:ring-ring focus:border-transparent`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Label component (inline to avoid import issues)
const Label = ({ htmlFor, className, children }: { htmlFor?: string; className?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className={cn('text-sm font-medium leading-none', className)}>{children}</label>
);
import { useCopyToClipboard } from '@/hooks/use-utils';

// ============== ICONS ==============
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
);

// ============== ZAKAT CALCULATOR ==============
export interface ZakatCalculatorProps {
  className?: string;
}

export function ZakatCalculator({ className }: ZakatCalculatorProps) {
  const [assets, setAssets] = React.useState({
    cash: 0,
    bankBalance: 0,
    goldValue: 0,
    silverValue: 0,
    investments: 0,
    businessInventory: 0,
    receivables: 0,
    propertyForSale: 0,
  });
  const [liabilities, setLiabilities] = React.useState({
    debts: 0,
    loansOwed: 0,
    unpaidBills: 0,
  });
  const [result, setResult] = React.useState<{
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    nisab: number;
    zakatDue: number;
    isEligible: boolean;
  } | null>(null);
  const { copy, copied } = useCopyToClipboard();

  // Current Nisab threshold (approximately 85 grams of gold or 595 grams of silver)
  // Using approximate USD values - in production, this would be fetched from an API
  const NISAB_GOLD = 5500; // ~85g gold at ~$65/gram
  const NISAB_SILVER = 450; // ~595g silver at ~$0.75/gram
  const ZAKAT_RATE = 0.025; // 2.5%

  const calculateZakat = () => {
    const totalAssets = Object.values(assets).reduce((sum, val) => sum + (val || 0), 0);
    const totalLiabilities = Object.values(liabilities).reduce((sum, val) => sum + (val || 0), 0);
    const netWorth = totalAssets - totalLiabilities;
    
    // Use silver Nisab as it's more accessible (lower threshold)
    const nisab = NISAB_SILVER;
    const isEligible = netWorth >= nisab;
    const zakatDue = isEligible ? netWorth * ZAKAT_RATE : 0;

    setResult({
      totalAssets,
      totalLiabilities,
      netWorth,
      nisab,
      zakatDue,
      isEligible,
    });
  };

  const updateAsset = (key: keyof typeof assets, value: string) => {
    setAssets(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const updateLiability = (key: keyof typeof liabilities, value: string) => {
    setLiabilities(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className={cn('w-full max-w-4xl mx-auto flex flex-col gap-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
          <MoonIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Zakat Calculator</h2>
          <p className="text-sm text-muted-foreground">
            Calculate your obligatory Zakat (2.5% of eligible wealth above Nisab)
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border flex gap-3">
        <InfoIcon className="shrink-0 text-muted-foreground mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">About Zakat</p>
          <p>Zakat is one of the Five Pillars of Islam. It is obligatory for Muslims who possess wealth above the Nisab threshold (minimum amount) for one lunar year.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Section */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-emerald-500">Assets</h3>
          <div className="space-y-4">
            {[
              { key: 'cash', label: 'Cash on Hand' },
              { key: 'bankBalance', label: 'Bank Balance' },
              { key: 'goldValue', label: 'Gold Value' },
              { key: 'silverValue', label: 'Silver Value' },
              { key: 'investments', label: 'Stocks & Investments' },
              { key: 'businessInventory', label: 'Business Inventory' },
              { key: 'receivables', label: 'Money Owed to You' },
              { key: 'propertyForSale', label: 'Property for Sale' },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={key} className="text-sm">{label}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id={key}
                    type="number"
                    value={assets[key as keyof typeof assets] || ''}
                    onChange={(e) => updateAsset(key as keyof typeof assets, e.target.value)}
                    className="pl-7 font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities Section */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-500">Liabilities (Deductions)</h3>
          <div className="space-y-4">
            {[
              { key: 'debts', label: 'Outstanding Debts' },
              { key: 'loansOwed', label: 'Loans Payable' },
              { key: 'unpaidBills', label: 'Unpaid Bills' },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={key} className="text-sm">{label}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id={key}
                    type="number"
                    value={liabilities[key as keyof typeof liabilities] || ''}
                    onChange={(e) => updateLiability(key as keyof typeof liabilities, e.target.value)}
                    className="pl-7 font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Current Nisab (Silver): ~{formatCurrency(NISAB_SILVER)}
            </p>
            <p className="text-xs text-muted-foreground">
              Current Nisab (Gold): ~{formatCurrency(NISAB_GOLD)}
            </p>
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <Button onClick={calculateZakat} size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
        <MoonIcon />
        Calculate Zakat
      </Button>

      {/* Results */}
      {result && (
        <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
          <h3 className="text-lg font-semibold mb-4">Calculation Results</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">Total Assets</p>
              <p className="font-mono font-semibold text-emerald-500">{formatCurrency(result.totalAssets)}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">Total Liabilities</p>
              <p className="font-mono font-semibold text-red-500">{formatCurrency(result.totalLiabilities)}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">Net Zakatable Wealth</p>
              <p className="font-mono font-semibold">{formatCurrency(result.netWorth)}</p>
            </div>
          </div>

          <div className={cn(
            'p-4 rounded-lg border-2 text-center',
            result.isEligible 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-muted border-border'
          )}>
            {result.isEligible ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">Your Zakat Due (2.5%)</p>
                <p className="text-3xl font-bold text-emerald-500 font-mono">
                  {formatCurrency(result.zakatDue)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => copy(result.zakatDue.toFixed(2))}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  <span className="ml-1">Copy Amount</span>
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Your wealth is below the Nisab threshold.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Zakat is not obligatory at this time.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        This calculator provides estimates only. Please consult with a qualified Islamic scholar for accurate guidance.
      </p>
    </div>
  );
}

// ============== INHERITANCE CALCULATOR ==============
export interface InheritanceCalculatorProps {
  className?: string;
}

interface Heir {
  id: string;
  name: string;
  relationship: string;
  share: string;
  amount: number;
}

export function InheritanceCalculator({ className }: InheritanceCalculatorProps) {
  const [estate, setEstate] = React.useState(0);
  const [debts, setDebts] = React.useState(0);
  const [bequest, setBequest] = React.useState(0);
  const [heirs, setHeirs] = React.useState({
    hasHusband: false,
    hasWife: false,
    wifeCount: 1,
    hasSons: false,
    sonCount: 0,
    hasDaughters: false,
    daughterCount: 0,
    hasFather: false,
    hasMother: false,
    hasBrothers: false,
    brotherCount: 0,
    hasSisters: false,
    sisterCount: 0,
  });
  const [result, setResult] = React.useState<{
    netEstate: number;
    heirs: Heir[];
  } | null>(null);

  const calculateInheritance = () => {
    // Calculate net estate after debts and bequest (max 1/3)
    const maxBequest = (estate - debts) / 3;
    const actualBequest = Math.min(bequest, maxBequest);
    const netEstate = estate - debts - actualBequest;

    if (netEstate <= 0) {
      setResult({ netEstate: 0, heirs: [] });
      return;
    }

    const calculatedHeirs: Heir[] = [];
    let remainingEstate = netEstate;

    // Fixed shares first (Ashabul Furudh)
    // This is a simplified calculation - real Islamic inheritance is more complex

    // Spouse shares
    if (heirs.hasHusband) {
      const share = heirs.hasSons || heirs.hasDaughters ? '1/4' : '1/2';
      const amount = heirs.hasSons || heirs.hasDaughters ? netEstate / 4 : netEstate / 2;
      calculatedHeirs.push({
        id: 'husband',
        name: 'Husband',
        relationship: 'Spouse',
        share,
        amount,
      });
      remainingEstate -= amount;
    }

    if (heirs.hasWife) {
      const share = heirs.hasSons || heirs.hasDaughters ? '1/8' : '1/4';
      const totalWifeShare = heirs.hasSons || heirs.hasDaughters ? netEstate / 8 : netEstate / 4;
      const perWife = totalWifeShare / heirs.wifeCount;
      for (let i = 0; i < heirs.wifeCount; i++) {
        calculatedHeirs.push({
          id: `wife-${i}`,
          name: heirs.wifeCount > 1 ? `Wife ${i + 1}` : 'Wife',
          relationship: 'Spouse',
          share: heirs.wifeCount > 1 ? `${share} ÷ ${heirs.wifeCount}` : share,
          amount: perWife,
        });
      }
      remainingEstate -= totalWifeShare;
    }

    // Parents
    if (heirs.hasFather) {
      const share = heirs.hasSons || heirs.hasDaughters ? '1/6' : 'Residue';
      const amount = heirs.hasSons || heirs.hasDaughters 
        ? netEstate / 6 
        : remainingEstate * 0.4; // Simplified
      calculatedHeirs.push({
        id: 'father',
        name: 'Father',
        relationship: 'Parent',
        share,
        amount,
      });
      if (heirs.hasSons || heirs.hasDaughters) {
        remainingEstate -= amount;
      }
    }

    if (heirs.hasMother) {
      const share = heirs.hasSons || heirs.hasDaughters || heirs.hasBrothers || heirs.hasSisters 
        ? '1/6' : '1/3';
      const amount = share === '1/6' ? netEstate / 6 : netEstate / 3;
      calculatedHeirs.push({
        id: 'mother',
        name: 'Mother',
        relationship: 'Parent',
        share,
        amount: Math.min(amount, remainingEstate),
      });
      remainingEstate -= Math.min(amount, remainingEstate);
    }

    // Children (Asabat - residuaries)
    if (heirs.hasSons || heirs.hasDaughters) {
      const totalSonShares = heirs.sonCount * 2; // Sons get 2 parts
      const totalDaughterShares = heirs.daughterCount * 1; // Daughters get 1 part
      const totalParts = totalSonShares + totalDaughterShares;
      const perPart = remainingEstate / totalParts;

      if (heirs.hasSons) {
        for (let i = 0; i < heirs.sonCount; i++) {
          calculatedHeirs.push({
            id: `son-${i}`,
            name: heirs.sonCount > 1 ? `Son ${i + 1}` : 'Son',
            relationship: 'Child',
            share: `2/${totalParts} of residue`,
            amount: perPart * 2,
          });
        }
      }

      if (heirs.hasDaughters) {
        for (let i = 0; i < heirs.daughterCount; i++) {
          calculatedHeirs.push({
            id: `daughter-${i}`,
            name: heirs.daughterCount > 1 ? `Daughter ${i + 1}` : 'Daughter',
            relationship: 'Child',
            share: `1/${totalParts} of residue`,
            amount: perPart,
          });
        }
      }
    }

    setResult({
      netEstate,
      heirs: calculatedHeirs,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className={cn('w-full max-w-4xl mx-auto flex flex-col gap-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
          <MoonIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Islamic Inheritance Calculator</h2>
          <p className="text-sm text-muted-foreground">
            Calculate inheritance distribution according to Islamic law (Faraid)
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border flex gap-3">
        <InfoIcon className="shrink-0 text-muted-foreground mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p>This is a simplified calculator. Islamic inheritance law (Ilm al-Faraid) is complex with many special cases. Please consult a qualified Islamic scholar for accurate distribution.</p>
        </div>
      </div>

      {/* Estate Information */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Estate Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estate">Total Estate Value</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="estate"
                type="number"
                value={estate || ''}
                onChange={(e) => setEstate(parseFloat(e.target.value) || 0)}
                className="pl-7 font-mono"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="debts">Debts & Funeral Expenses</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="debts"
                type="number"
                value={debts || ''}
                onChange={(e) => setDebts(parseFloat(e.target.value) || 0)}
                className="pl-7 font-mono"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bequest">Bequest (Wasiyyah, max 1/3)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="bequest"
                type="number"
                value={bequest || ''}
                onChange={(e) => setBequest(parseFloat(e.target.value) || 0)}
                className="pl-7 font-mono"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Heirs Selection */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Select Heirs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spouse */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Spouse</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={heirs.hasHusband}
                onChange={(e) => setHeirs({ ...heirs, hasHusband: e.target.checked, hasWife: false })}
                className="rounded border-border"
              />
              <span className="text-sm">Husband (deceased is female)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={heirs.hasWife}
                onChange={(e) => setHeirs({ ...heirs, hasWife: e.target.checked, hasHusband: false })}
                className="rounded border-border"
              />
              <span className="text-sm">Wife(s) (deceased is male)</span>
            </label>
            {heirs.hasWife && (
              <div className="flex items-center gap-2 ml-6">
                <Label htmlFor="wifeCount" className="text-xs">Number of wives:</Label>
                <Input
                  id="wifeCount"
                  type="number"
                  min={1}
                  max={4}
                  value={heirs.wifeCount}
                  onChange={(e) => setHeirs({ ...heirs, wifeCount: Math.min(4, parseInt(e.target.value) || 1) })}
                  className="w-16 h-8"
                />
              </div>
            )}
          </div>

          {/* Parents */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Parents</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={heirs.hasFather}
                onChange={(e) => setHeirs({ ...heirs, hasFather: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm">Father</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={heirs.hasMother}
                onChange={(e) => setHeirs({ ...heirs, hasMother: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm">Mother</span>
            </label>
          </div>

          {/* Children */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Children</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={heirs.hasSons}
                onChange={(e) => setHeirs({ ...heirs, hasSons: e.target.checked, sonCount: e.target.checked ? 1 : 0 })}
                className="rounded border-border"
              />
              <span className="text-sm">Son(s)</span>
            </label>
            {heirs.hasSons && (
              <div className="flex items-center gap-2 ml-6">
                <Label htmlFor="sonCount" className="text-xs">Number:</Label>
                <Input
                  id="sonCount"
                  type="number"
                  min={1}
                  value={heirs.sonCount}
                  onChange={(e) => setHeirs({ ...heirs, sonCount: parseInt(e.target.value) || 0 })}
                  className="w-16 h-8"
                />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={heirs.hasDaughters}
                onChange={(e) => setHeirs({ ...heirs, hasDaughters: e.target.checked, daughterCount: e.target.checked ? 1 : 0 })}
                className="rounded border-border"
              />
              <span className="text-sm">Daughter(s)</span>
            </label>
            {heirs.hasDaughters && (
              <div className="flex items-center gap-2 ml-6">
                <Label htmlFor="daughterCount" className="text-xs">Number:</Label>
                <Input
                  id="daughterCount"
                  type="number"
                  min={1}
                  value={heirs.daughterCount}
                  onChange={(e) => setHeirs({ ...heirs, daughterCount: parseInt(e.target.value) || 0 })}
                  className="w-16 h-8"
                />
              </div>
            )}
          </div>

          {/* Siblings */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Siblings (if no children)</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={heirs.hasBrothers}
                onChange={(e) => setHeirs({ ...heirs, hasBrothers: e.target.checked })}
                className="rounded border-border"
                disabled={heirs.hasSons || heirs.hasDaughters}
              />
              <span className="text-sm">Brother(s)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={heirs.hasSisters}
                onChange={(e) => setHeirs({ ...heirs, hasSisters: e.target.checked })}
                className="rounded border-border"
                disabled={heirs.hasSons || heirs.hasDaughters}
              />
              <span className="text-sm">Sister(s)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <Button onClick={calculateInheritance} size="lg" className="gap-2 bg-amber-600 hover:bg-amber-700">
        <MoonIcon />
        Calculate Distribution
      </Button>

      {/* Results */}
      {result && (
        <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-6">
          <h3 className="text-lg font-semibold mb-4">Inheritance Distribution</h3>
          
          <div className="p-3 rounded-lg bg-card border border-border mb-4">
            <p className="text-sm text-muted-foreground">Net Distributable Estate</p>
            <p className="font-mono font-bold text-xl">{formatCurrency(result.netEstate)}</p>
          </div>

          {result.heirs.length > 0 ? (
            <div className="space-y-2">
              {result.heirs.map((heir) => (
                <div
                  key={heir.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                >
                  <div>
                    <p className="font-medium">{heir.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {heir.relationship} • Share: {heir.share}
                    </p>
                  </div>
                  <p className="font-mono font-semibold text-amber-500">
                    {formatCurrency(heir.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No distributable estate or no heirs selected.
            </p>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        This is a simplified educational tool. Islamic inheritance involves complex rules including special cases (Awl, Radd, etc.). 
        Always consult a qualified Islamic scholar or Mufti for actual estate distribution.
      </p>
    </div>
  );
}

export { ZakatCalculator as default };

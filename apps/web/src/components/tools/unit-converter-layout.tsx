'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { unitCategories, type UnitDefinition, type UnitCategory } from '@/lib/tools/unit-data';

// Label component (inline to avoid import issues)
const Label = ({ htmlFor, className, children }: { htmlFor?: string; className?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className={cn('text-sm font-medium leading-none', className)}>{children}</label>
);
import { useCopyToClipboard } from '@/hooks/use-utils';

// ============== ICONS ==============
const SwapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3l4 4-4 4"/>
    <path d="M20 7H4"/>
    <path d="M8 21l-4-4 4-4"/>
    <path d="M4 17h16"/>
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

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 21h5v-5"/>
  </svg>
);

// ============== UNIT SELECT COMPONENT ==============
interface UnitSelectProps {
  units: UnitDefinition[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

function UnitSelect({ units, value, onChange, label }: UnitSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
      >
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name} ({unit.symbol})
          </option>
        ))}
      </select>
    </div>
  );
}

// ============== CONVERSION RESULT ROW ==============
interface ConversionResultProps {
  unit: UnitDefinition;
  value: number;
  onCopy: () => void;
  copied: boolean;
}

function ConversionResult({ unit, value, onCopy, copied }: ConversionResultProps) {
  const formattedValue = React.useMemo(() => {
    if (isNaN(value) || !isFinite(value)) return '—';
    if (Math.abs(value) < 0.0001 || Math.abs(value) >= 1e10) {
      return value.toExponential(6);
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 10 });
  }, [value]);

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded bg-muted/50 hover:bg-muted transition-colors group">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-12 font-mono">{unit.symbol}</span>
        <span className="text-sm text-foreground">{unit.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-foreground tabular-nums">{formattedValue}</span>
        <button
          onClick={onCopy}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-background transition-all"
          title="Copy value"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  );
}

// ============== MAIN COMPONENT ==============
export interface UnitConverterLayoutProps {
  /** Tool ID for context */
  toolId?: string;
  /** Pre-selected category */
  defaultCategory?: string;
  /** Pre-selected from unit */
  defaultFromUnit?: string;
  /** Pre-selected to unit */
  defaultToUnit?: string;
  /** Initial value */
  defaultValue?: number;
  /** Additional class names */
  className?: string;
}

export function UnitConverterLayout({
  toolId,
  defaultCategory = 'length',
  defaultFromUnit,
  defaultToUnit,
  defaultValue = 1,
  className,
}: UnitConverterLayoutProps) {
  const [selectedCategory, setSelectedCategory] = React.useState(defaultCategory);
  const [inputValue, setInputValue] = React.useState(defaultValue.toString());
  const [fromUnit, setFromUnit] = React.useState(defaultFromUnit || '');
  const [toUnit, setToUnit] = React.useState(defaultToUnit || '');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const { copy } = useCopyToClipboard();

  const category = unitCategories.find(c => c.id === selectedCategory) || unitCategories[0]!;

  // Initialize from/to units when category changes
  React.useEffect(() => {
    if (!fromUnit || !category.units.find(u => u.id === fromUnit)) {
      setFromUnit(category.units[0]?.id || '');
    }
    if (!toUnit || !category.units.find(u => u.id === toUnit)) {
      setToUnit(category.units[1]?.id || category.units[0]?.id || '');
    }
  }, [selectedCategory, category.units, fromUnit, toUnit]);

  const fromUnitDef = category.units.find(u => u.id === fromUnit);
  const toUnitDef = category.units.find(u => u.id === toUnit);

  const numericValue = parseFloat(inputValue) || 0;

  // Convert value
  const convertedValue = React.useMemo(() => {
    if (!fromUnitDef || !toUnitDef) return 0;
    const baseValue = fromUnitDef.toBase(numericValue);
    return toUnitDef.fromBase(baseValue);
  }, [numericValue, fromUnitDef, toUnitDef]);

  // Convert to all units
  const allConversions = React.useMemo(() => {
    if (!fromUnitDef) return [];
    const baseValue = fromUnitDef.toBase(numericValue);
    return category.units.map(unit => ({
      unit,
      value: unit.fromBase(baseValue),
    }));
  }, [numericValue, fromUnitDef, category.units]);

  // Swap units
  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    setInputValue(convertedValue.toString());
  };

  // Reset
  const handleReset = () => {
    setInputValue('1');
    setFromUnit(category.units[0]?.id || '');
    setToUnit(category.units[1]?.id || category.units[0]?.id || '');
  };

  // Copy value
  const handleCopy = (id: string, value: number) => {
    const formatted = value.toString();
    copy(formatted);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formattedResult = React.useMemo(() => {
    if (isNaN(convertedValue) || !isFinite(convertedValue)) return '—';
    if (Math.abs(convertedValue) < 0.0001 || Math.abs(convertedValue) >= 1e10) {
      return convertedValue.toExponential(6);
    }
    return convertedValue.toLocaleString('en-US', { maximumFractionDigits: 10 });
  }, [convertedValue]);

  return (
    <div className={cn('w-full max-w-4xl mx-auto flex flex-col gap-6', className)}>
      {/* Category Selector */}
      <div className="flex flex-wrap gap-2">
        {unitCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
            )}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Main Converter Card */}
      <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-6 items-end">
          {/* From Section */}
          <div className="flex flex-col gap-4">
            <UnitSelect
              units={category.units}
              value={fromUnit}
              onChange={setFromUnit}
              label="From"
            />
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Value</Label>
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-11 font-mono text-lg"
                placeholder="Enter value..."
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center md:pb-2">
            <Button
              variant="outline"
              size="icon"
              onClick={swapUnits}
              className="rounded-full h-10 w-10 shrink-0"
              title="Swap units"
            >
              <SwapIcon />
            </Button>
          </div>

          {/* To Section */}
          <div className="flex flex-col gap-4">
            <UnitSelect
              units={category.units}
              value={toUnit}
              onChange={setToUnit}
              label="To"
            />
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Result</Label>
              <div className="h-11 flex items-center px-3 rounded-md border border-border bg-muted/50 font-mono text-lg">
                <span className="truncate">{formattedResult}</span>
                <span className="ml-2 text-sm text-muted-foreground">{toUnitDef?.symbol}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleCopy('main', convertedValue)}
          >
            {copiedId === 'main' ? <CheckIcon /> : <CopyIcon />}
            Copy Result
          </Button>
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={handleReset}
          >
            <RefreshIcon />
            Reset
          </Button>
        </div>

        {/* Formula Display */}
        {fromUnitDef && toUnitDef && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">{numericValue}</span> {fromUnitDef.name} ={' '}
              <span className="font-semibold text-primary">{formattedResult}</span> {toUnitDef.name}
            </p>
          </div>
        )}
      </div>

      {/* All Conversions Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">All {category.name} Conversions</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {numericValue} {fromUnitDef?.name || 'unit'} equals:
          </p>
        </div>
        <div className="p-4 flex flex-col gap-1">
          {allConversions.map(({ unit, value }) => (
            <ConversionResult
              key={unit.id}
              unit={unit}
              value={value}
              onCopy={() => handleCopy(unit.id, value)}
              copied={copiedId === unit.id}
            />
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="font-semibold text-sm text-foreground mb-2">How to Use</h4>
        <ul className="list-disc list-inside text-muted-foreground text-xs space-y-1">
          <li>Select a category (Length, Weight, Temperature, etc.) from the tabs above.</li>
          <li>Choose the unit you're converting from and enter the value.</li>
          <li>Select the target unit to see the converted result.</li>
          <li>Click the swap button to quickly reverse the conversion direction.</li>
          <li>View all conversions at once in the table below.</li>
        </ul>
      </div>
    </div>
  );
}

export default UnitConverterLayout;

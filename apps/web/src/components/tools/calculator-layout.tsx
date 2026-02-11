'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCopyToClipboard } from '@/hooks/use-utils';
import type { ToolOption } from '@/lib/tools/types';

// Icons
const CalculatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <line x1="8" x2="16" y1="6" y2="6" />
    <line x1="16" x2="16" y1="14" y2="18" />
    <path d="M16 10h.01" />
    <path d="M12 10h.01" />
    <path d="M8 10h.01" />
    <path d="M12 14h.01" />
    <path d="M8 14h.01" />
    <path d="M12 18h.01" />
    <path d="M8 18h.01" />
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

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);

// History entry type
interface HistoryEntry {
  id: string;
  timestamp: number;
  inputs: Record<string, unknown>;
  results: CalculatorResult[];
}

// Result display component
interface ResultDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}

function ResultDisplay({ label, value, unit, highlight, onCopy, copied }: ResultDisplayProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border',
        highlight
          ? 'bg-primary/5 border-primary/20'
          : 'bg-muted/30 border-border'
      )}
    >
      <div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className={cn(
            'font-mono font-semibold tabular-nums',
            highlight ? 'text-xl text-primary' : 'text-lg'
          )}>
            {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 10 }) : value}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
      </div>
      {onCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onCopy}
          title="Copy value"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      )}
    </div>
  );
}

// Calculator form field
interface CalcFieldProps {
  option: ToolOption;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function CalcField({ option, value, onChange, disabled }: CalcFieldProps) {
  const id = `calc-${option.name}`;
  
  // Select dropdown
  if (option.type === 'select') {
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium">
          {option.label}
          {option.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <select
          id={id}
          value={(value as string | number) ?? option.default ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select {option.label.toLowerCase()}...</option>
          {option.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
  
  // Checkbox / Boolean
  if (option.type === 'checkbox' || option.type === 'boolean') {
    return (
      <div className="flex items-center gap-3 py-2">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value ?? option.default ?? false)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-input bg-background"
        />
        <label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {option.label}
        </label>
      </div>
    );
  }
  
  // Textarea
  if (option.type === 'textarea') {
    return (
      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <label htmlFor={id} className="text-sm font-medium">
          {option.label}
          {option.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <textarea
          id={id}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={option.placeholder || `Enter ${option.label.toLowerCase()}`}
          disabled={disabled}
          rows={4}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        {option.description && (
          <p className="text-xs text-muted-foreground">{option.description}</p>
        )}
      </div>
    );
  }
  
  // Date input
  if (option.type === 'date') {
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium">
          {option.label}
          {option.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <Input
          id={id}
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="font-mono"
        />
        {option.placeholder && (
          <p className="text-xs text-muted-foreground">{option.placeholder}</p>
        )}
      </div>
    );
  }
  
  // Text/String input  
  if (option.type === 'text' || option.type === 'string') {
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium">
          {option.label}
          {option.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <Input
          id={id}
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={option.placeholder || `Enter ${option.label.toLowerCase()}`}
          disabled={disabled}
        />
        {option.description && (
          <p className="text-xs text-muted-foreground">{option.description}</p>
        )}
      </div>
    );
  }
  
  // Number input (default)
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {option.label}
        {option.required && <span className="text-destructive ml-1">*</span>}
      </label>
      <Input
        id={id}
        type="number"
        value={(value as number) ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? undefined : Number(val));
        }}
        min={option.min}
        max={option.max}
        step={option.step || 'any'}
        placeholder={option.placeholder || option.description || `Enter ${option.label.toLowerCase()}`}
        disabled={disabled}
        className="font-mono"
      />
      {option.description && (
        <p className="text-xs text-muted-foreground">{option.description}</p>
      )}
    </div>
  );
}

export interface CalculatorResult {
  label: string;
  value: string | number;
  unit?: string;
  primary?: boolean;
}

export interface CalculatorLayoutProps {
  toolId: string;
  toolName: string;
  formOptions: ToolOption[];
  calculate: (inputs: Record<string, unknown>) => CalculatorResult[] | Promise<CalculatorResult[]>;
  description?: string;
  formula?: string;
  className?: string;
}

export function CalculatorLayout({
  toolId,
  toolName,
  formOptions,
  calculate,
  description,
  formula,
  className,
}: CalculatorLayoutProps) {
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    formOptions.forEach(opt => {
      if (opt.default !== undefined) {
        defaults[opt.name] = opt.default;
      }
    });
    return defaults;
  });
  const [results, setResults] = React.useState<CalculatorResult[]>([]);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const { copy } = useCopyToClipboard();

  // Load history from localStorage on mount
  React.useEffect(() => {
    const storageKey = `calc-history-${toolId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load calculator history:', e);
    }
  }, [toolId]);

  // Save history to localStorage when it changes
  const saveHistory = React.useCallback((newHistory: HistoryEntry[]) => {
    const storageKey = `calc-history-${toolId}`;
    try {
      // Keep only last 20 entries
      const trimmed = newHistory.slice(0, 20);
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
      setHistory(trimmed);
    } catch (e) {
      console.error('Failed to save calculator history:', e);
    }
  }, [toolId]);

  // Add entry to history
  const addToHistory = React.useCallback((inputs: Record<string, unknown>, results: CalculatorResult[]) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      inputs,
      results,
    };
    saveHistory([entry, ...history]);
  }, [history, saveHistory]);

  // Recall a history entry
  const recallHistory = React.useCallback((entry: HistoryEntry) => {
    setFormValues(entry.inputs);
    setResults(entry.results);
    setShowHistory(false);
  }, []);

  // Clear all history
  const clearHistory = React.useCallback(() => {
    const storageKey = `calc-history-${toolId}`;
    try {
      localStorage.removeItem(storageKey);
      setHistory([]);
    } catch (e) {
      console.error('Failed to clear calculator history:', e);
    }
  }, [toolId]);

  // Update form value
  const updateFormValue = (name: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Validate form
  const validateForm = (): boolean => {
    for (const option of formOptions) {
      if (option.required && (formValues[option.name] === undefined || formValues[option.name] === '')) {
        setError(`${option.label} is required`);
        return false;
      }
    }
    return true;
  };

  // Handle calculate
  const handleCalculate = async () => {
    if (!validateForm()) return;
    
    setIsCalculating(true);
    setError(null);
    
    try {
      const result = await calculate(formValues);
      setResults(result);
      // Save to history
      addToHistory(formValues, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
      setResults([]);
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle clear
  const handleClear = () => {
    const defaults: Record<string, unknown> = {};
    formOptions.forEach(opt => {
      if (opt.default !== undefined) {
        defaults[opt.name] = opt.default;
      }
    });
    setFormValues(defaults);
    setResults([]);
    setError(null);
  };

  // Handle copy result
  const handleCopyResult = (index: number, value: string | number) => {
    copy(String(value));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    // Enter = Calculate
    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      handleCalculate();
    }
    // Escape = Clear
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [formValues]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get primary result for prominent display
  const primaryResult = results.find(r => r.primary);
  const secondaryResults = results.filter(r => !r.primary);

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Description */}
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}

      {/* Input panel */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <CalculatorIcon />
          Input Values
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {formOptions.map((option) => (
            <CalcField
              key={option.name}
              option={option}
              value={formValues[option.name]}
              onChange={(value) => updateFormValue(option.name, value)}
              disabled={isCalculating}
            />
          ))}
        </div>
      </div>

      {/* Formula (if provided) */}
      {formula && (
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Formula:</p>
          <code className="text-sm font-mono">{formula}</code>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleCalculate}
          disabled={isCalculating}
          size="lg"
          className="gap-2"
        >
          <CalculatorIcon />
          {isCalculating ? 'Calculating...' : 'Calculate'}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={isCalculating}
          className="gap-2"
        >
          <ClearIcon />
          Clear
        </Button>
      </div>

      {/* Results panel */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Results</h3>
          
          {/* Primary result - prominent display */}
          {primaryResult && (
            <div className="p-6 rounded-xl bg-primary/5 border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">{primaryResult.label}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono tabular-nums text-primary">
                  {typeof primaryResult.value === 'number' 
                    ? primaryResult.value.toLocaleString(undefined, { maximumFractionDigits: 10 })
                    : primaryResult.value
                  }
                </span>
                {primaryResult.unit && (
                  <span className="text-lg text-muted-foreground">{primaryResult.unit}</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => handleCopyResult(-1, primaryResult.value)}
                >
                  {copiedIndex === -1 ? <CheckIcon /> : <CopyIcon />}
                  <span className="ml-1">Copy</span>
                </Button>
              </div>
            </div>
          )}
          
          {/* Secondary results */}
          {secondaryResults.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {secondaryResults.map((result, index) => (
                <ResultDisplay
                  key={index}
                  label={result.label}
                  value={result.value}
                  unit={result.unit}
                  onCopy={() => handleCopyResult(index, result.value)}
                  copied={copiedIndex === index}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History panel */}
      {history.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            onClick={() => setShowHistory(!showHistory)}
          >
            <div className="flex items-center gap-2">
              <HistoryIcon />
              <span className="text-sm font-semibold">Calculation History</span>
              <span className="text-xs text-muted-foreground">({history.length})</span>
            </div>
            {showHistory ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
          
          {showHistory && (
            <div className="border-t border-border">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                <span className="text-xs text-muted-foreground">Click to recall</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearHistory();
                  }}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear All
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border">
                {history.map((entry) => {
                  const primaryResult = entry.results.find(r => r.primary) || entry.results[0];
                  return (
                    <button
                      key={entry.id}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => recallHistory(entry)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm text-primary">
                            {primaryResult ? (
                              typeof primaryResult.value === 'number' 
                                ? primaryResult.value.toLocaleString(undefined, { maximumFractionDigits: 6 })
                                : primaryResult.value
                            ) : '—'}
                          </span>
                          {primaryResult?.unit && (
                            <span className="text-xs text-muted-foreground ml-1">{primaryResult.unit}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {Object.entries(entry.inputs)
                          .filter(([_, v]) => v !== undefined && v !== '')
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <p className="text-xs text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Enter</kbd> to calculate • <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Esc</kbd> to clear
      </p>
    </div>
  );
}

export default CalculatorLayout;

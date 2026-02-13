'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
);

export interface ResultDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
  copyable?: boolean;
  className?: string;
}

export function ResultDisplay({ label, value, unit, highlight, copyable = true, className }: ResultDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border',
        highlight
          ? 'bg-primary/5 border-primary/20'
          : 'bg-muted/30 border-border',
        className
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
      {copyable && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopy}
          title="Copy value"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      )}
    </div>
  );
}

export interface ResultDisplayGroupProps {
  results: ResultDisplayProps[];
  className?: string;
}

export function ResultDisplayGroup({ results, className }: ResultDisplayGroupProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {results.map((result) => (
        <ResultDisplay key={result.label} {...result} />
      ))}
    </div>
  );
}

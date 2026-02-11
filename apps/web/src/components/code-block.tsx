'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useCopyToClipboard } from '@/hooks/use-utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
  maxHeight?: number;
}

export function CodeBlock({
  code,
  language = 'text',
  filename,
  showLineNumbers = true,
  highlightLines = [],
  className,
  maxHeight = 500,
}: CodeBlockProps) {
  const { copy, copied } = useCopyToClipboard();
  const lines = code.split('\n');

  return (
    <div className={cn('relative rounded-lg border bg-muted', className)}>
      {/* Header */}
      {(filename || language) && (
        <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-sm font-medium text-muted-foreground">
                {filename}
              </span>
            )}
            {language && !filename && (
              <span className="text-xs text-muted-foreground uppercase">
                {language}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copy(code)}
            className="h-7 gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copy
              </>
            )}
          </Button>
        </div>
      )}

      {/* Code */}
      <div
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <pre className="p-4">
          <code className="text-sm font-mono">
            {lines.map((line, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  highlightLines.includes(index + 1) && 'bg-warning/10 -mx-4 px-4'
                )}
              >
                {showLineNumbers && (
                  <span className="mr-4 inline-block w-8 text-right text-muted-foreground select-none">
                    {index + 1}
                  </span>
                )}
                <span className="flex-1">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

interface CodeDiffProps {
  original: string;
  modified: string;
  filename?: string;
  className?: string;
}

export function CodeDiff({
  original,
  modified,
  filename,
  className,
}: CodeDiffProps) {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  // Simple diff algorithm
  const diff = computeDiff(originalLines, modifiedLines);

  return (
    <div className={cn('rounded-lg border bg-muted', className)}>
      {filename && (
        <div className="border-b bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">
            {filename}
          </span>
        </div>
      )}
      
      <div className="overflow-auto max-h-125">
        <pre className="p-4">
          <code className="text-sm font-mono">
            {diff.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  item.type === 'add' && 'bg-success/20 -mx-4 px-4',
                  item.type === 'remove' && 'bg-destructive/20 -mx-4 px-4'
                )}
              >
                <span className={cn(
                  'mr-4 inline-block w-4 text-center select-none',
                  item.type === 'add' && 'text-success',
                  item.type === 'remove' && 'text-destructive'
                )}>
                  {item.type === 'add' ? '+' : item.type === 'remove' ? '-' : ' '}
                </span>
                <span className="flex-1">{item.line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

interface DiffItem {
  type: 'add' | 'remove' | 'unchanged';
  line: string;
}

function computeDiff(original: string[], modified: string[]): DiffItem[] {
  const result: DiffItem[] = [];
  const originalSet = new Set(original);
  const modifiedSet = new Set(modified);
  
  let i = 0;
  let j = 0;
  
  while (i < original.length || j < modified.length) {
    const origLine = original[i];
    const modLine = modified[j];
    
    if (i < original.length && j < modified.length && origLine === modLine) {
      result.push({ type: 'unchanged', line: origLine ?? '' });
      i++;
      j++;
    } else if (i < original.length && origLine !== undefined && !modifiedSet.has(origLine)) {
      result.push({ type: 'remove', line: origLine });
      i++;
    } else if (j < modified.length && modLine !== undefined && !originalSet.has(modLine)) {
      result.push({ type: 'add', line: modLine });
      j++;
    } else if (i < original.length && origLine !== undefined) {
      result.push({ type: 'remove', line: origLine });
      i++;
    } else if (j < modified.length && modLine !== undefined) {
      result.push({ type: 'add', line: modLine });
      j++;
    } else {
      break;
    }
  }
  
  return result;
}

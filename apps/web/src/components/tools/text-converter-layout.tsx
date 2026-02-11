'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCopyToClipboard } from '@/hooks/use-utils';
import { Input } from '@/components/ui/input';
import type { ToolOption } from '@/lib/tools/types';

// Icons as inline SVG components
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

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const PasteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

const UndoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
  </svg>
);

// Tool option field component for dynamic form generation
interface ToolOptionFieldProps {
  option: ToolOption;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function ToolOptionField({ option, value, onChange, disabled }: ToolOptionFieldProps) {
  const id = `opt-${option.name}`;
  
  if (option.type === 'select') {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {option.label}
          {option.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <select
          id={id}
          value={(value as string | number) ?? option.default ?? option.defaultValue ?? ''}
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
        {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
      </div>
    );
  }
  
  if (option.type === 'boolean' || option.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          id={id}
          checked={(value as boolean) ?? (option.default as boolean) ?? false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 rounded border-input"
        />
        <span className="text-sm font-medium">{option.label}</span>
        {option.description && <span className="text-xs text-muted-foreground">({option.description})</span>}
      </label>
    );
  }
  
  if (option.type === 'number' || option.type === 'range') {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {option.label}
          {option.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <Input
          id={id}
          type="number"
          value={(value as number) ?? option.default ?? option.defaultValue ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          min={option.min}
          max={option.max}
          step={option.step || 1}
          placeholder={option.placeholder || option.description}
          disabled={disabled}
          className="font-mono"
        />
        {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
      </div>
    );
  }
  
  // Default: string/text input
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {option.label}
        {option.required && <span className="text-destructive ml-1">*</span>}
      </label>
      <Input
        id={id}
        type="text"
        value={(value as string) ?? option.default ?? option.defaultValue ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={option.placeholder || option.description}
        disabled={disabled}
      />
      {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
    </div>
  );
}

// Analysis bar component
interface AnalysisBarProps {
  text: string;
  className?: string;
}

function AnalysisBar({ text, className }: AnalysisBarProps) {
  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const lines = text.split('\n').length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;

  return (
    <div className={cn('flex flex-wrap items-center gap-4 text-xs text-muted-foreground', className)}>
      <span className="tabular-nums">{chars.toLocaleString()} chars</span>
      <span className="tabular-nums">{words.toLocaleString()} words</span>
      <span className="tabular-nums">{sentences.toLocaleString()} sentences</span>
      <span className="tabular-nums">{lines.toLocaleString()} lines</span>
      <span className="tabular-nums">{paragraphs.toLocaleString()} paragraphs</span>
    </div>
  );
}

// History management hook for undo/redo
function useTextHistory(initialValue: string) {
  const [history, setHistory] = React.useState<string[]>([initialValue]);
  const [index, setIndex] = React.useState(0);

  const current = history[index] || '';

  const push = React.useCallback((value: string) => {
    if (value === current) return;
    
    const newHistory = [...history.slice(0, index + 1), value];
    // Keep max 50 history entries
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  }, [history, index, current]);

  const undo = React.useCallback(() => {
    if (index > 0) {
      setIndex(index - 1);
    }
  }, [index]);

  const redo = React.useCallback(() => {
    if (index < history.length - 1) {
      setIndex(index + 1);
    }
  }, [index, history.length]);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  return { current, push, undo, redo, canUndo, canRedo };
}

export interface TextConverterLayoutProps {
  toolId: string;
  toolName: string;
  placeholder?: string;
  transform: (text: string, options?: Record<string, unknown>) => string | Promise<string>;
  /** Tool options from registry - will be rendered as dynamic form fields */
  toolOptions?: ToolOption[];
  /** Legacy: Custom options as ReactNode (deprecated, use toolOptions instead) */
  options?: React.ReactNode;
  autoTransform?: boolean;
  className?: string;
}

export function TextConverterLayout({
  toolId,
  toolName,
  placeholder = 'Enter or paste your text here...',
  transform,
  toolOptions,
  options,
  autoTransform = true,
  className,
}: TextConverterLayoutProps) {
  const { current: text, push, undo, redo, canUndo, canRedo } = useTextHistory('');
  const [isTransforming, setIsTransforming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [optionValues, setOptionValues] = React.useState<Record<string, unknown>>(() => {
    // Initialize options from defaults
    const defaults: Record<string, unknown> = {};
    toolOptions?.forEach(opt => {
      if (opt.default !== undefined) defaults[opt.name] = opt.default;
      else if (opt.defaultValue !== undefined) defaults[opt.name] = opt.defaultValue;
    });
    return defaults;
  });
  const { copy, copied } = useCopyToClipboard();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Update option value
  const updateOptionValue = (name: string, value: unknown) => {
    setOptionValues(prev => ({ ...prev, [name]: value }));
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    push(e.target.value);
    setError(null);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    // Ctrl+Z = Undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Ctrl+Y or Ctrl+Shift+Z = Redo
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      redo();
    }
    // Ctrl+Enter = Transform
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleTransform();
    }
  }, [undo, redo]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle transform
  const handleTransform = async () => {
    if (!text.trim()) return;
    
    setIsTransforming(true);
    setError(null);
    
    try {
      const result = await transform(text, optionValues);
      push(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transform failed');
    } finally {
      setIsTransforming(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        push(event.target?.result as string || '');
      };
      reader.readAsText(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle paste from clipboard
  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      push(clipText);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  // Handle clear
  const handleClear = () => {
    push('');
    textareaRef.current?.focus();
  };

  // Handle download
  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolId}-output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Main textarea - single source of truth */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          placeholder={placeholder}
          className="min-h-80 font-mono text-sm resize-y bg-background border-border focus:border-primary focus:ring-primary/20"
          disabled={isTransforming}
        />
        
        {/* Loading overlay */}
        {isTransforming && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Transforming...</span>
            </div>
          </div>
        )}
      </div>

      {/* Analysis bar */}
      <AnalysisBar text={text} />

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Options panel - dynamic from toolOptions or legacy ReactNode */}
      {(toolOptions && toolOptions.length > 0) && (
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <h3 className="text-sm font-medium mb-3">Options</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toolOptions.map((opt) => (
              <ToolOptionField
                key={opt.name}
                option={opt}
                value={optionValues[opt.name]}
                onChange={(value) => updateOptionValue(opt.name, value)}
                disabled={isTransforming}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Legacy options panel (deprecated) */}
      {options && !toolOptions && (
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <h3 className="text-sm font-medium mb-3">Options</h3>
          {options}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Primary action */}
        <Button
          onClick={handleTransform}
          disabled={!text.trim() || isTransforming}
          className="gap-2"
        >
          {isTransforming ? 'Processing...' : `Convert to ${toolName}`}
        </Button>

        {/* Secondary actions */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <UndoIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <RedoIcon />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json,.xml,.csv,.md,.yaml,.yml,.html,.css,.js,.ts"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Upload file"
          >
            <UploadIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePaste}
            title="Paste from clipboard"
          >
            <PasteIcon />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copy(text)}
            disabled={!text}
            title="Copy to clipboard"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={!text}
            title="Download as file"
          >
            <DownloadIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={!text}
            title="Clear"
          >
            <ClearIcon />
          </Button>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-xs text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Ctrl+Enter</kbd> to transform • <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Ctrl+Z</kbd> to undo • <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Ctrl+Y</kbd> to redo
      </p>
    </div>
  );
}

export default TextConverterLayout;

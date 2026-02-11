'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCopyToClipboard } from '@/hooks/use-utils';
import type { ToolOption } from '@/lib/tools/types';

// Icons
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

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

// Form field renderer
interface FormFieldProps {
  option: ToolOption;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function FormField({ option, value, onChange, disabled }: FormFieldProps) {
  const id = `field-${option.name}`;
  
  switch (option.type) {
    case 'string':
    case 'text':
      return (
        <div className="space-y-2">
          <label htmlFor={id} className="text-sm font-medium">
            {option.label}
            {option.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <Input
            id={id}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={option.placeholder || option.description}
            disabled={disabled}
          />
          {option.description && (
            <p className="text-xs text-muted-foreground">{option.description}</p>
          )}
        </div>
      );
      
    case 'number':
      return (
        <div className="space-y-2">
          <label htmlFor={id} className="text-sm font-medium">
            {option.label}
            {option.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <Input
            id={id}
            type="number"
            value={(value as number) ?? option.defaultValue ?? option.default ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            min={option.min}
            max={option.max}
            step={option.step || 1}
            placeholder={option.placeholder || option.description}
            disabled={disabled}
          />
          {option.description && (
            <p className="text-xs text-muted-foreground">{option.description}</p>
          )}
        </div>
      );
      
    case 'boolean':
    case 'checkbox':
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={(value as boolean) ?? (option.defaultValue as boolean) ?? (option.default as boolean) ?? false}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium">{option.label}</span>
            {option.description && (
              <p className="text-xs text-muted-foreground">{option.description}</p>
            )}
          </div>
        </label>
      );
      
    case 'select':
      return (
        <div className="space-y-2">
          <label htmlFor={id} className="text-sm font-medium">
            {option.label}
            {option.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <select
            id={id}
            value={(value as string | number) ?? option.defaultValue ?? option.default ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select...</option>
            {option.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {option.description && (
            <p className="text-xs text-muted-foreground">{option.description}</p>
          )}
        </div>
      );
      
    case 'range':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-sm font-medium">
              {option.label}
            </label>
            <span className="text-sm text-muted-foreground tabular-nums">
              {String(value ?? option.defaultValue ?? option.default ?? option.min ?? 0)}
            </span>
          </div>
          <input
            id={id}
            type="range"
            value={(value as number) ?? (option.defaultValue as number) ?? (option.default as number) ?? option.min ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
            min={option.min ?? 0}
            max={option.max ?? 100}
            step={option.step ?? 1}
            disabled={disabled}
            className="w-full accent-primary"
          />
          {option.description && (
            <p className="text-xs text-muted-foreground">{option.description}</p>
          )}
        </div>
      );
      
    case 'textarea':
      return (
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor={id} className="text-sm font-medium">
            {option.label}
            {option.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <Textarea
            id={id}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={option.placeholder || option.description}
            disabled={disabled}
            rows={4}
            className="font-mono text-sm"
          />
          {option.description && (
            <p className="text-xs text-muted-foreground">{option.description}</p>
          )}
        </div>
      );
    case 'color':
      return (
        <div className="space-y-2">
          <label htmlFor={id} className="text-sm font-medium">
            {option.label}
            {option.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <div className="flex items-center gap-2">
            <input
              id={id}
              type="color"
              value={(value as string) || (option.defaultValue as string) || (option.default as string) || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="h-10 w-14 rounded border border-input cursor-pointer"
            />
            <Input
              type="text"
              value={(value as string) || (option.defaultValue as string) || (option.default as string) || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 font-mono text-sm"
              disabled={disabled}
            />
          </div>
          {option.description && (
            <p className="text-xs text-muted-foreground">{option.description}</p>
          )}
        </div>
      );
      
    case 'date':
      return (
        <div className="space-y-2">
          <label htmlFor={id} className="text-sm font-medium">
            {option.label}
            {option.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <Input
            id={id}
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
          {option.description && (
            <p className="text-xs text-muted-foreground">{option.description}</p>
          )}
        </div>
      );
      
    default:
      return null;
  }
}

export interface GeneratorLayoutProps {
  toolId: string;
  toolName: string;
  formOptions: ToolOption[];
  generate: (options: Record<string, unknown>) => string | Promise<string>;
  outputType?: 'text' | 'code' | 'json';
  outputLanguage?: string;
  multiGenerate?: boolean;
  generateCount?: number;
  showCssPreview?: boolean;
  cssPreviewType?: 'box' | 'text' | 'gradient' | 'element';
  className?: string;
}

export function GeneratorLayout({
  toolId,
  toolName,
  formOptions,
  generate,
  outputType = 'text',
  outputLanguage,
  multiGenerate = false,
  generateCount = 1,
  showCssPreview = false,
  cssPreviewType = 'box',
  className,
}: GeneratorLayoutProps) {
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    formOptions.forEach(opt => {
      // Check both default and defaultValue since registry uses defaultValue
      const defaultVal = opt.defaultValue ?? opt.default;
      if (defaultVal !== undefined) {
        defaults[opt.name] = defaultVal;
      }
    });
    return defaults;
  });
  const [output, setOutput] = React.useState('');
  const [outputs, setOutputs] = React.useState<string[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { copy, copied } = useCopyToClipboard();
  const [count, setCount] = React.useState(generateCount);

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

  // Handle generate
  const handleGenerate = async () => {
    if (!validateForm()) return;
    
    setIsGenerating(true);
    setError(null);
    setOutput('');
    setOutputs([]);
    
    try {
      if (multiGenerate && count > 1) {
        const results: string[] = [];
        for (let i = 0; i < count; i++) {
          const result = await generate(formValues);
          results.push(result);
        }
        setOutputs(results);
        setOutput(results.join('\n'));
      } else {
        const result = await generate(formValues);
        setOutput(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle regenerate (same options, new output)
  const handleRegenerate = async () => {
    await handleGenerate();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    // Ctrl+Enter = Generate
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  }, [formValues]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle download
  const handleDownload = () => {
    const extension = outputLanguage || (outputType === 'json' ? 'json' : 'txt');
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolId}-output.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Form panel */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <SparklesIcon />
          Options
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {formOptions.map((option) => (
            <FormField
              key={option.name}
              option={option}
              value={formValues[option.name]}
              onChange={(value) => updateFormValue(option.name, value)}
              disabled={isGenerating}
            />
          ))}
          
          {/* Multi-generate count */}
          {multiGenerate && (
            <div className="space-y-2">
              <label htmlFor="gen-count" className="text-sm font-medium">
                Generate Count
              </label>
              <Input
                id="gen-count"
                type="number"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                min={1}
                max={100}
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">Number of items to generate (1-100)</p>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Generate button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="lg"
          className="gap-2"
        >
          <SparklesIcon />
          {isGenerating ? 'Generating...' : `Generate ${toolName}`}
        </Button>
        
        {output && (
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="gap-2"
          >
            <RefreshIcon />
            Regenerate
          </Button>
        )}
      </div>

      {/* CSS Preview panel */}
      {showCssPreview && output && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center px-4 py-2 bg-muted/50 border-b border-border">
            <span className="text-sm font-medium">Live Preview</span>
          </div>
          <div className="p-8 flex items-center justify-center min-h-50 bg-[repeating-conic-gradient(#e5e7eb_0deg_90deg,#fff_90deg_180deg)_0_0/20px_20px]">
            {cssPreviewType === 'gradient' ? (
              <div
                className="w-full h-40 rounded-lg border border-border"
                style={(() => {
                  try {
                    // Extract CSS value from output
                    const match = output.match(/background[^:]*:\s*([^;]+)/i);
                    return match?.[1] ? { background: match[1].trim() } : {};
                  } catch {
                    return {};
                  }
                })()}
              />
            ) : cssPreviewType === 'text' ? (
              <div
                className="text-4xl font-bold"
                style={(() => {
                  try {
                    // Parse CSS text styles
                    const styles: React.CSSProperties = {};
                    const textShadow = output.match(/text-shadow:\s*([^;]+)/i);
                    const fontFamily = output.match(/font-family:\s*([^;]+)/i);
                    if (textShadow?.[1]) styles.textShadow = textShadow[1].trim();
                    if (fontFamily?.[1]) styles.fontFamily = fontFamily[1].trim();
                    return styles;
                  } catch {
                    return {};
                  }
                })()}
              >
                Preview Text
              </div>
            ) : (
              <div
                className="w-32 h-32 bg-primary/20 flex items-center justify-center text-sm font-medium rounded"
                style={(() => {
                  try {
                    // Parse CSS for box styles
                    const styles: React.CSSProperties = {};
                    const boxShadow = output.match(/box-shadow:\s*([^;]+)/i);
                    const borderRadius = output.match(/border-radius:\s*([^;]+)/i);
                    const display = output.match(/display:\s*([^;]+)/i);
                    const flexDirection = output.match(/flex-direction:\s*([^;]+)/i);
                    const gap = output.match(/gap:\s*([^;]+)/i);
                    const transform = output.match(/transform:\s*([^;]+)/i);
                    const filter = output.match(/filter:\s*([^;]+)/i);
                    const clipPath = output.match(/clip-path:\s*([^;]+)/i);
                    
                    if (boxShadow?.[1]) styles.boxShadow = boxShadow[1].trim();
                    if (borderRadius?.[1]) styles.borderRadius = borderRadius[1].trim();
                    if (display?.[1]) styles.display = display[1].trim() as React.CSSProperties['display'];
                    if (flexDirection?.[1]) styles.flexDirection = flexDirection[1].trim() as React.CSSProperties['flexDirection'];
                    if (gap?.[1]) styles.gap = gap[1].trim();
                    if (transform?.[1]) styles.transform = transform[1].trim();
                    if (filter?.[1]) styles.filter = filter[1].trim();
                    if (clipPath?.[1]) styles.clipPath = clipPath[1].trim();
                    return styles;
                  } catch {
                    return {};
                  }
                })()}
              >
                Preview
              </div>
            )}
          </div>
        </div>
      )}

      {/* Output panel */}
      {output && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
            <span className="text-sm font-medium">Output</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => copy(output)}
                title="Copy to clipboard"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDownload}
                title="Download"
              >
                <DownloadIcon />
              </Button>
            </div>
          </div>
          
          {outputType === 'code' || outputType === 'json' ? (
            <pre className="p-4 overflow-x-auto bg-muted/30">
              <code className="text-sm font-mono">{output}</code>
            </pre>
          ) : multiGenerate && outputs.length > 1 ? (
            <ul className="p-4 space-y-2">
              {outputs.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                >
                  <code className="font-mono text-sm truncate flex-1">{item}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 ml-2"
                    onClick={() => copy(item)}
                    title="Copy"
                  >
                    <CopyIcon />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4">
              <Textarea
                value={output}
                readOnly
                className="min-h-30 font-mono text-sm bg-muted/30 border-0"
              />
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <p className="text-xs text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Ctrl+Enter</kbd> to generate
      </p>
    </div>
  );
}

export default GeneratorLayout;

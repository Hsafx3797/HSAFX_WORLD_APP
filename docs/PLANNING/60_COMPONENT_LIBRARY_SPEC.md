# 🧩 Component Library Specification

**Package:** `packages/ui-components/`  
**Framework:** React + shadcn/ui + Tailwind CSS  
**Purpose:** Reusable components for all 446 tools

---

## 1. Overview

This specification defines custom React components that wrap shadcn/ui primitives and provide consistent UX across all tools.

**Design Principles:**
- **Composition over Configuration**: Small, composable components
- **Accessibility First**: ARIA labels, keyboard navigation
- **Consistent Styling**: Unified design system from [32_THEME_SYSTEM.md](32_THEME_SYSTEM.md)
- **Mobile Responsive**: Works on all screen sizes

---

## 2. Core Layout Components

### 2.1 ToolContainer

**Purpose:** Wraps every tool with consistent layout, header, and footer.

```tsx
// packages/ui-components/ToolContainer.tsx

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from './Breadcrumb';
import type { ToolMetadata } from '@/tool-definitions';

interface ToolContainerProps {
  tool: ToolMetadata;
  children: ReactNode;
  actions?: ReactNode; // Copy, Download, Clear buttons
  showBreadcrumb?: boolean;
  showBadges?: boolean;
}

export function ToolContainer({
  tool,
  children,
  actions,
  showBreadcrumb = true,
  showBadges = true
}: ToolContainerProps) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {showBreadcrumb && (
        <Breadcrumb
          items={[
            { label: 'Tools', href: '/tools' },
            { label: tool.category, href: `/tools/category/${tool.category}` },
            { label: tool.name, href: `/tools/${tool.slug}` }
          ]}
        />
      )}
      
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{tool.name}</CardTitle>
              <CardDescription className="mt-2">{tool.description}</CardDescription>
            </div>
            
            {showBadges && (
              <div className="flex gap-2">
                {tool.coinCost > 0 && (
                  <Badge variant="secondary">
                    {tool.coinCost} coins
                  </Badge>
                )}
                {tool.executionType === 'async' && (
                  <Badge variant="outline">Async</Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {children}
            
            {actions && (
              <div className="flex gap-2 justify-end pt-4 border-t">
                {actions}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Usage:**
```tsx
<ToolContainer tool={toolMetadata}>
  <InputSection />
  <OutputSection />
</ToolContainer>
```

---

### 2.2 InputSection

**Purpose:** Standardized input area with label and description.

```tsx
// packages/ui-components/InputSection.tsx

interface InputSectionProps {
  label: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
}

export function InputSection({
  label,
  description,
  required = false,
  children
}: InputSectionProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <div>{children}</div>
    </div>
  );
}
```

---

### 2.3 OutputSection

**Purpose:** Display tool results with copy/download actions.

```tsx
// packages/ui-components/OutputSection.tsx

import { CopyButton } from './CopyButton';
import { DownloadButton } from './DownloadButton';

interface OutputSectionProps {
  label?: string;
  value: string;
  filename?: string;
  format?: 'text' | 'json' | 'xml' | 'csv';
  showCopy?: boolean;
  showDownload?: boolean;
  readOnly?: boolean;
}

export function OutputSection({
  label = 'Output',
  value,
  filename,
  format = 'text',
  showCopy = true,
  showDownload = true,
  readOnly = true
}: OutputSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        
        <div className="flex gap-2">
          {showCopy && <CopyButton value={value} />}
          {showDownload && filename && (
            <DownloadButton
              content={value}
              filename={filename}
              format={format}
            />
          )}
        </div>
      </div>
      
      <textarea
        className="w-full min-h-[200px] p-3 font-mono text-sm border rounded-md resize-y"
        value={value}
        readOnly={readOnly}
        aria-label={label}
      />
    </div>
  );
}
```

---

## 3. Action Components

### 3.1 CopyButton

```tsx
// packages/ui-components/CopyButton.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied to clipboard!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      aria-label={label}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}
```

---

### 3.2 DownloadButton

```tsx
// packages/ui-components/DownloadButton.tsx

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
  content: string | Blob;
  filename: string;
  format: 'text' | 'json' | 'xml' | 'csv' | 'pdf';
}

export function DownloadButton({ content, filename, format }: DownloadButtonProps) {
  const handleDownload = () => {
    const blob = content instanceof Blob
      ? content
      : new Blob([content], { type: getMimeType(format) });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      aria-label={`Download ${filename}`}
    >
      <Download className="h-4 w-4 mr-2" />
      Download
    </Button>
  );
}

function getMimeType(format: string): string {
  const types: Record<string, string> = {
    text: 'text/plain',
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv',
    pdf: 'application/pdf'
  };
  return types[format] || 'text/plain';
}
```

---

## 4. File Upload Components

### 4.1 FileUploader

```tsx
// packages/ui-components/FileUploader.tsx

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploaderProps {
  accept?: Record<string, string[]>; // e.g., { 'application/pdf': ['.pdf'] }
  maxSize?: number; // bytes
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function FileUploader({
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  onUpload,
  disabled = false
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setUploading(true);
    setProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      await onUpload(uploadedFile);
      
      clearInterval(progressInterval);
      setProgress(100);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: disabled || uploading
  });
  
  const removeFile = () => {
    setFile(null);
    setProgress(0);
  };
  
  return (
    <div>
      {!file ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
          `}
        >
          <input {...getInputProps()} />
          
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          
          <p className="text-sm font-medium mb-1">
            {isDragActive ? 'Drop file here' : 'Drag & drop file here'}
          </p>
          <p className="text-xs text-muted-foreground">
            or click to browse (max {(maxSize / 1024 / 1024).toFixed(0)}MB)
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <File className="h-8 w-8 text-primary" />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            
            {!uploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-center text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 5. Option Components

### 5.1 OptionPanel

```tsx
// packages/ui-components/OptionPanel.tsx

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Settings } from 'lucide-react';
import type { ToolOption } from '@/tool-definitions';
import { OptionField } from './OptionField';

interface OptionPanelProps {
  options: ToolOption[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
}

export function OptionPanel({ options, values, onChange }: OptionPanelProps) {
  if (options.length === 0) return null;
  
  return (
    <Accordion type="single" collapsible defaultValue="options">
      <AccordionItem value="options">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Options
          </div>
        </AccordionTrigger>
        
        <AccordionContent>
          <div className="space-y-4 pt-2">
            {options.map(option => (
              <OptionField
                key={option.name}
                option={option}
                value={values[option.name]}
                onChange={value => onChange(option.name, value)}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

---

### 5.2 OptionField

```tsx
// packages/ui-components/OptionField.tsx

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { ToolOption } from '@/tool-definitions';

interface OptionFieldProps {
  option: ToolOption;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function OptionField({ option, value, onChange }: OptionFieldProps) {
  const renderField = () => {
    switch (option.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value as string || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={option.description}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value as number || ''}
            onChange={e => onChange(Number(e.target.value))}
            min={option.validation?.min}
            max={option.validation?.max}
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value as boolean || false}
              onCheckedChange={onChange}
              id={option.name}
            />
            <Label htmlFor={option.name} className="text-sm cursor-pointer">
              {option.label}
            </Label>
          </div>
        );
      
      case 'select':
        return (
          <Select
            value={value as string || option.default as string}
            onValueChange={onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${option.label}`} />
            </SelectTrigger>
            <SelectContent>
              {option.options?.map(opt => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-2">
      {option.type !== 'boolean' && (
        <Label>
          {option.label}
          {option.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      {option.description && option.type !== 'boolean' && (
        <p className="text-xs text-muted-foreground">{option.description}</p>
      )}
      
      {renderField()}
    </div>
  );
}
```

---

## 6. Progress & Status Components

### 6.1 ProgressIndicator

```tsx
// packages/ui-components/ProgressIndicator.tsx

import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  message?: string;
}

export function ProgressIndicator({ status, progress, message }: ProgressIndicatorProps) {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        {status === 'processing' && (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        )}
        
        <div className="flex-1">
          <p className="text-sm font-medium capitalize">{status}</p>
          {message && (
            <p className="text-xs text-muted-foreground mt-1">{message}</p>
          )}
        </div>
      </div>
      
      {progress !== undefined && (
        <Progress value={progress} />
      )}
    </div>
  );
}
```

---

### 6.2 ResultDisplay

```tsx
// packages/ui-components/ResultDisplay.tsx

import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ResultDisplayProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  actions?: ReactNode;
}

export function ResultDisplay({ type, title, message, actions }: ResultDisplayProps) {
  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: AlertCircle
  };
  
  const Icon = icons[type];
  
  return (
    <Alert variant={type === 'error' ? 'destructive' : 'default'}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {actions && <div className="mt-3">{actions}</div>}
      </AlertDescription>
    </Alert>
  );
}
```

---

## 7. Accessibility Features

### 7.1 Keyboard Shortcuts

```tsx
// packages/ui-components/KeyboardShortcut.tsx

import { useEffect } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        
        if (ctrlMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Usage in tool components:
// useKeyboardShortcuts([
//   { key: 'Enter', ctrl: true, action: executeTool, description: 'Execute tool' },
//   { key: 'c', ctrl: true, action: copyOutput, description: 'Copy output' }
// ]);
```

---

## 8. Mobile Responsive Utilities

```tsx
// packages/ui-components/utils/responsive.ts

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}
```

---

## 9. Component Export Index

```tsx
// packages/ui-components/index.ts

export { ToolContainer } from './ToolContainer';
export { InputSection } from './InputSection';
export { OutputSection } from './OutputSection';
export { CopyButton } from './CopyButton';
export { DownloadButton } from './DownloadButton';
export { FileUploader } from './FileUploader';
export { OptionPanel } from './OptionPanel';
export { OptionField } from './OptionField';
export { ProgressIndicator } from './ProgressIndicator';
export { ResultDisplay } from './ResultDisplay';
export { useKeyboardShortcuts } from './KeyboardShortcut';
export { useIsMobile } from './utils/responsive';
```

---

**This component library provides consistent, accessible, and reusable UI for all 446 tools.**

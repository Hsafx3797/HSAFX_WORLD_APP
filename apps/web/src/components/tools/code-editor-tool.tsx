'use client';

/**
 * CodeEditorTool - Complete UI Component for Data Converter Tools
 * 
 * Self-contained component handling all UI for code/data conversion tools.
 * Supports both POPUP (dialog) and EXPANDED (page) display modes.
 * 
 * Features:
 * - Popup mode: Full dialog with header, title, tier badge, swap, fullscreen, close
 * - Expanded mode: Just editor content (page.tsx handles header)
 * - Bidirectional conversion with swap button
 * - Dynamic title/description based on direction
 * - File upload/download
 * - Copy to clipboard
 * - Dynamic options from registry
 * - CSS preview for CSS output tools
 * - Responsive layout
 * - Keyboard shortcuts (Ctrl+Enter, Ctrl+Shift+S)
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCodeEditor, type TransformFunction } from '@/hooks/use-code-editor';
import type { ToolOption } from '@/lib/tools/types';

// ============================================================================
// DIRECTION CONTEXT
// ============================================================================

/** Context value for sharing direction state between popup header and editor content */
export interface ToolDirectionContextValue {
  /** Whether popup is managing direction (children should not show their own swap button) */
  isPopupControlled: boolean;
  /** Current direction */
  direction: 'forward' | 'reverse';
  /** Swap direction - toggles between forward/reverse */
  swapDirection: () => void;
}

export const ToolDirectionContext = React.createContext<ToolDirectionContextValue | null>(null);

/** Hook to use tool direction context - returns null if not in a popup context */
export function useToolDirection() {
  return React.useContext(ToolDirectionContext);
}

// ============================================================================
// ICONS
// ============================================================================

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

const SwapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m17 4 4 4-4 4" />
    <path d="M3 8h18" />
    <path d="m7 20-4-4 4-4" />
    <path d="M21 16H3" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const ExpandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6"/>
    <path d="M9 21H3v-6"/>
    <path d="M21 3l-7 7"/>
    <path d="M3 21l7-7"/>
  </svg>
);

const MinimizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14h6v6"/>
    <path d="M20 10h-6V4"/>
    <path d="M14 10l7-7"/>
    <path d="M3 21l7-7"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ============================================================================
// TIER BADGE COLORS
// ============================================================================

const tierColors = {
  free: 'text-green-500 bg-green-500/10 border-green-500/30',
  coin: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  premium: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
};

// ============================================================================
// MAX WIDTH CLASSES
// ============================================================================

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-[95vw]',
};

// ============================================================================
// TOOL OPTION FIELD COMPONENT
// ============================================================================

interface ToolOptionFieldProps {
  option: ToolOption;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

/** Renders a single form field based on ToolOption type */
function ToolOptionField({ option, value, onChange, disabled }: ToolOptionFieldProps) {
  const id = `opt-${option.name}`;
  
  // SELECT field
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
  
  // BOOLEAN / CHECKBOX field
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
  
  // NUMBER / RANGE field
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
  
  // DEFAULT: string/text input
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

// ============================================================================
// TYPES
// ============================================================================

/** Base props shared between both modes */
interface CodeEditorToolBaseProps {
  /** Unique tool identifier */
  toolId: string;
  /** Tool name (forward direction) - used for popup header */
  title?: string;
  /** Tool description (forward direction) - used for popup header */
  description?: string;
  /** Tool name for reverse direction */
  reverseTitle?: string;
  /** Tool description for reverse direction */
  reverseDescription?: string;
  /** Tool icon element */
  icon?: React.ReactNode;
  /** Tool tier badge */
  tier?: 'free' | 'coin' | 'premium';
  /** Input language/format */
  inputLanguage: string;
  /** Output language/format */
  outputLanguage: string;
  /** Transform function */
  transform: TransformFunction;
  /** Tool options for form fields */
  toolOptions?: ToolOption[];
  /** Whether tool supports bidirectional conversion */
  bidirectional?: boolean;
  /** Input placeholder text */
  inputPlaceholder?: string;
  /** Output placeholder text */
  outputPlaceholder?: string;
  /** Enable CSS preview pane */
  showCssPreview?: boolean;
  /** Additional class names */
  className?: string;
}

/** Props for POPUP mode - renders full dialog with header */
export interface CodeEditorToolPopupProps extends CodeEditorToolBaseProps {
  mode: 'popup';
  /** Whether popup is open */
  open: boolean;
  /** Callback when popup open state changes */
  onOpenChange: (open: boolean) => void;
  /** Max width of popup dialog */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  /** Allow fullscreen toggle */
  allowFullscreen?: boolean;
}

/** Props for EXPANDED mode - renders just editor content (no dialog) */
export interface CodeEditorToolExpandedProps extends CodeEditorToolBaseProps {
  mode?: 'expanded';
}

/** Union type for all props */
export type CodeEditorToolProps = CodeEditorToolPopupProps | CodeEditorToolExpandedProps;

// ============================================================================
// EDITOR CONTENT COMPONENT
// ============================================================================

interface EditorContentProps {
  editor: ReturnType<typeof useCodeEditor>;
  toolOptions?: ToolOption[];
  inputPlaceholder: string;
  outputPlaceholder: string;
  showCssPreview: boolean;
  bidirectional: boolean;
}

/** The actual editor panels, options, and action buttons */
function EditorContent({
  editor,
  toolOptions,
  inputPlaceholder,
  outputPlaceholder,
  showCssPreview,
  bidirectional,
}: EditorContentProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* ==================== EDITOR PANELS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* INPUT PANEL */}
        <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Input</span>
              <span className="px-2 py-0.5 rounded text-xs bg-muted text-foreground/80 font-mono">
                {editor.currentInputLang.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                ref={editor.fileInputRef}
                type="file"
                accept=".txt,.json,.xml,.yaml,.yml,.csv,.html,.css,.js,.ts,.md,.sql,.toml"
                className="hidden"
                onChange={editor.handleFileUpload}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => editor.fileInputRef.current?.click()}
                title="Upload file"
              >
                <UploadIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={editor.copyInput}
                disabled={!editor.input}
                title="Copy input"
              >
                {editor.copiedInput ? <CheckIcon /> : <CopyIcon />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={editor.clear}
                disabled={!editor.input && !editor.output}
                title="Clear all"
              >
                <ClearIcon />
              </Button>
            </div>
          </div>
          <div className="h-64 md:h-80">
            <Textarea
              value={editor.input}
              onChange={(e) => editor.setInput(e.target.value)}
              placeholder={inputPlaceholder}
              className="h-64 md:h-80 w-full resize-none border-0 rounded-none font-mono text-sm bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* OUTPUT PANEL */}
        <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Output</span>
              <span className="px-2 py-0.5 rounded text-xs bg-success/10 text-success font-mono">
                {editor.currentOutputLang.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={editor.copyOutput}
                disabled={!editor.output}
                title="Copy output"
              >
                {editor.copiedOutput ? <CheckIcon /> : <CopyIcon />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => editor.downloadOutput()}
                disabled={!editor.output}
                title="Download output"
              >
                <DownloadIcon />
              </Button>
            </div>
          </div>
          <div className="h-64 md:h-80 relative">
            <Textarea
              value={editor.output}
              readOnly
              placeholder={outputPlaceholder}
              className="h-64 md:h-80 w-full resize-none border-0 rounded-none font-mono text-sm bg-muted/30 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {editor.isConverting && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <SpinnerIcon />
                  <span>Converting...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== ERROR MESSAGE ==================== */}
      {editor.error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {editor.error}
        </div>
      )}

      {/* ==================== OPTIONS PANEL ==================== */}
      {toolOptions && toolOptions.length > 0 && (
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <h3 className="text-sm font-medium mb-3">Options</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toolOptions.map((opt) => (
              <ToolOptionField
                key={opt.name}
                option={opt}
                value={editor.optionValues[opt.name]}
                onChange={(value) => editor.updateOption(opt.name, value)}
                disabled={editor.isConverting}
              />
            ))}
          </div>
        </div>
      )}

      {/* ==================== CSS PREVIEW PANE ==================== */}
      {showCssPreview && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <EyeIcon />
              <span className="text-sm font-medium">CSS Preview</span>
            </div>
            <Button variant="ghost" size="sm" onClick={editor.togglePreview}>
              {editor.showPreview ? 'Hide' : 'Show'}
            </Button>
          </div>
          {editor.showPreview && (
            <div className="h-64 bg-white">
              <iframe
                ref={editor.previewIframeRef}
                className="w-full h-full border-0"
                title="CSS Preview"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </div>
      )}

      {/* ==================== ACTION BUTTONS ==================== */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={editor.convert}
          disabled={!editor.input.trim() || editor.isConverting}
          className="gap-2"
        >
          {editor.isConverting ? (
            <>Converting...</>
          ) : (
            <>
              <span>Convert</span>
              <ArrowRightIcon />
            </>
          )}
        </Button>
      </div>

      {/* ==================== KEYBOARD SHORTCUT HINTS ==================== */}
      <p className="text-xs text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Ctrl+Enter</kbd> to convert
        {bidirectional && (
          <> • <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Ctrl+Shift+S</kbd> to swap direction</>
        )}
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CodeEditorTool(props: CodeEditorToolProps) {
  const {
    toolId,
    title = 'Tool',
    description,
    reverseTitle,
    reverseDescription,
    icon,
    tier,
    inputLanguage,
    outputLanguage,
    transform,
    toolOptions,
    bidirectional = false,
    inputPlaceholder = '// Enter your code here...',
    outputPlaceholder = '// Output will appear here...',
    showCssPreview = false,
    className,
  } = props;

  const isPopupMode = props.mode === 'popup';

  // ==================== POPUP STATE ====================
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [internalDirection, setInternalDirection] = React.useState<'forward' | 'reverse'>('forward');

  // ==================== EDITOR HOOK ====================
  const editor = useCodeEditor({
    toolId,
    inputLanguage,
    outputLanguage,
    transform,
    toolOptions,
    bidirectional,
    showCssPreview,
  });

  // ==================== DIRECTION HANDLERS ====================
  const handleSwapDirection = React.useCallback(() => {
    if (!bidirectional) return;
    setInternalDirection(d => d === 'forward' ? 'reverse' : 'forward');
    editor.swapDirection();
  }, [bidirectional, editor]);

  // Compute dynamic title/description based on direction
  const displayTitle = bidirectional && internalDirection === 'reverse' && reverseTitle 
    ? reverseTitle 
    : title;
  const displayDescription = bidirectional && internalDirection === 'reverse' && reverseDescription 
    ? reverseDescription 
    : description;

  // Direction context for children
  const directionContextValue = React.useMemo<ToolDirectionContextValue>(() => ({
    isPopupControlled: isPopupMode && bidirectional,
    direction: internalDirection,
    swapDirection: handleSwapDirection,
  }), [isPopupMode, bidirectional, internalDirection, handleSwapDirection]);

  // ==================== POPUP KEYBOARD SHORTCUTS ====================
  React.useEffect(() => {
    if (!isPopupMode) return;
    const { open } = props as CodeEditorToolPopupProps;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      // Ctrl+Shift+S = Swap direction
      if (e.ctrlKey && e.shiftKey && e.key === 'S' && bidirectional && open) {
        e.preventDefault();
        handleSwapDirection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPopupMode, isFullscreen, bidirectional, handleSwapDirection, props]);

  // ==================== RESET ON POPUP CLOSE ====================
  React.useEffect(() => {
    if (isPopupMode) {
      const { open } = props as CodeEditorToolPopupProps;
      if (!open) {
        editor.reset();
        setIsFullscreen(false);
        setInternalDirection('forward');
      }
    }
  }, [isPopupMode, props, editor]);

  // ==================== SHARED EDITOR CONTENT ====================
  const editorContent = (
    <EditorContent
      editor={editor}
      toolOptions={toolOptions}
      inputPlaceholder={inputPlaceholder}
      outputPlaceholder={outputPlaceholder}
      showCssPreview={showCssPreview}
      bidirectional={bidirectional}
    />
  );

  // ==========================================================================
  // POPUP MODE - Full dialog with header
  // ==========================================================================
  if (isPopupMode) {
    const { open, onOpenChange, maxWidth = '4xl', allowFullscreen = true } = props as CodeEditorToolPopupProps;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'flex flex-col gap-0 p-0 overflow-hidden',
            isFullscreen
              ? 'w-screen h-screen max-w-none max-h-none rounded-none'
              : cn('w-full max-h-[90vh]', maxWidthClasses[maxWidth]),
            className
          )}
        >
          {/* ==================== POPUP HEADER ==================== */}
          <DialogHeader className="shrink-0 p-4 md:p-6 border-b border-border bg-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                    {icon}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2 flex-wrap">
                    {displayTitle}
                    {tier && (
                      <span className={cn(
                        'text-[10px] uppercase px-2 py-0.5 rounded-full border font-medium',
                        tierColors[tier]
                      )}>
                        {tier}
                      </span>
                    )}
                    {/* Swap button for bidirectional tools */}
                    {bidirectional && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSwapDirection}
                        className="gap-1.5 h-6 px-2 text-xs"
                        title="Swap direction (Ctrl+Shift+S)"
                      >
                        <SwapIcon />
                        Swap
                      </Button>
                    )}
                  </DialogTitle>
                  {displayDescription && (
                    <DialogDescription className="text-sm text-muted-foreground">
                      {displayDescription}
                    </DialogDescription>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {allowFullscreen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <MinimizeIcon /> : <ExpandIcon />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onOpenChange(false)}
                  title="Close"
                >
                  <CloseIcon />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* ==================== POPUP CONTENT ==================== */}
          <div className={cn(
            'flex-1 overflow-y-auto p-4 md:p-6 bg-background',
            isFullscreen && 'p-8'
          )}>
            <ToolDirectionContext.Provider value={directionContextValue}>
              {editorContent}
            </ToolDirectionContext.Provider>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ==========================================================================
  // EXPANDED MODE - Just editor content (page.tsx handles header)
  // ==========================================================================
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <ToolDirectionContext.Provider value={directionContextValue}>
        {editorContent}
      </ToolDirectionContext.Provider>
    </div>
  );
}

export default CodeEditorTool;

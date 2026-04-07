'use client';

/**
 * useCodeEditor Hook
 * 
 * Encapsulates all business logic for code editor tools:
 * - Input/output state management
 * - Direction state for bidirectional tools
 * - Transform/convert execution
 * - File upload/download
 * - Copy to clipboard
 * - Options state
 * - CSS preview
 * - Keyboard shortcuts
 * - Error handling
 * 
 * NOTE: When used inside ToolPopup, direction is synced via ToolDirectionContext
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useCopyToClipboard } from './use-utils';

interface ToolOption {
  name: string;
  default?: unknown;
  defaultValue?: unknown;
}

// ============================================================================
// TYPES
// ============================================================================

/** Direction for bidirectional tools */
export type CodeEditorDirection = 'forward' | 'reverse';

/** Transform/convert function signature */
export type TransformFunction = (
  input: string,
  options?: Record<string, unknown>
) => string | Promise<string>;

/** Configuration for the code editor hook */
export interface UseCodeEditorConfig {
  /** Unique tool identifier */
  toolId: string;
  /** Input language/format (e.g., 'json', 'yaml') */
  inputLanguage: string;
  /** Output language/format (e.g., 'xml', 'csv') */
  outputLanguage: string;
  /** Transform function that converts input to output */
  transform: TransformFunction;
  /** Tool options for dynamic form fields */
  toolOptions?: ToolOption[];
  /** Whether the tool supports bidirectional conversion */
  bidirectional?: boolean;
  /** Enable CSS preview pane */
  showCssPreview?: boolean;
}

/** Return type of the useCodeEditor hook */
export interface UseCodeEditorReturn {
  // ---- State ----
  /** Current input value */
  input: string;
  /** Set input value */
  setInput: (value: string) => void;
  /** Current output value */
  output: string;
  /** Set output value */
  setOutput: (value: string) => void;
  /** Whether currently converting */
  isConverting: boolean;
  /** Error message if any */
  error: string | null;
  /** Current direction ('forward' or 'reverse') */
  direction: CodeEditorDirection;
  /** Current option values */
  optionValues: Record<string, unknown>;
  /** Whether CSS preview is shown */
  showPreview: boolean;
  
  // ---- Computed ----
  /** Current input language based on direction */
  currentInputLang: string;
  /** Current output language based on direction */
  currentOutputLang: string;
  /** Whether the tool is bidirectional */
  isBidirectional: boolean;
  /** Whether direction is controlled by parent popup (hide our own swap button) */
  isPopupControlled: boolean;
  
  // ---- Actions ----
  /** Execute conversion */
  convert: () => Promise<void>;
  /** Swap direction (for bidirectional tools) */
  swapDirection: () => void;
  /** Update a single option value */
  updateOption: (name: string, value: unknown) => void;
  /** Clear all input/output/error */
  clear: () => void;
  /** Handle file upload event */
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Download content as file */
  downloadOutput: (filename?: string) => void;
  /** Toggle CSS preview visibility */
  togglePreview: () => void;
  /** Reset to initial state */
  reset: () => void;
  
  // ---- Copy ----
  /** Copy input to clipboard */
  copyInput: () => Promise<boolean>;
  /** Whether input was recently copied */
  copiedInput: boolean;
  /** Copy output to clipboard */
  copyOutput: () => Promise<boolean>;
  /** Whether output was recently copied */
  copiedOutput: boolean;
  
  // ---- Refs ----
  /** Ref for file input element */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** Ref for CSS preview iframe */
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useCodeEditor(config: UseCodeEditorConfig): UseCodeEditorReturn {
  const {
    toolId,
    inputLanguage,
    outputLanguage,
    transform,
    toolOptions,
    bidirectional = false,
    showCssPreview = false,
  } = config;

  // ---- Context (popup removed — direction is always internal) ----
  const isPopupControlled = false;

  // ---- Core State ----
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalDirection, setInternalDirection] = useState<CodeEditorDirection>('forward');
  const [showPreview, setShowPreview] = useState(false);
  
  // Use internal direction always (popup removed)
  const direction = internalDirection;

  // Track previous direction to detect external changes (from popup)
  const prevDirectionRef = useRef(direction);
  
  // Sync I/O swap when popup changes direction
  useEffect(() => {
    if (isPopupControlled && prevDirectionRef.current !== direction) {
      // Direction was changed externally (by popup), swap I/O
      setInput(prev => {
        const currentOutput = output;
        setOutput(prev);
        return currentOutput;
      });
      setError(null);
    }
    prevDirectionRef.current = direction;
  }, [direction, isPopupControlled, output]);
  
  // ---- Options State ----
  const [optionValues, setOptionValues] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    toolOptions?.forEach(opt => {
      if (opt.default !== undefined) defaults[opt.name] = opt.default;
      else if (opt.defaultValue !== undefined) defaults[opt.name] = opt.defaultValue;
    });
    return defaults;
  });

  // ---- Clipboard ----
  const { copy: copyInputFn, copied: copiedInput } = useCopyToClipboard();
  const { copy: copyOutputFn, copied: copiedOutput } = useCopyToClipboard();

  // ---- Refs ----
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  // ---- Computed Values ----
  const currentInputLang = direction === 'forward' ? inputLanguage : outputLanguage;
  const currentOutputLang = direction === 'forward' ? outputLanguage : inputLanguage;

  // ---- CSS Preview Helper ----
  const updateCssPreview = useCallback((css: string) => {
    if (!previewIframeRef.current) return;
    
    const previewHtml = `<!DOCTYPE html>
<html>
<head>
  <style>${css}</style>
</head>
<body>
  <div class="preview-container">
    <h1>Heading 1</h1>
    <h2>Heading 2</h2>
    <p>This is a paragraph of text. It contains <strong>bold</strong> and <em>italic</em> text.</p>
    <button class="btn">Button</button>
    <a href="#">Link</a>
    <div class="box">Sample Box</div>
    <ul><li>List item 1</li><li>List item 2</li></ul>
  </div>
</body>
</html>`;
    
    const blob = new Blob([previewHtml], { type: 'text/html' });
    previewIframeRef.current.src = URL.createObjectURL(blob);
  }, []);

  // ---- Actions ----
  
  /** Execute the conversion transform */
  const convert = useCallback(async () => {
    if (!input.trim()) return;
    
    setIsConverting(true);
    setError(null);
    
    try {
      const result = await transform(input, { direction, ...optionValues });
      setOutput(result);
      
      // Update CSS preview if enabled
      if (showCssPreview && previewIframeRef.current) {
        updateCssPreview(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setOutput('');
    } finally {
      setIsConverting(false);
    }
  }, [input, transform, direction, optionValues, showCssPreview, updateCssPreview]);

  /** Swap direction for bidirectional tools */
  const swapDirection = useCallback(() => {
    if (!bidirectional) return;
    
    setInternalDirection(d => d === 'forward' ? 'reverse' : 'forward');
    
    // Always swap input/output values
    const temp = input;
    setInput(output);
    setOutput(temp);
    setError(null);
  }, [bidirectional, input, output]);

  /** Update a single option value */
  const updateOption = useCallback((name: string, value: unknown) => {
    setOptionValues(prev => ({ ...prev, [name]: value }));
  }, []);

  /** Clear all state */
  const clear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
  }, []);

  /** Handle file upload */
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInput(event.target?.result as string || '');
        setError(null);
      };
      reader.readAsText(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /** Download output as file */
  const downloadOutput = useCallback((filename?: string) => {
    if (!output) return;
    
    const defaultFilename = `${toolId}-output.${currentOutputLang}`;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output, toolId, currentOutputLang]);

  /** Toggle CSS preview */
  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

  /** Reset to initial state */
  const reset = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setInternalDirection('forward');
    setShowPreview(false);
    // Reset options to defaults
    const defaults: Record<string, unknown> = {};
    toolOptions?.forEach(opt => {
      if (opt.default !== undefined) defaults[opt.name] = opt.default;
      else if (opt.defaultValue !== undefined) defaults[opt.name] = opt.defaultValue;
    });
    setOptionValues(defaults);
  }, [toolOptions]);

  /** Copy input to clipboard */
  const copyInput = useCallback(async () => {
    return copyInputFn(input);
  }, [copyInputFn, input]);

  /** Copy output to clipboard */
  const copyOutput = useCallback(async () => {
    return copyOutputFn(output);
  }, [copyOutputFn, output]);

  // ---- Keyboard Shortcuts ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter = Convert
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        convert();
      }
      // Ctrl+Shift+S = Swap direction (bidirectional only)
      if (e.ctrlKey && e.shiftKey && e.key === 'S' && bidirectional) {
        e.preventDefault();
        swapDirection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [convert, swapDirection, bidirectional]);

  // ---- Return ----
  return {
    // State
    input,
    setInput,
    output,
    setOutput,
    isConverting,
    error,
    direction,
    optionValues,
    showPreview,
    
    // Computed
    currentInputLang,
    currentOutputLang,
    isBidirectional: bidirectional,
    isPopupControlled,
    
    // Actions
    convert,
    swapDirection,
    updateOption,
    clear,
    handleFileUpload,
    downloadOutput,
    togglePreview,
    reset,
    
    // Copy
    copyInput,
    copiedInput,
    copyOutput,
    copiedOutput,
    
    // Refs
    fileInputRef,
    previewIframeRef,
  };
}

export default useCodeEditor;

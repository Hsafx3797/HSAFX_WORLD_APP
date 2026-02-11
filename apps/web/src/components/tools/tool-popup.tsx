'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ============== TOOL DIRECTION CONTEXT ==============
// Context for sharing direction state between ToolPopup (header) and CodeEditorLayout (content)
export interface ToolDirectionContextValue {
  /** Whether popup is managing direction (children should not show their own swap button) */
  isPopupControlled: boolean;
  /** Current direction */
  direction: 'forward' | 'reverse';
  /** Swap direction - toggles between forward/reverse */
  swapDirection: () => void;
  /** Callback for children to notify when they swap input/output */
  onInputOutputSwapped?: () => void;
}

export const ToolDirectionContext = React.createContext<ToolDirectionContextValue | null>(null);

/** Hook to use tool direction context - returns null if not in a popup context */
export function useToolDirection() {
  return React.useContext(ToolDirectionContext);
}

// ============== ICONS ==============
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

const SwapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m17 4 4 4-4 4" />
    <path d="M3 8h18" />
    <path d="m7 20-4-4 4-4" />
    <path d="M21 16H3" />
  </svg>
);

// ============== TYPES ==============
export interface ToolPopupProps {
  /** Whether the popup is open */
  open: boolean;
  /** Callback when popup should close */
  onOpenChange: (open: boolean) => void;
  /** Tool title displayed in header (used when not bidirectional, or as forward title) */
  title: string;
  /** Tool description (used when not bidirectional, or as forward description) */
  description?: string;
  /** Reverse direction title (for bidirectional tools) */
  reverseTitle?: string;
  /** Reverse direction description (for bidirectional tools) */
  reverseDescription?: string;
  /** Icon element for the tool */
  icon?: React.ReactNode;
  /** Tool tier badge (free, coin, premium) */
  tier?: 'free' | 'coin' | 'premium';
  /** Additional class names for the content */
  className?: string;
  /** Children to render inside the popup */
  children: React.ReactNode;
  /** Max width of the popup */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  /** Whether to show fullscreen toggle */
  allowFullscreen?: boolean;
  /** Whether the tool is bidirectional (can swap direction) */
  bidirectional?: boolean;
  /** Current direction: 'forward' or 'reverse' */
  direction?: 'forward' | 'reverse';
  /** Callback when user swaps direction */
  onSwapDirection?: () => void;
}

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

const tierColors = {
  free: 'text-green-500 bg-green-500/10 border-green-500/30',
  coin: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  premium: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
};

export function ToolPopup({
  open,
  onOpenChange,
  title,
  description,
  reverseTitle,
  reverseDescription,
  icon,
  tier,
  className,
  children,
  maxWidth = '3xl',
  allowFullscreen = true,
  bidirectional = false,
  direction: externalDirection,
  onSwapDirection,
}: ToolPopupProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  
  // Internal direction state - managed by popup if bidirectional
  const [internalDirection, setInternalDirection] = React.useState<'forward' | 'reverse'>('forward');
  
  // Use external direction if provided, otherwise use internal
  const direction = externalDirection ?? internalDirection;

  // Swap direction handler
  const handleSwapDirection = React.useCallback(() => {
    if (!bidirectional) return;
    
    // Update internal state
    setInternalDirection(d => d === 'forward' ? 'reverse' : 'forward');
    
    // Also call external handler if provided
    onSwapDirection?.();
  }, [bidirectional, onSwapDirection]);

  // Compute dynamic title and description based on direction
  const displayTitle = bidirectional && direction === 'reverse' && reverseTitle ? reverseTitle : title;
  const displayDescription = bidirectional && direction === 'reverse' && reverseDescription ? reverseDescription : description;

  // Context value for children (CodeEditorLayout)
  const directionContextValue = React.useMemo<ToolDirectionContextValue>(() => ({
    isPopupControlled: bidirectional,
    direction,
    swapDirection: handleSwapDirection,
  }), [bidirectional, direction, handleSwapDirection]);

  // Close on escape, swap on Ctrl+Shift+S
  React.useEffect(() => {
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
  }, [isFullscreen, bidirectional, open, handleSwapDirection]);
  
  // Reset direction when popup closes
  React.useEffect(() => {
    if (!open) {
      setInternalDirection('forward');
    }
  }, [open]);

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
        {/* Header */}
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
                  {/* Swap button for bidirectional tools - right after title/tier */}
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

        {/* Content - wrapped in direction context for bidirectional tools */}
        <div className={cn(
          'flex-1 overflow-y-auto p-4 md:p-6 bg-background',
          isFullscreen && 'p-8'
        )}>
          <ToolDirectionContext.Provider value={directionContextValue}>
            {children}
          </ToolDirectionContext.Provider>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ToolPopup;

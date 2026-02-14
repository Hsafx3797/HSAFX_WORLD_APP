'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog compound components must be rendered within Dialog');
  }
  return context;
}

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const instanceId = React.useId();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  const titleId = `dialog-title-${instanceId}`;
  const descriptionId = `dialog-desc-${instanceId}`;

  return (
    <DialogContext.Provider value={{ open, setOpen, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({ children }: { children: React.ReactNode }) {
  const { setOpen } = useDialog();

  return (
    <button type="button" onClick={() => setOpen(true)} className="cursor-pointer">
      {children}
    </button>
  );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { open, setOpen, titleId, descriptionId } = useDialog();
  const [mounted, setMounted] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      // Focus trap: focus first focusable element
      requestAnimationFrame(() => {
        const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.[0]?.focus();
      });
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      // Restore focus when dialog closes
      previousFocusRef.current?.focus();
    };
  }, [open, setOpen]);

  // Focus trap: keep Tab within the dialog
  React.useEffect(() => {
    if (!open) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !contentRef.current) return;
      const focusable = contentRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      {/* Content */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 text-center sm:text-left',
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialog();
  return (
    <h2
      id={titleId}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialog();
  return (
    <p
      id={descriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

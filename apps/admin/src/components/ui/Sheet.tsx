'use client';

import * as React from 'react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface SheetContentProps {
  className?: string;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

interface SheetTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const SheetContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({ asChild, children, onClick }: SheetTriggerProps) {
  const { setOpen } = React.useContext(SheetContext);
  
  const handleClick = () => {
    setOpen(true);
    onClick?.();
  };
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: handleClick,
    });
  }
  
  return (
    <button onClick={handleClick} type="button">
      {children}
    </button>
  );
}

export function SheetContent({ className = '', children, side = 'left' }: SheetContentProps) {
  const { open, setOpen } = React.useContext(SheetContext);
  
  if (!open) return null;
  
  const sideClasses = {
    left: 'left-0 top-0 h-full w-72 animate-slide-in-left',
    right: 'right-0 top-0 h-full w-72 animate-slide-in-right',
    top: 'top-0 left-0 w-full h-auto animate-slide-in-top',
    bottom: 'bottom-0 left-0 w-full h-auto animate-slide-in-bottom',
  };
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      
      {/* Sheet panel */}
      <div
        className={`fixed z-50 bg-card border-r shadow-xl ${sideClasses[side]} ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-accent"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        {children}
      </div>
      
      {/* Animation styles */}
      <style jsx global>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.2s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

export function SheetHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 border-b ${className}`}>{children}</div>;
}

export function SheetTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}

export function SheetDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}

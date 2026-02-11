/**
 * Button Component
 * Reusable button with variants and sizes
 * Tailwind v4 compatible with CSS variable theming
 */

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'destructive' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary disabled:opacity-50',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary disabled:opacity-50',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive disabled:opacity-50',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive disabled:opacity-50',
  ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-ring',
  outline: 'bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground focus:ring-ring',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 font-medium rounded-lg
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
          disabled:cursor-not-allowed disabled:opacity-60
          transition-colors duration-150
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Icon button variant
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon: ReactNode;
  label: string;
}

const iconSizeClasses = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', icon, label, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={`
          inline-flex items-center justify-center rounded-lg
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
          disabled:cursor-not-allowed disabled:opacity-60
          transition-colors duration-150
          ${variantClasses[variant]}
          ${iconSizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Button Group
interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className = '' }: ButtonGroupProps) {
  return (
    <div className={`inline-flex rounded-lg overflow-hidden border border-border ${className}`}>
      {children}
    </div>
  );
}

interface ButtonGroupItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const ButtonGroupItem = forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
  ({ active = false, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          px-4 py-2 text-sm font-medium
          border-r border-border last:border-r-0
          focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring
          disabled:cursor-not-allowed disabled:opacity-60
          ${active 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-card text-foreground hover:bg-accent'
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ButtonGroupItem.displayName = 'ButtonGroupItem';

/**
 * Badge Component
 * Status badges and labels
 */

import { ReactNode } from 'react';

type BadgeVariant = 
  | 'default' 
  | 'primary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info'
  | 'muted';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-chart-2/10 text-chart-2',
  muted: 'bg-muted text-muted-foreground',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted-foreground',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-chart-2',
  muted: 'bg-muted-foreground',
};

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'sm',
  dot = false,
}: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variantClasses[variant]} ${sizeClasses}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotClasses[variant]}`} />
      )}
      {children}
    </span>
  );
}

// Preset badges for common statuses
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'muted', label: 'Inactive' },
    pending: { variant: 'warning', label: 'Pending' },
    banned: { variant: 'danger', label: 'Banned' },
    suspended: { variant: 'danger', label: 'Suspended' },
    deleted: { variant: 'muted', label: 'Deleted' },
    enabled: { variant: 'success', label: 'Enabled' },
    disabled: { variant: 'muted', label: 'Disabled' },
    paid: { variant: 'success', label: 'Paid' },
    unpaid: { variant: 'warning', label: 'Unpaid' },
    overdue: { variant: 'danger', label: 'Overdue' },
    cancelled: { variant: 'muted', label: 'Cancelled' },
    paused: { variant: 'warning', label: 'Paused' },
    expired: { variant: 'muted', label: 'Expired' },
    trial: { variant: 'info', label: 'Trial' },
    processing: { variant: 'info', label: 'Processing' },
    completed: { variant: 'success', label: 'Completed' },
    failed: { variant: 'danger', label: 'Failed' },
  };

  const config = statusMap[status.toLowerCase()] || { variant: 'default' as BadgeVariant, label: status };
  
  return <Badge variant={config.variant} dot>{config.label}</Badge>;
}

export function PlanBadge({ plan }: { plan: string }) {
  const planMap: Record<string, { variant: BadgeVariant; label: string }> = {
    free: { variant: 'muted', label: 'Free' },
    starter: { variant: 'info', label: 'Starter' },
    pro: { variant: 'primary', label: 'Pro' },
    enterprise: { variant: 'success', label: 'Enterprise' },
    lifetime: { variant: 'warning', label: 'Lifetime' },
  };

  const config = planMap[plan.toLowerCase()] || { variant: 'default' as BadgeVariant, label: plan };
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const roleMap: Record<string, { variant: BadgeVariant; label: string }> = {
    super_admin: { variant: 'danger', label: 'Super Admin' },
    admin: { variant: 'primary', label: 'Admin' },
    moderator: { variant: 'info', label: 'Moderator' },
    support: { variant: 'success', label: 'Support' },
    viewer: { variant: 'muted', label: 'Viewer' },
  };

  const config = roleMap[role.toLowerCase()] || { variant: 'default' as BadgeVariant, label: role };
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function TierBadge({ tier }: { tier: 'anonymous' | 'free' | 'pro' | 'premium' | 'advance' }) {
  switch (tier) {
    case 'premium':
    case 'advance':
      return <Badge variant="warning">Premium</Badge>;
    case 'pro':
      return <Badge variant="success">Pro</Badge>;
    case 'anonymous':
      return <Badge variant="muted">Anonymous</Badge>;
    default:
      return <Badge variant="muted">Free</Badge>;
  }
}

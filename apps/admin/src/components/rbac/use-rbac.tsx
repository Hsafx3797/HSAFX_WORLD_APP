/**
 * RBAC Context and Hooks
 * Admin Panel - Role-Based Access Control
 */

'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { AdminSession, AdminRole, Permission } from '@/lib/types';
import { hasPermission, hasAnyPermission, hasAllPermissions, requiresTwoFactor } from '@/lib/permissions';

// Context type
interface RBACContextValue {
  session: AdminSession | null;
  isLoading: boolean;
  error: Error | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  requiresTwoFactor: (permission: Permission) => boolean;
  role: AdminRole | null;
  isTwoFactorVerified: boolean;
}

// Create context
const RBACContext = React.createContext<RBACContextValue | null>(null);

// Provider props
interface RBACProviderProps {
  children: React.ReactNode;
  session?: AdminSession | null;
}

/**
 * RBAC Provider Component
 */
export function RBACProvider({ children, session: initialSession }: RBACProviderProps) {
  const [session, setSession] = React.useState<AdminSession | null>(initialSession ?? null);
  const [isLoading, setIsLoading] = React.useState(!initialSession);
  const [error, setError] = React.useState<Error | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch session if not provided
  React.useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
      setIsLoading(false);
      return;
    }

    async function fetchSession() {
      try {
        const response = await fetch('/api/admin/session');
        if (!response.ok) {
          throw new Error('Failed to fetch session');
        }
        const data = await response.json();
        setSession(data.session);

        // If 2FA is enabled but not verified, redirect to verification page
        // (unless already on the verification page or login)
        if (
          data.session?.twoFactorEnabled &&
          !data.session?.twoFactorVerified &&
          pathname !== '/verify-2fa' &&
          pathname !== '/login'
        ) {
          router.replace(`/verify-2fa?callbackUrl=${encodeURIComponent(pathname || '/dashboard')}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, [initialSession, pathname, router]);

  const value = React.useMemo<RBACContextValue>(() => ({
    session,
    isLoading,
    error,
    hasPermission: (permission: Permission) => {
      if (!session) return false;
      return hasPermission(session.role, permission);
    },
    hasAnyPermission: (permissions: Permission[]) => {
      if (!session) return false;
      return hasAnyPermission(session.role, permissions);
    },
    hasAllPermissions: (permissions: Permission[]) => {
      if (!session) return false;
      return hasAllPermissions(session.role, permissions);
    },
    requiresTwoFactor: (permission: Permission) => {
      return requiresTwoFactor(permission);
    },
    role: session?.role ?? null,
    isTwoFactorVerified: session?.twoFactorVerified ?? false,
  }), [session, isLoading, error]);

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

/**
 * Hook to access RBAC context
 */
export function useRBAC(): RBACContextValue {
  const context = React.useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
}

/**
 * Hook to check single permission
 */
export function usePermission(permission: Permission): {
  hasPermission: boolean;
  isLoading: boolean;
  requiresTwoFactor: boolean;
  isTwoFactorVerified: boolean;
} {
  const { hasPermission: checkPermission, isLoading, requiresTwoFactor: check2FA, isTwoFactorVerified } = useRBAC();
  
  return {
    hasPermission: checkPermission(permission),
    isLoading,
    requiresTwoFactor: check2FA(permission),
    isTwoFactorVerified,
  };
}

/**
 * Hook to check multiple permissions (any)
 */
export function useAnyPermission(permissions: Permission[]): {
  hasPermission: boolean;
  isLoading: boolean;
} {
  const { hasAnyPermission, isLoading } = useRBAC();
  
  return {
    hasPermission: hasAnyPermission(permissions),
    isLoading,
  };
}

/**
 * Hook to check multiple permissions (all)
 */
export function useAllPermissions(permissions: Permission[]): {
  hasPermission: boolean;
  isLoading: boolean;
} {
  const { hasAllPermissions, isLoading } = useRBAC();
  
  return {
    hasPermission: hasAllPermissions(permissions),
    isLoading,
  };
}

/**
 * Hook to get current role
 */
export function useAdminRole(): {
  role: AdminRole | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  isDeveloper: boolean;
  isAnalyst: boolean;
  isBilling: boolean;
} {
  const { role, isLoading } = useRBAC();
  
  return {
    role,
    isLoading,
    isSuperAdmin: role === 'super_admin',
    isAdmin: role === 'admin' || role === 'super_admin',
    isSupport: role === 'support',
    isDeveloper: role === 'developer',
    isAnalyst: role === 'analyst',
    isBilling: role === 'billing',
  };
}

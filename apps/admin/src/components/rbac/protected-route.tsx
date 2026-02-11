/**
 * Protected Route Component
 * Admin Panel - Route-level permission enforcement
 */

'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Permission } from '@/lib/types';
import { getRoutePermission } from '@/lib/permissions';
import { useRBAC } from './use-rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  redirectTo?: string;
}

/**
 * ProtectedRoute - Wraps a page to enforce route-level permissions
 */
export function ProtectedRoute({
  children,
  permission,
  redirectTo = '/unauthorized',
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading, hasPermission } = useRBAC();

  // Determine required permission
  const requiredPermission = permission ?? getRoutePermission(pathname);

  React.useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (!session) {
      router.replace('/login');
      return;
    }

    // No permission required for this route
    if (!requiredPermission) return;

    // Check permission
    if (!hasPermission(requiredPermission)) {
      router.replace(redirectTo);
    }
  }, [isLoading, session, requiredPermission, hasPermission, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return <RouteLoadingState />;
  }

  // Not authenticated
  if (!session) {
    return <RouteLoadingState />;
  }

  // Permission denied
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <RouteLoadingState />;
  }

  return <>{children}</>;
}

/**
 * Route loading state
 */
function RouteLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Higher-order component for page-level protection
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  permission?: Permission
) {
  return function ProtectedPage(props: P) {
    return (
      <ProtectedRoute permission={permission}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Permission Guard Components
 * Admin Panel - RBAC UI Components
 */

'use client';

import * as React from 'react';
import type { Permission } from '@/lib/types';
import { usePermission, useAnyPermission, useAllPermissions, useRBAC } from './use-rbac';

// ==================== CAN COMPONENT ====================

interface CanProps {
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
  not?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Can Component - Renders children only if permission is granted
 * 
 * @example
 * <Can permission="users.edit">
 *   <EditButton />
 * </Can>
 * 
 * @example
 * <Can anyOf={['users.edit', 'users.delete']} fallback={<DisabledButton />}>
 *   <ActionButton />
 * </Can>
 */
export function Can({ 
  permission, 
  anyOf, 
  allOf, 
  not = false, 
  fallback = null, 
  children 
}: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useRBAC();

  if (isLoading) {
    return null;
  }

  let allowed = false;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (anyOf) {
    allowed = hasAnyPermission(anyOf);
  } else if (allOf) {
    allowed = hasAllPermissions(allOf);
  }

  if (not) {
    allowed = !allowed;
  }

  return <>{allowed ? children : fallback}</>;
}

// ==================== CANNOT COMPONENT ====================

interface CannotProps {
  permission: Permission;
  children: React.ReactNode;
}

/**
 * Cannot Component - Renders children only if permission is NOT granted
 */
export function Cannot({ permission, children }: CannotProps) {
  return (
    <Can permission={permission} not>
      {children}
    </Can>
  );
}

// ==================== REQUIRE PERMISSION ====================

interface RequirePermissionProps {
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
  children: React.ReactNode;
  unauthorizedMessage?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * RequirePermission - Shows unauthorized message if permission denied
 */
export function RequirePermission({
  permission,
  anyOf,
  allOf,
  children,
  unauthorizedMessage = 'You do not have permission to view this content.',
  loadingComponent,
}: RequirePermissionProps) {
  const { isLoading } = useRBAC();

  if (isLoading) {
    return <>{loadingComponent ?? <PermissionLoadingState />}</>;
  }

  return (
    <Can
      permission={permission}
      anyOf={anyOf}
      allOf={allOf}
      fallback={<UnauthorizedMessage message={unauthorizedMessage} />}
    >
      {children}
    </Can>
  );
}

// ==================== REQUIRE TWO FACTOR ====================

interface RequireTwoFactorProps {
  permission: Permission;
  children: React.ReactNode;
  onTwoFactorRequired?: () => void;
}

/**
 * RequireTwoFactor - Enforces 2FA for destructive operations
 */
export function RequireTwoFactor({
  permission,
  children,
  onTwoFactorRequired,
}: RequireTwoFactorProps) {
  const { hasPermission, requiresTwoFactor, isTwoFactorVerified } = usePermission(permission);

  if (!hasPermission) {
    return null;
  }

  if (requiresTwoFactor && !isTwoFactorVerified) {
    return (
      <TwoFactorRequired onVerify={onTwoFactorRequired}>
        {children}
      </TwoFactorRequired>
    );
  }

  return <>{children}</>;
}

// ==================== ROLE GATE ====================

interface RoleGateProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGate - Renders based on specific roles
 */
export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { role, isLoading } = useRBAC();

  if (isLoading) {
    return null;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ==================== SUPER ADMIN ONLY ====================

interface SuperAdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * SuperAdminOnly - Renders only for super admins
 */
export function SuperAdminOnly({ children, fallback = null }: SuperAdminOnlyProps) {
  return (
    <RoleGate allowedRoles={['super_admin']} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

// ==================== HELPER COMPONENTS ====================

function PermissionLoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function UnauthorizedMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <svg
          className="h-6 w-6 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Access Denied
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {message}
      </p>
    </div>
  );
}

function TwoFactorRequired({ 
  children, 
  onVerify 
}: { 
  children: React.ReactNode;
  onVerify?: () => void;
}) {
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center p-4">
          <div className="rounded-full bg-warning/10 p-3 mb-4 mx-auto w-fit">
            <svg
              className="h-6 w-6 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Two-Factor Required
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            This action requires two-factor authentication.
          </p>
          {onVerify && (
            <button
              onClick={onVerify}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Verify Identity
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

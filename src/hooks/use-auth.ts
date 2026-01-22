/**
 * @file use-auth.ts
 * @description React hooks for authentication state
 * @layer Hook
 * @status PLACEHOLDER - Auth hooks defined
 */

'use client';

import { useSession } from 'next-auth/react';
import type { UserRole } from '@/types/user.types';

/**
 * Get current authentication state
 */
export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    status,
  };
}

/**
 * Check if current user has required role
 */
export function useHasRole(requiredRole: UserRole | UserRole[]) {
  const { user } = useAuth();

  if (!user) return false;

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  // TODO: Implement role hierarchy
  // ADMIN > MANAGER > SCHEDULER > VIEWER
  return roles.includes(user.role as UserRole);
}

/**
 * Check if user can perform specific action
 */
export function useCanPerform(action: string) {
  const { user } = useAuth();

  // TODO: Implement permission checks based on action
  // This could be expanded to a full RBAC system
  const permissions: Record<string, UserRole[]> = {
    'create:ticket': ['SUPER_ADMIN', 'MANAGER', 'SCHEDULER'],
    'update:ticket': ['SUPER_ADMIN', 'MANAGER', 'SCHEDULER'],
    'delete:ticket': ['SUPER_ADMIN', 'MANAGER'],
    'manage:users': ['SUPER_ADMIN'],
    'manage:creators': ['SUPER_ADMIN', 'MANAGER'],
  };

  if (!user) return false;

  const allowedRoles = permissions[action];
  if (!allowedRoles) return false;

  return allowedRoles.includes(user.role as UserRole);
}

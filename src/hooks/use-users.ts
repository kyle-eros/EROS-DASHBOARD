/**
 * @file use-users.ts
 * @description React hooks for user data fetching
 * @layer Hook
 * @status PLACEHOLDER - TanStack Query hooks defined
 */

'use client';

/**
 * Query keys for users
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

/**
 * Fetch users list
 */
export function useUsers(_filters?: Record<string, unknown>) {
  // TODO: Implement with useQuery
  return {
    data: undefined,
    isLoading: false,
    error: null,
  };
}

/**
 * Fetch single user
 */
export function useUser(_id: string) {
  // TODO: Implement with useQuery
  return {
    data: undefined,
    isLoading: false,
    error: null,
  };
}

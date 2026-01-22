/**
 * @file user.types.ts
 * @description TypeScript type definitions for users
 * @layer Types
 * @status PLACEHOLDER - Core types defined, extend as schema evolves
 *
 * These types should align with the Prisma schema once implemented.
 */

import type { USER_ROLE } from '@/lib/constants';

/**
 * User role type derived from constants
 */
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

/**
 * Core user entity
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

/**
 * User with related statistics
 */
export interface UserWithStats extends User {
  _count: {
    assignedTickets: number;
    createdTickets: number;
  };
}

/**
 * Input type for creating a user
 */
export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

/**
 * Input type for updating a user
 */
export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

/**
 * Input type for changing password
 */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Filter options for user queries
 */
export interface UserFilters {
  role?: UserRole | UserRole[];
  isActive?: boolean;
  search?: string;
}

/**
 * User list response with pagination
 */
export interface UserListResponse {
  users: UserWithStats[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

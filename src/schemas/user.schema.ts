/**
 * @file user.schema.ts
 * @description Zod validation schemas for user management operations
 * @layer Schema/Validation
 * @status IMPLEMENTED
 *
 * User management schemas for:
 * - Creating new users (admin operation)
 * - Updating user details
 * - Filtering/querying user lists
 * - User profile updates
 *
 * Uses Prisma's UserRole enum via z.nativeEnum() for type safety
 * and centralized VALIDATION constants for consistency.
 */

import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { VALIDATION, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants';

// ============================================================================
// SHARED FIELD SCHEMAS
// ============================================================================

/**
 * User role schema using Prisma enum
 * Valid values: SUPER_ADMIN, MANAGER, SCHEDULER, CHATTER, CREATOR
 */
export const userRoleSchema = z.nativeEnum(UserRole);

/**
 * Email validation schema (re-exported for consistency)
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .transform((val) => val.trim().toLowerCase());

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .transform((val) => val.trim());

/**
 * Password validation schema with strength requirements
 */
export const passwordSchema = z
  .string()
  .min(
    VALIDATION.PASSWORD_MIN_LENGTH,
    `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`
  )
  .max(
    VALIDATION.PASSWORD_MAX_LENGTH,
    `Password must be less than ${VALIDATION.PASSWORD_MAX_LENGTH} characters`
  )
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

// ============================================================================
// CREATE USER SCHEMA
// ============================================================================

/**
 * Create user schema (admin operation)
 *
 * Used by administrators to create new user accounts.
 * Requires all mandatory fields including password.
 *
 * @example
 * ```typescript
 * const result = createUserSchema.safeParse({
 *   email: 'newuser@example.com',
 *   password: 'SecurePass123',
 *   name: 'Jane Doe',
 *   role: 'SCHEDULER'
 * });
 * ```
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: userRoleSchema,
});

// ============================================================================
// UPDATE USER SCHEMA
// ============================================================================

/**
 * Update user schema (partial updates)
 *
 * All fields are optional - only provided fields will be updated.
 * Password changes should use the dedicated changePasswordSchema.
 *
 * @example
 * ```typescript
 * const result = updateUserSchema.safeParse({
 *   name: 'Jane Smith',
 *   role: 'MANAGER'
 * });
 * ```
 */
export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

/**
 * Update user profile schema (self-update)
 *
 * Limited fields that users can update on their own profile.
 * Does not include role or isActive (admin-only fields).
 *
 * @example
 * ```typescript
 * const result = updateUserProfileSchema.safeParse({
 *   name: 'John Smith'
 * });
 * ```
 */
export const updateUserProfileSchema = z.object({
  name: nameSchema.optional(),
});

// ============================================================================
// USER FILTER SCHEMA
// ============================================================================

/**
 * User filter schema for querying user lists
 *
 * Supports filtering by role, active status, and search.
 * Uses z.coerce for query parameters from URL.
 *
 * @example
 * ```typescript
 * const result = userFilterSchema.safeParse({
 *   search: 'john',
 *   role: 'MANAGER',
 *   isActive: true,
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export const userFilterSchema = z.object({
  /** Search term for name or email */
  search: z
    .string()
    .max(100, 'Search term too long')
    .optional()
    .transform((val) => val?.trim()),

  /** Filter by specific role */
  role: userRoleSchema.optional(),

  /** Filter by active status */
  isActive: z
    .union([
      z.boolean(),
      z.string().transform((val) => val === 'true'),
    ])
    .optional(),

  /** Page number (1-indexed) */
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1),

  /** Number of items per page */
  pageSize: z.coerce
    .number()
    .int('Page size must be an integer')
    .positive('Page size must be positive')
    .max(MAX_PAGE_SIZE, `Page size cannot exceed ${MAX_PAGE_SIZE}`)
    .default(DEFAULT_PAGE_SIZE),

  /** Field to sort by */
  sortBy: z
    .enum(['name', 'email', 'role', 'createdAt', 'lastLoginAt'])
    .default('createdAt'),

  /** Sort direction */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// USER ASSIGNMENT SCHEMA
// ============================================================================

/**
 * Bulk user role update schema
 *
 * Used for updating multiple users' roles at once.
 *
 * @example
 * ```typescript
 * const result = bulkUpdateUserRoleSchema.safeParse({
 *   userIds: ['uuid1', 'uuid2'],
 *   role: 'SCHEDULER'
 * });
 * ```
 */
export const bulkUpdateUserRoleSchema = z.object({
  userIds: z.array(uuidSchema).min(1, 'At least one user ID is required'),
  role: userRoleSchema,
});

/**
 * Deactivate users schema
 *
 * Used for deactivating multiple user accounts.
 *
 * @example
 * ```typescript
 * const result = deactivateUsersSchema.safeParse({
 *   userIds: ['uuid1', 'uuid2'],
 *   reason: 'Account inactive for 6 months'
 * });
 * ```
 */
export const deactivateUsersSchema = z.object({
  userIds: z.array(uuidSchema).min(1, 'At least one user ID is required'),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Input type for creating a user */
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Input type for updating a user */
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** Input type for updating own profile */
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

/** Input type for user list filters */
export type UserFilterInput = z.infer<typeof userFilterSchema>;

/** Input type for bulk role updates */
export type BulkUpdateUserRoleInput = z.infer<typeof bulkUpdateUserRoleSchema>;

/** Input type for deactivating users */
export type DeactivateUsersInput = z.infer<typeof deactivateUsersSchema>;

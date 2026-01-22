/**
 * @file auth.schema.ts
 * @description Zod validation schemas for authentication operations
 * @layer Schema/Validation
 * @status IMPLEMENTED
 *
 * Authentication schemas for:
 * - User login
 * - User registration
 * - Password management (change, reset, forgot)
 *
 * All schemas use centralized VALIDATION constants and provide
 * user-friendly error messages for form validation.
 */

import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { VALIDATION } from '@/lib/constants';

// ============================================================================
// SHARED FIELD SCHEMAS
// ============================================================================

/**
 * Email validation schema
 * - Must be a valid email format
 * - Trimmed and lowercased for consistency
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .transform((val) => val.trim().toLowerCase());

/**
 * Password validation schema with strength requirements
 * - Minimum 8 characters (from VALIDATION constants)
 * - Maximum 128 characters (from VALIDATION constants)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
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
 * Simple password validation (for login - no strength requirements)
 * Only checks that password is provided
 */
export const simplePasswordSchema = z.string().min(1, 'Password is required');

// ============================================================================
// LOGIN SCHEMA
// ============================================================================

/**
 * Login credentials schema
 *
 * @example
 * ```typescript
 * const result = loginSchema.safeParse({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 * ```
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
});

// ============================================================================
// REGISTRATION SCHEMA
// ============================================================================

/**
 * User registration schema
 *
 * Validates new user registration with:
 * - Email validation
 * - Strong password requirements
 * - Password confirmation matching
 * - Name length constraints
 * - Optional role (defaults to CHATTER)
 *
 * @example
 * ```typescript
 * const result = registerSchema.safeParse({
 *   email: 'newuser@example.com',
 *   password: 'SecurePass123',
 *   confirmPassword: 'SecurePass123',
 *   name: 'John Doe'
 * });
 * ```
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .transform((val) => val.trim()),
    role: z.nativeEnum(UserRole).optional().default('CHATTER'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ============================================================================
// PASSWORD MANAGEMENT SCHEMAS
// ============================================================================

/**
 * Change password schema (for authenticated users)
 *
 * Requires current password for verification plus new password with confirmation.
 *
 * @example
 * ```typescript
 * const result = changePasswordSchema.safeParse({
 *   currentPassword: 'OldPass123',
 *   newPassword: 'NewSecure456',
 *   confirmPassword: 'NewSecure456'
 * });
 * ```
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Forgot password schema (request password reset)
 *
 * Only requires email - sends reset link to user's email.
 *
 * @example
 * ```typescript
 * const result = forgotPasswordSchema.safeParse({
 *   email: 'user@example.com'
 * });
 * ```
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password schema (complete password reset with token)
 *
 * Used when user clicks the password reset link.
 * Requires the token from the email plus new password with confirmation.
 *
 * @example
 * ```typescript
 * const result = resetPasswordSchema.safeParse({
 *   token: 'abc123def456',
 *   password: 'NewSecure789',
 *   confirmPassword: 'NewSecure789'
 * });
 * ```
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Input type for login form */
export type LoginInput = z.infer<typeof loginSchema>;

/** Input type for registration form */
export type RegisterInput = z.infer<typeof registerSchema>;

/** Input type for change password form */
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Input type for forgot password form */
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** Input type for reset password form */
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

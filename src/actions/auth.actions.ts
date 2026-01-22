/**
 * @file auth.actions.ts
 * @description Server actions for authentication
 * @layer Action
 * @status IMPLEMENTED
 *
 * Handles authentication actions including:
 * - Login with credentials
 * - Logout
 * - Self-registration (if enabled)
 * - Password change
 *
 * Pattern:
 * 1. Validate input with Zod schema
 * 2. Check authentication/authorization
 * 3. Call service method
 * 4. Handle errors gracefully
 * 5. Revalidate/redirect as needed
 */

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { signIn, signOut, auth } from '@/lib/auth';
import { userService } from '@/services';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
} from '@/schemas';
import type { ActionResult } from '@/types/api.types';
import type { User } from '@prisma/client';

// ============================================================================
// RESULT TYPE
// ============================================================================

/**
 * Consistent return type for auth actions
 */
type AuthActionResult<T = void> = ActionResult<T>;

// ============================================================================
// LOGIN ACTION
// ============================================================================

/**
 * Authenticate user with email and password
 *
 * @param formData - Form data containing email and password
 * @returns ActionResult with void on success (redirects) or error message
 *
 * @example
 * ```tsx
 * <form action={login}>
 *   <input name="email" type="email" />
 *   <input name="password" type="password" />
 *   <button type="submit">Sign In</button>
 * </form>
 * ```
 */
export async function login(formData: FormData): Promise<AuthActionResult<void>> {
  // Parse and validate input
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid email or password format',
    };
  }

  try {
    // Attempt sign in using NextAuth credentials provider
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    // Update last login timestamp
    const user = await userService.getByEmail(parsed.data.email);
    if (user) {
      await userService.updateLastLogin(user.id);
    }
  } catch (error) {
    // Handle NextAuth errors
    if (error instanceof Error) {
      if (error.message.includes('CredentialsSignin')) {
        return { success: false, error: 'Invalid email or password' };
      }
      if (error.message.includes('inactive') || error.message.includes('deactivated')) {
        return { success: false, error: 'Your account has been deactivated. Contact an administrator.' };
      }
    }
    return { success: false, error: 'An error occurred during sign in' };
  }

  // Redirect on success
  redirect('/dashboard');
}

// ============================================================================
// LOGOUT ACTION
// ============================================================================

/**
 * Sign out the current user
 *
 * Clears the session and redirects to login page.
 *
 * @example
 * ```tsx
 * <form action={logout}>
 *   <button type="submit">Sign Out</button>
 * </form>
 * ```
 */
export async function logout(): Promise<void> {
  const session = await auth();

  // Record logout if user is authenticated
  if (session?.user?.id) {
    await userService.recordLogout(session.user.id);
  }

  await signOut({ redirect: false });
  redirect('/login');
}

// ============================================================================
// REGISTER ACTION
// ============================================================================

/**
 * Register a new user account
 *
 * NOTE: Self-registration may be disabled in production.
 * New users typically get CHATTER role by default.
 *
 * @param formData - Form data with email, password, confirmPassword, name
 * @returns ActionResult with created User on success
 *
 * @example
 * ```tsx
 * <form action={register}>
 *   <input name="name" />
 *   <input name="email" type="email" />
 *   <input name="password" type="password" />
 *   <input name="confirmPassword" type="password" />
 *   <button type="submit">Create Account</button>
 * </form>
 * ```
 */
export async function register(formData: FormData): Promise<AuthActionResult<User>> {
  // Parse and validate input
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    name: formData.get('name'),
  };

  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    // Return first error message
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  try {
    // Create user with default role
    const user = await userService.create({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      role: parsed.data.role ?? 'CHATTER', // Default role for self-registration
    });

    // Auto-sign in after successful registration
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    // Update last login
    await userService.updateLastLogin(user.id);

    return { success: true, data: user };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return { success: false, error: 'An account with this email already exists' };
      }
    }
    return { success: false, error: 'Failed to create account' };
  }
}

// ============================================================================
// CHANGE PASSWORD ACTION
// ============================================================================

/**
 * Change the current user's password
 *
 * Requires current password for verification.
 *
 * @param formData - Form data with currentPassword, newPassword, confirmPassword
 * @returns ActionResult with void on success
 *
 * @example
 * ```tsx
 * <form action={changePassword}>
 *   <input name="currentPassword" type="password" />
 *   <input name="newPassword" type="password" />
 *   <input name="confirmPassword" type="password" />
 *   <button type="submit">Change Password</button>
 * </form>
 * ```
 */
export async function changePassword(formData: FormData): Promise<AuthActionResult<void>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'You must be logged in to change your password' };
  }

  // Parse and validate input
  const raw = {
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const parsed = changePasswordSchema.safeParse(raw);

  if (!parsed.success) {
    // Return first error message
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  try {
    await userService.changePassword(
      session.user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );

    revalidatePath('/settings');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('incorrect')) {
        return { success: false, error: 'Current password is incorrect' };
      }
    }
    return { success: false, error: 'Failed to change password' };
  }
}

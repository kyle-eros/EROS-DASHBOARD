/**
 * @file user.actions.ts
 * @description Server actions for user management
 * @layer Action
 * @status IMPLEMENTED
 *
 * Handles user management actions including:
 * - Create new users (admin/manager)
 * - Update user details
 * - Deactivate/reactivate users
 * - Update own profile
 *
 * Permission Requirements:
 * - createUser: users:create (SUPER_ADMIN, MANAGER)
 * - updateUser: users:update (SUPER_ADMIN, MANAGER) or own profile
 * - deactivateUser: users:delete (SUPER_ADMIN only)
 * - activateUser: users:delete (SUPER_ADMIN only)
 * - updateProfile: Own profile only
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { userService } from '@/services';
import {
  createUserSchema,
  updateUserSchema,
  updateUserProfileSchema,
} from '@/schemas';
import { hasPermission } from '@/lib/constants';
import type { ActionResult } from '@/types/api.types';
import type { User } from '@prisma/client';

// ============================================================================
// RESULT TYPE
// ============================================================================

type UserActionResult<T> = ActionResult<T>;

// ============================================================================
// CREATE USER ACTION
// ============================================================================

/**
 * Create a new user (admin/manager operation)
 *
 * Permission: users:create (SUPER_ADMIN, MANAGER)
 *
 * @param formData - Form data with email, password, name, role
 * @returns ActionResult with created User on success
 *
 * @example
 * ```tsx
 * <form action={createUser}>
 *   <input name="email" type="email" />
 *   <input name="password" type="password" />
 *   <input name="name" />
 *   <select name="role">...</select>
 *   <button type="submit">Create User</button>
 * </form>
 * ```
 */
export async function createUser(formData: FormData): Promise<UserActionResult<User>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'users:create')) {
    return { success: false, error: 'Insufficient permissions to create users' };
  }

  // Parse and validate input
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
    role: formData.get('role'),
  };

  const parsed = createUserSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  // Managers cannot create SUPER_ADMIN users
  if (session.user.role === 'MANAGER' && parsed.data.role === 'SUPER_ADMIN') {
    return { success: false, error: 'Managers cannot create Super Admin users' };
  }

  try {
    const user = await userService.create(parsed.data);

    revalidatePath('/users');
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return { success: false, error: 'A user with this email already exists' };
      }
    }
    return { success: false, error: 'Failed to create user' };
  }
}

// ============================================================================
// UPDATE USER ACTION
// ============================================================================

/**
 * Update a user's details (admin/manager operation)
 *
 * Permission: users:update (SUPER_ADMIN, MANAGER) or own profile
 *
 * @param id - User ID to update
 * @param formData - Form data with optional name, role, isActive
 * @returns ActionResult with updated User on success
 */
export async function updateUser(
  id: string,
  formData: FormData
): Promise<UserActionResult<User>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check - can update if has permission OR is own profile
  const isOwnProfile = session.user.id === id;
  const hasUpdatePermission = hasPermission(session.user.role, 'users:update');

  if (!isOwnProfile && !hasUpdatePermission) {
    return { success: false, error: 'Insufficient permissions to update this user' };
  }

  // Parse and validate input
  const raw = Object.fromEntries(formData);
  const parsed = updateUserSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  // If updating own profile, cannot change role or isActive
  if (isOwnProfile && !hasUpdatePermission) {
    if (parsed.data.role !== undefined || parsed.data.isActive !== undefined) {
      return { success: false, error: 'You cannot change your own role or status' };
    }
  }

  // Managers cannot promote users to SUPER_ADMIN
  if (session.user.role === 'MANAGER' && parsed.data.role === 'SUPER_ADMIN') {
    return { success: false, error: 'Managers cannot assign Super Admin role' };
  }

  try {
    const user = await userService.update(id, parsed.data, session.user.id);

    revalidatePath('/users');
    revalidatePath(`/users/${id}`);
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'User not found' };
      }
      if (error.message.includes('already in use')) {
        return { success: false, error: 'Email is already in use' };
      }
    }
    return { success: false, error: 'Failed to update user' };
  }
}

// ============================================================================
// DEACTIVATE USER ACTION
// ============================================================================

/**
 * Soft delete (deactivate) a user
 *
 * Permission: users:delete (SUPER_ADMIN only)
 *
 * Deactivated users cannot log in but their data is preserved.
 *
 * @param id - User ID to deactivate
 * @returns ActionResult with deactivated User on success
 */
export async function deactivateUser(id: string): Promise<UserActionResult<User>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check - SUPER_ADMIN only
  if (!hasPermission(session.user.role, 'users:delete')) {
    return { success: false, error: 'Only Super Admins can deactivate users' };
  }

  // Cannot deactivate yourself
  if (session.user.id === id) {
    return { success: false, error: 'You cannot deactivate your own account' };
  }

  try {
    const user = await userService.deactivate(id, session.user.id);

    revalidatePath('/users');
    revalidatePath(`/users/${id}`);
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'User not found' };
      }
      if (error.message.includes('last super admin')) {
        return { success: false, error: 'Cannot deactivate the last Super Admin' };
      }
    }
    return { success: false, error: 'Failed to deactivate user' };
  }
}

// ============================================================================
// ACTIVATE USER ACTION
// ============================================================================

/**
 * Reactivate a deactivated user
 *
 * Permission: users:delete (SUPER_ADMIN only)
 *
 * @param id - User ID to activate
 * @returns ActionResult with activated User on success
 */
export async function activateUser(id: string): Promise<UserActionResult<User>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check - SUPER_ADMIN only
  if (!hasPermission(session.user.role, 'users:delete')) {
    return { success: false, error: 'Only Super Admins can activate users' };
  }

  try {
    const user = await userService.activate(id, session.user.id);

    revalidatePath('/users');
    revalidatePath(`/users/${id}`);
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'User not found' };
      }
    }
    return { success: false, error: 'Failed to activate user' };
  }
}

// ============================================================================
// UPDATE PROFILE ACTION
// ============================================================================

/**
 * Update own user profile
 *
 * Permission: Own profile only - limited fields
 *
 * @param formData - Form data with optional name
 * @returns ActionResult with updated User on success
 *
 * @example
 * ```tsx
 * <form action={updateProfile}>
 *   <input name="name" defaultValue={user.name} />
 *   <button type="submit">Save Profile</button>
 * </form>
 * ```
 */
export async function updateProfile(formData: FormData): Promise<UserActionResult<User>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Parse and validate input - use profile schema (limited fields)
  const raw = Object.fromEntries(formData);
  const parsed = updateUserProfileSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  try {
    const user = await userService.update(session.user.id, parsed.data, session.user.id);

    revalidatePath('/settings');
    revalidatePath('/profile');
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: 'Failed to update profile' };
  }
}

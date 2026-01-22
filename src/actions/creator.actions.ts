/**
 * @file creator.actions.ts
 * @description Server actions for creator management
 * @layer Action
 * @status IMPLEMENTED
 *
 * Handles creator management actions including:
 * - Create creator profiles
 * - Update creator details
 * - Assign/unassign users to creators
 * - Manage creator availability
 *
 * Permission Requirements:
 * - createCreator: creators:create (SUPER_ADMIN, MANAGER, SCHEDULER)
 * - updateCreator: creators:update (SUPER_ADMIN, MANAGER, SCHEDULER)
 * - assignUserToCreator: MANAGER, SUPER_ADMIN
 * - unassignUserFromCreator: MANAGER, SUPER_ADMIN
 * - addCreatorAvailability: creators:update
 * - removeCreatorAvailability: creators:update
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { creatorService } from '@/services';
import {
  createCreatorSchema,
  updateCreatorSchema,
  creatorAvailabilitySchema,
  userCreatorAssignmentSchema,
} from '@/schemas';
import { hasPermission } from '@/lib/constants';
import type { ActionResult } from '@/types/api.types';
import type { Creator, UserCreatorAssignment, CreatorAvailability } from '@prisma/client';

// ============================================================================
// RESULT TYPE
// ============================================================================

type CreatorActionResult<T> = ActionResult<T>;

// ============================================================================
// TYPES
// ============================================================================

// Extended creator type with user info
interface CreatorWithUser extends Creator {
  user: { id: string; name: string; email: string };
}

// ============================================================================
// CREATE CREATOR ACTION
// ============================================================================

/**
 * Create a new creator profile
 *
 * Permission: creators:create (SUPER_ADMIN, MANAGER, SCHEDULER)
 *
 * Creates a creator profile linked to an existing User account with CREATOR role.
 *
 * @param formData - Form data with userId, stageName, platforms, timezone
 * @returns ActionResult with created Creator on success
 *
 * @example
 * ```tsx
 * <form action={createCreator}>
 *   <input name="userId" type="hidden" value={selectedUserId} />
 *   <input name="stageName" />
 *   <input name="platforms" value="onlyfans,fansly" />
 *   <select name="timezone">...</select>
 *   <button type="submit">Create Creator</button>
 * </form>
 * ```
 */
export async function createCreator(formData: FormData): Promise<CreatorActionResult<CreatorWithUser>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'creators:create')) {
    return { success: false, error: 'Insufficient permissions to create creators' };
  }

  // Parse platforms from comma-separated string
  const platformsRaw = formData.get('platforms');
  const platforms = typeof platformsRaw === 'string'
    ? platformsRaw.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  // Parse and validate input
  const raw = {
    userId: formData.get('userId'),
    stageName: formData.get('stageName'),
    platforms,
    timezone: formData.get('timezone') || 'America/New_York',
  };

  const parsed = createCreatorSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  try {
    const creator = await creatorService.create(parsed.data, session.user.id);

    revalidatePath('/creators');
    return { success: true, data: creator };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'User not found' };
      }
      if (error.message.includes('CREATOR role')) {
        return { success: false, error: 'User must have CREATOR role to create a profile' };
      }
      if (error.message.includes('already has')) {
        return { success: false, error: 'User already has a creator profile' };
      }
    }
    return { success: false, error: 'Failed to create creator' };
  }
}

// ============================================================================
// UPDATE CREATOR ACTION
// ============================================================================

/**
 * Update a creator's details
 *
 * Permission: creators:update (SUPER_ADMIN, MANAGER, SCHEDULER)
 *
 * @param id - Creator ID to update
 * @param formData - Form data with optional stageName, platforms, timezone, isActive
 * @returns ActionResult with updated Creator on success
 */
export async function updateCreator(
  id: string,
  formData: FormData
): Promise<CreatorActionResult<CreatorWithUser>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'creators:update')) {
    return { success: false, error: 'Insufficient permissions to update creators' };
  }

  // Parse platforms from comma-separated string if provided
  const platformsRaw = formData.get('platforms');
  const platforms = typeof platformsRaw === 'string'
    ? platformsRaw.split(',').map(p => p.trim()).filter(Boolean)
    : undefined;

  // Build raw object, only including defined fields
  const raw: Record<string, unknown> = {};

  const stageName = formData.get('stageName');
  if (stageName) raw.stageName = stageName;

  if (platforms && platforms.length > 0) raw.platforms = platforms;

  const timezone = formData.get('timezone');
  if (timezone) raw.timezone = timezone;

  const isActive = formData.get('isActive');
  if (isActive !== null) {
    raw.isActive = isActive === 'true' || isActive === '1';
  }

  const parsed = updateCreatorSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  try {
    const creator = await creatorService.update(id, parsed.data, session.user.id);

    revalidatePath('/creators');
    revalidatePath(`/creators/${id}`);
    return { success: true, data: creator };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'Creator not found' };
      }
    }
    return { success: false, error: 'Failed to update creator' };
  }
}

// ============================================================================
// ASSIGN USER TO CREATOR ACTION
// ============================================================================

/**
 * Assign a user to work with a creator
 *
 * Permission: MANAGER, SUPER_ADMIN
 *
 * Assigns staff members (chatters, schedulers) to manage specific creators.
 *
 * @param userId - ID of the user to assign
 * @param creatorId - ID of the creator
 * @param isPrimary - Whether this is the primary contact (optional, default false)
 * @returns ActionResult with assignment on success
 */
export async function assignUserToCreator(
  userId: string,
  creatorId: string,
  isPrimary = false
): Promise<CreatorActionResult<UserCreatorAssignment>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check - only MANAGER and SUPER_ADMIN can assign
  const canAssign = session.user.role === 'SUPER_ADMIN' || session.user.role === 'MANAGER';
  if (!canAssign) {
    return { success: false, error: 'Only Managers and Super Admins can assign users to creators' };
  }

  // Validate input
  const parsed = userCreatorAssignmentSchema.safeParse({ userId, creatorId, isPrimary });

  if (!parsed.success) {
    return { success: false, error: 'Invalid user or creator ID' };
  }

  try {
    const assignment = await creatorService.assignUser(
      userId,
      creatorId,
      isPrimary,
      session.user.id
    );

    revalidatePath('/creators');
    revalidatePath(`/creators/${creatorId}`);
    revalidatePath(`/users/${userId}`);
    return { success: true, data: assignment };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('User not found')) {
        return { success: false, error: 'User not found' };
      }
      if (error.message.includes('Creator not found')) {
        return { success: false, error: 'Creator not found' };
      }
    }
    return { success: false, error: 'Failed to assign user to creator' };
  }
}

// ============================================================================
// UNASSIGN USER FROM CREATOR ACTION
// ============================================================================

/**
 * Remove a user's assignment from a creator
 *
 * Permission: MANAGER, SUPER_ADMIN
 *
 * @param userId - ID of the user to unassign
 * @param creatorId - ID of the creator
 * @returns ActionResult with void on success
 */
export async function unassignUserFromCreator(
  userId: string,
  creatorId: string
): Promise<CreatorActionResult<void>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  const canAssign = session.user.role === 'SUPER_ADMIN' || session.user.role === 'MANAGER';
  if (!canAssign) {
    return { success: false, error: 'Only Managers and Super Admins can unassign users from creators' };
  }

  try {
    await creatorService.unassignUser(userId, creatorId, session.user.id);

    revalidatePath('/creators');
    revalidatePath(`/creators/${creatorId}`);
    revalidatePath(`/users/${userId}`);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not assigned')) {
        return { success: false, error: 'User is not assigned to this creator' };
      }
    }
    return { success: false, error: 'Failed to unassign user from creator' };
  }
}

// ============================================================================
// ADD CREATOR AVAILABILITY ACTION
// ============================================================================

/**
 * Add an availability slot for a creator
 *
 * Permission: creators:update (SUPER_ADMIN, MANAGER, SCHEDULER)
 *
 * @param formData - Form data with creatorId, dayOfWeek/specificDate, startTime, endTime, etc.
 * @returns ActionResult with created availability on success
 *
 * @example
 * ```tsx
 * // Recurring availability (every Monday 9am-5pm)
 * <form action={addCreatorAvailability}>
 *   <input name="creatorId" type="hidden" value={creatorId} />
 *   <input name="dayOfWeek" value="1" />
 *   <input name="startTime" value="09:00" />
 *   <input name="endTime" value="17:00" />
 *   <input name="isRecurring" value="true" />
 *   <button type="submit">Add Availability</button>
 * </form>
 * ```
 */
export async function addCreatorAvailability(
  formData: FormData
): Promise<CreatorActionResult<CreatorAvailability>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'creators:update')) {
    return { success: false, error: 'Insufficient permissions to manage creator availability' };
  }

  // Parse form data
  const dayOfWeekRaw = formData.get('dayOfWeek');
  const isRecurringRaw = formData.get('isRecurring');
  const isAvailableRaw = formData.get('isAvailable');

  const raw = {
    creatorId: formData.get('creatorId'),
    dayOfWeek: dayOfWeekRaw ? parseInt(dayOfWeekRaw as string, 10) : undefined,
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    isRecurring: isRecurringRaw === 'true' || isRecurringRaw === '1',
    specificDate: formData.get('specificDate') || undefined,
    isAvailable: isAvailableRaw === null ? true : (isAvailableRaw === 'true' || isAvailableRaw === '1'),
    reason: formData.get('reason') || undefined,
  };

  const parsed = creatorAvailabilitySchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  try {
    // Convert Date objects to expected format for service
    const availabilityInput = {
      ...parsed.data,
      startTime: new Date(`2000-01-01T${parsed.data.startTime}`),
      endTime: new Date(`2000-01-01T${parsed.data.endTime}`),
      specificDate: parsed.data.specificDate ? new Date(parsed.data.specificDate) : undefined,
    };

    const availability = await creatorService.addAvailability(availabilityInput);

    revalidatePath(`/creators/${parsed.data.creatorId}`);
    revalidatePath(`/creators/${parsed.data.creatorId}/availability`);
    return { success: true, data: availability };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'Creator not found' };
      }
    }
    return { success: false, error: 'Failed to add availability' };
  }
}

// ============================================================================
// REMOVE CREATOR AVAILABILITY ACTION
// ============================================================================

/**
 * Remove an availability slot
 *
 * Permission: creators:update (SUPER_ADMIN, MANAGER, SCHEDULER)
 *
 * @param id - Availability slot ID to remove
 * @returns ActionResult with void on success
 */
export async function removeCreatorAvailability(
  id: string
): Promise<CreatorActionResult<void>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'creators:update')) {
    return { success: false, error: 'Insufficient permissions to manage creator availability' };
  }

  try {
    await creatorService.removeAvailability(id);

    revalidatePath('/creators');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'Availability slot not found' };
      }
    }
    return { success: false, error: 'Failed to remove availability' };
  }
}

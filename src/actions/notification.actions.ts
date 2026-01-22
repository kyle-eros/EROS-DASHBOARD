/**
 * @file notification.actions.ts
 * @description Server actions for notification management
 * @layer Action
 * @status IMPLEMENTED
 *
 * Handles notification actions including:
 * - Mark single notification as read
 * - Mark all notifications as read
 * - Get unread notification count (for header badge)
 *
 * All actions require authentication - users can only manage their own notifications.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { notificationService } from '@/services';
import type { ActionResult } from '@/types/api.types';
import type { Notification } from '@prisma/client';

// ============================================================================
// RESULT TYPE
// ============================================================================

type NotificationActionResult<T> = ActionResult<T>;

// ============================================================================
// MARK NOTIFICATION AS READ
// ============================================================================

/**
 * Mark a single notification as read
 *
 * Users can only mark their own notifications as read.
 *
 * @param id - Notification ID to mark as read
 * @returns ActionResult with updated Notification on success
 */
export async function markNotificationAsRead(
  id: string
): Promise<NotificationActionResult<Notification>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const notification = await notificationService.markAsRead(id, session.user.id);

    revalidatePath('/notifications');
    return { success: true, data: notification };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'Notification not found' };
      }
      if (error.message.includes('not authorized')) {
        return { success: false, error: 'You can only mark your own notifications as read' };
      }
    }
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

// ============================================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================================

/**
 * Mark all unread notifications as read for the current user
 *
 * @returns ActionResult with count of notifications marked
 */
export async function markAllNotificationsAsRead(): Promise<NotificationActionResult<{ count: number }>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const count = await notificationService.markAllAsRead(session.user.id);

    revalidatePath('/notifications');
    return { success: true, data: { count } };
  } catch (error) {
    return { success: false, error: 'Failed to mark notifications as read' };
  }
}

// ============================================================================
// GET UNREAD COUNT
// ============================================================================

/**
 * Get the count of unread notifications for the current user
 *
 * Useful for displaying a badge in the notification bell icon.
 *
 * @returns ActionResult with unread count
 */
export async function getUnreadCount(): Promise<NotificationActionResult<{ count: number }>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const count = await notificationService.getUnreadCount(session.user.id);

    return { success: true, data: { count } };
  } catch (error) {
    return { success: false, error: 'Failed to get notification count' };
  }
}

// ============================================================================
// DELETE NOTIFICATION
// ============================================================================

/**
 * Delete a notification
 *
 * Users can only delete their own notifications.
 *
 * @param id - Notification ID to delete
 * @returns ActionResult with void on success
 */
export async function deleteNotification(
  id: string
): Promise<NotificationActionResult<void>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await notificationService.delete(id, session.user.id);

    revalidatePath('/notifications');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'Notification not found' };
      }
      if (error.message.includes('not authorized')) {
        return { success: false, error: 'You can only delete your own notifications' };
      }
    }
    return { success: false, error: 'Failed to delete notification' };
  }
}

// ============================================================================
// DELETE ALL READ NOTIFICATIONS
// ============================================================================

/**
 * Delete all read notifications for the current user
 *
 * Useful for cleaning up the notification list.
 *
 * @returns ActionResult with count of deleted notifications
 */
export async function deleteAllReadNotifications(): Promise<NotificationActionResult<{ count: number }>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const count = await notificationService.deleteReadNotifications(session.user.id);

    revalidatePath('/notifications');
    return { success: true, data: { count } };
  } catch (error) {
    return { success: false, error: 'Failed to delete read notifications' };
  }
}

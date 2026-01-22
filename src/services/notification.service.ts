/**
 * @file notification.service.ts
 * @description Service for user notifications and alerts
 * @layer Service
 * @status IMPLEMENTED
 *
 * Handles all notification operations:
 * - Creating notifications for users
 * - Fetching notifications with pagination
 * - Marking notifications as read
 * - Helper methods for common notification scenarios
 *
 * Notification flow:
 * 1. Action triggers notification (ticket created, assigned, etc.)
 * 2. NotificationService creates notification record
 * 3. Frontend queries for unread notifications
 * 4. User marks as read when viewed
 */

import { prisma } from '@/lib/db';
import type { Notification, NotificationType, Ticket, User, Creator } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Notification with computed fields for frontend display
 */
export interface NotificationWithMeta extends Notification {
  /** Parsed data for type-safe access */
  parsedData?: NotificationData;
}

/**
 * Type-safe notification data structure
 */
export interface NotificationData {
  ticketId?: string;
  ticketNumber?: string;
  creatorId?: string;
  creatorName?: string;
  userId?: string;
  userName?: string;
  link?: string;
  extra?: Record<string, unknown>;
}

/**
 * Result from getForUser with pagination info
 */
export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

/**
 * Options for getForUser query
 */
export interface GetNotificationsOptions {
  /** Only return unread notifications */
  unreadOnly?: boolean;
  /** Maximum number to return (default: 20) */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Filter by notification type */
  type?: NotificationType;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * NotificationService - Handles all notification operations
 *
 * This service is used by other services to send notifications
 * and by the frontend to fetch/manage notifications.
 */
class NotificationService {
  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Create a notification for a user
   *
   * @param userId - ID of the user to notify
   * @param type - Type of notification
   * @param title - Short notification title
   * @param message - Notification message body
   * @param data - Optional additional data (ticketId, link, etc.)
   * @returns The created notification
   *
   * @example
   * ```typescript
   * await notificationService.create(
   *   userId,
   *   'TICKET_ASSIGNED',
   *   'New Ticket Assigned',
   *   'You have been assigned ticket CVR-2025-00001',
   *   { ticketId: 'uuid', ticketNumber: 'CVR-2025-00001' }
   * );
   * ```
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData
  ): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: (data as any) ?? undefined,
        isRead: false,
      },
    });
  }

  /**
   * Get notifications for a user with pagination
   *
   * @param userId - ID of the user
   * @param options - Query options
   * @returns Notifications, total count, and unread count
   */
  async getForUser(
    userId: string,
    options: GetNotificationsOptions = {}
  ): Promise<NotificationListResult> {
    const { unreadOnly = false, limit = 20, offset = 0, type } = options;

    // Build where clause
    const where: Record<string, unknown> = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type) {
      where.type = type;
    }

    // Fetch notifications and counts in parallel
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  /**
   * Get a single notification by ID
   *
   * @param id - Notification ID
   * @returns The notification or null if not found
   */
  async getById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  /**
   * Mark a notification as read
   *
   * @param notificationId - ID of the notification
   * @param userId - ID of the user (for authorization)
   * @returns The updated notification
   * @throws Error if notification not found or user doesn't own it
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    // First verify the notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    if (notification.userId !== userId) {
      throw new Error('User does not own this notification');
    }

    // Update if not already read
    if (notification.isRead) {
      return notification;
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   *
   * @param userId - ID of the user
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Delete a notification
   *
   * @param notificationId - ID of the notification
   * @param userId - ID of the user (for authorization)
   * @throws Error if notification not found or user doesn't own it
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    if (notification.userId !== userId) {
      throw new Error('User does not own this notification');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Delete all read notifications for a user (cleanup)
   *
   * @param userId - ID of the user
   * @returns Number of deleted notifications
   */
  async deleteReadNotifications(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return result.count;
  }

  // ========================================
  // CONVENIENCE METHODS FOR COMMON SCENARIOS
  // ========================================

  /**
   * Notify relevant users when a ticket is created
   *
   * Sends notification to:
   * - Users assigned to the creator (if any)
   * - Managers (they might want to know)
   *
   * @param ticket - The created ticket
   * @param creator - The creator the ticket is for
   */
  async notifyTicketCreated(
    ticket: Ticket,
    creator: Creator & { user: User }
  ): Promise<void> {
    // Get users assigned to this creator
    const assignments = await prisma.userCreatorAssignment.findMany({
      where: { creatorId: creator.id },
      include: { user: true },
    });

    // Create notifications for assigned users
    const notifications = assignments.map((assignment) => ({
      userId: assignment.userId,
      type: 'TICKET_CREATED' as NotificationType,
      title: 'New Ticket Created',
      message: `New ${ticket.type.replace('_', ' ').toLowerCase()} ticket ${ticket.ticketNumber} created for ${creator.stageName}`,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        creatorId: creator.id,
        creatorName: creator.stageName,
        link: `/tickets/${ticket.id}`,
      },
      isRead: false,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }
  }

  /**
   * Notify a user when they are assigned to a ticket
   *
   * @param ticket - The ticket being assigned
   * @param assignedToId - ID of the user being assigned
   * @param assignedBy - User who made the assignment
   */
  async notifyTicketAssigned(
    ticket: Ticket & { creator: Creator },
    assignedToId: string,
    assignedBy: User
  ): Promise<void> {
    // Don't notify if user assigns to themselves
    if (assignedToId === assignedBy.id) {
      return;
    }

    await this.create(
      assignedToId,
      'TICKET_ASSIGNED',
      'Ticket Assigned to You',
      `${assignedBy.name} assigned you ticket ${ticket.ticketNumber} for ${ticket.creator.stageName}`,
      {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        creatorId: ticket.creatorId,
        creatorName: ticket.creator.stageName,
        userId: assignedBy.id,
        userName: assignedBy.name,
        link: `/tickets/${ticket.id}`,
      }
    );
  }

  /**
   * Notify relevant users when a ticket status changes
   *
   * @param ticket - The ticket with updated status
   * @param previousStatus - The previous status
   * @param changedBy - User who changed the status
   */
  async notifyStatusChange(
    ticket: Ticket & { creator: Creator; createdBy: User; assignedTo: User | null },
    previousStatus: string,
    changedBy: User
  ): Promise<void> {
    const statusLabel = ticket.status.replace('_', ' ').toLowerCase();
    const notifyUserIds: string[] = [];

    // Notify ticket creator if they didn't make the change
    if (ticket.createdById !== changedBy.id) {
      notifyUserIds.push(ticket.createdById);
    }

    // Notify assignee if they didn't make the change
    if (ticket.assignedToId && ticket.assignedToId !== changedBy.id) {
      notifyUserIds.push(ticket.assignedToId);
    }

    // Create notifications
    const notifications = notifyUserIds.map((userId) => ({
      userId,
      type: 'TICKET_STATUS_CHANGED' as NotificationType,
      title: 'Ticket Status Updated',
      message: `Ticket ${ticket.ticketNumber} status changed to ${statusLabel} by ${changedBy.name}`,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        creatorId: ticket.creatorId,
        creatorName: ticket.creator.stageName,
        userId: changedBy.id,
        userName: changedBy.name,
        link: `/tickets/${ticket.id}`,
        extra: { previousStatus, newStatus: ticket.status },
      },
      isRead: false,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }
  }

  /**
   * Notify relevant users when a comment is added to a ticket
   *
   * @param ticketId - ID of the ticket
   * @param commentAuthorId - ID of the comment author
   * @param isInternal - Whether the comment is internal-only
   */
  async notifyTicketComment(
    ticketId: string,
    commentAuthorId: string,
    isInternal: boolean
  ): Promise<void> {
    // Get ticket with relations
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        creator: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    if (!ticket) {
      return;
    }

    const commentAuthor = await prisma.user.findUnique({
      where: { id: commentAuthorId },
    });

    if (!commentAuthor) {
      return;
    }

    const notifyUserIds: string[] = [];

    // Notify ticket creator (unless they wrote the comment)
    if (ticket.createdById !== commentAuthorId) {
      notifyUserIds.push(ticket.createdById);
    }

    // Notify assignee (unless they wrote the comment)
    if (ticket.assignedToId && ticket.assignedToId !== commentAuthorId) {
      notifyUserIds.push(ticket.assignedToId);
    }

    // If internal comment, filter to only staff
    // (Note: In a real app, you'd check user roles here)

    const notifications = notifyUserIds.map((userId) => ({
      userId,
      type: 'TICKET_COMMENTED' as NotificationType,
      title: 'New Comment on Ticket',
      message: `${commentAuthor.name} commented on ticket ${ticket.ticketNumber}`,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        creatorId: ticket.creatorId,
        creatorName: ticket.creator.stageName,
        userId: commentAuthor.id,
        userName: commentAuthor.name,
        link: `/tickets/${ticket.id}`,
        extra: { isInternal },
      },
      isRead: false,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }
  }

  /**
   * Send deadline approaching notifications
   * Should be called by a scheduled job
   *
   * @param hoursBeforeDeadline - Hours before deadline to notify (default: 24)
   * @returns Number of notifications sent
   */
  async sendDeadlineNotifications(hoursBeforeDeadline = 24): Promise<number> {
    const now = new Date();
    const deadline = new Date(now.getTime() + hoursBeforeDeadline * 60 * 60 * 1000);

    // Find tickets approaching deadline
    const tickets = await prisma.ticket.findMany({
      where: {
        deadline: {
          gte: now,
          lte: deadline,
        },
        status: {
          notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'],
        },
      },
      include: {
        creator: true,
        assignedTo: true,
        createdBy: true,
      },
    });

    let notificationCount = 0;

    for (const ticket of tickets) {
      // Check if we've already sent a deadline notification recently
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'DEADLINE_APPROACHING',
          data: {
            path: ['ticketId'],
            equals: ticket.id,
          },
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (existingNotification) {
        continue; // Already notified recently
      }

      const notifyUserIds: string[] = [];

      if (ticket.assignedToId) {
        notifyUserIds.push(ticket.assignedToId);
      }
      if (ticket.createdById && !notifyUserIds.includes(ticket.createdById)) {
        notifyUserIds.push(ticket.createdById);
      }

      const hoursLeft = Math.round(
        (ticket.deadline!.getTime() - now.getTime()) / (60 * 60 * 1000)
      );

      const notifications = notifyUserIds.map((userId) => ({
        userId,
        type: 'DEADLINE_APPROACHING' as NotificationType,
        title: 'Ticket Deadline Approaching',
        message: `Ticket ${ticket.ticketNumber} is due in ${hoursLeft} hours`,
        data: {
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          creatorId: ticket.creatorId,
          creatorName: ticket.creator.stageName,
          link: `/tickets/${ticket.id}`,
          extra: { hoursLeft, deadline: ticket.deadline?.toISOString() },
        },
        isRead: false,
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
        notificationCount += notifications.length;
      }
    }

    return notificationCount;
  }

  /**
   * Send a system-wide announcement to all active users
   *
   * @param title - Announcement title
   * @param message - Announcement message
   * @param data - Optional additional data
   * @returns Number of notifications created
   */
  async sendSystemAnnouncement(
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<number> {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const notifications = users.map((user) => ({
      userId: user.id,
      type: 'SYSTEM_ANNOUNCEMENT' as NotificationType,
      title,
      message,
      data: (data as any) ?? undefined,
      isRead: false,
    }));

    const result = await prisma.notification.createMany({ data: notifications });

    return result.count;
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Get unread notification count for a user
   *
   * @param userId - ID of the user
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Get notification counts by type for a user
   *
   * @param userId - ID of the user
   * @returns Object with counts per notification type
   */
  async getCountsByType(userId: string): Promise<Record<NotificationType, number>> {
    const counts = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId },
      _count: true,
    });

    const result: Partial<Record<NotificationType, number>> = {};
    for (const item of counts) {
      result[item.type] = item._count;
    }

    return result as Record<NotificationType, number>;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Singleton instance of the NotificationService
 */
export const notificationService = new NotificationService();

/**
 * Export the class for testing purposes
 */
export { NotificationService };

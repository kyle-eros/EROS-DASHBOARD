/**
 * @file audit.service.ts
 * @description Service for system-wide audit logging and compliance tracking
 * @layer Service
 * @status IMPLEMENTED
 *
 * Provides comprehensive audit trail for:
 * - User authentication events (login, logout, password changes)
 * - Entity CRUD operations (tickets, users, creators)
 * - Security events and anomalies
 * - Administrative actions
 *
 * The audit log is append-only and immutable for compliance purposes.
 */

import { prisma } from '@/lib/db';
import type { AuditLog } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input for creating an audit log entry
 */
export interface AuditLogInput {
  /** Action identifier (e.g., "user.login", "ticket.create") */
  action: string;
  /** Type of entity affected (e.g., "User", "Ticket", "Creator") */
  entityType?: string;
  /** ID of the affected entity */
  entityId?: string;
  /** ID of user who performed the action (may be null for system actions) */
  userId?: string;
  /** Denormalized email for audit trail even if user is deleted */
  userEmail?: string;
  /** Client IP address */
  ipAddress?: string;
  /** Browser/client user agent string */
  userAgent?: string;
  /** Additional details about the action (before/after values, etc.) */
  details?: Record<string, unknown>;
}

/**
 * Filter options for querying audit logs
 */
export interface AuditLogFilter {
  /** Filter by action type */
  action?: string;
  /** Filter by entity type */
  entityType?: string;
  /** Filter by entity ID */
  entityId?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by user email */
  userEmail?: string;
  /** Start date for time range filter */
  startDate?: Date;
  /** End date for time range filter */
  endDate?: Date;
  /** Maximum number of results (default: 100) */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * AuditService - Handles all audit logging operations
 *
 * This service is foundational - other services depend on it for logging.
 * All methods are async and handle errors gracefully to prevent audit
 * logging failures from affecting primary operations.
 */
class AuditService {
  /**
   * Recursively sanitize data to remove sensitive fields
   */
  private sanitizeLogData(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(item => this.sanitizeLogData(item));

    const sensitiveKeys = [
      'password', 'passwordHash', 'token', 'secret', 'authorization', 'creditCard', 'cvv', 'apiKey'
    ];

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeLogData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // ========================================
  // LOGGING
  // ========================================

  /**
   * Log an action to the audit trail
   *
   * This method is designed to never throw - it logs errors internally
   * to prevent audit logging failures from affecting primary operations.
   *
   * @param input - Audit log entry data
   * @returns The created AuditLog or undefined if logging failed
   *
   * @example
   * ```typescript
   * await auditService.log({
   *   action: 'ticket.create',
   *   entityType: 'Ticket',
   *   entityId: 'uuid-here',
   *   userId: 'user-uuid',
   *   userEmail: 'user@example.com',
   *   details: { ticketNumber: 'CVR-2025-00001' }
   * });
   * ```
   */
  async log(input: AuditLogInput): Promise<AuditLog | undefined> {
    try {
      const sanitizedDetails = this.sanitizeLogData(input.details);

      const auditLog = await prisma.auditLog.create({
        data: {
          action: input.action,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          userId: input.userId ?? null,
          userEmail: input.userEmail ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          details: (sanitizedDetails as any) ?? undefined,
        },
      });

      return auditLog;
    } catch (error) {
      // Log error but don't throw - audit logging should not break primary operations
      console.error('[AuditService] Failed to create audit log:', error);
      console.error('[AuditService] Attempted to log:', JSON.stringify(input, null, 2));
      return undefined;
    }
  }

  /**
   * Log a batch of actions atomically
   *
   * Useful for operations that affect multiple entities
   *
   * @param inputs - Array of audit log entries
   * @returns Number of successfully logged entries
   */
  async logBatch(inputs: AuditLogInput[]): Promise<number> {
    try {
      const result = await prisma.auditLog.createMany({
        data: inputs.map((input) => ({
          action: input.action,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          userId: input.userId ?? null,
          userEmail: input.userEmail ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          details: (this.sanitizeLogData(input.details) as any) ?? undefined,
        })),
      });

      return result.count;
    } catch (error) {
      console.error('[AuditService] Failed to create batch audit logs:', error);
      return 0;
    }
  }

  // ========================================
  // QUERYING
  // ========================================

  /**
   * Get audit logs with filtering and pagination
   *
   * @param filter - Filter options
   * @returns Array of audit log entries
   */
  async getAuditLogs(filter: AuditLogFilter = {}): Promise<AuditLog[]> {
    const { limit = 100, offset = 0, ...filters } = filter;

    const where: Record<string, unknown> = {};

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.userEmail) {
      where.userEmail = filters.userEmail;
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, Date>).gte = filters.startDate;
      }
      if (filters.endDate) {
        (where.createdAt as Record<string, Date>).lte = filters.endDate;
      }
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 1000), // Cap at 1000 to prevent memory issues
      skip: offset,
    });
  }

  /**
   * Get audit logs for a specific entity
   *
   * @param entityType - Type of entity (e.g., "Ticket", "User")
   * @param entityId - ID of the entity
   * @param limit - Maximum number of results
   * @returns Array of audit logs for the entity
   */
  async getEntityLogs(
    entityType: string,
    entityId: string,
    limit = 50
  ): Promise<AuditLog[]> {
    return this.getAuditLogs({ entityType, entityId, limit });
  }

  /**
   * Get recent audit logs for a user
   *
   * @param userId - ID of the user
   * @param limit - Maximum number of results
   * @returns Array of audit logs by the user
   */
  async getUserLogs(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.getAuditLogs({ userId, limit });
  }

  /**
   * Get audit logs by action type
   *
   * @param action - Action identifier (e.g., "user.login")
   * @param limit - Maximum number of results
   * @returns Array of audit logs for the action
   */
  async getActionLogs(action: string, limit = 50): Promise<AuditLog[]> {
    return this.getAuditLogs({ action, limit });
  }

  /**
   * Get audit logs count with optional filters
   *
   * @param filter - Filter options (excluding limit/offset)
   * @returns Count of matching audit logs
   */
  async getCount(filter: Omit<AuditLogFilter, 'limit' | 'offset'> = {}): Promise<number> {
    const where: Record<string, unknown> = {};

    if (filter.action) where.action = filter.action;
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.userId) where.userId = filter.userId;
    if (filter.userEmail) where.userEmail = filter.userEmail;

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        (where.createdAt as Record<string, Date>).gte = filter.startDate;
      }
      if (filter.endDate) {
        (where.createdAt as Record<string, Date>).lte = filter.endDate;
      }
    }

    return prisma.auditLog.count({ where });
  }

  // ========================================
  // MAINTENANCE
  // ========================================

  /**
   * Clean up old audit logs (retention policy)
   *
   * Should be called by a scheduled job, not user actions.
   * Default retention is 90 days.
   *
   * @param retentionDays - Number of days to retain logs
   * @returns Number of deleted logs
   */
  async cleanupOldLogs(retentionDays = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Log the cleanup action itself
    await this.log({
      action: 'audit.cleanup',
      details: {
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        deletedCount: result.count,
      },
    });

    return result.count;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Pre-built action types for consistency
 */
export const AUDIT_ACTIONS = {
  // Authentication
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_LOGIN_FAILED: 'user.login_failed',
  PASSWORD_CHANGE: 'user.password_change',
  PASSWORD_RESET: 'user.password_reset',

  // User management
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DEACTIVATE: 'user.deactivate',
  USER_ACTIVATE: 'user.activate',
  USER_ROLE_CHANGE: 'user.role_change',

  // Creator management
  CREATOR_CREATE: 'creator.create',
  CREATOR_UPDATE: 'creator.update',
  CREATOR_ASSIGN_USER: 'creator.assign_user',
  CREATOR_UNASSIGN_USER: 'creator.unassign_user',

  // Ticket management
  TICKET_CREATE: 'ticket.create',
  TICKET_UPDATE: 'ticket.update',
  TICKET_DELETE: 'ticket.delete',
  TICKET_STATUS_CHANGE: 'ticket.status_change',
  TICKET_ASSIGN: 'ticket.assign',
  TICKET_UNASSIGN: 'ticket.unassign',
  TICKET_COMMENT_ADD: 'ticket.comment_add',
  TICKET_COMMENT_UPDATE: 'ticket.comment_update',
  TICKET_COMMENT_DELETE: 'ticket.comment_delete',

  // Notifications
  NOTIFICATION_SEND: 'notification.send',
  NOTIFICATION_READ: 'notification.read',

  // System
  AUDIT_CLEANUP: 'audit.cleanup',
  SYSTEM_ERROR: 'system.error',
} as const;

/**
 * Entity types for consistency
 */
export const AUDIT_ENTITIES = {
  USER: 'User',
  CREATOR: 'Creator',
  TICKET: 'Ticket',
  NOTIFICATION: 'Notification',
  COMMENT: 'TicketComment',
  SYSTEM: 'System',
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Singleton instance of the AuditService
 */
export const auditService = new AuditService();

/**
 * Export the class for testing purposes
 */
export { AuditService };

/**
 * @file index.ts
 * @description Service layer barrel export
 * @layer Service
 * @status IMPLEMENTED
 *
 * Exports all services for easy import throughout the application.
 *
 * Usage:
 * ```typescript
 * import { ticketService, userService, auditService } from '@/services';
 * ```
 */

// ============================================================================
// SERVICES
// ============================================================================

export { auditService, AUDIT_ACTIONS, AUDIT_ENTITIES } from './audit.service';
export { notificationService } from './notification.service';
export { userService } from './user.service';
export { creatorService } from './creator.service';
export { ticketService } from './ticket.service';

// ============================================================================
// TYPES
// ============================================================================

// Audit types
export type { AuditLogInput, AuditLogFilter } from './audit.service';

// Notification types
export type {
  NotificationWithMeta,
  NotificationData,
  NotificationListResult,
  GetNotificationsOptions,
} from './notification.service';

// User types
export type {
  CreateUserInput,
  UpdateUserInput,
  UserFilterInput,
  UserWithStats,
  UserListResult,
} from './user.service';

// Creator types
export type {
  CreateCreatorInput,
  UpdateCreatorInput,
  CreatorFilterInput,
  CreatorAvailabilityInput,
  CreatorWithUser,
  CreatorWithStats,
  CreatorListResult,
} from './creator.service';

// Ticket types
export type {
  CreateTicketInput,
  UpdateTicketInput,
  TicketFilterInput,
  TicketWithRelations,
  TicketListItem,
  TicketListResult,
} from './ticket.service';

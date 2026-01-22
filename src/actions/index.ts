/**
 * @file index.ts
 * @description Barrel export for all server actions
 * @layer Action
 * @status IMPLEMENTED
 *
 * This file re-exports all server actions for convenient imports.
 *
 * @example
 * ```typescript
 * import {
 *   login,
 *   logout,
 *   createTicket,
 *   createUser,
 *   assignUserToCreator,
 *   markNotificationAsRead,
 * } from '@/actions';
 * ```
 */

// ============================================================================
// AUTH ACTIONS
// ============================================================================
export {
  login,
  logout,
  register,
  changePassword,
} from './auth.actions';

// ============================================================================
// USER ACTIONS
// ============================================================================
export {
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
  updateProfile,
} from './user.actions';

// ============================================================================
// CREATOR ACTIONS
// ============================================================================
export {
  createCreator,
  updateCreator,
  assignUserToCreator,
  unassignUserFromCreator,
  addCreatorAvailability,
  removeCreatorAvailability,
} from './creator.actions';

// ============================================================================
// TICKET ACTIONS (CORE)
// ============================================================================
export {
  // CRUD
  createTicket,
  updateTicket,
  deleteTicket,
  // Status management
  submitTicket,
  acceptTicket,
  rejectTicket,
  startTicket,
  completeTicket,
  cancelTicket,
  updateTicketStatus,
  // Assignment
  assignTicket,
  unassignTicket,
  // Comments
  addComment,
  updateComment,
  deleteComment,
} from './ticket.actions';

// ============================================================================
// NOTIFICATION ACTIONS
// ============================================================================
export {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllReadNotifications,
} from './notification.actions';

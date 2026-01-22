/**
 * @file index.ts
 * @description Barrel export for all validation schemas
 * @layer Schema/Validation
 * @status IMPLEMENTED
 *
 * Exports all Zod validation schemas and their inferred TypeScript types
 * for use throughout the application. Import from '@/schemas' for convenience.
 *
 * @example
 * ```typescript
 * import {
 *   createTicketSchema,
 *   type CreateTicketInput,
 *   loginSchema,
 *   type LoginInput
 * } from '@/schemas';
 * ```
 */

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export {
  // Shared field schemas
  emailSchema,
  passwordSchema,
  simplePasswordSchema,
  // Auth schemas
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  // Types
  type LoginInput,
  type RegisterInput,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from './auth.schema';

// ============================================================================
// USER SCHEMAS
// ============================================================================

export {
  // Field schemas
  userRoleSchema,
  nameSchema,
  uuidSchema,
  // User schemas
  createUserSchema,
  updateUserSchema,
  updateUserProfileSchema,
  userFilterSchema,
  bulkUpdateUserRoleSchema,
  deactivateUsersSchema,
  // Types
  type CreateUserInput,
  type UpdateUserInput,
  type UpdateUserProfileInput,
  type UserFilterInput,
  type BulkUpdateUserRoleInput,
  type DeactivateUsersInput,
} from './user.schema';

// ============================================================================
// CREATOR SCHEMAS
// ============================================================================

export {
  // Field schemas
  stageNameSchema,
  platformsSchema,
  timezoneSchema,
  timeSchema,
  dateStringSchema,
  dayOfWeekSchema,
  // Creator schemas
  createCreatorSchema,
  updateCreatorSchema,
  creatorFilterSchema,
  creatorAvailabilitySchema,
  updateCreatorAvailabilitySchema,
  userCreatorAssignmentSchema,
  bulkUserCreatorAssignmentSchema,
  // Types
  type CreateCreatorInput,
  type UpdateCreatorInput,
  type CreatorFilterInput,
  type CreatorAvailabilityInput,
  type UpdateCreatorAvailabilityInput,
  type UserCreatorAssignmentInput,
  type BulkUserCreatorAssignmentInput,
} from './creator.schema';

// ============================================================================
// TICKET SCHEMAS
// ============================================================================

export {
  // Field schemas
  ticketTypeSchema,
  ticketStatusSchema,
  ticketPrioritySchema,
  ticketTitleSchema,
  ticketDescriptionSchema,
  commentContentSchema,
  // Type-specific data schemas
  customVideoDataSchema,
  videoCallDataSchema,
  contentRequestDataSchema,
  generalInquiryDataSchema,
  urgentAlertDataSchema,
  // Ticket schemas
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
  ticketResponseSchema,
  ticketFilterSchema,
  addCommentSchema,
  updateCommentSchema,
  bulkUpdateTicketStatusSchema,
  bulkAssignTicketsSchema,
  // Helper functions
  isValidStatusTransition,
  // Types
  type CreateTicketInput,
  type UpdateTicketInput,
  type UpdateTicketStatusInput,
  type TicketResponseInput,
  type TicketFilterInput,
  type AddCommentInput,
  type UpdateCommentInput,
  type BulkUpdateTicketStatusInput,
  type BulkAssignTicketsInput,
  type CustomVideoData,
  type VideoCallData,
  type ContentRequestData,
  type GeneralInquiryData,
  type UrgentAlertData,
} from './ticket.schema';

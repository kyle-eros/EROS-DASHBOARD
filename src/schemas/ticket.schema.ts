/**
 * @file ticket.schema.ts
 * @description Zod validation schemas for ticket management operations
 * @layer Schema/Validation
 * @status IMPLEMENTED
 *
 * Ticket management schemas for:
 * - Creating tickets of various types
 * - Updating ticket details
 * - Managing ticket status transitions
 * - Creator responses to tickets
 * - Adding comments to tickets
 * - Filtering/querying ticket lists
 *
 * This is the MOST IMPORTANT schema file as tickets are the core entity
 * of the EROS Ticketing System. It uses Prisma enums for type safety
 * and centralized VALIDATION constants for consistency.
 *
 * Ticket Types:
 * - CUSTOM_VIDEO: Custom video requests from fans
 * - VIDEO_CALL: Scheduled video call requests
 * - CONTENT_REQUEST: Content scheduling and production requests
 * - GENERAL_INQUIRY: General questions and feedback
 * - URGENT_ALERT: High-priority urgent matters
 */

import { z } from 'zod';
import {
  TicketType,
  TicketStatus,
  TicketPriority,
} from '@prisma/client';
import {
  VALIDATION,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  VALID_STATUS_TRANSITIONS,
} from '@/lib/constants';

// ============================================================================
// SHARED FIELD SCHEMAS
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Ticket type schema using Prisma enum
 */
export const ticketTypeSchema = z.nativeEnum(TicketType);

/**
 * Ticket status schema using Prisma enum
 */
export const ticketStatusSchema = z.nativeEnum(TicketStatus);

/**
 * Ticket priority schema using Prisma enum
 */
export const ticketPrioritySchema = z.nativeEnum(TicketPriority);

/**
 * Ticket title schema
 */
export const ticketTitleSchema = z
  .string()
  .min(
    VALIDATION.TICKET_TITLE_MIN_LENGTH,
    `Title must be at least ${VALIDATION.TICKET_TITLE_MIN_LENGTH} characters`
  )
  .max(
    VALIDATION.TICKET_TITLE_MAX_LENGTH,
    `Title must be at most ${VALIDATION.TICKET_TITLE_MAX_LENGTH} characters`
  )
  .transform((val) => val.trim());

/**
 * Ticket description schema
 */
export const ticketDescriptionSchema = z
  .string()
  .max(
    VALIDATION.TICKET_DESCRIPTION_MAX_LENGTH,
    `Description must be at most ${VALIDATION.TICKET_DESCRIPTION_MAX_LENGTH} characters`
  )
  .optional()
  .transform((val) => val?.trim());

/**
 * Comment content schema
 */
export const commentContentSchema = z
  .string()
  .min(1, 'Comment cannot be empty')
  .max(
    VALIDATION.COMMENT_MAX_LENGTH,
    `Comment must be at most ${VALIDATION.COMMENT_MAX_LENGTH} characters`
  )
  .transform((val) => val.trim());

// ============================================================================
// TYPE-SPECIFIC TICKET DATA SCHEMAS
// ============================================================================

/**
 * Custom Video Request data schema
 *
 * Additional fields specific to custom video requests from fans.
 */
export const customVideoDataSchema = z.object({
  /** Type of video (e.g., "solo", "roleplay", "custom script") */
  videoType: z.string().min(1, 'Video type is required'),

  /** Requested video duration in minutes */
  duration: z.number().int().positive('Duration must be positive').optional(),

  /** Any special instructions from the requester */
  specialInstructions: z
    .string()
    .max(2000, 'Special instructions must be less than 2000 characters')
    .optional(),

  /** When the video should be completed by */
  deadline: z.string().datetime('Invalid deadline format').optional(),

  /** Budget/price offered for the video */
  budget: z.number().positive('Budget must be positive').optional(),

  /** Platform for delivery (e.g., "onlyfans", "fansly") */
  platform: z.string().optional(),
});

/**
 * Video Call data schema
 *
 * Additional fields specific to video call scheduling.
 */
export const videoCallDataSchema = z.object({
  /** Preferred date for the call (YYYY-MM-DD) */
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),

  /** Preferred time for the call (HH:mm) */
  preferredTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be HH:mm format'),

  /** Call duration in minutes */
  duration: z.number().int().positive().default(30),

  /** Platform for the call (e.g., "zoom", "facetime", "skype") */
  platform: z.string().min(1, 'Call platform is required'),

  /** Additional notes about the call */
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

/**
 * Content Request data schema
 *
 * Additional fields for content scheduling and production requests.
 */
export const contentRequestDataSchema = z.object({
  /** Type of content (e.g., "photo set", "video", "story") */
  contentType: z.string().min(1, 'Content type is required'),

  /** Number of items requested */
  quantity: z.number().int().positive().default(1),

  /** When the content should be ready */
  deadline: z.string().datetime('Invalid deadline format').optional(),

  /** Detailed specifications for the content */
  specifications: z
    .string()
    .max(2000, 'Specifications must be less than 2000 characters')
    .optional(),
});

/**
 * General Inquiry data schema
 *
 * Additional fields for general questions and feedback.
 */
export const generalInquiryDataSchema = z.object({
  /** Category of inquiry (e.g., "billing", "technical", "feedback") */
  category: z.string().optional(),

  /** Urgency level as described by requester */
  urgency: z.string().optional(),
});

/**
 * Urgent Alert data schema
 *
 * Additional fields for high-priority urgent matters.
 */
export const urgentAlertDataSchema = z.object({
  /** Type of alert (e.g., "account_issue", "harassment", "technical") */
  alertType: z.string().min(1, 'Alert type is required'),

  /** Whether this requires immediate action */
  requiresImmediateAction: z.boolean().default(true),
});

// ============================================================================
// CREATE TICKET SCHEMA
// ============================================================================

/**
 * Create ticket schema
 *
 * Creates a new ticket with type-agnostic base fields.
 * Type-specific data goes in the ticketData JSON field.
 *
 * @example
 * ```typescript
 * const result = createTicketSchema.safeParse({
 *   type: 'CUSTOM_VIDEO',
 *   title: 'Custom birthday video request',
 *   description: 'Fan wants a personalized birthday message',
 *   creatorId: 'uuid-creator',
 *   priority: 'HIGH',
 *   deadline: '2025-02-15T12:00:00Z',
 *   ticketData: {
 *     videoType: 'custom script',
 *     duration: 5,
 *     budget: 100
 *   }
 * });
 * ```
 */
export const createTicketSchema = z.object({
  /** Type of ticket */
  type: ticketTypeSchema,

  /** Title summarizing the request */
  title: ticketTitleSchema,

  /** Detailed description of the request */
  description: ticketDescriptionSchema,

  /** Creator this ticket is for */
  creatorId: uuidSchema,

  /** Priority level */
  priority: ticketPrioritySchema.default('MEDIUM'),

  /** Optional deadline for completion */
  deadline: z
    .union([
      z.string().datetime('Invalid deadline format'),
      z.date(),
    ])
    .optional()
    .transform((val) => {
      if (val instanceof Date) {
        return val.toISOString();
      }
      return val;
    }),

  /** Type-specific data (JSON) */
  ticketData: z.record(z.unknown()).optional().default({}),
});

// ============================================================================
// UPDATE TICKET SCHEMA
// ============================================================================

/**
 * Update ticket schema
 *
 * Partial update for ticket fields. Does not include status changes
 * (use updateTicketStatusSchema for that).
 *
 * @example
 * ```typescript
 * const result = updateTicketSchema.safeParse({
 *   title: 'Updated title',
 *   priority: 'URGENT',
 *   assignedToId: 'uuid-user'
 * });
 * ```
 */
export const updateTicketSchema = z.object({
  /** Updated title */
  title: ticketTitleSchema.optional(),

  /** Updated description */
  description: ticketDescriptionSchema.optional(),

  /** Updated priority */
  priority: ticketPrioritySchema.optional(),

  /** Updated deadline (null to remove) */
  deadline: z
    .union([
      z.string().datetime('Invalid deadline format'),
      z.date(),
      z.null(),
    ])
    .optional()
    .transform((val) => {
      if (val instanceof Date) {
        return val.toISOString();
      }
      return val;
    }),

  /** Updated type-specific data */
  ticketData: z.record(z.unknown()).optional(),

  /** User assigned to handle ticket (null to unassign) */
  assignedToId: uuidSchema.optional().nullable(),
});

// ============================================================================
// STATUS TRANSITION SCHEMA
// ============================================================================

/**
 * Update ticket status schema
 *
 * Validates status transitions with optional reason.
 * Reason is REQUIRED when rejecting a ticket.
 *
 * @example
 * ```typescript
 * const result = updateTicketStatusSchema.safeParse({
 *   status: 'REJECTED',
 *   reason: 'Creator unavailable during requested time'
 * });
 * ```
 */
export const updateTicketStatusSchema = z
  .object({
    /** New status */
    status: ticketStatusSchema,

    /** Reason for status change (required for REJECTED) */
    reason: z
      .string()
      .max(500, `Reason must be at most 500 characters`)
      .optional(),
  })
  .refine(
    (data) => {
      // Require reason for REJECTED status
      if (data.status === 'REJECTED' && !data.reason) {
        return false;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when rejecting a ticket',
      path: ['reason'],
    }
  );

/**
 * Validate status transition
 *
 * Validates that a status transition is allowed based on VALID_STATUS_TRANSITIONS.
 * This should be called in the service layer with the current status.
 *
 * @param currentStatus - The ticket's current status
 * @param newStatus - The proposed new status
 * @returns true if transition is valid
 */
export function isValidStatusTransition(
  currentStatus: TicketStatus,
  newStatus: TicketStatus
): boolean {
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  return validTransitions.includes(newStatus);
}

// ============================================================================
// TICKET RESPONSE SCHEMA (Creator Response)
// ============================================================================

/**
 * Ticket response schema
 *
 * Creator's response to a ticket (acceptance, pricing, timeline).
 *
 * @example
 * ```typescript
 * const result = ticketResponseSchema.safeParse({
 *   responseData: {
 *     accepted: true,
 *     estimatedCompletion: '2025-02-10T12:00:00Z',
 *     price: 75.00,
 *     notes: 'Can complete by Friday'
 *   }
 * });
 * ```
 */
export const ticketResponseSchema = z.object({
  responseData: z.object({
    /** Whether creator accepts the request */
    accepted: z.boolean(),

    /** When creator estimates they can complete */
    estimatedCompletion: z.string().datetime('Invalid datetime format').optional(),

    /** Price quoted by creator */
    price: z.number().positive('Price must be positive').optional(),

    /** Additional notes from creator */
    notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
  }),
});

// ============================================================================
// TICKET FILTER SCHEMA
// ============================================================================

/**
 * Ticket filter schema for querying ticket lists
 *
 * Comprehensive filtering for tickets dashboard and lists.
 * Uses z.coerce for query parameters from URL.
 *
 * @example
 * ```typescript
 * const result = ticketFilterSchema.safeParse({
 *   search: 'video',
 *   type: 'CUSTOM_VIDEO',
 *   status: 'PENDING_REVIEW',
 *   priority: 'HIGH',
 *   creatorId: 'uuid-creator',
 *   page: 1,
 *   pageSize: 20,
 *   sortBy: 'deadline',
 *   sortOrder: 'asc'
 * });
 * ```
 */
export const ticketFilterSchema = z.object({
  /** Search term for title or description */
  search: z
    .string()
    .max(100, 'Search term too long')
    .optional()
    .transform((val) => val?.trim()),

  /** Filter by ticket type */
  type: ticketTypeSchema.optional(),

  /** Filter by status */
  status: ticketStatusSchema.optional(),

  /** Filter by priority */
  priority: ticketPrioritySchema.optional(),

  /** Filter by creator */
  creatorId: uuidSchema.optional(),

  /** Filter by assigned user */
  assignedToId: uuidSchema.optional(),

  /** Filter by ticket creator (who submitted it) */
  createdById: uuidSchema.optional(),

  /** Filter by creation date (from) */
  fromDate: z.string().optional(),

  /** Filter by creation date (to) */
  toDate: z.string().optional(),

  /** Page number (1-indexed) */
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1),

  /** Number of items per page */
  pageSize: z.coerce
    .number()
    .int('Page size must be an integer')
    .positive('Page size must be positive')
    .max(MAX_PAGE_SIZE, `Page size cannot exceed ${MAX_PAGE_SIZE}`)
    .default(DEFAULT_PAGE_SIZE),

  /** Field to sort by */
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'deadline', 'priority', 'status', 'ticketNumber'])
    .default('createdAt'),

  /** Sort direction */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// COMMENT SCHEMAS
// ============================================================================

/**
 * Add comment schema
 *
 * Adds a comment to a ticket. Supports internal (staff-only) comments.
 *
 * @example
 * ```typescript
 * const result = addCommentSchema.safeParse({
 *   ticketId: 'uuid-ticket',
 *   content: 'Following up on this request...',
 *   isInternal: false
 * });
 * ```
 */
export const addCommentSchema = z.object({
  /** Ticket to add comment to */
  ticketId: uuidSchema,

  /** Comment content */
  content: commentContentSchema,

  /** Whether comment is internal (staff-only) */
  isInternal: z.boolean().default(false),
});

/**
 * Update comment schema
 *
 * Updates an existing comment.
 *
 * @example
 * ```typescript
 * const result = updateCommentSchema.safeParse({
 *   content: 'Updated comment text'
 * });
 * ```
 */
export const updateCommentSchema = z.object({
  /** Updated comment content */
  content: commentContentSchema,
});

// ============================================================================
// BULK OPERATIONS SCHEMAS
// ============================================================================

/**
 * Bulk ticket status update schema
 *
 * Updates status of multiple tickets at once.
 *
 * @example
 * ```typescript
 * const result = bulkUpdateTicketStatusSchema.safeParse({
 *   ticketIds: ['uuid1', 'uuid2'],
 *   status: 'CANCELLED',
 *   reason: 'Project cancelled'
 * });
 * ```
 */
export const bulkUpdateTicketStatusSchema = z
  .object({
    /** Tickets to update */
    ticketIds: z.array(uuidSchema).min(1, 'At least one ticket ID is required'),

    /** New status for all tickets */
    status: ticketStatusSchema,

    /** Reason for status change */
    reason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'REJECTED' && !data.reason) {
        return false;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when rejecting tickets',
      path: ['reason'],
    }
  );

/**
 * Bulk ticket assignment schema
 *
 * Assigns multiple tickets to a user at once.
 *
 * @example
 * ```typescript
 * const result = bulkAssignTicketsSchema.safeParse({
 *   ticketIds: ['uuid1', 'uuid2', 'uuid3'],
 *   assignedToId: 'uuid-user'
 * });
 * ```
 */
export const bulkAssignTicketsSchema = z.object({
  /** Tickets to assign */
  ticketIds: z.array(uuidSchema).min(1, 'At least one ticket ID is required'),

  /** User to assign tickets to (null to unassign) */
  assignedToId: uuidSchema.nullable(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Input type for creating a ticket */
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

/** Input type for updating a ticket */
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

/** Input type for updating ticket status */
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;

/** Input type for creator ticket response */
export type TicketResponseInput = z.infer<typeof ticketResponseSchema>;

/** Input type for ticket list filters */
export type TicketFilterInput = z.infer<typeof ticketFilterSchema>;

/** Input type for adding a comment */
export type AddCommentInput = z.infer<typeof addCommentSchema>;

/** Input type for updating a comment */
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

/** Input type for bulk status update */
export type BulkUpdateTicketStatusInput = z.infer<typeof bulkUpdateTicketStatusSchema>;

/** Input type for bulk ticket assignment */
export type BulkAssignTicketsInput = z.infer<typeof bulkAssignTicketsSchema>;

/** Custom video data type */
export type CustomVideoData = z.infer<typeof customVideoDataSchema>;

/** Video call data type */
export type VideoCallData = z.infer<typeof videoCallDataSchema>;

/** Content request data type */
export type ContentRequestData = z.infer<typeof contentRequestDataSchema>;

/** General inquiry data type */
export type GeneralInquiryData = z.infer<typeof generalInquiryDataSchema>;

/** Urgent alert data type */
export type UrgentAlertData = z.infer<typeof urgentAlertDataSchema>;

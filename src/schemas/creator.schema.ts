/**
 * @file creator.schema.ts
 * @description Zod validation schemas for creator management operations
 * @layer Schema/Validation
 * @status IMPLEMENTED
 *
 * Creator management schemas for:
 * - Creating creator profiles (linked to User accounts)
 * - Updating creator details
 * - Managing creator availability
 * - User-creator assignments
 * - Filtering/querying creator lists
 *
 * Creators are content creators (OnlyFans, Fansly, etc.) who have
 * User accounts with the CREATOR role. This schema validates their
 * extended profile information and availability data.
 */

import { z } from 'zod';
import { VALIDATION, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants';

// ============================================================================
// SHARED FIELD SCHEMAS
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Stage name validation schema
 * The public-facing name of the creator
 */
export const stageNameSchema = z
  .string()
  .min(1, 'Stage name is required')
  .max(100, 'Stage name must be less than 100 characters')
  .transform((val) => val.trim());

/**
 * Platform array schema
 * List of platforms the creator is active on
 */
export const platformsSchema = z
  .array(z.string().min(1, 'Platform name cannot be empty'))
  .min(1, 'At least one platform is required');

/**
 * Timezone validation schema
 * IANA timezone identifier (e.g., "America/New_York")
 */
export const timezoneSchema = z
  .string()
  .min(1, 'Timezone is required')
  .default('America/New_York');

/**
 * Time string schema (HH:mm format)
 */
export const timeSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format');

/**
 * Date string schema (YYYY-MM-DD format)
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

/**
 * Day of week schema (0=Sunday, 6=Saturday)
 */
export const dayOfWeekSchema = z
  .number()
  .int('Day of week must be an integer')
  .min(0, 'Day of week must be 0-6 (Sunday-Saturday)')
  .max(6, 'Day of week must be 0-6 (Sunday-Saturday)');

// ============================================================================
// CREATE CREATOR SCHEMA
// ============================================================================

/**
 * Create creator schema
 *
 * Creates a creator profile linked to an existing User account.
 * The User must have the CREATOR role.
 *
 * @example
 * ```typescript
 * const result = createCreatorSchema.safeParse({
 *   userId: 'uuid-here',
 *   stageName: 'BeautifulBella',
 *   platforms: ['onlyfans', 'fansly'],
 *   timezone: 'America/Los_Angeles'
 * });
 * ```
 */
export const createCreatorSchema = z.object({
  /** UUID of the User account to link this creator profile to */
  userId: uuidSchema,

  /** Public stage name / display name */
  stageName: stageNameSchema,

  /** Platforms the creator is active on */
  platforms: platformsSchema,

  /** Creator's timezone for scheduling */
  timezone: timezoneSchema,

  /** Additional preferences stored as JSON */
  preferences: z.record(z.unknown()).optional(),
});

// ============================================================================
// UPDATE CREATOR SCHEMA
// ============================================================================

/**
 * Update creator schema
 *
 * Partial update - only provided fields will be updated.
 * Does not include userId as that cannot be changed.
 *
 * @example
 * ```typescript
 * const result = updateCreatorSchema.safeParse({
 *   stageName: 'GorgeousGrace',
 *   platforms: ['onlyfans', 'fansly', 'instagram']
 * });
 * ```
 */
export const updateCreatorSchema = z.object({
  /** Public stage name / display name */
  stageName: stageNameSchema.optional(),

  /** Platforms the creator is active on */
  platforms: platformsSchema.optional(),

  /** Creator's timezone for scheduling */
  timezone: timezoneSchema.optional(),

  /** Additional preferences stored as JSON */
  preferences: z.record(z.unknown()).optional(),

  /** Whether the creator profile is active */
  isActive: z.boolean().optional(),
});

// ============================================================================
// CREATOR FILTER SCHEMA
// ============================================================================

/**
 * Creator filter schema for querying creator lists
 *
 * Supports filtering by search, platform, and active status.
 * Uses z.coerce for query parameters from URL.
 *
 * @example
 * ```typescript
 * const result = creatorFilterSchema.safeParse({
 *   search: 'bella',
 *   platform: 'onlyfans',
 *   isActive: true,
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export const creatorFilterSchema = z.object({
  /** Search term for stage name */
  search: z
    .string()
    .max(100, 'Search term too long')
    .optional()
    .transform((val) => val?.trim()),

  /** Filter by platform */
  platform: z.string().optional(),

  /** Filter by active status */
  isActive: z
    .union([
      z.boolean(),
      z.string().transform((val) => val === 'true'),
    ])
    .optional(),

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
    .enum(['stageName', 'createdAt', 'updatedAt'])
    .default('stageName'),

  /** Sort direction */
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================================================
// CREATOR AVAILABILITY SCHEMA
// ============================================================================

/**
 * Creator availability schema
 *
 * Defines when a creator is available (or unavailable) for work.
 * Supports both recurring weekly patterns and specific date overrides.
 *
 * For recurring availability:
 * - Set isRecurring: true
 * - Provide dayOfWeek (0-6)
 *
 * For specific date availability (one-off or vacation):
 * - Set isRecurring: false
 * - Provide specificDate (YYYY-MM-DD)
 *
 * @example Recurring (every Monday 9am-5pm)
 * ```typescript
 * const result = creatorAvailabilitySchema.safeParse({
 *   creatorId: 'uuid-here',
 *   dayOfWeek: 1,
 *   startTime: '09:00',
 *   endTime: '17:00',
 *   isRecurring: true,
 *   isAvailable: true
 * });
 * ```
 *
 * @example Specific date (vacation day)
 * ```typescript
 * const result = creatorAvailabilitySchema.safeParse({
 *   creatorId: 'uuid-here',
 *   specificDate: '2025-02-14',
 *   startTime: '00:00',
 *   endTime: '23:59',
 *   isRecurring: false,
 *   isAvailable: false,
 *   reason: 'Valentine\'s Day - personal time'
 * });
 * ```
 */
export const creatorAvailabilitySchema = z
  .object({
    /** Creator this availability applies to */
    creatorId: uuidSchema,

    /** Day of week (0=Sunday, 6=Saturday) - for recurring */
    dayOfWeek: dayOfWeekSchema.optional(),

    /** Start time of availability window (HH:mm) */
    startTime: timeSchema,

    /** End time of availability window (HH:mm) */
    endTime: timeSchema,

    /** Whether this is a recurring weekly pattern */
    isRecurring: z.boolean().default(false),

    /** Specific date for one-off availability (YYYY-MM-DD) */
    specificDate: dateStringSchema.optional(),

    /** Whether creator is available (true) or blocked (false) */
    isAvailable: z.boolean().default(true),

    /** Reason for blocked time (e.g., "Vacation", "Personal") */
    reason: z.string().max(200, 'Reason must be less than 200 characters').optional(),
  })
  .refine(
    (data) => {
      // Either dayOfWeek (recurring) or specificDate (one-off) should be provided
      if (data.isRecurring) {
        return data.dayOfWeek !== undefined;
      }
      return data.specificDate !== undefined;
    },
    {
      message: 'Provide dayOfWeek for recurring or specificDate for one-off availability',
      path: ['dayOfWeek'],
    }
  )
  .refine(
    (data) => {
      // End time must be after start time
      const [startHour, startMin] = data.startTime.split(':').map(Number);
      const [endHour, endMin] = data.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return endMinutes > startMinutes;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

/**
 * Update creator availability schema
 *
 * Partial update for existing availability entries.
 *
 * @example
 * ```typescript
 * const result = updateCreatorAvailabilitySchema.safeParse({
 *   startTime: '10:00',
 *   endTime: '18:00'
 * });
 * ```
 */
export const updateCreatorAvailabilitySchema = z
  .object({
    /** Start time of availability window (HH:mm) */
    startTime: timeSchema.optional(),

    /** End time of availability window (HH:mm) */
    endTime: timeSchema.optional(),

    /** Whether creator is available (true) or blocked (false) */
    isAvailable: z.boolean().optional(),

    /** Reason for blocked time */
    reason: z.string().max(200, 'Reason must be less than 200 characters').optional().nullable(),
  })
  .refine(
    (data) => {
      // If both times provided, end must be after start
      if (data.startTime && data.endTime) {
        const [startHour, startMin] = data.startTime.split(':').map(Number);
        const [endHour, endMin] = data.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return endMinutes > startMinutes;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

// ============================================================================
// USER-CREATOR ASSIGNMENT SCHEMA
// ============================================================================

/**
 * User-creator assignment schema
 *
 * Assigns a user (chatter, scheduler, manager) to work with a creator.
 *
 * @example
 * ```typescript
 * const result = userCreatorAssignmentSchema.safeParse({
 *   userId: 'uuid-user',
 *   creatorId: 'uuid-creator',
 *   isPrimary: true
 * });
 * ```
 */
export const userCreatorAssignmentSchema = z.object({
  /** User being assigned to the creator */
  userId: uuidSchema,

  /** Creator being assigned to */
  creatorId: uuidSchema,

  /** Whether this user is the primary contact for the creator */
  isPrimary: z.boolean().default(false),
});

/**
 * Bulk user-creator assignment schema
 *
 * Assigns multiple users to a creator at once.
 *
 * @example
 * ```typescript
 * const result = bulkUserCreatorAssignmentSchema.safeParse({
 *   creatorId: 'uuid-creator',
 *   userIds: ['uuid1', 'uuid2', 'uuid3'],
 *   primaryUserId: 'uuid1'
 * });
 * ```
 */
export const bulkUserCreatorAssignmentSchema = z.object({
  /** Creator to assign users to */
  creatorId: uuidSchema,

  /** Users to assign */
  userIds: z.array(uuidSchema).min(1, 'At least one user ID is required'),

  /** Which user should be marked as primary (optional) */
  primaryUserId: uuidSchema.optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Input type for creating a creator profile */
export type CreateCreatorInput = z.infer<typeof createCreatorSchema>;

/** Input type for updating a creator profile */
export type UpdateCreatorInput = z.infer<typeof updateCreatorSchema>;

/** Input type for creator list filters */
export type CreatorFilterInput = z.infer<typeof creatorFilterSchema>;

/** Input type for creator availability */
export type CreatorAvailabilityInput = z.infer<typeof creatorAvailabilitySchema>;

/** Input type for updating creator availability */
export type UpdateCreatorAvailabilityInput = z.infer<typeof updateCreatorAvailabilitySchema>;

/** Input type for user-creator assignment */
export type UserCreatorAssignmentInput = z.infer<typeof userCreatorAssignmentSchema>;

/** Input type for bulk user-creator assignment */
export type BulkUserCreatorAssignmentInput = z.infer<typeof bulkUserCreatorAssignmentSchema>;

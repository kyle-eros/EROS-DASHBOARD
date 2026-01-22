/**
 * @file creator.service.ts
 * @description Service for creator management operations
 * @layer Service
 * @status IMPLEMENTED
 *
 * Handles all creator-related business logic:
 * - Creator CRUD operations
 * - User-creator assignment management
 * - Availability scheduling
 * - Creator statistics
 *
 * Creators are content creators managed by the agency.
 * Each creator has a 1:1 link to a User account with the CREATOR role.
 */

import { prisma } from '@/lib/db';
import { auditService, AUDIT_ACTIONS, AUDIT_ENTITIES } from './audit.service';
import type {
  Creator,
  User,
  UserCreatorAssignment,
  CreatorAvailability,
  Prisma,
} from '@prisma/client';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input for creating a new creator
 */
export interface CreateCreatorInput {
  /** ID of the associated user account (must have CREATOR role) */
  userId: string;
  /** Stage/performance name */
  stageName: string;
  /** Platforms the creator is active on */
  platforms?: string[];
  /** IANA timezone identifier */
  timezone?: string;
  /** Creator preferences (JSON) */
  preferences?: Record<string, unknown>;
}

/**
 * Input for updating a creator
 */
export interface UpdateCreatorInput {
  stageName?: string;
  platforms?: string[];
  timezone?: string;
  preferences?: Record<string, unknown>;
  isActive?: boolean;
}

/**
 * Filter options for listing creators
 */
export interface CreatorFilterInput {
  /** Filter by active status */
  isActive?: boolean;
  /** Search in stage name */
  search?: string;
  /** Filter by platform */
  platform?: string;
  /** Filter by assigned user ID */
  assignedToUserId?: string;
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Sort field */
  sortBy?: 'stageName' | 'createdAt' | 'updatedAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Input for adding availability
 */
export interface CreatorAvailabilityInput {
  creatorId: string;
  /** Day of week (0=Sunday, 6=Saturday) - for recurring */
  dayOfWeek?: number;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime: Date;
  /** Is this a recurring pattern? */
  isRecurring?: boolean;
  /** Specific date for one-off availability */
  specificDate?: Date;
  /** Is the creator available (false = blocked time) */
  isAvailable?: boolean;
  /** Reason for blocked time */
  reason?: string;
}

/**
 * Creator with user info included
 */
export interface CreatorWithUser extends Creator {
  user: User;
}

/**
 * Creator with stats
 */
export interface CreatorWithStats extends CreatorWithUser {
  _count: {
    tickets: number;
    assignments: number;
  };
  openTicketCount?: number;
}

/**
 * Result from list operation
 */
export interface CreatorListResult {
  creators: CreatorWithStats[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * CreatorService - Handles all creator management operations
 *
 * Creators are content creators with platform presence.
 * Each creator has an associated User account.
 */
class CreatorService {
  // ========================================
  // CREATE
  // ========================================

  /**
   * Create a creator profile linked to a user
   *
   * @param input - Creator creation data
   * @param createdById - ID of user creating the record (for audit)
   * @returns The created creator with user info
   * @throws Error if user not found, not CREATOR role, or already has profile
   *
   * @example
   * ```typescript
   * const creator = await creatorService.create({
   *   userId: 'user-uuid',
   *   stageName: 'StarQueen',
   *   platforms: ['onlyfans', 'fansly'],
   *   timezone: 'America/Los_Angeles'
   * });
   * ```
   */
  async create(input: CreateCreatorInput, createdById?: string): Promise<CreatorWithUser> {
    // Verify user exists and has CREATOR role
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new Error(`User not found: ${input.userId}`);
    }

    if (user.role !== 'CREATOR') {
      throw new Error('User must have CREATOR role to have a creator profile');
    }

    // Check if user already has a creator profile
    const existing = await prisma.creator.findUnique({
      where: { userId: input.userId },
    });

    if (existing) {
      throw new Error('User already has a creator profile');
    }

    // Create creator
    const creator = await prisma.creator.create({
      data: {
        userId: input.userId,
        stageName: input.stageName.trim(),
        platforms: input.platforms ?? [],
        timezone: input.timezone ?? 'America/New_York',
        preferences: (input.preferences as any) ?? undefined,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.CREATOR_CREATE,
      entityType: AUDIT_ENTITIES.CREATOR,
      entityId: creator.id,
      userId: createdById,
      details: {
        stageName: creator.stageName,
        linkedUserId: user.id,
        linkedUserEmail: user.email,
      },
    });

    return creator;
  }

  // ========================================
  // READ
  // ========================================

  /**
   * Get a creator by ID with user info
   *
   * @param id - Creator ID
   * @returns Creator with user or null if not found
   */
  async getById(id: string): Promise<CreatorWithUser | null> {
    return prisma.creator.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  /**
   * Get a creator by ID with stats
   *
   * @param id - Creator ID
   * @returns Creator with user and stats, or null if not found
   */
  async getByIdWithStats(id: string): Promise<CreatorWithStats | null> {
    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        user: true,
        _count: {
          select: {
            tickets: true,
            assignments: true,
          },
        },
      },
    });

    if (!creator) {
      return null;
    }

    // Get open ticket count
    const openTicketCount = await prisma.ticket.count({
      where: {
        creatorId: id,
        status: {
          notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'],
        },
      },
    });

    return {
      ...creator,
      openTicketCount,
    };
  }

  /**
   * Get a creator by user ID
   *
   * @param userId - User ID
   * @returns Creator or null if user has no creator profile
   */
  async getByUserId(userId: string): Promise<CreatorWithUser | null> {
    return prisma.creator.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });
  }

  /**
   * List creators with filtering and pagination
   *
   * @param filter - Filter and pagination options
   * @returns Paginated list of creators with stats
   */
  async list(filter: CreatorFilterInput = {}): Promise<CreatorListResult> {
    const {
      isActive,
      search,
      platform,
      assignedToUserId,
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      sortBy = 'stageName',
      sortOrder = 'asc',
    } = filter;

    // Clamp page size
    const clampedPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    const skip = (Math.max(1, page) - 1) * clampedPageSize;

    // Build where clause
    const where: Prisma.CreatorWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.stageName = { contains: search, mode: 'insensitive' };
    }

    if (platform) {
      where.platforms = { has: platform };
    }

    if (assignedToUserId) {
      where.assignments = {
        some: { userId: assignedToUserId },
      };
    }

    // Execute queries in parallel
    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        include: {
          user: true,
          _count: {
            select: {
              tickets: true,
              assignments: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: clampedPageSize,
        skip,
      }),
      prisma.creator.count({ where }),
    ]);

    return {
      creators,
      total,
      page: Math.max(1, page),
      pageSize: clampedPageSize,
      totalPages: Math.ceil(total / clampedPageSize),
    };
  }

  /**
   * Get all active creators (for dropdowns)
   *
   * @returns Array of active creators with basic info
   */
  async getActiveCreators(): Promise<Array<Pick<Creator, 'id' | 'stageName'> & { user: Pick<User, 'id' | 'name' | 'email'> }>> {
    return prisma.creator.findMany({
      where: { isActive: true },
      select: {
        id: true,
        stageName: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { stageName: 'asc' },
    });
  }

  /**
   * Get creators assigned to a specific user
   *
   * @param userId - User ID
   * @returns Array of creators assigned to this user
   */
  async getAssignedToUser(userId: string): Promise<CreatorWithUser[]> {
    const assignments = await prisma.userCreatorAssignment.findMany({
      where: { userId },
      include: {
        creator: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        creator: { stageName: 'asc' },
      },
    });

    return assignments.map((a) => a.creator);
  }

  // ========================================
  // UPDATE
  // ========================================

  /**
   * Update a creator's profile
   *
   * @param id - Creator ID
   * @param input - Update data
   * @param updatedById - ID of user making the change (for audit)
   * @returns Updated creator with user info
   * @throws Error if creator not found
   */
  async update(
    id: string,
    input: UpdateCreatorInput,
    updatedById?: string
  ): Promise<CreatorWithUser> {
    // Get existing creator
    const existing = await prisma.creator.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throw new Error(`Creator not found: ${id}`);
    }

    // Build update data
    const data: Prisma.CreatorUpdateInput = {};
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    if (input.stageName !== undefined && input.stageName.trim() !== existing.stageName) {
      data.stageName = input.stageName.trim();
      changes.stageName = { old: existing.stageName, new: input.stageName.trim() };
    }

    if (input.platforms !== undefined) {
      const newPlatforms = input.platforms;
      const oldPlatforms = existing.platforms;

      if (JSON.stringify(newPlatforms.sort()) !== JSON.stringify([...oldPlatforms].sort())) {
        data.platforms = newPlatforms;
        changes.platforms = { old: oldPlatforms, new: newPlatforms };
      }
    }

    if (input.timezone !== undefined && input.timezone !== existing.timezone) {
      data.timezone = input.timezone;
      changes.timezone = { old: existing.timezone, new: input.timezone };
    }

    if (input.preferences !== undefined) {
      data.preferences = input.preferences as any;
      changes.preferences = { old: existing.preferences, new: input.preferences };
    }

    if (input.isActive !== undefined && input.isActive !== existing.isActive) {
      data.isActive = input.isActive;
      changes.isActive = { old: existing.isActive, new: input.isActive };
    }

    // If no changes, return existing creator
    if (Object.keys(data).length === 0) {
      return existing;
    }

    // Update creator
    const creator = await prisma.creator.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.CREATOR_UPDATE,
      entityType: AUDIT_ENTITIES.CREATOR,
      entityId: id,
      userId: updatedById,
      details: { changes },
    });

    return creator;
  }

  // ========================================
  // USER ASSIGNMENT
  // ========================================

  /**
   * Assign a user to work with a creator
   *
   * @param userId - ID of the user to assign
   * @param creatorId - ID of the creator
   * @param isPrimary - Is this the primary contact? (default: false)
   * @param assignedById - ID of user making assignment (for audit)
   * @returns The assignment record
   * @throws Error if user or creator not found, or assignment exists
   */
  async assignUser(
    userId: string,
    creatorId: string,
    isPrimary = false,
    assignedById?: string
  ): Promise<UserCreatorAssignment> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Verify creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      throw new Error(`Creator not found: ${creatorId}`);
    }

    // Check if assignment already exists
    const existing = await prisma.userCreatorAssignment.findUnique({
      where: {
        userId_creatorId: {
          userId,
          creatorId,
        },
      },
    });

    if (existing) {
      // Update isPrimary if different
      if (existing.isPrimary !== isPrimary) {
        return prisma.userCreatorAssignment.update({
          where: { id: existing.id },
          data: { isPrimary },
        });
      }
      return existing;
    }

    // If setting as primary, unset other primary assignments for this creator
    if (isPrimary) {
      await prisma.userCreatorAssignment.updateMany({
        where: {
          creatorId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    // Create assignment
    const assignment = await prisma.userCreatorAssignment.create({
      data: {
        userId,
        creatorId,
        isPrimary,
      },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.CREATOR_ASSIGN_USER,
      entityType: AUDIT_ENTITIES.CREATOR,
      entityId: creatorId,
      userId: assignedById,
      details: {
        assignedUserId: userId,
        assignedUserEmail: user.email,
        isPrimary,
      },
    });

    return assignment;
  }

  /**
   * Remove a user's assignment from a creator
   *
   * @param userId - ID of the user
   * @param creatorId - ID of the creator
   * @param unassignedById - ID of user removing assignment (for audit)
   * @throws Error if assignment doesn't exist
   */
  async unassignUser(
    userId: string,
    creatorId: string,
    unassignedById?: string
  ): Promise<void> {
    // Find assignment
    const assignment = await prisma.userCreatorAssignment.findUnique({
      where: {
        userId_creatorId: {
          userId,
          creatorId,
        },
      },
    });

    if (!assignment) {
      throw new Error(`User ${userId} is not assigned to creator ${creatorId}`);
    }

    // Delete assignment
    await prisma.userCreatorAssignment.delete({
      where: { id: assignment.id },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.CREATOR_UNASSIGN_USER,
      entityType: AUDIT_ENTITIES.CREATOR,
      entityId: creatorId,
      userId: unassignedById,
      details: { unassignedUserId: userId },
    });
  }

  /**
   * Get all users assigned to a creator
   *
   * @param creatorId - Creator ID
   * @returns Array of assignments with user info
   */
  async getAssignedUsers(
    creatorId: string
  ): Promise<Array<UserCreatorAssignment & { user: User }>> {
    return prisma.userCreatorAssignment.findMany({
      where: { creatorId },
      include: { user: true },
      orderBy: [{ isPrimary: 'desc' }, { assignedAt: 'asc' }],
    });
  }

  // ========================================
  // AVAILABILITY MANAGEMENT
  // ========================================

  /**
   * Get availability for a creator
   *
   * @param creatorId - Creator ID
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @returns Array of availability slots
   */
  async getAvailability(
    creatorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CreatorAvailability[]> {
    const where: Prisma.CreatorAvailabilityWhereInput = {
      creatorId,
    };

    // Filter by specific date range if provided
    if (startDate || endDate) {
      where.OR = [
        // Recurring availability (no specific date)
        { isRecurring: true },
        // Specific dates within range
        {
          specificDate: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
      ];
    }

    return prisma.creatorAvailability.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Add an availability slot for a creator
   *
   * @param input - Availability data
   * @returns The created availability slot
   */
  async addAvailability(input: CreatorAvailabilityInput): Promise<CreatorAvailability> {
    // Verify creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: input.creatorId },
    });

    if (!creator) {
      throw new Error(`Creator not found: ${input.creatorId}`);
    }

    // Validate input
    if (input.isRecurring && input.dayOfWeek === undefined) {
      throw new Error('dayOfWeek is required for recurring availability');
    }

    if (!input.isRecurring && !input.specificDate) {
      throw new Error('specificDate is required for non-recurring availability');
    }

    return prisma.creatorAvailability.create({
      data: {
        creatorId: input.creatorId,
        dayOfWeek: input.dayOfWeek ?? null,
        startTime: input.startTime,
        endTime: input.endTime,
        isRecurring: input.isRecurring ?? false,
        specificDate: input.specificDate ?? null,
        isAvailable: input.isAvailable ?? true,
        reason: input.reason ?? null,
      },
    });
  }

  /**
   * Update an availability slot
   *
   * @param id - Availability slot ID
   * @param input - Update data
   * @returns Updated availability slot
   */
  async updateAvailability(
    id: string,
    input: Partial<Omit<CreatorAvailabilityInput, 'creatorId'>>
  ): Promise<CreatorAvailability> {
    const existing = await prisma.creatorAvailability.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Availability slot not found: ${id}`);
    }

    return prisma.creatorAvailability.update({
      where: { id },
      data: {
        dayOfWeek: input.dayOfWeek ?? undefined,
        startTime: input.startTime ?? undefined,
        endTime: input.endTime ?? undefined,
        isRecurring: input.isRecurring ?? undefined,
        specificDate: input.specificDate ?? undefined,
        isAvailable: input.isAvailable ?? undefined,
        reason: input.reason ?? undefined,
      },
    });
  }

  /**
   * Remove an availability slot
   *
   * @param id - Availability slot ID
   */
  async removeAvailability(id: string): Promise<void> {
    const existing = await prisma.creatorAvailability.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Availability slot not found: ${id}`);
    }

    await prisma.creatorAvailability.delete({
      where: { id },
    });
  }

  /**
   * Clear all availability for a creator
   *
   * @param creatorId - Creator ID
   * @returns Number of deleted slots
   */
  async clearAvailability(creatorId: string): Promise<number> {
    const result = await prisma.creatorAvailability.deleteMany({
      where: { creatorId },
    });
    return result.count;
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Get creator statistics
   *
   * @param id - Creator ID
   * @returns Stats object
   */
  async getStats(id: string): Promise<{
    totalTickets: number;
    openTickets: number;
    completedTickets: number;
    rejectedTickets: number;
    avgCompletionDays: number | null;
  }> {
    const [totalTickets, openTickets, completedTickets, rejectedTickets, completedWithDates] =
      await Promise.all([
        prisma.ticket.count({ where: { creatorId: id } }),
        prisma.ticket.count({
          where: {
            creatorId: id,
            status: { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'] },
          },
        }),
        prisma.ticket.count({
          where: { creatorId: id, status: 'COMPLETED' },
        }),
        prisma.ticket.count({
          where: { creatorId: id, status: 'REJECTED' },
        }),
        prisma.ticket.findMany({
          where: {
            creatorId: id,
            status: 'COMPLETED',
            completedAt: { not: null },
            submittedAt: { not: null },
          },
          select: {
            submittedAt: true,
            completedAt: true,
          },
        }),
      ]);

    // Calculate average completion time
    let avgCompletionDays: number | null = null;

    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, ticket) => {
        if (ticket.submittedAt && ticket.completedAt) {
          const days =
            (ticket.completedAt.getTime() - ticket.submittedAt.getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);

      avgCompletionDays = Math.round((totalDays / completedWithDates.length) * 10) / 10;
    }

    return {
      totalTickets,
      openTickets,
      completedTickets,
      rejectedTickets,
      avgCompletionDays,
    };
  }

  /**
   * Get creators sorted by ticket volume
   *
   * @param limit - Maximum number to return
   * @returns Creators with ticket counts
   */
  async getByTicketVolume(
    limit = 10
  ): Promise<Array<CreatorWithUser & { ticketCount: number }>> {
    const creators = await prisma.creator.findMany({
      where: { isActive: true },
      include: {
        user: true,
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: {
        tickets: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return creators.map((c) => ({
      ...c,
      ticketCount: c._count.tickets,
    }));
  }

  // ========================================
  // VALIDATION HELPERS
  // ========================================

  /**
   * Check if a creator exists
   *
   * @param id - Creator ID
   * @returns true if exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.creator.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check if a user can be assigned to creators
   *
   * Users with certain roles can be assigned to manage creators.
   *
   * @param userId - User ID
   * @returns true if user can be assigned
   */
  async canBeAssigned(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return false;
    }

    // These roles can be assigned to manage creators
    const assignableRoles = ['SUPER_ADMIN', 'MANAGER', 'SCHEDULER', 'CHATTER'];
    return assignableRoles.includes(user.role);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Singleton instance of the CreatorService
 */
export const creatorService = new CreatorService();

/**
 * Export the class for testing purposes
 */
export { CreatorService };

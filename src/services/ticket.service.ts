/**
 * @file ticket.service.ts
 * @description Service for ticket management - CORE BUSINESS LOGIC
 * @layer Service
 * @status IMPLEMENTED
 *
 * This is the most important service in the system. It handles:
 * - Ticket CRUD operations
 * - Status management with state machine validation
 * - Assignment workflows
 * - Comments and collaboration
 * - History tracking (audit trail)
 * - Dashboard statistics
 *
 * The ticket lifecycle follows a strict state machine:
 * DRAFT -> SUBMITTED -> PENDING_REVIEW -> ACCEPTED -> IN_PROGRESS -> COMPLETED
 * Any non-terminal state can transition to REJECTED or CANCELLED
 *
 * All significant operations are:
 * - Wrapped in transactions for atomicity
 * - Logged to the audit trail
 * - Triggering appropriate notifications
 */

import { prisma } from '@/lib/db';
import { auditService, AUDIT_ACTIONS, AUDIT_ENTITIES } from './audit.service';
import { notificationService } from './notification.service';
import { generateTicketNumber } from '@/lib/utils';
import { isValidStatusTransition, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants';
import type {
  Ticket,
  TicketType,
  TicketStatus,
  TicketPriority,
  TicketHistory,
  TicketComment,
  Creator,
  User,
  Prisma,
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input for creating a new ticket
 */
export interface CreateTicketInput {
  /** Ticket type determines the prefix for ticket number */
  type: TicketType;
  /** Title of the ticket */
  title: string;
  /** Detailed description */
  description?: string;
  /** Priority level */
  priority?: TicketPriority;
  /** ID of the creator this ticket is for */
  creatorId: string;
  /** Optional deadline for completion */
  deadline?: Date;
  /** Type-specific data (JSON) */
  ticketData?: Record<string, unknown>;
  /** Start in DRAFT or SUBMITTED status */
  submitImmediately?: boolean;
}

/**
 * Input for updating a ticket
 */
export interface UpdateTicketInput {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  deadline?: Date | null;
  ticketData?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
}

/**
 * Filter options for listing tickets
 */
export interface TicketFilterInput {
  /** Filter by type(s) */
  type?: TicketType | TicketType[];
  /** Filter by status(es) */
  status?: TicketStatus | TicketStatus[];
  /** Filter by priority(ies) */
  priority?: TicketPriority | TicketPriority[];
  /** Filter by creator ID */
  creatorId?: string;
  /** Filter by assigned user ID */
  assignedToId?: string;
  /** Filter by creator (created by) user ID */
  createdById?: string;
  /** Search in title and description */
  search?: string;
  /** Created after this date */
  createdAfter?: Date;
  /** Created before this date */
  createdBefore?: Date;
  /** Has deadline before this date */
  deadlineBefore?: Date;
  /** Include only overdue tickets */
  overdueOnly?: boolean;
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Sort field */
  sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'priority' | 'status' | 'ticketNumber';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Ticket with all related entities loaded
 */
export interface TicketWithRelations extends Ticket {
  creator: Creator & { user: User };
  createdBy: User;
  assignedTo: User | null;
  history: Array<TicketHistory & { changedBy: User }>;
  comments: Array<TicketComment & { author: User }>;
}

/**
 * Ticket list item (lighter than full relations)
 */
export interface TicketListItem extends Ticket {
  creator: { id: string; stageName: string; user: { id: string; name: string } };
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
  _count: { comments: number };
}

/**
 * Result from list operation
 */
export interface TicketListResult {
  tickets: TicketListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * TicketService - Core ticket management with full business logic
 *
 * All status changes are validated against the state machine.
 * All significant operations create history entries and audit logs.
 * Transactions are used for multi-step operations.
 */
class TicketService {
  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Create a new ticket
   *
   * @param input - Ticket creation data
   * @param createdById - ID of the user creating the ticket
   * @returns The created ticket with relations
   *
   * @example
   * ```typescript
   * const ticket = await ticketService.create({
   *   type: 'CUSTOM_VIDEO',
   *   title: 'Custom Birthday Video',
   *   description: 'Fan wants a personalized birthday greeting',
   *   creatorId: 'creator-uuid',
   *   priority: 'HIGH',
   *   ticketData: { duration: '60 seconds', fanName: 'John' }
   * }, currentUserId);
   * ```
   */
  async create(input: CreateTicketInput, createdById: string): Promise<TicketWithRelations> {
    // Verify creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: input.creatorId },
      include: { user: true },
    });

    if (!creator) {
      throw new Error(`Creator not found: ${input.creatorId}`);
    }

    // Verify creator (user making request) exists
    const createdByUser = await prisma.user.findUnique({
      where: { id: createdById },
    });

    if (!createdByUser) {
      throw new Error(`User not found: ${createdById}`);
    }

    // Generate ticket number
    const count = await prisma.ticket.count({ where: { type: input.type } });
    const ticketNumber = generateTicketNumber(input.type, count + 1);

    // Determine initial status
    const initialStatus: TicketStatus = input.submitImmediately ? 'SUBMITTED' : 'DRAFT';

    // Create ticket with history in a transaction
    const ticket = await prisma.$transaction(async (tx) => {
      // Create the ticket
      const newTicket = await tx.ticket.create({
        data: {
          ticketNumber,
          type: input.type,
          status: initialStatus,
          priority: input.priority ?? 'MEDIUM',
          title: input.title.trim(),
          description: input.description?.trim() ?? null,
          ticketData: (input.ticketData as any) ?? {},
          deadline: input.deadline ?? null,
          submittedAt: input.submitImmediately ? new Date() : null,
          creatorId: input.creatorId,
          createdById,
        },
      });

      // Create initial history entry
      await tx.ticketHistory.create({
        data: {
          ticketId: newTicket.id,
          previousStatus: null,
          newStatus: initialStatus,
          previousData: (null as any),
          newData: (input.ticketData as any) ?? {},
          changedById: createdById,
          changeReason: 'Ticket created',
        },
      });

      return newTicket;
    });

    // Fetch the complete ticket with relations
    const fullTicket = await this.getById(ticket.id);

    if (!fullTicket) {
      throw new Error('Failed to fetch created ticket');
    }

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.TICKET_CREATE,
      entityType: AUDIT_ENTITIES.TICKET,
      entityId: ticket.id,
      userId: createdById,
      userEmail: createdByUser.email,
      details: {
        ticketNumber,
        type: input.type,
        status: initialStatus,
        creatorId: input.creatorId,
        creatorName: creator.stageName,
      },
    });

    // Send notifications (async, don't wait)
    notificationService.notifyTicketCreated(ticket, creator).catch(console.error);

    return fullTicket;
  }

  /**
   * Get a ticket by ID with all relations
   *
   * @param id - Ticket ID
   * @returns Ticket with all relations or null
   */
  async getById(id: string): Promise<TicketWithRelations | null> {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: {
          include: { user: true },
        },
        createdBy: true,
        assignedTo: true,
        history: {
          include: { changedBy: true },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Get a ticket by ticket number
   *
   * @param ticketNumber - Human-readable ticket number (e.g., "CVR-2025-00001")
   * @returns Ticket with relations or null
   */
  async getByTicketNumber(ticketNumber: string): Promise<TicketWithRelations | null> {
    return prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        creator: {
          include: { user: true },
        },
        createdBy: true,
        assignedTo: true,
        history: {
          include: { changedBy: true },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Update ticket fields
   *
   * @param id - Ticket ID
   * @param input - Update data
   * @param updatedById - ID of user making the update
   * @returns Updated ticket
   */
  async update(
    id: string,
    input: UpdateTicketInput,
    updatedById: string
  ): Promise<TicketWithRelations> {
    const existing = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Ticket not found: ${id}`);
    }

    // Build update data and track changes
    const data: Prisma.TicketUpdateInput = {};
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    if (input.title !== undefined && input.title.trim() !== existing.title) {
      data.title = input.title.trim();
      changes.title = { old: existing.title, new: input.title.trim() };
    }

    if (input.description !== undefined && input.description !== existing.description) {
      data.description = input.description?.trim() ?? null;
      changes.description = { old: existing.description, new: input.description };
    }

    if (input.priority !== undefined && input.priority !== existing.priority) {
      data.priority = input.priority;
      changes.priority = { old: existing.priority, new: input.priority };
    }

    if (input.deadline !== undefined) {
      const newDeadline = input.deadline;
      const oldDeadline = existing.deadline;

      if (newDeadline?.getTime() !== oldDeadline?.getTime()) {
        data.deadline = newDeadline;
        changes.deadline = { old: oldDeadline, new: newDeadline };
      }
    }

    if (input.ticketData !== undefined) {
      data.ticketData = input.ticketData as any;
      changes.ticketData = { old: existing.ticketData, new: input.ticketData };
    }

    if (input.responseData !== undefined) {
      data.responseData = input.responseData as any;
      changes.responseData = { old: existing.responseData, new: input.responseData };
    }

    // If no changes, return existing ticket
    if (Object.keys(data).length === 0) {
      return (await this.getById(id))!;
    }

    // Update in transaction with history
    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data,
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: id,
          previousStatus: existing.status,
          newStatus: existing.status,
          previousData: existing.ticketData as Prisma.JsonObject,
          newData: (input.ticketData as any) ?? (existing.ticketData as Prisma.JsonObject),
          changedById: updatedById,
          changeReason: `Updated fields: ${Object.keys(changes).join(', ')}`,
        },
      });
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.TICKET_UPDATE,
      entityType: AUDIT_ENTITIES.TICKET,
      entityId: id,
      userId: updatedById,
      details: { changes, ticketNumber: existing.ticketNumber },
    });

    return (await this.getById(id))!;
  }

  /**
   * Delete a ticket
   *
   * Only DRAFT tickets can be fully deleted. Others are cancelled instead.
   *
   * @param id - Ticket ID
   * @param deletedById - ID of user deleting the ticket
   */
  async delete(id: string, deletedById: string): Promise<void> {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`);
    }

    // Only draft tickets can be deleted, others must be cancelled
    if (ticket.status !== 'DRAFT') {
      throw new Error('Only DRAFT tickets can be deleted. Use cancel() for other statuses.');
    }

    await prisma.ticket.delete({
      where: { id },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.TICKET_DELETE,
      entityType: AUDIT_ENTITIES.TICKET,
      entityId: id,
      userId: deletedById,
      details: { ticketNumber: ticket.ticketNumber },
    });
  }

  // ========================================
  // STATUS MANAGEMENT
  // ========================================

  /**
   * Update ticket status with validation
   *
   * Validates the transition against the state machine and updates
   * relevant timestamps (submittedAt, completedAt).
   *
   * @param id - Ticket ID
   * @param newStatus - New status to set
   * @param updatedById - ID of user making the change
   * @param reason - Optional reason for the change
   * @returns Updated ticket
   */
  async updateStatus(
    id: string,
    newStatus: TicketStatus,
    updatedById: string,
    reason?: string
  ): Promise<TicketWithRelations> {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`);
    }

    const currentStatus = ticket.status;

    // Validate transition
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }

    // Require reason for rejection
    if (newStatus === 'REJECTED' && !reason) {
      throw new Error('Reason is required for rejecting a ticket');
    }

    // Prepare update data
    const updateData: Prisma.TicketUpdateInput = {
      status: newStatus,
    };

    // Update timestamps based on status
    if (newStatus === 'SUBMITTED' && !ticket.submittedAt) {
      updateData.submittedAt = new Date();
    }

    if (newStatus === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (newStatus === 'REJECTED') {
      updateData.rejectionReason = reason;
    }

    // Get user who made the change
    const changedByUser = await prisma.user.findUnique({
      where: { id: updatedById },
    });

    // Execute in transaction
    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: updateData,
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: id,
          previousStatus: currentStatus,
          newStatus,
          previousData: ticket.ticketData as Prisma.JsonObject,
          newData: ticket.ticketData as Prisma.JsonObject,
          changedById: updatedById,
          changeReason: reason ?? `Status changed to ${newStatus}`,
        },
      });
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.TICKET_STATUS_CHANGE,
      entityType: AUDIT_ENTITIES.TICKET,
      entityId: id,
      userId: updatedById,
      details: {
        ticketNumber: ticket.ticketNumber,
        previousStatus: currentStatus,
        newStatus,
        reason,
      },
    });

    // Send notifications
    const fullTicket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    if (fullTicket && changedByUser) {
      notificationService
        .notifyStatusChange(fullTicket, currentStatus, changedByUser)
        .catch(console.error);
    }

    return (await this.getById(id))!;
  }

  /**
   * Submit a ticket (DRAFT -> SUBMITTED)
   */
  async submit(id: string, submittedById: string): Promise<TicketWithRelations> {
    return this.updateStatus(id, 'SUBMITTED', submittedById, 'Ticket submitted for review');
  }

  /**
   * Accept a ticket (PENDING_REVIEW -> ACCEPTED)
   */
  async accept(id: string, acceptedById: string): Promise<TicketWithRelations> {
    return this.updateStatus(id, 'ACCEPTED', acceptedById, 'Ticket accepted');
  }

  /**
   * Reject a ticket with required reason
   */
  async reject(
    id: string,
    rejectedById: string,
    reason: string
  ): Promise<TicketWithRelations> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required for rejection');
    }
    return this.updateStatus(id, 'REJECTED', rejectedById, reason);
  }

  /**
   * Complete a ticket (IN_PROGRESS -> COMPLETED)
   */
  async complete(id: string, completedById: string): Promise<TicketWithRelations> {
    return this.updateStatus(id, 'COMPLETED', completedById, 'Ticket completed');
  }

  /**
   * Cancel a ticket
   */
  async cancel(
    id: string,
    cancelledById: string,
    reason?: string
  ): Promise<TicketWithRelations> {
    return this.updateStatus(
      id,
      'CANCELLED',
      cancelledById,
      reason ?? 'Ticket cancelled'
    );
  }

  /**
   * Start progress on a ticket (ACCEPTED -> IN_PROGRESS)
   */
  async startProgress(id: string, startedById: string): Promise<TicketWithRelations> {
    return this.updateStatus(id, 'IN_PROGRESS', startedById, 'Work started on ticket');
  }

  /**
   * Move ticket to pending review (SUBMITTED -> PENDING_REVIEW)
   */
  async markPendingReview(id: string, reviewerId: string): Promise<TicketWithRelations> {
    return this.updateStatus(id, 'PENDING_REVIEW', reviewerId, 'Ticket under review');
  }

  // ========================================
  // ASSIGNMENT
  // ========================================

  /**
   * Assign a ticket to a user
   *
   * @param id - Ticket ID
   * @param assignedToId - ID of user to assign
   * @param assignedById - ID of user making the assignment
   * @returns Updated ticket
   */
  async assign(
    id: string,
    assignedToId: string,
    assignedById: string
  ): Promise<TicketWithRelations> {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`);
    }

    // Verify assignee exists
    const assignee = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignee) {
      throw new Error(`User not found: ${assignedToId}`);
    }

    if (!assignee.isActive) {
      throw new Error('Cannot assign ticket to inactive user');
    }

    // Get assigner info
    const assigner = await prisma.user.findUnique({
      where: { id: assignedById },
    });

    // Update ticket
    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: { assignedToId },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: id,
          previousStatus: ticket.status,
          newStatus: ticket.status,
          changedById: assignedById,
          changeReason: `Assigned to ${assignee.name}`,
        },
      });
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.TICKET_ASSIGN,
      entityType: AUDIT_ENTITIES.TICKET,
      entityId: id,
      userId: assignedById,
      details: {
        ticketNumber: ticket.ticketNumber,
        assignedToId,
        assignedToEmail: assignee.email,
        previousAssigneeId: ticket.assignedToId,
      },
    });

    // Notify assignee
    if (assigner) {
      notificationService
        .notifyTicketAssigned(ticket, assignedToId, assigner)
        .catch(console.error);
    }

    return (await this.getById(id))!;
  }

  /**
   * Unassign a ticket
   *
   * @param id - Ticket ID
   * @param unassignedById - ID of user removing assignment
   * @returns Updated ticket
   */
  async unassign(id: string, unassignedById: string): Promise<TicketWithRelations> {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { assignedTo: true },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`);
    }

    if (!ticket.assignedToId) {
      throw new Error('Ticket is not assigned to anyone');
    }

    const previousAssignee = ticket.assignedTo;

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: { assignedToId: null },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: id,
          previousStatus: ticket.status,
          newStatus: ticket.status,
          changedById: unassignedById,
          changeReason: `Unassigned from ${previousAssignee?.name ?? 'unknown'}`,
        },
      });
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.TICKET_UNASSIGN,
      entityType: AUDIT_ENTITIES.TICKET,
      entityId: id,
      userId: unassignedById,
      details: {
        ticketNumber: ticket.ticketNumber,
        previousAssigneeId: ticket.assignedToId,
      },
    });

    return (await this.getById(id))!;
  }

  // ========================================
  // QUERYING
  // ========================================

  /**
   * List tickets with comprehensive filtering
   *
   * @param filter - Filter and pagination options
   * @returns Paginated list of tickets
   */
  async list(filter: TicketFilterInput = {}): Promise<TicketListResult> {
    const {
      type,
      status,
      priority,
      creatorId,
      assignedToId,
      createdById,
      search,
      createdAfter,
      createdBefore,
      deadlineBefore,
      overdueOnly,
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    // Clamp page size
    const clampedPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    const skip = (Math.max(1, page) - 1) * clampedPageSize;

    // Build where clause
    const where: Prisma.TicketWhereInput = {};

    if (type) {
      where.type = Array.isArray(type) ? { in: type } : type;
    }

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    if (priority) {
      where.priority = Array.isArray(priority) ? { in: priority } : priority;
    }

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (createdById) {
      where.createdById = createdById;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (createdAfter || createdBefore) {
      where.createdAt = {
        ...(createdAfter && { gte: createdAfter }),
        ...(createdBefore && { lte: createdBefore }),
      };
    }

    if (deadlineBefore) {
      where.deadline = { lte: deadlineBefore };
    }

    if (overdueOnly) {
      where.deadline = { lt: new Date() };
      where.status = { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'] };
    }

    // Execute queries in parallel
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              stageName: true,
              user: { select: { id: true, name: true } },
            },
          },
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        take: clampedPageSize,
        skip,
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      total,
      page: Math.max(1, page),
      pageSize: clampedPageSize,
      totalPages: Math.ceil(total / clampedPageSize),
    };
  }

  /**
   * Get tickets for a specific creator
   */
  async getForCreator(
    creatorId: string,
    filter?: Partial<TicketFilterInput>
  ): Promise<TicketListResult> {
    return this.list({ ...filter, creatorId });
  }

  /**
   * Get tickets assigned to a user
   */
  async getAssignedTo(
    userId: string,
    filter?: Partial<TicketFilterInput>
  ): Promise<TicketListResult> {
    return this.list({ ...filter, assignedToId: userId });
  }

  /**
   * Get tickets created by a user
   */
  async getCreatedBy(
    userId: string,
    filter?: Partial<TicketFilterInput>
  ): Promise<TicketListResult> {
    return this.list({ ...filter, createdById: userId });
  }

  // ========================================
  // COMMENTS
  // ========================================

  /**
   * Add a comment to a ticket
   *
   * @param ticketId - Ticket ID
   * @param authorId - ID of comment author
   * @param content - Comment content
   * @param isInternal - Is this an internal (staff-only) comment?
   * @returns The created comment
   */
  async addComment(
    ticketId: string,
    authorId: string,
    content: string,
    isInternal = false
  ): Promise<TicketComment & { author: User }> {
    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    // Create comment and update ticket timestamp
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.ticketComment.create({
        data: {
          ticketId,
          authorId,
          content: content.trim(),
          isInternal,
        },
        include: { author: true },
      });

      // Touch the ticket's updatedAt
      await tx.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });

      return newComment;
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.TICKET_COMMENT_ADD,
      entityType: AUDIT_ENTITIES.COMMENT,
      entityId: comment.id,
      userId: authorId,
      details: {
        ticketId,
        ticketNumber: ticket.ticketNumber,
        isInternal,
      },
    });

    // Send notifications
    notificationService.notifyTicketComment(ticketId, authorId, isInternal).catch(console.error);

    return comment;
  }

  /**
   * Get comments for a ticket
   *
   * @param ticketId - Ticket ID
   * @param includeInternal - Include internal comments (staff-only)?
   * @returns Array of comments with author info
   */
  async getComments(
    ticketId: string,
    includeInternal = true
  ): Promise<Array<TicketComment & { author: User }>> {
    const where: Prisma.TicketCommentWhereInput = { ticketId };

    if (!includeInternal) {
      where.isInternal = false;
    }

    return prisma.ticketComment.findMany({
      where,
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Update a comment
   *
   * @param commentId - Comment ID
   * @param content - New content
   * @param updatedById - ID of user making the update
   * @returns Updated comment
   */
  async updateComment(
    commentId: string,
    content: string,
    updatedById: string
  ): Promise<TicketComment & { author: User }> {
    const comment = await prisma.ticketComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    // Only the author can update their comment
    if (comment.authorId !== updatedById) {
      throw new Error('Only the comment author can update it');
    }

    const updated = await prisma.ticketComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: { author: true },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.TICKET_COMMENT_UPDATE,
      entityType: AUDIT_ENTITIES.COMMENT,
      entityId: commentId,
      userId: updatedById,
      details: { ticketId: comment.ticketId },
    });

    return updated;
  }

  /**
   * Delete a comment
   *
   * @param commentId - Comment ID
   * @param deletedById - ID of user deleting the comment
   */
  async deleteComment(commentId: string, deletedById: string): Promise<void> {
    const comment = await prisma.ticketComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    await prisma.ticketComment.delete({
      where: { id: commentId },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.TICKET_COMMENT_DELETE,
      entityType: AUDIT_ENTITIES.COMMENT,
      entityId: commentId,
      userId: deletedById,
      details: { ticketId: comment.ticketId },
    });
  }

  // ========================================
  // HISTORY
  // ========================================

  /**
   * Get ticket history (audit trail)
   *
   * @param ticketId - Ticket ID
   * @returns Array of history entries with user info
   */
  async getHistory(
    ticketId: string
  ): Promise<Array<TicketHistory & { changedBy: User }>> {
    return prisma.ticketHistory.findMany({
      where: { ticketId },
      include: { changedBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Get ticket counts by status
   *
   * @param filter - Optional filter by creator or assignee
   * @returns Object with counts per status
   */
  async getStatusCounts(
    filter?: { creatorId?: string; assignedToId?: string }
  ): Promise<Record<TicketStatus, number>> {
    const where: Prisma.TicketWhereInput = {};

    if (filter?.creatorId) {
      where.creatorId = filter.creatorId;
    }

    if (filter?.assignedToId) {
      where.assignedToId = filter.assignedToId;
    }

    const counts = await prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Initialize all statuses with 0
    const result: Partial<Record<TicketStatus, number>> = {
      DRAFT: 0,
      SUBMITTED: 0,
      PENDING_REVIEW: 0,
      ACCEPTED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };

    // Fill in actual counts
    for (const item of counts) {
      result[item.status] = item._count;
    }

    return result as Record<TicketStatus, number>;
  }

  /**
   * Get recent tickets
   *
   * @param limit - Maximum number to return
   * @returns Recent tickets with basic relations
   */
  async getRecent(limit = 10): Promise<TicketListItem[]> {
    return prisma.ticket.findMany({
      include: {
        creator: {
          select: {
            id: true,
            stageName: true,
            user: { select: { id: true, name: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get overdue tickets
   *
   * @param limit - Maximum number to return
   * @returns Overdue tickets
   */
  async getOverdue(limit = 20): Promise<TicketListItem[]> {
    return prisma.ticket.findMany({
      where: {
        deadline: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'] },
      },
      include: {
        creator: {
          select: {
            id: true,
            stageName: true,
            user: { select: { id: true, name: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { deadline: 'asc' },
      take: limit,
    });
  }

  /**
   * Get unassigned tickets
   *
   * @param limit - Maximum number to return
   * @returns Unassigned tickets
   */
  async getUnassigned(limit = 20): Promise<TicketListItem[]> {
    return prisma.ticket.findMany({
      where: {
        assignedToId: null,
        status: { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED', 'DRAFT'] },
      },
      include: {
        creator: {
          select: {
            id: true,
            stageName: true,
            user: { select: { id: true, name: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: limit,
    });
  }

  // ========================================
  // VALIDATION HELPERS
  // ========================================

  /**
   * Check if a ticket exists
   *
   * @param id - Ticket ID
   * @returns true if exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.ticket.count({ where: { id } });
    return count > 0;
  }

  /**
   * Check if ticket is in a terminal state
   *
   * @param id - Ticket ID
   * @returns true if completed, rejected, or cancelled
   */
  async isTerminal(id: string): Promise<boolean> {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`);
    }

    return ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(ticket.status);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Singleton instance of the TicketService
 */
export const ticketService = new TicketService();

/**
 * Export the class for testing purposes
 */
export { TicketService };

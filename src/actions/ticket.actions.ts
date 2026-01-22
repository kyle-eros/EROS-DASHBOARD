/**
 * @file ticket.actions.ts
 * @description Server actions for ticket management - CORE ACTIONS
 * @layer Action
 * @status IMPLEMENTED
 *
 * This is the MOST IMPORTANT action file in the system. It handles:
 * - Ticket CRUD operations
 * - Status management (workflow state machine)
 * - Assignment workflows
 * - Comments and collaboration
 *
 * The ticket lifecycle follows a strict state machine:
 * DRAFT -> SUBMITTED -> PENDING_REVIEW -> ACCEPTED -> IN_PROGRESS -> COMPLETED
 * Any non-terminal state can transition to REJECTED or CANCELLED
 *
 * Permission Requirements:
 * - createTicket: tickets:create (all except CREATOR)
 * - updateTicket: tickets:update OR own ticket
 * - deleteTicket: tickets:delete OR own DRAFT ticket
 * - assignTicket: tickets:assign (MANAGER, SUPER_ADMIN)
 * - Status changes: varies by role and ticket ownership
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { ticketService } from '@/services';
import {
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
  addCommentSchema,
  updateCommentSchema,
} from '@/schemas';
import { hasPermission } from '@/lib/constants';
import type { ActionResult } from '@/types/api.types';
import type { Ticket, TicketComment, User } from '@prisma/client';

// ============================================================================
// RESULT TYPE
// ============================================================================

type TicketActionResult<T> = ActionResult<T>;

// ============================================================================
// TYPES
// ============================================================================

// Extended ticket type with relations
interface TicketWithRelations extends Ticket {
  creator: { id: string; stageName: string; user: { id: string; name: string } };
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
}

interface CommentWithAuthor extends TicketComment {
  author: User;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new ticket
 *
 * Permission: tickets:create (SUPER_ADMIN, MANAGER, SCHEDULER, CHATTER)
 *
 * @param formData - Form data with type, title, description, creatorId, priority, etc.
 * @returns ActionResult with created Ticket on success
 *
 * @example
 * ```tsx
 * <form action={createTicket}>
 *   <select name="type">...</select>
 *   <input name="title" />
 *   <textarea name="description" />
 *   <select name="creatorId">...</select>
 *   <select name="priority">...</select>
 *   <input name="deadline" type="datetime-local" />
 *   <button type="submit">Create Ticket</button>
 * </form>
 * ```
 */
export async function createTicket(formData: FormData): Promise<TicketActionResult<TicketWithRelations>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'tickets:create')) {
    return { success: false, error: 'Insufficient permissions to create tickets' };
  }

  // Parse ticketData JSON if provided
  let ticketData: Record<string, unknown> = {};
  const ticketDataRaw = formData.get('ticketData');
  if (typeof ticketDataRaw === 'string' && ticketDataRaw) {
    try {
      ticketData = JSON.parse(ticketDataRaw);
    } catch {
      // Ignore parse errors, use empty object
    }
  }

  // Parse and validate input
  const raw = {
    type: formData.get('type'),
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    creatorId: formData.get('creatorId'),
    priority: formData.get('priority') || 'MEDIUM',
    deadline: formData.get('deadline') || undefined,
    ticketData,
  };

  const parsed = createTicketSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  try {
    // Convert to service input format
    const input = {
      ...parsed.data,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
    };

    const ticket = await ticketService.create(input, session.user.id);

    revalidatePath('/tickets');
    revalidatePath('/dashboard');
    return { success: true, data: ticket as TicketWithRelations };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Creator not found')) {
        return { success: false, error: 'Creator not found' };
      }
    }
    return { success: false, error: 'Failed to create ticket' };
  }
}

/**
 * Update ticket fields
 *
 * Permission: tickets:update OR own ticket
 *
 * @param id - Ticket ID to update
 * @param formData - Form data with optional title, description, priority, deadline, ticketData
 * @returns ActionResult with updated Ticket on success
 */
export async function updateTicket(
  id: string,
  formData: FormData
): Promise<TicketActionResult<TicketWithRelations>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Get ticket to check ownership
  const existingTicket = await ticketService.getById(id);
  if (!existingTicket) {
    return { success: false, error: 'Ticket not found' };
  }

  // Permission check - can update if has permission OR is own ticket
  const isOwnTicket = existingTicket.createdById === session.user.id;
  const hasUpdatePermission = hasPermission(session.user.role, 'tickets:update');

  if (!isOwnTicket && !hasUpdatePermission) {
    return { success: false, error: 'Insufficient permissions to update this ticket' };
  }

  // Parse ticketData JSON if provided
  let ticketData: Record<string, unknown> | undefined;
  const ticketDataRaw = formData.get('ticketData');
  if (typeof ticketDataRaw === 'string' && ticketDataRaw) {
    try {
      ticketData = JSON.parse(ticketDataRaw);
    } catch {
      // Ignore parse errors
    }
  }

  // Build raw object
  const raw: Record<string, unknown> = {};

  const title = formData.get('title');
  if (title) raw.title = title;

  const description = formData.get('description');
  if (description !== null) raw.description = description || undefined;

  const priority = formData.get('priority');
  if (priority) raw.priority = priority;

  const deadline = formData.get('deadline');
  if (deadline !== null) {
    raw.deadline = deadline || null;
  }

  if (ticketData !== undefined) raw.ticketData = ticketData;

  const parsed = updateTicketSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  try {
    // Convert to service input format
    const input = {
      ...parsed.data,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : (parsed.data.deadline === null ? null : undefined),
    };

    const ticket = await ticketService.update(id, input, session.user.id);

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    return { success: true, data: ticket as TicketWithRelations };
  } catch (error) {
    return { success: false, error: 'Failed to update ticket' };
  }
}

/**
 * Delete a ticket (DRAFT only)
 *
 * Permission: tickets:delete OR own DRAFT ticket
 *
 * Only DRAFT tickets can be deleted. Others must be cancelled.
 *
 * @param id - Ticket ID to delete
 * @returns ActionResult with void on success
 */
export async function deleteTicket(id: string): Promise<TicketActionResult<void>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Get ticket to check ownership and status
  const existingTicket = await ticketService.getById(id);
  if (!existingTicket) {
    return { success: false, error: 'Ticket not found' };
  }

  // Permission check - can delete if has permission OR is own DRAFT ticket
  const isOwnDraftTicket = existingTicket.createdById === session.user.id &&
    existingTicket.status === 'DRAFT';
  const hasDeletePermission = hasPermission(session.user.role, 'tickets:delete');

  if (!isOwnDraftTicket && !hasDeletePermission) {
    return { success: false, error: 'Insufficient permissions to delete this ticket' };
  }

  try {
    await ticketService.delete(id, session.user.id);

    revalidatePath('/tickets');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Only DRAFT')) {
        return { success: false, error: 'Only DRAFT tickets can be deleted. Use cancel for other statuses.' };
      }
    }
    return { success: false, error: 'Failed to delete ticket' };
  }
}

// ============================================================================
// STATUS MANAGEMENT
// ============================================================================

/**
 * Submit a ticket for review (DRAFT -> SUBMITTED)
 *
 * @param id - Ticket ID
 * @returns ActionResult with updated Ticket on success
 */
export async function submitTicket(id: string): Promise<TicketActionResult<TicketWithRelations>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Get ticket to check ownership
  const existingTicket = await ticketService.getById(id);
  if (!existingTicket) {
    return { success: false, error: 'Ticket not found' };
  }

  // Can only submit own tickets or if has tickets:update permission
  const isOwnTicket = existingTicket.createdById === session.user.id;
  const hasPermissionToUpdate = hasPermission(session.user.role, 'tickets:update');

  if (!isOwnTicket && !hasPermissionToUpdate) {
    return { success: false, error: 'You can only submit your own tickets' };
  }

  try {
    const ticket = await ticketService.submit(id, session.user.id);

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    revalidatePath('/dashboard');
    return { success: true, data: ticket as TicketWithRelations };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid status transition')) {
        return { success: false, error: 'Ticket cannot be submitted from its current status' };
      }
    }
    return { success: false, error: 'Failed to submit ticket' };
  }
}

/**
 * Accept a ticket (-> ACCEPTED)
 *
 * @param id - Ticket ID
 * @returns ActionResult with updated Ticket on success
 */
export async function acceptTicket(id: string): Promise<TicketActionResult<TicketWithRelations>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check - need tickets:update at minimum
  if (!hasPermission(session.user.role, 'tickets:update')) {
    return { success: false, error: 'Insufficient permissions to accept tickets' };
  }

  try {
    const ticket = await ticketService.accept(id, session.user.id);

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    revalidatePath('/dashboard');
    return { success: true, data: ticket as TicketWithRelations };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid status transition')) {
        return { success: false, error: 'Ticket cannot be accepted from its current status' };
      }
      if (error.message.includes('not found')) {
        return { success: false, error: 'Ticket not found' };
      }
    }
    return { success: false, error: 'Failed to accept ticket' };
  }
}

/**
 * Reject a ticket with required reason (-> REJECTED)
 *
 * @param id - Ticket ID
 * @param reason - Rejection reason (REQUIRED)
 * @returns ActionResult with updated Ticket on success
 */
export async function rejectTicket(
  id: string,
  reason: string
): Promise<TicketActionResult<TicketWithRelations>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'tickets:update')) {
    return { success: false, error: 'Insufficient permissions to reject tickets' };
  }

  // Validate reason
  if (!reason || reason.trim().length === 0) {
    return { success: false, error: 'Rejection reason is required' };
  }

  if (reason.length > 500) {
    return { success: false, error: 'Rejection reason must be less than 500 characters' };
  }

  try {
    const ticket = await ticketService.reject(id, session.user.id, reason.trim());

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    revalidatePath('/dashboard');
    return { success: true, data: ticket as TicketWithRelations };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid status transition')) {
        return { success: false, error: 'Ticket cannot be rejected from its current status' };
      }
      if (error.message.includes('not found')) {
        return { success: false, error: 'Ticket not found' };
      }
    }
    return { success: false, error: 'Failed to reject ticket' };
  }
}

/**
 * Start work on a ticket (-> IN_PROGRESS)
 *
 * @param id - Ticket ID
 * @returns ActionResult with updated Ticket on success
 */
export async function startTicket(id: string): Promise<TicketActionResult<TicketWithRelations>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'tickets:update')) {
    return { success: false, error: 'Insufficient permissions to start tickets' };
  }

  try {
    const ticket = await ticketService.startProgress(id, session.user.id);

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    revalidatePath('/dashboard');
    return { success: true, data: ticket as TicketWithRelations };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid status transition')) {
        return { success: false, error: 'Ticket cannot be started from its current status' };
      }
      if (error.message.includes('not found')) {
        return { success: false, error: 'Ticket not found' };
      }
    }
    return { success: false, error: 'Failed to start ticket' };
  }
}

/**
 * Mark ticket as complete (-> COMPLETED)
 *
 * @param id - Ticket ID
 * @returns ActionResult with updated Ticket on success
 */
export async function completeTicket(id: string): Promise<TicketActionResult<TicketWithRelations>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'tickets:update')) {
    return { success: false, error: 'Insufficient permissions to complete tickets' };
  }

  try {
    const ticket = await ticketService.complete(id, session.user.id);

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    revalidatePath('/dashboard');
    return { success: true, data: ticket as TicketWithRelations };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid status transition')) {
        return { success: false, error: 'Ticket cannot be completed from its current status' };
      }
      if (error.message.includes('not found')) {
        return { success: false, error: 'Ticket not found' };
      }
    }
    return { success: false, error: 'Failed to complete ticket' };
  }
}

/**
 * Cancel a ticket (-> CANCELLED)
 *
 * @param id - Ticket ID
 * @param reason - Optional cancellation reason
 * @returns ActionResult with updated Ticket on success
 */
export async function cancelTicket(
  id: string,
  reason?: string
): Promise<TicketActionResult<TicketWithRelations>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Get ticket to check ownership
  const existingTicket = await ticketService.getById(id);
  if (!existingTicket) {
    return { success: false, error: 'Ticket not found' };
  }

  // Can cancel own tickets or if has tickets:update permission
  const isOwnTicket = existingTicket.createdById === session.user.id;
  const hasPermissionToUpdate = hasPermission(session.user.role, 'tickets:update');

  if (!isOwnTicket && !hasPermissionToUpdate) {
    return { success: false, error: 'Insufficient permissions to cancel this ticket' };
  }

  try {
    const ticket = await ticketService.cancel(id, session.user.id, reason);

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    revalidatePath('/dashboard');
    return { success: true, data: ticket as TicketWithRelations };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid status transition')) {
        return { success: false, error: 'Ticket cannot be cancelled from its current status' };
      }
    }
    return { success: false, error: 'Failed to cancel ticket' };
  }
}

/**
 * Generic status update (for flexibility)
 *
 * Uses updateTicketStatusSchema for validation.
 *
 * @param id - Ticket ID
 * @param formData - Form data with status and optional reason
 * @returns ActionResult with updated Ticket on success
 */
export async function updateTicketStatus(
  id: string,
  formData: FormData
): Promise<TicketActionResult<TicketWithRelations>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'tickets:update')) {
    return { success: false, error: 'Insufficient permissions to update ticket status' };
  }

  // Parse and validate
  const raw = {
    status: formData.get('status'),
    reason: formData.get('reason') || undefined,
  };

  const parsed = updateTicketStatusSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  try {
    const ticket = await ticketService.updateStatus(
      id,
      parsed.data.status,
      session.user.id,
      parsed.data.reason
    );

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    revalidatePath('/dashboard');
    return { success: true, data: ticket as TicketWithRelations };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid status transition')) {
        return { success: false, error: 'Invalid status transition' };
      }
      if (error.message.includes('Reason is required')) {
        return { success: false, error: 'Reason is required for this status change' };
      }
      if (error.message.includes('not found')) {
        return { success: false, error: 'Ticket not found' };
      }
    }
    return { success: false, error: 'Failed to update ticket status' };
  }
}

// ============================================================================
// ASSIGNMENT
// ============================================================================

/**
 * Assign a ticket to a user
 *
 * Permission: tickets:assign (MANAGER, SUPER_ADMIN)
 *
 * @param id - Ticket ID
 * @param assignedToId - User ID to assign the ticket to
 * @returns ActionResult with updated Ticket on success
 */
export async function assignTicket(
  id: string,
  assignedToId: string
): Promise<TicketActionResult<TicketWithRelations>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'tickets:assign')) {
    return { success: false, error: 'Insufficient permissions to assign tickets' };
  }

  try {
    const ticket = await ticketService.assign(id, assignedToId, session.user.id);

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    revalidatePath('/dashboard');
    return { success: true, data: ticket as TicketWithRelations };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Ticket not found')) {
        return { success: false, error: 'Ticket not found' };
      }
      if (error.message.includes('User not found')) {
        return { success: false, error: 'User not found' };
      }
      if (error.message.includes('inactive user')) {
        return { success: false, error: 'Cannot assign ticket to inactive user' };
      }
    }
    return { success: false, error: 'Failed to assign ticket' };
  }
}

/**
 * Remove assignment from a ticket
 *
 * Permission: tickets:assign (MANAGER, SUPER_ADMIN)
 *
 * @param id - Ticket ID
 * @returns ActionResult with updated Ticket on success
 */
export async function unassignTicket(id: string): Promise<TicketActionResult<TicketWithRelations>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Permission check
  if (!hasPermission(session.user.role, 'tickets:assign')) {
    return { success: false, error: 'Insufficient permissions to unassign tickets' };
  }

  try {
    const ticket = await ticketService.unassign(id, session.user.id);

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    revalidatePath('/dashboard');
    return { success: true, data: ticket as TicketWithRelations };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'Ticket not found' };
      }
      if (error.message.includes('not assigned')) {
        return { success: false, error: 'Ticket is not assigned to anyone' };
      }
    }
    return { success: false, error: 'Failed to unassign ticket' };
  }
}

// ============================================================================
// COMMENTS
// ============================================================================

/**
 * Add a comment to a ticket
 *
 * @param formData - Form data with ticketId, content, optional isInternal
 * @returns ActionResult with created Comment on success
 *
 * @example
 * ```tsx
 * <form action={addComment}>
 *   <input name="ticketId" type="hidden" value={ticketId} />
 *   <textarea name="content" />
 *   <input name="isInternal" type="checkbox" />
 *   <button type="submit">Add Comment</button>
 * </form>
 * ```
 */
export async function addComment(formData: FormData): Promise<TicketActionResult<CommentWithAuthor>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Parse form data
  const isInternalRaw = formData.get('isInternal');

  const raw = {
    ticketId: formData.get('ticketId'),
    content: formData.get('content'),
    isInternal: isInternalRaw === 'true' || isInternalRaw === '1' || isInternalRaw === 'on',
  };

  const parsed = addCommentSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  // Check if user can view this ticket (basic permission check)
  const ticket = await ticketService.getById(parsed.data.ticketId);
  if (!ticket) {
    return { success: false, error: 'Ticket not found' };
  }

  // CREATOR role can only comment on their own tickets
  if (session.user.role === 'CREATOR') {
    const isCreatorForTicket = ticket.creator.userId === session.user.id;
    if (!isCreatorForTicket) {
      return { success: false, error: 'You can only comment on your own tickets' };
    }
  }

  try {
    const comment = await ticketService.addComment(
      parsed.data.ticketId,
      session.user.id,
      parsed.data.content,
      parsed.data.isInternal
    );

    revalidatePath(`/tickets/${parsed.data.ticketId}`);
    return { success: true, data: comment };
  } catch (error) {
    return { success: false, error: 'Failed to add comment' };
  }
}

/**
 * Update an existing comment
 *
 * Only the comment author can update their comment.
 *
 * @param commentId - Comment ID to update
 * @param content - New comment content
 * @returns ActionResult with updated Comment on success
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<TicketActionResult<CommentWithAuthor>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Validate content
  const parsed = updateCommentSchema.safeParse({ content });

  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const firstFieldError = Object.values(errors.fieldErrors)[0];
    const errorMessage = firstFieldError?.[0] || 'Validation failed';
    return { success: false, error: errorMessage };
  }

  try {
    const comment = await ticketService.updateComment(
      commentId,
      parsed.data.content,
      session.user.id
    );

    revalidatePath(`/tickets/${comment.ticketId}`);
    return { success: true, data: comment };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'Comment not found' };
      }
      if (error.message.includes('Only the comment author')) {
        return { success: false, error: 'You can only edit your own comments' };
      }
    }
    return { success: false, error: 'Failed to update comment' };
  }
}

/**
 * Delete a comment
 *
 * Only the comment author can delete their comment (or admin).
 *
 * @param commentId - Comment ID to delete
 * @returns ActionResult with void on success
 */
export async function deleteComment(commentId: string): Promise<TicketActionResult<void>> {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await ticketService.deleteComment(commentId, session.user.id);

    revalidatePath('/tickets');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'Comment not found' };
      }
    }
    return { success: false, error: 'Failed to delete comment' };
  }
}

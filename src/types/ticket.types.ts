/**
 * @file ticket.types.ts
 * @description TypeScript type definitions for tickets
 * @layer Types
 * @status PLACEHOLDER - Core types defined, extend as schema evolves
 *
 * These types should align with the Prisma schema once implemented.
 */

import type { TICKET_STATUS, TICKET_PRIORITY } from '@/lib/constants';

/**
 * Ticket status type derived from constants
 */
export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

/**
 * Ticket priority type derived from constants
 */
export type TicketPriority = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

/**
 * Core ticket entity
 */
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  creatorId: string;
  assigneeId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  dueDate: Date | null;
}

/**
 * Ticket with related entities loaded
 */
export interface TicketWithRelations extends Ticket {
  creator: {
    id: string;
    name: string;
    stageName: string | null;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
  };
  comments: TicketComment[];
  history: TicketHistoryEntry[];
}

/**
 * Ticket comment
 */
export interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ticket history entry for audit trail
 */
export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  userId: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: Date;
}

/**
 * Input type for creating a ticket
 */
export interface CreateTicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  creatorId: string;
  assigneeId?: string;
  dueDate?: Date;
}

/**
 * Input type for updating a ticket
 */
export interface UpdateTicketInput {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
  dueDate?: Date | null;
}

/**
 * Filter options for ticket queries
 */
export interface TicketFilters {
  status?: TicketStatus | TicketStatus[];
  priority?: TicketPriority | TicketPriority[];
  creatorId?: string;
  assigneeId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Ticket list response with pagination
 */
export interface TicketListResponse {
  tickets: TicketWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

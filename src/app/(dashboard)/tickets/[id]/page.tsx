/**
 * @file page.tsx
 * @description Ticket detail page with comments and history
 * @layer UI
 * @status IMPLEMENTED
 *
 * Server Component that fetches a single ticket by ID.
 * Renders the TicketDetail component with appropriate permissions.
 */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ticketService, creatorService } from '@/services';
import { TicketDetail } from '@/components/tickets';
import { updateTicketStatus, addComment, assignTicket, unassignTicket } from '@/actions/ticket.actions';
import { hasPermission } from '@/lib/constants';
import type { TicketStatus, UserRole } from '@prisma/client';

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TicketPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const ticket = await ticketService.getById(id);
    if (!ticket) {
      return { title: 'Ticket Not Found' };
    }

    return {
      title: `${ticket.ticketNumber} - ${ticket.title}`,
      description: ticket.description || `Ticket ${ticket.ticketNumber}`,
    };
  } catch {
    return { title: 'Ticket Not Found' };
  }
}

export default async function TicketDetailPage({ params }: TicketPageProps) {
  const { id } = await params;
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/login');
  }

  // Fetch ticket with full details
  const ticket = await ticketService.getById(id);

  if (!ticket) {
    notFound();
  }

  // Check if user can view this ticket
  // CREATOR: can only view tickets assigned to them
  // CHATTER: can only view tickets they created or for their assigned creators
  // MANAGER/ADMIN: can view all
  let canView = false;

  if (hasPermission(userRole, 'tickets:read_all')) {
    canView = true;
  } else if (userRole === 'CREATOR') {
    const creator = await creatorService.getByUserId(userId);
    canView = !!creator && ticket.creatorId === creator.id;
  } else if (userRole === 'CHATTER') {
    canView = ticket.createdById === userId;
  }

  if (!canView) {
    notFound();
  }

  // Transform data for the component
  const ticketData = {
    ...ticket,
    ticketData: (ticket.ticketData as Record<string, unknown>) || {},
    responseData: (ticket.responseData as Record<string, unknown>) || undefined,
    creator: {
      id: ticket.creator.id,
      name: ticket.creator.user.name || ticket.creator.user.email,
      stageName: ticket.creator.stageName,
    },
    assignedTo: ticket.assignedTo
      ? {
        id: ticket.assignedTo.id,
        name: ticket.assignedTo.name || ticket.assignedTo.email,
        email: ticket.assignedTo.email,
        // image: ticket.assignedTo.image,
      }
      : null,
    createdBy: {
      id: ticket.createdBy.id,
      name: ticket.createdBy.name || ticket.createdBy.email,
      email: ticket.createdBy.email,
    },
    comments: ticket.comments.map((c) => ({
      id: c.id,
      content: c.content,
      isInternal: c.isInternal,
      createdAt: c.createdAt,
      author: {
        id: c.author.id,
        name: c.author.name || c.author.email,
        // image: c.author.image,
      },
    })),
    history: ticket.history.map((h) => ({
      id: h.id,
      // Infer action from status change
      action: h.previousStatus !== h.newStatus ? 'STATUS_CHANGE' : 'UPDATE',
      field: h.changeReason?.includes('Assigned') ? 'assignedToId' : 'status',
      oldValue: h.previousStatus || '',
      newValue: h.newStatus,
      reason: h.changeReason || '',
      createdAt: h.createdAt,
      user: {
        id: h.changedBy.id,
        name: h.changedBy.name || h.changedBy.email,
      },
    })),
  };

  // Server action handlers
  async function handleStatusChange(status: TicketStatus, reason?: string) {
    'use server';
    const formData = new FormData();
    formData.append('status', status);
    if (reason) formData.append('reason', reason);

    const result = await updateTicketStatus(id, formData);
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  async function handleAssign(assigneeId: string | null) {
    'use server';
    if (assigneeId) {
      const result = await assignTicket(id, assigneeId);
      if (!result.success) throw new Error(result.error);
    } else {
      const result = await unassignTicket(id);
      if (!result.success) throw new Error(result.error);
    }
  }

  async function handleAddComment(content: string, isInternal: boolean) {
    'use server';
    const formData = new FormData();
    formData.append('ticketId', id);
    formData.append('content', content);
    if (isInternal) formData.append('isInternal', 'true');

    const result = await addComment(formData);
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  return (
    <TicketDetail
      ticket={ticketData}
      currentUserId={userId}
      onStatusChange={handleStatusChange}
      onAssign={handleAssign}
      onAddComment={handleAddComment}
    />
  );
}

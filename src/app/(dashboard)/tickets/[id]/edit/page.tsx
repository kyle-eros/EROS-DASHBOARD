/**
 * @file page.tsx
 * @description Edit ticket page
 * @layer UI
 * @status IMPLEMENTED
 *
 * Server Component that fetches a ticket for editing.
 * Uses the TicketForm component in edit mode.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ticketService, creatorService } from '@/services';
import { TicketForm } from '@/components/tickets';
import { updateTicket } from '@/actions/ticket.actions';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { hasPermission } from '@/lib/constants';
import type { UserRole } from '@prisma/client';

interface EditTicketPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditTicketPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const ticket = await ticketService.getById(id);
    if (!ticket) {
      return { title: 'Ticket Not Found' };
    }

    return {
      title: `Edit ${ticket.ticketNumber}`,
      description: `Edit ticket ${ticket.ticketNumber}`,
    };
  } catch {
    return { title: 'Ticket Not Found' };
  }
}

export default async function EditTicketPage({ params }: EditTicketPageProps) {
  const { id } = await params;
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/login');
  }

  // Check permission
  if (!hasPermission(userRole, 'tickets:update')) {
    redirect(`/tickets/${id}`);
  }

  // Fetch ticket
  const ticket = await ticketService.getById(id);

  if (!ticket) {
    notFound();
  }

  // Check if user can edit this ticket
  // Only the creator or someone with tickets:update permission can edit
  // Terminal statuses (COMPLETED, REJECTED, CANCELLED) cannot be edited
  const isTerminal = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(ticket.status);
  if (isTerminal) {
    redirect(`/tickets/${id}`);
  }

  const canEdit =
    hasPermission(userRole, 'tickets:read_all') ||
    ticket.createdById === userId;

  if (!canEdit) {
    redirect(`/tickets/${id}`);
  }

  // Fetch creators for dropdown
  let creators: Array<{ id: string; name: string; stageName?: string | null }> = [];

  if (hasPermission(userRole, 'creators:read_all')) {
    const allCreators = await creatorService.getActiveCreators();
    creators = allCreators.map((c) => ({
      id: c.id,
      name: c.user.name || c.user.email,
      stageName: c.stageName,
    }));
  } else {
    if (userId) {
      const assignedCreators = await creatorService.getAssignedToUser(userId);
      creators = assignedCreators.map((c) => ({
        id: c.id,
        name: c.user.name || c.user.email,
        stageName: c.stageName,
      }));
    }
  }

  // Prepare default values from existing ticket
  const defaultValues = {
    type: ticket.type,
    title: ticket.title,
    description: ticket.description || '',
    creatorId: ticket.creatorId,
    priority: ticket.priority,
    deadline: ticket.deadline?.toISOString(),
    ticketData: (ticket.ticketData as Record<string, unknown>) || {},
  };

  // Handle form submission via server action
  async function handleSubmit(data: any) {
    'use server';
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.priority) formData.append('priority', data.priority);
    if (data.deadline) formData.append('deadline', data.deadline instanceof Date ? data.deadline.toISOString() : data.deadline);
    if (data.ticketData) formData.append('ticketData', JSON.stringify(data.ticketData));

    const result = await updateTicket(id, formData);
    if (result.success) {
      return { success: true, ticketId: result.data?.id };
    }
    return { success: false, error: result.error };
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Button variant="ghost" asChild className="-ml-2">
        <Link href={`/tickets/${id}`}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Ticket
        </Link>
      </Button>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Ticket</h1>
        <p className="text-muted-foreground">
          Update ticket {ticket.ticketNumber}
        </p>
      </div>

      {/* Edit Form */}
      <TicketForm
        creators={creators}
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        isEdit
      />
    </div>
  );
}

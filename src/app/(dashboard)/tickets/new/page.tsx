/**
 * @file page.tsx
 * @description Create new ticket page
 * @layer UI
 * @status IMPLEMENTED
 *
 * Server Component that fetches creators for the form dropdown.
 * Uses the TicketForm component with createTicket server action.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { creatorService } from '@/services';
import { TicketForm } from '@/components/tickets';
import { createTicket } from '@/actions/ticket.actions';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { hasPermission } from '@/lib/constants';
import type { UserRole } from '@prisma/client';

export const metadata: Metadata = {
  title: 'New Ticket',
  description: 'Create a new support ticket',
};

export default async function NewTicketPage() {
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;

  // Check permission
  if (!hasPermission(userRole, 'tickets:create')) {
    redirect('/tickets');
  }

  // Fetch creators for dropdown
  // Different roles see different creators
  let creators: Array<{ id: string; name: string; stageName?: string | null }> = [];

  if (hasPermission(userRole, 'creators:read_all')) {
    // Managers and admins see all creators
    const allCreators = await creatorService.getActiveCreators();
    creators = allCreators.map((c) => ({
      id: c.id,
      name: c.user.name || c.user.email,
      stageName: c.stageName,
    }));
  } else {
    // Chatters see only assigned creators
    const userId = session?.user?.id;
    if (userId) {
      const assignedCreators = await creatorService.getAssignedToUser(userId);
      creators = assignedCreators.map((c) => ({
        id: c.id,
        name: c.user.name || c.user.email,
        stageName: c.stageName,
      }));
    }
  }

  // Handle form submission via server action
  async function handleSubmit(data: any) {
    'use server';
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.priority) formData.append('priority', data.priority);
    if (data.creatorId) formData.append('creatorId', data.creatorId);
    if (data.deadline) formData.append('deadline', data.deadline instanceof Date ? data.deadline.toISOString() : data.deadline);
    if (data.ticketData) formData.append('ticketData', JSON.stringify(data.ticketData));

    const result = await createTicket(formData);
    if (result.success) {
      return { success: true, ticketId: result.data.id };
    }
    return { success: false, error: result.error };
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/tickets">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Tickets
        </Link>
      </Button>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Ticket</h1>
        <p className="text-muted-foreground">
          Submit a new ticket for a creator request
        </p>
      </div>

      {/* Check if user has any creators assigned */}
      {creators.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            You do not have any creators assigned to you.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Contact a manager to be assigned to creators before you can create tickets.
          </p>
          <Button asChild className="mt-4">
            <Link href="/tickets">Return to Tickets</Link>
          </Button>
        </div>
      ) : (
        <TicketForm creators={creators} onSubmit={handleSubmit} />
      )}
    </div>
  );
}

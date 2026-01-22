/**
 * @file page.tsx
 * @description Ticket list page with filtering and pagination
 * @layer UI
 * @status IMPLEMENTED
 *
 * Server Component that fetches tickets based on URL query parameters.
 * Supports filtering by type, status, priority, creator.
 * Supports pagination and sorting.
 *
 * Role-based filtering:
 * - CREATOR: only assigned tickets
 * - CHATTER: only created tickets + assigned creators' tickets
 * - MANAGER/ADMIN: all tickets
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { ticketService, creatorService } from '@/services';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TicketFilters, StatusBadge, PriorityBadge, TypeBadge } from '@/components/tickets';
import { UrlPagination, EmptyState, LoadingSpinner } from '@/components/shared';
import { Plus, Ticket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { hasPermission } from '@/lib/constants';
import type { TicketType, TicketStatus, TicketPriority, UserRole } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Tickets',
  description: 'View and manage support tickets',
};

interface TicketsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    type?: string;
    status?: string;
    priority?: string;
    creatorId?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function TicketListContent({ searchParams }: { searchParams: TicketsPageProps['searchParams'] }) {
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;
  const userId = session?.user?.id;

  // Resolve searchParams promise (Next.js 15)
  const params = await searchParams;

  // Build filter from search params
  const filter = {
    page: params.page ? parseInt(params.page) : 1,
    pageSize: params.pageSize ? parseInt(params.pageSize) : 20,
    search: params.search || undefined,
    type: params.type as TicketType | undefined,
    status: params.status as TicketStatus | undefined,
    priority: params.priority as TicketPriority | undefined,
    creatorId: params.creatorId || undefined,
    sortBy: (params.sortBy as 'createdAt' | 'updatedAt' | 'deadline' | 'priority') || 'createdAt',
    sortOrder: (params.sortOrder as 'asc' | 'desc') || 'desc',
  };

  // Role-based filtering
  // CREATOR: only see their own tickets (assigned via creator profile)
  // CHATTER: see tickets they created + tickets for their assigned creators
  // MANAGER/ADMIN: see all tickets
  let roleFilter = {};
  if (userRole === 'CREATOR') {
    // Get creator profile for this user
    const creator = await creatorService.getByUserId(userId!);
    if (creator) {
      roleFilter = { creatorId: creator.id };
    }
  } else if (userRole === 'CHATTER') {
    // Chatters see tickets they created
    roleFilter = { createdById: userId };
  }
  // MANAGER, SCHEDULER, SUPER_ADMIN see all tickets

  // Fetch tickets
  const { tickets, total, page, pageSize } = await ticketService.list({
    ...filter,
    ...roleFilter,
  });

  // Fetch creators for filter dropdown (if user can see all)
  const canSeeAllCreators = hasPermission(userRole, 'creators:read_all');
  const creators = canSeeAllCreators ? await creatorService.getActiveCreators() : [];

  const canCreateTickets = hasPermission(userRole, 'tickets:create');

  return (
    <>
      {/* Filters */}
      <TicketFilters
        showCreatorFilter={canSeeAllCreators}
        creators={creators}
      />

      {/* Results */}
      {tickets.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No tickets found"
          description={
            filter.search || filter.type || filter.status || filter.priority
              ? 'Try adjusting your filters to find what you are looking for.'
              : 'Get started by creating your first ticket.'
          }
          action={
            canCreateTickets ? (
              <Button asChild>
                <Link href="/tickets/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Ticket
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Ticket List */}
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block"
              >
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-start justify-between p-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {ticket.ticketNumber}
                        </span>
                        <TypeBadge type={ticket.type} size="sm" />
                        <StatusBadge status={ticket.status} size="sm" />
                        <PriorityBadge priority={ticket.priority} size="sm" />
                      </div>
                      <h3 className="font-medium truncate">{ticket.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{ticket.creator.stageName}</span>
                        <span>&bull;</span>
                        <span>
                          Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </span>
                        {ticket.assignedTo && (
                          <>
                            <span>&bull;</span>
                            <span>Assigned to {ticket.assignedTo.name}</span>
                          </>
                        )}
                        {ticket.deadline && (
                          <>
                            <span>&bull;</span>
                            <span className={new Date(ticket.deadline) < new Date() ? 'text-destructive' : ''}>
                              Due {formatDistanceToNow(new Date(ticket.deadline), { addSuffix: true })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div className="mt-6">
              <UrlPagination
                page={page}
                pageSize={pageSize}
                total={total}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;
  const canCreateTickets = hasPermission(userRole, 'tickets:create');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">
            View and manage support tickets
          </p>
        </div>
        {canCreateTickets && (
          <Button asChild>
            <Link href="/tickets/new">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Link>
          </Button>
        )}
      </div>

      {/* Ticket List with Suspense */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <TicketListContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

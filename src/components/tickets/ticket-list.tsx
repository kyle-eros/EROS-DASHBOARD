/**
 * @file ticket-list.tsx
 * @description Ticket list component with table view
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Table view with columns: #, Title, Type, Status, Priority, Creator, Assigned, Created
 * - Clickable rows to navigate to detail
 * - Empty state when no tickets
 * - Loading skeleton
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { TypeBadge } from './type-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { getInitials } from '@/lib/utils';
import { Ticket as TicketIcon } from 'lucide-react';
import type { TicketType, TicketStatus, TicketPriority } from '@prisma/client';

interface TicketListItem {
  id: string;
  ticketNumber?: string;
  title: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date | string;
  creator?: {
    id: string;
    name: string;
    stageName?: string | null;
  };
  assignedTo?: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  createdBy?: {
    id: string;
    name: string;
  };
}

interface TicketListProps {
  tickets: TicketListItem[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

function TicketListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48 flex-1" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function TicketList({
  tickets,
  isLoading = false,
  emptyTitle = 'No tickets found',
  emptyDescription = 'Get started by creating your first ticket.',
  emptyAction,
}: TicketListProps) {
  const router = useRouter();

  if (isLoading) {
    return <TicketListSkeleton />;
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={TicketIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  const handleRowClick = (ticketId: string) => {
    router.push(`/tickets/${ticketId}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">#</TableHead>
            <TableHead className="min-w-[200px]">Title</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Priority</TableHead>
            <TableHead className="w-[120px]">Creator</TableHead>
            <TableHead className="w-[120px]">Assigned</TableHead>
            <TableHead className="w-[120px]">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const creatorName = ticket.creator?.stageName || ticket.creator?.name || 'Unknown';

            return (
              <TableRow
                key={ticket.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(ticket.id)}
              >
                <TableCell className="font-mono text-xs">
                  {ticket.ticketNumber || ticket.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{truncate(ticket.title, 50)}</span>
                </TableCell>
                <TableCell>
                  <TypeBadge type={ticket.type} size="sm" showIcon={false} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={ticket.status} size="sm" />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={ticket.priority} size="sm" showIcon />
                </TableCell>
                <TableCell>
                  <span className="text-sm truncate max-w-[100px] block">
                    {creatorName}
                  </span>
                </TableCell>
                <TableCell>
                  {ticket.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {/* {ticket.assignedTo.image && (
                          <AvatarImage
                            src={ticket.assignedTo.image}
                            alt={ticket.assignedTo.name}
                          />
                        )} */}
                        <AvatarFallback className="text-[10px]">
                          {getInitials(ticket.assignedTo.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate max-w-[80px]">
                        {ticket.assignedTo.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(ticket.createdAt)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

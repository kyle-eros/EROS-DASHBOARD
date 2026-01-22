/**
 * @file ticket-card.tsx
 * @description Ticket summary card component
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Ticket number and title
 * - Status and priority badges
 * - Creator and assignee info
 * - Deadline indicator (if set)
 * - Click to navigate
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock, User, Calendar } from 'lucide-react';
import { cn, formatRelativeTime, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { TypeBadge } from './type-badge';
import { getInitials } from '@/lib/utils';
import type { TicketType, TicketStatus, TicketPriority } from '@prisma/client';

interface TicketCardProps {
  ticket: {
    id: string;
    ticketNumber?: string;
    title: string;
    description?: string | null;
    type: TicketType;
    status: TicketStatus;
    priority: TicketPriority;
    deadline?: Date | string | null;
    createdAt: Date | string;
    creator?: {
      id: string;
      name: string;
      stageName?: string | null;
    };
    assignee?: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    } | null;
    createdBy?: {
      id: string;
      name: string;
    };
  };
  showType?: boolean;
  className?: string;
}

export function TicketCard({ ticket, showType = true, className }: TicketCardProps) {
  const isOverdue = ticket.deadline && new Date(ticket.deadline) < new Date();
  const creatorName = ticket.creator?.stageName || ticket.creator?.name || 'Unknown';

  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card
        className={cn(
          'transition-colors hover:bg-accent/50 cursor-pointer',
          isOverdue && ticket.status !== 'COMPLETED' && ticket.status !== 'REJECTED' && ticket.status !== 'CANCELLED' && 'border-red-300',
          className
        )}
      >
        <CardContent className="p-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Ticket Number */}
              {ticket.ticketNumber && (
                <span className="text-xs text-muted-foreground font-mono">
                  {ticket.ticketNumber}
                </span>
              )}
              {/* Title */}
              <h3 className="font-medium truncate">{ticket.title}</h3>
              {/* Description Preview */}
              {ticket.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {ticket.description}
                </p>
              )}
            </div>
            {/* Status Badge */}
            <StatusBadge status={ticket.status} size="sm" />
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {showType && <TypeBadge type={ticket.type} size="sm" />}
            <PriorityBadge priority={ticket.priority} size="sm" showIcon />
          </div>

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
            {/* Creator */}
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>{creatorName}</span>
            </div>

            {/* Assignee */}
            {ticket.assignee && (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-4 w-4">
                  {/* {ticket.assignee.image && (
                    <AvatarImage src={ticket.assignee.image} alt={ticket.assignee.name} />
                  )} */}
                  <AvatarFallback className="text-[8px]">
                    {getInitials(ticket.assignee.name)}
                  </AvatarFallback>
                </Avatar>
                <span>{ticket.assignee.name}</span>
              </div>
            )}

            {/* Created At */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatRelativeTime(ticket.createdAt)}</span>
            </div>

            {/* Deadline */}
            {ticket.deadline && (
              <div
                className={cn(
                  'flex items-center gap-1.5',
                  isOverdue && ticket.status !== 'COMPLETED' && ticket.status !== 'REJECTED' && ticket.status !== 'CANCELLED' && 'text-red-500'
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Due {formatDate(ticket.deadline, 'MMM d')}
                  {isOverdue && ticket.status !== 'COMPLETED' && ticket.status !== 'REJECTED' && ticket.status !== 'CANCELLED' && ' (Overdue)'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

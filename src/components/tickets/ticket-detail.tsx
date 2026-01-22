/**
 * @file ticket-detail.tsx
 * @description Full ticket detail view component
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Header with number, title, status badge
 * - Metadata section (type, priority, creator, assignee, dates)
 * - Description section
 * - Type-specific data display
 * - Action buttons based on status
 * - Comments section
 * - History timeline
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, Users } from 'lucide-react';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { TypeBadge } from './type-badge';
import { TicketActions } from './ticket-actions';
import { TicketHistory } from './ticket-history';
import { TicketComments } from './ticket-comments';
import { getInitials } from '@/lib/utils';
import type { TicketType, TicketStatus, TicketPriority } from '@prisma/client';

interface TicketDetailData {
  id: string;
  ticketNumber: string;
  title: string;
  description?: string | null;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  ticketData?: Record<string, unknown> | null;
  deadline?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt?: Date | string | null;
  creator: {
    id: string;
    name: string;
    stageName?: string | null;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  createdBy: {
    id: string;
    name: string;
    email?: string;
  };
  comments: Array<{
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: Date | string;
    author: {
      id: string;
      name: string;
      image?: string | null;
    };
  }>;
  history: Array<{
    id: string;
    action: string;
    field?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    reason?: string | null;
    createdAt: Date | string;
    user: {
      id: string;
      name: string;
    };
  }>;
}

interface TicketDetailProps {
  ticket: TicketDetailData;
  currentUserId: string;
  onStatusChange?: (status: TicketStatus, reason?: string) => Promise<void>;
  onAssign?: (userId: string | null) => Promise<void>;
  onAddComment?: (content: string, isInternal: boolean) => Promise<void>;
}

export function TicketDetail({
  ticket,
  currentUserId,
  onStatusChange,
  onAssign,
  onAddComment,
}: TicketDetailProps) {
  const isOverdue = ticket.deadline && new Date(ticket.deadline) < new Date();
  const isTerminal = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(ticket.status);
  const creatorDisplayName = ticket.creator.stageName || ticket.creator.name;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/tickets"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tickets
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted-foreground">
              {ticket.ticketNumber}
            </span>
            <StatusBadge status={ticket.status} size="md" />
          </div>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={ticket.type} size="md" />
            <PriorityBadge priority={ticket.priority} size="md" showIcon />
          </div>
        </div>

        {/* Actions */}
        <TicketActions
          ticket={ticket}
          currentUserId={currentUserId}
          onStatusChange={onStatusChange}
          onAssign={onAssign}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.description ? (
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              ) : (
                <p className="text-muted-foreground italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Type-Specific Data */}
          {ticket.ticketData && Object.keys(ticket.ticketData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(ticket.ticketData).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </dt>
                      <dd className="text-sm">
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value ?? '-')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Tabs for Comments/History */}
          <Card>
            <Tabs defaultValue="comments">
              <CardHeader className="pb-0">
                <TabsList>
                  <TabsTrigger value="comments">
                    Comments ({ticket.comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    History ({ticket.history.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-6">
                <TabsContent value="comments" className="m-0">
                  <TicketComments
                    comments={ticket.comments}
                    ticketId={ticket.id}
                    currentUserId={currentUserId}
                    onAddComment={onAddComment}
                  />
                </TabsContent>
                <TabsContent value="history" className="m-0">
                  <TicketHistory history={ticket.history} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Creator */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Creator</span>
                </div>
                <span className="text-sm font-medium">{creatorDisplayName}</span>
              </div>

              <Separator />

              {/* Submitted By */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Submitted by</span>
                </div>
                <span className="text-sm font-medium">{ticket.createdBy.name}</span>
              </div>

              <Separator />

              {/* Assigned To */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assigned to</span>
                </div>
                {ticket.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {/* {ticket.assignedTo.image && (
                        <AvatarImage src={ticket.assignedTo.image} alt={ticket.assignedTo.name} />
                      )} */}
                      <AvatarFallback className="text-xs">
                        {getInitials(ticket.assignedTo.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{ticket.assignedTo.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </div>

              <Separator />

              {/* Created At */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatDate(ticket.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(ticket.createdAt)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Deadline */}
              {ticket.deadline && (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Deadline</span>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          isOverdue && !isTerminal && 'text-red-500'
                        )}
                      >
                        {formatDate(ticket.deadline)}
                      </p>
                      {isOverdue && !isTerminal && (
                        <p className="text-xs text-red-500">Overdue</p>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Last Updated */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatRelativeTime(ticket.updatedAt)}
                </p>
              </div>

              {/* Resolved At */}
              {ticket.resolvedAt && (
                <>
                  <Separator />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Resolved</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDate(ticket.resolvedAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(ticket.resolvedAt)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * @file ticket-history.tsx
 * @description Ticket history timeline component
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Chronological list of changes
 * - Status change indicators with colors
 * - User who made change
 * - Timestamp
 * - Change reason (if provided)
 */

import * as React from 'react';
import {
  Circle,
  CheckCircle,
  XCircle,
  Ban,
  Play,
  Clock,
  Edit,
  UserPlus,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { TICKET_STATUS_CONFIG } from '@/lib/constants';
import type { TicketStatus } from '@prisma/client';

interface HistoryEntry {
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
}

interface TicketHistoryProps {
  history: HistoryEntry[];
}

/**
 * Get icon for history action
 */
function getActionIcon(action: string, newValue?: string | null) {
  switch (action) {
    case 'CREATED':
      return Circle;
    case 'STATUS_CHANGED':
      if (newValue === 'COMPLETED') return CheckCircle;
      if (newValue === 'REJECTED') return XCircle;
      if (newValue === 'CANCELLED') return Ban;
      if (newValue === 'IN_PROGRESS') return Play;
      return Clock;
    case 'ASSIGNED':
    case 'UNASSIGNED':
      return UserPlus;
    case 'UPDATED':
      return Edit;
    case 'COMMENT_ADDED':
      return MessageSquare;
    default:
      return Circle;
  }
}

/**
 * Get color class for history action
 */
function getActionColor(action: string, newValue?: string | null): string {
  switch (action) {
    case 'CREATED':
      return 'bg-blue-500 text-white';
    case 'STATUS_CHANGED':
      if (newValue && newValue in TICKET_STATUS_CONFIG) {
        const config = TICKET_STATUS_CONFIG[newValue as TicketStatus];
        return `${config.bgColor} ${config.textColor}`;
      }
      return 'bg-gray-100 text-gray-700';
    case 'ASSIGNED':
      return 'bg-indigo-100 text-indigo-700';
    case 'UNASSIGNED':
      return 'bg-gray-100 text-gray-700';
    case 'UPDATED':
      return 'bg-yellow-100 text-yellow-700';
    case 'COMMENT_ADDED':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Format action description
 */
function formatAction(entry: HistoryEntry): React.ReactNode {
  const { action, field, oldValue, newValue, user } = entry;

  switch (action) {
    case 'CREATED':
      return (
        <>
          <span className="font-medium">{user.name}</span> created this ticket
        </>
      );
    case 'STATUS_CHANGED':
      const oldStatus = oldValue && oldValue in TICKET_STATUS_CONFIG
        ? TICKET_STATUS_CONFIG[oldValue as TicketStatus].label
        : oldValue;
      const newStatus = newValue && newValue in TICKET_STATUS_CONFIG
        ? TICKET_STATUS_CONFIG[newValue as TicketStatus].label
        : newValue;
      return (
        <>
          <span className="font-medium">{user.name}</span> changed status from{' '}
          <span className="font-medium">{oldStatus}</span>
          <ArrowRight className="inline h-3 w-3 mx-1" />
          <span className="font-medium">{newStatus}</span>
        </>
      );
    case 'ASSIGNED':
      return (
        <>
          <span className="font-medium">{user.name}</span> assigned ticket to{' '}
          <span className="font-medium">{newValue}</span>
        </>
      );
    case 'UNASSIGNED':
      return (
        <>
          <span className="font-medium">{user.name}</span> unassigned{' '}
          <span className="font-medium">{oldValue}</span>
        </>
      );
    case 'UPDATED':
      return (
        <>
          <span className="font-medium">{user.name}</span> updated{' '}
          <span className="font-medium">{field}</span>
          {oldValue && newValue && (
            <>
              {' '}from <span className="font-medium">{oldValue}</span> to{' '}
              <span className="font-medium">{newValue}</span>
            </>
          )}
        </>
      );
    case 'COMMENT_ADDED':
      return (
        <>
          <span className="font-medium">{user.name}</span> added a comment
        </>
      );
    default:
      return (
        <>
          <span className="font-medium">{user.name}</span> {action.toLowerCase().replace('_', ' ')}
        </>
      );
  }
}

export function TicketHistory({ history }: TicketHistoryProps) {
  if (history.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No history entries yet
      </p>
    );
  }

  // Sort by date descending (newest first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-6">
        {sortedHistory.map((entry, index) => {
          const Icon = getActionIcon(entry.action, entry.newValue);
          const colorClass = getActionColor(entry.action, entry.newValue);

          return (
            <div key={entry.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  colorClass
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <p className="text-sm">{formatAction(entry)}</p>
                {entry.reason && (
                  <p className="mt-1 text-sm text-muted-foreground italic">
                    "{entry.reason}"
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(entry.createdAt, 'MMM d, yyyy h:mm a')} ({formatRelativeTime(entry.createdAt)})
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

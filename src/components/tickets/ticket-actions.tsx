/**
 * @file ticket-actions.tsx
 * @description Ticket action buttons component
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Conditional buttons based on status
 * - Confirm dialogs for destructive actions
 * - Reject dialog with reason input
 * - Loading states
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Edit,
  Play,
  CheckCircle,
  XCircle,
  Ban,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getAvailableTransitions, TICKET_STATUS_CONFIG } from '@/lib/constants';
import type { TicketStatus } from '@prisma/client';

interface TicketActionsProps {
  ticket: {
    id: string;
    status: TicketStatus;
    assignedTo?: { id: string } | null;
  };
  currentUserId: string;
  onStatusChange?: (status: TicketStatus, reason?: string) => Promise<void>;
  onAssign?: (userId: string | null) => Promise<void>;
}

export function TicketActions({
  ticket,
  currentUserId,
  onStatusChange,
  onAssign,
}: TicketActionsProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');

  const availableTransitions = getAvailableTransitions(ticket.status);
  const isTerminal = availableTransitions.length === 0;
  const isAssignedToMe = ticket.assignedTo?.id === currentUserId;

  const handleStatusChange = async (newStatus: TicketStatus, statusReason?: string) => {
    if (!onStatusChange) return;
    setIsLoading(true);
    try {
      await onStatusChange(newStatus, statusReason);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    await handleStatusChange('REJECTED', reason);
    setRejectDialogOpen(false);
    setReason('');
  };

  const handleCancel = async () => {
    await handleStatusChange('CANCELLED', reason || undefined);
    setCancelDialogOpen(false);
    setReason('');
  };

  const handleAssignToMe = async () => {
    if (!onAssign) return;
    setIsLoading(true);
    try {
      await onAssign(currentUserId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!onAssign) return;
    setIsLoading(true);
    try {
      await onAssign(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Get primary action based on current status
  const getPrimaryAction = () => {
    switch (ticket.status) {
      case 'SUBMITTED':
        return {
          label: 'Accept',
          icon: CheckCircle,
          action: () => handleStatusChange('PENDING_REVIEW'),
          variant: 'default' as const,
        };
      case 'PENDING_REVIEW':
        return {
          label: 'Accept',
          icon: CheckCircle,
          action: () => handleStatusChange('ACCEPTED'),
          variant: 'default' as const,
        };
      case 'ACCEPTED':
        return {
          label: 'Start Work',
          icon: Play,
          action: () => handleStatusChange('IN_PROGRESS'),
          variant: 'default' as const,
        };
      case 'IN_PROGRESS':
        return {
          label: 'Complete',
          icon: CheckCircle,
          action: () => handleStatusChange('COMPLETED'),
          variant: 'default' as const,
        };
      default:
        return null;
    }
  };

  const primaryAction = getPrimaryAction();

  if (isTerminal) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          This ticket is {TICKET_STATUS_CONFIG[ticket.status].label.toLowerCase()}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Edit Button */}
        <Button variant="outline" asChild>
          <Link href={`/tickets/${ticket.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>

        {/* Assign Button */}
        {!isAssignedToMe ? (
          <Button variant="outline" onClick={handleAssignToMe} disabled={isLoading}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign to Me
          </Button>
        ) : (
          <Button variant="outline" onClick={handleUnassign} disabled={isLoading}>
            <UserPlus className="mr-2 h-4 w-4" />
            Unassign
          </Button>
        )}

        {/* Primary Action */}
        {primaryAction && (
          <Button onClick={primaryAction.action} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <primaryAction.icon className="mr-2 h-4 w-4" />
            )}
            {primaryAction.label}
          </Button>
        )}

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">More Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Status Transitions */}
            {availableTransitions.map((status) => {
              // Skip primary action status and destructive actions
              if (
                primaryAction &&
                ((ticket.status === 'SUBMITTED' && status === 'PENDING_REVIEW') ||
                  (ticket.status === 'PENDING_REVIEW' && status === 'ACCEPTED') ||
                  (ticket.status === 'ACCEPTED' && status === 'IN_PROGRESS') ||
                  (ticket.status === 'IN_PROGRESS' && status === 'COMPLETED'))
              ) {
                return null;
              }
              if (status === 'REJECTED' || status === 'CANCELLED') return null;

              const config = TICKET_STATUS_CONFIG[status];
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isLoading}
                >
                  Move to {config.label}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />

            {/* Reject */}
            {availableTransitions.includes('REJECTED') && (
              <DropdownMenuItem
                onClick={() => setRejectDialogOpen(true)}
                className="text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            )}

            {/* Cancel */}
            {availableTransitions.includes('CANCELLED') && (
              <DropdownMenuItem
                onClick={() => setCancelDialogOpen(true)}
                className="text-red-600"
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancel Ticket
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Ticket</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this ticket. This will be visible
              to the ticket creator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason (required)</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter rejection reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!reason.trim() || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this ticket? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason (optional)</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter cancellation reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Ticket
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

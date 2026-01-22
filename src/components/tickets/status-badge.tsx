/**
 * @file status-badge.tsx
 * @description Ticket status badge component with color coding
 * @layer UI/Component
 * @status IMPLEMENTED
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TICKET_STATUS_CONFIG } from '@/lib/constants';
import type { TicketStatus } from '@prisma/client';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Maps status color names to badge variants
 */
const colorToVariant: Record<string, 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'indigo' | 'orange'> = {
  gray: 'gray',
  blue: 'blue',
  yellow: 'yellow',
  green: 'green',
  red: 'red',
  purple: 'purple',
  indigo: 'indigo',
  orange: 'orange',
};

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const config = TICKET_STATUS_CONFIG[status];

  if (!config) {
    return (
      <Badge variant="gray" className={className}>
        {status}
      </Badge>
    );
  }

  const variant = colorToVariant[config.color] || 'gray';

  return (
    <Badge
      variant={variant}
      className={cn(
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-0.5',
        size === 'lg' && 'text-sm px-3 py-1',
        className
      )}
    >
      {config.label}
    </Badge>
  );
}

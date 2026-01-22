/**
 * @file priority-badge.tsx
 * @description Ticket priority badge component with color coding
 * @layer UI/Component
 * @status IMPLEMENTED
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PRIORITY_CONFIG } from '@/lib/constants';
import type { TicketPriority } from '@prisma/client';

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * Maps priority color names to badge variants
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

export function PriorityBadge({ priority, size = 'sm', showIcon = false, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  if (!config) {
    return (
      <Badge variant="gray" className={className}>
        {priority}
      </Badge>
    );
  }

  const variant = colorToVariant[config.color] || 'gray';

  return (
    <Badge
      variant={variant}
      className={cn(
        'gap-1',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-0.5',
        size === 'lg' && 'text-sm px-3 py-1',
        className
      )}
    >
      {showIcon && (
        <span
          className={cn(
            'inline-block rounded-full',
            size === 'sm' && 'h-1.5 w-1.5',
            size === 'md' && 'h-2 w-2',
            size === 'lg' && 'h-2 w-2',
            priority === 'URGENT' && 'bg-red-500 animate-pulse',
            priority === 'HIGH' && 'bg-orange-500',
            priority === 'MEDIUM' && 'bg-blue-500',
            priority === 'LOW' && 'bg-gray-500'
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}

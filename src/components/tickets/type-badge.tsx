/**
 * @file type-badge.tsx
 * @description Ticket type badge component with color coding
 * @layer UI/Component
 * @status IMPLEMENTED
 */

import * as React from 'react';
import {
  Video,
  VideoIcon,
  FileImage,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TICKET_TYPE_CONFIG } from '@/lib/constants';
import type { TicketType } from '@prisma/client';

interface TypeBadgeProps {
  type: TicketType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * Maps type to icon component
 */
const typeIcons: Record<TicketType, React.ElementType> = {
  CUSTOM_VIDEO: Video,
  VIDEO_CALL: VideoIcon,
  CONTENT_REQUEST: FileImage,
  GENERAL_INQUIRY: HelpCircle,
  URGENT_ALERT: AlertTriangle,
};

/**
 * Maps type color names to badge variants
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

export function TypeBadge({ type, size = 'sm', showIcon = true, className }: TypeBadgeProps) {
  const config = TICKET_TYPE_CONFIG[type];
  const Icon = typeIcons[type] || HelpCircle;

  if (!config) {
    return (
      <Badge variant="gray" className={className}>
        {type}
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
        <Icon
          className={cn(
            size === 'sm' && 'h-3 w-3',
            size === 'md' && 'h-3.5 w-3.5',
            size === 'lg' && 'h-4 w-4'
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}

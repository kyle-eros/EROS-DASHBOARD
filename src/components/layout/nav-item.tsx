/**
 * @file nav-item.tsx
 * @description Navigation item component for sidebar
 * @layer UI/Layout
 * @status IMPLEMENTED
 *
 * Props: href, icon, label, active, badge, collapsed
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
  collapsed?: boolean;
  onClick?: () => void;
}

export function NavItem({
  href,
  icon: Icon,
  label,
  active = false,
  badge,
  collapsed = false,
  onClick,
}: NavItemProps) {
  const content = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', collapsed && 'h-5 w-5')} />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge !== undefined && badge > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto h-5 min-w-5 px-1.5 text-xs"
            >
              {badge > 99 ? '99+' : badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  // Wrap in tooltip when collapsed
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {label}
            {badge !== undefined && badge > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                {badge > 99 ? '99+' : badge}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

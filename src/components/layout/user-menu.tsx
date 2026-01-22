/**
 * @file user-menu.tsx
 * @description User dropdown menu component for sidebar
 * @layer UI/Layout
 * @status IMPLEMENTED
 *
 * Features:
 * - User name and role display
 * - Profile link
 * - Settings link
 * - Sign out button
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogOut, Settings, User } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ROLE_CONFIG } from '@/lib/constants';
import type { UserRole } from '@/types/user.types';

interface UserMenuProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string | null;
  };
  collapsed?: boolean;
}

export function UserMenu({ user, collapsed = false }: UserMenuProps) {
  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline" size={collapsed ? 'icon' : 'default'} className="w-full">
          {collapsed ? <User className="h-4 w-4" /> : 'Sign In'}
        </Button>
      </Link>
    );
  }

  const roleConfig = ROLE_CONFIG[user.role];

  const trigger = (
    <Button
      variant="ghost"
      className={cn(
        'h-auto w-full justify-start gap-2 px-2 py-2',
        collapsed && 'justify-center px-0'
      )}
    >
      <Avatar className="h-8 w-8">
        {/* {user.image && <AvatarImage src={user.image} alt={user.name} />} */}
        <AvatarFallback className="text-xs">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="flex flex-col items-start text-left">
          <span className="text-sm font-medium truncate max-w-[140px]">
            {user.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {roleConfig?.label || user.role}
          </span>
        </div>
      )}
    </Button>
  );

  const menuContent = (
    <DropdownMenuContent
      side={collapsed ? 'right' : 'top'}
      align={collapsed ? 'start' : 'center'}
      className="w-56"
    >
      <DropdownMenuLabel>
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs leading-none text-muted-foreground">
            {user.email}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex w-full cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex w-full cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive focus:text-destructive cursor-pointer"
        onClick={() => {
          // Handle sign out - would call signOut() from next-auth
          window.location.href = '/api/auth/signout';
        }}
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  // Wrap collapsed menu in tooltip
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <DropdownMenu>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {roleConfig?.label || user.role}
              </p>
            </TooltipContent>
            {menuContent}
          </DropdownMenu>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      {menuContent}
    </DropdownMenu>
  );
}

/**
 * @file header.tsx
 * @description Top header bar component
 * @layer UI/Layout
 * @status IMPLEMENTED
 *
 * Features:
 * - Page title display
 * - Search input (optional)
 * - Notification bell with unread count
 * - User avatar dropdown
 */

'use client';

import * as React from 'react';
import { Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import type { UserRole } from '@/types/user.types';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string | null;
  };
  notificationCount?: number;
  actions?: React.ReactNode;
}

export function Header({
  title,
  showSearch = false,
  onSearch,
  searchPlaceholder = 'Search...',
  user,
  notificationCount = 0,
  actions,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      {/* Page Title */}
      {title && (
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <form
          onSubmit={handleSearchSubmit}
          className={cn('flex-1', !title && 'max-w-md')}
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-8"
            />
          </div>
        </form>
      )}

      {/* Spacer when no title or search */}
      {!title && !showSearch && <div className="flex-1" />}

      {/* Custom Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {notificationCount > 0 && (
              <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs">
                Mark all as read
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notificationCount === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            <div className="max-h-80 overflow-auto">
              {/* Placeholder notification items */}
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <span className="font-medium">New ticket submitted</span>
                <span className="text-xs text-muted-foreground">
                  Custom video request from Creator A
                </span>
                <span className="text-xs text-muted-foreground">2 minutes ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <span className="font-medium">Ticket status updated</span>
                <span className="text-xs text-muted-foreground">
                  Ticket CVR-2025-00012 moved to In Progress
                </span>
                <span className="text-xs text-muted-foreground">15 minutes ago</span>
              </DropdownMenuItem>
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center text-sm">
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Avatar (compact version for header) */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                {/* {user.image && <AvatarImage src={user.image} alt={user.name} />} */}
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}

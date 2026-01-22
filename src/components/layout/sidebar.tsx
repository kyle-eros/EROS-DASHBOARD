/**
 * @file sidebar.tsx
 * @description Collapsible sidebar navigation component
 * @layer UI/Layout
 * @status IMPLEMENTED
 *
 * Features:
 * - Collapsible on desktop
 * - Slide-out drawer on mobile
 * - Active state highlighting
 * - User role-based navigation
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  Users,
  UserCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NavItem } from './nav-item';
import { UserMenu } from './user-menu';
import { useUIStore } from '@/stores/ui.store';
import { ROLE_CONFIG, hasPermission } from '@/lib/constants';
import type { UserRole } from '@/types/user.types';

interface SidebarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string | null;
  };
}

interface NavItemConfig {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  requiredPermission?: string;
}

const mainNavItems: NavItemConfig[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/tickets',
    label: 'Tickets',
    icon: Ticket,
  },
  {
    href: '/creators',
    label: 'Creators',
    icon: UserCircle,
    requiredPermission: 'creators:read',
  },
  {
    href: '/users',
    label: 'Users',
    icon: Users,
    requiredPermission: 'users:read_all',
  },
];

const bottomNavItems: NavItemConfig[] = [
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    requiredPermission: 'settings:read',
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } =
    useUIStore();

  // Filter nav items based on user permissions
  const filterNavItems = (items: NavItemConfig[]) => {
    if (!user) return items;
    return items.filter((item) => {
      if (!item.requiredPermission) return true;
      return hasPermission(user.role, item.requiredPermission as never);
    });
  };

  const filteredMainNav = filterNavItems(mainNavItems);
  const filteredBottomNav = filterNavItems(bottomNavItems);

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div
        className={cn(
          'flex h-16 items-center border-b px-4',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            E
          </div>
          {!sidebarCollapsed && (
            <span className="text-xl font-bold">EROS</span>
          )}
        </Link>
        {!sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1 py-4">
          {filteredMainNav.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              collapsed={sidebarCollapsed}
              badge={item.badge}
            />
          ))}
        </nav>

        <Separator className="my-2" />

        <nav className="flex flex-col gap-1 py-2">
          {filteredBottomNav.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* User Menu at Bottom */}
      <div className="border-t p-3">
        <UserMenu user={user} collapsed={sidebarCollapsed} />
      </div>

      {/* Expand button when collapsed */}
      {sidebarCollapsed && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card transition-transform duration-300 lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r bg-card transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

/**
 * @file page.tsx
 * @description User management page with search and role filter
 * @layer UI
 * @status IMPLEMENTED
 *
 * Server Component that lists all users.
 * Only accessible by MANAGER and SUPER_ADMIN roles.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { userService } from '@/services';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UrlPagination, EmptyState, LoadingSpinner } from '@/components/shared';
import { Users, Search, Plus, UserCircle } from 'lucide-react';
import { hasPermission, ROLE_CONFIG } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { UserRole } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Users',
  description: 'Manage system users and permissions',
};

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    role?: string;
    isActive?: string;
  }>;
}

async function UserListContent({ searchParams }: { searchParams: UsersPageProps['searchParams'] }) {
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;

  // Resolve searchParams promise (Next.js 15)
  const params = await searchParams;

  // Build filter from search params
  const filter = {
    page: params.page ? parseInt(params.page) : 1,
    pageSize: params.pageSize ? parseInt(params.pageSize) : 20,
    search: params.search || undefined,
    role: params.role as UserRole | undefined,
    isActive: params.isActive === 'false' ? false : params.isActive === 'true' ? true : undefined,
  };

  // Fetch users
  const { users, total, page, pageSize } = await userService.list(filter);

  const canCreateUsers = hasPermission(userRole, 'users:create');

  // Role badge colors
  const roleBadgeVariant: Record<UserRole, 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray'> = {
    SUPER_ADMIN: 'red',
    MANAGER: 'purple',
    SCHEDULER: 'blue',
    CHATTER: 'green',
    CREATOR: 'yellow',
  };

  return (
    <>
      {/* Filters */}
      <form action="/users" method="GET" className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="search"
            defaultValue={params.search}
            placeholder="Search by name or email..."
            className="pl-8"
          />
        </div>
        <Select name="role" defaultValue={params.role || 'all'}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(ROLE_CONFIG).map(([role, config]) => (
              <SelectItem key={role} value={role}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      {/* Results */}
      {users.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="No users found"
          description={
            filter.search || filter.role
              ? 'Try adjusting your filters to find what you are looking for.'
              : 'Get started by adding your first user.'
          }
          action={
            canCreateUsers ? (
              <Button asChild>
                <Link href="/users/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* User List */}
          <div className="space-y-3">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                className="block"
              >
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        {/* {user.image && (
                          <AvatarImage src={user.image} alt={user.name || ''} />
                        )} */}
                        <AvatarFallback>
                          {getInitials(user.name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{user.name || 'No name'}</h3>
                          <Badge variant={roleBadgeVariant[user.role]}>
                            {ROLE_CONFIG[user.role]?.label || user.role}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="gray">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</p>
                      {user.lastLoginAt && (
                        <p>Last login {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div className="mt-6">
              <UrlPagination
                page={page}
                pageSize={pageSize}
                total={total}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;

  // Check permission - only MANAGER and SUPER_ADMIN can access
  if (!hasPermission(userRole, 'users:read_all')) {
    redirect('/dashboard');
  }

  const canCreateUsers = hasPermission(userRole, 'users:create');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage system users and permissions
          </p>
        </div>
        {canCreateUsers && (
          <Button asChild>
            <Link href="/users/new">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        )}
      </div>

      {/* User List with Suspense */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <UserListContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

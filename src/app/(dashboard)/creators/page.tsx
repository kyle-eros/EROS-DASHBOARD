/**
 * @file page.tsx
 * @description Creator list page with search and pagination
 * @layer UI
 * @status IMPLEMENTED
 *
 * Server Component that lists all creators.
 * Supports search by stage name and pagination.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { creatorService } from '@/services';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UrlPagination, EmptyState, LoadingSpinner } from '@/components/shared';
import { Users, Search, Plus, UserCircle } from 'lucide-react';
import { hasPermission } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import type { UserRole } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Creators',
  description: 'Manage content creators',
};

interface CreatorsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    isActive?: string;
  }>;
}

async function CreatorListContent({ searchParams }: { searchParams: CreatorsPageProps['searchParams'] }) {
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;

  // Resolve searchParams promise (Next.js 15)
  const params = await searchParams;

  // Build filter from search params
  const filter = {
    page: params.page ? parseInt(params.page) : 1,
    pageSize: params.pageSize ? parseInt(params.pageSize) : 20,
    search: params.search || undefined,
    isActive: params.isActive === 'false' ? false : params.isActive === 'true' ? true : undefined,
  };

  // Fetch creators
  const { creators, total, page, pageSize } = await creatorService.list(filter);

  const canCreateCreators = hasPermission(userRole, 'creators:create');

  return (
    <>
      {/* Search */}
      <form action="/creators" method="GET" className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="search"
            defaultValue={params.search}
            placeholder="Search by stage name..."
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {/* Results */}
      {creators.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="No creators found"
          description={
            filter.search
              ? 'Try adjusting your search to find what you are looking for.'
              : 'Get started by adding your first creator.'
          }
          action={
            canCreateCreators ? (
              <Button asChild>
                <Link href="/creators/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Creator
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Creator Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <Link
                key={creator.id}
                href={`/creators/${creator.id}`}
                className="block"
              >
                <Card className="hover:bg-muted/50 transition-colors h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        {/* {creator.user.image && (
                          <AvatarImage src={creator.user.image} alt={creator.stageName} />
                        )} */}
                        <AvatarFallback>
                          {getInitials(creator.stageName || creator.user.name || 'C')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{creator.stageName}</h3>
                          <Badge variant={creator.isActive ? 'green' : 'gray'}>
                            {creator.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {creator.user.name || creator.user.email}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {creator.platforms.slice(0, 3).map((platform) => (
                            <Badge key={platform} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                          {creator.platforms.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{creator.platforms.length - 3}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{creator._count.tickets} tickets</span>
                          <span>{creator._count.assignments} assigned users</span>
                        </div>
                      </div>
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

export default async function CreatorsPage({ searchParams }: CreatorsPageProps) {
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;

  // Check permission
  if (!hasPermission(userRole, 'creators:read')) {
    redirect('/dashboard');
  }

  const canCreateCreators = hasPermission(userRole, 'creators:create');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creators</h1>
          <p className="text-muted-foreground">
            Manage content creators and their profiles
          </p>
        </div>
        {canCreateCreators && (
          <Button asChild>
            <Link href="/creators/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Creator
            </Link>
          </Button>
        )}
      </div>

      {/* Creator List with Suspense */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <CreatorListContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

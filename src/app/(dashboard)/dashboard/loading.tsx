/**
 * @file loading.tsx
 * @description Loading state for dashboard page
 * @layer UI
 * @status IMPLEMENTED
 */

import { LoadingSpinner } from '@/components/shared';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="h-8 w-36 bg-muted rounded animate-pulse" />
          <div className="mt-2 h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse mt-2" />
          </div>
        ))}
      </div>

      {/* Content Loading */}
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
}

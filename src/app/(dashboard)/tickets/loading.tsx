/**
 * @file loading.tsx
 * @description Loading state for tickets pages
 * @layer UI
 * @status IMPLEMENTED
 */

import { LoadingSpinner } from '@/components/shared';

export default function TicketsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="mt-2 h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-4">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>

      {/* Content Loading */}
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
}

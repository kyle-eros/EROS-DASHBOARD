/**
 * @file loading.tsx
 * @description Loading state for settings page
 * @layer UI
 * @status IMPLEMENTED
 */

import { LoadingSpinner } from '@/components/shared';

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-28 bg-muted rounded animate-pulse" />
        <div className="mt-2 h-4 w-56 bg-muted rounded animate-pulse" />
      </div>

      {/* Content Loading */}
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
}

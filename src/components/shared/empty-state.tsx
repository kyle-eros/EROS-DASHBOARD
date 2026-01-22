/**
 * @file empty-state.tsx
 * @description Empty content state component
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Icon support
 * - Title and description
 * - Optional action button
 * - Used when lists have no items
 */

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50',
        className
      )}
    >
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/**
 * Pre-configured empty state for search results
 */
export function NoSearchResults({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      title="No results found"
      description={`No results found for "${query}". Try adjusting your search terms.`}
      action={
        onClear && (
          <Button variant="outline" onClick={onClear}>
            Clear search
          </Button>
        )
      }
    />
  );
}

/**
 * Pre-configured empty state for filtered lists
 */
export function NoFilteredResults({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      title="No results match your filters"
      description="Try adjusting or clearing your filters to see more results."
      action={
        onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        )
      }
    />
  );
}

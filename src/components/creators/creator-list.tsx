/**
 * @file creator-list.tsx
 * @description Creator list component
 * @layer UI/Component
 * @status PLACEHOLDER - Implement with data-table
 */

'use client';

import type { CreatorWithStats } from '@/types/creator.types';

interface CreatorListProps {
  creators: CreatorWithStats[];
  isLoading?: boolean;
}

export function CreatorList({ creators, isLoading }: CreatorListProps) {
  if (isLoading) {
    return <div className="p-8 text-center">Loading creators...</div>;
  }

  if (creators.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No creators found</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {creators.map((creator) => (
        <div key={creator.id} className="p-4">
          {creator.name}
        </div>
      ))}
    </div>
  );
}

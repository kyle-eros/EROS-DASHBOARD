/**
 * @file creator-card.tsx
 * @description Creator card component
 * @layer UI/Component
 * @status PLACEHOLDER - Implement card design
 */

import Link from 'next/link';
import type { CreatorWithStats } from '@/types/creator.types';

interface CreatorCardProps {
  creator: CreatorWithStats;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Link
      href={`/creators/${creator.id}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div>
          <h3 className="font-medium">{creator.name}</h3>
          {creator.stageName && (
            <p className="text-sm text-muted-foreground">{creator.stageName}</p>
          )}
        </div>
      </div>
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <span>{creator._count.tickets} tickets</span>
        <span>{creator.openTicketCount} open</span>
      </div>
    </Link>
  );
}

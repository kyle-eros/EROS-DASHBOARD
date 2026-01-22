/**
 * @file user-card.tsx
 * @description User card component
 * @layer UI/Component
 * @status PLACEHOLDER - Implement card design
 */

import type { UserWithStats } from '@/types/user.types';
import { USER_ROLE_DISPLAY } from '@/lib/constants';

interface UserCardProps {
  user: UserWithStats;
}

export function UserCard({ user }: UserCardProps) {
  const roleDisplay = USER_ROLE_DISPLAY[user.role];

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div>
          <h3 className="font-medium">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm">{roleDisplay?.label || user.role}</span>
        <p className="text-xs text-muted-foreground">
          {user._count.assignedTickets} assigned tickets
        </p>
      </div>
    </div>
  );
}

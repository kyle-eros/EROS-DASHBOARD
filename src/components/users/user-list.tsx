/**
 * @file user-list.tsx
 * @description User list component
 * @layer UI/Component
 * @status PLACEHOLDER - Implement with data-table
 */

'use client';

import type { UserWithStats } from '@/types/user.types';

interface UserListProps {
  users: UserWithStats[];
  isLoading?: boolean;
}

export function UserList({ users, isLoading }: UserListProps) {
  if (isLoading) {
    return <div className="p-8 text-center">Loading users...</div>;
  }

  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {users.map((user) => (
        <div key={user.id} className="p-4">
          {user.name}
        </div>
      ))}
    </div>
  );
}

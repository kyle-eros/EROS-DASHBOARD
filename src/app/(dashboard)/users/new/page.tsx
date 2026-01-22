/**
 * @file page.tsx
 * @description Create new user page
 * @layer UI
 * @status IMPLEMENTED
 *
 * Server Component that renders the user creation form.
 * Only accessible by SUPER_ADMIN role.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { UserForm } from '@/components/users/user-form';
import { createUser } from '@/actions/user.actions';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { hasPermission } from '@/lib/constants';
import type { UserRole } from '@prisma/client';

export const metadata: Metadata = {
  title: 'New User',
  description: 'Create a new system user',
};

export default async function NewUserPage() {
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;

  // Check permission - only SUPER_ADMIN can create users
  if (!hasPermission(userRole, 'users:create')) {
    redirect('/users');
  }

  // Handle form submission via server action
  async function handleSubmit(data: any) {
    'use server';
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('role', data.role);
    if (data.password) formData.append('password', data.password);

    const result = await createUser(formData);
    if (result.success) {
      return { success: true, userId: result.data.id };
    }
    return { success: false, error: result.error };
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/users">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Users
        </Link>
      </Button>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New User</h1>
        <p className="text-muted-foreground">
          Add a new user to the system
        </p>
      </div>

      {/* User Form */}
      <UserForm onSubmit={handleSubmit} />
    </div>
  );
}

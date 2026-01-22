/**
 * @file layout.tsx
 * @description Layout for dashboard pages (protected routes)
 * @layer UI
 * @status IMPLEMENTED
 *
 * Dashboard layout includes:
 * - Collapsible sidebar navigation
 * - Top header with user menu
 * - Main content area
 * - Authentication protection
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar, Header } from '@/components/layout';
import type { UserRole } from '@prisma/client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Prepare user data for components
  const user = {
    id: session.user.id,
    name: session.user.name || session.user.email || 'User',
    email: session.user.email || '',
    role: (session.user.role || 'CHATTER') as UserRole,
    // image: session.user.image,
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <Header user={user} notificationCount={0} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/30 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

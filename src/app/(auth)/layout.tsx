/**
 * @file layout.tsx
 * @description Layout for authentication pages (login, register)
 * @layer UI
 * @status IMPLEMENTED
 *
 * Auth pages use a minimal centered layout without navigation.
 * Redirects authenticated users to dashboard.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check - redirect if already authenticated
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 px-4">
      {/* Logo / Branding */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">EROS</h1>
        <p className="text-sm text-muted-foreground">Ticketing System</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} EROS Agency. All rights reserved.
      </p>
    </div>
  );
}

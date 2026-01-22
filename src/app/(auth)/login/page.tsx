/**
 * @file page.tsx
 * @description Login page
 * @layer UI
 * @status IMPLEMENTED
 *
 * Handles user authentication with email/password.
 * Uses LoginForm component which calls the login server action.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your EROS Ticketing System account',
};

export default function LoginPage() {
  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-semibold">Sign In</h2>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Enter your credentials to access your account
      </p>

      <LoginForm />

      {/* Links */}
      <div className="mt-6 text-center text-sm">
        <Link href="/register" className="text-primary hover:underline">
          Don&apos;t have an account? Sign up
        </Link>
      </div>
    </div>
  );
}

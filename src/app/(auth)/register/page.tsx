/**
 * @file page.tsx
 * @description Registration page
 * @layer UI
 * @status IMPLEMENTED
 *
 * Handles new user registration.
 * Uses RegisterForm component which calls the register server action.
 * Note: In production, registration may be disabled (admin-only user creation).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a new EROS Ticketing System account',
};

export default function RegisterPage() {
  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-semibold">Create Account</h2>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Enter your details to create a new account
      </p>

      <RegisterForm />

      {/* Links */}
      <div className="mt-6 text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}

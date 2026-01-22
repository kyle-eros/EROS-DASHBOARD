/**
 * @file auth.ts
 * @description NextAuth.js v5 (Auth.js) handlers and utilities
 * @layer Infrastructure
 * @status IMPLEMENTED
 *
 * This file exports the NextAuth handlers and auth utilities.
 * Uses the configuration from auth-options.ts.
 *
 * Exports:
 * - handlers: { GET, POST } - Route handlers for /api/auth/*
 * - signIn: Function to programmatically sign in a user
 * - signOut: Function to programmatically sign out a user
 * - auth: Function to get the current session (server-side)
 *
 * Usage in Server Components:
 * ```typescript
 * import { auth } from '@/lib/auth';
 *
 * export default async function Page() {
 *   const session = await auth();
 *   if (!session?.user) {
 *     redirect('/login');
 *   }
 *   // session.user.id, session.user.role available
 * }
 * ```
 *
 * Usage in API Routes:
 * ```typescript
 * import { auth } from '@/lib/auth';
 *
 * export async function GET(request: Request) {
 *   const session = await auth();
 *   if (!session) {
 *     return Response.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // Authenticated request handling
 * }
 * ```
 */

import NextAuth from 'next-auth';
import { authOptions, type ExtendedSession, type ExtendedJWT, type ExtendedUser } from './auth-options';

/**
 * NextAuth.js v5 exports
 *
 * handlers: Route handlers for /api/auth/[...nextauth]/route.ts
 * signIn: Programmatic sign in function
 * signOut: Programmatic sign out function
 * auth: Get current session (server-side)
 */
export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);

/**
 * Alias for auth() for semantic clarity
 * Use this in Server Components to get the session
 *
 * @example
 * ```typescript
 * const session = await getServerSession();
 * ```
 */
export const getServerSession = auth;

/**
 * Re-export types for convenience
 */
export type { ExtendedSession, ExtendedJWT, ExtendedUser };

/**
 * Re-export authOptions for middleware
 */
export { authOptions } from './auth-options';

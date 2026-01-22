/**
 * @file auth.config.ts
 * @description Edge-compatible NextAuth configuration
 * @layer Infrastructure
 * @status IMPLEMENTED
 *
 * This file contains the NextAuth configuration that is safe to use in
 * Edge runtimes (like Middleware). It must NOT import Node.js-only modules
 * or database clients (Prisma).
 */

import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@prisma/client';

export const authConfig = {
  /**
   * Session configuration
   * Using JWT strategy for stateless authentication
   */
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  /**
   * Custom pages for authentication flow
   */
  pages: {
    signIn: '/login',
    error: '/login', // Redirect auth errors to login page
  },

  /**
   * Callbacks for customizing JWT and session behavior
   */
  callbacks: {
    /**
     * JWT callback - called when JWT is created or updated
     * Adds user id and role to the token
     */
    async jwt({ token, user }) {
      // On initial sign in, add user data to token
      if (user) {
        token.id = user.id ?? '';
        token.role = (user as any).role as UserRole;
      }
      return token;
    },

    /**
     * Session callback - called when session is checked
     * Exposes user id and role on session.user
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },

    /**
     * Authorized callback - used by middleware for route protection
     * Determines if user can access a route
     */
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // Protected route patterns
      const protectedPatterns = [
        '/dashboard',
        '/tickets',
        '/creators',
        '/users',
        '/settings',
      ];

      // Check if current path matches any protected pattern
      const isProtectedRoute = protectedPatterns.some((pattern) =>
        nextUrl.pathname.startsWith(pattern)
      );

      // Redirect to login if accessing protected route while not logged in
      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      // Redirect to dashboard if accessing login while already logged in
      const isAuthRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/register';
      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
  },

  /**
   * Initialize with empty providers array
   * Providers are added in auth-options.ts for server-side usage
   */
  providers: [],

  /**
   * Enable debug messages in development
   */
  debug: process.env.NODE_ENV === 'development',

  /**
   * Trust host header in production (required for proxies)
   */
  trustHost: true,
} satisfies NextAuthConfig;

/**
 * @file auth-options.ts
 * @description NextAuth.js v5 (Auth.js) configuration options
 * @layer Infrastructure
 * @status IMPLEMENTED
 *
 * This file contains the NextAuth configuration, separated from auth.ts
 * to allow importing in middleware without pulling in the full NextAuth handlers.
 * This is necessary because middleware runs in Edge runtime and has module restrictions.
 *
 * Authentication Flow:
 * 1. User submits email/password via login form
 * 2. Credentials provider validates and looks up user by email
 * 3. Password is verified against bcrypt hash
 * 4. User object returned with id, email, name, role
 * 5. JWT callback adds id and role to token
 * 6. Session callback exposes id and role on session.user
 */

import type { NextAuthConfig, User as NextAuthUser, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import type { UserRole } from '@prisma/client';

/**
 * Extended User type that includes role for JWT/Session
 */
interface ExtendedUser extends NextAuthUser {
  role: UserRole;
}

/**
 * Extended JWT type to include user id and role
 */
interface ExtendedJWT extends JWT {
  id: string;
  role: UserRole;
}

/**
 * Extended Session type to include user id and role
 */
interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

/**
 * Credentials schema for type-safe validation
 */
interface CredentialsInput {
  email: string;
  password: string;
}

/**
 * NextAuth.js v5 configuration options
 *
 * Key configuration decisions:
 * - JWT strategy: No database sessions, tokens contain user info
 * - 30-day session lifetime: Balance between security and UX
 * - Custom sign-in page: Redirects to /login
 * - Debug mode: Only enabled in development
 */
export const authOptions: NextAuthConfig = {
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
   * Authentication providers
   */
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'your@email.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },

      /**
       * Authorize function - validates credentials and returns user
       *
       * @param credentials - Email and password from login form
       * @returns User object if valid, null if invalid
       */
      async authorize(credentials): Promise<ExtendedUser | null> {
        // Type guard for credentials
        if (!credentials?.email || !credentials?.password) {
          console.error('[Auth] Missing email or password');
          return null;
        }

        const { email, password } = credentials as CredentialsInput;

        try {
          // Find user by email (case-insensitive)
          const user = await prisma.user.findUnique({
            where: {
              email: email.toLowerCase().trim(),
            },
            select: {
              id: true,
              email: true,
              name: true,
              passwordHash: true,
              role: true,
              isActive: true,
            },
          });

          // User not found
          if (!user) {
            console.error('[Auth] User not found:', email);
            return null;
          }

          // User is deactivated
          if (!user.isActive) {
            console.error('[Auth] User account is deactivated:', email);
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

          if (!isPasswordValid) {
            console.error('[Auth] Invalid password for user:', email);
            return null;
          }

          // Update last login timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          // Return user object (without password hash)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('[Auth] Error during authentication:', error);
          return null;
        }
      },
    }),
  ],

  /**
   * Callbacks for customizing JWT and session behavior
   */
  callbacks: {
    /**
     * JWT callback - called when JWT is created or updated
     * Adds user id and role to the token
     *
     * @param token - The JWT token
     * @param user - User object (only present on sign in)
     * @returns Extended JWT with id and role
     */
    async jwt({ token, user }): Promise<ExtendedJWT> {
      // On initial sign in, add user data to token
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id ?? '';
        token.role = extendedUser.role;
      }
      return token as ExtendedJWT;
    },

    /**
     * Session callback - called when session is checked
     * Exposes user id and role on session.user
     *
     * @param session - The session object
     * @param token - The JWT token
     * @returns Extended session with user id and role
     */
    async session({ session, token }): Promise<ExtendedSession> {
      const extendedToken = token as ExtendedJWT;

      return {
        ...session,
        user: {
          ...session.user,
          id: extendedToken.id,
          role: extendedToken.role,
        },
      } as ExtendedSession;
    },

    /**
     * Authorized callback - used by middleware for route protection
     * Determines if user can access a route
     *
     * @param auth - Current auth state
     * @param request - Incoming request
     * @returns true if authorized, false to redirect to signIn
     */
    async authorized({ auth, request: { nextUrl } }): Promise<boolean> {
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
        return Response.redirect(new URL('/dashboard', nextUrl)) as unknown as boolean;
      }

      return true;
    },
  },

  /**
   * Event handlers for logging and side effects
   */
  events: {
    async signIn({ user }) {
      console.log('[Auth] User signed in:', user.email);
    },
    async signOut(message) {
      // signOut can receive either { session } or { token } depending on strategy
      if ('token' in message) {
        console.log('[Auth] User signed out:', (message.token as ExtendedJWT)?.id);
      }
    },
  },

  /**
   * Enable debug messages in development
   */
  debug: process.env.NODE_ENV === 'development',

  /**
   * Trust host header in production (required for proxies)
   */
  trustHost: true,
};

/**
 * Export types for use in other files
 */
export type { ExtendedUser, ExtendedJWT, ExtendedSession };

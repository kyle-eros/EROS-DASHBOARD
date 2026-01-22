/**
 * @file auth.types.ts
 * @description TypeScript type definitions for authentication
 * @layer Types
 * @status PLACEHOLDER - NextAuth type augmentation
 *
 * Extends NextAuth types to include custom user properties.
 */

import type { UserRole } from './user.types';
import type { DefaultSession } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

/**
 * Extend the built-in session types
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
  }
}

/**
 * Extend the JWT type
 */
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

/**
 * Auth state for client-side
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
}

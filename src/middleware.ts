/**
 * @file middleware.ts
 * @description NextAuth.js middleware for route protection
 * @layer Infrastructure
 * @status IMPLEMENTED
 *
 * Protects routes and handles authentication redirects.
 * Uses edge-compatible authConfig to avoid importing PrismaClient.
 */

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

/**
 * Use authConfig for edge compatibility (no Prisma imports)
 */
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  // Match all routes except static files and API routes that don't need auth
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - api/health (health check)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
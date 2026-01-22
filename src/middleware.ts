/**
 * @file middleware.ts
 * @description NextAuth.js middleware for route protection
 * @layer Infrastructure
 * @status PLACEHOLDER - Auth middleware configured
 *
 * Protects routes and handles authentication redirects.
 */

import { auth } from '@/lib/auth';

export default auth;

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
     * - public folder
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|images).*)',
  ],
};

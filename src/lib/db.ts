/**
 * @file db.ts
 * @description Prisma client singleton for database access
 * @layer Data
 * @status IMPLEMENTED
 *
 * This file provides a singleton instance of the Prisma client to prevent
 * multiple instances during hot reloading in development. Uses the recommended
 * pattern for Next.js applications to avoid connection pool exhaustion.
 *
 * Usage:
 * ```typescript
 * import { prisma } from '@/lib/db';
 *
 * const users = await prisma.user.findMany();
 * ```
 */

import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient singleton instance type for global storage
 */
type PrismaClientSingleton = PrismaClient;

/**
 * Extend globalThis with prisma property for singleton storage
 * This prevents multiple Prisma Client instances in development
 * when the module is hot-reloaded
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

/**
 * Create Prisma client with appropriate logging configuration
 * - Development: Log queries, errors, and warnings for debugging
 * - Production: Log only errors to avoid performance overhead
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'stdout', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
  });
}

/**
 * Prisma client singleton instance
 * Reuses existing instance in development to prevent connection exhaustion
 * Creates new instance if none exists
 */
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

/**
 * Store Prisma client in globalThis for development hot-reloading
 * Only in non-production to ensure fresh instances in production
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Export the Prisma client type for use in services
 */
export type { PrismaClient };

/**
 * Default export for convenience
 */
export default prisma;

# EROS Ticketing System - Claude Instructions

## Project Overview

This is the **EROS Ticketing System**, a Next.js 15 monolith application for managing content creator agency tickets. It replaces chaotic chat-based workflows with structured, auditable ticket management.

## Project Mantra

**"KEEP EVERYTHING ROBUST, FOCUSED, & SIMPLE!"**

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.x (App Router) |
| Language | TypeScript 5.x (strict mode) |
| Database | PostgreSQL 16 + Prisma 6.x |
| Auth | NextAuth.js 5.x (Auth.js) |
| UI | Shadcn/UI + Radix + Tailwind 4.x |
| Server State | TanStack Query |
| Client State | Zustand |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Playwright |

## Architecture

### Service Layer Pattern

Business logic lives in `/src/services/`. Services are called by Server Actions, never directly from components.

```
Component → Server Action → Service → Prisma → Database
```

### Key Directories

- `/src/app/` - Next.js App Router pages
- `/src/components/` - React components (UI layer only)
- `/src/services/` - Business logic (CRITICAL)
- `/src/actions/` - Server Actions (form handling)
- `/src/schemas/` - Zod validation schemas
- `/src/types/` - TypeScript type definitions
- `/src/hooks/` - Custom React hooks
- `/src/stores/` - Zustand stores

## Coding Conventions

### Files

- Components: `kebab-case.tsx`
- Types: `kebab-case.types.ts`
- Services: `kebab-case.service.ts`
- Actions: `kebab-case.actions.ts`

### All files must have a header comment:

```typescript
/**
 * @file filename.ts
 * @description What this file does
 * @layer Service | Action | UI | Schema | etc.
 * @status PLACEHOLDER | IMPLEMENTED
 */
```

### Imports use path aliases:

```typescript
import { prisma } from '@/lib/db';
import type { Ticket } from '@/types/ticket.types';
import { createTicketSchema } from '@/schemas/ticket.schema';
```

## Current Status

The directory structure and placeholder files are complete. Next steps:

1. **Create Prisma schema** (`prisma/schema.prisma`)
2. **Implement services** with actual Prisma queries
3. **Install Shadcn/UI components** via CLI
4. **Connect forms** to Server Actions
5. **Add TanStack Query** for data fetching

## Important Notes

- Use `python3` not `python` for Python commands
- All file paths in responses must be absolute
- Services contain business logic; components are UI only
- Server Actions handle form validation and auth checks
- Prisma is the ONLY database access layer

## Key Files to Know

- `/src/lib/db.ts` - Prisma client singleton
- `/src/lib/auth.ts` - NextAuth configuration
- `/src/lib/utils.ts` - Utility functions (cn, formatDate, etc.)
- `/src/lib/constants.ts` - App-wide constants

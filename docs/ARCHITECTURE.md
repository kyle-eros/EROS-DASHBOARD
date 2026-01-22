# EROS Ticketing System - Architecture

## Overview

The EROS Ticketing System is a Next.js 15 monolith application designed to replace chaotic chat-based workflows with structured, auditable ticket management for content creator agencies.

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

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group (login, register)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Shadcn base components
│   ├── layout/           # Layout components
│   ├── tickets/          # Ticket feature components
│   ├── creators/         # Creator feature components
│   ├── users/            # User feature components
│   └── shared/           # Shared/common components
├── lib/                   # Core utilities
├── services/             # Business logic layer
├── actions/              # Server Actions
├── schemas/              # Zod validation schemas
├── types/                # TypeScript type definitions
├── hooks/                # Custom React hooks
└── stores/               # Zustand stores
```

## Architectural Principles

### 1. Service Layer Pattern

Business logic is isolated in the `/services` directory, separate from:
- API routes (HTTP concerns)
- Server Actions (form handling)
- Components (UI concerns)

```
User Action → Server Action → Service → Prisma → Database
                    ↓
              Revalidate Cache
```

### 2. Colocation

Related files live together. Each feature has its components, types, and schemas nearby.

### 3. Type Safety

End-to-end types from database to UI:
- Prisma generates types from schema
- Zod schemas validate at boundaries
- TypeScript enforces throughout

### 4. Separation of Concerns

Clear boundaries between layers:
- **UI Components**: Presentation only
- **Server Actions**: Form handling, auth checks, cache revalidation
- **Services**: Business logic, validation rules
- **Prisma**: Data access

## Data Flow

```
1. User interacts with Component
2. Component calls Server Action (or hook → API)
3. Server Action validates with Zod schema
4. Server Action calls Service
5. Service applies business rules
6. Service calls Prisma
7. Prisma executes query
8. Response flows back up
9. Cache revalidated as needed
```

## Authentication Flow

1. User submits credentials
2. NextAuth handles validation
3. JWT token created with user info
4. Session stored in cookie
5. Middleware protects routes
6. Session available in Server Components

## State Management

- **Server State**: TanStack Query (caching, revalidation)
- **Client State**: Zustand (UI state, filters)
- **Form State**: React Hook Form (validation, submission)
- **URL State**: Next.js searchParams (filters, pagination)

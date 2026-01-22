# EROS Ticketing System - Development Guide

## Getting Started

See [DEPLOYMENT.md](./DEPLOYMENT.md) for initial setup instructions.

## Development Workflow

### Running the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Management

```bash
# Generate Prisma client after schema changes
pnpm db:generate

# Create and apply a migration
pnpm db:migrate

# Open Prisma Studio (database GUI)
pnpm db:studio

# Push schema changes without migration (dev only)
pnpm db:push
```

### Code Quality

```bash
# Run ESLint
pnpm lint

# Fix ESLint issues
pnpm lint:fix

# Format with Prettier
pnpm format

# Check formatting
pnpm format:check
```

### Testing

```bash
# Run unit/integration tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## Code Conventions

### File Naming

- Components: `kebab-case.tsx` (e.g., `ticket-card.tsx`)
- Types: `kebab-case.types.ts` (e.g., `ticket.types.ts`)
- Schemas: `kebab-case.schema.ts` (e.g., `ticket.schema.ts`)
- Services: `kebab-case.service.ts` (e.g., `ticket.service.ts`)
- Actions: `kebab-case.actions.ts` (e.g., `ticket.actions.ts`)

### Component Structure

```tsx
/**
 * @file component-name.tsx
 * @description Brief description
 * @layer UI/Component
 */

'use client'; // Only if needed

import { ... } from 'react';
import { ... } from '@/lib/utils';
import type { ... } from '@/types';

interface ComponentProps {
  // Props
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Implementation
}
```

### Service Structure

```typescript
/**
 * @file entity.service.ts
 * @description Business logic for entity operations
 * @layer Service
 */

import { prisma } from '@/lib/db';
import type { ... } from '@/types';

export async function getEntityById(id: string): Promise<Entity | null> {
  return prisma.entity.findUnique({ where: { id } });
}
```

## Adding New Features

1. **Define Types** in `/src/types/`
2. **Create Schema** in `/src/schemas/`
3. **Implement Service** in `/src/services/`
4. **Create Actions** in `/src/actions/`
5. **Build Components** in `/src/components/`
6. **Add Pages** in `/src/app/`
7. **Write Tests** in `/tests/`

## Shadcn/UI Components

Add components with the CLI:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

Components are added to `/src/components/ui/`.

# EROS Ticketing System

A structured ticket management system for content creator agencies, replacing chaotic chat-based workflows with auditable, organized ticket tracking.

## Quick Start

```bash
# Start database
docker-compose up -d

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Run migrations
pnpm db:migrate

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL 16 + Prisma 6
- **Auth**: NextAuth.js 5
- **UI**: Shadcn/UI + Tailwind CSS 4
- **State**: TanStack Query + Zustand
- **Testing**: Vitest + Playwright

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API](./docs/API.md)
- [Development](./docs/DEVELOPMENT.md)
- [Deployment](./docs/DEPLOYMENT.md)

## Project Structure

```
src/
├── app/          # Next.js pages and API routes
├── components/   # React components
├── lib/          # Core utilities
├── services/     # Business logic
├── actions/      # Server Actions
├── schemas/      # Zod validation
├── types/        # TypeScript types
├── hooks/        # Custom hooks
└── stores/       # Zustand stores
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm test` | Run tests |
| `pnpm lint` | Run ESLint |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio |

## License

Private - All rights reserved

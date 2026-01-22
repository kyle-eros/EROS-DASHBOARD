# EROS Ticketing System - Deployment Guide

## Prerequisites

- Node.js 20.x or later
- pnpm 8.x or later
- PostgreSQL 16.x
- Docker (for local development)

## Local Development

### 1. Start Database

```bash
docker-compose up -d
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 4. Generate Prisma Client

```bash
pnpm db:generate
```

### 5. Run Migrations

```bash
pnpm db:migrate
```

### 6. Seed Database (optional)

```bash
pnpm db:seed
```

### 7. Start Development Server

```bash
pnpm dev
```

## Production Deployment

### Environment Variables

Required environment variables for production:

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=<generate with openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
```

### Build

```bash
pnpm build
```

### Docker

Build and run with Docker:

```bash
docker build -t eros-ticketing .
docker run -p 3000:3000 eros-ticketing
```

### Database Migrations (Production)

```bash
pnpm db:migrate:prod
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] NEXTAUTH_SECRET is unique and secure
- [ ] NEXTAUTH_URL matches production domain
- [ ] SSL/TLS configured
- [ ] Monitoring configured
- [ ] Backup strategy in place

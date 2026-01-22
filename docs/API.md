# EROS Ticketing System - API Documentation

## Overview

The API is built using Next.js App Router conventions:
- **Server Actions** for mutations (forms, state changes)
- **API Routes** for external integrations and health checks
- **Direct Service Calls** in Server Components for reads

## Authentication

All protected endpoints require a valid session.

### Auth Endpoints (NextAuth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin` | GET/POST | Sign in page/handler |
| `/api/auth/signout` | POST | Sign out handler |
| `/api/auth/session` | GET | Get current session |

## Server Actions

Server Actions are the primary mutation mechanism. They are called from client components using `useFormState` or direct invocation.

### Ticket Actions

| Action | Description |
|--------|-------------|
| `createTicketAction` | Create a new ticket |
| `updateTicketAction` | Update ticket details |
| `addCommentAction` | Add comment to ticket |
| `assignTicketAction` | Assign/unassign ticket |
| `closeTicketAction` | Close a ticket |

### User Actions

| Action | Description |
|--------|-------------|
| `createUserAction` | Create new user (admin) |
| `updateUserAction` | Update user details |
| `changePasswordAction` | Change current user password |
| `deactivateUserAction` | Deactivate a user |

### Creator Actions

| Action | Description |
|--------|-------------|
| `createCreatorAction` | Create new creator |
| `updateCreatorAction` | Update creator details |

## API Routes

### Health Check

```
GET /api/health
```

Returns system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-18T00:00:00.000Z",
  "checks": {
    "database": "connected"
  }
}
```

## Response Types

### Success Response
```typescript
{
  success: true,
  data: T,
  message?: string
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: Record<string, string[]>
  }
}
```

### Paginated Response
```typescript
{
  items: T[],
  pagination: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number,
    hasNext: boolean,
    hasPrevious: boolean
  }
}
```

# Maintenance & Security Guide

This guide is for developers and administrators maintaining the EROS Ticketing System.

## Security Practices

We have implemented several security measures. Periodically verify these remain effective.

### 1. Audit Logs
**Where**: `src/services/audit.service.ts`
- **Check**: Ensure `sanitizeLogData` is correctly stripping sensitive fields (`password`, `token`, `secret`) from logs.
- **Action**: Periodically check your database `AuditLog` table ensuring no plain-text passwords appear in the `details` JSON column.

### 2. Input Validation
**Where**: `src/actions/*.ts`
- **Check**: All Server Actions must usage Zod schemas (`safeParse`).
- **Rule**: Never accept raw `FormData` or objects directly into database queries without passing them through a Zod schema first. This prevents "Mass Assignment" attacks.

### 3. Permissions
**Where**: `src/actions/*.ts` and `src/hooks/use-auth.ts`
- **Check**: Ensure every exported Server Action starts with an authorization check:
  ```typescript
  const session = await auth();
  if (!hasPermission(session.user.role, 'required:permission')) { ... }
  ```
- **Rule**: Do not rely solely on hiding UI buttons. The backend action must verify permissions.

---

## Routine Maintenance

### Database Updates
When you modify `prisma/schema.prisma`:
1.  Run `pnpm run db:generate` to update the type definitions.
2.  Run `pnpm run db:push` to update the development database.
3.  For production, use migrations: `pnpm run db:migrate`.

### Dependency Updates
To keep the system secure, update dependencies regularly:
1.  Run `pnpm outdated` to see what's new.
2.  Run `pnpm update` to update compatible versions.
3.  **Caution**: Major updates (e.g., Next.js 14 -> 15) may require code changes.

### Backups
- Ensure your PostgreSQL provider (e.g., Supabase, Neon, AWS RDS) has automated backups enabled.
- Test restoring a backup to a staging environment periodically to ensure data integrity.

---

## Troubleshooting

- **Build Errors**: If `pnpm run build` fails, check `src/types` for type mismatches (often related to external libraries like `next-auth` or `prisma`).
- **Login Issues**: If users cannot login, verify the `NEXTAUTH_SECRET` is set in `.env` and matches across environments (if scaling horizontally).

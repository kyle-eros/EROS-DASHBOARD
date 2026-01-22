# Project Organization & Documentation Plan

## Goal
Organize the project root for better maintainability and create beginner-friendly documentation for setup and security maintenance.

## 1. Root Directory Cleanup
**Current State Analysis**: (Pending `list_dir` result, but typically involves moving documentation and loose scripts).

**Proposed Structure Changes**:
- Create `docs/` directory if it doesn't exist.
- Move any loose markdown files (e.g., `SETUP_GUIDE.md` if it's new, or others) into `docs/`.
- Keep essential config files in root (`package.json`, `next.config.ts`, `tsconfig.json`, `.env*`, `pnpm-lock.yaml`, `tailwind.config.ts`, `postcss.config.js`).

## 2. Documentation

### `SETUP_GUIDE.md` (Beginner Friendly)
**Location**: Root (or linked from README).
**Content**:
1.  **Welcome**: what this app is.
2.  **Prerequisites**: Node.js (v20+), pnpm, Postgres (or Docker).
3.  **Step-by-Step Install**:
    - `pnpm install`
    - Copy `.env.example` -> `.env` (explain what this is).
4.  **Database Actions**:
    - `pnpm run db:generate`
    - `pnpm run db:push` (for dev) or `migrate`.
    - `pnpm run db:seed` (crucial for first login).
5.  **Running**: `pnpm run dev`.
6.  **First Login**: Provide default credentials (from seed).

### `MAINTENANCE.md`
**Location**: `docs/MAINTENANCE.md`.
**Content**:
1.  **Security Checks**:
    - How to run the audit checks we added.
    - Reminder to check `audit.service.ts` logs.
2.  **Updates**: How to update packages safely.
3.  **Backups**: Basic advice on database backups.
4.  **Troubleshooting**: Common errors (db connection, etc).

## 3. Verification
- Verify the guides by following them (mentally or dry-run).
- Ensure file moves don't break imports (mostly docs, so low risk).

/**
 * @file route.ts
 * @description NextAuth.js API route handler
 * @layer API
 * @status PLACEHOLDER - Auth route configured
 *
 * Handles all authentication routes:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/session
 * - /api/auth/callback/*
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;

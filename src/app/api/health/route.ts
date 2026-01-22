/**
 * @file route.ts
 * @description Health check endpoint for uptime monitoring
 * @layer API
 * @status IMPLEMENTED
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Basic DB Check
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: String(error)
      },
      { status: 503 }
    );
  }
}

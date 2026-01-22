/**
 * @file generate-secret.ts
 * @description Generate secure secrets for NextAuth
 * @status IMPLEMENTED
 *
 * Run with: npx tsx scripts/generate-secret.ts
 */

import { randomBytes } from 'crypto';

const secret = randomBytes(32).toString('base64');

console.log('Generated NEXTAUTH_SECRET:');
console.log(secret);
console.log('\nAdd this to your .env.local file:');
console.log(`NEXTAUTH_SECRET="${secret}"`);

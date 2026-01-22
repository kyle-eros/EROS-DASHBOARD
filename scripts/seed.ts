/**
 * @file seed.ts
 * @description Database seeding script
 * @status IMPLEMENTED
 *
 * Run with: pnpm db:seed
 */

import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting database seed...');

  // 1. Create Admin User
  const adminEmail = 'admin@eros.com';
  const adminPassword = 'password';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      // Ensure admin role is maintained if re-seeded
      role: 'SUPER_ADMIN',
    },
    create: {
      email: adminEmail,
      name: 'Eros Admin',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('-----------------------------------');
  console.log('✅ Admin user created/updated:');
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role: ${adminUser.role}`);
  console.log('-----------------------------------');

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

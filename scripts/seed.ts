/**
 * @file seed.ts
 * @description Database seeding script with comprehensive test data
 * @status IMPLEMENTED
 *
 * Run with: pnpm db:seed
 */

import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seed...');

  // --------------------------------------------------------------------------
  // 1. CLEANUP (Optional - be careful in production!)
  // --------------------------------------------------------------------------
  // For this test phase, let's upsert everything so we don't need to wipe functionality
  // If you wanted to wipe: await prisma.ticket.deleteMany(); etc. 

  // --------------------------------------------------------------------------
  // 2. CREATE USERS
  // --------------------------------------------------------------------------
  const passwordHash = await bcrypt.hash('password', 10);

  const users = [
    { email: 'admin@eros.com', name: 'Eros Admin', role: 'SUPER_ADMIN' },
    { email: 'manager@eros.com', name: 'Mike Manager', role: 'MANAGER' },
    { email: 'scheduler@eros.com', name: 'Sarah Scheduler', role: 'SCHEDULER' },
    { email: 'chatter@eros.com', name: 'Chris Chatter', role: 'CHATTER' },
    { email: 'kassie@eros.com', name: 'Kassie Model', role: 'CREATOR' },
    { email: 'luna@eros.com', name: 'Luna Lux', role: 'CREATOR' },
  ];

  const createdUsers: Record<string, any> = {};

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role as any, passwordHash }, // Ensure role is correct
      create: {
        email: u.email,
        name: u.name,
        role: u.role as any,
        passwordHash,
        isActive: true,
      },
    });
    createdUsers[u.email] = user;
    console.log(`👤 User processed: ${u.email}`);
  }

  // --------------------------------------------------------------------------
  // 3. CREATE CREATOR PROFILES
  // --------------------------------------------------------------------------
  const creators = [
    {
      email: 'kassie@eros.com',
      stageName: 'Kassie',
      platforms: ['OnlyFans', 'Instagram'],
      timezone: 'America/Los_Angeles',
    },
    {
      email: 'luna@eros.com',
      stageName: 'Luna Lux',
      platforms: ['Fansly', 'Twitter', 'OnlyFans'],
      timezone: 'America/New_York',
    },
  ];

  const createdCreators: Record<string, any> = {};

  for (const c of creators) {
    const user = createdUsers[c.email];
    if (!user) continue;

    const creator = await prisma.creator.upsert({
      where: { userId: user.id },
      update: {
        stageName: c.stageName,
        platforms: c.platforms,
      },
      create: {
        userId: user.id,
        stageName: c.stageName,
        platforms: c.platforms,
        timezone: c.timezone,
        isActive: true,
      },
    });
    createdCreators[c.stageName] = creator;
    console.log(`✨ Creator profile processed: ${c.stageName}`);
  }

  // --------------------------------------------------------------------------
  // 4. CREATE TICKETS
  // --------------------------------------------------------------------------
  const kassie = createdCreators['Kassie'];
  const luna = createdCreators['Luna Lux'];
  const chatter = createdUsers['chatter@eros.com'];
  const manager = createdUsers['manager@eros.com'];

  if (kassie && chatter) {
    const tickets = [
      {
        ticketNumber: 'CVR-2025-001',
        title: 'Custom Video: Birthday Greeting',
        description: 'Fan wants a 2-min video wishing Happy Birthday to "Mark".',
        type: 'CUSTOM_VIDEO',
        priority: 'MEDIUM',
        status: 'PENDING_REVIEW',
        creatorId: kassie.id,
        createdById: chatter.id,
        assignedToId: manager.id,
        ticketData: {
            duration: "2 minutes",
            recipient: "Mark",
            instructions: "Wear the red dress"
        }
      },
      {
        ticketNumber: 'URG-2025-002',
        title: 'URGENT: Content Leak Report',
        description: 'Found leaked content on Reddit. Needs takedown immediately.',
        type: 'URGENT_ALERT',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        creatorId: kassie.id,
        createdById: chatter.id,
        assignedToId: manager.id,
        ticketData: {
            url: "https://reddit.com/r/fake-leak",
            reportedBy: "ModTeam"
        }
      },
      {
        ticketNumber: 'GEN-2025-003',
        title: 'New Photoshoot Ideas',
        description: 'Thinking about a beach theme for next month.',
        type: 'CONTENT_REQUEST',
        priority: 'LOW',
        status: 'DRAFT',
        creatorId: luna.id,
        createdById: luna.userId, // Created by creator herself
        assignedToId: null,
        ticketData: {
            theme: "Beach/Summer",
            props: ["Hat", "Sunglasses"]
        }
      }
    ];

    for (const t of tickets) {
      /* eslint-disable @typescript-eslint/naming-convention */
      await prisma.ticket.upsert({
        where: { ticketNumber: t.ticketNumber },
        update: {
            status: t.status as any,
            priority: t.priority as any
        },
        create: {
          ticketNumber: t.ticketNumber,
          title: t.title,
          description: t.description,
          type: t.type as any,
          priority: t.priority as any,
          status: t.status as any,
          creatorId: t.creatorId,
          createdById: t.createdById,
          assignedToId: t.assignedToId,
          ticketData: t.ticketData || {},
        },
      });
      console.log(`🎫 Ticket processed: ${t.ticketNumber}`);
    }
  }

  console.log('✅ Seed complete! Database populated with test data.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

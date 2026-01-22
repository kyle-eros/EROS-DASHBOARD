
import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'YourPassword123!';
  const hashedPassword = await hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin User',
      passwordHash: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log({ user });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { prisma } from '../src/lib/db';

async function main() {
    console.log('Verifying DB connection...');
    try {
        const userCount = await prisma.user.count();
        console.log(`Current user count: ${userCount}`);

        console.log('Creating test user...');
        const testUser = await prisma.user.create({
            data: {
                email: `verify_${Date.now()}@example.com`,
                name: 'Verification User',
                passwordHash: 'hashed_password',
                role: 'SUPER_ADMIN',
            }
        });
        console.log(`Created user: ${testUser.id}`);

        // Clean up
        await prisma.user.delete({ where: { id: testUser.id } });
        console.log('Verification success!');
    } catch (e) {
        console.error('Verification failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

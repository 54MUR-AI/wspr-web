import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        authenticators: true,
        recoveryKeys: true,
      },
    });

    console.log('\nRegistered Users:');
    console.log('================');
    
    users.forEach(user => {
      console.log(`\nUser ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Created: ${user.createdAt}`);
      console.log(`Authenticators: ${user.authenticators.length}`);
      console.log(`Recovery Keys: ${user.recoveryKeys.length}`);
      console.log(`Account Status: ${user.disabled ? 'Disabled' : 'Active'}`);
      console.log('----------------');
    });

    console.log(`\nTotal Users: ${users.length}`);
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();

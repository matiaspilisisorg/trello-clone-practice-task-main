import 'dotenv/config';
import prisma from '../prisma/client.js';
import { seedDemoBoards } from './demoBoards.js';

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} existing users`);

  for (const user of users) {
    console.log(`Seeding demo boards for ${user.email}...`);
    await seedDemoBoards(user.id);
    console.log(`Done for ${user.email}`);
  }

  await prisma.$disconnect();
  console.log('All done!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

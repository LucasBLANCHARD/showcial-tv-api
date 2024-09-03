import { PrismaClient } from '@prisma/client';
import logger from './utils/logger';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      email: 'kaygoque@gmail.com',
      username: 'Kaygoke',
      password: 'test',
      role: 'ADMIN',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

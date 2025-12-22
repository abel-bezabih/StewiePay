import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AdminPass123!';
  const userPassword = process.env.SEED_USER_PASSWORD ?? 'UserPass123!';

  const adminHash = await bcrypt.hash(adminPassword, saltRounds);
  const userHash = await bcrypt.hash(userPassword, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@stewiepay.local' },
    update: { passwordHash: adminHash, role: UserRole.ADMIN, name: 'Admin User' },
    create: {
      name: 'Admin User',
      email: 'admin@stewiepay.local',
      role: UserRole.ADMIN,
      passwordHash: adminHash
    }
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@stewiepay.local' },
    update: { passwordHash: userHash, role: UserRole.INDIVIDUAL, name: 'Sample User' },
    create: {
      name: 'Sample User',
      email: 'user@stewiepay.local',
      role: UserRole.INDIVIDUAL,
      passwordHash: userHash
    }
  });

  // eslint-disable-next-line no-console
  console.log('Seeded users:', { admin: admin.email, user: user.email });
  // eslint-disable-next-line no-console
  console.log('Passwords:', {
    admin: adminPassword,
    user: userPassword
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });














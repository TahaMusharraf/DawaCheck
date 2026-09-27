import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
    const regEmail = process.env.SEED_REGULATOR_EMAIL;
    const regPassword = process.env.SEED_REGULATOR_PASSWORD;

    if (!regEmail || !regPassword) {
    throw new Error('SEED_REGULATOR_EMAIL and SEED_REGULATOR_PASSWORD must be set in .env');
    }

  const org = await prisma.organization.upsert({
    where: { licenseNo: 'DRAP-HQ' },
    update: {},
        create: {
        name: 'Drug Regulatory Authority of Pakistan',
        type: 'REGULATOR',
        status: 'LICENSED',
        licenseNo: 'DRAP-HQ',
        city: 'Islamabad',
        users: {
            create: {
                email: regEmail,
                passwordHash: await argon2.hash(regPassword),
                role: 'ADMIN',
            },
            },
        },
    })
    console.log('Seeded regulator organization and admin user:', org);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
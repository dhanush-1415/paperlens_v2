const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cleaning up old database triggers from clearcut-app...');
  try {
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
    await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;`);
    console.log('Successfully removed legacy triggers.');
  } catch (e) {
    console.log(
      'Note: Could not drop legacy triggers (they might not exist or lack permission). Proceeding...',
    );
  }

  const freePlan = await prisma.plan.upsert({
    where: { tierName: 'free' },
    update: {
      displayName: 'Free',
      quotaScansPerMonth: 10,
      quotaVaultDocuments: 0,
      quotaChatMessagesPerMonth: 20,
      capVault: false,
    },
    create: {
      tierName: 'free',
      displayName: 'Free',
      quotaScansPerMonth: 10,
      quotaChatMessagesPerMonth: 20,
      quotaVaultDocuments: 0,
      quotaActiveShareLinks: 1,
      capVault: false,
      capReanalysis: false,
      capAllLanguages: false,
      capExport: false,
      capShare: true,
      capPrioritySupport: false,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { tierName: 'pro' },
    update: {
      displayName: 'Pro',
      quotaScansPerMonth: 75,
      quotaChatMessagesPerMonth: 300,
      quotaVaultDocuments: 999999, // Unlimited
    },
    create: {
      tierName: 'pro',
      displayName: 'Pro',
      quotaScansPerMonth: 75,
      quotaChatMessagesPerMonth: 300,
      quotaVaultDocuments: 999999, // Unlimited
      quotaActiveShareLinks: 100,
      capVault: true,
      capReanalysis: true,
      capAllLanguages: true,
      capExport: true,
      capShare: true,
      capPrioritySupport: true,
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { tierName: 'enterprise' },
    update: {
      displayName: 'Developer Scale',
      quotaScansPerMonth: 50000,
      quotaChatMessagesPerMonth: 10000,
      quotaVaultDocuments: 999999, // Unlimited
    },
    create: {
      tierName: 'enterprise',
      displayName: 'Developer Scale',
      quotaScansPerMonth: 50000,
      quotaChatMessagesPerMonth: 10000,
      quotaVaultDocuments: 999999, // Unlimited
      quotaActiveShareLinks: 1000,
      capVault: true,
      capReanalysis: true,
      capAllLanguages: true,
      capExport: true,
      capShare: true,
      capPrioritySupport: true,
    },
  });

  console.log('Seeded plans:', { freePlan, proPlan, enterprisePlan });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

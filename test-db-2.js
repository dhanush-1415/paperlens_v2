const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
const prisma = new PrismaClient();

async function test() {
  try {
    const doc = await prisma.documentAnalysis.findFirst({
      where: { deletedAt: null }
    });
    console.log('Success:', doc);
  } catch (err) {
    console.error('Prisma Error Message:', err.message);
  }
  
  try {
    const folders = await prisma.folder.findMany({
      take: 1,
      include: { _count: { select: { analyses: true } } }
    });
    console.log('Folders Success:', folders);
  } catch (err) {
    console.error('Folders Error:', err.message);
  }
}
test().finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const docCount = await prisma.documentAnalysis.count({ where: { ownerId: user.id }});
    const sub = await prisma.subscription.findFirst({ where: { userId: user.id }});
    
    if (sub && sub.scansUsed !== docCount) {
      console.log(`Fixing user ${user.email}: scansUsed ${sub.scansUsed} -> ${docCount}`);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { scansUsed: docCount }
      });
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

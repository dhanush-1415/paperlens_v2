import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  if (users.length === 0) return;
  const user = users[0];

  console.log("Testing documentAnalysis.create for user", user.email);

  const id = "00000000-0000-0000-0000-000000000000";

  try {
    const record = await prisma.documentAnalysis.create({
      data: {
        id,
        ownerId: user.id,
        title: "Test Scan Document",
        documentType: "other",
        charCount: 100,
        scoreValue: 50,
        scoreLevel: "safe",
        summary: "Test summary",
        actionPlan: [],
        urgency: "low",
        rawText: "test test",
        fileUrl: null,
        mimeType: null,
        entities: [],
        legitimacy: "high",
        confidence: "high",
        suggestedQuestions: [],
        timeline: [],
        deadlineDate: null,
        analyzedAt: new Date(),
        flags: [],
      },
    });
    console.log("SUCCESS:", record.id);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    // cleanup
    try {
      await prisma.documentAnalysis.delete({ where: { id } });
    } catch {}
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

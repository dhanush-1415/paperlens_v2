import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { z } from 'zod';

const completeSchema = z.object({
  jobId: z.string().uuid(),
  executiveReport: z.any()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, executiveReport } = completeSchema.parse(body);

    const updatedJob = await prisma.analysisJob.update({
      where: { id: jobId },
      data: { 
        status: 'completed',
        result: executiveReport,
      },
    });

    return NextResponse.json({ success: true, data: updatedJob });
  } catch (error) {
    console.error('[Webhook] Error completing job:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

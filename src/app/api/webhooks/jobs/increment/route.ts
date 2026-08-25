import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { z } from 'zod';

const incrementSchema = z.object({
  jobId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId } = incrementSchema.parse(body);

    const updatedJob = await prisma.analysisJob.update({
      where: { id: jobId },
      data: { 
        processedCount: { increment: 1 } 
      },
      select: {
        processedCount: true,
        totalCount: true
      }
    });

    return NextResponse.json({ success: true, data: updatedJob });
  } catch (error) {
    console.error('[Webhook] Error incrementing job:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

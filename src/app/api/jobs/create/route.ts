import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { z } from 'zod';
import { requireSession } from '@/server/bootstrap';

const createJobSchema = z.object({
  jobId: z.string().uuid(),
  totalCount: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, totalCount } = createJobSchema.parse(body);

    const newJob = await prisma.analysisJob.create({
      data: {
        id: jobId,
        userId: session.userId,
        totalCount: totalCount,
        processedCount: 0,
        status: 'processing'
      },
    });

    return NextResponse.json({ success: true, data: newJob });
  } catch (error) {
    console.error('[Create Job] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

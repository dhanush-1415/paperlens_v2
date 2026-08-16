import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';
import { renderToStream } from '@react-pdf/renderer';
import { AnalysisReportPDF } from '@/features/export/infrastructure/pdf-generator';
import React from 'react';

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return new NextResponse('Missing analysis ID', { status: 400 });
    }

    const analysis = await prisma.documentAnalysis.findUnique({
      where: { id }
    });

    if (!analysis) {
      return new NextResponse('Analysis not found', { status: 404 });
    }

    if (analysis.ownerId !== session.userId) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // Render the PDF component
    const pdfStream = await renderToStream(<AnalysisReportPDF data={analysis} />);
    
    // Set headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="paperlens-report-${analysis.id.substring(0, 8)}.pdf"`);

    // Next.js Response body accepts ReadableStream.
    // @react-pdf/renderer returns a Node.js Readable stream. We need to convert it.
    
    const readableWebStream = new ReadableStream({
      start(controller) {
        pdfStream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        pdfStream.on('end', () => controller.close());
        pdfStream.on('error', (err: Error) => controller.error(err));
      }
    });

    return new NextResponse(readableWebStream, { headers });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

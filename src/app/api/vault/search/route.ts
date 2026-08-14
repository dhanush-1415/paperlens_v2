import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';
import { scoreOf } from '@/features/document-analysis/domain/risk';

export async function GET(req: Request) {
  try {
    await connection();
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ documents: [] });
    }

    // Step 1: Text-based search across filenames (Semantic pgvector search will be layered here later)
    const documents = await prisma.document.findMany({
      where: { 
        userId: session.userId,
        filename: {
          contains: query,
          mode: 'insensitive' // ILIKE
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Step 2: Decorate with Risk Analysis
    const analyses = await prisma.documentAnalysis.findMany({
      where: { ownerId: session.userId, deletedAt: null }
    });
    
    const analysisMap = new Map(analyses.map(a => [a.title, a]));

    const mappedDocuments = documents.map(d => {
      const analysis = analysisMap.get(d.filename);
      const allFlags = analysis && Array.isArray(analysis.flags) ? analysis.flags : [];
      const risk = analysis ? scoreOf(allFlags as any).level : 'safe';
      return {
        id: d.id,
        name: d.filename || 'Untitled Document',
        type: (d.fileType || 'unknown').toUpperCase(),
        risk: risk,
        date: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
        size: d.byteSize ? `${(d.byteSize / (1024 * 1024)).toFixed(1)} MB` : '0 MB'
      };
    });

    return NextResponse.json({ documents: mappedDocuments });
  } catch (error: any) {
    if (error.message && error.message.includes('NEXT_HTTP_ERROR')) throw error;
    console.error('Vault search error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

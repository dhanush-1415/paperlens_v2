import { NextResponse } from 'next/server';
import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';
import { scoreOf } from '@/features/document-analysis/domain';

export async function GET(req: Request) {
  try {
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
      const risk = analysis ? scoreOf(analysis.flags as any).level : 'safe';
      
      return {
        id: d.id,
        name: d.filename,
        type: d.fileType,
        risk: risk,
        date: d.createdAt.toISOString(),
        size: `${(d.byteSize / (1024 * 1024)).toFixed(1)} MB`
      };
    });

    return NextResponse.json({ documents: mappedDocuments });
  } catch (error: any) {
    console.error('Vault search error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

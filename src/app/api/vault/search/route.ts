import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';
import { scoreOf } from '@/features/document-analysis/domain/risk';
import { embed } from 'ai';
import { google } from '@ai-sdk/google';

export async function GET(req: Request) {
  await connection();
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ documents: [] });
    }

    let analysisIdsToFetch: string[] | null = null;

    // Only perform semantic search if the query is descriptive enough
    if (query.split(' ').length > 2 || query.length > 10) {
      try {
        const { embedding } = await embed({
          model: google.textEmbeddingModel('embedding-001'),
          value: query,
        });

        const vectorLiteral = `[${embedding.join(',')}]`;

        // Find top 10 chunks matching the query
        const semanticResults = await prisma.$queryRaw<Array<{ analysis_id: string }>>`
          SELECT analysis_id
          FROM document_content
          ORDER BY embedding <=> ${vectorLiteral}::vector
          LIMIT 10
        `;

        if (semanticResults.length > 0) {
          analysisIdsToFetch = [...new Set(semanticResults.map((r) => r.analysis_id))];
        }
      } catch (err) {
        console.error('Semantic search failed, falling back to text search:', err);
      }
    }

    // Step 2: Fetch documents
    const whereClause: any = {
      ownerId: session.userId,
      deletedAt: null,
    };

    if (analysisIdsToFetch) {
      // If we have semantic hits, we combine them with a title fallback
      whereClause.OR = [
        { id: { in: analysisIdsToFetch } },
        { title: { contains: query, mode: 'insensitive' } },
      ];
    } else {
      // Just title text search
      whereClause.title = { contains: query, mode: 'insensitive' };
    }

    const analyses = await prisma.documentAnalysis.findMany({
      where: whereClause,
      orderBy: { analyzedAt: 'desc' },
      take: 20,
    });

    const mappedDocuments = analyses.map((a) => {
      const allFlags = Array.isArray(a.flags) ? a.flags : [];
      const risk = scoreOf(allFlags as any).level;
      const resolved = (a.resolvedFlagIds || []).length >= allFlags.length;

      return {
        id: a.id,
        folderId: a.folderId,
        name: a.title || 'Untitled Document',
        type: (a.documentType || 'unknown').toUpperCase(),
        risk,
        resolved,
        deadlineDate: a.deadlineDate?.toISOString() || null,
        date: a.analyzedAt ? new Date(a.analyzedAt).toISOString() : new Date().toISOString(),
        size: 'Text Only',
      };
    });

    return NextResponse.json({ documents: mappedDocuments });
  } catch (error: any) {
    if (error.message && error.message.includes('NEXT_HTTP_ERROR')) throw error;
    console.error('Vault search error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

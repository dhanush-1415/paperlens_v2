import { NextResponse } from 'next/server';
import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';
import { scoreOf } from '@/features/document-analysis/domain';

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId') || null;

    // Fetch folders
    const folders = await prisma.folder.findMany({
      where: { userId: session.userId, parentId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { documents: true } }
      }
    });

    // Fetch documents
    const documents = await prisma.document.findMany({
      where: { userId: session.userId, folderId: parentId },
      orderBy: { createdAt: 'desc' }
    });

    // We also need the analysis for these documents to get the risk level
    const documentIds = documents.map(d => d.id);
    const analyses = await prisma.documentAnalysis.findMany({
      where: { ownerId: session.userId, deletedAt: null }
    });

    const analysisMap = new Map(analyses.map(a => [a.title, a])); // fallback since title is original filename

    const mappedFolders = folders.map(f => ({
      id: f.id,
      name: f.name,
      count: f._count.documents
    }));

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

    return NextResponse.json({ folders: mappedFolders, documents: mappedDocuments });
  } catch (error: any) {
    console.error('Vault list error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

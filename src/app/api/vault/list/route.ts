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
        _count: { select: { analyses: true } }
      }
    });

    // Fetch analyzed documents (zero retention means physical documents might not exist, so we show analyses)
    const analyses = await prisma.documentAnalysis.findMany({
      where: { ownerId: session.userId, deletedAt: null },
      orderBy: { analyzedAt: 'desc' }
    });

    const mappedFolders = folders.map(f => ({
      id: f.id,
      name: f.name,
      count: f._count.analyses
    }));

    const mappedDocuments = analyses.map(a => {
      const risk = scoreOf(a.flags as any).level;
      const allFlags = Array.isArray(a.flags) ? a.flags : [];
      const resolved = a.resolvedFlagIds.length >= allFlags.length;
      
      return {
        id: a.id,
        folderId: a.folderId,
        name: a.title || 'Untitled Document',
        type: a.documentType.toUpperCase(),
        risk: risk,
        resolved: resolved,
        deadlineDate: a.deadlineDate?.toISOString() || null,
        date: a.analyzedAt.toISOString(),
        size: 'Text Only' // Zero retention indicator
      };
    });

    return NextResponse.json({ folders: mappedFolders, documents: mappedDocuments });
  } catch (error: any) {
    console.error('Vault list error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

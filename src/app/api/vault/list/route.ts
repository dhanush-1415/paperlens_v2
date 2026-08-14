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
    const rawParentId = searchParams.get('parentId');
    const parentId = rawParentId === 'null' ? null : (rawParentId || null);

    // Fetch folders
    const folders = await prisma.folder.findMany({
      where: { userId: session.userId, parentId },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch analyzed documents
    const analyses = await prisma.documentAnalysis.findMany({
      where: { ownerId: session.userId, deletedAt: null },
      orderBy: { analyzedAt: 'desc' }
    });

    const mappedFolders = await Promise.all(folders.map(async f => {
      const count = await prisma.documentAnalysis.count({
        where: { folderId: f.id, deletedAt: null }
      });
      return {
        id: f.id,
        name: f.name,
        count
      };
    }));

    const mappedDocuments = analyses.map(a => {
      const allFlags = Array.isArray(a.flags) ? a.flags : [];
      const risk = scoreOf(allFlags as any).level;
      const resolved = (a.resolvedFlagIds || []).length >= allFlags.length;
      
      return {
        id: a.id,
        folderId: a.folderId,
        name: a.title || 'Untitled Document',
        type: (a.documentType || 'unknown').toUpperCase(),
        risk: risk,
        resolved: resolved,
        deadlineDate: a.deadlineDate?.toISOString() || null,
        date: a.analyzedAt ? new Date(a.analyzedAt).toISOString() : new Date().toISOString(),
        size: 'Text Only' // Zero retention indicator
      };
    });

    return NextResponse.json({ folders: mappedFolders, documents: mappedDocuments });
  } catch (error: any) {
    if (error.message && error.message.includes('NEXT_HTTP_ERROR')) throw error;
    
    console.error('Vault list error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      stack: error.stack
    }, { status: 500 });
  }
}

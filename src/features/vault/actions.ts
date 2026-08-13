'use server';

import { prisma } from '@/server/db/prisma';
import { requireSession } from '@/server/bootstrap';
import { revalidatePath } from 'next/cache';

export async function deleteDocumentAction(documentId: string) {
  const session = await requireSession();
  
  await prisma.documentAnalysis.update({
    where: { id: documentId, ownerId: session.userId },
    data: { deletedAt: new Date() }
  });
  
  revalidatePath('/vault');
}

export async function toggleResolvedAction(documentId: string, resolved: boolean) {
  const session = await requireSession();
  
  const doc = await prisma.documentAnalysis.findUnique({
    where: { id: documentId, ownerId: session.userId },
    select: { flags: true }
  });
  
  if (!doc) throw new Error('Document not found');
  
  const allFlags = Array.isArray(doc.flags) ? doc.flags as any[] : [];
  
  await prisma.documentAnalysis.update({
    where: { id: documentId },
    data: {
      resolvedFlagIds: resolved ? allFlags.map(f => f.id) : []
    }
  });
  
  revalidatePath('/vault');
}

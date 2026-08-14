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

export async function createFolderAction(name: string) {
  const session = await requireSession();
  
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Folder name is required');
  if (trimmed.length > 60) throw new Error('Name must be 60 characters or fewer.');
  
  await prisma.folder.create({
    data: {
      userId: session.userId,
      name: trimmed
    }
  });
  
  revalidatePath('/vault');
}

export async function moveToFolderAction(documentId: string, folderId: string | null) {
  const session = await requireSession();
  
  await prisma.documentAnalysis.update({
    where: { id: documentId, ownerId: session.userId },
    data: { folderId }
  });
  
  revalidatePath('/vault');
}

export async function bulkMoveToFolderAction(documentIds: string[], folderId: string | null) {
  const session = await requireSession();
  
  await prisma.documentAnalysis.updateMany({
    where: { id: { in: documentIds }, ownerId: session.userId },
    data: { folderId }
  });
  
  revalidatePath('/vault');
}

export async function renameFolderAction(folderId: string, newName: string) {
  const session = await requireSession();
  
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('Folder name is required');
  if (trimmed.length > 60) throw new Error('Name must be 60 characters or fewer.');
  
  await prisma.folder.update({
    where: { id: folderId, userId: session.userId },
    data: { name: trimmed }
  });
  
  revalidatePath('/vault');
}

export async function deleteFolderOnlyAction(folderId: string) {
  const session = await requireSession();
  
  // prisma folder relation is set to onDelete: SetNull for documents
  await prisma.folder.delete({
    where: { id: folderId, userId: session.userId }
  });
  
  revalidatePath('/vault');
}

export async function deleteFolderAndDocsAction(folderId: string) {
  const session = await requireSession();
  
  // First, mark all documents in the folder as deleted
  await prisma.documentAnalysis.updateMany({
    where: { folderId, ownerId: session.userId },
    data: { deletedAt: new Date() }
  });
  
  // Then delete the folder
  await prisma.folder.delete({
    where: { id: folderId, userId: session.userId }
  });
  
  revalidatePath('/vault');
}

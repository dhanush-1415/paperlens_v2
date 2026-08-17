'use server';

import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';
import { revalidatePath } from 'next/cache';
import { AppError } from '@/core/errors/app-error';

export async function saveProfileAction(formData: FormData) {
  const session = await requireSession();

  const firstName = formData.get('firstName')?.toString() || '';
  const lastName = formData.get('lastName')?.toString() || '';

  // Update or create profile
  await prisma.profile.upsert({
    where: { id: session.userId },
    update: {
      firstName,
      lastName,
    },
    create: {
      id: session.userId,
      firstName,
      lastName,
    },
  });

  revalidatePath('/profile');
  return { success: true };
}

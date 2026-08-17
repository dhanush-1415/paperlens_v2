'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/server/db/prisma';
import { requireSession } from '@/server/bootstrap';

/**
 * Schedules the authenticated user's account for deletion in 48 hours.
 */
export async function requestAccountDeletionAction(): Promise<{
  error?: string;
  success?: boolean;
}> {
  try {
    const session = await requireSession();

    // We update the profile record to indicate deletion requested
    const now = new Date();
    await prisma.profile.update({
      where: { id: session.userId },
      data: { deletionRequestedAt: now },
    });

    // Email sending could be implemented here as well in the future

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('[delete-account] action error:', error);
    return { error: 'Failed to schedule deletion. Please try again.' };
  }
}

/**
 * Cancels a pending account deletion request.
 */
export async function cancelAccountDeletionAction(): Promise<{
  error?: string;
  success?: boolean;
}> {
  try {
    const session = await requireSession();

    await prisma.profile.update({
      where: { id: session.userId },
      data: { deletionRequestedAt: null },
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('[cancel-deletion] action error:', error);
    return { error: 'Failed to cancel deletion. Please try again.' };
  }
}

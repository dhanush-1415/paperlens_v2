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

    // Send the deletion scheduled email
    const { serverEnv } = await import('@/config/env.server');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      serverEnv.SUPABASE_URL as string,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY as string,
    );
    const { data: { user } } = await supabase.auth.admin.getUserById(session.userId);
    
    if (user?.email) {
      const { sendDeletionScheduledEmail } = await import('@/lib/emails/deletion-scheduled');
      void sendDeletionScheduledEmail(user.email, now.toISOString(), user.user_metadata?.display_name);
    }

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

export const createWebhookAction = async (
  _previous: unknown,
  formData: FormData,
): Promise<void> => {
  const session = await requireSession();
  const url = formData.get('url') as string;
  const secret = formData.get('secret') as string | null;

  if (!url || !url.startsWith('http')) {
    throw new Error('Invalid URL');
  }

  await prisma.webhook.create({
    data: {
      userId: session.userId,
      url,
      secret: secret || null,
      events: ['document.analyzed'],
    },
  });
  revalidatePath('/settings');
};

export const deleteWebhookAction = async (
  _previous: unknown,
  formData: FormData,
): Promise<void> => {
  const session = await requireSession();
  const id = formData.get('id') as string;

  await prisma.webhook.deleteMany({
    where: { id, userId: session.userId },
  });
  revalidatePath('/settings');
};

'use server';

import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';
import { generateInboxToken, formatInboxAddress } from '@/shared/utils/inbox';

interface InboxResult { address?: string; error?: string }

/**
 * Return the user's email-in forwarding address, creating a token on first use.
 */
export async function getOrCreateInboxAddressAction(): Promise<InboxResult> {
  const session = await requireSession();

  const profile = await prisma.profile.findUnique({
    where: { id: session.userId },
    select: { inboxToken: true }
  });

  if (profile?.inboxToken) return { address: formatInboxAddress(profile.inboxToken) };

  // Generate + persist (retry once on the astronomically unlikely collision).
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = generateInboxToken();
    try {
      await prisma.profile.upsert({
        where: { id: session.userId },
        update: { inboxToken: token },
        create: { id: session.userId, inboxToken: token }
      });
      return { address: formatInboxAddress(token) };
    } catch (error) {
      // Ignore unique constraint violation and retry
    }
  }
  return { error: 'Could not set up your forwarding address. Please try again.' };
}

/**
 * Rotate the forwarding token — invalidates the old address (e.g. after spam).
 */
export async function regenerateInboxAddressAction(): Promise<InboxResult> {
  const session = await requireSession();

  const token = generateInboxToken();
  try {
    await prisma.profile.update({
      where: { id: session.userId },
      data: { inboxToken: token }
    });
    return { address: formatInboxAddress(token) };
  } catch (error) {
    return { error: 'Could not regenerate your address. Please try again.' };
  }
}

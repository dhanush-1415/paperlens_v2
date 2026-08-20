import { requireSession } from '@/server/bootstrap';
import { SettingsPage } from '@/features/settings';
import { prisma } from '@/server/db/prisma';

export const metadata = {
  title: 'Settings',
};

export const instant = false;

export default async function SettingsRoute() {
  const session = await requireSession(); // Ensure user is authenticated

  // Graceful degradation for database timeouts
  let profile: any = null;
  let webhooks: any[] = [];
  try {
    profile = await prisma.profile.findUnique({
      where: { id: session.userId },
    });

    webhooks = prisma.webhook
      ? await prisma.webhook.findMany({
          where: { userId: session.userId },
          orderBy: { createdAt: 'desc' },
        })
      : [];
  } catch (error) {
    console.error('Database connection failed gracefully on SettingsPage:', error);
  }

  const { serverEnv } = await import('@/config/env.server');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    serverEnv.SUPABASE_URL as string,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY as string,
  );
  const {
    data: { user },
  } = await supabase.auth.admin.getUserById(session.userId);

  return (
    <SettingsPage
      profile={profile}
      userEmail={user?.email || ''}
      displayName={user?.user_metadata?.display_name || ''}
      webhooks={webhooks}
    />
  );
}

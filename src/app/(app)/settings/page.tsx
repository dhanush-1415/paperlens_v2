import { requireSession } from '@/server/bootstrap';
import { SettingsPage } from '@/features/settings';
import { prisma } from '@/server/db/prisma';

export const metadata = {
  title: 'Settings',
};

export const instant = false;

export default async function SettingsRoute() {
  const session = await requireSession(); // Ensure user is authenticated
  
  // Fetch profile if exists
  const profile = await prisma.profile.findUnique({
    where: { id: session.userId }
  });

  const { serverEnv } = await import('@/config/env.server');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(serverEnv.SUPABASE_URL as string, serverEnv.SUPABASE_SERVICE_ROLE_KEY as string);
  const { data: { user } } = await supabase.auth.admin.getUserById(session.userId);

  const webhooks = await prisma.webhook.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' }
  });

  return <SettingsPage 
    profile={profile} 
    userEmail={user?.email || ''} 
    displayName={user?.user_metadata?.display_name || ''} 
    webhooks={webhooks}
  />;
}

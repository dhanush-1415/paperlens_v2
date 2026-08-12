import { requireSession } from '@/server/bootstrap';
import { ProfilePage } from '@/features/settings';
import { prisma } from '@/server/db/prisma';

export const metadata = {
  title: 'Profile Settings',
};

export const instant = false;

export default async function ProfileRoute() {
  const session = await requireSession(); // Ensure user is authenticated
  
  // Fetch profile if exists
  const profile = await prisma.profile.findUnique({
    where: { id: session.userId }
  });

  const { serverEnv } = await import('@/config/env.server');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(serverEnv.SUPABASE_URL as string, serverEnv.SUPABASE_SERVICE_ROLE_KEY as string);
  const { data: { user } } = await supabase.auth.admin.getUserById(session.userId);

  return <ProfilePage 
    profile={profile} 
    userEmail={user?.email || ''} 
    displayName={user?.user_metadata?.display_name || ''} 
  />;
}

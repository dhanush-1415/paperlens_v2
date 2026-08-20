import { requireSession } from '@/server/bootstrap';
import { ProfilePage } from '@/features/settings';
import { prisma } from '@/server/db/prisma';

export const metadata = {
  title: 'Profile Settings',
};

export const instant = false;

export default async function ProfileRoute() {
  const session = await requireSession(); // Ensure user is authenticated

  // Graceful degradation
  let profile: any = null;
  try {
    profile = await prisma.profile.findUnique({
      where: { id: session.userId },
    });
  } catch (error) {
    console.error('Database connection failed gracefully on ProfileRoute:', error);
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

  // Supabase audit logs reside in the 'auth' schema.
  // We can query them directly using Prisma raw SQL since we have DB owner privileges.
  let rawLogs: any[] = [];
  try {
    rawLogs = await prisma.$queryRaw`
      SELECT id, payload->>'ip_address' as ip, payload->>'user_agent' as agent, created_at
      FROM auth.audit_log_entries 
      WHERE payload->>'actor_id' = ${session.userId} 
        AND payload->>'action' = 'login'
      ORDER BY created_at DESC 
      LIMIT 10
    `;
  } catch (e) {
    console.error('Could not fetch auth audit logs:', e);
  }

  const loginActivity = rawLogs.map((log: any) => ({
    id: log.id,
    device: log.agent || 'Unknown Device',
    location: log.ip || 'Unknown IP',
    time: new Date(log.created_at).toLocaleString(),
    status: 'Success',
  }));

  return (
    <ProfilePage
      profile={profile}
      userEmail={user?.email || ''}
      displayName={user?.user_metadata?.display_name || ''}
      loginActivity={loginActivity}
    />
  );
}

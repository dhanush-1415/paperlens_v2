import { requireSession } from '@/server/bootstrap';
import { Heading, Text, Badge, Button, DataTable } from '@/shared/ui';
import { connection } from 'next/server';

export const metadata = {
  title: 'Admin - Users',
};

export default async function AdminUsersPage() {
  await connection();
  await requireSession();

  const { prisma } = await import('@/server/db/prisma');

  let profiles: any[] = [];
  let subscriptions: any[] = [];
  
  try {
    profiles = await prisma.profile.findMany({
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });

    subscriptions = await prisma.userSubscription.findMany({
      include: { plan: true },
    });
  } catch (error) {
    console.error('Database connection failed gracefully on Admin Users Page:', error);
  }

  const { serverEnv } = await import('@/config/env.server');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    serverEnv.SUPABASE_URL as string,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  const {
    data: { users },
  } = await supabase.auth.admin.listUsers();

  const LIVE_USERS = profiles.map((p) => {
    const authUser = users.find((u) => u.id === p.id);
    const sub = subscriptions.find((s) => s.userId === p.id);

    return {
      id: p.id,
      name:
        p.firstName || p.lastName
          ? `${p.firstName || ''} ${p.lastName || ''}`.trim()
          : authUser?.user_metadata?.display_name || 'Unknown',
      email: authUser?.email || p.id,
      role: authUser?.app_metadata?.role === 'admin' ? 'Admin' : 'User',
      plan: sub?.plan?.displayName || 'Free',
      status: authUser?.banned_until ? 'Suspended' : 'Active',
    };
  });

  const columns = [
    { id: 'name', header: 'Name', cell: (u: any) => <span className="font-bold">{u.name}</span> },
    {
      id: 'email',
      header: 'Email',
      cell: (u: any) => <span className="text-text-secondary">{u.email}</span>,
    },
    { id: 'role', header: 'Role', cell: (u: any) => <span className="font-medium">{u.role}</span> },
    { id: 'plan', header: 'Plan', cell: (u: any) => <Badge tone="brand">{u.plan}</Badge> },
    {
      id: 'status',
      header: 'Status',
      cell: (u: any) => <Badge tone={u.status === 'Active' ? 'safe' : 'caution'}>{u.status}</Badge>,
    },
    {
      id: 'action',
      header: '',
      cell: () => (
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">
            User Management
          </Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">
            Manage workspace members and their roles.
          </Text>
        </div>
        <Button className="font-bold shadow-md">Invite User</Button>
      </div>

      <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <DataTable data={LIVE_USERS} columns={columns} keyExtractor={(u) => u.id} />
      </div>
    </div>
  );
}

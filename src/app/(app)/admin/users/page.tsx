import { requireSession } from '@/server/bootstrap';
import { Heading, Text, Badge, Button, DataTable } from '@/shared/ui';

export const metadata = {
  title: 'Admin - Users',
};

export default async function AdminUsersPage() {
  await requireSession();

  const MOCK_USERS = [
    { id: '1', name: 'Alex Mercer', email: 'alex@acmecorp.com', role: 'Owner', plan: 'Enterprise', status: 'Active' },
    { id: '2', name: 'Sarah Jenkins', email: 'sarah@acmecorp.com', role: 'Admin', plan: 'Enterprise', status: 'Active' },
    { id: '3', name: 'Elena Rostova', email: 'elena@acmecorp.com', role: 'User', plan: 'Enterprise', status: 'Invited' },
  ];

  const columns = [
    { id: 'name', header: 'Name', cell: (u: any) => <span className="font-bold">{u.name}</span> },
    { id: 'email', header: 'Email', cell: (u: any) => <span className="text-text-secondary">{u.email}</span> },
    { id: 'role', header: 'Role', cell: (u: any) => <span className="font-medium">{u.role}</span> },
    { id: 'status', header: 'Status', cell: (u: any) => <Badge tone={u.status === 'Active' ? 'safe' : 'caution'}>{u.status}</Badge> },
    { id: 'action', header: '', cell: () => <Button variant="ghost" size="sm">Edit</Button> },
  ];

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">User Management</Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">Manage workspace members and their roles.</Text>
        </div>
        <Button className="font-bold shadow-md">Invite User</Button>
      </div>
      
      <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <DataTable data={MOCK_USERS} columns={columns} keyExtractor={(u) => u.id} />
      </div>
    </div>
  );
}

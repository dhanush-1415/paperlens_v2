import { requireSession } from '@/server/bootstrap';
import { AdminUsersPage } from '@/features/admin';

export const metadata = {
  title: 'User Management',
};

export default async function AdminUsersRoute() {
  await requireSession(); // Add admin check in real app
  return <AdminUsersPage />;
}

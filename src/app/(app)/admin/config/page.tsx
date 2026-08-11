import { requireSession } from '@/server/bootstrap';
import { AdminConfigPage } from '@/features/admin';

export const metadata = {
  title: 'Global Configuration',
};

export default async function AdminConfigRoute() {
  await requireSession(); // Add admin check in real app
  return <AdminConfigPage />;
}

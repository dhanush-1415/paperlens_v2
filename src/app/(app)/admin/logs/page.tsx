import { requireSession } from '@/server/bootstrap';
import { AdminLogsPage } from '@/features/admin';

export const metadata = {
  title: 'System Logs',
};

export default async function AdminLogsRoute() {
  await requireSession(); // Add admin check in real app
  return <AdminLogsPage />;
}

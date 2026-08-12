import { requireSession } from '@/server/bootstrap';
import { AnalyticsPage } from '@/features/dashboard/presentation/analytics-page';

export const metadata = {
  title: 'Workspace Analytics',
};

export default async function UsageRoute() {
  await requireSession(); // Ensure user is authenticated
  return <AnalyticsPage />;
}

import { getPublicSession } from '@/server/bootstrap';
import { DashboardOverview } from '@/features/dashboard';

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const session = (await getPublicSession()) || {
    id: 'mock-id',
    userId: 'mock-user',
    plan: 'enterprise',
    role: 'admin',
  };

  // In a real application, fetch this from the database or external API.
  const mockUsage = {
    scansUsed: 42,
    scansLimit: 60,
  };

  const userProps = {
    name: 'User', // Would be fetched from a profile table using session.userId
    email: 'user@example.com',
    plan: session.plan,
  };

  return (
    <DashboardOverview
      user={userProps}
      usage={mockUsage}
    />
  );
}

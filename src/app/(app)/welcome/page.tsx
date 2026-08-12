import { requireSession } from '@/server/bootstrap';
import { DashboardOverview } from '@/features/dashboard';
import { prisma } from '@/server/db/prisma';

export const metadata = {
  title: 'Dashboard',
};

export const instant = false;

export default async function DashboardPage() {
  const session = await requireSession();

  // Fetch real data
  const totalScans = await prisma.document.count({
    where: { userId: session.userId }
  });

  const activeDocuments = await prisma.documentAnalysis.count({
    where: { ownerId: session.userId, deletedAt: null }
  });

  const recentDocuments = await prisma.documentAnalysis.findMany({
    where: { ownerId: session.userId, deletedAt: null },
    orderBy: { analyzedAt: 'desc' },
    take: 5
  });

  let criticalCount = 0;
  let cautionCount = 0;

  for (const doc of recentDocuments) {
    if (doc.scoreLevel === 'critical') criticalCount++;
    if (doc.scoreLevel === 'caution') cautionCount++;
  }

  // Activity over last 7 days (mocked dates using DB aggregates ideally, but simple here)
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  
  const recentDocsForChart = await prisma.document.findMany({
    where: { userId: session.userId, createdAt: { gte: last7Days } },
    select: { createdAt: true }
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activityMap = new Map(days.map(d => [d, 0]));
  
  recentDocsForChart.forEach(d => {
    const dayName = days[d.createdAt.getDay()] as string;
    activityMap.set(dayName, (activityMap.get(dayName) || 0) + 1);
  });

  const scanActivityData = days.map(d => ({ label: d, value: activityMap.get(d) || 0 }));

  const dashboardData = {
    totalScans,
    activeDocuments,
    criticalRisks: criticalCount,
    recentDocuments: recentDocuments.map(d => ({
      id: d.id,
      name: d.title,
      risk: d.scoreLevel,
      analyzedAt: d.analyzedAt.toISOString(),
    })),
    scanActivityData
  };

  const mockUsage = {
    scansUsed: totalScans,
    scansLimit: 60,
  };

  const { serverEnv } = await import('@/config/env.server');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(serverEnv.SUPABASE_URL as string, serverEnv.SUPABASE_SERVICE_ROLE_KEY as string);
  
  const { data: { user } } = await supabase.auth.admin.getUserById(session.userId);
  const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  const userProps = {
    name: userName,
    email: user?.email || session.userId,
    plan: session.plan || 'enterprise',
  };

  return (
    <DashboardOverview
      user={userProps}
      usage={mockUsage}
      dashboardData={dashboardData}
    />
  );
}

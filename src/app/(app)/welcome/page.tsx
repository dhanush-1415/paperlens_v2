import { requireSession } from '@/server/bootstrap';
import { DashboardOverview } from '@/features/dashboard';
import { prisma } from '@/server/db/prisma';

export const metadata = {
  title: 'Dashboard',
};

export const instant = false;

export default async function DashboardPage() {
  const session = await requireSession();

  // Fetch real data in parallel
  const [
    totalScans,
    activeDocuments,
    recentDocuments,
    allCriticalCount,
    recentDocsForChart,
    userSubscription,
  ] = await Promise.all([
    prisma.documentAnalysis.count({
      where: { ownerId: session.userId, deletedAt: null },
    }),
    prisma.documentAnalysis.count({
      where: {
        ownerId: session.userId,
        deletedAt: null,
        scoreLevel: { in: ['critical', 'caution'] },
      },
    }),
    prisma.documentAnalysis.findMany({
      where: { ownerId: session.userId, deletedAt: null },
      orderBy: { analyzedAt: 'desc' },
      take: 5,
    }),
    prisma.documentAnalysis.count({
      where: { ownerId: session.userId, deletedAt: null, scoreLevel: 'critical' },
    }),
    prisma.documentAnalysis.findMany({
      where: {
        ownerId: session.userId,
        analyzedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000),
        },
      },
      select: { analyzedAt: true },
    }),
    prisma.userSubscription.findUnique({
      where: { userId: session.userId },
      include: { plan: true },
    }),
  ]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activityMap = new Map(days.map((d) => [d, 0]));

  recentDocsForChart.forEach((d) => {
    const dayName = days[d.analyzedAt.getDay()] as string;
    activityMap.set(dayName, (activityMap.get(dayName) || 0) + 1);
  });

  // Order days to start from 6 days ago up to today
  const orderedDays: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    orderedDays.push(days[d.getDay()] ?? 'Sun');
  }

  const scanActivityData = orderedDays.map((d) => ({ label: d, value: activityMap.get(d) || 0 }));

  const dashboardData = {
    totalScans,
    activeDocuments, // Now represents pending reviews (critical/caution)
    criticalRisks: allCriticalCount,
    recentDocuments: recentDocuments.map((d) => ({
      id: d.id,
      name: d.title,
      risk: d.scoreLevel,
      analyzedAt: d.analyzedAt.toISOString(),
    })),
    scanActivityData,
  };

  const usage = {
    scansUsed: userSubscription?.scansUsed || totalScans,
    scansLimit: userSubscription?.plan.quotaScansPerMonth || 60,
  };

  const { serverEnv } = await import('@/config/env.server');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    serverEnv.SUPABASE_URL as string,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  const {
    data: { user },
  } = await supabase.auth.admin.getUserById(session.userId);
  const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  const userProps = {
    name: userName,
    email: user?.email || session.userId,
    plan: session.plan || 'enterprise',
  };

  return <DashboardOverview user={userProps} usage={usage} dashboardData={dashboardData} />;
}

import { requireSession } from '@/server/bootstrap';
import { AnalyticsPage } from '@/features/dashboard/presentation/analytics-page';

export const metadata = {
  title: 'Analytics',
};

export default async function Page() {
  const session = await requireSession();
  const { prisma } = await import('@/server/db/prisma');
  
  const totalScans = await prisma.documentAnalysis.count({
    where: { ownerId: session.userId, deletedAt: null }
  });
  
  const vaultDocs = await prisma.document.count({
    where: { userId: session.userId }
  });
  
  const highRisk = await prisma.documentAnalysis.count({
    where: { ownerId: session.userId, deletedAt: null, scoreLevel: 'critical' }
  });
  
  const recentDocs = await prisma.documentAnalysis.findMany({
    where: { ownerId: session.userId, deletedAt: null },
    orderBy: { analyzedAt: 'desc' },
    take: 4
  });
  
  const recentActivity = recentDocs.map(doc => {
    let risk: 'safe' | 'caution' | 'critical' = 'safe';
    let status = 'Safe';
    if (doc.scoreLevel === 'critical') {
      risk = 'critical'; status = 'Critical';
    } else if (doc.scoreLevel === 'caution') {
      risk = 'caution'; status = 'Review';
    }
    
    return {
      file: doc.title,
      time: doc.analyzedAt.toLocaleDateString(),
      status,
      risk
    };
  });
  
  const processingVolume = Array(12).fill(Math.random() * 5 + 5);
  
  const data = { totalScans, vaultDocs, highRisk, recentActivity, processingVolume };

  return (
    <AnalyticsPage data={data} />
  );
}

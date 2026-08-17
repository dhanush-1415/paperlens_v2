import { requireSession } from '@/server/bootstrap';
import { BillingPage } from '@/features/billing';
import { getUserPlan, getUserInvoices } from '@/server/dal/plan';
import { prisma } from '@/server/db/prisma';
import { scoreOf } from '@/features/document-analysis/domain';

export const metadata = {
  title: 'Billing & Usage',
};

export const instant = false;

export default async function BillingRoute() {
  const session = await requireSession(); // Ensure user is authenticated
  
  const { plan, subscription } = await getUserPlan();

  const planData = {
    plan: {
      displayName: plan.displayName,
      quotaScansPerMonth: plan.quotaScansPerMonth,
    },
    subscription: {
      scansUsed: subscription.scansUsed,
      usageResetAt: subscription.usageResetAt.toISOString(),
    }
  };

  const dbSub = await prisma.userSubscription.findUnique({
    where: { userId: session.userId }
  });
  
  const paymentMethod = dbSub?.lemonSubscriptionId ? 'LemonSqueezy' 
                      : dbSub?.razorpaySubscriptionId ? 'Razorpay' 
                      : null;

  const analyses = await prisma.documentAnalysis.findMany({
    where: { ownerId: session.userId, deletedAt: null }
  });
  const { serverEnv } = await import('@/config/env.server');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(serverEnv.SUPABASE_URL as string, serverEnv.SUPABASE_SERVICE_ROLE_KEY as string);
  
  const { data: { user } } = await supabase.auth.admin.getUserById(session.userId);

  let criticalCount = 0;
  let cautionCount = 0;
  let safeCount = 0;

  for (const analysis of analyses) {
    const risk = scoreOf(analysis.flags as any).level;
    if (risk === 'critical') criticalCount++;
    else if (risk === 'caution') cautionCount++;
    else safeCount++;
  }

  const usageData = {
    totalDocuments: analyses.length,
    criticalCount,
    cautionCount,
    safeCount,
    memberSince: user?.created_at || new Date().toISOString(),
    lastScanDate: analyses.length > 0 ? analyses.reduce((latest, a) => new Date(Math.max(latest.getTime(), new Date(a.analyzedAt).getTime())), new Date(0)) : null
  };

  const invoices = await getUserInvoices(session.userId);

  return <BillingPage planData={planData} usageData={usageData} paymentMethod={paymentMethod} invoices={invoices} />;
}

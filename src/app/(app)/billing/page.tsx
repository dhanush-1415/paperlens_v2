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

  let plan: any = { displayName: 'Free Plan', quotaScansPerMonth: 10 };
  let subscription: any = { scansUsed: 0, usageResetAt: new Date() };
  let dbSub: any = null;
  let analyses: any[] = [];
  let invoices: any[] = [];

  try {
    const planResult = await getUserPlan();
    plan = planResult.plan;
    subscription = planResult.subscription;

    dbSub = await prisma.userSubscription.findUnique({
      where: { userId: session.userId },
    });

    analyses = await prisma.documentAnalysis.findMany({
      where: { ownerId: session.userId, deletedAt: null },
    });
    
    invoices = await getUserInvoices(session.userId);
  } catch (error) {
    console.error('Database connection failed gracefully on BillingRoute:', error);
  }

  const planData = {
    plan: {
      displayName: plan?.displayName || 'Free Plan',
      quotaScansPerMonth: plan?.quotaScansPerMonth || 10,
    },
    subscription: {
      scansUsed: subscription?.scansUsed || 0,
      usageResetAt: subscription?.usageResetAt?.toISOString() || new Date().toISOString(),
    },
  };

  const paymentMethod = dbSub?.lemonSubscriptionId
    ? 'LemonSqueezy'
    : dbSub?.razorpaySubscriptionId
      ? 'Razorpay'
      : null;
  const { serverEnv } = await import('@/config/env.server');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    serverEnv.SUPABASE_URL as string,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  const {
    data: { user },
  } = await supabase.auth.admin.getUserById(session.userId);

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
    lastScanDate:
      analyses.length > 0
        ? analyses.reduce(
            (latest, a) => new Date(Math.max(latest.getTime(), new Date(a.analyzedAt).getTime())),
            new Date(0),
          )
        : null,
  };



  return (
    <BillingPage
      planData={planData}
      usageData={usageData}
      paymentMethod={paymentMethod}
      invoices={invoices}
    />
  );
}

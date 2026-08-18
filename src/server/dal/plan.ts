import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';

export async function getUserPlan() {
  const session = await requireSession();
  const userId = session.userId;

  // 1. Fetch the user's active subscription with the plan details
  let sub = await prisma.userSubscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  // 2. Self-Healing/Fallback: If no subscription exists, assign Free plan
  // (Replaces the raw SQL trigger since Prisma doesn't support them natively)
  if (!sub) {
    const freePlan = await prisma.plan.findUnique({
      where: { tierName: 'free' },
    });

    if (!freePlan) {
      // If the plans table is completely empty, fail safely.
      // This should never happen once seed data is added.
      throw new Error('Critical: Default Free plan missing from database.');
    }

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    sub = await prisma.userSubscription.create({
      data: {
        userId,
        planId: freePlan.id,
        usageResetAt: nextMonth,
      },
      include: { plan: true },
    });
  }

  // 3. Lazy Reset Logic: If the reset date has passed, reset the quotas and bump the date
  // This completely eliminates the need for expensive cron jobs running at midnight.
  const now = new Date();
  if (sub.usageResetAt < now) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    sub = await prisma.userSubscription.update({
      where: { id: sub.id },
      data: {
        scansUsed: 0,
        chatMessagesUsed: 0,
        usageResetAt: nextMonth,
      },
      include: { plan: true },
    });
  }

  // 4. Compute strict entitlements
  const canScan = sub.scansUsed < sub.plan.quotaScansPerMonth;
  const canChat = sub.chatMessagesUsed < sub.plan.quotaChatMessagesPerMonth;

  return {
    subscription: sub,
    plan: sub.plan,
    entitlements: {
      canScan,
      canChat,
      hasVault: sub.plan.capVault,
      hasExport: sub.plan.capExport,
    },
  };
}

export async function incrementScanUsage(userId: string) {
  await prisma.userSubscription.update({
    where: { userId },
    data: {
      scansUsed: {
        increment: 1,
      },
    },
  });
}

export async function getUserInvoices(userId: string) {
  const sub = await prisma.userSubscription.findUnique({
    where: { userId },
  });
  if (!sub) return [];

  const invoices: any[] = [];

  if (sub.lemonCustomerId) {
    try {
      const { listOrders } = await import('@/lib/lemonsqueezy');
      const res = await listOrders({ filter: { customerId: sub.lemonCustomerId } as any });
      if (res.data) {
        for (const inv of res.data as any[]) {
          invoices.push({
            id: String(inv.id),
            date: new Date(inv.attributes.created_at).toLocaleDateString(),
            amount: `$${((inv.attributes.total as number) / 100).toFixed(2)}`,
            status: inv.attributes.status === 'paid' ? 'Paid' : inv.attributes.status,
            downloadUrl: inv.attributes.urls?.receipt || '#',
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch LemonSqueezy invoices', e);
    }
  } else if (sub.razorpayCustomerId) {
    try {
      const { getRazorpayInvoices } = await import('@/lib/razorpay');
      const rzpInvoices = await getRazorpayInvoices(sub.razorpayCustomerId);
      for (const inv of rzpInvoices as any[]) {
        invoices.push({
          id: inv.receipt || inv.id,
          date: new Date(((inv.created_at as number) || 0) * 1000).toLocaleDateString(),
          amount: `₹${(((inv.amount as number) || 0) / 100).toFixed(2)}`,
          status: inv.status === 'issued' ? 'Paid' : inv.status || 'Paid',
          downloadUrl: inv.short_url || '#',
        });
      }
    } catch (e) {
      console.error('Failed to fetch Razorpay invoices', e);
    }
  }

  return invoices;
}

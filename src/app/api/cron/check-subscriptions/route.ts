import { NextResponse } from 'next/server';
import { serverEnv } from '@/config/env.server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // TODO: Implement subscription checking logic
    // const { sendSubscriptionExpiryEmail } = await import('@/lib/emails/subscription-expiry');
    return NextResponse.json({ success: true, message: 'Subscription check ran' });
  } catch (error) {
    console.error('Failed to run subscription check cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

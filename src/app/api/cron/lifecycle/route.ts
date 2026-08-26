import { NextResponse } from 'next/server';
import { serverEnv } from '@/config/env.server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // TODO: Implement lifecycle logic (reengagement, winback, etc.)
    // const { sendReengagementEmail } = await import('@/lib/emails/reengagement');
    // const { sendWinbackProEmail } = await import('@/lib/emails/winback-pro');
    return NextResponse.json({ success: true, message: 'Lifecycle campaign ran' });
  } catch (error) {
    console.error('Failed to run lifecycle cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

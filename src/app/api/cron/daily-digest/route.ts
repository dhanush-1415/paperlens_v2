import { NextResponse } from 'next/server';
import { sendDailyDigest } from '@/lib/emails/daily-digest';
import { serverEnv } from '@/config/env.server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // In a full implementation, you would query analytics data here
    await sendDailyDigest(
      [],
      {
        total_events: 0,
        unique_users: 0,
        top_event: 'N/A',
        scans_today: 0,
        new_sign_ups: 0,
      },
      new Date().toLocaleDateString()
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to run daily digest cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

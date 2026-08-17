import { requireSession } from '@/server/bootstrap';
import { Heading, Text, Badge, DataTable } from '@/shared/ui';

export const metadata = {
  title: 'Admin - System Logs',
};

export default async function AdminLogsPage() {
  await requireSession();

  const { prisma } = await import('@/server/db/prisma');

  const recentDocs = await prisma.documentAnalysis.findMany({
    take: 50,
    orderBy: { analyzedAt: 'desc' },
  });

  let rawAuthLogs: any[] = [];
  try {
    rawAuthLogs = await prisma.$queryRaw`
      SELECT id, payload->>'actor_id' as user_id, payload->>'action' as action, created_at
      FROM auth.audit_log_entries 
      ORDER BY created_at DESC 
      LIMIT 25
    `;
  } catch (e) {
    console.error('Could not fetch auth audit logs:', e);
  }

  const authLogs = rawAuthLogs.map((log) => ({
    id: log.id,
    time: new Date(log.created_at).toLocaleString(),
    timeMs: new Date(log.created_at).getTime(),
    user: String(log.user_id).slice(0, 8) + '...',
    action: `User ${log.action === 'login' ? 'authenticated' : log.action === 'logout' ? 'signed out' : log.action}`,
    type: 'Auth',
  }));

  const scanLogs = recentDocs.map((doc) => ({
    id: doc.id,
    time: new Date(doc.analyzedAt).toLocaleString(),
    timeMs: new Date(doc.analyzedAt).getTime(),
    user: doc.ownerId.slice(0, 8) + '...',
    action: `Analyzed document: ${doc.title}`,
    type: 'Scan',
  }));

  const LIVE_LOGS = [...authLogs, ...scanLogs].sort((a, b) => b.timeMs - a.timeMs).slice(0, 50);

  const columns = [
    {
      id: 'time',
      header: 'Time',
      cell: (l: any) => <span className="font-medium text-text-secondary">{l.time}</span>,
    },
    { id: 'user', header: 'Actor', cell: (l: any) => <span className="font-bold">{l.user}</span> },
    { id: 'action', header: 'Action', cell: (l: any) => <span>{l.action}</span> },
    {
      id: 'type',
      header: 'Category',
      cell: (l: any) => <Badge tone={l.type === 'Auth' ? 'brand' : 'safe'}>{l.type}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div>
        <Heading level={1} size="lg" className="tracking-tight text-text-primary">
          System Logs
        </Heading>
        <Text tone="secondary" className="mt-1 text-sm font-medium">
          Audit trail of workspace activity.
        </Text>
      </div>

      <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <DataTable data={LIVE_LOGS} columns={columns} keyExtractor={(l) => l.id} />
      </div>
    </div>
  );
}

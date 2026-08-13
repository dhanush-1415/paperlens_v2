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

  const MOCK_LOGS = recentDocs.map(doc => ({
    id: doc.id,
    time: doc.analyzedAt.toLocaleString(),
    user: doc.ownerId.slice(0, 8),
    action: `Analyzed document: ${doc.title}`,
    type: 'System'
  }));

  const columns = [
    { id: 'time', header: 'Time', cell: (l: any) => <span className="font-medium text-text-secondary">{l.time}</span> },
    { id: 'user', header: 'Actor', cell: (l: any) => <span className="font-bold">{l.user}</span> },
    { id: 'action', header: 'Action', cell: (l: any) => <span>{l.action}</span> },
    { id: 'type', header: 'Category', cell: (l: any) => <Badge tone="neutral">{l.type}</Badge> },
  ];

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div>
        <Heading level={1} size="lg" className="tracking-tight text-text-primary">System Logs</Heading>
        <Text tone="secondary" className="mt-1 text-sm font-medium">Audit trail of workspace activity.</Text>
      </div>
      
      <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <DataTable data={MOCK_LOGS} columns={columns} keyExtractor={(l) => l.id} />
      </div>
    </div>
  );
}

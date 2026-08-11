'use client';

import { Heading, Text, Card, DataTable, type Column, Badge, Input } from '@/shared/ui';
import { SearchIcon } from '@/shared/ui/icons';
import { ClipboardListIcon } from '@/shared/ui/icons/dashboard-icons';

const LOGS = [
  { id: 'l1', timestamp: '2026-08-11 10:14:02', action: 'User login', actor: 'alex@example.com', target: '-', status: 'success' },
  { id: 'l2', timestamp: '2026-08-11 09:42:15', action: 'Document uploaded', actor: 'jane@example.com', target: 'Vendor_Agreement_v3.pdf', status: 'success' },
  { id: 'l3', timestamp: '2026-08-10 16:30:00', action: 'Password reset', actor: 'john@example.com', target: '-', status: 'failure' },
];

export function AdminLogsPage() {
  const columns: Column<typeof LOGS[0]>[] = [
    { id: 'timestamp', header: 'Timestamp', cell: (l) => <span className="font-medium text-text-primary text-xs">{l.timestamp}</span> },
    { id: 'action', header: 'Action', cell: (l) => <span className="text-text-secondary">{l.action}</span> },
    { id: 'actor', header: 'Actor', cell: (l) => <span className="text-text-secondary">{l.actor}</span> },
    { id: 'target', header: 'Target', cell: (l) => <span className="text-text-secondary">{l.target}</span> },
    { 
      id: 'status', 
      header: 'Status', 
      cell: (l) => (
        <Badge tone={l.status === 'success' ? 'safe' : 'critical'}>
          {l.status}
        </Badge>
      ) 
    },
  ];

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading level={1} size="lg">System Logs</Heading>
          <Text tone="secondary" className="mt-1">
            Audit trail of system activity and user actions.
          </Text>
        </div>
      </div>

      <Card className="flex flex-col shadow-card border-border-subtle overflow-hidden">
        <div className="p-4 border-b border-border-subtle bg-surface-2 flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
            <Input 
              type="search" 
              placeholder="Search logs..." 
              className="pl-9 bg-surface-1"
            />
          </div>
        </div>
        <DataTable data={LOGS} columns={columns} keyExtractor={(l) => l.id} />
      </Card>
    </div>
  );
}

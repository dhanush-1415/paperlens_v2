'use client';

import { Button, Heading, Text, Card, DataTable, type Column, Badge, Input } from '@/shared/ui';
import { SearchIcon } from '@/shared/ui/icons';
import { MoreVerticalIcon, UsersIcon } from '@/shared/ui/icons/dashboard-icons';

const USERS = [
  { id: '1', name: 'Alex Mercer', email: 'alex@example.com', role: 'admin', status: 'active', lastActive: '2 mins ago' },
  { id: '2', name: 'Jane Doe', email: 'jane@example.com', role: 'user', status: 'active', lastActive: '1 hour ago' },
  { id: '3', name: 'John Smith', email: 'john@example.com', role: 'user', status: 'suspended', lastActive: '3 days ago' },
];

export function AdminUsersPage() {
  const columns: Column<typeof USERS[0]>[] = [
    { 
      id: 'user', 
      header: 'User', 
      cell: (u) => (
        <div>
          <div className="font-medium text-text-primary">{u.name}</div>
          <div className="text-text-tertiary text-xs">{u.email}</div>
        </div>
      ) 
    },
    { 
      id: 'role', 
      header: 'Role', 
      cell: (u) => (
        <Badge tone={u.role === 'admin' ? 'brand' : 'neutral'}>
          {u.role.toUpperCase()}
        </Badge>
      ) 
    },
    { 
      id: 'status', 
      header: 'Status', 
      cell: (u) => (
        <Badge tone={u.status === 'active' ? 'safe' : 'critical'}>
          {u.status === 'active' ? 'Active' : 'Suspended'}
        </Badge>
      ) 
    },
    { id: 'lastActive', header: 'Last Active', cell: (u) => <span className="text-text-secondary">{u.lastActive}</span> },
    { 
      id: 'actions', 
      header: '', 
      cell: () => (
        <Button variant="ghost" size="sm" className="px-2">
          <MoreVerticalIcon className="size-4" />
        </Button>
      ) 
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading level={1} size="lg">User Management</Heading>
          <Text tone="secondary" className="mt-1">
            Manage organization users and roles.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button>Invite User</Button>
        </div>
      </div>

      <Card className="flex flex-col shadow-card border-border-subtle overflow-hidden">
        <div className="p-4 border-b border-border-subtle bg-surface-2 flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
            <Input 
              type="search" 
              placeholder="Search users..." 
              className="pl-9 bg-surface-1"
            />
          </div>
        </div>
        <DataTable data={USERS} columns={columns} keyExtractor={(u) => u.id} />
      </Card>
    </div>
  );
}

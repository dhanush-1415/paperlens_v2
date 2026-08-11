'use client';

import { useState } from 'react';
import { Button, Heading, Text, DataTable, EmptyState, Badge, Input, type Column } from '@/shared/ui';
import { SearchIcon, DocumentIcon, MenuIcon } from '@/shared/ui/icons';
import { LayoutDashboardIcon } from '@/shared/ui/icons/dashboard-icons';

interface VaultDocument {
  id: string;
  name: string;
  type: string;
  risk: 'critical' | 'caution' | 'safe';
  date: string;
  size: string;
}

const MOCK_DOCUMENTS: VaultDocument[] = [
  { id: '1', name: 'Vendor_Agreement_v3.pdf', type: 'Agreement', risk: 'critical', date: '2 hours ago', size: '2.4 MB' },
  { id: '2', name: 'Employee_Handbook_2026.pdf', type: 'Policy', risk: 'safe', date: '1 day ago', size: '1.1 MB' },
  { id: '3', name: 'Q3_Financial_Report.pdf', type: 'Report', risk: 'caution', date: '3 days ago', size: '5.6 MB' },
  { id: '4', name: 'NDA_Acme_Corp.pdf', type: 'NDA', risk: 'safe', date: '1 week ago', size: '0.8 MB' },
  { id: '5', name: 'Service_Level_Agreement.pdf', type: 'Agreement', risk: 'caution', date: '2 weeks ago', size: '3.2 MB' },
];

export function VaultPage() {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = MOCK_DOCUMENTS.filter((doc) => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<VaultDocument>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <DocumentIcon className="size-5 text-text-tertiary" />
          <span className="font-medium text-text-primary">{item.name}</span>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: (item) => <span className="text-text-secondary">{item.type}</span>,
    },
    {
      id: 'risk',
      header: 'Risk Level',
      cell: (item) => (
        <Badge tone={item.risk}>
          {item.risk === 'critical' ? 'High Risk' : item.risk === 'caution' ? 'Medium Risk' : 'Safe'}
        </Badge>
      ),
    },
    {
      id: 'date',
      header: 'Date Added',
      cell: (item) => <span className="text-text-secondary">{item.date}</span>,
    },
    {
      id: 'size',
      header: 'Size',
      cell: (item) => <span className="text-text-secondary">{item.size}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading level={1} size="lg">Document Vault</Heading>
          <Text tone="secondary" className="mt-1">
            Manage and organize your scanned documents.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button>Upload Document</Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-card border border-border-subtle bg-surface-1 p-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
            <Input 
              type="search" 
              placeholder="Search documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-control border border-border-subtle bg-surface-2 p-1">
            <button
              onClick={() => setView('list')}
              className={`rounded-sm p-1.5 transition-colors ${view === 'list' ? 'bg-surface-1 text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              aria-label="List view"
            >
              <MenuIcon className="size-4" />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`rounded-sm p-1.5 transition-colors ${view === 'grid' ? 'bg-surface-1 text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              aria-label="Grid view"
            >
              <LayoutDashboardIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {filteredDocs.length === 0 ? (
          <EmptyState
            title="No documents found"
            description={searchQuery ? 'Try adjusting your search terms.' : 'Upload a document to get started.'}
            filtered={!!searchQuery}
            action={!searchQuery && <Button>Upload Document</Button>}
          />
        ) : view === 'list' ? (
          <DataTable
            data={filteredDocs}
            columns={columns}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="group relative flex flex-col gap-4 rounded-card border border-border-subtle bg-surface-1 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-card hover:bg-surface-1/80 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                    <DocumentIcon className="size-5" />
                  </div>
                  <Badge tone={doc.risk}>
                    {doc.risk === 'critical' ? 'High Risk' : doc.risk === 'caution' ? 'Medium Risk' : 'Safe'}
                  </Badge>
                </div>
                <div>
                  <Heading level={3} size="sm" className="truncate" title={doc.name}>
                    {doc.name}
                  </Heading>
                  <Text size="xs" tone="secondary" className="mt-1">
                    {doc.type} • {doc.size}
                  </Text>
                </div>
                <div className="mt-2 text-xs text-text-tertiary">
                  Added {doc.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

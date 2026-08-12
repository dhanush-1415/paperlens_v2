'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Heading, Text, DataTable, EmptyState, Badge, Input, Checkbox, type Column } from '@/shared/ui';
import { SearchIcon, DocumentIcon, MenuIcon, CheckIcon, CloseIcon } from '@/shared/ui/icons';
import { LayoutDashboardIcon, VaultIcon, MoreVerticalIcon, UploadCloudIcon, FilterIcon, ArrowUpDownIcon } from '@/shared/ui/icons/dashboard-icons';

function useClickOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
}

function FilterDropdown({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const hasFilter = value !== 'all';

  const options = [
    { id: 'all', label: 'All Risks' },
    { id: 'critical', label: 'High Risk' },
    { id: 'caution', label: 'Needs Review' },
    { id: 'safe', label: 'Verified Safe' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${hasFilter ? 'border-brand-primary/50 bg-brand-primary text-white shadow-md' : 'border-brand-primary/20 bg-surface-1/50 text-text-secondary hover:text-brand-primary hover:bg-brand-primary/5'}`}
      >
        <FilterIcon className="size-4 shrink-0" />
        <span className="hidden sm:inline">Risk Filter</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border border-border-subtle bg-surface-1 py-1 shadow-lg animate-in fade-in zoom-in-95">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-surface-2 ${value === opt.id ? 'font-bold text-brand-primary' : 'font-medium text-text-secondary'}`}
            >
              <div className="flex size-4 items-center justify-center shrink-0">
                {value === opt.id && <CheckIcon className="size-3" />}
              </div>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SortDropdown({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  const options = [
    { id: 'newest', label: 'Newest First' },
    { id: 'oldest', label: 'Oldest First' },
    { id: 'risk', label: 'By Risk Level' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 items-center gap-2 rounded-xl border border-brand-primary/20 bg-surface-1/50 px-3 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-primary hover:bg-brand-primary/5"
      >
        <ArrowUpDownIcon className="size-4 shrink-0" />
        <span className="hidden sm:inline">{options.find(o => o.id === value)?.label || 'Sort'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-border-subtle bg-surface-1 py-1 shadow-lg animate-in fade-in zoom-in-95">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-surface-2 ${value === opt.id ? 'font-bold text-brand-primary' : 'font-medium text-text-secondary'}`}
            >
              <div className="flex size-4 items-center justify-center shrink-0">
                {value === opt.id && <CheckIcon className="size-3" />}
              </div>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface VaultDocument {
  id: string;
  name: string;
  type: string;
  risk: 'critical' | 'caution' | 'safe';
  date: string;
  size: string;
}

const MOCK_FOLDERS = [
  { id: 'f1', name: 'Vendor Contracts', count: 12 },
  { id: 'f2', name: 'HR Policies 2026', count: 5 },
  { id: 'f3', name: 'Financial NDAs', count: 8 },
];

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
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredDocs = MOCK_DOCUMENTS.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = filterRisk === 'all' || doc.risk === filterRisk;
    return matchesSearch && matchesRisk;
  }).sort((a, b) => {
    if (sortBy === 'newest') return -1; // Mock sort
    if (sortBy === 'oldest') return 1;
    if (sortBy === 'risk') {
      const riskScore = { critical: 3, caution: 2, safe: 1 };
      return riskScore[b.risk] - riskScore[a.risk];
    }
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocs.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const columns: Column<VaultDocument>[] = [
    {
      id: 'select',
      header: (
        <Checkbox 
          checked={selectedIds.size === filteredDocs.length && filteredDocs.length > 0} 
          onChange={toggleSelectAll} 
        />
      ),
      cell: (item) => (
        <Checkbox 
          checked={selectedIds.has(item.id)} 
          onChange={() => toggleSelect(item.id)} 
        />
      ),
    },
    {
      id: 'name',
      header: 'Name',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-text-tertiary">
            <DocumentIcon className="size-4" />
          </div>
          <span className="font-semibold text-text-primary hover:text-brand-primary cursor-pointer transition-colors">{item.name}</span>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: (item) => <span className="font-medium text-text-secondary">{item.type}</span>,
    },
    {
      id: 'risk',
      header: 'Risk Level',
      cell: (item) => (
        <Badge tone={item.risk} className="shadow-sm font-bold">
          {item.risk === 'critical' ? 'High Risk' : item.risk === 'caution' ? 'Needs Review' : 'Verified Safe'}
        </Badge>
      ),
    },
    {
      id: 'date',
      header: 'Date Added',
      cell: (item) => <span className="font-medium text-text-secondary">{item.date}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: () => (
        <div className="flex justify-end">
          <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-3 rounded-xl transition-colors">
            <MoreVerticalIcon className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
        <div className="relative z-10">
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">
            Document Vault
          </Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">
            Access, manage, and organize all your AI-analyzed contracts and legal documents.
          </Text>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button variant="secondary" className="font-bold hidden sm:flex border-border-subtle bg-surface-1 shadow-sm hover:border-brand-primary/40 hover:text-brand-primary transition-all h-10">
            New Folder
          </Button>
          <button 
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:-translate-y-0.5 transition-all group"
            title="Upload Document"
          >
            <UploadCloudIcon className="size-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Folders Section */}
      <div className="flex flex-col gap-3">
        <Text size="xs" className="font-bold uppercase tracking-wider text-text-tertiary ml-1">Quick Access</Text>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_FOLDERS.map(folder => (
            <div key={folder.id} className="group relative flex items-center gap-4 rounded-[1.25rem] border border-border-subtle bg-gradient-to-br from-surface-1 to-brand-primary/[0.01] p-4 transition-all duration-300 hover:border-brand-primary/30 hover:shadow-md hover:-translate-y-0.5 cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-primary/[0.03] to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors shadow-sm">
                <VaultIcon className="size-5" />
              </div>
              <div className="relative flex-1">
                <Heading level={3} className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">{folder.name}</Heading>
                <Text size="xs" className="mt-0.5 font-medium text-text-tertiary group-hover:text-brand-primary/70">{folder.count} Documents</Text>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-3">
        <Text size="xs" className="font-bold uppercase tracking-wider text-text-tertiary ml-1">Documents</Text>
        
        {/* Controls Bar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-border-subtle bg-surface-1 p-2 shadow-sm">
          
          <div className="flex flex-1 items-center gap-3 pl-1">
            <div className="relative w-full max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
              <Input 
                type="search" 
                placeholder="Search files..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm rounded-lg bg-surface-2 border-transparent focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FilterDropdown value={filterRisk} onChange={setFilterRisk} />
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
            
            <div className="h-6 w-px bg-border-subtle mx-1 hidden sm:block" />
            
            <div className="flex rounded-lg border border-border-subtle bg-surface-2 p-0.5">
              <button
                onClick={() => setView('list')}
                className={`rounded-md p-1.5 transition-all ${view === 'list' ? 'bg-surface-1 text-brand-primary shadow-sm ring-1 ring-border-strong/10' : 'text-text-tertiary hover:text-text-primary'}`}
                aria-label="List view"
              >
                <MenuIcon className="size-4" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`rounded-md p-1.5 transition-all ${view === 'grid' ? 'bg-surface-1 text-brand-primary shadow-sm ring-1 ring-border-strong/10' : 'text-text-tertiary hover:text-text-primary'}`}
                aria-label="Grid view"
              >
                <LayoutDashboardIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (Shows only when items are selected) */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-[1rem] border border-brand-primary/30 bg-brand-primary/5 px-6 py-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <Badge tone="neutral" className="bg-brand-primary text-white border-none font-bold">
                {selectedIds.size} Selected
              </Badge>
              <Text size="sm" className="font-semibold text-text-primary">
                Choose an action for the selected documents
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" className="font-bold">Move to Folder</Button>
              <Button size="sm" className="bg-critical hover:bg-critical-fg text-white border-none font-bold">Delete</Button>
              <button onClick={() => setSelectedIds(new Set())} className="p-2 text-text-tertiary hover:text-text-primary transition-colors">
                <CloseIcon className="size-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 mt-2">
          {filteredDocs.length === 0 ? (
            <div className="flex items-center justify-center py-24 rounded-[2rem] border border-dashed border-border-strong bg-surface-1/50">
              <EmptyState
                title="No documents found"
                description={searchQuery ? 'Try adjusting your search or filters.' : 'Upload your first contract to get started.'}
                filtered={!!searchQuery}
                action={!searchQuery && <Button className="font-bold shadow-md"><UploadCloudIcon className="size-4 mr-2" /> Upload Document</Button>}
              />
            </div>
          ) : view === 'list' ? (
            <div className="overflow-hidden rounded-xl border border-border-subtle shadow-sm bg-surface-1">
              <DataTable
                data={filteredDocs}
                columns={columns}
                keyExtractor={(item) => item.id}
                className="border-none shadow-none rounded-none"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="group relative flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-1 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-md cursor-pointer">
                  
                  <div className="absolute top-4 right-4 z-10">
                    <Checkbox 
                      checked={selectedIds.has(doc.id)} 
                      onChange={() => toggleSelect(doc.id)} 
                      className={selectedIds.has(doc.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}
                    />
                  </div>

                  <div className="flex items-start justify-between mt-2">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-surface-2 text-text-tertiary group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                      <DocumentIcon className="size-6" />
                    </div>
                  </div>
                  
                  <div>
                    <Heading level={3} size="sm" className="truncate font-bold group-hover:text-brand-primary transition-colors" title={doc.name}>
                      {doc.name}
                    </Heading>
                    <Text size="xs" tone="secondary" className="mt-1 font-medium">
                      {doc.type} • {doc.size}
                    </Text>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-border-subtle">
                    <Badge tone={doc.risk} className="font-bold shadow-sm">
                      {doc.risk === 'critical' ? 'High Risk' : doc.risk === 'caution' ? 'Needs Review' : 'Verified Safe'}
                    </Badge>
                    <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                      {doc.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

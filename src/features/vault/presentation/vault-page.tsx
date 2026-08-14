'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Heading, Text, DataTable, EmptyState, Badge, Input, Checkbox, Switch, type Column, cn } from '@/shared/ui';
import { Dialog } from '@/shared/ui/components/dialog';
import { SearchIcon, DocumentIcon, MenuIcon, CheckIcon, CloseIcon } from '@/shared/ui/icons';
import { LayoutDashboardIcon, VaultIcon, MoreVerticalIcon, UploadCloudIcon, FilterIcon, ArrowUpDownIcon } from '@/shared/ui/icons/dashboard-icons';
import { DeadlineTimeline } from './deadline-timeline';
import { toggleResolvedAction, deleteDocumentAction, createFolderAction, bulkMoveToFolderAction, renameFolderAction, deleteFolderOnlyAction, deleteFolderAndDocsAction } from '../actions';
import { Eye, CheckCircle2, Trash2, XCircle, Loader2, FolderInput, FolderX, Pencil, ChevronLeft } from 'lucide-react';

export interface VaultDocument {
  id: string;
  name: string;
  type: string;
  risk: 'critical' | 'caution' | 'safe';
  resolved: boolean;
  folderId?: string | null;
  deadlineDate?: string | null;
  date: string;
  size: string;
}

const formatDisplayDate = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
};

export function ActionDropdown({ doc, onUpdate, onDelete, onMoveRequest }: { doc: VaultDocument, onUpdate?: (id: string, updates: Partial<VaultDocument>) => void, onDelete?: (id: string) => void, onMoveRequest?: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleResolved = () => {
    startTransition(async () => {
      try {
        const newResolved = !doc.resolved;
        // Optimistic local update
        onUpdate?.(doc.id, { resolved: newResolved });
        await toggleResolvedAction(doc.id, newResolved);
      } catch (e) {
        console.error(e);
        // Revert on error
        onUpdate?.(doc.id, { resolved: doc.resolved });
      }
      setIsOpen(false);
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this document? This cannot be undone.")) return;
    
    startTransition(async () => {
      try {
        // Optimistic local delete
        onDelete?.(doc.id);
        await deleteDocumentAction(doc.id);
      } catch (e) {
        console.error(e);
      }
      setIsOpen(false);
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-3 rounded-xl transition-colors cursor-pointer"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
      >
        <MoreVerticalIcon className="size-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-[1rem] bg-surface-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-border-strong/20 z-50 overflow-hidden py-1">
          <button 
            onClick={(e) => { e.stopPropagation(); router.push(`/document/${doc.id}`); setIsOpen(false); }}
            disabled={isPending}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors text-left disabled:opacity-50"
          >
            <Eye className="size-4" />
            View Document
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleToggleResolved(); }}
            disabled={isPending}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors text-left disabled:opacity-50"
          >
            {doc.resolved ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
            {doc.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); onMoveRequest?.(doc.id); }}
            disabled={isPending}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors text-left disabled:opacity-50"
          >
            <FolderInput className="size-4" />
            Move to Folder
          </button>
          <div className="h-px bg-border-subtle my-1 mx-2" />
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            disabled={isPending}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            Delete Document
          </button>
        </div>
      )}
    </div>
  );
}

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



interface VaultFolder {
  id: string;
  name: string;
  count: number;
}

export function VaultPage() {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, startFolderTransition] = useTransition();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [isRenamingFolder, startRenameTransition] = useTransition();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<'only' | 'all'>('only');
  const [deleteTypedName, setDeleteTypedName] = useState('');
  const [isDeletingFolder, startDeleteTransition] = useTransition();

  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [docsToMove, setDocsToMove] = useState<string[]>([]);
  const [isMoving, startMoveTransition] = useTransition();

  const handleOpenMoveDialog = (docIds: string[]) => {
    setDocsToMove(docIds);
    setIsMoveDialogOpen(true);
  };

  const handleMoveDocuments = (folderId: string | null) => {
    startMoveTransition(async () => {
      try {
        await bulkMoveToFolderAction(docsToMove, folderId);
        setIsMoveDialogOpen(false);
        setSelectedIds(new Set());
        // Refresh the list
        const res = await fetch('/api/vault/list');
        if (res.ok) {
          const data = await res.json();
          setFolders(data.folders || []);
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleRenameFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!renameFolderName.trim() || !renameFolderId) return;

    startRenameTransition(async () => {
      try {
        await renameFolderAction(renameFolderId, renameFolderName);
        setIsRenameDialogOpen(false);
        setRenameFolderId(null);
        setRenameFolderName('');
        
        const res = await fetch('/api/vault/list');
        if (res.ok) {
          const data = await res.json();
          setFolders(data.folders || []);
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deleteFolderId) return;
    
    const folder = folders.find(f => f.id === deleteFolderId);
    if (!folder || deleteTypedName !== folder.name) return;

    startDeleteTransition(async () => {
      try {
        if (deleteMode === 'all') {
          await deleteFolderAndDocsAction(deleteFolderId);
        } else {
          await deleteFolderOnlyAction(deleteFolderId);
        }
        
        setIsDeleteDialogOpen(false);
        setDeleteFolderId(null);
        setDeleteTypedName('');
        
        if (selectedFolderId === deleteFolderId) {
          setSelectedFolderId(null);
        }

        const res = await fetch('/api/vault/list');
        if (res.ok) {
          const data = await res.json();
          setFolders(data.folders || []);
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleCreateFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFolderName.trim()) return;
    
    startFolderTransition(async () => {
      try {
        await createFolderAction(newFolderName);
        setIsFolderDialogOpen(false);
        setNewFolderName('');
        // Refresh the list
        const res = await fetch('/api/vault/list');
        if (res.ok) {
          const data = await res.json();
          setFolders(data.folders || []);
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDocumentUpdate = (id: string, updates: Partial<VaultDocument>) => {
    setDocuments(docs => docs.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const handleDocumentDelete = (id: string) => {
    setDocuments(docs => docs.filter(d => d.id !== id));
  };

  const [isSearching, setIsSearching] = useState(false);

  // Initial Load
  useEffect(() => {
    async function loadVault() {
      if (searchQuery) return; // handled by search effect
      try {
        setIsLoading(true);
        const res = await fetch('/api/vault/list');
        if (res.ok) {
          const data = await res.json();
          setFolders(data.folders || []);
          setDocuments(data.documents || []);
        } else {
          const text = await res.text();
          console.error('Vault API Error Body:', text);
        }
      } catch (err) {
        console.error('Vault Fetch Exception:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadVault();
  }, [searchQuery === '']); // only reload list when search is cleared

  // Search Debounce Effect
  useEffect(() => {
    if (!searchQuery) return;
    
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/vault/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const filteredDocs = documents.filter((doc) => {
    const matchesRisk = filterRisk === 'all' || doc.risk === filterRisk;
    
    let matchesFolder = false;
    if (selectedFolderId) {
      matchesFolder = doc.folderId === selectedFolderId;
    } else {
      matchesFolder = showAllDocuments || !doc.folderId;
    }
    
    return matchesRisk && matchesFolder;
  }).sort((a, b) => {
    if (sortBy === 'newest') return -1; // Temporary sort logic
    if (sortBy === 'oldest') return 1;
    if (sortBy === 'risk') {
      const riskScore = { critical: 3, caution: 2, safe: 1 };
      return riskScore[b.risk as keyof typeof riskScore] - riskScore[a.risk as keyof typeof riskScore];
    }
    return 0;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRisk, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / pageSize));
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
        <div className="flex items-center gap-3" onClick={() => router.push(`/document/${item.id}`)}>
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
      cell: (item) => <span className="font-medium text-text-secondary">{formatDisplayDate(item.date)}</span>,
    },
    {
      id: 'actions',
      header: 'ACTION',
      cell: (item) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <ActionDropdown doc={item} onUpdate={handleDocumentUpdate} onDelete={handleDocumentDelete} onMoveRequest={(id) => handleOpenMoveDialog([id])} />
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
          <Button 
            variant="secondary" 
            onClick={() => setIsFolderDialogOpen(true)}
            disabled={isLoading}
            className="font-bold hidden sm:flex border-border-subtle bg-surface-1 shadow-sm hover:border-brand-primary/40 hover:text-brand-primary transition-all h-10 disabled:opacity-50"
          >
            New Folder
          </Button>
          <button 
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:-translate-y-0.5 transition-all group disabled:opacity-50 disabled:pointer-events-none"
            title="Upload Document"
          >
            <UploadCloudIcon className="size-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Deadline Timeline */}
      <DeadlineTimeline docs={documents} />

      {/* Folders Section */}
      {!selectedFolderId ? (
        <div className="flex flex-col gap-3">
          <Text size="xs" className="font-bold uppercase tracking-wider text-text-tertiary ml-1">Quick Access</Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.length === 0 ? (
              <div className="col-span-full py-8 text-center rounded-[1.25rem] border border-dashed border-border-strong bg-surface-1/50">
                <Text size="sm" tone="tertiary" className="italic">No folders yet. Create one to start organizing.</Text>
              </div>
            ) : (
              folders.map(folder => (
                <div key={folder.id} onClick={() => setSelectedFolderId(folder.id)} className="group relative flex items-center gap-4 rounded-[1.25rem] border border-border-subtle bg-gradient-to-br from-surface-1 to-brand-primary/[0.01] p-4 transition-all duration-300 hover:border-brand-primary/30 hover:shadow-md hover:-translate-y-0.5 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-primary/[0.03] to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                  <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors shadow-sm">
                    <VaultIcon className="size-5" />
                  </div>
                  <div className="relative flex-1">
                    <Heading level={3} className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">{folder.name}</Heading>
                    <Text size="xs" className="mt-0.5 font-medium text-text-tertiary group-hover:text-brand-primary/70">{folder.count} Documents</Text>
                  </div>
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setRenameFolderId(folder.id); setRenameFolderName(folder.name); setIsRenameDialogOpen(true); }}
                      className="p-2 text-text-tertiary hover:text-brand-primary transition-colors bg-surface-1 rounded-md shadow-sm"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteFolderId(folder.id); setDeleteTypedName(''); setIsDeleteDialogOpen(true); }}
                      className="p-2 text-text-tertiary hover:text-red-500 transition-colors bg-surface-1 rounded-md shadow-sm ml-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 -mb-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedFolderId(null)} className="text-text-secondary hover:text-text-primary -ml-2">
            <ChevronLeft className="size-4 mr-1" />
            Back to Main Vault
          </Button>
          <div className="h-4 w-px bg-border-subtle" />
          <Heading level={3} className="text-sm font-bold text-text-primary flex items-center gap-2">
            <VaultIcon className="size-4 text-brand-primary" />
            {folders.find(f => f.id === selectedFolderId)?.name || 'Folder'}
          </Heading>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Text size="xs" className="font-bold uppercase tracking-wider text-text-tertiary ml-1">Documents</Text>
        
        {!selectedFolderId && documents.some(d => d.folderId) && (
          <div className="flex items-center gap-2">
            <Switch 
               id="show-all"
               checked={showAllDocuments}
               onChange={(e) => setShowAllDocuments(e.target.checked)}
               className="scale-75"
            />
            <label htmlFor="show-all" className="text-xs font-medium text-text-secondary cursor-pointer select-none">
              Show all
            </label>
          </div>
        )}
      </div>
        
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
              <Button variant="secondary" size="sm" className="font-bold" onClick={() => handleOpenMoveDialog(Array.from(selectedIds))}>
                Move to Folder
              </Button>
              <Button size="sm" className="bg-critical hover:bg-critical-fg text-white border-none font-bold">Delete</Button>
              <button onClick={() => setSelectedIds(new Set())} className="p-2 text-text-tertiary hover:text-text-primary transition-colors">
                <CloseIcon className="size-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 mt-2">
          {isLoading || isSearching ? (
            <div className="flex items-center justify-center py-24 rounded-[2rem] border border-dashed border-border-strong bg-surface-1/50">
              <Text tone="secondary" className="font-medium animate-pulse">
                {isSearching ? 'Searching Vault...' : 'Loading Vault...'}
              </Text>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex items-center justify-center py-24 rounded-[2rem] border border-dashed border-border-strong bg-surface-1/50">
              <EmptyState
                title="No documents found"
                description={searchQuery ? 'Try adjusting your search or filters.' : 'Upload your first contract to get started.'}
                filtered={!!searchQuery}
                action={!searchQuery && <Button className="font-bold shadow-md"><UploadCloudIcon className="size-4 mr-2" /> Upload Document</Button>}
              />
            </div>
          ) : view === 'list' ? (
          <>
            <DataTable 
              data={paginatedDocs} 
              columns={columns} 
              keyExtractor={(item) => item.id}
            />
            {filteredDocs.length > 0 && (
              <div className="flex items-center justify-between border-t border-border-subtle pt-4 mt-2 px-1">
                <Text size="sm" tone="secondary" className="font-medium">
                  Showing <span className="font-bold text-text-primary">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-text-primary">{Math.min(currentPage * pageSize, filteredDocs.length)}</span> of <span className="font-bold text-text-primary">{filteredDocs.length}</span> results
                </Text>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="h-8 px-3 text-xs"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="h-8 px-3 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
            <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedDocs.map((doc) => (
                <div key={doc.id} onClick={() => router.push(`/document/${doc.id}`)} className="group relative flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-1 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-md cursor-pointer">
                  
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
                    <div className="z-10" onClick={(e) => e.stopPropagation()}>
                      <ActionDropdown doc={doc} onUpdate={handleDocumentUpdate} onDelete={handleDocumentDelete} />
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
                      {formatDisplayDate(doc.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredDocs.length > 0 && (
              <div className="flex items-center justify-between border-t border-border-subtle pt-4 mt-2 px-1">
                <Text size="sm" tone="secondary" className="font-medium">
                  Showing <span className="font-bold text-text-primary">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-text-primary">{Math.min(currentPage * pageSize, filteredDocs.length)}</span> of <span className="font-bold text-text-primary">{filteredDocs.length}</span> results
                </Text>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="h-8 px-3 text-xs"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="h-8 px-3 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>
      
      <Dialog 
        open={isFolderDialogOpen} 
        onClose={() => !isCreatingFolder && setIsFolderDialogOpen(false)}
        title="Create New Folder"
        description="Name your folder to organize your documents."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsFolderDialogOpen(false)} disabled={isCreatingFolder}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={isCreatingFolder || !newFolderName.trim()}>
              {isCreatingFolder ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Create
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateFolder} className="py-4">
          <Input 
            placeholder="e.g. Tax Documents" 
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            disabled={isCreatingFolder}
            maxLength={60}
            autoFocus
          />
        </form>
      </Dialog>

      <Dialog 
        open={isMoveDialogOpen} 
        onClose={() => !isMoving && setIsMoveDialogOpen(false)}
        title="Move to Folder"
        description={`Select a folder to move ${docsToMove.length} document${docsToMove.length === 1 ? '' : 's'} to.`}
      >
        <div className="py-4 flex flex-col gap-2 max-h-64 overflow-y-auto">
          {folders.length === 0 && (
            <Text size="sm" tone="tertiary" className="italic text-center py-4">No folders exist. Create one first.</Text>
          )}
          {folders.length > 0 && docsToMove.some(id => documents.find(d => d.id === id)?.folderId) && (
            <button
              onClick={() => handleMoveDocuments(null)}
              disabled={isMoving}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-border-subtle bg-surface-1 hover:bg-surface-2 transition-colors text-left"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-text-secondary">
                <LayoutDashboardIcon className="size-4" />
              </div>
              <span className="font-medium text-text-primary text-sm">Remove from Folder (Main Vault)</span>
            </button>
          )}
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => handleMoveDocuments(f.id)}
              disabled={isMoving}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-border-subtle bg-surface-1 hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-colors text-left"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-brand-primary">
                <VaultIcon className="size-4" />
              </div>
              <span className="font-medium text-text-primary text-sm flex-1">{f.name}</span>
            </button>
          ))}
        </div>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog 
        open={isRenameDialogOpen} 
        onClose={() => !isRenamingFolder && setIsRenameDialogOpen(false)}
        title="Rename Folder"
        description="Choose a new name for your folder."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsRenameDialogOpen(false)} disabled={isRenamingFolder}>
              Cancel
            </Button>
            <Button onClick={handleRenameFolder} disabled={isRenamingFolder || !renameFolderName.trim()}>
              {isRenamingFolder ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Rename
            </Button>
          </>
        }
      >
        <form onSubmit={handleRenameFolder} className="py-4">
          <Input 
            placeholder="Folder name" 
            value={renameFolderName}
            onChange={(e) => setRenameFolderName(e.target.value)}
            disabled={isRenamingFolder}
            maxLength={60}
            autoFocus
          />
        </form>
      </Dialog>

      {/* Delete Folder Dialog */}
      <Dialog 
        open={isDeleteDialogOpen} 
        onClose={() => !isDeletingFolder && setIsDeleteDialogOpen(false)}
        title="Delete Folder"
        description="Choose what to do with the documents inside this folder."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeletingFolder}>
              Cancel
            </Button>
            <Button 
              className="bg-critical hover:bg-critical-fg border-none text-white" 
              onClick={handleDeleteFolder} 
              disabled={isDeletingFolder || deleteTypedName !== folders.find(f => f.id === deleteFolderId)?.name}
            >
              {isDeletingFolder ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </>
        }
      >
        <form onSubmit={handleDeleteFolder} className="py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setDeleteMode('only')}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors text-left ${deleteMode === 'only' ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle bg-surface-1 hover:bg-surface-2'}`}
            >
              <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${deleteMode === 'only' ? 'border-brand-primary' : 'border-border-strong'}`}>
                {deleteMode === 'only' && <div className="size-2 rounded-full bg-brand-primary" />}
              </div>
              <div>
                <span className={`block text-sm font-semibold ${deleteMode === 'only' ? 'text-brand-primary' : 'text-text-primary'}`}>Keep Documents</span>
                <span className="block text-xs text-text-secondary mt-0.5">Documents will be moved to the Main Vault.</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setDeleteMode('all')}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors text-left ${deleteMode === 'all' ? 'border-critical bg-critical/5' : 'border-border-subtle bg-surface-1 hover:bg-surface-2'}`}
            >
              <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${deleteMode === 'all' ? 'border-critical' : 'border-border-strong'}`}>
                {deleteMode === 'all' && <div className="size-2 rounded-full bg-critical" />}
              </div>
              <div>
                <span className={`block text-sm font-semibold ${deleteMode === 'all' ? 'text-critical' : 'text-text-primary'}`}>Delete Everything</span>
                <span className="block text-xs text-text-secondary mt-0.5">Deletes this folder and permanently deletes all {folders.find(f => f.id === deleteFolderId)?.count || 0} documents inside it.</span>
              </div>
            </button>
          </div>
          
          <div className="mt-2">
            <Text size="sm" className="mb-2 font-medium text-text-primary">
              Please type <strong className="font-bold text-text-primary select-all">{folders.find(f => f.id === deleteFolderId)?.name}</strong> to confirm.
            </Text>
            <Input 
              placeholder={folders.find(f => f.id === deleteFolderId)?.name} 
              value={deleteTypedName}
              onChange={(e) => setDeleteTypedName(e.target.value)}
              disabled={isDeletingFolder}
              className="border-critical/30 focus-visible:ring-critical/20 focus-visible:border-critical"
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Heading,
  Text,
  DataTable,
  EmptyState,
  Badge,
  Input,
  Checkbox,
  Switch,
  type Column,
  cn,
} from '@/shared/ui';
import { Dialog } from '@/shared/ui/components/dialog';
import { SearchIcon, DocumentIcon, MenuIcon, CheckIcon, CloseIcon } from '@/shared/ui/icons';
import {
  LayoutDashboardIcon,
  VaultIcon,
  MoreVerticalIcon,
  UploadCloudIcon,
  FilterIcon,
  ArrowUpDownIcon,
} from '@/shared/ui/icons/dashboard-icons';
import { DeadlineTimeline } from './deadline-timeline';
import {
  toggleResolvedAction,
  deleteDocumentAction,
  bulkDeleteDocumentsAction,
  createFolderAction,
  bulkMoveToFolderAction,
  renameFolderAction,
  deleteFolderOnlyAction,
  deleteFolderAndDocsAction,
} from '../actions';
import {
  Eye,
  CheckCircle2,
  Trash2,
  XCircle,
  Loader2,
  FolderInput,
  FolderX,
  Pencil,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

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
      minute: '2-digit',
    });
  } catch (e) {
    return isoString;
  }
};

export function ActionDropdown({
  doc,
  onUpdate,
  onDelete,
  onMoveRequest,
  onRemoveFromFolder,
}: {
  doc: VaultDocument;
  onUpdate?: (id: string, updates: Partial<VaultDocument>) => void;
  onDelete?: (id: string) => void;
  onMoveRequest?: (id: string) => void;
  onRemoveFromFolder?: (id: string) => void;
}) {
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
    if (!window.confirm('Are you sure you want to delete this document? This cannot be undone.'))
      return;

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
        className="hover:bg-surface-3 cursor-pointer rounded-xl p-2 text-text-tertiary transition-colors hover:text-text-primary"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <MoreVerticalIcon className="size-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-[1rem] bg-surface-1 py-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-border-strong/20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/document/${doc.id}`);
              setIsOpen(false);
            }}
            disabled={isPending}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary disabled:opacity-50"
          >
            <Eye className="size-4" />
            View Document
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleResolved();
            }}
            disabled={isPending}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary disabled:opacity-50"
          >
            {doc.resolved ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
            {doc.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onMoveRequest?.(doc.id);
            }}
            disabled={isPending}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary disabled:opacity-50"
          >
            <FolderInput className="size-4" />
            Move to Folder
          </button>
          {doc.folderId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onRemoveFromFolder?.(doc.id);
              }}
              disabled={isPending}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary disabled:opacity-50"
            >
              <LayoutDashboardIcon className="size-4" />
              Remove from Folder
            </button>
          )}
          <div className="mx-2 my-1 h-px bg-border-subtle" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isPending}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-500/10"
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

function FilterDropdown({ value, onChange }: { value: string; onChange: (val: string) => void }) {
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
        className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${hasFilter ? 'border-brand-primary/50 bg-brand-primary text-white shadow-md' : 'border-brand-primary/20 bg-surface-1/50 text-text-secondary hover:bg-brand-primary/5 hover:text-brand-primary'}`}
      >
        <FilterIcon className="size-4 shrink-0" />
        <span className="hidden sm:inline">Risk Filter</span>
      </button>

      {open && (
        <div className="animate-in fade-in zoom-in-95 absolute top-full left-0 z-50 mt-2 w-48 rounded-xl border border-border-subtle bg-surface-1 py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2 ${value === opt.id ? 'font-bold text-brand-primary' : 'font-medium text-text-secondary'}`}
            >
              <div className="flex size-4 shrink-0 items-center justify-center">
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

function SortDropdown({ value, onChange }: { value: string; onChange: (val: string) => void }) {
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
        className="flex h-10 items-center gap-2 rounded-xl border border-brand-primary/20 bg-surface-1/50 px-3 text-sm font-semibold text-text-secondary transition-colors hover:bg-brand-primary/5 hover:text-brand-primary"
      >
        <ArrowUpDownIcon className="size-4 shrink-0" />
        <span className="hidden sm:inline">
          {options.find((o) => o.id === value)?.label || 'Sort'}
        </span>
      </button>

      {open && (
        <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-2 w-44 rounded-xl border border-border-subtle bg-surface-1 py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2 ${value === opt.id ? 'font-bold text-brand-primary' : 'font-medium text-text-secondary'}`}
            >
              <div className="flex size-4 shrink-0 items-center justify-center">
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

  const handleBulkDelete = () => {
    if (
      !window.confirm(`Are you sure you want to permanently delete ${selectedIds.size} documents?`)
    )
      return;

    startDeleteTransition(async () => {
      try {
        await bulkDeleteDocumentsAction(Array.from(selectedIds));
        setSelectedIds(new Set());
        // Refresh the list
        const res = await fetch('/api/vault/list');
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleOpenMoveDialog = (docIds: string[]) => {
    setDocsToMove(docIds);
    setIsMoveDialogOpen(true);
  };

  const handleRemoveFromFolder = (docId: string) => {
    startMoveTransition(async () => {
      try {
        await bulkMoveToFolderAction([docId], null);
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

    const folder = folders.find((f) => f.id === deleteFolderId);
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
    setDocuments((docs) => docs.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const handleDocumentDelete = (id: string) => {
    setDocuments((docs) => docs.filter((d) => d.id !== id));
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

  const filteredDocs = documents
    .filter((doc) => {
      const matchesRisk = filterRisk === 'all' || doc.risk === filterRisk;

      let matchesFolder = false;
      if (showAllDocuments) {
        matchesFolder = true;
      } else if (selectedFolderId) {
        matchesFolder = doc.folderId === selectedFolderId;
      } else {
        matchesFolder = !doc.folderId;
      }

      return matchesRisk && matchesFolder;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return -1; // Temporary sort logic
      if (sortBy === 'oldest') return 1;
      if (sortBy === 'risk') {
        const riskScore = { critical: 3, caution: 2, safe: 1 };
        return (
          riskScore[b.risk as keyof typeof riskScore] - riskScore[a.risk as keyof typeof riskScore]
        );
      }
      return 0;
    });

  useEffect(() => {
    setTimeout(() => setCurrentPage(1), 0);
  }, [searchQuery, filterRisk, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / pageSize));
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocs.map((d) => d.id)));
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
        <Checkbox checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} />
      ),
    },
    {
      id: 'name',
      header: 'Name',
      cell: (item) => (
        <div
          className="flex items-center gap-3"
          onClick={() => router.push(`/document/${item.id}`)}
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-text-tertiary">
            <DocumentIcon className="size-4" />
          </div>
          <span className="cursor-pointer font-semibold text-text-primary transition-colors hover:text-brand-primary">
            {item.name}
          </span>
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
        <Badge tone={item.risk} className="font-bold shadow-sm">
          {item.risk === 'critical'
            ? 'High Risk'
            : item.risk === 'caution'
              ? 'Needs Review'
              : 'Verified Safe'}
        </Badge>
      ),
    },

    {
      id: 'date',
      header: 'Date Added',
      cell: (item) => (
        <span className="font-medium text-text-secondary">{formatDisplayDate(item.date)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'ACTION',
      cell: (item) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <ActionDropdown
            doc={item}
            onUpdate={handleDocumentUpdate}
            onDelete={handleDocumentDelete}
            onMoveRequest={(id) => handleOpenMoveDialog([id])}
            onRemoveFromFolder={handleRemoveFromFolder}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative z-10">
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">
            Document Vault
          </Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">
            Access, manage, and organize all your AI-analyzed contracts and legal documents.
          </Text>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsFolderDialogOpen(true)}
            disabled={isLoading}
            className="hidden h-10 border-border-subtle bg-surface-1 font-bold shadow-sm transition-all hover:border-brand-primary/40 hover:text-brand-primary disabled:opacity-50 sm:flex"
          >
            New Folder
          </Button>
          <button
            disabled={isLoading}
            onClick={() => router.push('/scan')}
            className="group flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-brand-primary/40 disabled:pointer-events-none disabled:opacity-50"
            title="Upload Document"
          >
            <UploadCloudIcon className="size-5 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>

      {/* Deadline Timeline */}
      <DeadlineTimeline docs={documents} />

      {/* Folders Section */}
      {!selectedFolderId ? (
        <div className="flex flex-col gap-3">
          <Text size="xs" className="ml-1 font-bold tracking-wider text-text-tertiary uppercase">
            Quick Access
          </Text>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders.length === 0 ? (
              <div className="col-span-full rounded-[1.25rem] border border-dashed border-border-strong bg-surface-1/50 py-8 text-center">
                <Text size="sm" tone="tertiary" className="italic">
                  No folders yet. Create one to start organizing.
                </Text>
              </div>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-[1.25rem] border border-border-subtle bg-gradient-to-br from-surface-1 to-brand-primary/[0.01] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-md"
                >
                  <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-brand-primary/[0.03] to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-[150%]" />
                  <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand-primary shadow-sm transition-colors group-hover:bg-brand-primary group-hover:text-white">
                    <VaultIcon className="size-5" />
                  </div>
                  <div className="relative flex-1">
                    <Heading
                      level={3}
                      className="text-sm font-bold text-text-primary transition-colors group-hover:text-brand-primary"
                    >
                      {folder.name}
                    </Heading>
                    <Text
                      size="xs"
                      className="mt-0.5 font-medium text-text-tertiary group-hover:text-brand-primary/70"
                    >
                      {folder.count} Documents
                    </Text>
                  </div>

                  <div
                    className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameFolderId(folder.id);
                        setRenameFolderName(folder.name);
                        setIsRenameDialogOpen(true);
                      }}
                      className="rounded-md bg-surface-1 p-2 text-text-tertiary shadow-sm transition-colors hover:text-brand-primary"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteFolderId(folder.id);
                        setDeleteTypedName('');
                        setIsDeleteDialogOpen(true);
                      }}
                      className="ml-1 rounded-md bg-surface-1 p-2 text-text-tertiary shadow-sm transition-colors hover:text-red-500"
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
        <div className="-mb-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFolderId(null)}
            className="-ml-2 text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft className="mr-1 size-4" />
            Back to Main Vault
          </Button>
          <div className="h-4 w-px bg-border-subtle" />
          <Heading
            level={3}
            className="flex items-center gap-2 text-sm font-bold text-text-primary"
          >
            <VaultIcon className="size-4 text-brand-primary" />
            {folders.find((f) => f.id === selectedFolderId)?.name || 'Folder'}
          </Heading>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <Text size="xs" className="ml-1 font-bold tracking-wider text-text-tertiary uppercase">
            Documents
          </Text>

          {documents.some((d) => d.folderId) && (
            <div className="flex items-center gap-2" onClick={() => setShowAllDocuments((p) => !p)}>
              <Switch
                id="show-all"
                checked={showAllDocuments}
                onChange={(e) => setShowAllDocuments(e.target.checked)}
                className="pointer-events-none scale-75"
              />
              <label
                htmlFor="show-all"
                className="cursor-pointer text-xs font-medium text-text-secondary select-none"
              >
                Show all
              </label>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-1 p-2 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 pl-1">
            <div className="relative w-full max-w-md">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                type="search"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-lg border-transparent bg-surface-2 pl-9 text-sm shadow-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <FilterDropdown value={filterRisk} onChange={setFilterRisk} />
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>

            <div className="mx-1 hidden h-6 w-px bg-border-subtle sm:block" />

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
          <div className="animate-in fade-in slide-in-from-top-2 flex items-center justify-between rounded-[1rem] border border-brand-primary/30 bg-brand-primary/5 px-6 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Badge tone="neutral" className="border-none bg-brand-primary font-bold text-white">
                {selectedIds.size} Selected
              </Badge>
              <Text size="sm" className="font-semibold text-text-primary">
                Choose an action for the selected documents
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="font-bold"
                onClick={() => handleOpenMoveDialog(Array.from(selectedIds))}
              >
                Move to Folder
              </Button>
              <Button
                size="sm"
                className="bg-critical hover:bg-critical-fg border-none font-bold text-white"
                onClick={handleBulkDelete}
              >
                Delete
              </Button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="p-2 text-text-tertiary transition-colors hover:text-text-primary"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-2 flex-1">
          {isLoading || isSearching ? (
            <div className="flex items-center justify-center rounded-[2rem] border border-dashed border-border-strong bg-surface-1/50 py-24">
              <Text tone="secondary" className="animate-pulse font-medium">
                {isSearching ? 'Searching Vault...' : 'Loading Vault...'}
              </Text>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex items-center justify-center rounded-[2rem] border border-dashed border-border-strong bg-surface-1/50 py-24">
              <EmptyState
                title="No documents found"
                description={
                  searchQuery
                    ? 'Try adjusting your search or filters.'
                    : 'Upload your first contract to get started.'
                }
                filtered={!!searchQuery}
                action={
                  !searchQuery && (
                    <Button asChild className="font-bold shadow-md">
                      <Link href="/scan">
                        <UploadCloudIcon className="mr-2 size-4" /> Upload Document
                      </Link>
                    </Button>
                  )
                }
              />
            </div>
          ) : view === 'list' ? (
            <>
              <DataTable data={paginatedDocs} columns={columns} keyExtractor={(item) => item.id} />
              {filteredDocs.length > 0 && (
                <div className="mt-2 flex items-center justify-between border-t border-border-subtle px-1 pt-4">
                  <Text size="sm" tone="secondary" className="font-medium">
                    Showing{' '}
                    <span className="font-bold text-text-primary">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-bold text-text-primary">
                      {Math.min(currentPage * pageSize, filteredDocs.length)}
                    </span>{' '}
                    of <span className="font-bold text-text-primary">{filteredDocs.length}</span>{' '}
                    results
                  </Text>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="h-8 px-3 text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
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
                  <div
                    key={doc.id}
                    onClick={() => router.push(`/document/${doc.id}`)}
                    className="group relative flex cursor-pointer flex-col gap-4 rounded-xl border border-border-subtle bg-surface-1 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-md"
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <Checkbox
                        checked={selectedIds.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className={
                          selectedIds.has(doc.id)
                            ? 'opacity-100'
                            : 'opacity-0 transition-opacity group-hover:opacity-100'
                        }
                      />
                    </div>

                    <div className="mt-2 flex items-start justify-between">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-surface-2 text-text-tertiary transition-colors group-hover:bg-brand-primary/10 group-hover:text-brand-primary">
                        <DocumentIcon className="size-6" />
                      </div>
                      <div className="z-10" onClick={(e) => e.stopPropagation()}>
                        <ActionDropdown
                          doc={doc}
                          onUpdate={handleDocumentUpdate}
                          onDelete={handleDocumentDelete}
                          onMoveRequest={(id) => handleOpenMoveDialog([id])}
                          onRemoveFromFolder={handleRemoveFromFolder}
                        />
                      </div>
                    </div>

                    <div>
                      <Heading
                        level={3}
                        size="sm"
                        className="truncate font-bold transition-colors group-hover:text-brand-primary"
                        title={doc.name}
                      >
                        {doc.name}
                      </Heading>
                      <Text size="xs" tone="secondary" className="mt-1 font-medium">
                        {doc.type} • {doc.size}
                      </Text>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-4">
                      <Badge tone={doc.risk} className="font-bold shadow-sm">
                        {doc.risk === 'critical'
                          ? 'High Risk'
                          : doc.risk === 'caution'
                            ? 'Needs Review'
                            : 'Verified Safe'}
                      </Badge>
                      <div className="text-[11px] font-medium tracking-wider text-text-tertiary uppercase">
                        {formatDisplayDate(doc.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredDocs.length > 0 && (
                <div className="mt-2 flex items-center justify-between border-t border-border-subtle px-1 pt-4">
                  <Text size="sm" tone="secondary" className="font-medium">
                    Showing{' '}
                    <span className="font-bold text-text-primary">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-bold text-text-primary">
                      {Math.min(currentPage * pageSize, filteredDocs.length)}
                    </span>{' '}
                    of <span className="font-bold text-text-primary">{filteredDocs.length}</span>{' '}
                    results
                  </Text>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="h-8 px-3 text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
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
            <Button
              variant="ghost"
              onClick={() => setIsFolderDialogOpen(false)}
              disabled={isCreatingFolder}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={isCreatingFolder || !newFolderName.trim()}
            >
              {isCreatingFolder ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
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
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto py-4">
          {folders.length === 0 && (
            <Text size="sm" tone="tertiary" className="py-4 text-center italic">
              No folders exist. Create one first.
            </Text>
          )}
          {folders.length > 0 &&
            docsToMove.some((id) => documents.find((d) => d.id === id)?.folderId) && (
              <button
                onClick={() => handleMoveDocuments(null)}
                disabled={isMoving}
                className="flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface-1 p-3 text-left transition-colors hover:bg-surface-2"
              >
                <div className="bg-surface-3 flex size-8 shrink-0 items-center justify-center rounded-lg text-text-secondary">
                  <LayoutDashboardIcon className="size-4" />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  Remove from Folder (Main Vault)
                </span>
              </button>
            )}
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => handleMoveDocuments(f.id)}
              disabled={isMoving}
              className="flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface-1 p-3 text-left transition-colors hover:border-brand-primary/30 hover:bg-brand-primary/5"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-brand-primary">
                <VaultIcon className="size-4" />
              </div>
              <span className="flex-1 text-sm font-medium text-text-primary">{f.name}</span>
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
            <Button
              variant="ghost"
              onClick={() => setIsRenameDialogOpen(false)}
              disabled={isRenamingFolder}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameFolder}
              disabled={isRenamingFolder || !renameFolderName.trim()}
            >
              {isRenamingFolder ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
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
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletingFolder}
            >
              Cancel
            </Button>
            <Button
              className="bg-critical hover:bg-critical-fg border-none text-white"
              onClick={handleDeleteFolder}
              disabled={
                isDeletingFolder ||
                deleteTypedName !== folders.find((f) => f.id === deleteFolderId)?.name
              }
            >
              {isDeletingFolder ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Delete
            </Button>
          </>
        }
      >
        <form onSubmit={handleDeleteFolder} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setDeleteMode('only')}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${deleteMode === 'only' ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle bg-surface-1 hover:bg-surface-2'}`}
            >
              <div
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${deleteMode === 'only' ? 'border-brand-primary' : 'border-border-strong'}`}
              >
                {deleteMode === 'only' && <div className="size-2 rounded-full bg-brand-primary" />}
              </div>
              <div>
                <span
                  className={`block text-sm font-semibold ${deleteMode === 'only' ? 'text-brand-primary' : 'text-text-primary'}`}
                >
                  Keep Documents
                </span>
                <span className="mt-0.5 block text-xs text-text-secondary">
                  Documents will be moved to the Main Vault.
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setDeleteMode('all')}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${deleteMode === 'all' ? 'border-critical bg-critical/5' : 'border-border-subtle bg-surface-1 hover:bg-surface-2'}`}
            >
              <div
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${deleteMode === 'all' ? 'border-critical' : 'border-border-strong'}`}
              >
                {deleteMode === 'all' && <div className="bg-critical size-2 rounded-full" />}
              </div>
              <div>
                <span
                  className={`block text-sm font-semibold ${deleteMode === 'all' ? 'text-critical' : 'text-text-primary'}`}
                >
                  Delete Everything
                </span>
                <span className="mt-0.5 block text-xs text-text-secondary">
                  Deletes this folder and permanently deletes all{' '}
                  {folders.find((f) => f.id === deleteFolderId)?.count || 0} documents inside it.
                </span>
              </div>
            </button>
          </div>

          <div className="mt-2">
            <Text size="sm" className="mb-2 font-medium text-text-primary">
              Please type{' '}
              <strong className="font-bold text-text-primary select-all">
                {folders.find((f) => f.id === deleteFolderId)?.name}
              </strong>{' '}
              to confirm.
            </Text>
            <Input
              placeholder={folders.find((f) => f.id === deleteFolderId)?.name}
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

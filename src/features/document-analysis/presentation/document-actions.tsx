'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Tooltip, cn } from '@/shared/ui';
import {
  DownloadIcon,
  Trash2Icon,
  RefreshCwIcon,
  LanguagesIcon,
  Settings2Icon,
  CheckCircle2Icon,
  CheckIcon,
  Loader2Icon,
} from 'lucide-react';
import { toast } from 'sonner';
import { toggleResolvedAction, deleteDocumentAction } from '../../vault/actions';

export function DocumentActions({
  documentId,
  initialResolved = false,
  canExport = false,
}: {
  documentId: string;
  initialResolved?: boolean;
  canExport?: boolean;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const [resolved, setResolved] = useState(initialResolved);
  const [isResolving, startTransition] = useTransition();

  const handleToggleResolved = () => {
    startTransition(async () => {
      try {
        const newResolved = !resolved;
        setResolved(newResolved); // Optimistic
        await toggleResolvedAction(documentId, newResolved);
        toast.success(
          newResolved ? 'Document marked as resolved' : 'Document marked as unresolved',
        );
      } catch (e) {
        console.error(e);
        setResolved(resolved); // Revert
        toast.error('Failed to update status');
      }
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document? This cannot be undone.'))
      return;

    setIsDeleting(true);
    try {
      await deleteDocumentAction(documentId);
      toast.success('Document analysis deleted.');
      router.push('/vault');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete document');
      setIsDeleting(false);
    }
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      document.getElementById('analysis-report-content')?.classList.add('blur-sm', 'opacity-60', 'pointer-events-none');
      const { reanalyzeDocumentAction } = await import('./actions');
      const fd = new FormData();
      fd.append('documentId', documentId);
      fd.append('force', 'true');
      await reanalyzeDocumentAction(undefined, fd);
      toast.success('Document re-analyzed successfully.');
    } catch (e) {
      toast.error('Failed to re-analyze document.');
    } finally {
      document.getElementById('analysis-report-content')?.classList.remove('blur-sm', 'opacity-60', 'pointer-events-none');
      setIsReanalyzing(false);
    }
  };

  const handleExport = () => {
    window.open(`/api/export/pdf?id=${documentId}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Mark as Resolved button */}
      <Button
        variant="ghost"
        onClick={handleToggleResolved}
        disabled={isResolving}
        className={cn(
          'hidden transition-all duration-200 md:inline-flex',
          resolved
            ? 'border border-green-500/40 bg-green-500/15 text-green-600 hover:bg-green-500/25'
            : 'border border-transparent text-text-secondary hover:border-green-500/30 hover:bg-green-500/5 hover:text-green-600',
        )}
      >
        {isResolving ? (
          <>
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : resolved ? (
          <>
            <CheckCircle2Icon className="mr-2 h-4 w-4" /> Resolved
          </>
        ) : (
          <>
            <CheckCircle2Icon className="mr-2 h-4 w-4" /> Mark Resolved
          </>
        )}
      </Button>

      <div className="mx-1 hidden h-4 w-px bg-border-subtle sm:block" />

      <Tooltip content="Translate Report">
        <Button variant="ghost" size="sm" className="hidden text-text-secondary sm:inline-flex">
          <LanguagesIcon className="mr-2 h-4 w-4" />
          Language
        </Button>
      </Tooltip>

      <Tooltip content="Adjust Tone">
        <Button variant="ghost" size="sm" className="hidden text-text-secondary sm:inline-flex">
          <Settings2Icon className="mr-2 h-4 w-4" />
          Tone
        </Button>
      </Tooltip>

      <div className="mx-1 hidden h-4 w-px bg-border-subtle sm:block" />

      <Button variant="ghost" size="sm" onClick={handleReanalyze} disabled={isReanalyzing}>
        <RefreshCwIcon className={`mr-2 h-4 w-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
        Re-analyze
      </Button>

      <Tooltip content={canExport ? 'Download PDF Report' : 'Upgrade to Pro to export PDF reports'}>
        <div>
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={!canExport}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </Tooltip>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-risk-critical hover:bg-risk-critical/10 hover:text-risk-critical"
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </div>
  );
}

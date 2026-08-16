'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Tooltip, cn } from '@/shared/ui';
import { DownloadIcon, Trash2Icon, RefreshCwIcon, LanguagesIcon, Settings2Icon, CheckCircle2Icon, CheckIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { toggleResolvedAction, deleteDocumentAction } from '../../vault/actions';

export function DocumentActions({ documentId, initialResolved = false }: { documentId: string, initialResolved?: boolean }) {
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
        toast.success(newResolved ? 'Document marked as resolved' : 'Document marked as unresolved');
      } catch (e) {
        console.error(e);
        setResolved(resolved); // Revert
        toast.error('Failed to update status');
      }
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this document? This cannot be undone.")) return;
    
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
    await new Promise(r => setTimeout(r, 1200));
    setIsReanalyzing(false);
    toast.success('Document re-analyzed successfully.');
    router.refresh();
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
          'transition-all duration-200 hidden md:inline-flex',
          resolved 
            ? 'bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/40 border' 
            : 'text-text-secondary border border-transparent hover:border-green-500/30 hover:text-green-600 hover:bg-green-500/5'
        )}
      >
        {isResolving ? (
          <><Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
        ) : resolved ? (
          <><CheckCircle2Icon className="w-4 h-4 mr-2" /> Resolved</>
        ) : (
          <><CheckCircle2Icon className="w-4 h-4 mr-2" /> Mark Resolved</>
        )}
      </Button>

      <div className="h-4 w-px bg-border-subtle mx-1 hidden sm:block" />

      <Tooltip content="Translate Report">
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-text-secondary">
          <LanguagesIcon className="w-4 h-4 mr-2" />
          Language
        </Button>
      </Tooltip>
      
      <Tooltip content="Adjust Tone">
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-text-secondary">
          <Settings2Icon className="w-4 h-4 mr-2" />
          Tone
        </Button>
      </Tooltip>

      <div className="h-4 w-px bg-border-subtle mx-1 hidden sm:block" />

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleReanalyze}
        disabled={isReanalyzing}
      >
        <RefreshCwIcon className={`w-4 h-4 mr-2 ${isReanalyzing ? 'animate-spin' : ''}`} />
        Re-analyze
      </Button>
      
      <Button variant="secondary" size="sm" onClick={handleExport}>
        <DownloadIcon className="w-4 h-4 mr-2" />
        Export
      </Button>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-risk-critical hover:text-risk-critical hover:bg-risk-critical/10"
      >
        <Trash2Icon className="w-4 h-4" />
      </Button>
    </div>
  );
}

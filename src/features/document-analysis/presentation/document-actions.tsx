'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Tooltip } from '@/shared/ui';
import { DownloadIcon, Trash2Icon, RefreshCwIcon, LanguagesIcon, Settings2Icon } from 'lucide-react';
import { toast } from 'sonner';

export function DocumentActions({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    // Fake delay for UI feedback
    await new Promise(r => setTimeout(r, 800));
    toast.success('Document analysis deleted.');
    router.push('/vault');
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsReanalyzing(false);
    toast.success('Document re-analyzed successfully.');
    router.refresh();
  };

  const handleExport = () => {
    toast.success('Exporting report as PDF...');
  };

  return (
    <div className="flex items-center gap-2">
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

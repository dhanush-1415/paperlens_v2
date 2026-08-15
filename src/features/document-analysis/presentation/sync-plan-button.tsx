'use client';

import { useState } from 'react';
import { Download, Kanban, Copy, Check, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/ui/cn';

interface SyncPlanButtonProps {
  actions: readonly string[];
  documentTitle: string;
}

export function SyncPlanButton({ actions, documentTitle }: SyncPlanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!actions || actions.length === 0) return null;

  const handleCopyMarkdown = () => {
    const md = `## Action Plan: ${documentTitle}\n\n` + actions.map(a => `- [ ] ${a}`).join('\n');
    navigator.clipboard.writeText(md);
    setCopiedType('markdown');
    toast.success('Copied for Notion (Markdown)');
    setTimeout(() => setCopiedType(null), 2000);
    setIsOpen(false);
  };

  const handleExportCSV = () => {
    const csv = `Task,Status\n` + actions.map(a => `"${a.replace(/"/g, '""')}","To Do"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PaperLens_ActionPlan_${documentTitle.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded CSV for Jira');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95",
          isOpen 
            ? "bg-brand-primary text-white border-brand-primary shadow-sm" 
            : "bg-surface-1 border-border-subtle text-text-secondary hover:text-text-primary hover:border-brand-primary/30"
        )}
      >
        <Download className="h-3.5 w-3.5" />
        Sync Tasks
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border-subtle bg-surface-2 p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
          <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
            Export to
          </p>
          <button
            onClick={handleCopyMarkdown}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs font-medium text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
          >
            {copiedType === 'markdown' ? <Check className="h-4 w-4 text-safe" /> : <Kanban className="h-4 w-4" />}
            Notion (Markdown)
          </button>
          <button
            onClick={handleExportCSV}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs font-medium text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Jira (CSV Import)
          </button>
        </div>
      )}
    </div>
  );
}

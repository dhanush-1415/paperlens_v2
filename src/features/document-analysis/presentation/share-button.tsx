'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Download } from 'lucide-react';
import { toast } from 'sonner';

export function ShareExportMenu({ documentId, title }: { documentId: string, title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/document/${documentId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    try {
      const url = `${window.location.origin}/document/${documentId}`;
      if (navigator.share) {
        await navigator.share({
          title: title || 'PaperLens Document Analysis',
          text: 'Check out this document analysis on PaperLens',
          url: url,
        });
      } else {
        handleCopyLink();
      }
    } catch (e) {
      // User cancelled share, do nothing
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <>
      <button 
        onClick={handleNativeShare}
        title="Share document" 
        className="group flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 cursor-pointer text-brand-primary bg-brand-primary/5 border border-brand-primary/20 hover:bg-brand-primary/10 hover:border-brand-primary/40 hover:shadow-sm transition-all duration-200"
      >
        <Share2 className="h-4 w-4" />
        <span className="text-xs font-semibold leading-none hidden sm:inline">Share</span>
      </button>
      <button 
        onClick={handleExportPDF}
        title="Export to PDF" 
        className="group flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 cursor-pointer text-text-secondary bg-surface-2 border border-border-subtle hover:text-text-primary hover:bg-surface-raised hover:border-border-strong hover:shadow-sm transition-all duration-200"
      >
        <Download className="h-4 w-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
        <span className="text-xs font-semibold leading-none hidden sm:inline">Export</span>
      </button>
    </>
  );
}

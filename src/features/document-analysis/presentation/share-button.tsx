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
        className="group flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-1 cursor-pointer text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 border border-brand-primary/20 transition-all duration-150"
      >
        <Share2 className="h-4 w-4" />
        <span className="text-[10px] font-medium leading-none">Share</span>
      </button>
      <button 
        onClick={handleExportPDF}
        title="Export to PDF" 
        className="group flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-1 cursor-pointer text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-transparent hover:border-border-subtle transition-all duration-150"
      >
        <Download className="h-4 w-4" />
        <span className="text-[10px] font-medium leading-none">Export</span>
      </button>
    </>
  );
}

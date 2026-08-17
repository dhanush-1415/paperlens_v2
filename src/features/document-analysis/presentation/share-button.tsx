'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Download } from 'lucide-react';
import { toast } from 'sonner';

export function ShareExportMenu({ documentId, title }: { documentId: string; title?: string }) {
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
          url,
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
        className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-2.5 text-brand-primary transition-all duration-200 hover:border-brand-primary/40 hover:bg-brand-primary/10 hover:shadow-sm"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden text-xs leading-none font-semibold sm:inline">Share</span>
      </button>
      <button
        onClick={handleExportPDF}
        title="Export to PDF"
        className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-text-secondary transition-all duration-200 hover:border-border-strong hover:bg-surface-raised hover:text-text-primary hover:shadow-sm"
      >
        <Download className="h-4 w-4 text-text-tertiary transition-colors group-hover:text-text-primary" />
        <span className="hidden text-xs leading-none font-semibold sm:inline">Export</span>
      </button>
    </>
  );
}

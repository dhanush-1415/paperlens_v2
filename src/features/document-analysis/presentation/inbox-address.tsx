'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Inbox, Copy, Check, RefreshCw, Loader2 } from 'lucide-react';
import { getOrCreateInboxAddressAction, regenerateInboxAddressAction } from './inbox-actions';
import { cn } from '@/shared/ui/cn';

export function InboxAddress({ initialAddress }: { initialAddress: string | null }) {
  const [address, setAddress] = useState<string | null>(initialAddress);
  const [copied, setCopied]   = useState(false);
  const [isPending, start]    = useTransition();

  const enable = () => start(async () => {
    const res = await getOrCreateInboxAddressAction();
    if (res.error) { toast.error(res.error); return; }
    setAddress(res.address ?? null);
  });

  const regenerate = () => {
    if (!confirm('Generate a new address? Your current one will stop working.')) return;
    start(async () => {
      const res = await regenerateInboxAddressAction();
      if (res.error) { toast.error(res.error); return; }
      setAddress(res.address ?? null);
      toast.success('New forwarding address generated.');
    });
  };

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Could not copy — select the address manually.'); }
  };

  if (!address) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Get a private PaperLens email address. Forward any bill, notice, or letter to it and
          we&rsquo;ll analyze it automatically and email you the result.
        </p>
        <button
          onClick={enable}
          disabled={isPending}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Inbox className="h-4 w-4" />}
          Enable email-in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Forward bills, notices, and letters here — with the document attached — and we&rsquo;ll
        analyze it and email you back. Keep this address private.
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
        <Inbox className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <code className="flex-1 truncate text-[13px] font-medium text-foreground">{address}</code>
        <button
          onClick={copy}
          aria-label="Copy address"
          className={cn(
            'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors',
            copied ? 'text-success' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <button
        onClick={regenerate}
        disabled={isPending}
        className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        Generate a new address
      </button>
    </div>
  );
}

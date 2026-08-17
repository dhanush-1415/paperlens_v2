'use client';

import { useState, useTransition } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/shared/ui/components/dialog';
import { Button } from '@/shared/ui';
import { requestAccountDeletionAction, cancelAccountDeletionAction } from './actions';

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [isPending, startTransition] = useTransition();

  const isConfirmed = confirm === 'DELETE';

  const handleDelete = () => {
    if (!isConfirmed) return;
    startTransition(async () => {
      const result = await requestAccountDeletionAction();
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Account deletion scheduled. Check your email for confirmation.');
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setOpen(true);
          setConfirm('');
        }}
        className="shrink-0 border-red-500/30 bg-white font-bold text-red-500 shadow-sm transition-all hover:border-red-500 hover:bg-red-50 dark:bg-transparent dark:hover:bg-red-500/20"
      >
        <Trash2 className="mr-2 size-4" />
        Delete Account
      </Button>

      <Dialog
        open={open}
        onClose={() => {
          if (!isPending) setOpen(false);
        }}
        title="Delete your account?"
        description="Your account will be permanently deleted within 48 hours. You can cancel this within the 48-hour window from your settings."
        dismissOnBackdropClick={false}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Keep account
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              disabled={!isConfirmed || isPending}
              className="border-none bg-red-500 text-white hover:bg-red-600"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Scheduling...
                </span>
              ) : (
                'Delete my account'
              )}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <ul className="space-y-1.5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-text-secondary">
            <li className="flex items-center gap-2">
              <span className="font-bold text-red-500">✗</span> All documents and vault contents
            </li>
            <li className="flex items-center gap-2">
              <span className="font-bold text-red-500">✗</span> All AI chat history
            </li>
            <li className="flex items-center gap-2">
              <span className="font-bold text-red-500">✗</span> All folders and reminders
            </li>
            <li className="flex items-center gap-2">
              <span className="font-bold text-red-500">✗</span> Active Pro subscription (cancelled
              immediately)
            </li>
          </ul>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text-primary">
              Type <span className="rounded bg-red-50 px-1 font-mono text-red-500">DELETE</span> to
              confirm
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="w-full rounded-xl border border-border-strong bg-surface-1 px-4 py-2.5 font-mono text-sm tracking-widest transition-colors outline-none placeholder:text-text-tertiary focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}

export function CancelDeletionButton() {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelAccountDeletionAction();
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Account deletion cancelled. Your account is safe.');
      }
    });
  };

  return (
    <Button
      variant="primary"
      onClick={handleCancel}
      disabled={isPending}
      className="shrink-0 border-none bg-text-primary font-bold text-surface-1 hover:bg-text-secondary"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...
        </>
      ) : (
        'Cancel deletion'
      )}
    </Button>
  );
}

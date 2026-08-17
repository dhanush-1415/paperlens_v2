'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Scale, ExternalLink, Loader2, CheckCircle2, ShieldQuestion } from 'lucide-react';
import { Dialog } from '@/shared/ui/components/dialog';
import {
  EXPERTS,
  recommendExperts,
  type ExpertType,
  type DocCategory,
  type Urgency,
} from '../application/experts';
import { submitExpertLeadAction } from './expert-actions';
import { cn } from '@/shared/ui/cn';

interface Props {
  documentId: string;
  category: DocCategory | null;
  docPack: string | null;
  urgency: Urgency;
  defaultName?: string;
  defaultEmail?: string;
}

export function ExpertEscalation({
  documentId,
  category,
  docPack,
  urgency,
  defaultName,
  defaultEmail,
}: Props) {
  const recommended = recommendExperts({ category, docPack, urgency });
  const [open, setOpen] = useState(false);
  const [expert, setExpert] = useState<ExpertType>(recommended[0] ?? 'attorney');
  const [name, setName] = useState(defaultName ?? '');
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [isPending, start] = useTransition();

  if (recommended.length === 0) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await submitExpertLeadAction({
        documentId,
        expertType: expert,
        name,
        email,
        phone,
        note,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setDone(true);
    });
  };

  const close = () => {
    if (!isPending) {
      setOpen(false);
      setTimeout(() => setDone(false), 200);
    }
  };

  return (
    <>
      {/* CTA — only shown for high-risk docs (parent gates by shouldOfferEscalation) */}
      <button
        onClick={() => setOpen(true)}
        className="border-primary/25 bg-primary/5 hover:bg-primary/10 mt-2.5 flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all duration-150 active:scale-[0.99]"
      >
        <div className="bg-primary/15 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <Scale className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-[12px] leading-tight font-semibold">
            Need professional help?
          </p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            Connect with {recommended.map((r) => EXPERTS[r].label.toLowerCase()).join(' or ')}
          </p>
        </div>
        <ShieldQuestion className="text-primary/60 h-4 w-4 shrink-0" aria-hidden="true" />
      </button>

      <Dialog
        open={open}
        onClose={close}
        title={done ? 'Request received' : 'Get professional help'}
        description={
          done
            ? `We'll be in touch shortly to connect you with a ${EXPERTS[expert].label.toLowerCase()}. You can also use the official directory below.`
            : "We'll connect you with an independent professional. Choose who you need."
        }
        footer={
          done ? (
            <div className="mt-2 flex w-full justify-center">
              <a
                href={EXPERTS[expert].directoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
              >
                Open official directory <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between">
              <a
                href={EXPERTS[expert].directoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs"
              >
                Browse directory <ExternalLink className="h-3 w-3" />
              </a>
              <button
                form="expert-escalation-form"
                type="submit"
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Request connection
              </button>
            </div>
          )
        }
      >
        {!done && (
          <form id="expert-escalation-form" onSubmit={submit} className="space-y-4 px-1 py-2">
            {/* Expert type chooser */}
            {recommended.length > 1 && (
              <div className="flex gap-2">
                {recommended.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setExpert(t)}
                    className={cn(
                      'flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                      expert === t
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {EXPERTS[t].label}
                  </button>
                ))}
              </div>
            )}
            <p className="text-muted-foreground text-xs">{EXPERTS[expert].blurb}</p>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="border-border bg-background focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Your email"
              required
              className="border-border bg-background focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="border-border bg-background focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything they should know? (optional)"
              rows={2}
              maxLength={1000}
              className="border-border bg-background focus:border-primary focus:ring-primary/20 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />

            {/* Compliance disclaimer */}
            <p className="bg-muted/50 text-muted-foreground rounded-lg px-3 py-2 text-[10px] leading-relaxed">
              PaperLens is not a law, tax, or financial firm and does not provide legal, tax, or
              financial advice. By submitting, you consent to us sharing your contact details to
              help connect you with an independent licensed professional.
            </p>
          </form>
        )}
      </Dialog>
    </>
  );
}

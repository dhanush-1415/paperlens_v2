import Link from 'next/link';
import { ShieldCheck, Clock, Calendar, FileText, AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { prisma } from '@/server/db/prisma';
import { serverEnv } from '@/config/env.server';

// Shared pages must not be indexed by search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ token: string }>;
}

const RISK_SCORE: Record<
  string,
  { emoji: string; label: string; border: string; text: string; bg: string }
> = {
  CRITICAL: {
    emoji: '🔴',
    label: 'Immediate Attention',
    border: 'border-destructive/30',
    text: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  HIGH: {
    emoji: '🟠',
    label: 'Important',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  MODERATE: {
    emoji: '🟡',
    label: 'Action Needed',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  LOW: {
    emoji: '🟢',
    label: 'Informational',
    border: 'border-brand-primary/30',
    text: 'text-brand-primary',
    bg: 'bg-brand-primary/10',
  },
  SKIPPABLE: {
    emoji: '⚪',
    label: 'Skippable',
    border: 'border-border-strong',
    text: 'text-text-tertiary',
    bg: 'bg-surface-2/50',
  },
};

function Unavailable({ reason }: { reason: string }) {
  return (
    <div className="dark bg-canvas">
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-6 text-center">
        <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-brand-primary/5 blur-[120px]" />

        <div className="z-10 flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-border-strong bg-surface-2/25 p-8 shadow-2xl backdrop-blur-xl">
          <div className="bg-destructive/10 border-destructive/20 text-destructive flex h-12 w-12 items-center justify-center rounded-full border">
            <AlertTriangle size={20} />
          </div>
          <h1 className="text-lg font-extrabold text-text-primary">Link unavailable</h1>
          <p className="text-xs leading-relaxed text-text-secondary">{reason}</p>
          <Link
            href="/"
            className="mt-2 w-full cursor-pointer rounded-xl bg-brand-primary py-2.5 text-xs font-bold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.98]"
          >
            Go to PaperLens
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const share = await prisma.documentShare.findUnique({
    where: { token },
    include: { analysis: true },
  });

  if (!share || share.revoked) {
    return <Unavailable reason="This share link has been revoked or doesn't exist." />;
  }
  if (share.expiresAt && share.expiresAt < new Date()) {
    return <Unavailable reason="This share link has expired." />;
  }

  const doc = share.analysis;
  if (!doc || doc.deletedAt) {
    return <Unavailable reason="The shared document is no longer available." />;
  }

  const urgencyKey = (doc.urgency ?? 'SKIPPABLE').toUpperCase();
  const risk = RISK_SCORE[urgencyKey] || RISK_SCORE.SKIPPABLE;

  // Optional file preview (signed URL) when the owner enabled includeFile.
  let fileUrl: string | null = null;
  if (share.includeFile && doc.fileUrl) {
    const path = doc.fileUrl.startsWith('http')
      ? (doc.fileUrl.match(/\/document-scans\/([^?]+)/)?.[1] ?? null)
      : doc.fileUrl;

    if (path) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
        const { data: signed } = await supabase.storage
          .from('document-scans')
          .createSignedUrl(path, 3600);
        fileUrl = signed?.signedUrl ?? null;
      } catch (e) {
        console.error('Failed to sign URL for share link', e);
      }
    }
  }

  return (
    <div className="dark bg-canvas">
      <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-canvas px-4 py-12">
        {/* Glow backgrounds */}
        <div className="pointer-events-none absolute top-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-brand-primary/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-10%] left-[-15%] h-[50%] w-[45%] rounded-full bg-indigo-500/5 blur-[140px]" />

        <div className="z-10 mx-auto flex w-full max-w-2xl flex-col gap-6">
          {/* Brand header */}
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-text-tertiary uppercase">
              <ShieldCheck size={12} className="text-emerald-500" /> Shared via PaperLens
            </span>
            <Link
              href="/"
              className="text-[10px] font-bold tracking-wider text-brand-primary uppercase hover:underline"
            >
              Analyze your documents →
            </Link>
          </div>

          {/* Main Document Details Card */}
          <article className="flex flex-col overflow-hidden rounded-3xl border border-border-strong bg-surface-2/50 shadow-2xl backdrop-blur-xl">
            {/* Risk assessment header banner */}
            <div
              className={`flex items-center gap-2 border-b border-border-strong px-6 py-4 ${risk.bg}`}
            >
              <span aria-hidden="true">{risk.emoji}</span>
              <span className="text-[10px] font-extrabold tracking-widest text-text-secondary uppercase">
                Risk Score: <span className={risk.text}>{risk.label}</span>
              </span>
              {doc.deadlineDate && (
                <span className="ml-auto flex items-center gap-1 rounded-lg border border-border-strong bg-canvas px-2 py-1 text-[9px] font-bold text-text-primary">
                  <Calendar size={10} />
                  Due {doc.deadlineDate.toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="space-y-6 p-6">
              {/* Header info */}
              <div>
                <h1 className="text-2xl leading-tight font-black text-text-primary">{doc.title}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border-strong bg-surface-2 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-text-tertiary uppercase">
                    {doc.documentType}
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-500 uppercase">
                    <ShieldCheck size={10} /> Zero Retention
                  </span>
                </div>
              </div>

              {/* Document summary */}
              <div className="rounded-2xl border border-border-strong bg-canvas/45 p-4 text-xs leading-relaxed text-text-secondary">
                <h4 className="mb-2.5 flex items-center gap-1.5 text-[9px] font-extrabold tracking-widest text-text-primary uppercase">
                  <FileText size={12} /> Analysis Summary
                </h4>
                <p className="leading-relaxed whitespace-pre-line">{doc.summary}</p>
              </div>

              {/* Action plan steps */}
              {Array.isArray(doc.actionPlan) && doc.actionPlan.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-border-strong bg-canvas/20 p-5">
                  <h4 className="text-[9px] font-extrabold tracking-widest text-text-tertiary uppercase">
                    Action Playbook
                  </h4>
                  <ol className="flex flex-col gap-3">
                    {doc.actionPlan.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-xs leading-relaxed">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-brand-primary/20 bg-brand-primary/10 text-[10px] font-extrabold text-brand-primary">
                          {i + 1}
                        </span>
                        <span className="text-text-secondary">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* File download attachment */}
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border-strong px-4 py-2.5 text-xs font-bold text-text-primary transition-all hover:bg-surface-2/40"
                >
                  View original scan file
                </a>
              )}
            </div>

            {/* Footer Disclaimer */}
            <p className="border-t border-border-strong bg-surface-2/20 px-6 py-4 text-[9px] leading-relaxed text-text-tertiary">
              This is a read-only document digest generated securely by PaperLens. It does not
              constitute legal, financial, or professional advice. Always verify important notices
              independently.
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}

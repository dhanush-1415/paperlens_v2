'use server';

import { Resend } from 'resend';
import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';
import { EXPERTS, type ExpertType } from '../application/experts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LeadInput {
  documentId?: string | null;
  expertType: ExpertType;
  name: string;
  email: string;
  phone?: string;
  note?: string;
}

/**
 * Record a consented request to be connected with an independent professional.
 * Lead-gen only — PaperLens gives no legal/tax advice and does not split fees.
 */
export async function submitExpertLeadAction(
  input: LeadInput,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requireSession();

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!EXPERTS[input.expertType]) return { error: 'Unknown professional type.' };
  const name = (input.name ?? '').trim();
  const email = (input.email ?? '').trim().toLowerCase();
  const phone = (input.phone ?? '').trim() || null;
  const note = (input.note ?? '').trim().slice(0, 1000) || null;
  if (name.length < 2 || name.length > 100) return { error: 'Please enter your name.' };
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email.' };

  // ── Insert ────────────────────────────────────────────────────────────────
  try {
    await prisma.expertLead.create({
      data: {
        userId: session.userId,
        documentId: input.documentId ?? null,
        expertType: input.expertType,
        contactName: name,
        contactEmail: email,
        contactPhone: phone,
        note,
      },
    });
  } catch (dbErr: any) {
    console.error('[expert] insert failed:', dbErr.message);
    return { error: 'Could not submit your request. Please try again.' };
  }

  // ── Notify ops + confirm to user (best-effort, non-fatal) ─────────────────
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL ?? 'PaperLens <hello@paperlens.co>';
    const opsTo = process.env.EXPERT_LEADS_EMAIL ?? 'teampaperlens@gmail.com';
    const label = EXPERTS[input.expertType].label;

    void resend.emails
      .send({
        from,
        to: opsTo,
        subject: `New expert lead: ${label}`,
        html: `<p><strong>${label}</strong> request</p>
             <p>Name: ${name}<br/>Email: ${email}<br/>Phone: ${phone ?? '—'}</p>
             <p>User: ${session.userId}<br/>Document: ${input.documentId ?? '—'}</p>
             <p>Note: ${note ?? '—'}</p>`,
      })
      .catch(() => {});

    void resend.emails
      .send({
        from,
        to: email,
        subject: `We received your request for a ${label.toLowerCase()}`,
        html: `<p>Thanks — we received your request to connect with a ${label.toLowerCase()}.</p>
             <p>We'll be in touch shortly. In the meantime, you can also use an official directory:
             <a href="${EXPERTS[input.expertType].directoryUrl}">${EXPERTS[input.expertType].directoryUrl}</a></p>
             <p style="color:#888;font-size:12px;">PaperLens is not a law or accounting firm and does not provide legal, tax, or financial advice. We help you connect with independent licensed professionals.</p>`,
      })
      .catch(() => {});
  }

  return { ok: true };
}

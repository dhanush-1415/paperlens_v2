import { Resend } from 'resend';
type Urgency = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'SKIPPABLE';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.paperlens.co';
const FROM = () => process.env.RESEND_FROM_EMAIL ?? 'PaperLens <hello@paperlens.co>';

const URGENCY_EMOJI: Record<Urgency, string> = {
  CRITICAL: '🔴',
  HIGH: '🟠',
  MODERATE: '🟡',
  LOW: '🟢',
  SKIPPABLE: '⚪',
};

function shell(inner: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;padding:0 16px 40px;">
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:28px 28px 24px;">
      ${inner}
    </div>
    <p style="margin:16px 4px 0;font-size:11px;color:#9ca3af;">You received this because you forwarded a document to your PaperLens inbox address.</p>
  </div></body></html>`;
}

/** Sent after a forwarded document is successfully analyzed. */
export async function sendInboundResultEmail(
  email: string,
  args: { headline: string; urgency: Urgency; documentId: string },
): Promise<void> {
  const docUrl = `${APP_URL()}/document/${args.documentId}?ref=email-in`;
  try {
    await resend.emails.send({
      from: FROM(),
      to: email,
      subject: `✅ Analyzed: "${args.headline}"`,
      html: shell(`
        <h2 style="margin:0 0 6px;font-size:18px;color:#111827;">${URGENCY_EMOJI[args.urgency]} Your document is ready</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#4b5563;">PaperLens analyzed the document you forwarded:</p>
        <div style="border-left:4px solid #7c3aed;background:#f5f3ff;border-radius:6px;padding:12px 16px;margin-bottom:20px;">
          <strong style="font-size:15px;color:#111827;">${args.headline}</strong>
        </div>
        <a href="${docUrl}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:700;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;">Open analysis →</a>
      `),
    });
  } catch (e) {
    console.error('[inbound-result] send failed (non-fatal):', e instanceof Error ? e.message : e);
  }
}

/** Sent when a forwarded document can't be processed (limit reached / no content). */
export async function sendInboundNoticeEmail(
  email: string,
  reason: 'limit' | 'no_content',
): Promise<void> {
  const isLimit = reason === 'limit';
  try {
    await resend.emails.send({
      from: FROM(),
      to: email,
      subject: isLimit ? '⚠️ Scan limit reached' : '⚠️ Couldn’t read that document',
      html: shell(
        isLimit
          ? `<h2 style="margin:0 0 6px;font-size:18px;color:#111827;">Scan limit reached</h2>
             <p style="margin:0 0 16px;font-size:14px;color:#4b5563;">We couldn’t analyze your forwarded document because you’ve used all your scans this month.</p>
             <a href="${APP_URL()}/pricing" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:700;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;">Upgrade to Pro →</a>`
          : `<h2 style="margin:0 0 6px;font-size:18px;color:#111827;">Couldn’t read that document</h2>
             <p style="margin:0;font-size:14px;color:#4b5563;">We couldn’t find an analyzable document in your forwarded email. Try forwarding it again with the bill, letter, or PDF as an attachment.</p>`,
      ),
    });
  } catch (e) {
    console.error('[inbound-notice] send failed (non-fatal):', e instanceof Error ? e.message : e);
  }
}

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');
const FROM = 'PaperLens <hello@paperlens.co>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://paperlens.co';

/**
 * Day 14 drip — upgrade nudge for free users who have used ≥5 of their 10 scans.
 * Only sent when scansUsed >= 5 (caller is responsible for checking).
 * Goal: convert active free users before they hit the 10-scan ceiling.
 */
export async function sendDripDay14(
  email: string,
  name?: string | null,
  scansUsed = 0,
): Promise<void> {
  const firstName = name?.split(' ')[0]?.trim() || 'there';
  const scansLeft = Math.max(0, 10 - scansUsed);
  const usageLabel =
    scansLeft === 0
      ? "You've used all 10 of your free uploads."
      : `You've used ${scansUsed} of your 10 free uploads — ${scansLeft} left.`;

  const proPerks = [
    ['Unlimited scans', 'No monthly ceiling — upload everything.'],
    ['Unlimited AI chat', 'Ask as many follow-up questions as you need.'],
    ['Re-analyse anytime', 'Run a fresh analysis whenever a document changes.'],
    ['Priority processing', 'Your scans jump to the front of the queue.'],
  ];

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${firstName}, you're almost out of free scans.`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:0;background:#ffffff;color:#0f172a;">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#d97706,#b45309);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
            <img src="${appUrl}/logo.png" alt="PaperLens" width="40" height="40" style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
            <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
              Don't let paperwork<br/>pile up again.
            </div>
          </div>

          <!-- Body -->
          <div style="padding:32px 28px;">
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              Hey ${firstName} —
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              ${usageLabel} You've already seen what PaperLens can do.
              The question is: what happens when the next letter arrives and you're out of scans?
            </p>

            <!-- Usage bar -->
            <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
              <p style="font-size:12px;font-weight:700;color:#475569;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Your usage</p>
              <div style="background:#e2e8f0;border-radius:99px;height:8px;overflow:hidden;">
                <div style="background:#d97706;height:8px;border-radius:99px;width:${Math.min(100, scansUsed * 10)}%;"></div>
              </div>
              <p style="font-size:12px;color:#64748b;margin:8px 0 0;">${scansUsed} / 10 uploads used</p>
            </div>

            <!-- Pro perks -->
            <p style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 12px;">
              Go Pro and never worry about limits:
            </p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
              ${proPerks
                .map(
                  ([title, desc]) => `
                <tr>
                  <td style="padding:6px 10px 6px 0;vertical-align:top;width:20px;">
                    <span style="color:#d97706;font-size:14px;font-weight:700;">✓</span>
                  </td>
                  <td style="padding:6px 0;">
                    <span style="font-size:13px;font-weight:600;color:#0f172a;">${title}</span>
                    <span style="font-size:13px;color:#64748b;"> — ${desc}</span>
                  </td>
                </tr>
              `,
                )
                .join('')}
            </table>

            <!-- Price callout -->
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 20px;margin:0 0 24px;text-align:center;">
              <p style="font-size:13px;color:#92400e;margin:0 0 4px;font-weight:700;">Pro starts at just</p>
              <p style="font-size:32px;font-weight:900;color:#b45309;margin:0;line-height:1;">$4.99<span style="font-size:16px;font-weight:600;">/mo</span></p>
              <p style="font-size:12px;color:#92400e;margin:6px 0 0;">Billed yearly · Cancel anytime · No card required to try free</p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin:0 0 20px;">
              <a href="${appUrl}/pricing"
                 style="display:inline-block;background:#d97706;color:#0f172a;font-weight:800;padding:16px 36px;border-radius:12px;text-decoration:none;font-size:16px;letter-spacing:-0.2px;">
                Upgrade to Pro →
              </a>
            </div>

            <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
              Stay on free — your existing scans and vault are always kept.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding:16px 28px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="font-size:12px;color:#94a3b8;margin:0;">
              PaperLens · <a href="${appUrl}" style="color:#94a3b8;">paperlens.co</a>
              &nbsp;·&nbsp;
              <a href="${appUrl}/settings" style="color:#94a3b8;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('[drip-day14] email send failed:', err);
  }
}

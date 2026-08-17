import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');
const FROM = 'PaperLens <hello@paperlens.co>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://paperlens.co';

/**
 * Day 30 drip — re-engagement / win-back for users who have been inactive.
 * Sent when the user's last_active_at (or last document created_at) is 30+ days ago.
 * Caller is responsible for checking inactivity before calling this.
 * Goal: remind them why they signed up and pull them back in.
 */
export async function sendDripDay30(email: string, name?: string | null): Promise<void> {
  const firstName = name?.split(' ')[0]?.trim() || 'there';

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${firstName}, your PaperLens account is waiting.`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:0;background:#ffffff;color:#0f172a;">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#1e293b,#334155);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
            <img src="${appUrl}/logo.png" alt="PaperLens" width="40" height="40" style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
            <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
              It's been a while.<br/>We saved your spot.
            </div>
          </div>

          <!-- Body -->
          <div style="padding:32px 28px;">
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              Hey ${firstName} —
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              A month ago you signed up for PaperLens. We're guessing life got busy —
              there are always more letters, more bills, more notices.
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              The thing is: that stack of paper didn't go anywhere. And the anxiety
              of not knowing what's in it doesn't either.
            </p>

            <!-- Callout -->
            <div style="background:#f8fafc;border-left:4px solid #d97706;border-radius:0 12px 12px 0;padding:18px 20px;margin:0 0 24px;">
              <p style="font-size:14px;font-weight:600;color:#0f172a;margin:0 0 8px;">
                Here's what's still true about your account:
              </p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${[
                  'Your vault is intact — every old scan is still there.',
                  "Your free uploads haven't expired.",
                  'You can scan a new document right now, in 10 seconds.',
                ]
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding:4px 8px 4px 0;vertical-align:top;width:20px;color:#d97706;font-size:14px;">✓</td>
                    <td style="padding:4px 0;font-size:13px;color:#475569;line-height:1.5;">${item}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </table>
            </div>

            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 28px;">
              Pick up one document — just one — that's been nagging at you.
              Scan it. You'll know exactly what it means in 10 seconds.
            </p>

            <!-- CTA -->
            <div style="text-align:center;margin:0 0 24px;">
              <a href="${appUrl}/scan"
                 style="display:inline-block;background:#d97706;color:#0f172a;font-weight:800;padding:16px 36px;border-radius:12px;text-decoration:none;font-size:16px;letter-spacing:-0.2px;">
                Scan a Document Now →
              </a>
            </div>

            <!-- Social proof nudge -->
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
              <p style="font-size:13px;color:#92400e;margin:0;font-style:italic;line-height:1.6;">
                "I had a stack of 12 NHS letters I'd been ignoring for 3 months.
                PaperLens sorted all of them in under 5 minutes. I wished I'd started sooner."
              </p>
              <p style="font-size:11px;color:#b45309;margin:8px 0 0;font-weight:600;">— Beta user, London</p>
            </div>

            <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
              This is the last reminder we'll send. Your account stays active regardless.
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
    console.error('[drip-day30] email send failed:', err);
  }
}

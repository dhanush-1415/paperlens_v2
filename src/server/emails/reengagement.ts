import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');
const FROM = 'PaperLens <hello@paperlens.co>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://paperlens.co';

/**
 * Re-engagement email — sent to ANY user (free or Pro) who has not uploaded
 * a document in the last 30 days, regardless of signup date.
 *
 * This is a rolling lifecycle trigger — different from the day-30 drip (which
 * fires only on day-30 of signup). This fires whenever 30 days of inactivity
 * is detected, for any user at any stage of their lifecycle.
 *
 * Caller must verify: last document created_at < 30 days ago.
 */
export async function sendReengagementEmail(email: string, name?: string | null): Promise<void> {
  const firstName = name?.split(' ')[0]?.trim() || 'there';

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${firstName}, the paperwork isn't going to read itself.`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:0;background:#ffffff;color:#0f172a;">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
            <img src="${appUrl}/logo.png" alt="PaperLens" width="40" height="40" style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
            <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.3;">
              You haven't uploaded<br/>anything in a while.
            </div>
          </div>

          <!-- Body -->
          <div style="padding:32px 28px;">
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              Hey ${firstName} —
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              We're not judging — we all let the pile grow. But here's the thing:
              every document sitting unread is either costing you money, adding to your anxiety,
              or both.
            </p>
            <p style="font-size:15px;font-weight:600;color:#0f172a;line-height:1.7;margin:0 0 24px;">
              10 seconds is all it takes. Upload one thing right now.
            </p>

            <!-- Ideas for what to upload -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:0 0 24px;">
              <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 12px;">
                Got any of these sitting on your counter?
              </p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${[
                  ['📬', 'A letter from the IRS or tax authority'],
                  ['🏥', 'A medical bill or insurance explanation'],
                  ['🏠', 'A notice from your landlord or HOA'],
                  ['⚖️', 'Anything legal — summons, contract, demand letter'],
                  ['💳', 'A debt collection notice or bank letter'],
                ]
                  .map(
                    ([icon, text]) => `
                  <tr>
                    <td style="padding:4px 8px 4px 0;vertical-align:top;width:24px;font-size:15px;">${icon}</td>
                    <td style="padding:4px 0;font-size:13px;color:#475569;line-height:1.5;">${text}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin:0 0 20px;">
              <a href="${appUrl}/scan"
                 style="display:inline-block;background:#d97706;color:#0f172a;font-weight:800;padding:16px 40px;border-radius:12px;text-decoration:none;font-size:16px;letter-spacing:-0.2px;">
                Upload a Document Now →
              </a>
            </div>

            <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
              Your account and vault are exactly as you left them.
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
    console.error('[reengagement] email send failed:', err);
  }
}

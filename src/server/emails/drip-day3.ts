import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');
const FROM = 'PaperLens <hello@paperlens.co>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://paperlens.co';

/**
 * Day 3 drip — sent to users who signed up 3 days ago and have never uploaded a document.
 * Goal: get them to upload their first document.
 */
export async function sendDripDay3(email: string, name?: string | null): Promise<void> {
  const firstName = name?.split(' ')[0]?.trim() || 'there';

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Still haven't tried PaperLens? Here's what you're missing.",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:0;background:#ffffff;color:#0f172a;">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#d97706,#b45309);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
            <img src="${appUrl}/logo.png" alt="PaperLens" width="40" height="40" style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
            <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
              Your first document<br/>is waiting.
            </div>
          </div>

          <!-- Body -->
          <div style="padding:32px 28px;">
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              Hey ${firstName} —
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              You signed up for PaperLens 3 days ago. That means somewhere in your house
              (or your inbox) there's a letter, a bill, or a notice you've been
              putting off reading. That thing that makes you a little anxious every time you see it.
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              <strong>Upload it right now. You'll know what it means in 10 seconds.</strong>
            </p>

            <!-- CTA -->
            <div style="text-align:center;margin:28px 0;">
              <a href="${appUrl}/scan"
                 style="display:inline-block;background:#d97706;color:#0f172a;font-weight:800;padding:16px 36px;border-radius:12px;text-decoration:none;font-size:16px;letter-spacing:-0.2px;">
                Upload My Document →
              </a>
            </div>

            <!-- What you get -->
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px 22px;margin:0 0 24px;">
              <p style="font-size:13px;font-weight:700;color:#92400e;margin:0 0 12px;">
                Here's what you get in 10 seconds:
              </p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${[
                  ['✓', 'A plain-English summary — no jargon'],
                  ['✓', 'Your urgency level (is this critical or can it wait?)'],
                  ['✓', 'Every deadline extracted automatically'],
                  ['✓', 'Exactly what to do next, step by step'],
                ]
                  .map(
                    ([icon, text]) => `
                  <tr>
                    <td style="padding:4px 8px 4px 0;vertical-align:top;width:20px;font-size:14px;color:#d97706;">${icon}</td>
                    <td style="padding:4px 0;font-size:13px;color:#374151;line-height:1.5;">${text}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </table>
            </div>

            <p style="font-size:13px;color:#94a3b8;margin:0;">
              You have <strong style="color:#374151;">10 free uploads</strong> on your account —
              no credit card needed, ever.
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
    console.error('[drip-day3] email send failed:', err);
  }
}

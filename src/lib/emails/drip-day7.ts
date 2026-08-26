import { Resend } from 'resend';

const resend  = new Resend(process.env.RESEND_API_KEY || 're_123');
const FROM    = 'PaperLens <hello@paperlens.co>';
const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://paperlens.co';

/**
 * Day 7 drip — sent to all users who signed up 7 days ago.
 * Goal: teach power features (vault, deadlines, multilingual) to drive habit.
 */
export async function sendDripDay7(email: string, name?: string | null): Promise<void> {
  const firstName = name?.split(' ')[0]?.trim() || 'there';

  const features = [
    {
      icon: '🗂️',
      title: 'The Vault',
      body: 'Every document you scan is saved permanently. Search, filter, and revisit anything — no more digging through paper piles.',
    },
    {
      icon: '📅',
      title: 'Deadline Extraction',
      body: 'PaperLens automatically pulls out every date and deadline. You\'ll never miss a payment due date or response window again.',
    },
    {
      icon: '🌍',
      title: '100+ Languages',
      body: 'Got a letter in Spanish, German, or Hindi? Upload it. PaperLens reads and explains it in plain English (or your language of choice).',
    },
    {
      icon: '💬',
      title: 'Ask Follow-Up Questions',
      body: 'After scanning, tap "Ask a question" to dig deeper — "Do I need a lawyer?", "What happens if I ignore this?" — real answers, instantly.',
    },
  ];

  try {
    await resend.emails.send({
      from:    FROM,
      to:      email,
      subject: `${firstName}, here's everything PaperLens can do for you.`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:0;background:#ffffff;color:#0f172a;">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#d97706,#b45309);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
            <img src="${appUrl}/logo.png" alt="PaperLens" width="40" height="40" style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
            <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
              You're a week in.<br/>Here's what you might<br/>have missed.
            </div>
          </div>

          <!-- Body -->
          <div style="padding:32px 28px;">
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
              Hey ${firstName} —
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
              Most people only discover the basics. Here are four things that make PaperLens
              genuinely useful — not just for one document, but for everything that lands in
              your mailbox.
            </p>

            <!-- Feature cards -->
            ${features.map(f => `
              <div style="border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:14px;background:#fafafa;">
                <p style="font-size:15px;font-weight:700;color:#0f172a;margin:0 0 6px;">
                  ${f.icon}&nbsp; ${f.title}
                </p>
                <p style="font-size:13px;color:#475569;line-height:1.6;margin:0;">
                  ${f.body}
                </p>
              </div>
            `).join('')}

            <!-- CTA -->
            <div style="text-align:center;margin:28px 0 20px;">
              <a href="${appUrl}/scan"
                 style="display:inline-block;background:#d97706;color:#0f172a;font-weight:800;padding:16px 36px;border-radius:12px;text-decoration:none;font-size:16px;letter-spacing:-0.2px;">
                Try One Now →
              </a>
            </div>

            <p style="font-size:13px;color:#94a3b8;margin:0;text-align:center;">
              You have <strong style="color:#374151;">10 free uploads</strong> — no credit card needed.
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
    console.error('[drip-day7] email send failed:', err);
  }
}

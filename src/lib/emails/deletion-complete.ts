import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

export async function sendDeletionCompleteEmail(
  email: string,
  name?: string | null,
): Promise<void> {
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.paperlens.co';
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'PaperLens <hello@paperlens.co>';
  const firstName = name?.split(' ')[0] ?? 'there';

  try {
    const { error } = await resend.emails.send({
      from:    fromEmail,
      to:      email,
      subject: 'Your PaperLens account has been deleted',
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

    <div style="background:linear-gradient(135deg,#1a0f2e 0%,#0c0a14 100%);padding:24px 32px;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;padding-right:11px;">
          <img src="${appUrl}/logo.png" alt="PaperLens" width="38" height="38" style="display:block;border-radius:9px;" />
        </td>
        <td style="vertical-align:middle;">
          <div style="font-size:19px;font-weight:800;color:#f8f7ff;letter-spacing:-0.4px;line-height:1.1;">PaperLens</div>
        </td>
      </tr></table>
    </div>

    <div style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
        Your account has been deleted, ${firstName}
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
        Your PaperLens account and all associated data have been permanently deleted as requested.
      </p>

      <p style="margin:0 0 8px;font-size:14px;color:#374151;">What was deleted:</p>
      <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#6b7280;line-height:1.8;">
        <li>Profile and account information</li>
        <li>All documents and vault contents</li>
        <li>All AI chat history</li>
        <li>All folders and reminders</li>
      </ul>

      <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:24px;border:1px solid #e5e7eb;">
        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
          Residual copies in encrypted backups will be purged within <strong>30 days</strong>.
          Any active subscription has been cancelled — no further charges will occur.
        </p>
      </div>

      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
        We&apos;re sorry to see you go. If you ever want to come back, you can always create a new account.
        If you have feedback, reply to this email — we read every one.
      </p>
    </div>

    <div style="padding:20px 32px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
        This is a final notification. This email address will not receive further messages from PaperLens.
      </p>
    </div>

  </div>
</body>
</html>`.trim(),
    });

    if (error) console.error('[deletion-complete-email] Resend error:', error);
    else console.log('[deletion-complete-email] Sent to:', email);
  } catch (err) {
    console.error('[deletion-complete-email] Failed:', err instanceof Error ? err.message : err);
  }
}

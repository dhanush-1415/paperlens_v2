import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

export async function sendDeletionScheduledEmail(
  email: string,
  deleteAt: string,
  name?: string | null,
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.paperlens.co';
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'PaperLens <hello@paperlens.co>';
  const firstName = name?.split(' ')[0] ?? 'there';

  const deleteDate = new Date(deleteAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: '⚠️ Your PaperLens account is scheduled for deletion',
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
        Account deletion scheduled, ${firstName}
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
        We received a request to permanently delete your PaperLens account and all associated data.
      </p>

      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;padding:14px 16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#b91c1c;">Deletion scheduled for:</p>
        <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${deleteDate}</p>
      </div>

      <p style="margin:0 0 8px;font-size:14px;color:#374151;">The following will be permanently deleted:</p>
      <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#6b7280;line-height:1.8;">
        <li>Your profile and account information</li>
        <li>All documents and vault contents</li>
        <li>All AI chat history</li>
        <li>All folders and reminders</li>
      </ul>

      <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;padding:14px 16px;margin-bottom:28px;">
        <p style="margin:0;font-size:13px;color:#15803d;line-height:1.5;">
          <strong>Changed your mind?</strong> You can cancel this deletion request within the next 48 hours from your account settings.
        </p>
      </div>

      <a href="${appUrl}/settings"
         style="display:inline-block;background:#0f172a;color:#fff;font-weight:700;
                padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
        Cancel deletion →
      </a>
    </div>

    <div style="padding:20px 32px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
        If you did not request this, please <a href="mailto:support@paperlens.co" style="color:#9ca3af;">contact support</a> immediately.
        Residual copies in encrypted backups are purged within 30 days of deletion.
      </p>
    </div>

  </div>
</body>
</html>`.trim(),
    });

    if (error) console.error('[deletion-scheduled-email] Resend error:', error);
    else console.log('[deletion-scheduled-email] Sent to:', email);
  } catch (err) {
    console.error('[deletion-scheduled-email] Failed:', err instanceof Error ? err.message : err);
  }
}

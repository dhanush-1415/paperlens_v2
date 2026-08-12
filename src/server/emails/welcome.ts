import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

/**
 * Sends a welcome email to a newly verified user.
 * Non-fatal — logs on failure but never throws.
 */
export async function sendWelcomeEmail(email: string, name?: string | null): Promise<void> {
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.paperlens.co';
  const fromEmail = process.env.RESEND_FROM_EMAIL   ?? 'PaperLens <hello@paperlens.co>';
  const firstName = name?.split(' ')[0] ?? 'there';

  try {
    const { error } = await resend.emails.send({
      from:    fromEmail,
      to:      email,
      subject: '👋 Welcome to PaperLens — you\'re all set',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to PaperLens</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;padding:0 16px 48px;">

  <!-- Logo header -->
  <div style="background:linear-gradient(135deg,#1a0f2e 0%,#0c0a14 100%);border-radius:16px 16px 0 0;padding:28px 32px;">
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align:middle;padding-right:12px;">
          <img src="${appUrl}/logo.png" alt="PaperLens" width="42" height="42" style="display:block;border-radius:10px;" />
        </td>
        <td style="vertical-align:middle;">
          <div style="font-size:20px;font-weight:800;color:#f8f7ff;letter-spacing:-0.4px;line-height:1.1;">PaperLens</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Body -->
  <div style="background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;padding:36px 32px 32px;">

    <!-- Greeting -->
    <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.4px;">
      Welcome, ${firstName}! 🎉
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.7;">
      Your account is verified and ready. PaperLens reads your documents —
      letters, bills, contracts, notices — and tells you exactly what they mean
      and what to do next.
    </p>

    <!-- What you can do -->
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;margin-bottom:14px;">
      What you can do
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr>
        <!-- Scan -->
        <td width="48%" style="vertical-align:top;padding-right:8px;padding-bottom:12px;">
          <div style="background:#faf9ff;border:1px solid #ede9fe;border-radius:12px;padding:18px 16px;">
            <div style="font-size:26px;line-height:1;margin-bottom:10px;">📤</div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:5px;">Scan any document</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.55;">Photo, PDF, or paste text. IRS letters, leases, medical bills — anything.</div>
          </div>
        </td>
        <!-- AI Summary -->
        <td width="48%" style="vertical-align:top;padding-left:8px;padding-bottom:12px;">
          <div style="background:#faf9ff;border:1px solid #ede9fe;border-radius:12px;padding:18px 16px;">
            <div style="font-size:26px;line-height:1;margin-bottom:10px;">⚡</div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:5px;">Instant AI summary</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.55;">Urgency level, action required, key dates — decoded in ~10 seconds.</div>
          </div>
        </td>
      </tr>
      <tr>
        <!-- Chat -->
        <td width="48%" style="vertical-align:top;padding-right:8px;">
          <div style="background:#faf9ff;border:1px solid #ede9fe;border-radius:12px;padding:18px 16px;">
            <div style="font-size:26px;line-height:1;margin-bottom:10px;">💬</div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:5px;">Ask questions</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.55;">Chat with your document in plain language. No jargon, no guessing.</div>
          </div>
        </td>
        <!-- Vault -->
        <td width="48%" style="vertical-align:top;padding-left:8px;">
          <div style="background:#faf9ff;border:1px solid #ede9fe;border-radius:12px;padding:18px 16px;">
            <div style="font-size:26px;line-height:1;margin-bottom:10px;">🗄️</div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:5px;">Save to vault</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.55;">Store docs, set deadline reminders, and organise by folder.</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Free plan note -->
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="vertical-align:top;padding-right:10px;width:20px;">
            <div style="font-size:16px;line-height:1.4;">💡</div>
          </td>
          <td style="vertical-align:top;">
            <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:3px;">You're on the Free plan</div>
            <div style="font-size:12px;color:#b45309;line-height:1.55;">
              10 scans and 20 AI chat messages per month.
              <a href="${appUrl}/pricing" style="color:#d97706;font-weight:700;text-decoration:none;">Upgrade to Pro →</a>
              for unlimited vault, 26 languages, and deadline reminders.
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <a href="${appUrl}/scan"
       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;font-weight:700;
              padding:15px 32px;border-radius:10px;text-decoration:none;font-size:15px;letter-spacing:-0.2px;">
      Scan your first document →
    </a>

  </div>

  <!-- Footer -->
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7;">
      You're receiving this because you signed up for PaperLens.<br/>
      Questions? Reply to this email — we read every one.<br/>
      <a href="${appUrl}" style="color:#c4b5fd;text-decoration:none;">paperlens.co</a>
    </p>
  </div>

</div>
</body>
</html>
      `.trim(),
    });

    if (error) {
      console.error('[welcome-email] Resend error:', error);
    } else {
      console.log('[welcome-email] Sent to:', email);
    }
  } catch (err) {
    console.error('[welcome-email] Failed:', err instanceof Error ? err.message : err);
  }
}

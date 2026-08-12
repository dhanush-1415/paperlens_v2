import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

/**
 * Sent when a Pro subscription has expired (period ended, no renewal detected).
 * Non-fatal — logs on failure but never throws.
 */
export async function sendSubscriptionExpiredEmail(
  email: string,
  name?: string | null,
): Promise<void> {
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.paperlens.co';
  const fromEmail = process.env.RESEND_FROM_EMAIL   ?? 'PaperLens <hello@paperlens.co>';
  const firstName = name?.split(' ')[0] ?? 'there';

  try {
    const { error } = await resend.emails.send({
      from:    fromEmail,
      to:      email,
      subject: 'Your PaperLens Pro subscription has expired',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your PaperLens Pro subscription has expired</title>
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
  <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

    <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f0a1e;">Hi ${firstName} 👋</p>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
      Your <strong style="color:#0f0a1e;">PaperLens Pro</strong> subscription has expired. Your account is now on the <strong>free plan</strong>.
    </p>

    <!-- What changed -->
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#b91c1c;text-transform:uppercase;letter-spacing:0.05em;">What changed</p>
      <ul style="margin:0;padding:0 0 0 18px;font-size:14px;color:#374151;line-height:1.8;">
        <li>Upload limit reduced to <strong>5 scans / month</strong></li>
        <li>AI chat limited to <strong>20 messages / month</strong></li>
        <li>Vault documents are now <strong>temporary (24h)</strong> for new uploads</li>
        <li>Re-analysis and language switching are <strong>disabled</strong></li>
      </ul>
      <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">
        Your existing saved documents are still in your vault and won't be deleted.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${appUrl}/pricing"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:50px;box-shadow:0 4px 16px rgba(124,58,237,0.35);">
        Renew Pro — from $4.99/mo →
      </a>
    </div>

    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;text-align:center;">
      Or continue with the free plan — no action needed.
    </p>

    <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;" />

    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
      PaperLens · <a href="${appUrl}" style="color:#7c3aed;text-decoration:none;">paperlens.co</a>
      · <a href="${appUrl}/settings" style="color:#9ca3af;">Manage subscription</a>
    </p>
  </div>
</div>
</body>
</html>`,
    });

    if (error) {
      console.error('[sendSubscriptionExpiredEmail] Resend error:', error);
    }
  } catch (err) {
    console.error('[sendSubscriptionExpiredEmail] Failed to send:', err);
  }
}

/**
 * Sent 3 days before a Pro subscription is set to expire (upcoming renewal warning).
 */
export async function sendSubscriptionRenewingEmail(
  email: string,
  renewalDate: string,
  name?: string | null,
): Promise<void> {
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.paperlens.co';
  const fromEmail = process.env.RESEND_FROM_EMAIL   ?? 'PaperLens <hello@paperlens.co>';
  const firstName = name?.split(' ')[0] ?? 'there';

  const formatted = new Date(renewalDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  try {
    const { error } = await resend.emails.send({
      from:    fromEmail,
      to:      email,
      subject: `Your PaperLens Pro renews on ${formatted}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PaperLens Pro renewal reminder</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;padding:0 16px 48px;">

  <div style="background:linear-gradient(135deg,#1a0f2e 0%,#0c0a14 100%);border-radius:16px 16px 0 0;padding:28px 32px;">
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align:middle;padding-right:12px;">
          <img src="${appUrl}/logo.png" alt="PaperLens" width="42" height="42" style="display:block;border-radius:10px;" />
        </td>
        <td style="vertical-align:middle;">
          <div style="font-size:20px;font-weight:800;color:#f8f7ff;letter-spacing:-0.4px;">PaperLens</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

    <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f0a1e;">Renewing soon, ${firstName}</p>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
      Your <strong style="color:#0f0a1e;">PaperLens Pro</strong> subscription renews on
      <strong style="color:#0f0a1e;">${formatted}</strong>.
      Your payment method on file will be charged automatically — no action needed.
    </p>

    <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#5b21b6;text-transform:uppercase;letter-spacing:0.05em;">Your Pro benefits continue</p>
      <ul style="margin:0;padding:0 0 0 18px;font-size:14px;color:#374151;line-height:1.8;">
        <li>More scans &amp; AI chat messages every month</li>
        <li>Permanent vault storage</li>
        <li>Re-analysis &amp; all 26+ languages</li>
        <li>Email deadline reminders</li>
      </ul>
    </div>

    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
      If you'd like to cancel before renewal, visit
      <a href="${appUrl}/settings" style="color:#7c3aed;text-decoration:none;">Settings → Subscription</a>.
    </p>

    <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;" />
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
      PaperLens · <a href="${appUrl}" style="color:#7c3aed;text-decoration:none;">paperlens.co</a>
    </p>
  </div>
</div>
</body>
</html>`,
    });

    if (error) {
      console.error('[sendSubscriptionRenewingEmail] Resend error:', error);
    }
  } catch (err) {
    console.error('[sendSubscriptionRenewingEmail] Failed to send:', err);
  }
}

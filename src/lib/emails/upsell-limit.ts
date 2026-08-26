import { Resend } from 'resend';

const resend  = new Resend(process.env.RESEND_API_KEY || 're_123');
const FROM    = 'PaperLens <hello@paperlens.co>';
const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://paperlens.co';

/**
 * Upsell email — sent to free users who have used ≥8 of their 10 free scans (80%).
 * Intent: convert before they hit the ceiling and get frustrated.
 *
 * Caller must verify: plan_tier = 'free' AND scans_used >= 8.
 */
export async function sendUpsellLimitEmail(
  email: string,
  name?: string | null,
  scansUsed = 8,
): Promise<void> {
  const firstName = name?.split(' ')[0]?.trim() || 'there';
  const scansLeft = Math.max(0, 10 - scansUsed);
  const scansLeftLabel = scansLeft === 0
    ? "You've hit your free limit"
    : scansLeft === 1
      ? 'You have 1 free scan left'
      : `You have ${scansLeft} free scans left`;

  try {
    await resend.emails.send({
      from:    FROM,
      to:      email,
      subject: `${firstName}, you're almost out of free scans — here's what to do.`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:0;background:#ffffff;color:#0f172a;">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#d97706,#b45309);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
            <img src="${appUrl}/logo.png" alt="PaperLens" width="40" height="40" style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
            <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.25;">
              ${scansLeftLabel}.
            </div>
            <p style="font-size:14px;color:rgba(255,255,255,0.8);margin:10px 0 0;">
              ${scansUsed} of 10 free scans used.
            </p>
          </div>

          <!-- Usage bar -->
          <div style="background:#fafafa;padding:0 28px 0;border-left:1px solid #f1f5f9;border-right:1px solid #f1f5f9;">
            <div style="padding:20px 0;">
              <div style="background:#e2e8f0;border-radius:99px;height:10px;overflow:hidden;">
                <div style="background:linear-gradient(to right,#d97706,#b45309);height:10px;border-radius:99px;width:${Math.min(100, scansUsed * 10)}%;"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:6px;">
                <span style="font-size:11px;color:#64748b;">0 scans</span>
                <span style="font-size:11px;color:#64748b;">10 scans</span>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div style="padding:24px 28px 32px;border:1px solid #f1f5f9;border-top:none;">
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              Hey ${firstName} —
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              You've been using PaperLens — which means you know how much clearer everything
              looks once a document is decoded. The free plan got you started. Pro keeps it going.
            </p>

            <!-- Price comparison -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px 22px;margin:0 0 24px;">
              <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 14px;">Compare the plans:</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:8px 0;font-size:12px;color:#64748b;font-weight:600;width:50%;"></td>
                  <td style="padding:8px 8px;font-size:12px;color:#64748b;font-weight:700;text-align:center;">Free</td>
                  <td style="padding:8px 0;font-size:12px;color:#d97706;font-weight:700;text-align:center;">Pro</td>
                </tr>
                ${[
                  ['Scans / month', '10', 'Unlimited'],
                  ['AI questions', '20', 'Unlimited'],
                  ['Re-analysis', '✗', '✓'],
                  ['Price', '$0', 'From $4.99/mo'],
                ].map(([label, free, pro]) => `
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#374151;">${label}</td>
                    <td style="padding:7px 8px;font-size:13px;color:#94a3b8;text-align:center;">${free}</td>
                    <td style="padding:7px 0;font-size:13px;color:#d97706;font-weight:600;text-align:center;">${pro}</td>
                  </tr>
                `).join('')}
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin:0 0 16px;">
              <a href="${appUrl}/pricing"
                 style="display:inline-block;background:#d97706;color:#0f172a;font-weight:800;padding:16px 40px;border-radius:12px;text-decoration:none;font-size:16px;letter-spacing:-0.2px;">
                Go Unlimited — from $4.99/mo →
              </a>
            </div>

            <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
              Cancel anytime. Your free vault and past scans are always kept.
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
    console.error('[upsell-limit] email send failed:', err);
  }
}

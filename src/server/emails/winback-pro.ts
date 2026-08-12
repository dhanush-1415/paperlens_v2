import { Resend } from 'resend';

const resend  = new Resend(process.env.RESEND_API_KEY || 're_123');
const FROM    = 'PaperLens <hello@paperlens.co>';
const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://paperlens.co';

/**
 * Win-back email — sent to users who cancelled Pro within the last 7–14 days.
 * Offers 30% off via the processor the user originally paid through:
 *
 *   LemonSqueezy (USD/international):
 *     Uses a discount code (LEMON_WINBACK_COUPON env var). User enters at checkout.
 *
 *   Razorpay (INR/India):
 *     Razorpay does NOT support user-entered promo codes at checkout.
 *     Instead, we send a pre-built Payment Link with the discounted price baked in
 *     (RAZORPAY_WINBACK_PAYMENT_LINK env var — create once in Razorpay dashboard →
 *      Payment Links, set amount to ₹349/mo with a 7-day expiry, reuse the link).
 *     For a truly personalised expiring link, generate it via Razorpay API instead.
 *
 * Caller must verify user is churned (plan_tier='free', cancelled=true) before calling.
 */
export async function sendWinbackProEmail(
  email: string,
  name?: string | null,
  processor: 'lemon' | 'razorpay' = 'lemon',
): Promise<void> {
  const firstName = name?.split(' ')[0]?.trim() || 'there';

  const isRazorpay = processor === 'razorpay';

  // LemonSqueezy: coupon code the user types at checkout
  const lemonCoupon = process.env.LEMON_WINBACK_COUPON ?? 'COMEBACK30';

  // Razorpay: pre-built Payment Links with discounted prices baked in
  // Monthly: ₹399 × 0.70 = ₹279  → create in Razorpay dashboard → Payment Links
  // Yearly:  ₹3192 × 0.70 = ₹2234 → create separately
  const rzpMonthlyLink = process.env.RAZORPAY_WINBACK_LINK_MONTHLY ?? `${appUrl}/pricing`;
  const rzpYearlyLink  = process.env.RAZORPAY_WINBACK_LINK_YEARLY  ?? `${appUrl}/pricing`;

  const offerBlock = isRazorpay
    // Razorpay: two buttons — monthly and yearly discounted links
    ? `<p style="font-size:13px;color:#92400e;margin:8px 0 0;">Price already reduced — no code needed. Pick your plan below.</p>`
    // LemonSqueezy: show the coupon code
    : `
      <div style="background:#ffffff;border:1px dashed #d97706;border-radius:10px;padding:12px 20px;display:inline-block;">
        <p style="font-size:11px;color:#64748b;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.06em;">Your coupon code</p>
        <p style="font-size:22px;font-weight:900;color:#0f172a;margin:0;letter-spacing:0.12em;font-family:monospace;">${lemonCoupon}</p>
      </div>`;

  const ctaButtons = isRazorpay
    ? `
      <div style="text-align:center;margin:0 0 12px;">
        <a href="${rzpYearlyLink}"
           style="display:inline-block;background:#d97706;color:#0f172a;font-weight:800;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;letter-spacing:-0.2px;">
          ₹2,234/year — Best Value →
        </a>
      </div>
      <div style="text-align:center;margin:0 0 20px;">
        <a href="${rzpMonthlyLink}"
           style="display:inline-block;background:transparent;color:#d97706;font-weight:700;padding:10px 28px;border-radius:12px;text-decoration:none;font-size:14px;border:1.5px solid #d97706;">
          ₹279/month instead
        </a>
      </div>`
    : `
      <div style="text-align:center;margin:0 0 20px;">
        <a href="${appUrl}/pricing"
           style="display:inline-block;background:#d97706;color:#0f172a;font-weight:800;padding:16px 40px;border-radius:12px;text-decoration:none;font-size:16px;letter-spacing:-0.2px;">
          Reactivate Pro — 30% Off →
        </a>
      </div>`;

  const noteText = isRazorpay
    ? 'Discounted price applied automatically. Offer valid for 7 days. Cancel anytime.'
    : `Apply code <strong style="color:#374151;">${lemonCoupon}</strong> at checkout. Offer valid for 7 days. Cancel anytime.`;

  try {
    await resend.emails.send({
      from:    FROM,
      to:      email,
      subject: `${firstName}, here's 30% off to come back to PaperLens Pro.`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:0;background:#ffffff;color:#0f172a;">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#1e293b,#334155);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
            <img src="${appUrl}/logo.png" alt="PaperLens" width="40" height="40" style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
            <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.25;">
              We noticed you left.<br/>We'd like you back.
            </div>
          </div>

          <!-- Body -->
          <div style="padding:32px 28px;">
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              Hey ${firstName} —
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
              Your Pro subscription ended. We get it — sometimes the timing isn't right.
              But the paperwork doesn't stop, and we want to make it easy to come back.
            </p>

            <!-- Offer callout -->
            <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fde68a;border-radius:16px;padding:24px 24px;margin:0 0 24px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#92400e;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;">Limited offer — for you only</p>
              <p style="font-size:40px;font-weight:900;color:#b45309;margin:0;line-height:1;">30% OFF</p>
              <p style="font-size:15px;color:#92400e;margin:8px 0 16px;">your next Pro billing cycle</p>
              ${offerBlock}
            </div>

            <!-- What you had -->
            <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 10px;">What you had with Pro:</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
              ${[
                'Unlimited document scans — no monthly ceiling',
                'Unlimited AI follow-up questions',
                'Re-analyse any document at any time',
                'Priority processing — results in under 5 seconds',
              ].map(item => `
                <tr>
                  <td style="padding:5px 8px 5px 0;vertical-align:top;width:20px;color:#d97706;font-size:14px;font-weight:700;">✓</td>
                  <td style="padding:5px 0;font-size:13px;color:#475569;line-height:1.5;">${item}</td>
                </tr>
              `).join('')}
            </table>

            <!-- Price note -->
            <p style="font-size:13px;color:#374151;text-align:center;margin:0 0 16px;">
              ${isRazorpay ? '30% off — choose your plan:' : '30% off Pro — just for you.'}
            </p>

            <!-- CTA(s) -->
            ${ctaButtons}

            <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
              ${noteText}
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
    console.error('[winback-pro] email send failed:', err);
  }
}

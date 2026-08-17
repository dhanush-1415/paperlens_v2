/**
 * Shared email primitives — single source of truth for logo, URL, and FROM.
 *
 * Use logo.png (not .svg) — Outlook and many mobile clients do not render SVG in email.
 * The PNG is served from the canonical domain and cached by email clients.
 */

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.paperlens.co';
export const FROM = 'PaperLens <hello@paperlens.co>';

/**
 * Inline logo block for dark/gradient header backgrounds.
 * Renders the logo icon + "PaperLens" wordmark side-by-side.
 *
 * @param textColor  Hex colour for the "PaperLens" text. Default white.
 */
export function emailLogoInline(textColor = '#ffffff'): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td style="vertical-align:middle;padding-right:10px;">
          <img src="${APP_URL}/logo.png"
               alt="PaperLens"
               width="38" height="38"
               style="display:block;border-radius:8px;"
          />
        </td>
        <td style="vertical-align:middle;">
          <div style="font-size:18px;font-weight:800;color:${textColor};letter-spacing:-0.4px;line-height:1;">PaperLens</div>
        </td>
      </tr>
    </table>`;
}

/**
 * Centered logo block — logo icon above the headline.
 * Used in emails where the header only shows the logo (no inline text beside it).
 *
 * @param textColor  Hex colour for the "PaperLens" text. Default white.
 */
export function emailLogoCentered(textColor = '#ffffff'): string {
  return `
    <div style="text-align:center;margin-bottom:4px;">
      <img src="${APP_URL}/logo.png"
           alt="PaperLens"
           width="40" height="40"
           style="display:inline-block;border-radius:10px;margin-bottom:8px;"
      />
      <div style="font-size:16px;font-weight:800;color:${textColor};letter-spacing:-0.3px;">PaperLens</div>
    </div>`;
}

/**
 * Standard email footer HTML.
 * Includes unsubscribe link, privacy policy, and branding.
 */
export function emailFooter(): string {
  return `
    <div style="text-align:center;padding:24px 16px 8px;font-size:11px;color:#94a3b8;line-height:1.8;">
      PaperLens ·
      <a href="${APP_URL}" style="color:#94a3b8;text-decoration:none;">paperlens.co</a>
      <br/>
      <a href="${APP_URL}/settings" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
      ·
      <a href="${APP_URL}/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy</a>
    </div>`;
}

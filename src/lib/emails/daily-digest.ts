import { Resend } from 'resend';

const resend     = new Resend(process.env.RESEND_API_KEY || 're_123');
const DIGEST_TO  = 'teampaperlens@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'PaperLens <hello@paperlens.co>';

export type DigestRow = {
  time:      string;   // HH:MM UTC
  user_id:   string;
  email:     string;
  name:      string;
  event:     string;
  page:      string;
  meta:      string;   // JSON-stringified key fields
};

export type DigestSummary = {
  total_events:   number;
  unique_users:   number;
  top_event:      string;
  scans_today:    number;
  new_sign_ups:   number;
};

const EVENT_LABEL: Record<string, string> = {
  'page.view':                  '👁  Page View',
  'document.scan':              '📄 Document Scanned',
  'document.resolve':           '✅ Marked Resolved',
  'document.unresolve':         '↩️  Marked Unresolved',
  'document.delete':            '🗑  Document Deleted',
  'document.reanalyze':         '🔄 Re-Analyzed',
  'document.headline_update':   '✏️  Headline Updated',
  'document.urgency_update':    '🚦 Urgency Changed',
  'document.move_to_folder':    '📁 Moved to Folder',
  'folder.create':              '📂 Folder Created',
  'folder.rename':              '✏️  Folder Renamed',
  'folder.delete':              '🗑  Folder Deleted',
  'folder.delete_with_docs':    '🗑  Folder + Docs Deleted',
  'folder.move_all_out':        '📤 All Docs Moved Out',
  'reminder.set':               '⏰ Reminder Set',
  'profile.update':             '👤 Profile Updated',
  'settings.language_change':   '🌍 Language Changed',
  'auth.sign_in_clicked':       '🔑 Sign-In Clicked',
  'auth.sign_up_clicked':       '🆕 Sign-Up Clicked',
  'auth.sign_out':              '🚪 Signed Out',
};

function label(event: string) {
  return EVENT_LABEL[event] ?? event;
}


function tableRows(rows: DigestRow[]): string {
  return rows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'}">
      <td style="${TD}">${r.time}</td>
      <td style="${TD};font-weight:600;color:#111827;">${r.name || '—'}</td>
      <td style="${TD};color:#6b7280;font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.email}">${r.email}</td>
      <td style="${TD}">${label(r.event)}</td>
      <td style="${TD};color:#6b7280;font-size:11px;">${r.page || '—'}</td>
      <td style="${TD};color:#6b7280;font-size:11px;max-width:180px;">${r.meta}</td>
    </tr>`).join('');
}

const TH = 'padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;border-bottom:2px solid #e5e7eb;white-space:nowrap;';
const TD = 'padding:9px 12px;font-size:12px;color:#374151;border-bottom:1px solid #f3f4f6;vertical-align:top;';

function statCard(label: string, value: string | number, color = '#7C3AED') {
  return `
    <td style="padding:0 8px 0 0;">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;min-width:120px;">
        <div style="font-size:28px;font-weight:800;color:${color};line-height:1;">${value}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">${label}</div>
      </div>
    </td>`;
}

export async function sendDailyDigest(
  rows:    DigestRow[],
  summary: DigestSummary,
  date:    string,   // e.g. "March 24, 2026"
): Promise<void> {
  const subject = `📊 PaperLens Daily Digest — ${date} (${summary.total_events} events, ${summary.unique_users} users)`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>PaperLens Daily Digest</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:900px;margin:32px auto;padding:0 16px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1A0F2E 0%,#0C0A14 100%);border-radius:14px 14px 0 0;padding:28px 32px;">
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;padding-right:10px;">
              <img src="https://www.paperlens.co/logo.png" alt="PaperLens" width="36" height="36" style="display:block;border-radius:8px;" />
            </td>
            <td style="vertical-align:middle;">
              <div style="font-size:20px;font-weight:800;color:#F8F7FF;letter-spacing:-0.4px;">PaperLens</div>
              <div style="font-size:12px;color:#A78BFA;margin-top:2px;">Daily Activity Digest</div>
            </td>
          </tr></table>
        </td>
        <td style="text-align:right;">
          <div style="font-size:13px;color:#C4B5FD;font-weight:600;">${date}</div>
          <div style="font-size:11px;color:#7C3AED;margin-top:2px;">UTC timezone</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Summary stats -->
  <div style="background:#ffffff;padding:24px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:14px;">Today at a Glance</div>
    <table cellpadding="0" cellspacing="0">
      <tr>
        ${statCard('Total Events',  summary.total_events, '#7C3AED')}
        ${statCard('Active Users',  summary.unique_users, '#0891B2')}
        ${statCard('Docs Scanned',  summary.scans_today,  '#059669')}
        ${statCard('New Sign-Ups',  summary.new_sign_ups, '#D97706')}
        ${statCard('Top Event',     summary.top_event.replace('document.','doc.').replace('page.view','pg.view'), '#6B7280')}
      </tr>
    </table>
  </div>

  <!-- Event table -->
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 14px 14px;overflow:hidden;">
    <div style="padding:16px 32px 8px;border-bottom:1px solid #f3f4f6;">
      <span style="font-size:13px;font-weight:700;color:#111827;">All Events</span>
      <span style="font-size:12px;color:#9ca3af;margin-left:8px;">${rows.length} total (page views excluded in table if >50 rows)</span>
    </div>
    <div style="overflow-x:auto;">
      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="${TH}">Time (UTC)</th>
            <th style="${TH}">Name</th>
            <th style="${TH}">Email</th>
            <th style="${TH}">Event</th>
            <th style="${TH}">Page</th>
            <th style="${TH}">Details</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length > 0 ? tableRows(rows) : `<tr><td colspan="6" style="${TD};text-align:center;color:#9ca3af;padding:32px;">No events recorded today.</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Footer -->
  <div style="padding:20px 0;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">
      PaperLens internal digest · sent daily at 07:00 UTC · <a href="https://paperlens.co" style="color:#7C3AED;text-decoration:none;">paperlens.co</a>
    </p>
  </div>

</div>
</body>
</html>`.trim();

  try {
    const { error } = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      DIGEST_TO,
      subject,
      html,
    });
    if (error) console.error('[daily-digest] Resend error:', error);
    else console.log(`[daily-digest] Sent — ${summary.total_events} events, ${summary.unique_users} users`);
  } catch (err) {
    console.error('[daily-digest] Failed to send:', err instanceof Error ? err.message : err);
  }
}

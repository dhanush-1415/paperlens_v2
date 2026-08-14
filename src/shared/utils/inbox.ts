// --- Email-in helpers — per-user forwarding address --------------------------
// Server-only (uses node:crypto for token generation). The token is an
// unguessable secret embedded in the local part: u_<token>@<inbound-domain>.
// Whoever knows the address can spend the owner's scans, so the token carries
// the entropy (128 bits) and is regenerable.

import { randomBytes } from 'node:crypto';

// The domain whose MX records point at the inbound-email provider. Public so the
// settings UI can display the address; override per-environment.
export const INBOUND_DOMAIN =
  process.env.NEXT_PUBLIC_INBOUND_DOMAIN?.trim() || 'inbox.paperlens.app';

/** Generate a fresh, unguessable inbox token (32 lowercase hex chars = 128 bits). */
export function generateInboxToken(): string {
  return randomBytes(16).toString('hex');
}

/** Build the full forwarding address for a token. */
export function formatInboxAddress(token: string): string {
  return `u_${token}@${INBOUND_DOMAIN}`;
}

/**
 * Extract the inbox token from a recipient value. Accepts a bare address
 * ("u_abc@d"), a display form ("Name <u_abc@d>"), or a comma-separated list of
 * recipients (picks the first matching one). Returns null when none match.
 * Case-insensitive; tokens are normalized to lowercase.
 */
export function parseInboxToken(recipient: string | null | undefined): string | null {
  if (!recipient) return null;
  // Match the first u_<token>@ in the string (covers lists + display names).
  const m = recipient.toLowerCase().match(/u_([a-z0-9]+)@/);
  return m && m[1] ? m[1] : null;
}

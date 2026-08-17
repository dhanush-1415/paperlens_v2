/**
 * URL search parameters (requirement 19).
 *
 * In the App Router, `searchParams` *is* state — shareable, bookmarkable, back-button
 * aware, and the reason a filtered vault view does not need a client store. That makes
 * these key names an interface, not incidental strings: rename one and every existing link
 * a user has saved silently loses its meaning.
 */

export const QUERY_PARAMS = {
  /** Where to send the user after authentication. Validated before use — see below. */
  redirectTo: 'redirectTo',
  page: 'page',
  pageSize: 'pageSize',
  query: 'q',
  sort: 'sort',
  order: 'order',
  filter: 'filter',
  status: 'status',
  category: 'category',
  tag: 'tag',
  folder: 'folder',
  view: 'view',
  tab: 'tab',
  /** Marketing attribution, read once on landing and never again. */
  referral: 'ref',
  campaign: 'utm_campaign',
  source: 'utm_source',
  medium: 'utm_medium',
  /** Opens a modal via URL so the state survives a refresh and a shared link. */
  modal: 'modal',
} as const;

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/**
 * Open-redirect guard.
 *
 * `?redirectTo=https://evil.example` is the oldest phishing primitive there is: the victim
 * signs in on the real domain and is then handed to the attacker's. Only same-origin,
 * absolute *paths* are accepted, and protocol-relative `//host` is rejected explicitly
 * because it looks like a path and is not.
 */
export function sanitizeRedirectTo(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  // `/\evil.com` is treated as protocol-relative by some browsers.
  if (value.startsWith('/\\')) return fallback;
  return value;
}

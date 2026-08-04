/**
 * Storage keys (requirements 12 and 19).
 *
 * Every key the app writes to localStorage, sessionStorage or a cookie is declared here.
 * The reason is collisions: browser storage is one flat namespace shared with every script
 * on the origin, and a bare `"theme"` key will eventually be written by something that is
 * not us.
 *
 * The `pl:` prefix namespaces us. The `:vN` suffix is the migration lever — bump it and old
 * data is ignored rather than parsed into a shape it no longer matches, which is the
 * failure mode that turns a schema change into a wave of client crashes.
 */

const NAMESPACE = 'pl';

const key = (name: string, version = 1): string => `${NAMESPACE}:${name}:v${version}`;

export const STORAGE_KEYS = {
  /** Written by the inline no-flash script before React loads. */
  theme: key('theme'),
  locale: key('locale'),
  /** Analytics/marketing consent. Read before any provider is initialised. */
  consent: key('consent'),
  /** Dismissed banners, tours and nudges, keyed by campaign id. */
  dismissed: key('dismissed'),
  /** Draft document text, so a refresh mid-paste does not lose the user's work. */
  scanDraft: key('scan-draft'),
  vaultView: key('vault-view'),
  sidebarCollapsed: key('sidebar-collapsed'),
  /** Client-side flag overrides. Development only — ignored in production builds. */
  flagOverrides: key('flag-overrides'),
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Cookie names.
 *
 * Separate from the above because cookies cross the network on every request: they are read
 * by `proxy.ts` and by the DAL, so their names are part of the server contract, not just
 * client state. Session cookies are `httpOnly` and never appear in this list — the client
 * has no business naming something it cannot read.
 */
export const COOKIE_NAMES = {
  /** Presence-only hint for the proxy's optimistic redirect. Not a credential. */
  sessionHint: `${NAMESPACE}_session`,
  theme: `${NAMESPACE}_theme`,
  locale: `${NAMESPACE}_locale`,
  csrf: `${NAMESPACE}_csrf`,
} as const;

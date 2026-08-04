/**
 * The route registry (requirements 9 and 19).
 *
 * Every URL the application constructs comes from here. A string literal `href` in a
 * component is a rename waiting to 404 — this file is what makes moving a route a
 * single-file change that the type checker verifies.
 *
 * Parameterised routes are functions, not templates, so a missing or misencoded segment is
 * a compile error rather than `/document/undefined`. Every dynamic segment is passed
 * through `encodeURIComponent`: IDs come from user data often enough that this cannot be
 * left to the caller.
 *
 * `typedRoutes` is enabled in `next.config.ts`, so `<Link href={...}>` is checked against
 * the routes that actually exist — this registry and the file system are verified against
 * each other at build time, not by discipline.
 */

const segment = (value: string): string => encodeURIComponent(value);

export const ROUTES = {
  // ── Marketing ─────────────────────────────────────────────────────────────────────────
  home: '/',
  howItWorks: '/how-it-works',
  useCases: '/use-cases',
  useCase: (slug: string) => `/for/${segment(slug)}`,
  pricing: '/pricing',
  security: '/security',
  about: '/about',
  faq: '/faq',
  support: '/support',
  blog: '/blog',
  blogPost: (slug: string) => `/blog/${segment(slug)}`,

  // ── Legal ─────────────────────────────────────────────────────────────────────────────
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',

  // ── Authentication ────────────────────────────────────────────────────────────────────
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  verifyEmail: '/verify-email',

  // ── Application ───────────────────────────────────────────────────────────────────────
  welcome: '/welcome',
  scan: '/scan',
  vault: '/vault',
  vaultFolder: (folderId: string) => `/vault/folder/${segment(folderId)}`,
  document: (id: string) => `/document/${segment(id)}`,
  usage: '/usage',
  settings: '/settings',

  // ── Public sharing ────────────────────────────────────────────────────────────────────
  share: (shareToken: string) => `/share/${segment(shareToken)}`,

  // ── Transactional ─────────────────────────────────────────────────────────────────────
  orderFailed: '/order-failed',
} as const;

/**
 * Route groups used for access decisions.
 *
 * `proxy.ts` reads these for its *optimistic* redirect only. Authorization itself happens
 * in the DAL on every request — see `core/auth/dal.ts`. Listing a path here does not
 * protect it; it only avoids a pointless render for a visitor who is clearly signed out.
 */
export const ROUTE_ACCESS = {
  /** Requires a session. Prefix match. */
  protected: ['/welcome', '/scan', '/vault', '/document', '/usage', '/settings'],
  /** Signed-in users are bounced away from these. */
  authOnly: ['/login', '/register', '/forgot-password'],
  /** Never redirected, never gated. */
  public: ['/', '/how-it-works', '/use-cases', '/for', '/pricing', '/security', '/about', '/faq', '/support', '/blog', '/terms', '/privacy', '/cookies', '/share'],
} as const;

export function isProtectedPath(pathname: string): boolean {
  return ROUTE_ACCESS.protected.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAuthOnlyPath(pathname: string): boolean {
  return ROUTE_ACCESS.authOnly.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Where to land after signing in, when no `redirectTo` was captured. */
export const DEFAULT_AUTHENTICATED_ROUTE = ROUTES.scan;
export const DEFAULT_UNAUTHENTICATED_ROUTE = ROUTES.home;

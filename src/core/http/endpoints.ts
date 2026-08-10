/**
 * The endpoint registry (requirement 2).
 *
 * Every remote path the application knows about, in one file. The value of this is not
 * tidiness — it is that "what does this app talk to?" has an answer you can read in thirty
 * seconds, and that a path change is one edit rather than a grep across features.
 *
 * Parameterised endpoints are functions with encoded segments, for the same reason as
 * `ROUTES`: an unencoded ID in a path is a broken request at best and a path-traversal at
 * worst.
 *
 * These are *paths*, not URLs. The origin comes from the `HttpClient` the caller was given,
 * which is what allows the same feature code to run against a local fake, a staging backend
 * and production without conditionals.
 *
 * **No realtime endpoints.** There are no `ws://` or `/stream` entries here by design — see
 * the note in `types.ts`.
 */

const segment = (value: string): string => encodeURIComponent(value);

export const ENDPOINTS = {
 auth: {
 session: '/auth/session',
 signIn: '/auth/sign-in',
 signOut: '/auth/sign-out',
 signUp: '/auth/sign-up',
 refresh: '/auth/refresh',
 requestPasswordReset: '/auth/password-reset',
 confirmPasswordReset: '/auth/password-reset/confirm',
 verifyEmail: '/auth/verify-email',
 },

 account: {
 profile: '/account/profile',
 preferences: '/account/preferences',
 usage: '/account/usage',
 plan: '/account/plan',
 deleteAccount: '/account',
 },

 documents: {
 list: '/documents',
 create: '/documents',
 byId: (id: string) => `/documents/${segment(id)}`,
 analyze: (id: string) => `/documents/${segment(id)}/analyze`,
 reanalyze: (id: string) => `/documents/${segment(id)}/reanalyze`,
 findings: (id: string) => `/documents/${segment(id)}/findings`,
 chat: (id: string) => `/documents/${segment(id)}/chat`,
 export: (id: string) => `/documents/${segment(id)}/export`,
 },

 vault: {
 folders: '/vault/folders',
 folder: (folderId: string) => `/vault/folders/${segment(folderId)}`,
 move: '/vault/move',
 },

 sharing: {
 create: '/shares',
 byToken: (token: string) => `/shares/${segment(token)}`,
 revoke: (token: string) => `/shares/${segment(token)}`,
 },

 content: {
 posts: '/content/posts',
 post: (slug: string) => `/content/posts/${segment(slug)}`,
 useCases: '/content/use-cases',
 useCase: (slug: string) => `/content/use-cases/${segment(slug)}`,
 },

 support: {
 contact: '/support/contact',
 newsletter: '/support/newsletter',
 },
} as const;

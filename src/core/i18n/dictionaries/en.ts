/**
 * The English dictionary — the source of truth for every user-visible string.
 *
 * This file is also the *type* source: `MessageKey` is derived from its keys, so a
 * translation file that misses a key, or a `t()` call with a typo, is a compile error rather
 * than a `[missing translation]` in production.
 *
 * ### Conventions
 *
 * - Flat, dotted keys grouped by namespace. Nested objects read better in a file and worse
 * in every tool that touches them — extractors, translation platforms, diff review.
 * - `{placeholder}` for interpolation. No HTML in strings; a string that needs bold text is
 * two strings and a component, because translators cannot be relied upon to keep tags
 * balanced and a broken tag in a translation is an XSS-shaped hole.
 * - Plurals use the `_one` / `_other` suffix pair, selected by `Intl.PluralRules`. Languages
 * with more forms (`_few`, `_many`, `_zero`) add them in their own file; English needs two.
 * - Error and validation keys mirror the registries in `core/errors/codes.ts` and
 * `shared/validation/primitives.ts` exactly. Those files hold keys, never sentences, which
 * is what lets the same failure be phrased differently per surface without touching logic.
 */

export const en = {
 // --- Errors (keys emitted by core/errors/codes.ts) ---------------------------
 'errors.validationFailed': 'Please check the highlighted fields and try again.',
 'errors.malformedRequest': "That request didn't look right. Please try again.",
 'errors.unsupportedFileType': "We can't read that file type yet.",
 'errors.payloadTooLarge': 'That file is too large. The limit is {limit}.',
 'errors.unauthenticated': 'Please sign in to continue.',
 'errors.sessionExpired': 'Your session has expired. Please sign in again.',
 'errors.invalidCredentials': 'That email or password is incorrect.',
 'errors.forbidden': "You don't have access to this.",
 'errors.planLimitReached': "You've reached your plan's limit.",
 'errors.notFound': "We couldn't find that.",
 'errors.conflict': 'That change conflicts with a more recent one. Reload and try again.',
 'errors.alreadyExists': 'That already exists.',
 'errors.rateLimited': "You're going a little fast. Try again in {seconds} seconds.",
 'errors.timeout': 'That took too long. Please try again.',
 'errors.networkUnavailable': "We couldn't reach the network.",
 'errors.offline': "You're offline. We'll retry when you reconnect.",
 'errors.upstreamError': 'A service we depend on is having trouble.',
 'errors.serviceUnavailable': "We're temporarily unavailable. Please try again shortly.",
 'errors.documentUnreadable': "We couldn't read that document.",
 'errors.analysisFailed': "We couldn't finish analysing that document.",
 'errors.internal': 'Something went wrong on our end.',

 // --- Validation (keys emitted by shared/validation/primitives.ts) -------------
 'validation.required': 'This field is required.',
 'validation.tooShort': 'Must be at least {min} characters.',
 'validation.tooLong': 'Must be {max} characters or fewer.',
 'validation.email': 'Enter a valid email address.',
 'validation.email.tooLong': 'That email address is too long.',
 'validation.uuid': 'That identifier is not valid.',
 'validation.slug': 'Use lowercase letters, numbers and hyphens only.',
 'validation.shareToken': 'That share link is not valid.',
 'validation.phone': 'Enter a valid phone number, including the country code.',
 'validation.url': 'Enter a valid URL.',
 'validation.url.protocol': 'Links must start with http:// or https://.',
 'validation.date': 'Enter a valid date.',
 'validation.dateTime': 'Enter a valid date and time.',
 'validation.mustAccept': 'Please accept to continue.',
 'validation.password.tooShort': 'Use at least {min} characters.',
 'validation.password.tooLong': 'Passwords can be at most {max} characters.',
 'validation.password.lowercase': 'Include a lowercase letter.',
 'validation.password.uppercase': 'Include an uppercase letter.',
 'validation.password.digit': 'Include a number.',
 'validation.document.tooShort': 'Paste at least {min} characters so we have something to read.',
 'validation.document.tooLong':
 'That document is longer than we can analyse in one go ({max} characters).',
 'validation.file.required': 'Choose a file.',
 'validation.file.empty': 'That file is empty.',
 'validation.file.tooLarge': 'Files must be under {limit}.',
 'validation.file.unsupportedType': "We can't read that file type yet.",

 // --- Network (keys emitted by core/network/policy.ts) ------------------------
 'network.slow': 'Your connection is slow. This may take a moment.',
 'network.offlineStale': "You're offline. Showing the last version we saved.",
 'network.offlineMutation': "You're offline. We'll save this once you reconnect.",
 'network.offlineCritical': 'This needs a connection. Please reconnect and try again.',

 // --- Common UI ---------------------------------------------------------------
 'common.appName': 'PaperLens',
 'common.save': 'Save',
 'common.cancel': 'Cancel',
 'common.confirm': 'Confirm',
 'common.delete': 'Delete',
 'common.retry': 'Try again',
 'common.close': 'Close',
 'common.back': 'Back',
 'common.next': 'Next',
 'common.loading': 'Loading',
 'common.search': 'Search',
 'common.copy': 'Copy',
 'common.copied': 'Copied',
 'common.signIn': 'Sign in',
 'common.signUp': 'Get started',
 'common.signOut': 'Sign out',
 'common.upgrade': 'Upgrade',
 'common.learnMore': 'Learn more',

 // --- Public site chrome ------------------------------------------------------
 // The navigation and footer of the marketing site. Chrome, not content: page prose lives
 // in `features/marketing` behind the ContentRepository port, because it is destined for a
 // CMS. These are the labels of the information architecture itself, which is not.
 'nav.howItWorks': 'How it works',
 'nav.pricing': 'Pricing',
 'nav.security': 'Security',
 'nav.useCases': 'Document guides',
 'nav.blog': 'Blog',
 'nav.menu': 'Menu',
 'nav.closeMenu': 'Close menu',

 // The single primary action, everywhere on the public site. Phrased as the *value*, not the
 // transaction — "Analyze a document" is what the visitor came to do; "Sign up" is what we
 // want. The reassurance line under it answers the three objections in order of frequency.
 'cta.analyze': 'Analyze a document',
 'cta.reassurance': 'No card required · Deleted after analysis · Never used for training',

 'footer.product': 'Product',
 'footer.guides': 'Document guides',
 'footer.getStarted': 'Get started',
 'footer.company': 'Company',
 'footer.legal': 'Legal',
 'footer.allGuides': 'All {count} guides',
 'footer.about': 'About',
 'footer.faq': 'FAQ',
 'footer.support': 'Support',
 'footer.terms': 'Terms',
 'footer.privacy': 'Privacy',
 'footer.cookies': 'Cookies',

 // --- Theme -------------------------------------------------------------------
 'theme.label': 'Theme',
 'theme.light': 'Light',
 'theme.dark': 'Dark',
 'theme.system': 'System',

 // --- Boundaries --------------------------------------------------------------
 'boundary.error.title': 'Something went wrong',
 'boundary.error.body': "We've logged the problem. Try again, and let us know if it persists.",
 'boundary.notFound.title': 'Page not found',
 'boundary.notFound.body': "That page doesn't exist, or it moved.",
 'boundary.unauthorized.title': 'Sign in to continue',
 'boundary.unauthorized.body': 'This page is only available when you are signed in.',
 'boundary.forbidden.title': 'No access',
 'boundary.forbidden.body': "Your account doesn't have access to this page.",
 'boundary.offline.title': "You're offline",
 'boundary.offline.body': 'Check your connection and try again.',

 // --- Quota (plural forms) ----------------------------------------------------
 'quota.scansRemaining_one': '{count} scan left this month',
 'quota.scansRemaining_other': '{count} scans left this month',
 'quota.chatRemaining_one': '{count} question left',
 'quota.chatRemaining_other': '{count} questions left',
 'quota.exhausted': "You've used every scan on your plan this month.",

 // --- Consent -----------------------------------------------------------------
 'consent.title': 'Cookies and analytics',
 'consent.body':
 'We use a small amount of analytics to understand which parts of the product help. No document content ever leaves your account.',
 'consent.acceptAll': 'Accept',
 'consent.rejectAll': 'Reject',
 'consent.customise': 'Choose',
} as const;

export type Dictionary = typeof en;
export type MessageKey = keyof Dictionary;

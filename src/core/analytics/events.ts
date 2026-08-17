/**
 * The analytics event registry (requirement 16).
 *
 * Every event the product can emit is declared here, with its payload type. Nothing else may
 * call `track` with a free-form string.
 *
 * This is not bureaucracy. Analytics decays in one specific way: `"signup_complete"` in one
 * file, `"Signup Completed"` in another, `"signup-completed"` in a third, and six months
 * later the funnel chart is wrong and nobody can prove which events are the real ones. A
 * typed registry makes a typo a compile error and makes the full event surface reviewable in
 * one file — which is also what a privacy review needs.
 *
 * ### Naming
 *
 * `noun.verb_past_tense`, lowercase, dot-separated namespace. `document.analyzed`, not
 * `analyzeDocument`. Events describe what *happened*, so they are past tense; the namespace
 * groups them for the dashboard's benefit.
 *
 * ### Payloads
 *
 * No PII. Not the document text, not the filename, not the email. Analytics payloads are
 * sent to a third party and retained beyond our control, so what goes in them is the shape
 * of the interaction, never its content. Ids are opaque and already in the provider's user
 * scope.
 */

/** Where in the funnel a conversion event fired. Keeps upgrade attribution honest. */
export type UpgradeSurface =
  'pricing_page' | 'quota_banner' | 'locked_feature' | 'vault_prompt' | 'nav_cta' | 'post_scan';

export type DocumentSource = 'paste' | 'upload' | 'sample';

/**
 * Event name -> payload.
 *
 * An interface rather than a type alias so a future feature module *could* augment it, and a
 * comment saying it should not: keeping the whole surface in one file is the point.
 */
export interface AnalyticsEventMap {
  // --- Acquisition -------------------------------------------------------------
  'page.viewed': { path: string; referrer?: string };
  'cta.clicked': { id: string; surface: string };
  'pricing.viewed': { surface: UpgradeSurface };
  'faq.expanded': { questionId: string };

  // --- Activation --------------------------------------------------------------
  'signup.started': { method: 'email' | 'oauth' };
  'signup.completed': { method: 'email' | 'oauth' };
  'signup.failed': { reason: 'credentials' | 'locked' | 'unknown' };
  'signin.completed': { method: 'email' | 'oauth' };
  'signin.failed': { reason: 'credentials' | 'locked' | 'unknown' };
  'onboarding.completed': { stepCount: number };

  // --- Core product ------------------------------------------------------------
  'document.submitted': { source: DocumentSource; charCount: number; documentType?: string };
  'document.analyzed': { documentId: string; durationMs: number; flagCount: number };
  'document.analysis_failed': { reason: string };
  'risk_flag.expanded': { documentId: string; severity: 'critical' | 'caution' | 'safe' };
  'clause.explained': { documentId: string; clauseId: string };
  'chat.message_sent': { documentId: string; messageIndex: number };

  // --- Retention ---------------------------------------------------------------
  'vault.document_saved': { documentId: string };
  'vault.folder_created': Record<string, never>;
  'document.reanalyzed': { documentId: string };
  'share.created': { documentId: string; expiresInDays: number };
  'export.downloaded': { documentId: string; format: 'pdf' | 'csv' | 'json' };

  // --- Revenue -----------------------------------------------------------------
  'quota.exceeded': { quota: 'scans' | 'chat'; plan: string };
  'upgrade.clicked': { surface: UpgradeSurface; plan: string };
  'checkout.started': { plan: string };
  'checkout.completed': { plan: string };
  'checkout.abandoned': { plan: string; step: string };
  'subscription.cancelled': { plan: string; reason?: string };

  // --- Health ------------------------------------------------------------------
  'error.shown': { boundary: string; code: string };
  'feature_flag.evaluated': { flag: string; value: string };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

/**
 * The event names as values, for the rare place a name is needed at runtime (a dashboard
 * link, a test fixture). Derived from the map's keys by hand because TypeScript cannot
 * produce runtime values from a type.
 */
export const ANALYTICS_EVENTS = {
  pageViewed: 'page.viewed',
  ctaClicked: 'cta.clicked',
  pricingViewed: 'pricing.viewed',
  faqExpanded: 'faq.expanded',

  signupStarted: 'signup.started',
  signupCompleted: 'signup.completed',
  signupFailed: 'signup.failed',
  signinCompleted: 'signin.completed',
  signinFailed: 'signin.failed',
  onboardingCompleted: 'onboarding.completed',

  documentSubmitted: 'document.submitted',
  documentAnalyzed: 'document.analyzed',
  documentAnalysisFailed: 'document.analysis_failed',
  riskFlagExpanded: 'risk_flag.expanded',
  clauseExplained: 'clause.explained',
  chatMessageSent: 'chat.message_sent',

  vaultDocumentSaved: 'vault.document_saved',
  vaultFolderCreated: 'vault.folder_created',
  documentReanalyzed: 'document.reanalyzed',
  shareCreated: 'share.created',
  exportDownloaded: 'export.downloaded',

  quotaExceeded: 'quota.exceeded',
  upgradeClicked: 'upgrade.clicked',
  checkoutStarted: 'checkout.started',
  checkoutCompleted: 'checkout.completed',
  checkoutAbandoned: 'checkout.abandoned',
  subscriptionCancelled: 'subscription.cancelled',

  errorShown: 'error.shown',
  featureFlagEvaluated: 'feature_flag.evaluated',
} as const satisfies Record<string, AnalyticsEventName>;

/**
 * Events that must fire even without analytics consent.
 *
 * Deliberately empty, and deliberately present. Someone will eventually argue that one
 * event is "essential"; this is where that argument has to be written down and reviewed
 * rather than made in a pull request comment.
 */
export const CONSENT_EXEMPT_EVENTS: ReadonlySet<AnalyticsEventName> = new Set();

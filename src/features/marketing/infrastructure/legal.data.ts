/**
 * The legal corpus.
 *
 * Ported from the live site, clause for clause. The wording is deliberately unchanged: legal
 * text is reviewed as text, and an engineer improving its prose during a port is how a
 * reviewed document becomes an unreviewed one. Only the *structure* changed — sections became
 * data, emphasis became `**` markers, and the section anchors are new.
 *
 * ### Two things a reader should know before editing this file
 *
 * **The dates are content.** `lastUpdatedIso` is not a build timestamp and must not become
 * one. It is the date a human last reviewed the clauses, and bumping it automatically would
 * tell every returning user that the terms changed when they did not — which is precisely the
 * signal the field exists to carry.
 *
 * **Some clauses describe infrastructure this codebase does not yet have.** The privacy policy
 * names the storage and model vendors, because that is the disclosure obligation. v2.1 is
 * provider-agnostic by design and those adapters are not wired yet, so these clauses describe
 * the shipped product rather than this repository. They need a review pass at the point the
 * real adapters land, not before.
 */

import type { LegalDocument, LegalDocumentSlug } from '../domain/legal';

const terms: LegalDocument = {
 slug: 'terms',
 title: 'Terms & Conditions',
 description:
 'The terms governing your use of PaperLens — billing, data retention, acceptable use, and the limits of AI-generated analysis.',
 eyebrow: 'Terms & governance',
 effectiveIso: '2026-03-19',
 lastUpdatedIso: '2026-04-13',
 intro:
 'These Terms & Conditions govern your access to and use of PaperLens. **By creating an account or using the Service, you confirm that you have read, understood, and agree to be legally bound by these Terms.**',
 sections: [
 {
 id: 'not-legal-advice',
 heading: 'Not legal advice',
 blocks: [
 {
 kind: 'callout',
 text: 'PaperLens is an AI-powered document comprehension tool. It is **not** a law firm, does **not** provide legal advice, and is **not** a substitute for a licensed attorney, CPA, financial advisor, or other qualified professional.',
 },
 {
 kind: 'paragraph',
 text: 'Summaries, classifications, and playbook suggestions are informational only. They reflect probabilistic AI interpretation and may contain errors. Do not rely on them for determining legal obligations or making binding financial decisions.',
 },
 ],
 subsections: [],
 },
 {
 id: 'eligibility',
 heading: 'Eligibility and minimum age',
 blocks: [
 {
 kind: 'paragraph',
 text: 'You must be at least **13 years old** to use PaperLens. If you are under 18, you represent that you have parental or guardian consent to use the Service.',
 },
 ],
 subsections: [],
 },
 {
 id: 'plans-and-billing',
 heading: 'Subscription plans, billing and quotas',
 blocks: [
 {
 kind: 'paragraph',
 text: 'Features vary by subscription tier. Billing is processed through our payment gateway, and charges are auto-recurring unless cancelled.',
 },
 {
 kind: 'list',
 items: [
 {
 term: 'Free',
 text: '5 document analyses per month. Documents are processed and discarded — nothing is retained after the session.',
 },
 {
 term: 'Pro',
 text: 'A monthly analysis allowance, saved document history, and deadline reminders.',
 },
 {
 term: 'Business',
 text: 'A larger allowance, shared workspaces, and priority support.',
 },
 ],
 },
 ],
 subsections: [],
 },
 {
 id: 'storage-and-grace',
 heading: 'Document storage and grace periods',
 blocks: [
 {
 kind: 'paragraph',
 text: 'If a paid subscription cancels or lapses, saved documents enter a **60-day read-only grace period**. Renewing within this window restores full access.',
 },
 {
 kind: 'callout',
 text: 'After 60 days, all documents and analysis results are permanently and irreversibly deleted. This cannot be undone, and we cannot recover them for you.',
 },
 ],
 subsections: [],
 },
 {
 id: 'acceptable-use',
 heading: 'Acceptable use and content policy',
 blocks: [
 {
 kind: 'paragraph',
 text: 'You agree not to upload illegal, harmful, or copyright-infringing content, and not to use prompt injection or jailbreak techniques to bypass safety filters.',
 },
 {
 kind: 'paragraph',
 text: '**Child sexual abuse material — zero tolerance.** Any such upload results in immediate permanent termination and reporting to the NCMEC CyberTipline and law enforcement.',
 },
 ],
 subsections: [],
 },
 {
 id: 'liability',
 heading: 'Limitation of liability',
 blocks: [
 {
 kind: 'paragraph',
 text: 'To the maximum extent permitted by law, PaperLens shall not be liable for any indirect, incidental, or consequential damages — including missed deadlines or resulting penalties — arising from your use of the Service.',
 },
 ],
 subsections: [],
 },
 {
 id: 'contact',
 heading: 'Contact and grievances',
 blocks: [
 {
 kind: 'paragraph',
 text: 'For questions or formal grievances about these terms, write to legal@paperlens.co.',
 },
 ],
 subsections: [],
 },
 ],
};

const privacy: LegalDocument = {
 slug: 'privacy',
 title: 'Privacy Policy',
 description:
 'How PaperLens collects, processes and protects your data — including your GDPR and DPDP rights.',
 eyebrow: 'Compliance & security',
 lastUpdatedIso: '2026-03-19',
 intro:
 'PaperLens is built on a simple principle: your documents are none of our business beyond what you explicitly ask us to analyse. This policy explains exactly what we collect, why, and what rights you have over it.',
 sections: [
 {
 id: 'what-we-collect',
 heading: 'Data we collect',
 blocks: [],
 subsections: [
 {
 heading: 'Account information',
 blocks: [
 {
 kind: 'paragraph',
 text: 'When you create an account we collect your **email address** and a hashed version of your password. We do not store plaintext passwords.',
 },
 {
 kind: 'paragraph',
 text: 'A display name or phone number added to your profile is optional and can be removed at any time from your settings.',
 },
 ],
 },
 {
 heading: 'Documents',
 blocks: [
 {
 kind: 'paragraph',
 text: 'Documents are transmitted to our servers over an encrypted connection. **On the Free plan they are processed in memory and never written to storage.** If you save a document on a paid plan, it is stored in an encrypted, access-controlled bucket tied to your account.',
 },
 {
 kind: 'paragraph',
 text: 'We do not use your documents for any purpose other than producing the analysis you asked for. We do not sell them, share them, or use them to train models.',
 },
 ],
 },
 {
 heading: 'Analysis results',
 blocks: [
 {
 kind: 'paragraph',
 text: 'The structured output — risk level, summary, action type, deadline, key entities — is stored against your account only when you save the document. It is encrypted at rest.',
 },
 ],
 },
 {
 heading: 'Technical and operational data',
 blocks: [
 {
 kind: 'paragraph',
 text: 'We collect the minimum technical data needed to operate the service securely: authentication tokens, session cookies, and server-side error logs. We do **not** place advertising pixels, fingerprint your device, or track you across other websites.',
 },
 ],
 },
 ],
 },
 {
 id: 'protection',
 heading: 'How we protect it',
 blocks: [],
 subsections: [
 {
 heading: 'Encryption in transit and at rest',
 blocks: [
 {
 kind: 'paragraph',
 text: 'Traffic between your device and our servers uses TLS 1.3. Stored data — analysis results and saved documents alike — is encrypted at rest with AES-256.',
 },
 ],
 },
 {
 heading: 'Access controls',
 blocks: [
 {
 kind: 'paragraph',
 text: 'Your data is isolated from other accounts by row-level security enforced in the database itself, not only in application code. Only your authenticated session can read your documents.',
 },
 {
 kind: 'callout',
 text: 'If a document contains a full Social Security number, Aadhaar number, bank account number, or similar identifier and you would rather we never saw it, cover that section before photographing. The analysis rarely needs it.',
 },
 ],
 },
 ],
 },
 {
 id: 'sub-processors',
 heading: 'Sub-processors',
 blocks: [
 {
 kind: 'paragraph',
 text: 'PaperLens uses third-party services to perform analysis and to store your account. When you submit a document, a copy of it or of its extracted text is sent to the model provider below.',
 },
 {
 kind: 'list',
 items: [
 {
 term: 'Model provider',
 text: 'Generates summaries, risk classifications and entity extraction. Under our agreement, inputs sent through the API are not used to train the provider’s models.',
 },
 {
 term: 'Database and storage provider',
 text: 'Authentication, database storage and file storage for saved documents.',
 },
 ],
 },
 ],
 subsections: [],
 },
 {
 id: 'your-rights',
 heading: 'Your rights',
 blocks: [
 {
 kind: 'paragraph',
 text: 'Depending on where you live, you have the rights below. To exercise any of them, write to privacy@paperlens.co.',
 },
 ],
 subsections: [
 {
 heading: 'Deletion',
 blocks: [
 {
 kind: 'paragraph',
 text: 'You can delete your account and everything associated with it from your settings. Deletion is processed within **48 hours**, during which you may cancel the request. After that, the data is permanently deleted and residual backup copies are purged within 30 days.',
 },
 ],
 },
 {
 heading: 'Indian users — DPDP Act 2023',
 blocks: [
 {
 kind: 'paragraph',
 text: 'We act as a Data Fiduciary. Indian users have the right to request information, access, correction, erasure and grievance redressal under the DPDP Act 2023.',
 },
 ],
 },
 ],
 },
 {
 id: 'contact',
 heading: 'Contact and grievance officer',
 blocks: [
 {
 kind: 'paragraph',
 text: 'For privacy questions or to report a concern, write to privacy@paperlens.co.',
 },
 {
 kind: 'list',
 items: [
 { term: 'Role', text: 'Grievance Officer, PaperLens' },
 { term: 'Email', text: 'grievance@paperlens.co' },
 {
 term: 'Response time',
 text: 'Acknowledgement within 48 hours; resolution within 30 days.',
 },
 ],
 },
 ],
 subsections: [],
 },
 ],
};

const cookies: LegalDocument = {
 slug: 'cookies',
 title: 'Cookie Policy',
 description:
 'What cookies PaperLens sets, why, and how to control them. We use only what the service needs to function.',
 eyebrow: 'Tracking & cookies',
 lastUpdatedIso: '2026-04-13',
 intro:
 'This policy explains exactly what cookies PaperLens sets, why we set them, and how you can control them. It is short because we genuinely use very few.',
 sections: [
 {
 id: 'what-is-a-cookie',
 heading: 'What a cookie is',
 blocks: [
 {
 kind: 'paragraph',
 text: 'A cookie is a small text file a website places on your device. It lets the site remember something about your visit — such as whether you are signed in — across page loads and browser sessions.',
 },
 ],
 subsections: [],
 },
 {
 id: 'cookies-we-use',
 heading: 'Cookies we use',
 blocks: [],
 subsections: [
 {
 heading: 'Essential — always active',
 blocks: [
 {
 kind: 'paragraph',
 text: 'These are strictly necessary to operate the service. Without them, core features such as staying signed in cannot work.',
 },
 {
 kind: 'list',
 items: [
 { term: 'Session', text: 'Keeps you signed in across page loads.' },
 { term: 'Locale', text: 'Remembers the language you chose.' },
 {
 term: 'Theme',
 text: 'Remembers whether you prefer light, dark, or your system setting.',
 },
 ],
 },
 ],
 },
 {
 heading: 'Analytics — only with your consent',
 blocks: [
 {
 kind: 'paragraph',
 text: 'If you accept, we record which parts of the product are used, in aggregate, so we know what to improve. Declining costs you nothing: every feature works either way, and we do not ask again in the same session.',
 },
 ],
 },
 {
 heading: 'What we do not use',
 blocks: [
 {
 kind: 'list',
 items: [
 { text: 'No advertising or retargeting cookies.' },
 { text: 'No third-party tracking pixels or fingerprinting scripts.' },
 { text: 'No cross-site tracking of any kind.' },
 ],
 },
 ],
 },
 ],
 },
 {
 id: 'controlling-cookies',
 heading: 'How to control them',
 blocks: [
 {
 kind: 'paragraph',
 text: 'You can block or delete cookies in your browser settings. Blocking the essential ones will prevent you from staying signed in.',
 },
 ],
 subsections: [],
 },
 {
 id: 'contact',
 heading: 'Contact',
 blocks: [
 {
 kind: 'paragraph',
 text: 'Questions about our use of cookies? Write to privacy@paperlens.co.',
 },
 ],
 subsections: [],
 },
 ],
};

/**
 * Keyed by slug, and typed as a total record.
 *
 * `Record<LegalDocumentSlug, …>` rather than an array: adding a slug to the union without
 * adding its document becomes a compile error here, which is the only place that check can be
 * made statically. A lookup in an array would fail at request time, on the terms page.
 */
export const LEGAL_DOCUMENTS: Readonly<Record<LegalDocumentSlug, LegalDocument>> = {
 terms,
 privacy,
 cookies,
};

/**
 * Legal documents — terms, privacy, cookies.
 *
 * ### Why these are content, not pages
 *
 * A legal document is the most content-shaped thing this product has: prose, revised on its
 * own cadence, by someone who is not an engineer. Hard-coding it into three `page.tsx` files
 * means every clause change is a deploy, and the day a lawyer wants a redline there is nothing
 * to redline but JSX. Modelling it here means the three routes are ten lines each, the
 * rendering is written once, and the CMS swap later is the same swap as for the guides.
 *
 * It also buys something immediately: the "last updated" date, the section anchors and the
 * table of contents are all derived rather than maintained. A section renumbered in the data
 * renumbers its own anchor, and no link rots.
 *
 * ### The block model, and why it is this small
 *
 * Three kinds — paragraph, list, callout — and no more. A definition list is not a fourth: it
 * is a list whose items carry an optional `term`, because "a bolded lead-in followed by prose"
 * and "a bullet" are the same block set differently, and splitting them would mean an author
 * choosing between two kinds that render almost identically.
 *
 * The temptation with a content model is to keep adding kinds until it is HTML with extra
 * steps, at which point the design system no longer controls the typography and a CMS editor
 * can ship a layout bug. Every legal document in this product is expressible in these three; a
 * fourth is a conversation, not a commit.
 *
 * ### Inline emphasis
 *
 * `**bold**`, and nothing else. Emphasis in a legal document is load-bearing — "PaperLens is
 * **not** a law firm" is the single most important sentence in the terms — so it cannot be
 * dropped, and it cannot be HTML in a string either (see the note at the top of the message
 * dictionary: a translator with an unbalanced tag is an XSS-shaped hole). A two-character
 * marker parsed into React elements is safe by construction, because nothing is ever handed to
 * `dangerouslySetInnerHTML`. Bare email addresses are linkified by the same pass, so
 * `legal@paperlens.co` in the prose becomes a `mailto:` without the content author writing
 * markup.
 */

/**
 * The documents that exist.
 *
 * A closed union rather than an open string: these three have their own URLs (`/terms` and
 * not `/legal/terms`, because that is where every user, every enterprise buyer and every
 * regulator looks first), so adding one is necessarily also adding a route. The type makes
 * that pairing impossible to forget.
 */
export const LEGAL_DOCUMENT_SLUGS = ['terms', 'privacy', 'cookies'] as const;

export type LegalDocumentSlug = (typeof LEGAL_DOCUMENT_SLUGS)[number];

export function isLegalDocumentSlug(value: string): value is LegalDocumentSlug {
 return (LEGAL_DOCUMENT_SLUGS as readonly string[]).includes(value);
}

/** One row of a list. `term` renders as the bolded lead-in of a definition. */
export interface LegalListItem {
 readonly term?: string;
 readonly text: string;
}

export type LegalBlock =
 | { readonly kind: 'paragraph'; readonly text: string }
 | { readonly kind: 'list'; readonly items: readonly LegalListItem[] }
 /**
 * A clause the reader must not miss — the AI disclaimer, the deletion window, the advice to
 * cover an SSN before photographing. Rendered as a bordered aside rather than as bold body
 * text, because a wall of bold reads as no emphasis at all.
 */
 | { readonly kind: 'callout'; readonly text: string };

export interface LegalSubsection {
 readonly heading: string;
 readonly blocks: readonly LegalBlock[];
}

export interface LegalSection {
 /**
 * The URL fragment. Stable and hand-written, never derived from the heading — a heading is
 * copy and will be reworded, and an anchor that changes with its wording breaks every
 * citation of it, including the ones in a signed contract.
 */
 readonly id: string;
 readonly heading: string;
 readonly blocks: readonly LegalBlock[];
 readonly subsections: readonly LegalSubsection[];
}

export interface LegalDocument {
 readonly slug: LegalDocumentSlug;
 readonly title: string;
 /** For `<meta name="description">`. One sentence. */
 readonly description: string;
 /** Short label above the title — "Terms & governance", "Compliance & security". */
 readonly eyebrow: string;
 /** ISO 8601 date, so `<time dateTime>` is machine-readable and the display format is ours. */
 readonly lastUpdatedIso: string;
 /** Present only where the document has an effective date distinct from its last revision. */
 readonly effectiveIso?: string;
 /** The paragraph under the title. Sets the tone before the numbering starts. */
 readonly intro: string;
 readonly sections: readonly LegalSection[];
}

/**
 * The heading and anchor of every section, for a table of contents.
 *
 * Derived rather than stored: a contents list maintained alongside the sections is a contents
 * list that will disagree with them.
 */
export function legalTableOfContents(
 document: LegalDocument,
): readonly { readonly id: string; readonly heading: string }[] {
 return document.sections.map((section) => ({ id: section.id, heading: section.heading }));
}

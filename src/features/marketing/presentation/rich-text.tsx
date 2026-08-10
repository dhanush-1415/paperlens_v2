/**
 * The inline markup parser for published content.
 *
 * Two constructs, both chosen because content authors write them without thinking: `**bold**`
 * and a bare email address. Everything else in a content string is literal text.
 *
 * ### Why parse at all instead of allowing HTML
 *
 * Because the alternative is `dangerouslySetInnerHTML`, and that word is accurate. Content is
 * the surface most likely to be edited by someone who is not reviewing a diff, and eventually
 * to arrive from a CMS over the network — at which point "the content is trusted" stops being
 * a fact about a file in this repository and becomes an assumption about an API. A parser that
 * can only ever emit `<strong>` and `<a href="mailto:…">` cannot be talked into emitting a
 * `<script>`, no matter what the string says.
 *
 * ### Why the regex is a split rather than a match loop
 *
 * `split` with a capturing group returns the delimiters interleaved with the text between
 * them, which is exactly the alternating structure React wants. A `matchAll` loop would need
 * to track the index of the last match to recover the plain runs — the same algorithm, written
 * out, with an off-by-one waiting in it.
 *
 * Unmatched `**` is left as literal asterisks rather than throwing. A stray marker in a
 * paragraph should look slightly wrong; it should not take down the terms of service.
 */

import { Fragment, type ReactNode } from 'react';

/**
 * `**…**` or an email address.
 *
 * The bold arm requires at least one non-asterisk character, so `****` is literal. The email
 * arm is deliberately loose — it is used to *decorate* an address, not to validate one, and
 * the cost of a false positive is a mailto link nobody clicks.
 */
const INLINE_PATTERN = /(\*\*[^*]+\*\*|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]+)/g;

export function renderInline(text: string): ReactNode {
 const parts = text.split(INLINE_PATTERN);

 return parts.map((part, index) => {
 // Odd indices are the captured delimiters; even indices are the plain runs between them.
 if (index % 2 === 0) return part === '' ? null : <Fragment key={index}>{part}</Fragment>;

 if (part.startsWith('**')) {
 return (
 <strong key={index} className="font-semibold text-text-primary">
 {part.slice(2, -2)}
 </strong>
 );
 }

 return (
 <a
 key={index}
 href={`mailto:${part}`}
 className="text-text-primary underline decoration-border-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
 >
 {part}
 </a>
 );
 });
}

export interface RichTextProps {
 text: string;
}

/** `renderInline` as a component, for the common case of a whole string. */
export function RichText({ text }: RichTextProps) {
 return <>{renderInline(text)}</>;
}

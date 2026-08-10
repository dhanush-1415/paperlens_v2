/**
 * DocumentExcerpt — a verbatim passage lifted out of the user's own document.
 *
 * ### Why it looks different from everything else
 *
 * `globals.css` puts `code`, `kbd`, `samp` and `pre` in the mono face, and that is not a
 * decorative choice: monospace is how this interface says *"these are not our words."* An
 * analysis that paraphrases a clause and an analysis that quotes it are worth very different
 * amounts, and the user must be able to tell them apart at a glance, on every screen, without
 * reading. The excerpt is the evidence; everything around it is our opinion about it.
 *
 * That is also why the passage is never truncated with an ellipsis in the middle, never
 * reflowed, and never has its whitespace collapsed — `whitespace-pre-wrap` preserves the
 * document's own line breaks and indentation, because in a contract, layout is meaning.
 *
 * ### Semantics
 *
 * `<figure>` → `<blockquote>` → `<figcaption>`. This is precisely what the elements are for:
 * a quotation with an attribution. A `<div>` with a border would look the same and tell
 * assistive technology nothing, and "Clause 7.2" read *after* the passage it labels is the
 * difference between a citation and a stray fragment.
 *
 * ### Highlighting
 *
 * The caller marks the risky span with a plain `<mark>` and this component styles it — no
 * offset arithmetic, no `dangerouslySetInnerHTML`, and no props threading indices through
 * three layers. `<mark>` already means "relevant to what you are doing right now", which is
 * exactly the claim being made, and screen readers can be configured to announce it.
 *
 * <DocumentExcerpt level="critical" source="Clause 7.2">
 * The Supplier may vary the fees <mark>at its sole discretion</mark> upon notice.
 * </DocumentExcerpt>
 */

import type { ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';

import { Text } from '../components/text';
import { TONE_SOLID, type RiskTone } from '../tone';

const excerptVariants = cva(
 [
 'relative overflow-hidden rounded-card border border-border-subtle bg-surface-2',
 // The accent bar is inline-start padding plus an absolutely-positioned span, rather than
 // a `border-s-4`: a thick border on one side of a rounded box leaves a visible notch at
 // the corners in every engine.
 'py-4 ps-5 pe-4',
 ],
 {
 variants: {
 /**
 * How much of a long passage to show.
 *
 * Fixed steps rather than a numeric prop, because `line-clamp-${n}` built at runtime is
 * invisible to Tailwind's scanner and would produce a class that does not exist — the
 * failure mode being an excerpt that silently shows in full.
 */
 clamp: {
 none: '',
 short: '[&_blockquote]:line-clamp-3',
 long: '[&_blockquote]:line-clamp-8',
 },
 },
 defaultVariants: { clamp: 'none' },
 },
);

export interface DocumentExcerptProps extends VariantProps<typeof excerptVariants> {
 /** The passage. Wrap the risky span in `<mark>`. */
 children: ReactNode;
 /**
 * Where it came from — "Clause 7.2", "Page 3, ¶4". Strongly recommended: an excerpt with
 * no citation is unverifiable, and the first thing a lawyer does is go and check.
 */
 source?: ReactNode;
 /** Tints the accent bar and the `<mark>`. Omit on a neutral quotation. */
 level?: RiskTone;
 /** `cite` attribute — a URL or identifier for the source document, if one exists. */
 cite?: string;
 className?: string;
}

export function DocumentExcerpt({
 children,
 source,
 level,
 cite,
 clamp,
 className,
}: DocumentExcerptProps) {
 return (
 <figure className={cn(excerptVariants({ clamp }), className)}>
 <span
 aria-hidden
 className={cn(
 'absolute inset-y-0 start-0 w-1',
 level ? TONE_SOLID[level] : 'bg-border-strong',
 )}
 />

 <blockquote
 cite={cite}
 className={cn(
 ' text-2xs leading-relaxed whitespace-pre-wrap text-text-primary',
 // Any `<mark>` the caller placed inside gets the tint here, so the call site writes
 // plain HTML and never a class name. `rounded-selection` and the negative inline
 // margin keep the highlight from looking like a text-selection rectangle.
 '[&_mark]:-mx-0.5 [&_mark]:rounded-selection [&_mark]:px-0.5',
 '[&_mark]:bg-brand-primary/20 [&_mark]:text-text-primary',
 level === 'critical' && '[&_mark]:bg-risk-critical/20',
 level === 'caution' && '[&_mark]:bg-risk-caution/25',
 level === 'safe' && '[&_mark]:bg-risk-safe/20',
 )}
 >
 {children}
 </blockquote>

 {source ? (
 <figcaption className="mt-3">
 <Text as="span" size="xs" tone="tertiary" className="font-medium">
 {source}
 </Text>
 </figcaption>
 ) : null}
 </figure>
 );
}

export { excerptVariants as documentExcerptVariants };

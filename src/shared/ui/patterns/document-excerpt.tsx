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
    'relative overflow-hidden rounded-2xl border border-border-strong/50 bg-surface-1 shadow-[inset_0_2px_15px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_15px_rgba(255,255,255,0.02)]',
    'py-5 ps-6 pe-5 transition-all duration-300 hover:border-border-strong hover:shadow-[inset_0_2px_20px_rgba(0,0,0,0.05)] dark:hover:shadow-[inset_0_2px_20px_rgba(255,255,255,0.04)]',
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
          'absolute inset-y-0 start-0 w-[5px] rounded-r-sm',
          level ? TONE_SOLID[level] : 'bg-border-strong',
          level === 'critical' ? 'shadow-[2px_0_12px_rgba(239,68,68,0.4)]' : '',
          level === 'caution' ? 'shadow-[2px_0_12px_rgba(245,158,11,0.4)]' : '',
        )}
      />

      <blockquote
        cite={cite}
        className={cn(
          'font-serif text-sm leading-relaxed whitespace-pre-wrap text-text-secondary',
          // Any `<mark>` the caller placed inside gets the tint here, so the call site writes
          // plain HTML and never a class name.
          '[&_mark]:-mx-1 [&_mark]:rounded-md [&_mark]:px-1.5 [&_mark]:py-0.5',
          '[&_mark]:bg-brand-primary/10 [&_mark]:font-semibold [&_mark]:text-text-primary',
          level === 'critical' &&
            '[&_mark]:border [&_mark]:border-risk-critical/20 [&_mark]:bg-risk-critical/15',
          level === 'caution' &&
            '[&_mark]:border [&_mark]:border-risk-caution/20 [&_mark]:bg-risk-caution/15',
          level === 'safe' &&
            '[&_mark]:border [&_mark]:border-risk-safe/20 [&_mark]:bg-risk-safe/15',
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

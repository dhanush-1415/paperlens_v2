/**
 * LoadingState — a spinner with a label, for the cases a skeleton cannot cover.
 *
 * ### Read this before reaching for it
 *
 * A spinner is the *worst* loading affordance and it should be the last one you try. In
 * order of preference:
 *
 * 1. **Nothing.** With `cacheComponents`, the static shell of a route streams immediately
 * and only the dynamic hole suspends. If the hole is small, no indicator is needed.
 * 2. **A skeleton that matches the real layout** — in `loading.tsx` or a `<Suspense>`
 * fallback. It reserves the space the content will occupy, so nothing moves when the
 * data lands. That is the difference between "loading" and "janky".
 * 3. **This**, when the eventual layout is genuinely unknowable: a search whose result
 * count decides the shape, a document whose analysis produces between one and forty
 * flags.
 *
 * A skeleton that does not match the content it replaces is worse than a spinner, because it
 * promises a shape and then breaks the promise. Use `Skeleton` when you know the shape; use
 * this when you do not.
 *
 * ### Announcing it
 *
 * `role="status"` with `aria-live="polite"`, so a screen reader says "Analysing document"
 * once, when it appears, and again when it is replaced by content. The `Spinner` itself is
 * `aria-hidden` — an animated SVG has nothing to announce, and the label is the message.
 */

import type { ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

import { Spinner } from '../components/spinner';
import { Text } from '../components/text';

export interface LoadingStateProps {
 /**
 * What is happening, as a verb — "Analysing document", not "Loading". Required: a status
 * region with no text announces nothing, and a bare spinner tells a screen-reader user
 * that the page is finished.
 */
 label: string;
 /** Optional second line for anything slow enough to need reassurance. */
 description?: ReactNode;
 /** `md` fills a page; `sm` fits a card or an inline region. */
 size?: 'sm' | 'md';
 className?: string;
}

export function LoadingState({ label, description, size = 'md', className }: LoadingStateProps) {
 return (
 <div
 role="status"
 aria-live="polite"
 className={cn(
 'flex flex-col items-center justify-center gap-3 text-center',
 size === 'md' ? 'px-6 py-16' : 'px-4 py-10',
 className,
 )}
 >
 <Spinner className={size === 'md' ? 'size-6' : 'size-5'} />
 <Text as="p" size="sm">
 {label}
 </Text>
 {description ? (
 <Text as="p" size="xs" tone="tertiary" measure>
 {description}
 </Text>
 ) : null}
 </div>
 );
}

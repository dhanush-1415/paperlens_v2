/**
 * StatusBlock — the shared skeleton behind `EmptyState`, `ErrorState` and `LoadingState`.
 *
 * Those three are the same object: a centred icon, a short title, a line of explanation, and
 * at most two actions. They differ only in tone, default icon, and copy. Writing them three
 * times would guarantee that in six months the empty state is centred and the error state is
 * left-aligned, and nobody would be able to say which one was the mistake.
 *
 * It is exported rather than kept private because a feature will eventually need a fourth
 * one — "no results for this filter", "this document is still processing" — and the correct
 * answer to that is to compose this, not to copy `EmptyState` and edit the icon.
 */

import type { ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

import { Heading } from '../components/heading';
import { Text } from '../components/text';
import { TONE_SOFT, type Tone } from '../tone';

export interface StatusBlockProps {
 /**
 * The icon, already sized by the caller's preset. Rendered inside a tinted round chip so
 * that a 20px line icon has enough presence to anchor an otherwise empty screen.
 */
 icon?: ReactNode;
 tone?: Tone;
 title: ReactNode;
 description?: ReactNode;
 /** Buttons. Two at most — an empty state with four options is a menu, not a dead end. */
 actions?: ReactNode;
 /** Anything below the actions: a support reference, a link to docs. */
 footer?: ReactNode;
 /**
 * `md` fills a page; `sm` fits inside a card or a tab panel. Same proportions, less air —
 * the compact one exists because a full-height empty state inside a 200px card looks
 * broken.
 */
 size?: 'sm' | 'md';
 className?: string;
}

export function StatusBlock({
 icon,
 tone = 'neutral',
 title,
 description,
 actions,
 footer,
 size = 'md',
 className,
}: StatusBlockProps) {
 return (
 <div
 className={cn(
 'flex flex-col items-center justify-center text-center',
 size === 'md' ? 'gap-4 px-6 py-16' : 'gap-3 px-4 py-10',
 className,
 )}
 >
 {icon ? (
 <span
 aria-hidden
 className={cn(
 'grid place-items-center rounded-full border',
 size === 'md' ? 'size-12' : 'size-10',
 TONE_SOFT[tone],
 )}
 >
 {icon}
 </span>
 ) : null}

 {/*
 `level={3}` rather than `level={2}`: a status block is almost always *inside* a page
 that already owns the `<h1>` and usually a section `<h2>`. Callers that genuinely
 render one as a whole page — a full-page 404 — pass their own heading above it.
 */}
 <Heading level={3} size={size === 'md' ? 'md' : 'sm'}>
 {title}
 </Heading>

 {description ? (
 <Text as="p" size="sm" measure className="text-pretty">
 {description}
 </Text>
 ) : null}

 {actions ? (
 <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{actions}</div>
 ) : null}

 {footer ? <div className="mt-1">{footer}</div> : null}
 </div>
 );
}

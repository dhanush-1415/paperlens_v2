/**
 * PageHeader — the block at the top of every application page.
 *
 * ### Why a pattern and not a component
 *
 * `components/` holds pieces with no opinion about the product: a `Button` does not know
 * what a page is. `patterns/` holds compositions that encode a *product* decision — here,
 * that every page in PaperLens announces itself the same way: eyebrow, title, one line of
 * description, actions on the trailing edge, and a rule underneath.
 *
 * That uniformity is the point. Fourteen pages each assembling their own `Heading` + `Text` +
 * flex row will drift within a quarter — different gaps, different heading sizes, the actions
 * on the left on one screen. One component means "make page titles smaller" is one edit.
 *
 * ### The `<h1>` lives here
 *
 * `level={1}` is hardcoded, not a prop. Every page has exactly one `<h1>` and this is it. A
 * `level` prop would immediately be used to render a PageHeader inside a card, which is what
 * produces documents with three `<h1>`s and an unusable heading outline.
 */

import type { ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

import { Heading } from '../components/heading';
import { Text } from '../components/text';

export interface PageHeaderProps {
 title: ReactNode;
 /**
 * Small uppercase label above the title — the section the page belongs to ("Billing",
 * "Documents"). Not a breadcrumb: it says *where you are*, not how you got here.
 */
 eyebrow?: ReactNode;
 /** One sentence. What this page is for, in the user's language. */
 description?: ReactNode;
 /**
 * Primary and secondary actions, trailing on desktop and stacked below on mobile.
 *
 * A `ReactNode` rather than a structured `actions: Action[]` array: the buttons here are
 * genuinely arbitrary — a `<Link>` styled as a button, a `<Dialog>` trigger, a form's
 * submit — and a structured API would end up carrying `onClick | href | asChild | form`
 * and re-implementing `Button`'s props one field at a time.
 */
 actions?: ReactNode;
 /** Anything that belongs under the rule: a `Tabs` row, a filter bar, a stat strip. */
 children?: ReactNode;
 /** Hide the bottom rule when the next thing on the page already has a top border. */
 divider?: boolean;
 className?: string;
}

export function PageHeader({
 title,
 eyebrow,
 description,
 actions,
 children,
 divider = true,
 className,
}: PageHeaderProps) {
 return (
 <header className={cn('pb-6', divider && 'border-b border-border-subtle', className)}>
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 {/* `min-w-0` so a long unbroken title truncates instead of pushing the actions off
 the trailing edge — the flex default of `min-width: auto` would let it. */}
 <div className="min-w-0 flex-1">
 {eyebrow ? (
 <Text as="p" size="xs" className="mb-2 font-semibold tracking-wider uppercase">
 {eyebrow}
 </Text>
 ) : null}

 <Heading level={1} size="lg">
 {title}
 </Heading>

 {description ? (
 <Text as="p" size="sm" measure className="mt-2">
 {description}
 </Text>
 ) : null}
 </div>

 {/* `shrink-0` on the action rail: buttons have a fixed intrinsic width and wrapping
 "Upload document" onto two lines to give the title room is the wrong trade. */}
 {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
 </div>

 {children ? <div className="mt-6">{children}</div> : null}
 </header>
 );
}

/**
 * ErrorState — something failed and the user is looking at the hole it left.
 *
 * ### No `'use client'`, and no `onRetry` prop
 *
 * The obvious API is `<ErrorState onRetry={retry} />`, which would make this a client
 * component. It is not, because the same block has to render in three places: an `error.tsx`
 * boundary (already client, has `unstable_retry`), a server component that got an `err()`
 * from a repository and has nothing to retry with, and a card that failed to load inside an
 * otherwise fine page. Taking `action` as a node covers all three and keeps the two
 * server-rendered cases free of a client boundary they do not need.
 *
 * ### It does not know what an `AppError` is
 *
 * No import from `@/core/errors`. The boundary that catches the error is the layer that
 * decides which of `userMessageKey`, `code` and `retryable` become copy, a reference, and a
 * button — that mapping is policy, and policy in a presentational component is how you end
 * up with a design system that cannot be reused. `ErrorState` renders strings.
 *
 * ### The correlation id is not decoration
 *
 * It is the entire reason a support conversation can end. "It broke" is unactionable; a
 * `pl_…` id resolves to the exact server log line, the request, and the stack. It renders in
 * mono, selectable, at low emphasis — visible enough to be read aloud over the phone,
 * quiet enough not to look like part of the failure.
 *
 * What must never appear here is the underlying exception message. It is written for us, it
 * frightens users, and on the server it routinely contains a query, a path, or a token.
 */

import type { ReactNode } from 'react';

import { AlertTriangleIcon } from '../icons';
import { Text } from '../components/text';

import { StatusBlock, type StatusBlockProps } from './status-block';

export interface ErrorStateProps extends Pick<StatusBlockProps, 'size' | 'className'> {
 /** Short, human, and about the user's task — "We couldn't load your documents". */
 title?: ReactNode;
 /** What they can do. Avoid "try again later" unless it is genuinely true. */
 description?: ReactNode;
 /** Usually a retry `Button`, plus a secondary route out. */
 action?: ReactNode;
 /** `AppError.correlationId`. Omit only when the failure never reached a logger. */
 correlationId?: string;
 icon?: ReactNode;
}

export function ErrorState({
 title = 'Something went wrong',
 description = 'The page could not be loaded. Retrying usually resolves it.',
 action,
 correlationId,
 icon,
 size,
 className,
}: ErrorStateProps) {
 return (
 <StatusBlock
 tone="critical"
 icon={icon ?? <AlertTriangleIcon className="size-5" />}
 title={title}
 description={description}
 actions={action}
 footer={
 correlationId ? (
 <Text as="p" size="xs" mono tone="tertiary">
 {/* `select-all` so one click selects the whole id — a user copying half a
 reference is worse than one who copies none, because it looks valid. */}
 Reference <span className="select-all">{correlationId}</span>
 </Text>
 ) : null
 }
 size={size}
 className={className}
 />
 );
}

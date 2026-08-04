/**
 * EmptyState — nothing here yet.
 *
 * ### Empty is a product surface, not an error
 *
 * The first thing a new user sees on most screens is the empty state, and it is the single
 * highest-leverage piece of copy in the application: it is the only moment where the user is
 * looking directly at a feature and does not yet know what it does. "No documents" wastes it.
 * "Upload a contract and PaperLens flags the clauses worth arguing about" does not.
 *
 * So `title` and `description` are both required-by-convention and the component takes an
 * `action` prominently: an empty state without a next step is a dead end the user backs out
 * of. The one legitimate exception is a filtered list that found nothing — there the action
 * is "clear filters", which is why `action` is a node and not a fixed button.
 *
 * ### Distinguish "empty" from "filtered to nothing"
 *
 * They read identically and mean opposite things: one is "you haven't started", the other is
 * "your search was too narrow". Passing `filtered` swaps the default icon and tells the
 * caller to write the copy for the second case. Getting this wrong tells a user with 400
 * documents that they have none.
 */

import type { ReactNode } from 'react';

import { InboxIcon, SearchIcon } from '../icons';

import { StatusBlock, type StatusBlockProps } from './status-block';

export interface EmptyStateProps extends Pick<StatusBlockProps, 'size' | 'className'> {
  /** What is missing, as a short phrase — "No documents yet". */
  title: ReactNode;
  /** What to do about it, and what they get. One or two sentences. */
  description?: ReactNode;
  /** Usually one `Button`. The next step. */
  action?: ReactNode;
  /** Override the default icon when the feature has one of its own. */
  icon?: ReactNode;
  /** `true` when the list is non-empty but the current filter or query matched nothing. */
  filtered?: boolean;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  filtered = false,
  size,
  className,
}: EmptyStateProps) {
  const defaultIcon = filtered ? (
    <SearchIcon className="size-5 text-text-tertiary" />
  ) : (
    <InboxIcon className="size-5 text-text-tertiary" />
  );

  return (
    <StatusBlock
      // Never a risk tone. An empty list is not a warning, and colouring it amber teaches
      // users to ignore amber — which is the colour the product needs them to trust on a
      // contract clause.
      tone="neutral"
      icon={icon ?? defaultIcon}
      title={title}
      description={description}
      actions={action}
      size={size}
      className={className}
    />
  );
}

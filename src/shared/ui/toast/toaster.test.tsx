import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast, useToastStore } from './store';
import { Toaster } from './toaster';

/**
 * The toast viewport.
 *
 * The store already owns timing (`store.test.ts`); what this file is about is the part a
 * screen-reader user experiences, which is invisible in a browser and impossible to notice by
 * looking at the page.
 *
 * The single most important assertion here is that the `<ol>` renders **even when there are no
 * toasts**. A live region has to be in the DOM before content is inserted into it, or
 * assistive technology has nothing to observe and the first toast of the session is announced
 * to nobody. Mounting the list only when `toasts.length > 0` is the obvious optimisation and
 * it silently breaks the entire feature for the users who most need it.
 *
 * The second is `aria-live="polite"` rather than `assertive`, including for errors. Assertive
 * interrupts mid-word, which for someone part-way through a paragraph of their own contract is
 * hostile. That is affordable only because critical toasts never auto-dismiss — urgency is
 * bought with persistence instead of interruption — so the two facts are asserted together.
 */

/**
 * Toasts are pushed from outside React — that is the whole point of a module-scoped store —
 * so every call has to be wrapped for the test renderer to flush the subscription before the
 * next assertion. This is a test-harness concern only; in the app the store notifies React
 * through `useSyncExternalStore` and no wrapper exists or is needed.
 */
function push(announce: () => string | void): void {
  act(() => {
    announce();
  });
}

beforeEach(() => {
  useToastStore.getState().clear();
});

afterEach(() => {
  useToastStore.getState().clear();
});

describe('the live region', () => {
  it('is in the DOM before the first toast exists', () => {
    // Insert the region and the content in the same tick and the announcement is lost. This
    // is the whole reason the list renders unconditionally.
    render(<Toaster />);

    expect(screen.getByRole('list', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('announces politely, never assertively', () => {
    render(<Toaster />);
    const list = screen.getByRole('list', { name: 'Notifications' });

    expect(list).toHaveAttribute('aria-live', 'polite');
    expect(list).not.toHaveAttribute('role', 'alert');
  });

  it('announces only what changed', () => {
    // With `aria-atomic="true"`, adding a second toast re-reads the first one as well.
    render(<Toaster />);

    expect(screen.getByRole('list', { name: 'Notifications' })).toHaveAttribute(
      'aria-atomic',
      'false',
    );
  });

  it('keeps a critical toast on screen indefinitely, which is what makes polite safe', () => {
    render(<Toaster />);
    push(() => toast.error('Analysis failed'));

    expect(useToastStore.getState().toasts[0]?.duration).toBeNull();
  });
});

describe('rendering', () => {
  it('renders each toast as a list item, so the count is announced', () => {
    render(<Toaster />);

    push(() => toast.success('Saved'));
    push(() => toast.info('Synced'));

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows the title and the description', () => {
    render(<Toaster />);

    push(() => toast.error('Upload failed', { description: 'The file could not be read.' }));

    expect(screen.getByText('Upload failed')).toBeInTheDocument();
    expect(screen.getByText('The file could not be read.')).toBeInTheDocument();
  });

  it('renders no description element when there is none', () => {
    render(<Toaster />);
    push(() => toast.success('Saved'));

    expect(screen.getByRole('listitem').querySelectorAll('p')).toHaveLength(1);
  });

  it('drops a toast from the DOM as soon as it leaves the store', () => {
    // There is deliberately no exit animation: keeping the element mounted for the length of
    // its own transition means a duration in JS that has to agree with one in CSS.
    render(<Toaster />);
    let id = '';
    push(() => {
      id = toast.success('Saved');
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    act(() => {
      useToastStore.getState().dismiss(id);
    });

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});

describe('interaction', () => {
  it('dismisses through the close button', async () => {
    render(<Toaster />);
    push(() => toast.success('Saved'));

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('runs the action and then dismisses', async () => {
    // Leaving the toast up after the user has responded turns a notification into a stale
    // control they can click a second time.
    const onClick = vi.fn();
    render(<Toaster />);
    push(() => toast.error('Upload failed', { action: { label: 'Retry', onClick } }));

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('pauses every countdown while the pointer is over the stack', async () => {
    // WCAG 2.2.1. A toast that vanishes mid-sentence is a failure and, more simply, rude.
    const pauseAll = vi.spyOn(useToastStore.getState(), 'pauseAll');
    render(<Toaster />);
    push(() => toast.success('Saved'));

    await userEvent.hover(screen.getByRole('list', { name: 'Notifications' }));

    expect(pauseAll).toHaveBeenCalled();
    pauseAll.mockRestore();
  });

  it('pauses when focus lands inside, which is the keyboard equivalent of hover', async () => {
    // React's `onFocus` bubbles, so focus reaching the dismiss button pauses the stack. A
    // keyboard user tabbing to the action must get the same protection a mouse user gets.
    const pauseAll = vi.spyOn(useToastStore.getState(), 'pauseAll');
    render(<Toaster />);
    push(() => toast.success('Saved'));

    await userEvent.tab();

    expect(pauseAll).toHaveBeenCalled();
    pauseAll.mockRestore();
  });
});

describe('placement', () => {
  it('accepts a position without changing the markup contract', () => {
    // Position is presentation. Moving the stack must not move the live region or its name.
    render(<Toaster position="top-center" />);

    expect(screen.getByRole('list', { name: 'Notifications' })).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });
});

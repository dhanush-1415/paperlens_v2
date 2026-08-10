import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Dialog } from './dialog';
import { Drawer } from './drawer';

/**
 * The modal surfaces.
 *
 * Both are the native `<dialog>` element driven from React state, and the tests are shaped
 * around the two things that go wrong with that pairing.
 *
 * The first is **double-open**. `showModal()` on an already-open dialog throws
 * `InvalidStateError`, so any re-render of the parent while the dialog is open — a keystroke
 * in a form behind it, a store update — would crash the page without the `el.open` guard.
 * There is a test for exactly that re-render.
 *
 * The second is **who owns the state**. The DOM holds open/closed itself, so a component with
 * its own `useState` has two copies that drift the moment the user presses Esc. Here React is
 * authoritative and every close path — Esc, backdrop, the close button, a `method="dialog"`
 * submit — funnels through the element's `close` event into `onClose`. The tests below take
 * each of those paths separately, because they are separate code paths in the browser.
 *
 * jsdom implements neither `showModal()` nor `close()`, so they are polyfilled with the two
 * behaviours the component actually depends on: the `open` attribute, and the `close` event.
 * Focus trapping and the top layer are the browser's job and are covered by the Playwright
 * suite, not here — asserting them against a polyfill would only test the polyfill.
 */

beforeAll(() => {
 const proto = window.HTMLDialogElement.prototype as unknown as {
 showModal?: () => void;
 close?: () => void;
 };

 proto.showModal ??= function showModal(this: HTMLDialogElement) {
 this.setAttribute('open', '');
 };

 proto.close ??= function close(this: HTMLDialogElement) {
 this.removeAttribute('open');
 this.dispatchEvent(new Event('close'));
 };
});

const dialogElement = (container: HTMLElement) =>
 container.querySelector('dialog') as HTMLDialogElement;

describe('Dialog', () => {
 it('stays shut until the caller says otherwise', () => {
 const { container } = render(<Dialog open={false} onClose={vi.fn()} title="Delete document" />);

 expect(dialogElement(container).open).toBe(false);
 });

 it('opens when the prop flips, rather than holding its own state', () => {
 // The DOM already stores open/closed. A second copy in `useState` drifts the moment the
 // user presses Esc, and the dialog then refuses to reopen because React still thinks it is.
 const { container, rerender } = render(
 <Dialog open={false} onClose={vi.fn()} title="Delete document" />,
 );

 rerender(<Dialog open onClose={vi.fn()} title="Delete document" />);

 expect(dialogElement(container).open).toBe(true);
 });

 it('does not call showModal twice on a re-render while open', () => {
 // The second call throws `InvalidStateError` and takes the page down. Any parent re-render
 // — a keystroke in a background form, a store update — would trigger it without the guard.
 const showModal = vi.spyOn(window.HTMLDialogElement.prototype, 'showModal');
 const { rerender } = render(<Dialog open onClose={vi.fn()} title="Delete document" />);

 rerender(<Dialog open onClose={vi.fn()} title="Delete document" />);
 rerender(
 <Dialog open onClose={vi.fn()} title="Delete document" description="This cannot be undone." />,
 );

 expect(showModal).toHaveBeenCalledTimes(1);
 showModal.mockRestore();
 });

 it('is named and described through aria, not by proximity', () => {
 const { container } = render(
 <Dialog open onClose={vi.fn()} title="Delete document" description="This cannot be undone." />,
 );
 const el = dialogElement(container);

 expect(el.getAttribute('aria-labelledby')).toBeTruthy();
 expect(document.getElementById(el.getAttribute('aria-labelledby') ?? '')).toHaveTextContent(
 'Delete document',
 );
 expect(document.getElementById(el.getAttribute('aria-describedby') ?? '')).toHaveTextContent(
 'This cannot be undone.',
 );
 });

 it('omits aria-describedby when there is nothing to describe it with', () => {
 // Pointing at an element that does not exist makes the whole reference inert in some
 // screen readers, which is worse than not having one.
 const { container } = render(<Dialog open onClose={vi.fn()} title="Delete document" />);

 expect(dialogElement(container).hasAttribute('aria-describedby')).toBe(false);
 });

 it('offers a real close button, not only Esc', async () => {
 // Esc is invisible, unavailable on touch, and the first thing a keyboard-only user does is
 // press Tab — which has to land somewhere that closes the dialog.
 const onClose = vi.fn();
 render(<Dialog open onClose={onClose} title="Delete document" />);

 await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));

 expect(onClose).toHaveBeenCalledOnce();
 });

 it('routes the element close event back to the owner', () => {
 // This is the path Esc takes. The component never sees the key — the browser closes the
 // element and fires `close`, and that event is what has to reach React.
 const onClose = vi.fn();
 const { container } = render(<Dialog open onClose={onClose} title="Delete document" />);

 fireEvent(dialogElement(container), new Event('close'));

 expect(onClose).toHaveBeenCalledOnce();
 });

 it('closes on a backdrop click', () => {
 // `::backdrop` is not an element and cannot take a listener, so the click lands on the
 // `<dialog>` itself. `target === the dialog` is what separates "clicked the dark area"
 // from "clicked inside the panel", whose children report themselves as the target.
 const onClose = vi.fn();
 const { container } = render(<Dialog open onClose={onClose} title="Delete document" />);

 fireEvent.click(dialogElement(container));

 expect(onClose).toHaveBeenCalledOnce();
 });

 it('does not close when the click landed inside the panel', () => {
 const onClose = vi.fn();
 render(
 <Dialog open onClose={onClose} title="Delete document">
 <p>Body copy</p>
 </Dialog>,
 );

 fireEvent.click(screen.getByText('Body copy'));

 expect(onClose).not.toHaveBeenCalled();
 });

 it('can refuse a backdrop dismissal, for a form with unsaved input', () => {
 // A stray click outside a half-filled form that discards it is a genuinely bad afternoon.
 const onClose = vi.fn();
 const { container } = render(
 <Dialog open onClose={onClose} title="Edit" dismissOnBackdropClick={false} />,
 );

 fireEvent.click(dialogElement(container));

 expect(onClose).not.toHaveBeenCalled();
 });

 it('renders children and a footer', () => {
 render(
 <Dialog open onClose={vi.fn()} title="Delete" footer={<button>Confirm</button>}>
 <p>Body copy</p>
 </Dialog>,
 );

 expect(screen.getByText('Body copy')).toBeInTheDocument();
 expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
 });

 it('locks background scroll while open and restores what was there before', () => {
 // Restored rather than cleared, so a confirm inside a drawer does not unlock the page for
 // the drawer still behind it when it closes.
 document.documentElement.style.overflow = 'scroll';
 const { rerender } = render(<Dialog open onClose={vi.fn()} title="Delete" />);

 expect(document.documentElement.style.overflow).toBe('hidden');

 rerender(<Dialog open={false} onClose={vi.fn()} title="Delete" />);

 expect(document.documentElement.style.overflow).toBe('scroll');
 document.documentElement.style.overflow = '';
 });
});

describe('Drawer', () => {
 it('opens and closes on the prop, same contract as Dialog', () => {
 const { container, rerender } = render(<Drawer open={false} onClose={vi.fn()} title="Filters" />);
 expect(dialogElement(container).open).toBe(false);

 rerender(<Drawer open onClose={vi.fn()} title="Filters" />);
 expect(dialogElement(container).open).toBe(true);
 });

 it('is labelled by its title', () => {
 const { container } = render(<Drawer open onClose={vi.fn()} title="Filters" />);
 const el = dialogElement(container);

 expect(document.getElementById(el.getAttribute('aria-labelledby') ?? '')).toHaveTextContent(
 'Filters',
 );
 });

 it('names its close button for a panel, not a dialog', () => {
 // "Close dialog" on a side panel is the kind of copy mismatch that only a screen-reader
 // user ever hears.
 render(<Drawer open onClose={vi.fn()} title="Filters" />);

 expect(screen.getByRole('button', { name: 'Close panel' })).toBeInTheDocument();
 });

 it('closes on the backdrop and on the button', async () => {
 const onClose = vi.fn();
 const { container } = render(<Drawer open onClose={onClose} title="Filters" />);

 await userEvent.click(screen.getByRole('button', { name: 'Close panel' }));
 fireEvent.click(dialogElement(container));

 expect(onClose).toHaveBeenCalledTimes(2);
 });

 it('renders a description, children and a footer', () => {
 render(
 <Drawer
 open
 onClose={vi.fn()}
 title="Filters"
 description="Narrow the vault"
 footer={<button>Apply</button>}
 >
 <p>Body</p>
 </Drawer>,
 );

 expect(screen.getByText('Narrow the vault')).toBeInTheDocument();
 expect(screen.getByText('Body')).toBeInTheDocument();
 expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
 });

 it('omits the footer element entirely when there is no footer', () => {
 const { container } = render(<Drawer open onClose={vi.fn()} title="Filters" />);

 expect(container.querySelector('footer')).toBeNull();
 });
});

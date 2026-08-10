import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast, useToastStore } from './store';

/**
 * The toast queue.
 *
 * Toasts are where timer bugs hide, because every one of them is invisible in a browser: a
 * cancelled timer that still fires dismisses the *wrong* toast, and the user sees a message
 * vanish after half a second with no way to reproduce it. Fake timers make each of those a
 * deterministic assertion.
 *
 * The accessibility requirement is tested here rather than in the component: WCAG 2.2.1 says
 * timed content must be pausable, and a store that keeps counting down while the user is
 * reading it fails that regardless of what the markup says.
 */

beforeEach(() => {
 vi.useFakeTimers();
 useToastStore.getState().clear();
});

afterEach(() => {
 useToastStore.getState().clear();
 vi.useRealTimers();
});

const toasts = () => useToastStore.getState().toasts;

describe('pushing', () => {
 it('adds a toast and returns its id', () => {
 const id = useToastStore.getState().push({ title: 'Saved' });

 expect(toasts()).toHaveLength(1);
 expect(toasts()[0]?.id).toBe(id);
 });

 it('gives every toast a distinct id', () => {
 // Ids collide and dismissing one dismisses the other. The kind of bug that only shows up
 // when two actions fail at once.
 const ids = Array.from({ length: 20 }, () => useToastStore.getState().push({ title: 'x' }));

 expect(new Set(ids).size).toBe(20);
 });

 it('keeps only the most recent four on screen', () => {
 // Past four the stack covers the content it is reporting on, and nobody reads the fifth.
 for (const title of ['a', 'b', 'c', 'd', 'e', 'f']) {
 useToastStore.getState().push({ title });
 }

 expect(toasts().map((entry) => entry.title)).toEqual(['c', 'd', 'e', 'f']);
 });

 it('cancels the timer of a toast pushed out of the window', () => {
 // Otherwise the orphaned timer fires later and dismisses whichever toast happens to be
 // in that slot — a message disappearing early, with nothing in the code to point at.
 for (let i = 0; i < 6; i += 1) useToastStore.getState().push({ title: `t${i}`, duration: 1000 });
 const survivors = toasts().map((entry) => entry.id);

 vi.advanceTimersByTime(999);

 expect(toasts().map((entry) => entry.id)).toEqual(survivors);
 });

 it('defaults to the neutral tone', () => {
 useToastStore.getState().push({ title: 'x' });

 expect(toasts()[0]?.tone).toBe('neutral');
 });

 it('carries the description and action through as data', () => {
 // Data, not markup: the store stays inspectable in devtools and testable without a
 // render, and cannot accumulate component trees that outlive their page.
 const onClick = vi.fn();
 useToastStore.getState().push({
 title: 'Upload failed',
 description: 'The file could not be read.',
 action: { label: 'Retry', onClick },
 });

 expect(toasts()[0]?.description).toBe('The file could not be read.');
 toasts()[0]?.action?.onClick();
 expect(onClick).toHaveBeenCalledOnce();
 });
});

describe('auto-dismiss', () => {
 it('dismisses after the default lifetime for its tone', () => {
 toast.success('Saved');

 vi.advanceTimersByTime(3_999);
 expect(toasts()).toHaveLength(1);

 vi.advanceTimersByTime(1);
 expect(toasts()).toHaveLength(0);
 });

 it('never auto-dismisses an error', () => {
 // A failure the user did not see becomes "it just didn't work" in a support ticket. The
 // cost of an extra click is far lower than the cost of that conversation.
 toast.error('Analysis failed');

 vi.advanceTimersByTime(600_000);

 expect(toasts()).toHaveLength(1);
 });

 it('gives a warning longer than a success', () => {
 // More words, and a consequence to think about.
 toast.warning('Quota nearly spent');
 vi.advanceTimersByTime(4_001);
 expect(toasts()).toHaveLength(1);

 vi.advanceTimersByTime(3_000);
 expect(toasts()).toHaveLength(0);
 });

 it('honours an explicit duration over the tone default', () => {
 useToastStore.getState().push({ title: 'x', tone: 'critical', duration: 100 });

 vi.advanceTimersByTime(100);

 expect(toasts()).toHaveLength(0);
 });

 it('treats an explicit null duration as sticky', () => {
 useToastStore.getState().push({ title: 'x', tone: 'safe', duration: null });

 vi.advanceTimersByTime(60_000);

 expect(toasts()).toHaveLength(1);
 });

 it('dismisses each toast on its own schedule', () => {
 useToastStore.getState().push({ title: 'fast', duration: 1_000 });
 useToastStore.getState().push({ title: 'slow', duration: 5_000 });

 vi.advanceTimersByTime(1_000);

 expect(toasts().map((entry) => entry.title)).toEqual(['slow']);
 });
});

describe('dismissal', () => {
 it('removes one toast by id and leaves the rest', () => {
 const first = useToastStore.getState().push({ title: 'a' });
 useToastStore.getState().push({ title: 'b' });

 useToastStore.getState().dismiss(first);

 expect(toasts().map((entry) => entry.title)).toEqual(['b']);
 });

 it('cancels the pending timer of a manually-dismissed toast', () => {
 // The reason timers are cancelled rather than left to no-op: a stale timer that fires
 // after its toast is gone would dismiss a *later* toast that reused the slot.
 const id = useToastStore.getState().push({ title: 'a', duration: 1_000 });
 useToastStore.getState().dismiss(id);

 useToastStore.getState().push({ title: 'b', duration: 10_000 });
 vi.advanceTimersByTime(1_500);

 expect(toasts().map((entry) => entry.title)).toEqual(['b']);
 });

 it('ignores an unknown id', () => {
 useToastStore.getState().push({ title: 'a' });

 expect(() => useToastStore.getState().dismiss('not-a-real-id')).not.toThrow();
 expect(toasts()).toHaveLength(1);
 });

 it('clears everything and every timer', () => {
 for (let i = 0; i < 3; i += 1) useToastStore.getState().push({ title: `t${i}`, duration: 500 });

 useToastStore.getState().clear();
 vi.advanceTimersByTime(1_000);

 expect(toasts()).toHaveLength(0);
 });
});

describe('pause and resume', () => {
 it('suspends every countdown while the user is reading', () => {
 // WCAG 2.2.1: timed content must be pausable. A store that keeps counting while the
 // pointer is on the stack fails that no matter what the markup says.
 toast.success('Saved');

 useToastStore.getState().pauseAll();
 vi.advanceTimersByTime(60_000);

 expect(toasts()).toHaveLength(1);
 });

 it('does not start a countdown for a toast that arrives while paused', () => {
 useToastStore.getState().pauseAll();
 toast.success('Saved');

 vi.advanceTimersByTime(60_000);

 expect(toasts()).toHaveLength(1);
 useToastStore.getState().resumeAll();
 });

 it('restarts the full reading time on resume rather than a remainder', () => {
 // Resuming precisely would mean per-toast bookkeeping to make a toast expire *sooner* —
 // the wrong direction to optimise. The generous reading costs nothing.
 toast.success('Saved');
 vi.advanceTimersByTime(3_000);

 useToastStore.getState().pauseAll();
 useToastStore.getState().resumeAll();

 vi.advanceTimersByTime(3_999);
 expect(toasts()).toHaveLength(1);
 vi.advanceTimersByTime(1);
 expect(toasts()).toHaveLength(0);
 });

 it('resumes every toast on screen, not just the newest', () => {
 toast.success('a');
 toast.success('b');
 useToastStore.getState().pauseAll();
 useToastStore.getState().resumeAll();

 vi.advanceTimersByTime(4_000);

 expect(toasts()).toHaveLength(0);
 });

 it('leaves a sticky toast sticky through a pause cycle', () => {
 toast.error('Analysis failed');
 useToastStore.getState().pauseAll();
 useToastStore.getState().resumeAll();

 vi.advanceTimersByTime(600_000);

 expect(toasts()).toHaveLength(1);
 });
});

describe('the call-site API', () => {
 it('works outside React, from a plain function', () => {
 // The whole reason the store is module-scoped: a `catch` block, a `useActionState`
 // callback and a non-component helper all need to announce a failure, and a hook-only
 // API would force each of them to become a component.
 function notAComponent(): void {
 toast.error('Upload failed');
 }
 notAComponent();

 expect(toasts()).toHaveLength(1);
 });

 it('maps each outcome to a tone in exactly one place', () => {
 toast.success('a');
 toast.error('b');
 toast.warning('c');
 toast.info('d');

 expect(toasts().map((entry) => entry.tone)).toEqual(['safe', 'critical', 'caution', 'info']);
 });

 it('passes options through', () => {
 toast.error('Upload failed', { description: 'Try a smaller file.' });

 expect(toasts()[0]?.description).toBe('Try a smaller file.');
 });

 it('dismisses and clears through the same facade', () => {
 const id = toast.info('a');
 toast.dismiss(id);
 expect(toasts()).toHaveLength(0);

 toast.info('b');
 toast.clear();
 expect(toasts()).toHaveLength(0);
 });
});

'use client';

/**
 * The toast queue.
 *
 * One of the few things that genuinely belongs in a client store, by the test set out in
 * `shared/state/create-store.ts`: it is global, it is UI-only, it outlives the component that
 * triggered it, and it has no server representation. A Server Action that fails on a settings
 * page needs to announce itself from a component that may already have unmounted, which is
 * exactly what a module-scoped store is for and exactly what a Context provider is not.
 *
 * ### The imperative API is the point
 *
 * `toast.error('Upload failed')` works from an event handler, a `useActionState` callback, a
 * `catch` block, or a plain function that is not a component at all — because Zustand exposes
 * the store outside React through `getState()`. A hook-only API (`const { push } = useToast()`)
 * would force every one of those call sites to be a component, and the interesting ones are
 * not. `Toaster` is the only thing that subscribes.
 *
 * ### Not persisted
 *
 * A toast is a report on something that just happened. Restoring "Saved successfully" from
 * `localStorage` on the next page load is a lie about the present.
 */

import { createStore } from '@/shared/state/create-store';
import { uuid } from '@/shared/utils';
import type { Tone } from '@/shared/ui/tone';

/**
 * How many are on screen at once.
 *
 * Four. Past that the stack covers the content it is reporting on, and nobody reads the
 * fifth. New toasts push the oldest out — the most recent is the one the user is most likely
 * to have caused.
 */
const MAX_VISIBLE = 4;

/**
 * Default lifetimes, in milliseconds.
 *
 * Long enough to read at ~200 words per minute plus a beat to notice it appeared. `critical`
 * is `null` — it never auto-dismisses. A failure the user did not see is a failure they will
 * report as "it just didn't work", and the cost of an extra click is far lower than the cost
 * of that ticket.
 */
const DURATION_BY_TONE = {
 neutral: 5000,
 brand: 5000,
 info: 5000,
 safe: 4000,
 caution: 7000,
 critical: null,
} as const satisfies Record<Tone, number | null>;

export interface ToastAction {
 label: string;
 onClick: () => void;
}

export interface Toast {
 id: string;
 tone: Tone;
 /** One line. The outcome, in the user's words — "Analysis failed", not "500". */
 title: string;
 /** Optional second line: what to do about it, or a detail worth having. */
 description?: string;
 /**
 * At most one action.
 *
 * A plain `{ label, onClick }` rather than a `ReactNode`, so the store holds data instead
 * of markup — which keeps it inspectable in devtools, testable without rendering, and
 * incapable of accumulating arbitrary component trees that outlive their own page.
 *
 * One, not many: a toast is a notification, not a dialog. If the user has a real choice to
 * make, that is a `Dialog`.
 */
 action?: ToastAction;
 /** `null` means it stays until dismissed. Defaults from the tone. */
 duration: number | null;
}

export type ToastInput = Omit<Toast, 'id' | 'duration' | 'tone'> & {
 tone?: Tone;
 duration?: number | null;
};

interface ToastState {
 toasts: Toast[];
 push: (input: ToastInput) => string;
 dismiss: (id: string) => void;
 clear: () => void;
 /** Suspend every auto-dismiss. Called by `Toaster` on hover and focus — see below. */
 pauseAll: () => void;
 /** Resume auto-dismiss for everything still on screen. */
 resumeAll: () => void;
}

/**
 * Timers live in a module-scoped map rather than in the store.
 *
 * A `setTimeout` handle is not state: nothing renders from it, and putting it in the store
 * would make every scheduled dismissal a state update that re-renders `Toaster` for no
 * visible reason. Keeping it beside the store means `dismiss` can cancel a pending timer,
 * which is what stops a manually-dismissed toast from "dismissing" a *later* toast that
 * happened to reuse its slot.
 */
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Whether auto-dismiss is currently suspended.
 *
 * Also module-scoped, and for the same reason — but it has a second job: it stops a toast
 * that arrives *while* the user is reading the stack from starting its own countdown behind
 * their back.
 */
let paused = false;

function cancelTimer(id: string): void {
 const timer = timers.get(id);
 if (timer === undefined) return;
 clearTimeout(timer);
 timers.delete(id);
}

export const useToastStore = createStore<ToastState>(
 (set, get) => {
 const schedule = (toast: Toast): void => {
 if (toast.duration === null || paused || timers.has(toast.id)) return;
 timers.set(
 toast.id,
 setTimeout(() => get().dismiss(toast.id), toast.duration),
 );
 };

 return {
 toasts: [],

 push: (input) => {
 const id = uuid();
 const tone: Tone = input.tone ?? 'neutral';
 const toast: Toast = {
 ...input,
 id,
 tone,
 duration: input.duration === undefined ? DURATION_BY_TONE[tone] : input.duration,
 };

 set((state) => {
 const next = [...state.toasts, toast];
 // Anything pushed out of the window gets its timer cancelled here rather than being
 // left to fire against a toast that no longer exists.
 const dropped = next.slice(0, Math.max(0, next.length - MAX_VISIBLE));
 for (const stale of dropped) cancelTimer(stale.id);
 return { toasts: next.slice(-MAX_VISIBLE) };
 });

 schedule(toast);
 return id;
 },

 dismiss: (id) => {
 cancelTimer(id);
 set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
 },

 clear: () => {
 for (const id of [...timers.keys()]) cancelTimer(id);
 set({ toasts: [] });
 },

 pauseAll: () => {
 paused = true;
 for (const id of [...timers.keys()]) cancelTimer(id);
 },

 /**
 * Restarts each countdown from the top rather than resuming a remainder.
 *
 * Resuming precisely would mean recording a start timestamp per toast and doing
 * arithmetic on every pause — real bookkeeping to make an auto-dismiss expire *sooner*,
 * which is the wrong direction to optimise. A user who just took their pointer off the
 * stack gets the full reading time again, which is the generous reading of WCAG 2.2.1
 * and costs nothing.
 */
 resumeAll: () => {
 paused = false;
 for (const toast of get().toasts) schedule(toast);
 },
 };
 },
 { name: 'toast' },
);

/**
 * The call-site API.
 *
 * ```ts
 * toast.success('Document saved');
 * toast.error('Analysis failed', { description: 'The file could not be read.' });
 * toast.error('Upload failed', { action: { label: 'Retry', onClick: retry } });
 * ```
 *
 * Named by *outcome* rather than by tone, so a call site says what happened rather than what
 * colour it wants. That is what keeps the mapping from outcome to colour in one place: change
 * `warning` to a different tone here and every warning in the product moves with it.
 */
type ToastOptions = Omit<ToastInput, 'title' | 'tone'>;

function emit(tone: Tone) {
 return (title: string, options?: ToastOptions): string =>
 useToastStore.getState().push({ ...options, title, tone });
}

export const toast = {
 /** The operation completed and the user should know. */
 success: emit('safe'),
 /** It failed. Never auto-dismisses — see `DURATION_BY_TONE`. */
 error: emit('critical'),
 /** It worked, with a caveat the user needs: a quota nearly spent, a partial result. */
 warning: emit('caution'),
 /** Neutral information. Prefer rendering it on the page if it is not time-sensitive. */
 info: emit('info'),
 /** No semantic level at all — a plain acknowledgement. */
 message: emit('neutral'),
 dismiss: (id: string) => useToastStore.getState().dismiss(id),
 clear: () => useToastStore.getState().clear(),
} as const;

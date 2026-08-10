'use client';

/**
 * Tabs.
 *
 * ### Read this before using it
 *
 * Most "tabs" in this product should not be this component. If switching tabs changes what
 * the user is looking at in a way they would expect to be able to link to, bookmark, or reach
 * with the back button, the tab belongs in the URL — as a `searchParams` value or a route
 * segment — and the switch is a `<Link>`. Client tab state cannot be shared, restored, or
 * server-rendered, and a support ticket that says "the third tab" is unanswerable when the
 * URL is the same for all four.
 *
 * This component is for the residue: a segmented view inside a panel where the sections are
 * genuinely equivalent and nobody would ever link to one. It also serves the URL-driven case
 * directly — pass `value` and `onValueChange` and drive them from `searchParams`, and the
 * markup and keyboard behaviour are reused without the state.
 *
 * ### Keyboard behaviour is the whole reason this is not four buttons
 *
 * A tablist is one tab stop, not one per tab. Tab moves *into* the active tab and then out to
 * the panel; the arrow keys move between tabs. That is the WAI-ARIA Authoring Practices
 * roving-tabindex pattern, and getting it wrong means a keyboard user Tabs through twelve
 * inactive tabs to reach the content, on every screen, forever.
 *
 * Activation is automatic — moving focus selects. The APG allows either, and automatic is
 * correct when panels are already rendered, which they are here.
 */

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';

const tabListVariants = cva('flex items-center gap-1', {
 variants: {
 variant: {
 /** A rail under the row. For panel-level and page-level navigation. */
 underline: 'border-b border-border-subtle',
 /** A segmented control on a filled track. For a compact in-card switch. */
 pill: 'w-fit rounded-control border border-border-subtle bg-surface-2 p-1',
 },
 fullWidth: {
 true: '',
 false: '',
 },
 },
 defaultVariants: { variant: 'underline', fullWidth: false },
});

const tabVariants = cva(
 [
 'relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
 'text-sm font-medium select-none',
 'transition-[color,background-color,border-color] duration-(--duration-micro) ease-brand',
 'disabled:pointer-events-none disabled:opacity-50',
 // The ring would otherwise be clipped by the list's `overflow-x-auto`.
 'focus-visible:z-10',
 ],
 {
 variants: {
 variant: {
 underline: [
 'px-3 py-2.5 -mb-px border-b-2 border-transparent',
 'text-text-secondary hover:text-text-primary',
 'aria-selected:border-brand-primary aria-selected:text-text-primary',
 ],
 pill: [
 'rounded-[calc(var(--radius-control)-0.25rem)] px-3 py-1.5',
 'text-text-secondary hover:text-text-primary',
 'aria-selected:bg-surface-1 aria-selected:text-text-primary aria-selected:shadow-card',
 ],
 },
 fullWidth: {
 true: 'flex-1',
 false: '',
 },
 },
 defaultVariants: { variant: 'underline', fullWidth: false },
 },
);

export interface TabItem {
 /** Stable across renders — it is the value of `value`/`defaultValue` and both element ids. */
 id: string;
 label: ReactNode;
 content: ReactNode;
 disabled?: boolean;
}

export interface TabsProps extends VariantProps<typeof tabListVariants> {
 items: TabItem[];
 /**
 * The accessible name of the tab *list*. Required: a screen reader announcing "tab list"
 * with no name gives no clue what the tabs are for on a page that has two of them.
 */
 label: string;
 /** Controlled. Pass with `onValueChange` — typically both derived from `searchParams`. */
 value?: string;
 /** Uncontrolled initial tab. Defaults to the first item. */
 defaultValue?: string;
 onValueChange?: (id: string) => void;
 className?: string;
}

export function Tabs({
 items,
 label,
 value,
 defaultValue,
 onValueChange,
 variant,
 fullWidth,
 className,
}: TabsProps) {
 const [uncontrolled, setUncontrolled] = useState(() => defaultValue ?? items[0]?.id ?? '');
 const activeId = value ?? uncontrolled;
 const listRef = useRef<HTMLDivElement>(null);

 const select = (id: string) => {
 if (value === undefined) setUncontrolled(id);
 onValueChange?.(id);
 };

 /**
 * Arrow-key navigation.
 *
 * The candidate list is read from the DOM rather than derived from `items`, because the
 * DOM already holds exactly the tabs that exist and is guaranteed to be in step with what
 * the user can see. A parallel ref array has to be kept in sync with every re-order,
 * filter and conditional render of `items`, and when it falls out of sync the symptom is
 * a keyboard trap rather than a visible bug.
 */
 const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
 const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
 if (!keys.includes(event.key)) return;

 const tabs = Array.from(
 listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? [],
 );
 if (tabs.length === 0) return;

 const current = tabs.findIndex((tab) => tab.dataset.tabId === activeId);
 // `dir` rather than a hardcoded direction: in RTL, ArrowRight moves to the *previous*
 // tab, because the tabs are laid out right to left and the arrow follows the screen.
 const isRtl = getComputedStyle(listRef.current ?? document.body).direction === 'rtl';
 const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';

 let next: number;
 if (event.key === 'Home') next = 0;
 else if (event.key === 'End') next = tabs.length - 1;
 // Wraps, per the APG: the list is a loop, not a line with two dead ends.
 else if (event.key === forward) next = (current + 1) % tabs.length;
 else next = (current - 1 + tabs.length) % tabs.length;

 const target = tabs[next];
 if (!target) return;

 event.preventDefault();
 target.focus();
 select(target.dataset.tabId ?? activeId);
 };

 return (
 <div className={className}>
 <div
 ref={listRef}
 role="tablist"
 aria-label={label}
 aria-orientation="horizontal"
 onKeyDown={onKeyDown}
 // Horizontal scroll rather than wrap: a tab row that wraps to two lines moves the
 // content below it every time the active tab changes width.
 className={cn(
 tabListVariants({ variant, fullWidth }),
 'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
 )}
 >
 {items.map((item) => {
 const selected = item.id === activeId;
 return (
 <button
 key={item.id}
 type="button"
 role="tab"
 id={`tab-${item.id}`}
 data-tab-id={item.id}
 aria-selected={selected}
 aria-controls={`tabpanel-${item.id}`}
 // The roving tabindex. Exactly one tab is reachable by Tab; the arrows do the rest.
 tabIndex={selected ? 0 : -1}
 disabled={item.disabled}
 onClick={() => select(item.id)}
 className={cn(tabVariants({ variant, fullWidth }))}
 >
 {item.label}
 </button>
 );
 })}
 </div>

 {items.map((item) => (
 /**
 * Every panel stays mounted; inactive ones are `hidden`.
 *
 * Unmounting would discard scroll position, an in-progress form, and any focus the
 * user had — switching to another tab and back to find a half-filled form emptied is
 * the classic version of this bug. The cost is rendering all panels up front, which
 * is the right trade for the panel-sized content this component is for. When a panel
 * is genuinely expensive, that is the signal it should be a route, not a tab.
 *
 * `tabIndex={0}` on the panel because a scrollable region must be reachable by
 * keyboard, and a panel with no focusable children inside it otherwise cannot be
 * scrolled without a mouse.
 */
 <div
 key={item.id}
 role="tabpanel"
 id={`tabpanel-${item.id}`}
 aria-labelledby={`tab-${item.id}`}
 hidden={item.id !== activeId}
 tabIndex={0}
 className="pt-4 focus-visible:outline-offset-4"
 >
 {item.content}
 </div>
 ))}
 </div>
 );
}

export { tabListVariants, tabVariants };

'use client';

/**
 * The consent banner.
 *
 * ### It is a banner, not a modal, and both buttons are the same size
 *
 * The two standard dark patterns in this control are (a) blocking the page until the user
 * chooses, and (b) rendering "Accept all" as a filled primary button and "Reject" as grey
 * text. Both raise acceptance rates and both are illegal under GDPR's "freely given" test,
 * which the EDPB has spelled out: refusing must be as easy as accepting. So this is a
 * dismissible bar at the bottom of the viewport with two visually equal buttons, and the page
 * behind it stays usable. The revenue difference is a rounding error; the compliance
 * difference is not, and a product that exists to catch other people's fine print cannot ship
 * its own.
 *
 * ### Why nothing renders on the server
 *
 * Whether to show the banner depends on `localStorage`, which the server cannot read. Any
 * server-rendered guess is wrong for half the users and produces a hydration mismatch for
 * them. `useSyncExternalStore` is the sanctioned way to say that: its server snapshot is
 * `false`, so SSR and hydration both render nothing, and the client snapshot reads the real
 * store immediately afterwards. The banner therefore arrives *after* paint, with an entrance
 * transition, so it reads as an arrival rather than as a flash of layout.
 *
 * ### Consent state is not this component's to define
 *
 * `createConsentStore` and `ConsentState` come from `core/analytics`, which is also what the
 * analytics client reads at construction. If this component owned its own boolean, there
 * would be two answers to "may we track", and the one the analytics client believes would be
 * the one that ships events.
 */

import { useCallback, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';

import type { Route } from 'next';

import { createConsentStore, denyAll, grantAll, needsConsentDecision } from '@/core/analytics';
import { ANALYTICS, CLOCK, LOCAL_STORAGE_DRIVER } from '@/core/container';
import { useService } from '@/core/container/context';
import { epochMillis } from '@/core/time';
import { cn } from '@/shared/ui/cn';

import { Button } from '../components/button';
import { Text } from '../components/text';

/**
 * A subscription that never fires — the store is read once and changed only from here.
 *
 * `useSyncExternalStore` is used for its snapshot semantics rather than its subscription: it
 * is the one API that reads a browser-only value during render without risking a hydration
 * mismatch or a tear. The decision the user makes below re-renders through React state.
 */
const subscribeNever = () => () => {};

export interface CookieConsentLabels {
 readonly title: string;
 readonly body: string;
 readonly accept: string;
 readonly reject: string;
 readonly policyLink: string;
}

export interface CookieConsentProps {
 labels: CookieConsentLabels;
 policyHref: Route;
 className?: string;
}

export function CookieConsent({ labels, policyHref, className }: CookieConsentProps) {
 const driver = useService(LOCAL_STORAGE_DRIVER);
 const clock = useService(CLOCK);
 const analytics = useService(ANALYTICS);

 const needsDecision = useSyncExternalStore(
 subscribeNever,
 useCallback(() => needsConsentDecision(createConsentStore(driver).get()), [driver]),
 () => false,
 );
 const [hasDecided, setDecided] = useState(false);

 if (!needsDecision || hasDecided) return null;

 const decide = (granted: boolean) => {
 const now = epochMillis(clock)();
 const next = granted ? grantAll(now) : denyAll(now);

 createConsentStore(driver).set(next);
 /**
 * The analytics client is told directly rather than being left to re-read storage on the
 * next page load. Without this, a user who accepts has to navigate before anything is
 * recorded — and the single most valuable event to record is the one that happens on the
 * page where they accepted.
 */
 analytics.setConsent(next);
 setDecided(true);
 };

 return (
 <div
 /**
 * `role="region"` with a label, not `role="dialog"`. A dialog implies a focus trap and
 * a modal barrier, neither of which is present — announcing one to a screen-reader user
 * and then letting focus wander into the page behind is worse than not announcing it.
 */
 role="region"
 aria-label={labels.title}
 className={cn(
 'fixed inset-x-0 bottom-0 z-50 p-4 sm:p-5',
 // `pb-[env(safe-area-inset-bottom)]` keeps the buttons clear of the iOS home
 // indicator, which otherwise overlaps the bottom 34px of a full-bleed bar.
 'pb-[max(1rem,env(safe-area-inset-bottom))]',
 // `starting:` → `@starting-style`. See the note in `sticky-cta.tsx`; the entrance is
 // pure CSS, and `globals.css` already collapses it for `prefers-reduced-motion`.
 'transition-[opacity,translate] duration-(--duration-entrance) ease-brand',
 'starting:translate-y-4 starting:opacity-0',
 className,
 )}
 >
 <div
 className={cn(
 'mx-auto flex max-w-shell flex-col gap-4 rounded-panel border border-border-subtle',
 'bg-surface-overlay p-5 shadow-card sm:flex-row sm:items-center sm:gap-6',
 )}
 >
 <div className="min-w-0 flex-1">
 <Text as="p" size="sm" tone="primary" weight="medium">
 {labels.title}
 </Text>
 <Text as="p" size="xs" tone="secondary" className="mt-1">
 {labels.body}{' '}
 <Link href={policyHref} className="text-text-primary underline underline-offset-4">
 {labels.policyLink}
 </Link>
 </Text>
 </div>

 {/*
 Equal weight, reject first in the DOM.
 Both are `secondary`, so neither is visually privileged, and the reject button comes
 first in source order — which is the order a keyboard and a screen reader encounter
 them. On a phone they stack, and the one under the thumb is still the one the user
 chose rather than the one we wanted them to choose.
 */}
 <div className="flex shrink-0 gap-2">
 <Button
 variant="secondary"
 size="sm"
 onClick={() => {
 decide(false);
 }}
 >
 {labels.reject}
 </Button>
 <Button
 variant="secondary"
 size="sm"
 onClick={() => {
 decide(true);
 }}
 >
 {labels.accept}
 </Button>
 </div>
 </div>
 </div>
 );
}

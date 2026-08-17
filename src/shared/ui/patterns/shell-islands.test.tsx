import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Route } from 'next';

import { createAnalytics, createMemoryAnalyticsProvider, type Analytics } from '@/core/analytics';
import {
  ANALYTICS,
  CLOCK,
  Container,
  LOCAL_STORAGE_DRIVER,
  SESSION_STORAGE_DRIVER,
} from '@/core/container';
import { ContainerProvider } from '@/core/container/context';
import { createMemoryStorageDriver, type StorageDriver } from '@/core/storage';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { createRecordingLogger } from '@/test/fakes';

import { CookieConsent } from './cookie-consent';
import { StickyCta } from './sticky-cta';

/**
 * The two client islands the public shell ships, tested for the promises they make to a user.
 *
 * Both are components where the tempting change and the wrong change are the same change. A
 * consent banner converts better as a modal with a grey "reject" link; a sticky CTA converts
 * better if it comes back after being closed. Both of those are one line away at all times, and
 * neither breaks a type check, a build, or a visual review. So the constraints are asserted
 * here, next to the code, where an edit that removes one has to also delete the test that says
 * why it existed.
 */

const FIXED_NOW = new Date('2026-04-01T09:30:00.000Z');

const LABELS = {
  title: 'Cookies',
  body: 'We use a small number of cookies.',
  accept: 'Accept',
  reject: 'Reject',
  policyLink: 'Cookie policy',
};

function renderInContainer(
  ui: React.ReactElement,
  drivers: { local?: StorageDriver; session?: StorageDriver } = {},
) {
  const local = drivers.local ?? createMemoryStorageDriver();
  const session = drivers.session ?? createMemoryStorageDriver();

  const analytics: Analytics = createAnalytics({
    providers: [createMemoryAnalyticsProvider()],
    logger: createRecordingLogger(),
    now: () => FIXED_NOW.getTime(),
  });

  const container = new Container('test');
  container.registerValue(CLOCK, () => FIXED_NOW);
  container.registerValue(LOCAL_STORAGE_DRIVER, local);
  container.registerValue(SESSION_STORAGE_DRIVER, session);
  container.registerValue(ANALYTICS, analytics);

  const result = render(<ContainerProvider container={container}>{ui}</ContainerProvider>);

  return { ...result, local, session, analytics };
}

describe('CookieConsent', () => {
  function banner() {
    return <CookieConsent labels={LABELS} policyHref={'/cookies' as Route} />;
  }

  it('offers refusing and accepting at equal visual weight', () => {
    renderInContainer(banner());

    const region = screen.getByRole('region', { name: LABELS.title });
    const buttons = within(region).getAllByRole('button');

    // GDPR's "freely given" test, as the EDPB has spelled it out: refusing must be as easy as
    // accepting. Reject comes first in the DOM — the order a keyboard and a screen reader meet
    // them — and the two carry identical styling, so neither is visually privileged.
    expect(buttons.map((button) => button.textContent)).toEqual([LABELS.reject, LABELS.accept]);
    expect(buttons[0]?.className).toBe(buttons[1]?.className);
  });

  it('is a labelled region and not a dialog', () => {
    renderInContainer(banner());

    // `role="dialog"` promises a focus trap and a modal barrier, neither of which is here.
    // Announcing one and then letting focus wander into the page behind is worse than not
    // announcing it — and the page stays usable, which is the point.
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region', { name: LABELS.title })).toBeInTheDocument();
  });

  it('records a refusal and stops asking', () => {
    const { local, analytics } = renderInContainer(banner());

    fireEvent.click(screen.getByRole('button', { name: LABELS.reject }));

    expect(analytics.getConsent().analytics).toBe('denied');
    expect(screen.queryByRole('region', { name: LABELS.title })).toBeNull();
    // Persisted, so the banner does not return on the next page.
    expect(local.getItem(STORAGE_KEYS.consent)).not.toBeNull();
  });

  it('tells the analytics client immediately rather than waiting for the next page load', () => {
    const { analytics } = renderInContainer(banner());

    fireEvent.click(screen.getByRole('button', { name: LABELS.accept }));

    // The single most valuable event to record is the one on the page where they accepted.
    // Leaving the client to re-read storage on the next navigation loses exactly that one.
    expect(analytics.getConsent().analytics).toBe('granted');
    expect(screen.queryByRole('region', { name: LABELS.title })).toBeNull();
  });

  it('does not ask a visitor who has already answered', () => {
    const local = createMemoryStorageDriver();
    const { analytics } = renderInContainer(banner(), { local });

    fireEvent.click(screen.getByRole('button', { name: LABELS.reject }));
    expect(analytics.getConsent().analytics).toBe('denied');

    // A second mount with the same storage — the next page in the session.
    renderInContainer(banner(), { local });

    expect(screen.queryByRole('region', { name: LABELS.title })).toBeNull();
  });

  it('links the policy rather than only summarising it', () => {
    renderInContainer(banner());

    expect(screen.getByRole('link', { name: LABELS.policyLink })).toHaveAttribute(
      'href',
      '/cookies',
    );
  });
});

describe('StickyCta', () => {
  const PROPS = {
    message: 'Read the fine print before you sign it.',
    ctaLabel: 'Analyze a document',
    ctaHref: '/scan' as Route,
    dismissLabel: 'Dismiss',
    campaignId: 'launch',
  };

  function scrollTo(y: number) {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
    fireEvent.scroll(window);
  }

  beforeEach(() => {
    // A 2,000px page in a 1,000px viewport: 1,000px of scrollable distance, so the 60%
    // threshold sits at 600.
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    window.innerHeight = 1000;
    scrollTo(0);
  });

  afterEach(() => {
    scrollTo(0);
  });

  it('stays away until the reader has earned it', () => {
    renderInContainer(<StickyCta {...PROPS} />);

    // A bar that appears after four seconds is an interruption; one that appears after four
    // screens is a convenience.
    expect(screen.queryByRole('region', { name: PROPS.message })).toBeNull();

    scrollTo(700);

    expect(screen.getByRole('region', { name: PROPS.message })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: PROPS.ctaLabel })).toHaveAttribute('href', '/scan');
  });

  it('never appears on a page with nothing to scroll', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 800,
      configurable: true,
    });
    renderInContainer(<StickyCta {...PROPS} />);

    // Dividing by a zero scrollable height would make every short page instantly "fully read",
    // which is the opposite of the intent.
    scrollTo(0);
    expect(screen.queryByRole('region', { name: PROPS.message })).toBeNull();
  });

  it('stays dismissed for the rest of the session', () => {
    const session = createMemoryStorageDriver();
    renderInContainer(<StickyCta {...PROPS} />, { session });

    scrollTo(700);
    fireEvent.click(screen.getByRole('button', { name: PROPS.dismissLabel }));

    expect(screen.queryByRole('region', { name: PROPS.message })).toBeNull();

    // Scrolling again must not resurrect it — a component with no memory does, and that is the
    // behaviour that makes people install blockers.
    scrollTo(900);
    expect(screen.queryByRole('region', { name: PROPS.message })).toBeNull();

    // And not on the next page of the same visit either.
    renderInContainer(<StickyCta {...PROPS} />, { session });
    scrollTo(700);
    expect(screen.queryByRole('region', { name: PROPS.message })).toBeNull();
  });

  it('scopes the dismissal to its campaign', () => {
    const session = createMemoryStorageDriver();
    renderInContainer(<StickyCta {...PROPS} />, { session });

    scrollTo(700);
    fireEvent.click(screen.getByRole('button', { name: PROPS.dismissLabel }));

    // Replacing the message should not inherit the old campaign's dismissals — otherwise a new
    // offer is silently invisible to everyone who closed the last one.
    renderInContainer(<StickyCta {...PROPS} campaignId="spring" />, { session });
    scrollTo(700);

    expect(screen.getByRole('region', { name: PROPS.message })).toBeInTheDocument();
  });

  it('gives the close control a real label and a real target', () => {
    renderInContainer(<StickyCta {...PROPS} />);
    scrollTo(700);

    const close = screen.getByRole('button', { name: PROPS.dismissLabel });

    // `size-11` is 44px — the WCAG 2.2 target minimum, and not a 12px grey ×.
    expect(close.className).toContain('size-11');
  });
});

import { TRANSLATOR } from '@/core/container';
import { isOk } from '@/core/result/result';
import { resolveTenant } from '@/config/tenant';
import { serverEnv } from '@/config/env.server';
import {
  LIST_DOCUMENT_GUIDES,
  siteFooterGroups,
  siteLegalLinks,
  siteNavItems,
} from '@/features/marketing';
import { getRequestScope, getPublicSession } from '@/server/bootstrap';
import { ROUTES } from '@/shared/constants';
import { CookieConsent, SiteFooter, SiteHeader } from '@/shared/ui';
import { StickyCta } from '@/shared/ui/patterns/sticky-cta';
import ScrollProvider from '../scroll-provider';

/**
 * The public shell — every page a signed-out visitor can reach.
 *
 * A route group, so `(marketing)` adds chrome without adding a URL segment: `/pricing` stays
 * `/pricing`. The `(app)` group next door has its own header for the same reason — a product
 * that shares one layout between its dashboard and its pricing page ends up shipping a
 * "Sign out" button to a stranger.
 *
 * ### What this file is allowed to contain
 *
 * Composition, and nothing else. The nav items, the footer columns and the promoted guides are
 * built by `features/marketing`, because *what the public site links to* is a product decision
 * and `src/app` is routing. This file resolves three things from the container, hands them to
 * three presentational patterns, and stops.
 *
 * ### Why it stays static
 *
 * Nothing here reads `cookies()`, `headers()` or `searchParams`. The guide list comes from the
 * content port, which is a typed array today and an HTTP fetch later — either way it is
 * request-independent, so `cacheComponents` prerenders this whole shell and every marketing
 * page ships from the edge. The one client island in the tree is the cookie banner, and it
 * decides what to show from `localStorage` after hydration rather than from a cookie read on
 * the server, precisely so it does not opt the site out of that.
 *
 * ### Why a failed guide list is not a failed page
 *
 * `listGuides` returns a `Result`, and an error degrades the footer's guide column to empty.
 * That column is a cross-linking device for crawlers; the terms of service are not. Throwing
 * here would take down every public page — including the legal ones a user may be reading
 * because something already went wrong — over an SEO nicety.
 */

const tenant = resolveTenant(serverEnv.TENANT_ID);

/**
 * The copyright year, evaluated once when this module is first imported.
 *
 * ### Why not the `CLOCK` token, which the lint rule below is asking for
 *
 * Because this is not a time-dependent decision, and resolving the clock would make it one.
 * `CLOCK` exists so that logic which *branches* on the current time — a trial that expires, a
 * deadline that has passed — can be frozen in a test. A copyright line branches on nothing.
 *
 * The framework makes the distinction load-bearing rather than stylistic. Under
 * `cacheComponents`, reading a clock during render is a non-deterministic operation: it
 * requires `connection()` and a Suspense boundary, or a `use cache` scope. Either one would
 * punch a dynamic hole through the footer of every public page — and therefore out of the
 * static shell that makes them fast — to print four digits. Module evaluation is in the
 * category the framework calls deterministic, so it completes during prerendering and lands in
 * the shell.
 *
 * The cost is that a deployment running across New Year's Eve shows the previous year until it
 * is redeployed. For a copyright notice that is the correct trade, and it is the same trade
 * every static site makes.
 */

const COPYRIGHT_YEAR = new Date().getFullYear();

export default async function MarketingLayout({ children }: LayoutProps<'/'>) {
  const scope = getRequestScope();
  const t = scope.resolve(TRANSLATOR);
  const listGuides = scope.resolve(LIST_DOCUMENT_GUIDES);

  const listed = await listGuides();
  const guides = isOk(listed) ? listed.value : [];
  const session = await getPublicSession();

  return (
    <ScrollProvider>
      <div className="flex min-h-full flex-1 flex-col">
        <SiteHeader
          productName={tenant.productName}
          items={siteNavItems(t)}
          signInHref={ROUTES.login}
          ctaHref={ROUTES.scan}
          dashboardHref={ROUTES.welcome}
          isAuthenticated={!!session}
          labels={{
            menu: t.t('nav.menu'),
            closeMenu: t.t('nav.closeMenu'),
            signIn: t.t('common.signIn'),
            cta: t.t('cta.analyze'),
            ctaNote: t.t('cta.reassurance'),
            theme: t.t('theme.label'),
            themeOptions: {
              light: t.t('theme.light'),
              dark: t.t('theme.dark'),
              system: t.t('theme.system'),
            },
          }}
        />

        {/*
 `id="main"` is the target of the skip link `SiteHeader` renders. The header cannot own
 the landmark it skips *to*, so the contract is: the header provides the link, every
 layout that uses it provides `#main`.
 */}
        <main id="main" className="flex-1">
          {children}
        </main>

        <SiteFooter
          productName={tenant.productName}
          tagline={tenant.tagline}
          groups={siteFooterGroups({ t, guides, guideCount: guides.length })}
          legal={siteLegalLinks(t)}
          year={COPYRIGHT_YEAR}
          ctaHref={ROUTES.scan}
          ctaLabel={t.t('cta.analyze')}
        />

        <StickyCta
          campaignId="marketing-global-conversion"
          threshold={0.2}
          message="Unlock hidden risks and deadlines right now. First scan is free."
          ctaLabel="Analyze Your Document"
          ctaHref={ROUTES.scan}
          dismissLabel={t.t('common.close')}
        />

        <CookieConsent
          policyHref={ROUTES.cookies}
          labels={{
            title: t.t('consent.title'),
            body: t.t('consent.body'),
            accept: t.t('consent.acceptAll'),
            reject: t.t('consent.rejectAll'),
            policyLink: t.t('footer.cookies'),
          }}
        />
      </div>
    </ScrollProvider>
  );
}

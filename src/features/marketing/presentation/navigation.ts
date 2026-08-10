/**
 * The public site's information architecture, as data.
 *
 * ### Why this is in the feature and not in the layout
 *
 * Because it is a product decision, not a routing one. What appears in the primary nav, which
 * five guides the footer promotes, whether the legal row sits under the columns — these are
 * decisions about the marketing site, and `src/app` is supposed to contain routing and nothing
 * else. Building them here also means they can be unit-tested without rendering a layout.
 *
 * ### Why the footer's guide column is computed from the corpus
 *
 * Twenty-five guide pages are worth very little to search engines if nothing links to them.
 * The footer is the one surface on every page that can link into the corpus, and a
 * hand-maintained list of five slugs is a list that will still name a guide six months after
 * it was renamed. Passing the real summaries in means the column is always valid and always
 * reflects the editorial order of `guides.data.ts`.
 *
 * ### Why labels come from the translator
 *
 * The nav is chrome. "Pricing" is a UI string in the same sense that "Sign out" is, and the
 * dictionary is where UI strings live — one file to hand a translator, one file to grep when a
 * label is wrong. Page *prose* is the opposite: it is content, it is destined for a CMS, and
 * it lives behind the `ContentRepository` port.
 */

import type { Route } from 'next';

import type { Translator } from '@/core/i18n';
import { ROUTES } from '@/shared/constants/routes';
import type { FooterGroup, FooterLink, SiteNavItem } from '@/shared/ui';

import type { GuideSummary } from '../domain/guide';

/**
 * How many guides the footer promotes.
 *
 * Five, because the column has to stay the same visual height as the three beside it, and
 * because a footer that lists twenty-five links is a footer that has stopped being navigation.
 * The rest are one click away behind "All guides", which is the link that actually carries the
 * crawl.
 */
const FOOTER_GUIDE_COUNT = 5;

/**
 * The primary nav.
 *
 * Four items, in the order of the questions a first-time visitor asks: what does it do, what
 * does it do *for my document*, what does it cost, and can I trust it. Ordering by that
 * sequence rather than by importance to us is why "Pricing" is third and not first.
 */
export function siteNavItems(t: Translator): readonly SiteNavItem[] {
 return [
 { href: ROUTES.howItWorks, label: t.t('nav.howItWorks') },
 { href: ROUTES.useCases, label: t.t('nav.useCases') },
 { href: ROUTES.pricing, label: t.t('nav.pricing') },
 { href: ROUTES.security, label: t.t('nav.security') },
 ];
}

export interface SiteFooterContentDeps {
 readonly t: Translator;
 /** The full corpus. The footer takes the first few; it does not choose them. */
 readonly guides: readonly GuideSummary[];
 /** How many guides in total, for the "all guides" label. Usually `guides.length`. */
 readonly guideCount: number;
}

export function siteFooterGroups({
 t,
 guides,
 guideCount,
}: SiteFooterContentDeps): readonly FooterGroup[] {
 const guideLinks: readonly FooterLink[] = [
 ...guides.slice(0, FOOTER_GUIDE_COUNT).map((guide) => ({
 /**
 * The cast is the one `typedRoutes` cannot check and does not need to.
 *
 * `Route` is a union of literal patterns, so it verifies strings the compiler can see.
 * A slug read from the corpus is not one of those. What guarantees this URL resolves is
 * `generateStaticParams` on `/for/[slug]`, which is fed by the same corpus — the guide
 * and its route come from one list, so a link here cannot outlive its page.
 */
 href: ROUTES.guide(guide.slug) as Route,
 label: guide.heading,
 })),
 { href: ROUTES.useCases, label: t.t('footer.allGuides', { count: guideCount }) },
 ];

 return [
 {
 title: t.t('footer.product'),
 links: [
 { href: ROUTES.howItWorks, label: t.t('nav.howItWorks') },
 { href: ROUTES.pricing, label: t.t('nav.pricing') },
 { href: ROUTES.security, label: t.t('nav.security') },
 ],
 },
 {
 title: t.t('footer.getStarted'),
 links: [
 { href: ROUTES.scan, label: t.t('cta.analyze') },
 { href: ROUTES.login, label: t.t('common.signIn') },
 { href: ROUTES.useCases, label: t.t('nav.useCases') },
 ],
 },
 {
 title: t.t('footer.legal'),
 links: [
 { href: ROUTES.terms, label: t.t('footer.terms') },
 { href: ROUTES.privacy, label: t.t('footer.privacy') },
 { href: ROUTES.cookies, label: t.t('footer.cookies') },
 ],
 },
 ];
}

/**
 * The legal row under the columns.
 *
 * The same three links appear in the "Legal" column above. That is not a mistake: the column
 * serves someone scanning the footer as navigation, the row serves someone who scrolled to the
 * bottom specifically looking for the terms, and those are different people arriving in
 * different ways. Duplicating three links is cheaper than being wrong for one of them.
 */
export function siteLegalLinks(t: Translator): readonly FooterLink[] {
 return [
 { href: ROUTES.terms, label: t.t('footer.terms') },
 { href: ROUTES.privacy, label: t.t('footer.privacy') },
 { href: ROUTES.cookies, label: t.t('footer.cookies') },
 ];
}

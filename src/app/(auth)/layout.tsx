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
import { getRequestScope } from '@/server/bootstrap';
import { ROUTES } from '@/shared/constants';
import { CookieConsent, SiteFooter, SiteHeader } from '@/shared/ui';

const tenant = resolveTenant(serverEnv.TENANT_ID);

// eslint-disable-next-line no-restricted-syntax -- see marketing layout for why
const COPYRIGHT_YEAR = new Date().getFullYear();

export default async function AuthLayout({ children }: LayoutProps<'/'>) {
 const scope = getRequestScope();
 const t = scope.resolve(TRANSLATOR);
 const listGuides = scope.resolve(LIST_DOCUMENT_GUIDES);

 const listed = await listGuides();
 const guides = isOk(listed) ? listed.value : [];

 return (
 <div className="flex min-h-full flex-1 flex-col">
 <SiteHeader
 productName={tenant.productName}
 items={siteNavItems(t)}
 signInHref={ROUTES.login}
 ctaHref={ROUTES.scan}
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

 <main id="main" className="flex-1">
 {children}
 </main>

 <SiteFooter
 productName={tenant.productName}
 tagline={tenant.tagline}
 groups={siteFooterGroups({ t, guides, guideCount: guides.length })}
 legal={siteLegalLinks(t)}
 year={COPYRIGHT_YEAR}
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
 );
}

/**
 * Patterns — compositions that know what PaperLens is.
 *
 * The line between this folder and `../components`: a component could ship in any product
 * ("a badge with a tone"), a pattern could not ("a badge for one of three risk levels, always
 * with an icon and a label"). Both are reusable; only one carries a product decision.
 *
 * That line matters because it decides what is safe to change. Editing `Badge` affects
 * everything; editing `RiskBadge` affects the risk vocabulary and nothing else. Collapsing the
 * two folders would mean every visual tweak to a card is also a decision about how risk is
 * communicated.
 *
 * Patterns may compose components. Components may never import a pattern — that direction
 * would put product knowledge underneath the generic layer, and the next product built on
 * this system would inherit contract clauses.
 */

export { CookieConsent } from './cookie-consent';
export type { CookieConsentLabels, CookieConsentProps } from './cookie-consent';

export { DeadlineCountdown } from './deadline-countdown';
export type { DeadlineCountdownProps } from './deadline-countdown';

export { DocumentExcerpt, documentExcerptVariants } from './document-excerpt';
export type { DocumentExcerptProps } from './document-excerpt';

export { EmptyState } from './empty-state';
export type { EmptyStateProps } from './empty-state';

export { ErrorState } from './error-state';
export type { ErrorStateProps } from './error-state';

export { LoadingState } from './loading-state';
export type { LoadingStateProps } from './loading-state';

export { PageHeader } from './page-header';
export type { PageHeaderProps } from './page-header';

export { compareRisk, RISK_LABEL, RISK_ORDER, RiskBadge, RiskDot } from './risk-badge';
export type { RiskBadgeProps, RiskDotProps } from './risk-badge';

export { SiteFooter } from './site-footer';
export type { FooterGroup, FooterLink, SiteFooterProps } from './site-footer';

export { SiteHeader } from './site-header';
export type { SiteHeaderLabels, SiteHeaderProps, SiteNavItem } from './site-header';

export { StatTile } from './stat-tile';
export type { DeltaDirection, DeltaIntent, StatDelta, StatTileProps } from './stat-tile';

export { StatusBlock } from './status-block';
export type { StatusBlockProps } from './status-block';

export { StickyCta } from './sticky-cta';
export type { StickyCtaProps } from './sticky-cta';

export { AppSidebar } from './app-sidebar';
export type { AppSidebarProps } from './app-sidebar';

export { AppTopBar } from './app-top-bar';
export type { AppTopBarProps } from './app-top-bar';

export { AppBreadcrumbs } from './app-breadcrumbs';

export { ProfileDropdown } from './profile-dropdown';
export type { ProfileDropdownProps } from './profile-dropdown';

export { DataTable } from './data-table';
export type { DataTableProps, Column } from './data-table';

export { AnalyticsSkeleton } from './analytics-skeleton';
export { VaultSkeleton } from './vault-skeleton';
export { BillingSkeleton } from './billing-skeleton';
export { ProfileSkeleton } from './profile-skeleton';
export { ScanSkeleton } from './scan-skeleton';
export { SettingsSkeleton } from './settings-skeleton';

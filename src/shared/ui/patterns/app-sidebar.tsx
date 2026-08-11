'use client';

/**
 * AppSidebar — the primary navigation for the authenticated dashboard.
 *
 * ### Architecture
 *
 * This is a Client Component because it reads `usePathname` for active-state highlighting
 * and subscribes to the sidebar Zustand store for collapse/expand. The layout that mounts
 * it is a Server Component — the sidebar is one leaf in the static shell, not a boundary
 * that forces the entire tree client-side.
 *
 * ### Collapse behaviour
 *
 * - **Expanded (260px)**: Icon + label + optional badge.
 * - **Collapsed (72px)**: Icon only, with a tooltip showing the label on hover.
 * - **Mobile (<768px)**: Hidden entirely; replaced by the `MobileSidebar` drawer triggered
 *   from the top bar's hamburger.
 *
 * The transition is 240ms `ease-brand`, matching the design system's standard motion.
 *
 * ### Role gating
 *
 * The `admin` section is rendered only when `session.role === 'admin'`. This is cosmetic —
 * it removes the nav items from the DOM. The actual security check happens in each admin
 * page's Server Component via the DAL.
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';
import { Badge, Text, Tooltip, Drawer } from '@/shared/ui';
import type { UserRole } from '@/core/auth/types';
import type { PlanTier } from '@/shared/constants/limits';
import { PLANS, planOf } from '@/shared/constants/limits';
import { ROUTES } from '@/shared/constants/routes';
import { useSidebarStore } from '@/shared/state/sidebar-store';
import {
  LayoutDashboardIcon,
  ScanIcon,
  VaultIcon,
  BarChartIcon,
  UserIcon,
  CreditCardIcon,
  SettingsIcon,
  UsersIcon,
  ClipboardListIcon,
  SlidersIcon,
  LogOutIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from '@/shared/ui/icons/dashboard-icons';

/* ── Types ─────────────────────────────────────────────────────────────────────────── */

interface NavItem {
  label: string;
  href: string;
  icon: (props: { className?: string }) => ReactNode;
  /** If set, the item only renders when the session role matches one of these. */
  roles?: UserRole[];
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  /** If set, the entire section only renders when the session role matches one of these. */
  roles?: UserRole[];
}

/* ── Navigation config ─────────────────────────────────────────────────────────────── */

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: ROUTES.welcome, icon: LayoutDashboardIcon },
      { label: 'Scan Document', href: ROUTES.scan, icon: ScanIcon },
      { label: 'Document Vault', href: ROUTES.vault, icon: VaultIcon },
      { label: 'Analytics', href: ROUTES.usage, icon: BarChartIcon },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', href: ROUTES.profile, icon: UserIcon },
      { label: 'Billing', href: ROUTES.billing, icon: CreditCardIcon },
      { label: 'Settings', href: ROUTES.settings, icon: SettingsIcon },
    ],
  },
  {
    title: 'Admin',
    roles: ['admin'],
    items: [
      { label: 'User Management', href: ROUTES.adminUsers, icon: UsersIcon },
      { label: 'System Logs', href: ROUTES.adminLogs, icon: ClipboardListIcon },
      { label: 'Configuration', href: ROUTES.adminConfig, icon: SlidersIcon },
    ],
  },
];

/* ── Sub-components ────────────────────────────────────────────────────────────────── */

function SidebarNavItem({
  item,
  isActive,
  isCollapsed,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        'group/item flex items-center my-1 relative overflow-hidden',
        'transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
        isCollapsed
          ? 'w-12 h-12 justify-center p-0 rounded-2xl mx-auto gap-0'
          : 'w-full rounded-2xl px-4 py-3 gap-3',
        isActive
          ? 'bg-brand-primary/10 text-brand-primary shadow-sm shadow-brand-primary/5'
          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary hover:-translate-y-0.5',
        isCollapsed && 'hover:-translate-y-0 hover:scale-105',
        isActive && isCollapsed && 'bg-brand-primary/10 shadow-none'
      )}
    >
      <item.icon
        className={cn(
          'shrink-0 transition-transform duration-300 ease-brand relative z-10',
          isCollapsed ? 'size-[22px]' : 'size-5',
          isActive ? 'text-brand-primary' : 'text-text-tertiary group-hover/item:text-text-secondary',
          !isCollapsed && 'group-hover/item:scale-110',
        )}
      />
      <div
        className={cn(
          "flex items-center overflow-hidden transition-all duration-300",
          isCollapsed ? "opacity-0 w-0" : "flex-1 opacity-100 w-auto"
        )}
      >
        <span className={cn(
          "truncate relative z-10", 
          isActive ? "font-bold tracking-tight" : "font-semibold text-[14px]"
        )}>
          {item.label}
        </span>
        {item.badge && (
          <Badge tone="brand" className="text-2xs shadow-sm relative z-10 ml-auto mr-1">{item.badge}</Badge>
        )}
      </div>
    </Link>
  );

  if (isCollapsed) {
    return (
      <li className="relative flex items-center justify-center w-full" title={item.label}>
        {linkContent}
      </li>
    );
  }

  return <li className="relative w-full">{linkContent}</li>;
}

function PlanBadge({
  plan,
  isCollapsed,
}: {
  plan: PlanTier;
  isCollapsed: boolean;
}) {
  const planDef = planOf(plan);

  if (isCollapsed) return null;

  return (
    <div className="rounded-2xl border border-brand-primary/15 bg-gradient-to-br from-surface-1 to-brand-primary/5 p-4 shadow-lg shadow-brand-primary/5 relative overflow-hidden shrink-0">
      <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/10 rounded-full blur-2xl -mr-8 -mt-8" />
      <Text size="xs" tone="secondary" className="font-semibold uppercase tracking-wider text-brand-primary">
        {planDef.displayName} Plan
      </Text>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary shadow-[0_0_10px_rgba(var(--brand-primary),0.8)] transition-all duration-500 ease-brand"
          style={{ width: '70%' }}
        />
      </div>
      <Text size="xs" tone="tertiary" className="mt-2 font-medium">
        <span className="text-text-primary">42</span> / {planDef.quotas.scansPerMonth} scans used
      </Text>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────────────── */

export interface AppSidebarProps {
  /** The authenticated user's role. Drives which sections render. */
  role: UserRole;
  /** The authenticated user's plan tier. Drives the plan badge. */
  plan: PlanTier;
  /** The product name from tenant config. */
  productName: string;
  /** Server action for sign-out. Passed as a form action. */
  signOutAction: (formData: FormData) => void;
}

export function AppSidebar({ role, plan, productName, signOutAction }: AppSidebarProps) {
  const pathname = usePathname();
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  /**
   * Active state: a nav item is active when the pathname matches exactly or starts with
   * the item's href followed by a `/`. The prefix match handles nested pages like
   * `/vault/folder/abc` highlighting the "Document Vault" item.
   */
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  /** Filter sections and items by role. */
  const visibleSections = NAV_SECTIONS.filter(
    (section) => !section.roles || section.roles.includes(role),
  ).map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.roles || item.roles.includes(role),
    ),
  }));

  const isMobileOpen = useSidebarStore((s) => s.isMobileOpen);
  const closeMobile = useSidebarStore((s) => s.closeMobile);

  const renderNav = (isCollapsedMode: boolean, isMobile: boolean = false) => (
    <nav
      className={cn(
        "flex-1 overflow-x-hidden w-full",
        !isMobile && "overflow-y-auto min-h-0"
      )}
      aria-label="Dashboard navigation"
    >
      <div className={cn(
        "px-3 py-4 flex flex-col w-full", 
        isCollapsedMode ? "items-center" : "items-stretch"
      )}>
        {visibleSections.map((section) => (
          <div key={section.title} className="mb-6 last:mb-0 w-full flex flex-col items-center">
            {!isCollapsedMode && (
              <Text
                size="xs"
                tone="tertiary"
                className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest self-start"
              >
                {section.title}
              </Text>
            )}
            <ul className={cn("flex flex-col gap-1.5 w-full", isCollapsedMode && "items-center")}>
              {section.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  isActive={isActive(item.href)}
                  isCollapsed={isCollapsedMode}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );

  const renderFooter = (isCollapsedMode: boolean) => (
    <div className={cn("shrink-0 flex flex-col gap-4 w-full", isCollapsedMode && "items-center")}>
      <PlanBadge plan={plan} isCollapsed={isCollapsedMode} />

      <form action={signOutAction} className="w-full flex justify-center">
        {isCollapsedMode ? (
          <Tooltip content="Secure Logout" placement="end">
            <button
              type="submit"
              className={cn(
                'flex w-12 h-12 items-center justify-center rounded-2xl',
                'text-text-secondary transition-all duration-300 ease-brand',
                'hover:bg-surface-2 hover:text-text-primary hover:-translate-y-0.5',
              )}
            >
              <LogOutIcon className="size-[22px]" />
            </button>
          </Tooltip>
        ) : (
          <button
            type="submit"
            className={cn(
              'group flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3',
              'text-sm font-bold text-text-secondary bg-surface-2/50',
              'transition-all duration-300 ease-brand',
              'hover:bg-surface-2 hover:text-text-primary hover:-translate-y-0.5 hover:shadow-sm',
            )}
          >
            <LogOutIcon className="size-4 transition-transform group-hover:-translate-x-1" />
            <span>Secure Logout</span>
          </button>
        )}
      </form>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'hidden md:flex flex-col sticky top-0 h-screen z-20 shrink-0',
          'border-e border-brand-primary/10 bg-surface-1/95 backdrop-blur-xl shadow-2xl shadow-brand-primary/5',
          'transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          isCollapsed ? 'w-[80px]' : 'w-[280px]',
        )}
      >
        {/* ── Header: logo + collapse toggle ──────────────────────────────────────── */}
        <div
          className={cn(
            'flex flex-col shrink-0 border-b border-border-subtle pb-4 pt-5 overflow-hidden',
            isCollapsed ? 'px-0 items-center justify-center' : 'px-5',
          )}
        >
          <div className={cn(
            "flex w-full transition-all duration-300",
            isCollapsed ? "flex-col items-center gap-4" : "flex-row items-center justify-between"
          )}>
            <Link
              href={ROUTES.welcome}
              className={cn(
                "flex items-center transition-transform duration-300 hover:scale-[1.02]",
                isCollapsed ? "w-full justify-center gap-0" : "gap-3"
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-lg shadow-brand-primary/20">
                <ScanIcon className="size-5 text-white" />
              </div>
              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                isCollapsed ? "opacity-0 w-0 min-w-0" : "opacity-100 w-auto"
              )}>
                <span className="text-xl font-bold tracking-tight text-text-primary whitespace-nowrap">
                  {productName}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={toggle}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-xl p-2.5 mx-auto',
                'text-text-tertiary transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                'hover:bg-surface-2 hover:text-text-primary hover:scale-105',
                isCollapsed ? 'bg-surface-2/50 text-text-primary' : ''
              )}
            >
              {isCollapsed ? (
                <PanelLeftOpenIcon className="size-5" />
              ) : (
                <PanelLeftCloseIcon className="size-5" />
              )}
            </button>
          </div>

          {/* Portal Badge (Visible only when expanded) */}
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            isCollapsed ? "opacity-0 h-0 mt-0" : "opacity-100 h-auto mt-6"
          )}>
            <div className="flex items-center justify-center gap-2 rounded-lg bg-safe-bg/30 px-3 py-2 text-safe">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-safe"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                Workspace Active
              </span>
            </div>
          </div>
        </div>

        {renderNav(isCollapsed, false)}
        <div className="border-t border-border-subtle p-5 shrink-0">
          {renderFooter(isCollapsed)}
        </div>
      </aside>

      <Drawer
        open={isMobileOpen}
        onClose={closeMobile}
        title={productName}
        side="start"
        footer={renderFooter(false)}
        className="w-[280px]"
      >
        <div className="flex flex-col bg-surface-1 -mx-5 -my-5 pb-5">
          {renderNav(false, true)}
        </div>
      </Drawer>
    </>
  );
}

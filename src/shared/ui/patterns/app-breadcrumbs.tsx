'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/shared/ui/cn';
import { ChevronRightIcon } from '@/shared/ui/icons';

const ROUTE_NAMES: Record<string, string> = {
  welcome: 'Dashboard',
  scan: 'Scan Document',
  vault: 'Vault',
  usage: 'Analytics',
  settings: 'Settings',
  profile: 'Profile',
  billing: 'Billing',
  admin: 'Admin',
  users: 'User Management',
  logs: 'System Logs',
  config: 'Configuration',
  folder: 'Folder',
};

export function AppBreadcrumbs() {
  const pathname = usePathname();
  
  if (!pathname || pathname === '/') return null;
  
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'welcome')) {
    // Hide breadcrumbs on the dashboard home to save space, or keep it based on preference
    // Often it's hidden on the root dashboard page.
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center text-sm">
      <ol className="flex items-center gap-2">
        <li className="flex items-center">
          <Link
            href="/welcome"
            className="font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Dashboard
          </Link>
        </li>
        {segments.map((segment, index) => {
          // Skip 'welcome' if it's the first segment since we hardcoded 'Dashboard'
          if (index === 0 && segment === 'welcome') return null;

          const isLast = index === segments.length - 1;
          const href = '/' + segments.slice(0, index + 1).join('/');
          const name = ROUTE_NAMES[segment] || decodeURIComponent(segment);
          
          return (
            <li key={href} className="flex items-center gap-2">
              <ChevronRightIcon className="size-4 text-text-tertiary" />
              {isLast ? (
                <span className="font-medium text-text-primary" aria-current="page">
                  {name}
                </span>
              ) : (
                <Link
                  href={href}
                  className="font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  {name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

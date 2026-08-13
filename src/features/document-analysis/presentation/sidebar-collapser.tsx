'use client';

import { useEffect } from 'react';
import { useSidebarStore } from '@/shared/state/sidebar-store';

export function SidebarCollapser() {
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);

  useEffect(() => {
    // Automatically close the sidebar when this component is mounted
    setCollapsed(true);
  }, [setCollapsed]);

  return null;
}

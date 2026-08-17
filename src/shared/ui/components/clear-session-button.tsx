'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { signOutFormAction } from '@/server/actions/auth';

export function ClearSessionButton({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();

  const handleClear = () => {
    // Optimistically clear cookies on client side
    document.cookie = 'pl_session=; Max-Age=0; path=/';
    document.cookie = 'pl_session_hint=; Max-Age=0; path=/';

    // Perform server sign out
    startTransition(async () => {
      try {
        await signOutFormAction();
      } catch (e) {
        // Ignore redirect throw
      }
    });
  };

  return (
    <Button onClick={handleClear} disabled={isPending}>
      {children}
    </Button>
  );
}

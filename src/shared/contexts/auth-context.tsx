'use client';

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { clientEnv } from '@/config/env.client';

interface AuthContextValue {
  user: any | null; // Using any to accept either PublicSession or Supabase User
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
  initialUser: any | null;
}

const BROWSER_SESSION_KEY = 'pl:session';

function createLocalStorageFallback() {
  const inMemoryBackup: Record<string, string> = {};
  return {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(`${BROWSER_SESSION_KEY}:${key}`);
      } catch {
        return inMemoryBackup[key] ?? null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(`${BROWSER_SESSION_KEY}:${key}`, value);
      } catch {
        inMemoryBackup[key] = value;
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(`${BROWSER_SESSION_KEY}:${key}`);
      } catch {
        delete inMemoryBackup[key];
      }
    },
  };
}

let storageInstance: ReturnType<typeof createLocalStorageFallback> | undefined;

export function createBrowserSupabaseClient() {
  if (typeof window !== 'undefined' && !storageInstance) {
    storageInstance = createLocalStorageFallback();
  }

  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL!,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: undefined,
        storage: typeof window !== 'undefined' ? storageInstance : undefined,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    },
  );
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(initialUser);
  const [isLoading, setIsLoading] = useState(initialUser === null);
  const prevUserRef = useRef<any | null>(initialUser);

  const onAuthChange = useCallback(
    (_event: string, session: { user: User } | null) => {
      const newUser = session?.user ?? null;
      const wasNull = prevUserRef.current === null;
      prevUserRef.current = newUser;
      setUser(newUser);
      setIsLoading(false);

      if (wasNull && newUser !== null) {
        router.refresh();
      }

      if (!wasNull && newUser === null) {
        try {
          localStorage.removeItem('pl:scan-draft:v1');
          localStorage.removeItem('pl:sessionHint');
        } catch {
          /* ignore */
        }
      }
    },
    [router],
  );

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(onAuthChange);

    return () => subscription.unsubscribe();
  }, [onAuthChange]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser((prev: any) => {
        const next = session?.user ?? null;
        if (prev?.id === next?.id || prev?.userId === next?.id) return prev;
        return next;
      });
    });
  }, [pathname]);

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

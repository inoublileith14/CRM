'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  clearSupabaseSession,
  persistRefreshedSupabaseSession,
  readSupabaseSession,
  saveSupabaseSession,
  SupabaseSessionTokens,
} from '@/lib/supabase-session';
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from '@/lib/supabase-browser';

interface SupabaseSessionContextValue {
  ready: boolean;
  hasSession: boolean;
  refreshRealtimeAuth: () => Promise<boolean>;
}

const SupabaseSessionContext =
  createContext<SupabaseSessionContextValue | null>(null);

async function refreshSupabaseSessionFromServer(): Promise<SupabaseSessionTokens | null> {
  const res = await fetch('/api/auth/refresh-supabase-session', {
    method: 'POST',
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as SupabaseSessionTokens;
  if (!data.access_token || !data.refresh_token) return null;
  return data;
}

async function applySupabaseSession(
  session: SupabaseSessionTokens,
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) return false;

  saveSupabaseSession(session);
  persistRefreshedSupabaseSession(
    session.access_token,
    session.refresh_token,
  );
  await supabase.realtime.setAuth(session.access_token);
  return true;
}

export function SupabaseSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(!isSupabaseBrowserConfigured());
  const [hasSession, setHasSession] = useState(false);
  const bootstrappingRef = useRef(false);

  const refreshRealtimeAuth = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseBrowserConfigured()) {
      setHasSession(false);
      setReady(true);
      return false;
    }

    if (bootstrappingRef.current) return false;
    bootstrappingRef.current = true;

    try {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!meRes.ok) {
        setHasSession(false);
        return false;
      }

      const stored = readSupabaseSession();
      if (stored && (await applySupabaseSession(stored))) {
        setHasSession(true);
        return true;
      }

      const refreshed = await refreshSupabaseSessionFromServer();
      if (refreshed && (await applySupabaseSession(refreshed))) {
        setHasSession(true);
        return true;
      }

      clearSupabaseSession();
      setHasSession(false);
      return false;
    } finally {
      bootstrappingRef.current = false;
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setReady(true);
      setHasSession(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setReady(true);
      return;
    }

    void refreshRealtimeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.access_token || !session.refresh_token) return;
      persistRefreshedSupabaseSession(
        session.access_token,
        session.refresh_token,
      );
      void supabase.realtime.setAuth(session.access_token);
      setHasSession(true);
    });

    function handleVisibilityOrFocus() {
      if (document.visibilityState === 'hidden') return;
      void refreshRealtimeAuth();
    }

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    const refreshInterval = window.setInterval(() => {
      void refreshRealtimeAuth();
    }, 45 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.clearInterval(refreshInterval);
    };
  }, [refreshRealtimeAuth]);

  const value = useMemo(
    () => ({ ready, hasSession, refreshRealtimeAuth }),
    [hasSession, ready, refreshRealtimeAuth],
  );

  return (
    <SupabaseSessionContext.Provider value={value}>
      {children}
    </SupabaseSessionContext.Provider>
  );
}

export function useSupabaseSession() {
  const ctx = useContext(SupabaseSessionContext);
  if (!ctx) {
    throw new Error(
      'useSupabaseSession must be used within SupabaseSessionProvider',
    );
  }
  return ctx;
}

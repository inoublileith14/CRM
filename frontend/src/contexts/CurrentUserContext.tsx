'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthUser } from '@/lib/api';
import { useAuthMeQuery } from '@/hooks/use-dashboard-queries';
import { queryKeys } from '@/lib/query-keys';

interface CurrentUserContextValue {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user = null, isPending } = useAuthMeQuery();

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
  }, [queryClient]);

  const setUser = useCallback(
    (next: AuthUser | null) => {
      queryClient.setQueryData(queryKeys.auth.me, next);
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({ user, loading: isPending, refreshUser, setUser }),
    [user, isPending, refreshUser, setUser],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider');
  }
  return ctx;
}

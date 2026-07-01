'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadPersistedTableState,
  savePersistedTableState,
} from '@/lib/persisted-table-state';

export function usePersistedState<T>(storageKey: string, defaultValue: T) {
  const [state, setState] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    setState(loadPersistedTableState(storageKey, defaultValue));
    setIsHydrated(true);
  }, [storageKey, defaultValue]);

  useEffect(() => {
    if (!isHydrated) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    savePersistedTableState(storageKey, state);
  }, [storageKey, state, isHydrated]);

  const reset = useCallback(() => {
    setState(defaultValue);
    savePersistedTableState(storageKey, defaultValue);
  }, [defaultValue, storageKey]);

  return [state, setState, reset, isHydrated] as const;
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadPersistedTableState,
  savePersistedTableState,
} from '@/lib/persisted-table-state';

export function usePersistedState<T>(storageKey: string, defaultValue: T) {
  const [state, setState] = useState<T>(defaultValue);
  const hydratedRef = useRef(false);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    if (hydratedRef.current) return;
    setState(loadPersistedTableState(storageKey, defaultValue));
    hydratedRef.current = true;
  }, [storageKey, defaultValue]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    savePersistedTableState(storageKey, state);
  }, [storageKey, state]);

  const reset = useCallback(() => {
    setState(defaultValue);
    savePersistedTableState(storageKey, defaultValue);
  }, [defaultValue, storageKey]);

  return [state, setState, reset] as const;
}

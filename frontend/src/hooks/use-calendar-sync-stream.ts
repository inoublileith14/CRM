'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_DEBOUNCE_MS = 5_000;

export function useCalendarSyncStream(
  enabled: boolean,
  onCalendarUpdated: () => void,
  debounceMs = DEFAULT_DEBOUNCE_MS,
) {
  const onUpdateRef = useRef(onCalendarUpdated);
  onUpdateRef.current = onCalendarUpdated;

  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      if (disposed) return;

      eventSource = new EventSource('/api/calendar/stream');

      eventSource.addEventListener('calendar-updated', () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          onUpdateRef.current();
        }, debounceMs);
      });

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        if (!disposed) {
          reconnectTimer = setTimeout(connect, 5_000);
        }
      };
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      eventSource?.close();
    };
  }, [enabled, debounceMs]);
}

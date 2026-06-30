'use client';

import { useEffect, useRef } from 'react';

export function useCalendarSyncStream(
  enabled: boolean,
  onCalendarUpdated: () => void,
) {
  const onUpdateRef = useRef(onCalendarUpdated);
  onUpdateRef.current = onCalendarUpdated;

  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      if (disposed) return;

      eventSource = new EventSource('/api/calendar/stream');

      eventSource.addEventListener('calendar-updated', () => {
        onUpdateRef.current();
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
      eventSource?.close();
    };
  }, [enabled]);
}

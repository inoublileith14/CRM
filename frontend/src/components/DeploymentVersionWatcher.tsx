'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { CLIENT_BUILD_ID } from '@/lib/build-id';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

async function fetchDeployedBuildId(): Promise<string | null> {
  const res = await fetch('/api/version', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { buildId?: string };
  return data.buildId ?? null;
}

export function DeploymentVersionWatcher() {
  const promptedRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;

    async function checkForNewDeployment() {
      if (promptedRef.current) return;

      try {
        const deployedBuildId = await fetchDeployedBuildId();
        if (!deployedBuildId || deployedBuildId === CLIENT_BUILD_ID) return;

        promptedRef.current = true;
        toast('Hay una nueva versión disponible', {
          description: 'Recarga la página para ver los últimos cambios.',
          duration: Infinity,
          action: {
            label: 'Recargar',
            onClick: () => window.location.reload(),
          },
        });
      } catch {
        // Network blip — retry on next focus or interval.
      }
    }

    void checkForNewDeployment();

    const intervalId = window.setInterval(
      () => void checkForNewDeployment(),
      CHECK_INTERVAL_MS,
    );

    function onFocus() {
      void checkForNewDeployment();
    }

    function onVisible() {
      if (document.visibilityState === 'visible') {
        void checkForNewDeployment();
      }
    }

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHashRedirectPath } from '@/lib/auth-hash-redirect';

interface AuthHashRedirectProps {
  fallbackPath: string;
}

/** Sends Supabase invite/recovery hashes to the correct page. */
export function AuthHashRedirect({ fallbackPath }: AuthHashRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const target = getAuthHashRedirectPath(hash);

    if (target) {
      const onTargetPage = window.location.pathname === target;
      if (!onTargetPage) {
        router.replace(`${target}${hash}`);
      }
      return;
    }

    if (window.location.pathname !== fallbackPath) {
      router.replace(fallbackPath);
    }
  }, [fallbackPath, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
      Cargando…
    </div>
  );
}

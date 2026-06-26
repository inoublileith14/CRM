'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { isAdminUser } from '@/lib/auth-roles';

export function AdminOnlyGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const allowed = isAdminUser(user?.rol);

  useEffect(() => {
    if (loading) return;
    if (!allowed) {
      router.replace('/dashboard');
    }
  }, [allowed, loading, router]);

  if (loading || !allowed) {
    return null;
  }

  return <>{children}</>;
}

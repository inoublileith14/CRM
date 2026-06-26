'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast: 'bg-slate-900 text-white border border-slate-700',
        },
      }}
    />
  );
}

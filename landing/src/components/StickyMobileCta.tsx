'use client';

import { useEffect, useState } from 'react';
import { nav } from '@/lib/copy';
import { cn } from '@/lib/utils';

export function StickyMobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md transition-transform duration-300 md:hidden',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <a
        href="#demo"
        className="block w-full rounded-lg bg-emerald-600 py-3 text-center font-semibold text-white"
      >
        {nav.demoCta}
      </a>
    </div>
  );
}

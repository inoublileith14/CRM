'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { APP_URL, nav } from '@/lib/copy';
import { cn } from '@/lib/utils';

interface MarketingNavProps {
  isLoggedIn?: boolean;
}

export function MarketingNav({ isLoggedIn = false }: MarketingNavProps) {
  const [open, setOpen] = useState(false);
  const loginHref = `${APP_URL}/login`;
  const panelHref = `${APP_URL}/dashboard`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            C
          </span>
          <div className="leading-tight">
            <span className="block font-bold text-slate-900">Cocount</span>
            <span className="hidden text-[10px] text-slate-500 sm:block">
              {nav.tagline}
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            {nav.earlyAccess}
          </span>
          <a
            href="#demo"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            {nav.demoCta}
          </a>
          <Link
            href={isLoggedIn ? panelHref : loginHref}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            {isLoggedIn ? nav.panelCta : nav.loginCta}
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          'border-t border-slate-200 bg-white md:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#demo"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-center text-sm font-semibold text-white"
          >
            {nav.demoCta}
          </a>
          <Link
            href={isLoggedIn ? panelHref : loginHref}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold text-slate-700"
          >
            {isLoggedIn ? nav.panelCta : nav.loginCta}
          </Link>
        </nav>
      </div>
    </header>
  );
}

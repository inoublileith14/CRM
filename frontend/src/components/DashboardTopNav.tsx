'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Menu, Settings, User, X } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { logout } from '@/lib/api';
import {
  DashboardNavGroup,
  getDashboardNavEntries,
  isNavGroupActive,
  isNavItemActive,
} from '@/lib/dashboard-nav-items';
import { isAdminUser } from '@/lib/auth-roles';
import { MessageKey } from '@/lib/i18n/messages';

const navLinkClass = (active: boolean) =>
  `flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors lg:gap-1.5 lg:px-2.5 lg:text-sm ${
    active
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

function roleLabel(rol: string, t: (key: MessageKey) => string): string {
  if (rol === 'admin') return t('role.admin');
  if (rol === 'asesor' || rol === 'usuario') return t('role.asesor');
  return rol;
}

function NavGroupMenu({
  group,
  pathname,
  t,
}: {
  group: DashboardNavGroup;
  pathname: string;
  t: (key: MessageKey) => string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = isNavGroupActive(pathname, group.items, group.activePathPrefixes);
  const Icon = group.icon;

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={navLinkClass(active)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon className="h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" />
        <span>{t(group.labelKey)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          role="menu"
        >
          {group.items.map(({ href, labelKey, icon: ItemIcon }) => {
            const itemActive = isNavItemActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm transition ${
                  itemActive
                    ? 'bg-emerald-50 font-medium text-emerald-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ItemIcon className="h-4 w-4 shrink-0 text-slate-400" />
                {t(labelKey)}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useCurrentUser();
  const { locale, setLocale, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.nombre || user?.email || '—';
  const navEntries = getDashboardNavEntries({ isAdmin: isAdminUser(user?.rol) });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setUserMenuOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [userMenuOpen]);

  async function handleLogout() {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 rounded-lg py-1 transition hover:opacity-90"
        >
          <Image
            src="/logo.png"
            alt={t('app.brand')}
            width={36}
            height={36}
            className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
            priority
          />
          <p className="hidden text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-900 sm:block lg:text-xs">
            {t('app.brand')}
          </p>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1"
          aria-label="Principal"
        >
          {navEntries.map((entry) => {
            if (entry.type === 'group') {
              return (
                <NavGroupMenu
                  key={entry.labelKey}
                  group={entry}
                  pathname={pathname}
                  t={t}
                />
              );
            }

            const active = isNavItemActive(pathname, entry.href);
            const Icon = entry.icon;

            return (
              <Link
                key={entry.href}
                href={entry.href}
                className={navLinkClass(active)}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" />
                <span className="whitespace-nowrap">{t(entry.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <div
            className="hidden items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:flex"
            role="group"
            aria-label={t('header.language')}
          >
            <button
              type="button"
              onClick={() => setLocale('es')}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                locale === 'es'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                locale === 'en'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              EN
            </button>
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <span className="hidden max-w-[7rem] truncate text-right text-xs font-medium text-slate-700 xl:block">
                {displayName}
              </span>
              <UserAvatar
                name={displayName}
                avatarUrl={user?.avatar_url}
                size="sm"
              />
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                role="menu"
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user ? roleLabel(user.rol, t) : ''}
                    {user?.email ? ` · ${user.email}` : ''}
                  </p>
                </div>
                <Link
                  href="/dashboard/profile"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  {t('header.profile')}
                </Link>
                <Link
                  href="/dashboard/settings"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  {t('header.settings')}
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4 text-slate-400" />
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 top-14 z-40 bg-black/40 sm:top-16 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <nav
            className="absolute left-0 right-0 top-full z-50 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-slate-200 bg-white px-3 py-3 shadow-lg sm:max-h-[calc(100vh-4rem)] md:hidden"
            aria-label="Menú móvil"
          >
            <div className="mb-3 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:hidden">
              <button
                type="button"
                onClick={() => setLocale('es')}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                  locale === 'es'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                  locale === 'en'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                EN
              </button>
            </div>
            <ul className="space-y-0.5">
              {navEntries.map((entry) => {
                if (entry.type === 'group') {
                  return (
                    <li key={entry.labelKey}>
                      <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {t(entry.labelKey)}
                      </p>
                      <ul className="space-y-0.5">
                        {entry.items.map(({ href, labelKey, icon: Icon }) => {
                          const active = isNavItemActive(pathname, href);
                          return (
                            <li key={href}>
                              <Link
                                href={href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                                  active
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <Icon className="h-5 w-5 shrink-0" />
                                {t(labelKey)}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                }

                const active = isNavItemActive(pathname, entry.href);
                const Icon = entry.icon;

                return (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {t(entry.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}

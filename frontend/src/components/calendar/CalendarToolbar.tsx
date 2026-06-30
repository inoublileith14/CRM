'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  RefreshCw,
} from 'lucide-react';

export type CalendarDisplayView =
  | 'dayGridMonth'
  | 'timeGridWeek'
  | 'timeGridDay'
  | 'list';

type CalendarToolbarProps = {
  title: string;
  currentView: CalendarDisplayView;
  locale: 'es' | 'en';
  todayLabel: string;
  viewLabels: Record<CalendarDisplayView, string>;
  accountEmail: string | null;
  refreshLabel: string;
  disconnectLabel: string;
  reconnectLabel: string;
  linkedAsLabel: string;
  canCreateEvents: boolean;
  eventsLoading?: boolean;
  busy?: boolean;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onViewChange: (view: CalendarDisplayView) => void;
  onRefresh: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
  onCreateEvent?: () => void;
  createLabel?: string;
};

const VIEW_OPTIONS: CalendarDisplayView[] = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'list',
];

export function CalendarToolbar({
  title,
  currentView,
  locale,
  todayLabel,
  viewLabels,
  accountEmail,
  refreshLabel,
  disconnectLabel,
  reconnectLabel,
  linkedAsLabel,
  canCreateEvents,
  eventsLoading = false,
  busy = false,
  onToday,
  onPrev,
  onNext,
  onViewChange,
  onRefresh,
  onDisconnect,
  onReconnect,
  onCreateEvent,
  createLabel,
}: CalendarToolbarProps) {
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const todayDay = new Date().getDate();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (viewMenuRef.current && !viewMenuRef.current.contains(target)) {
        setViewMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setMoreMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div className="calendar-toolbar flex flex-col gap-2 border-b border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div
            className="flex h-10 w-10 shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            aria-hidden
          >
            <div className="bg-emerald-600 px-1 py-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-white">
              {new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'es-ES', {
                month: 'short',
              })
                .format(new Date())
                .replace('.', '')}
            </div>
            <div className="flex flex-1 items-center justify-center text-lg font-medium text-slate-800">
              {todayDay}
            </div>
          </div>
          <h1 className="text-xl font-normal text-slate-800 sm:text-[1.35rem]">
            {locale === 'en' ? 'Calendar' : 'Calendario'}
          </h1>
          {canCreateEvents && onCreateEvent && createLabel ? (
            <button
              type="button"
              onClick={onCreateEvent}
              disabled={busy}
              className="calendar-toolbar-create ml-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:ml-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{createLabel}</span>
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-1">
          <button
            type="button"
            onClick={onToday}
            disabled={busy}
            className="calendar-toolbar-pill rounded-full px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {todayLabel}
          </button>

          <div className="flex items-center">
            <button
              type="button"
              onClick={onPrev}
              disabled={busy}
              aria-label={locale === 'en' ? 'Previous' : 'Anterior'}
              className="calendar-toolbar-icon rounded-full p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={busy}
              aria-label={locale === 'en' ? 'Next' : 'Siguiente'}
              className="calendar-toolbar-icon rounded-full p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <h2 className="min-w-0 text-base font-normal text-slate-800 sm:text-lg">
            {title}
          </h2>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={viewMenuRef}>
            <button
              type="button"
              onClick={() => {
                setViewMenuOpen((open) => !open);
                setMoreMenuOpen(false);
              }}
              className="calendar-toolbar-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {viewLabels[currentView]}
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
            {viewMenuOpen ? (
              <div className="absolute right-0 z-20 mt-1 min-w-[10rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {VIEW_OPTIONS.map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => {
                      onViewChange(view);
                      setViewMenuOpen(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-slate-50 ${
                      currentView === view
                        ? 'font-semibold text-emerald-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {viewLabels[view]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => {
                setMoreMenuOpen((open) => !open);
                setViewMenuOpen(false);
              }}
              aria-label={locale === 'en' ? 'More options' : 'Más opciones'}
              className="calendar-toolbar-icon rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {moreMenuOpen ? (
              <div className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {accountEmail ? (
                  <p className="border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">
                    {linkedAsLabel}{' '}
                    <span className="font-medium text-slate-800">
                      {accountEmail}
                    </span>
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    onRefresh();
                    setMoreMenuOpen(false);
                  }}
                  disabled={eventsLoading || busy}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${eventsLoading ? 'animate-spin' : ''}`}
                  />
                  {refreshLabel}
                </button>
                {!canCreateEvents ? (
                  <button
                    type="button"
                    onClick={() => {
                      onReconnect();
                      setMoreMenuOpen(false);
                    }}
                    disabled={busy}
                    className="block w-full px-4 py-2 text-left text-sm text-blue-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {reconnectLabel}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    onDisconnect();
                    setMoreMenuOpen(false);
                  }}
                  disabled={busy}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {disconnectLabel}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarToolbarIconFallback() {
  return (
    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
      <CalendarDays className="h-6 w-6" />
    </div>
  );
}

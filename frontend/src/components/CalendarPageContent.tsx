'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, ExternalLink, RefreshCw } from 'lucide-react';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import {
  useCalendarEventsQuery,
  useCalendarStatusQuery,
  useInvalidateDashboardQueries,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { useLanguage } from '@/contexts/LanguageContext';

function formatEventWhen(
  start: string,
  end: string | null,
  allDay: boolean,
  locale: string,
): string {
  if (!start) return '';

  if (allDay) {
    const date = new Date(`${start}T12:00:00`);
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  const startDate = new Date(start);
  const datePart = startDate.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timePart = startDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!end) return `${datePart} · ${timePart}`;

  const endDate = new Date(end);
  const endTime = endDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${datePart} · ${timePart} – ${endTime}`;
}

export function CalendarPageContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const { invalidateCalendar } = useInvalidateDashboardQueries();
  const statusQuery = useCalendarStatusQuery();
  const { data: status = null, showInitialLoading, isRefreshing } =
    useQueryUiState(statusQuery);
  const eventsQuery = useCalendarEventsQuery(Boolean(status?.connected));
  const {
    data: events = [],
    showInitialLoading: eventsInitialLoading,
    isRefreshing: eventsRefreshing,
  } = useQueryUiState(eventsQuery);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<'connected' | 'error' | null>(null);

  useEffect(() => {
    const result = searchParams.get('calendar');
    if (result === 'connected' || result === 'error') {
      setBanner(result);
      void invalidateCalendar();
    }
  }, [searchParams, invalidateCalendar]);

  async function handleConnect() {
    setBusy(true);
    try {
      const res = await fetch('/api/calendar/connect', { cache: 'no-store' });
      const data = (await res.json()) as { url?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setBanner('error');
    } catch {
      setBanner('error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    try {
      const res = await fetch('/api/calendar/disconnect', { method: 'DELETE' });
      if (res.ok) {
        await invalidateCalendar();
        setBanner(null);
      } else {
        setBanner('error');
      }
    } catch {
      setBanner('error');
    } finally {
      setBusy(false);
    }
  }

  const localeTag = locale === 'en' ? 'en-GB' : 'es-ES';

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {t('calendar.title')}
            </h1>
            {isRefreshing || eventsRefreshing ? <QueryRefreshingBadge /> : null}
          </div>
          <p className="mt-1 text-slate-500">{t('calendar.subtitle')}</p>
        </div>

        {status?.connected && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void invalidateCalendar()}
              disabled={eventsInitialLoading || eventsRefreshing || busy}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${eventsInitialLoading || eventsRefreshing ? 'animate-spin' : ''}`}
              />
              {t('calendar.refresh')}
            </button>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              disabled={busy}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {t('settings.calendarDisconnect')}
            </button>
          </div>
        )}
      </header>

      {banner === 'connected' && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t('settings.calendarConnected')}
        </p>
      )}
      {banner === 'error' && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {t('settings.calendarError')}
        </p>
      )}

      {showInitialLoading ? (
        <p className="text-sm text-slate-500">{t('settings.calendarLoading')}</p>
      ) : !status?.connected ? (
        <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {t('calendar.connectTitle')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('calendar.connectHint')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={busy}
            className="mt-5 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {t('settings.calendarConnect')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {t('settings.calendarLinkedAs')}{' '}
            <span className="font-medium text-slate-900">
              {status.googleEmail ?? 'Google Calendar'}
            </span>
          </p>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {eventsInitialLoading && events.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">{t('calendar.loadingEvents')}</p>
            ) : events.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">{t('calendar.noEvents')}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatEventWhen(
                          event.start,
                          event.end,
                          event.allDay,
                          localeTag,
                        )}
                      </p>
                      {event.location && (
                        <p className="mt-1 text-sm text-slate-500">{event.location}</p>
                      )}
                    </div>
                    {event.htmlLink && (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        {t('calendar.openInGoogle')}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

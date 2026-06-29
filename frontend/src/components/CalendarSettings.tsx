'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import {
  useCalendarStatusQuery,
  useInvalidateDashboardQueries,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { useLanguage } from '@/contexts/LanguageContext';

export function CalendarSettings() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const { invalidateCalendar } = useInvalidateDashboardQueries();
  const statusQuery = useCalendarStatusQuery();
  const {
    data: status = null,
    showInitialLoading,
    isRefreshing,
  } = useQueryUiState(statusQuery);
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
      const data = (await res.json()) as { url?: string; error?: string };
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

  async function handleReconnect() {
    setBusy(true);
    try {
      await fetch('/api/calendar/disconnect', { method: 'DELETE' });
      const res = await fetch('/api/calendar/connect', { cache: 'no-store' });
      const data = (await res.json()) as { url?: string; error?: string };
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

  return (
    <div className="mt-6 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:mt-8 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-900">
          {t('settings.calendar')}
        </h2>
        {isRefreshing ? <QueryRefreshingBadge /> : null}
      </div>
      <p className="mt-1 text-sm text-slate-500">{t('settings.calendarHint')}</p>

      {banner === 'connected' && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t('settings.calendarConnected')}
        </p>
      )}
      {banner === 'error' && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {t('settings.calendarError')}
        </p>
      )}

      <div className="mt-4">
        {showInitialLoading ? (
          <p className="text-sm text-slate-500">{t('settings.calendarLoading')}</p>
        ) : status?.connected ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              {t('settings.calendarLinkedAs')}{' '}
              <span className="font-medium text-slate-900">
                {status.googleEmail ?? 'Google Calendar'}
              </span>
            </p>
            {status.canCreateEvents === false ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Tu cuenta está conectada solo con permiso de lectura. Para crear
                visitas desde Coconut, pulsa <strong>Reconectar</strong> y acepta
                los permisos de calendario.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {status.canCreateEvents === false ? (
                <button
                  type="button"
                  onClick={() => void handleReconnect()}
                  disabled={busy}
                  className="rounded-lg border border-blue-700 bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
                >
                  Reconectar Google Calendar
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void handleDisconnect()}
                disabled={busy}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {t('settings.calendarDisconnect')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={busy}
            className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {t('settings.calendarConnect')}
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { CalendarEventDetailDialog } from '@/components/calendar/CalendarEventDetailDialog';
import {
  CalendarCreateEventDialog,
  buildDefaultSlot,
  type CalendarSlotSelection,
} from '@/components/calendar/CalendarCreateEventDialog';
import {
  CalendarGridView,
  type CalendarGridViewHandle,
} from '@/components/calendar/CalendarGridView';
import {
  CalendarToolbar,
  type CalendarDisplayView,
} from '@/components/calendar/CalendarToolbar';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import {
  useCalendarEventsQuery,
  useCalendarStatusQuery,
  useInvalidateDashboardQueries,
} from '@/hooks/use-dashboard-queries';
import { useCalendarSyncStream } from '@/hooks/use-calendar-sync-stream';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { isAdminUser } from '@/lib/auth-roles';
import { getInitialCalendarRange } from '@/lib/calendar-range';
import { formatListRangeTitle } from '@/lib/format-calendar-range';
import { CalendarEventsRange, CalendarEventItem } from '@/types/calendar';

type CalendarViewMode = 'grid' | 'list';

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

function shiftRangeByDays(
  range: CalendarEventsRange,
  days: number,
): CalendarEventsRange {
  const from = new Date(range.from);
  const to = new Date(range.to);
  from.setDate(from.getDate() + days);
  to.setDate(to.getDate() + days);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function CalendarPageContent() {
  const { t, locale } = useLanguage();
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const { invalidateCalendar, invalidateCalendarEvents } =
    useInvalidateDashboardQueries();
  const statusQuery = useCalendarStatusQuery();
  const { data: status = null, showInitialLoading, isRefreshing } =
    useQueryUiState(statusQuery);
  const gridRef = useRef<CalendarGridViewHandle>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState(520);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('grid');
  const [displayView, setDisplayView] =
    useState<CalendarDisplayView>('timeGridWeek');
  const [toolbarTitle, setToolbarTitle] = useState(() =>
    formatListRangeTitle(
      getInitialCalendarRange().from,
      getInitialCalendarRange().to,
      locale === 'en' ? 'en-GB' : 'es-ES',
    ),
  );
  const [range, setRange] = useState<CalendarEventsRange>(() =>
    getInitialCalendarRange(),
  );

  const pushSyncActive = Boolean(status?.pushSyncEnabled);

  const handleCalendarRefresh = useCallback(() => {
    void invalidateCalendarEvents();
  }, [invalidateCalendarEvents]);

  useCalendarSyncStream(
    Boolean(status?.connected && pushSyncActive),
    handleCalendarRefresh,
  );

  const eventsQuery = useCalendarEventsQuery(
    Boolean(status?.connected),
    range,
    { refetchIntervalMs: pushSyncActive ? undefined : 60_000 },
  );
  const {
    data: events = [],
    showInitialLoading: eventsInitialLoading,
    isRefreshing: eventsRefreshing,
  } = useQueryUiState(eventsQuery);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<'connected' | 'error' | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [createSlot, setCreateSlot] = useState<CalendarSlotSelection | null>(
    null,
  );

  const localeTag = locale === 'en' ? 'en-GB' : 'es-ES';
  const eventsLoading = eventsInitialLoading || eventsRefreshing;
  const canEditEvents = status?.canCreateEvents !== false;
  const canManageConnection = status?.canManageConnection ?? isAdminUser(user?.rol);
  const isAdmin = isAdminUser(user?.rol);

  const viewLabels = useMemo(
    () => ({
      dayGridMonth: t('calendar.viewMonth'),
      timeGridWeek: t('calendar.viewWeek'),
      timeGridDay: t('calendar.viewDay'),
      list: t('calendar.viewList'),
    }),
    [t],
  );

  const eventDialogLabels = useMemo(
    () => ({
      title: t('calendar.eventTitle'),
      description: t('calendar.eventDescription'),
      location: t('calendar.eventLocation'),
      date: t('calendar.eventDate'),
      endDate: t('calendar.eventEndDate'),
      startTime: t('calendar.eventStartTime'),
      endTime: t('calendar.eventEndTime'),
      allDay: t('calendar.eventAllDay'),
      color: t('calendar.eventColor'),
      edit: t('calendar.eventEdit'),
      save: t('calendar.eventSave'),
      cancel: t('calendar.eventCancel'),
      close: t('calendar.eventClose'),
      openInGoogle: t('calendar.openInGoogle'),
      noDescription: t('calendar.eventNoDescription'),
      updated: t('calendar.eventUpdated'),
      updateFailed: t('calendar.eventUpdateFailed'),
      readOnlyHint: t('calendar.eventReadOnlyHint'),
    }),
    [t],
  );

  const createDialogLabels = useMemo(
    () => ({
      heading: t('calendar.createHeading'),
      title: t('calendar.eventTitle'),
      description: t('calendar.eventDescription'),
      location: t('calendar.eventLocation'),
      date: t('calendar.eventDate'),
      endDate: t('calendar.eventEndDate'),
      startTime: t('calendar.eventStartTime'),
      endTime: t('calendar.eventEndTime'),
      allDay: t('calendar.eventAllDay'),
      color: t('calendar.eventColor'),
      save: t('calendar.createSave'),
      cancel: t('calendar.eventCancel'),
      created: t('calendar.eventCreated'),
      createFailed: t('calendar.eventCreateFailed'),
    }),
    [t],
  );

  function openCreateDialog(slot: CalendarSlotSelection) {
    if (!canEditEvents) return;
    setCreateSlot(slot);
    setCreateOpen(true);
  }

  function closeCreateDialog() {
    setCreateOpen(false);
    setCreateSlot(null);
  }

  const handleRangeChange = useCallback((from: string, to: string) => {
    setRange((prev) => {
      if (prev.from === from && prev.to === to) return prev;
      return { from, to };
    });
  }, []);

  useEffect(() => {
    if (viewMode !== 'list') return;
    setToolbarTitle(formatListRangeTitle(range.from, range.to, localeTag));
  }, [viewMode, range.from, range.to, localeTag]);

  useEffect(() => {
    if (!status?.connected) return;

    const node = scrollAreaRef.current;
    if (!node) return;

    const updateHeight = () => {
      const next = Math.floor(node.getBoundingClientRect().height);
      if (next > 200) setGridHeight(next);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [status?.connected, viewMode]);

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

  async function handleReconnect() {
    setBusy(true);
    try {
      await fetch('/api/calendar/disconnect', { method: 'DELETE' });
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

  function handleViewChange(view: CalendarDisplayView) {
    setDisplayView(view);
    if (view === 'list') {
      setViewMode('list');
      setToolbarTitle(formatListRangeTitle(range.from, range.to, localeTag));
      return;
    }

    setViewMode('grid');
    gridRef.current?.changeView(view);
  }

  function handleToday() {
    if (viewMode === 'list') {
      const next = getInitialCalendarRange();
      setRange(next);
      setToolbarTitle(formatListRangeTitle(next.from, next.to, localeTag));
      return;
    }

    gridRef.current?.today();
  }

  function handlePrev() {
    if (viewMode === 'list') {
      setRange((prev) => {
        const next = shiftRangeByDays(prev, -7);
        setToolbarTitle(formatListRangeTitle(next.from, next.to, localeTag));
        return next;
      });
      return;
    }

    gridRef.current?.prev();
  }

  function handleNext() {
    if (viewMode === 'list') {
      setRange((prev) => {
        const next = shiftRangeByDays(prev, 7);
        setToolbarTitle(formatListRangeTitle(next.from, next.to, localeTag));
        return next;
      });
      return;
    }

    gridRef.current?.next();
  }

  return (
    <div className={status?.connected ? 'flex h-full min-h-0 flex-1 flex-col' : undefined}>
      {!status?.connected ? (
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {t('calendar.title')}
            </h1>
            {isRefreshing ? <QueryRefreshingBadge /> : null}
          </div>
          <p className="mt-1 text-slate-500">{t('calendar.subtitle')}</p>
        </header>
      ) : null}

      {banner === 'connected' && (
        <p className="mb-2 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t('settings.calendarConnected')}
        </p>
      )}
      {banner === 'error' && (
        <p className="mb-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {t('settings.calendarError')}
        </p>
      )}

      {showInitialLoading ? (
        <p className="text-sm text-slate-500">{t('settings.calendarLoading')}</p>
      ) : !status?.connected ? (
        isAdmin ? (
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
        <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {t('calendar.waitingAdminTitle')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('calendar.waitingAdminHint')}
              </p>
            </div>
          </div>
        </div>
        )
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {status.isShared && status.googleEmail ? (
            <p className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {t('calendar.sharedHint').replace('{email}', status.googleEmail)}
            </p>
          ) : null}
          {status.canCreateEvents === false ? (
            <p className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {locale === 'en' ? (
                <>
                  The agency calendar is connected with read-only access. Ask an
                  administrator to reconnect Google Calendar with write access.
                </>
              ) : (
                <>
                  El calendario de la agencia está conectado solo con permiso de
                  lectura. Pide a un administrador que reconecte Google Calendar
                  con permiso de escritura.
                </>
              )}
            </p>
          ) : null}

          <div className="calendar-shell flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="calendar-shell-header shrink-0">
              <CalendarToolbar
              title={toolbarTitle}
              currentView={displayView}
              locale={locale}
              todayLabel={t('calendar.today')}
              viewLabels={viewLabels}
              accountEmail={status.googleEmail}
              refreshLabel={t('calendar.refresh')}
              disconnectLabel={t('settings.calendarDisconnect')}
              reconnectLabel={t('calendar.reconnect')}
              linkedAsLabel={t('settings.calendarLinkedAs')}
              canCreateEvents={canEditEvents}
              canManageConnection={canManageConnection}
              eventsLoading={eventsLoading}
              busy={busy}
              onToday={handleToday}
              onPrev={handlePrev}
              onNext={handleNext}
              onViewChange={handleViewChange}
              onRefresh={() => void invalidateCalendar()}
              onDisconnect={() => void handleDisconnect()}
              onReconnect={() => void handleReconnect()}
              onCreateEvent={
                canEditEvents
                  ? () => openCreateDialog(buildDefaultSlot())
                  : undefined
              }
              createLabel={t('calendar.createEvent')}
              />

              {canEditEvents && viewMode === 'grid' ? (
                <p className="border-b border-slate-100 px-4 py-1.5 text-xs text-slate-500 sm:px-5">
                  {t('calendar.clickToCreate')}
                </p>
              ) : null}
            </div>

            <div
              ref={scrollAreaRef}
              className="calendar-scroll-area min-h-0 flex-1 overflow-hidden"
            >
            {viewMode === 'grid' ? (
              <CalendarGridView
                ref={gridRef}
                events={events}
                loading={eventsLoading}
                locale={locale}
                gridHeight={gridHeight}
                canCreate={canEditEvents}
                initialView={
                  displayView === 'list' ? 'timeGridWeek' : displayView
                }
                onRangeChange={handleRangeChange}
                onEventSelect={setSelectedEvent}
                onSlotSelect={openCreateDialog}
                onViewStateChange={({ title, viewType }) => {
                  setToolbarTitle(title);
                  setDisplayView(viewType);
                }}
              />
            ) : (
              <div className="calendar-list-body">
                {eventsLoading && events.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    {t('calendar.loadingEvents')}
                  </p>
                ) : events.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    {t('calendar.noEventsInRange')}
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {events.map((event) => (
                      <li key={event.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(event)}
                          className="flex w-full flex-col gap-2 px-4 py-4 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            {event.backgroundColor ? (
                              <span
                                className="mt-1.5 h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                                style={{
                                  backgroundColor: event.backgroundColor,
                                }}
                                aria-hidden
                              />
                            ) : null}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">
                                {event.title}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {formatEventWhen(
                                  event.start,
                                  event.end,
                                  event.allDay,
                                  localeTag,
                                )}
                              </p>
                              {event.location ? (
                                <p className="mt-1 text-sm text-slate-500">
                                  {event.location}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          {event.htmlLink ? (
                            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700">
                              {t('calendar.openInGoogle')}
                              <ExternalLink className="h-4 w-4" />
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            </div>
          </div>

          {isRefreshing || eventsRefreshing ? (
            <div className="flex shrink-0 justify-end">
              <QueryRefreshingBadge />
            </div>
          ) : null}
        </div>
      )}

      <CalendarEventDetailDialog
        open={selectedEvent !== null}
        event={selectedEvent}
        canEdit={canEditEvents}
        locale={locale}
        labels={eventDialogLabels}
        onClose={() => setSelectedEvent(null)}
        onSaved={() => void invalidateCalendar()}
      />

      <CalendarCreateEventDialog
        open={createOpen}
        slot={createSlot}
        locale={locale}
        labels={createDialogLabels}
        onClose={closeCreateDialog}
        onCreated={() => void invalidateCalendar()}
      />
    </div>
  );
}

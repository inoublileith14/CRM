'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import enGbLocale from '@fullcalendar/core/locales/en-gb';
import type {
  CalendarApi,
  DatesSetArg,
  EventClickArg,
} from '@fullcalendar/core';
import { addMinutesToDate } from '@/lib/google-calendar-colors';
import { formatCalendarRangeTitle } from '@/lib/format-calendar-range';
import { CalendarEventItem } from '@/types/calendar';
import type { CalendarDisplayView } from '@/components/calendar/CalendarToolbar';
import type { CalendarSlotSelection } from '@/components/calendar/CalendarCreateEventDialog';

export type CalendarGridViewHandle = {
  getApi: () => CalendarApi | null;
  today: () => void;
  prev: () => void;
  next: () => void;
  changeView: (view: Exclude<CalendarDisplayView, 'list'>) => void;
};

type CalendarGridViewProps = {
  events: CalendarEventItem[];
  loading?: boolean;
  locale: 'es' | 'en';
  initialView?: Exclude<CalendarDisplayView, 'list'>;
  gridHeight?: number;
  onRangeChange: (from: string, to: string) => void;
  onEventSelect: (event: CalendarEventItem) => void;
  canCreate?: boolean;
  onSlotSelect?: (slot: CalendarSlotSelection) => void;
  onViewStateChange?: (info: {
    title: string;
    viewType: Exclude<CalendarDisplayView, 'list'>;
  }) => void;
};

export const CalendarGridView = forwardRef<
  CalendarGridViewHandle,
  CalendarGridViewProps
>(function CalendarGridView(
  {
    events,
    loading = false,
    locale,
    initialView = 'timeGridWeek',
    gridHeight = 520,
    onRangeChange,
    onEventSelect,
    canCreate = false,
    onSlotSelect,
    onViewStateChange,
  },
  ref,
) {
  const calendarRef = useRef<FullCalendar>(null);

  const fcEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end ?? undefined,
        allDay: event.allDay,
        backgroundColor: event.backgroundColor ?? undefined,
        borderColor: event.backgroundColor ?? undefined,
        textColor: event.foregroundColor ?? undefined,
      })),
    [events],
  );

  const fcLocale = locale === 'en' ? enGbLocale : esLocale;
  const localeTag = locale === 'en' ? 'en-GB' : 'es-ES';

  useImperativeHandle(ref, () => ({
    getApi: () => calendarRef.current?.getApi() ?? null,
    today: () => calendarRef.current?.getApi().today(),
    prev: () => calendarRef.current?.getApi().prev(),
    next: () => calendarRef.current?.getApi().next(),
    changeView: (view) => calendarRef.current?.getApi().changeView(view),
  }));

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.setOption('height', gridHeight);
  }, [gridHeight]);

  function handleDatesSet(arg: DatesSetArg) {
    onRangeChange(arg.start.toISOString(), arg.end.toISOString());
    const viewType = arg.view.type as Exclude<CalendarDisplayView, 'list'>;
    onViewStateChange?.({
      title: formatCalendarRangeTitle(
        arg.start,
        arg.end,
        viewType,
        localeTag,
      ),
      viewType,
    });
  }

  function handleEventClick(arg: EventClickArg) {
    const match = events.find((event) => event.id === arg.event.id);
    if (match) onEventSelect(match);
  }

  function handleDateClick(arg: {
    date: Date;
    allDay: boolean;
  }) {
    if (!canCreate || !onSlotSelect) return;

    const end = arg.allDay
      ? (() => {
          const next = new Date(arg.date);
          next.setDate(next.getDate() + 1);
          return next;
        })()
      : addMinutesToDate(arg.date, 60);

    onSlotSelect({
      start: arg.date,
      end,
      allDay: arg.allDay,
    });
  }

  function handleSelect(arg: {
    start: Date;
    end: Date;
    allDay: boolean;
    view: { calendar: { unselect: () => void } };
  }) {
    if (!canCreate || !onSlotSelect) return;

    onSlotSelect({
      start: arg.start,
      end: arg.end,
      allDay: arg.allDay,
    });
    arg.view.calendar.unselect();
  }

  return (
    <div
      className={`calendar-grid-body h-full min-h-0 ${canCreate ? 'calendar-grid-body--creatable' : ''} ${loading ? 'opacity-70' : ''}`}
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        headerToolbar={false}
        locale={fcLocale}
        firstDay={1}
        height={gridHeight}
        stickyHeaderDates
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        allDaySlot
        nowIndicator
        events={fcEvents}
        datesSet={handleDatesSet}
        eventClick={handleEventClick}
        selectable={canCreate}
        selectMirror={canCreate}
        unselectAuto
        dateClick={handleDateClick}
        select={handleSelect}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        dayMaxEvents={3}
      />
    </div>
  );
});

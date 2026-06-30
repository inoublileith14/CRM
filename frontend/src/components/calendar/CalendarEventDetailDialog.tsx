'use client';

import { useEffect, useState } from 'react';
import {
  ExternalLink,
  Loader2,
  Pencil,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { updateCalendarEvent } from '@/lib/calendar-api';
import { ApiError } from '@/lib/api';
import {
  addMinutesToDate,
  buildLocalDateTime,
  CALENDAR_EVENT_TIME_ZONE,
  formatDateInputValue,
  formatTimeInputValue,
  GOOGLE_CALENDAR_COLORS,
  GoogleCalendarColorId,
} from '@/lib/google-calendar-colors';
import { CalendarEventItem } from '@/types/calendar';

type CalendarEventDetailDialogProps = {
  open: boolean;
  event: CalendarEventItem | null;
  canEdit: boolean;
  locale: 'es' | 'en';
  labels: {
    title: string;
    description: string;
    location: string;
    date: string;
    endDate: string;
    startTime: string;
    endTime: string;
    allDay: string;
    color: string;
    edit: string;
    save: string;
    cancel: string;
    close: string;
    openInGoogle: string;
    noDescription: string;
    updated: string;
    updateFailed: string;
    readOnlyHint: string;
  };
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  summary: string;
  description: string;
  location: string;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  colorId: GoogleCalendarColorId;
};

function parseGoogleColorId(
  colorId: string | null,
): GoogleCalendarColorId {
  const match = GOOGLE_CALENDAR_COLORS.find((color) => color.id === colorId);
  return match?.id ?? GOOGLE_CALENDAR_COLORS[0].id;
}

function exclusiveEndToInclusive(endDateStr: string): string {
  const date = new Date(`${endDateStr.slice(0, 10)}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return formatDateInputValue(date);
}

function inclusiveEndToExclusive(endDateStr: string): string {
  const date = new Date(`${endDateStr.slice(0, 10)}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return formatDateInputValue(date);
}

function eventToForm(event: CalendarEventItem): FormState {
  const colorId = parseGoogleColorId(event.colorId);

  if (event.allDay) {
    const startDate = event.start.slice(0, 10);
    const endDate = event.end
      ? exclusiveEndToInclusive(event.end)
      : startDate;

    return {
      summary: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      date: startDate,
      endDate,
      startTime: '09:00',
      endTime: '10:00',
      allDay: true,
      colorId,
    };
  }

  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : addMinutesToDate(start, 60);

  return {
    summary: event.title,
    description: event.description ?? '',
    location: event.location ?? '',
    date: formatDateInputValue(start),
    endDate: formatDateInputValue(end),
    startTime: formatTimeInputValue(start),
    endTime: formatTimeInputValue(end),
    allDay: false,
    colorId,
  };
}

function formatEventWhen(
  event: CalendarEventItem,
  localeTag: string,
): string {
  if (event.allDay) {
    const start = new Date(`${event.start.slice(0, 10)}T12:00:00`);
    if (event.end) {
      const inclusiveEnd = new Date(
        `${exclusiveEndToInclusive(event.end)}T12:00:00`,
      );
      if (inclusiveEnd.getTime() > start.getTime()) {
        return `${new Intl.DateTimeFormat(localeTag, { dateStyle: 'medium' }).format(start)} – ${new Intl.DateTimeFormat(localeTag, { dateStyle: 'medium' }).format(inclusiveEnd)}`;
      }
    }
    return new Intl.DateTimeFormat(localeTag, { dateStyle: 'full' }).format(
      start,
    );
  }

  const startText = new Intl.DateTimeFormat(localeTag, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(event.start));

  if (!event.end) return startText;

  return `${startText} – ${new Intl.DateTimeFormat(localeTag, {
    timeStyle: 'short',
  }).format(new Date(event.end))}`;
}

export function CalendarEventDetailDialog({
  open,
  event,
  canEdit,
  locale,
  labels,
  onClose,
  onSaved,
}: CalendarEventDetailDialogProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (!open || !event) return;
    setMode('view');
    setForm(eventToForm(event));
  }, [open, event]);

  if (!open || !event || !form) return null;

  const localeTag = locale === 'en' ? 'en-GB' : 'es-ES';
  const colorSwatch =
    GOOGLE_CALENDAR_COLORS.find((color) => color.id === form.colorId) ??
    GOOGLE_CALENDAR_COLORS[0];

  async function handleSave(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (!event || !form) return;

    const currentForm = form;
    let start: string;
    let end: string;

    if (currentForm.allDay) {
      start = currentForm.date.slice(0, 10);
      const inclusiveEnd = currentForm.endDate.slice(0, 10);
      if (inclusiveEnd < start) {
        toast.error(
          locale === 'en'
            ? 'End date must be on or after start date'
            : 'La fecha de fin debe ser igual o posterior a la de inicio',
        );
        return;
      }
      end = inclusiveEndToExclusive(inclusiveEnd);
    } else {
      start = buildLocalDateTime(currentForm.date, currentForm.startTime);
      end = buildLocalDateTime(currentForm.date, currentForm.endTime);
      if (Date.parse(end) <= Date.parse(start)) {
        toast.error(
          locale === 'en'
            ? 'End time must be after start time'
            : 'La hora de fin debe ser posterior a la de inicio',
        );
        return;
      }
    }

    setSaving(true);
    try {
      await updateCalendarEvent(event.id, {
        summary: currentForm.summary.trim(),
        description: currentForm.description.trim() || undefined,
        location: currentForm.location.trim() || undefined,
        start,
        end,
        timeZone: CALENDAR_EVENT_TIME_ZONE,
        colorId: currentForm.colorId,
        allDay: currentForm.allDay,
      });
      toast.success(labels.updated);
      onSaved();
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : labels.updateFailed;
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={labels.close}
        className="absolute inset-0 bg-slate-900/50"
        onClick={saving ? undefined : onClose}
        disabled={saving}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-detail-title"
        className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="mt-1 h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: event.backgroundColor ?? colorSwatch.backgroundColor }}
              aria-hidden
            />
            <div className="min-w-0">
              <h2
                id="calendar-event-detail-title"
                className="text-lg font-semibold text-slate-900"
              >
                {mode === 'view' ? event.title : labels.title}
              </h2>
              {mode === 'view' ? (
                <p className="mt-1 text-sm text-slate-500">
                  {formatEventWhen(event, localeTag)}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === 'view' ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4">
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {labels.description}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {event.description?.trim() ? event.description : labels.noDescription}
                </dd>
              </div>
              {event.location ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {labels.location}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-800">{event.location}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap gap-2">
                {event.htmlLink ? (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {labels.openInGoogle}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {labels.close}
                </button>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Pencil className="h-4 w-4" />
                    {labels.edit}
                  </button>
                ) : (
                  <p className="max-w-xs text-xs text-amber-800">{labels.readOnlyHint}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(submitEvent) => void handleSave(submitEvent)}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4"
          >
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {labels.title}
                </span>
                <input
                  type="text"
                  required
                  value={form.summary}
                  onChange={(changeEvent) =>
                    setForm((prev) =>
                      prev ? { ...prev, summary: changeEvent.target.value } : prev,
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-600 focus:ring-2 disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {labels.description}
                </span>
                <textarea
                  value={form.description}
                  onChange={(changeEvent) =>
                    setForm((prev) =>
                      prev
                        ? { ...prev, description: changeEvent.target.value }
                        : prev,
                    )
                  }
                  disabled={saving}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-600 focus:ring-2 disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {labels.location}
                </span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(changeEvent) =>
                    setForm((prev) =>
                      prev ? { ...prev, location: changeEvent.target.value } : prev,
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-600 focus:ring-2 disabled:opacity-60"
                />
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(changeEvent) =>
                    setForm((prev) =>
                      prev ? { ...prev, allDay: changeEvent.target.checked } : prev,
                    )
                  }
                  disabled={saving}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span className="text-sm font-medium text-slate-700">
                  {labels.allDay}
                </span>
              </label>

              {form.allDay ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {labels.date}
                    </span>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(changeEvent) =>
                        setForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                date: changeEvent.target.value,
                                endDate:
                                  prev.endDate < changeEvent.target.value
                                    ? changeEvent.target.value
                                    : prev.endDate,
                              }
                            : prev,
                        )
                      }
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-600 focus:ring-2 disabled:opacity-60"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {labels.endDate}
                    </span>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      min={form.date}
                      onChange={(changeEvent) =>
                        setForm((prev) =>
                          prev ? { ...prev, endDate: changeEvent.target.value } : prev,
                        )
                      }
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-600 focus:ring-2 disabled:opacity-60"
                    />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="block sm:col-span-1">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {labels.date}
                    </span>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(changeEvent) =>
                        setForm((prev) =>
                          prev ? { ...prev, date: changeEvent.target.value } : prev,
                        )
                      }
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-600 focus:ring-2 disabled:opacity-60"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {labels.startTime}
                    </span>
                    <input
                      type="time"
                      required
                      value={form.startTime}
                      onChange={(changeEvent) =>
                        setForm((prev) =>
                          prev ? { ...prev, startTime: changeEvent.target.value } : prev,
                        )
                      }
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-600 focus:ring-2 disabled:opacity-60"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {labels.endTime}
                    </span>
                    <input
                      type="time"
                      required
                      value={form.endTime}
                      onChange={(changeEvent) =>
                        setForm((prev) =>
                          prev ? { ...prev, endTime: changeEvent.target.value } : prev,
                        )
                      }
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-600 focus:ring-2 disabled:opacity-60"
                    />
                  </label>
                </div>
              )}

              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {labels.color}
                </span>
                <div className="flex flex-wrap gap-2">
                  {GOOGLE_CALENDAR_COLORS.map((color) => {
                    const selected = form.colorId === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        title={color.label}
                        disabled={saving}
                        onClick={() =>
                          setForm((prev) =>
                            prev ? { ...prev, colorId: color.id } : prev,
                          )
                        }
                        className={`h-8 w-8 rounded-full border-2 transition disabled:opacity-60 ${
                          selected
                            ? 'border-slate-900 ring-2 ring-slate-300'
                            : 'border-white shadow-sm hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.backgroundColor }}
                        aria-label={color.label}
                        aria-pressed={selected}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setForm(eventToForm(event));
                  setMode('view');
                }}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {labels.cancel}
              </button>
              <button
                type="submit"
                disabled={saving || !form.summary.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {labels.save}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

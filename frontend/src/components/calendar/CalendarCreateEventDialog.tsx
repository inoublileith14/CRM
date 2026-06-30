'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { createCalendarEvent } from '@/lib/calendar-api';
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

export type CalendarSlotSelection = {
  start: Date;
  end: Date;
  allDay: boolean;
};

type CalendarCreateEventDialogProps = {
  open: boolean;
  slot: CalendarSlotSelection | null;
  locale: 'es' | 'en';
  labels: {
    heading: string;
    title: string;
    description: string;
    location: string;
    date: string;
    endDate: string;
    startTime: string;
    endTime: string;
    allDay: string;
    color: string;
    save: string;
    cancel: string;
    created: string;
    createFailed: string;
  };
  onClose: () => void;
  onCreated: () => void;
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

function slotToForm(slot: CalendarSlotSelection): FormState {
  if (slot.allDay) {
    const date = formatDateInputValue(slot.start);
    const endInclusive = new Date(slot.end);
    endInclusive.setMilliseconds(endInclusive.getMilliseconds() - 1);
    return {
      summary: '',
      description: '',
      location: '',
      date,
      endDate: formatDateInputValue(endInclusive),
      startTime: '09:00',
      endTime: '10:00',
      allDay: true,
      colorId: '10',
    };
  }

  const end =
    slot.end.getTime() > slot.start.getTime()
      ? slot.end
      : addMinutesToDate(slot.start, 60);

  return {
    summary: '',
    description: '',
    location: '',
    date: formatDateInputValue(slot.start),
    endDate: formatDateInputValue(end),
    startTime: formatTimeInputValue(slot.start),
    endTime: formatTimeInputValue(end),
    allDay: false,
    colorId: '10',
  };
}

function inclusiveEndToExclusive(endDateStr: string): string {
  const date = new Date(`${endDateStr.slice(0, 10)}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return formatDateInputValue(date);
}

export function CalendarCreateEventDialog({
  open,
  slot,
  locale,
  labels,
  onClose,
  onCreated,
}: CalendarCreateEventDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (!open || !slot) return;
    setForm(slotToForm(slot));
  }, [open, slot]);

  if (!open || !slot || !form) return null;

  async function handleSave(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (!form) return;

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
      await createCalendarEvent({
        summary: currentForm.summary.trim(),
        description: currentForm.description.trim() || undefined,
        location: currentForm.location.trim() || undefined,
        start,
        end,
        timeZone: CALENDAR_EVENT_TIME_ZONE,
        colorId: currentForm.colorId,
        allDay: currentForm.allDay,
      });
      toast.success(labels.created);
      onCreated();
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : labels.createFailed;
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={labels.cancel}
        className="absolute inset-0 bg-slate-900/50"
        onClick={saving ? undefined : onClose}
        disabled={saving}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-create-event-title"
        className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
              <Plus className="h-5 w-5" />
            </div>
            <h2
              id="calendar-create-event-title"
              className="text-lg font-semibold text-slate-900"
            >
              {labels.heading}
            </h2>
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
                autoFocus
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
                rows={3}
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
                        prev
                          ? { ...prev, endDate: changeEvent.target.value }
                          : prev,
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
                        prev
                          ? { ...prev, startTime: changeEvent.target.value }
                          : prev,
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
              onClick={onClose}
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
      </div>
    </div>
  );
}

export function buildSlotFromDateClick(
  date: Date,
  allDay: boolean,
): CalendarSlotSelection {
  if (allDay) {
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    return { start: date, end, allDay: true };
  }

  return {
    start: date,
    end: addMinutesToDate(date, 60),
    allDay: false,
  };
}

export function buildDefaultSlot(): CalendarSlotSelection {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  return {
    start,
    end: addMinutesToDate(start, 60),
    allDay: false,
  };
}

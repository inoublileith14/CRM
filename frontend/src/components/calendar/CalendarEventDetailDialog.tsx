'use client';

import { useEffect, useState } from 'react';
import {
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CoconutBrandedDialog,
  CoconutBrandedDialogCancelButton,
  CoconutBrandedDialogFooter,
  CoconutBrandedDialogPrimaryButton,
  COCONUT_DIALOG_INPUT_CLASS,
  COCONUT_DIALOG_LABEL_CLASS,
} from '@/components/CoconutBrandedDialog';
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
    <CoconutBrandedDialog
      open={open}
      onClose={onClose}
      blockClose={saving}
      title={mode === 'view' ? event.title : labels.title}
      subtitle="CALENDARIO"
      titleId="calendar-event-detail-title"
      size="md"
      align="left"
      scrollable
      zIndexClass="z-[300]"
      bodyClassName="!pb-4"
      description={
        mode === 'view' ? formatEventWhen(event, localeTag) : undefined
      }
      footer={
        mode === 'view' ? (
          <CoconutBrandedDialogFooter align="end">
            {event.htmlLink ? (
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mr-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#b8924b] hover:brightness-95"
              >
                {labels.openInGoogle}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
            <CoconutBrandedDialogCancelButton onClick={onClose}>
              {labels.close}
            </CoconutBrandedDialogCancelButton>
            {canEdit ? (
              <CoconutBrandedDialogPrimaryButton onClick={() => setMode('edit')}>
                <Pencil className="h-4 w-4" />
                {labels.edit}
              </CoconutBrandedDialogPrimaryButton>
            ) : (
              <p className="max-w-xs text-xs text-amber-800">{labels.readOnlyHint}</p>
            )}
          </CoconutBrandedDialogFooter>
        ) : (
          <CoconutBrandedDialogFooter align="end">
            <CoconutBrandedDialogCancelButton
              onClick={() => {
                setForm(eventToForm(event));
                setMode('view');
              }}
              disabled={saving}
            >
              {labels.cancel}
            </CoconutBrandedDialogCancelButton>
            <CoconutBrandedDialogPrimaryButton
              type="submit"
              form="calendar-event-detail-form"
              disabled={saving || !form.summary.trim()}
              loading={saving}
            >
              {labels.save}
            </CoconutBrandedDialogPrimaryButton>
          </CoconutBrandedDialogFooter>
        )
      }
    >
        {mode === 'view' ? (
          <dl className="m-0 space-y-4">
              <div>
                <dt className={COCONUT_DIALOG_LABEL_CLASS}>{labels.description}</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-[#24211f]">
                  {event.description?.trim() ? event.description : labels.noDescription}
                </dd>
              </div>
              {event.location ? (
                <div>
                  <dt className={COCONUT_DIALOG_LABEL_CLASS}>{labels.location}</dt>
                  <dd className="mt-1 text-sm text-[#24211f]">{event.location}</dd>
                </div>
              ) : null}
          </dl>
        ) : (
          <form
            id="calendar-event-detail-form"
            onSubmit={(submitEvent) => void handleSave(submitEvent)}
            className="space-y-4"
          >
              <label className="block">
                <span className={COCONUT_DIALOG_LABEL_CLASS}>{labels.title}</span>
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
                  className={COCONUT_DIALOG_INPUT_CLASS}
                />
              </label>

              <label className="block">
                <span className={COCONUT_DIALOG_LABEL_CLASS}>{labels.description}</span>
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
                  className={`${COCONUT_DIALOG_INPUT_CLASS} resize-y`}
                />
              </label>

              <label className="block">
                <span className={COCONUT_DIALOG_LABEL_CLASS}>{labels.location}</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(changeEvent) =>
                    setForm((prev) =>
                      prev ? { ...prev, location: changeEvent.target.value } : prev,
                    )
                  }
                  disabled={saving}
                  className={COCONUT_DIALOG_INPUT_CLASS}
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
                  className="h-4 w-4 rounded border-[#eadfcd] text-[#b8924b]"
                />
                <span className="text-sm font-medium text-[#5f574f]">
                  {labels.allDay}
                </span>
              </label>

              {form.allDay ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={COCONUT_DIALOG_LABEL_CLASS}>{labels.date}</span>
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
                      className={COCONUT_DIALOG_INPUT_CLASS}
                    />
                  </label>
                  <label className="block">
                    <span className={COCONUT_DIALOG_LABEL_CLASS}>{labels.endDate}</span>
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
                      className={COCONUT_DIALOG_INPUT_CLASS}
                    />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="block sm:col-span-1">
                    <span className={COCONUT_DIALOG_LABEL_CLASS}>{labels.date}</span>
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
                      className={COCONUT_DIALOG_INPUT_CLASS}
                    />
                  </label>
                  <label className="block">
                    <span className={COCONUT_DIALOG_LABEL_CLASS}>{labels.startTime}</span>
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
                      className={COCONUT_DIALOG_INPUT_CLASS}
                    />
                  </label>
                  <label className="block">
                    <span className={COCONUT_DIALOG_LABEL_CLASS}>{labels.endTime}</span>
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
                      className={COCONUT_DIALOG_INPUT_CLASS}
                    />
                  </label>
                </div>
              )}

              <div>
                <span className={`${COCONUT_DIALOG_LABEL_CLASS} mb-2`}>
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
          </form>
        )}
    </CoconutBrandedDialog>
  );
}

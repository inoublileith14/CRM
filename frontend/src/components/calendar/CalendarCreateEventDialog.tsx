'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  CoconutBrandedDialog,
  CoconutBrandedDialogCancelButton,
  CoconutBrandedDialogFooter,
  CoconutBrandedDialogPrimaryButton,
  COCONUT_DIALOG_INPUT_CLASS,
  COCONUT_DIALOG_LABEL_CLASS,
} from '@/components/CoconutBrandedDialog';
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
    <CoconutBrandedDialog
      open={open}
      onClose={onClose}
      blockClose={saving}
      title={labels.heading}
      subtitle="CALENDARIO"
      titleId="calendar-create-event-title"
      size="md"
      align="left"
      scrollable
      zIndexClass="z-[300]"
      bodyClassName="!pb-4"
      footer={
        <CoconutBrandedDialogFooter align="end">
          <CoconutBrandedDialogCancelButton onClick={onClose} disabled={saving}>
            {labels.cancel}
          </CoconutBrandedDialogCancelButton>
          <CoconutBrandedDialogPrimaryButton
            type="submit"
            form="calendar-create-event-form"
            disabled={saving || !form.summary.trim()}
            loading={saving}
          >
            {labels.save}
          </CoconutBrandedDialogPrimaryButton>
        </CoconutBrandedDialogFooter>
      }
    >
      <form
        id="calendar-create-event-form"
        onSubmit={(submitEvent) => void handleSave(submitEvent)}
        className="space-y-4"
      >
            <label className="block">
              <span className={COCONUT_DIALOG_LABEL_CLASS}>{labels.title}</span>
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
                className={COCONUT_DIALOG_INPUT_CLASS}
              />
            </label>

            <label className="block">
              <span className={COCONUT_DIALOG_LABEL_CLASS}>
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
                        prev
                          ? { ...prev, endDate: changeEvent.target.value }
                          : prev,
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
                  <span className={COCONUT_DIALOG_LABEL_CLASS}>
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
    </CoconutBrandedDialog>
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

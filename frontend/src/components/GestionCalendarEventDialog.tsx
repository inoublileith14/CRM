'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ClienteGestionEstado } from '@/lib/cliente-gestion-estado';
import {
  addMinutesToDate,
  buildEventDescription,
  buildEventTitle,
  buildLocalDateTime,
  CALENDAR_EVENT_TIME_ZONE,
  formatDateInputValue,
  formatTimeInputValue,
  getDefaultCalendarColorId,
  getDefaultEventStart,
  GOOGLE_CALENDAR_COLORS,
  GoogleCalendarColorId,
} from '@/lib/google-calendar-colors';

export type GestionCalendarEventFormValues = {
  summary: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  colorId: GoogleCalendarColorId;
  createInGoogleCalendar: boolean;
};

interface GestionCalendarEventDialogProps {
  open: boolean;
  gestionEstado: Extract<
    ClienteGestionEstado,
    'visita_concertada' | 'videollamada'
  >;
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteRef: string | null;
  clienteNotas: string | null;
  inmuebleLabel: string | null;
  calendarConnected: boolean;
  canCreateEvents: boolean;
  loading?: boolean;
  onConfirm: (values: GestionCalendarEventFormValues) => void;
  onCancel: () => void;
}

function getDefaultDurationMinutes(
  gestionEstado: 'visita_concertada' | 'videollamada',
): number {
  return gestionEstado === 'videollamada' ? 30 : 60;
}

export function GestionCalendarEventDialog({
  open,
  gestionEstado,
  clienteNombre,
  clienteTelefono,
  clienteRef,
  clienteNotas,
  inmuebleLabel,
  calendarConnected,
  canCreateEvents,
  loading,
  onConfirm,
  onCancel,
}: GestionCalendarEventDialogProps) {
  const defaultStart = useMemo(() => getDefaultEventStart(), [open, gestionEstado]);
  const defaultEnd = useMemo(
    () => addMinutesToDate(defaultStart, getDefaultDurationMinutes(gestionEstado)),
    [defaultStart, gestionEstado],
  );

  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [colorId, setColorId] = useState<GoogleCalendarColorId>(
    getDefaultCalendarColorId(gestionEstado),
  );
  const [createInGoogleCalendar, setCreateInGoogleCalendar] = useState(true);

  useEffect(() => {
    if (!open) return;

    setSummary(buildEventTitle(gestionEstado, clienteNombre, inmuebleLabel));
    setDescription(
      buildEventDescription({
        clienteTelefono,
        clienteRef,
        clienteNotas,
      }),
    );
    setLocation(inmuebleLabel?.trim() ?? '');
    setDate(formatDateInputValue(defaultStart));
    setStartTime(formatTimeInputValue(defaultStart));
    setEndTime(formatTimeInputValue(defaultEnd));
    setColorId(getDefaultCalendarColorId(gestionEstado));
    setCreateInGoogleCalendar(canCreateEvents);
  }, [
    open,
    gestionEstado,
    clienteNombre,
    clienteTelefono,
    clienteRef,
    clienteNotas,
    inmuebleLabel,
    canCreateEvents,
    defaultStart,
    defaultEnd,
  ]);

  if (!open) return null;

  const titleLabel =
    gestionEstado === 'videollamada'
      ? 'Programar videollamada'
      : 'Programar visita concertada';

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const start = buildLocalDateTime(date, startTime);
    const end = buildLocalDateTime(date, endTime);
    if (Date.parse(end) <= Date.parse(start)) {
      toast.error('La hora de fin debe ser posterior a la de inicio');
      return;
    }

    onConfirm({
      summary: summary.trim(),
      description: description.trim(),
      location: location.trim(),
      date,
      startTime,
      endTime,
      colorId,
      createInGoogleCalendar: calendarConnected && createInGoogleCalendar,
    });
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-slate-900/50"
        onClick={loading ? undefined : onCancel}
        disabled={loading}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gestion-calendar-dialog-title"
        className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="gestion-calendar-dialog-title"
                className="text-lg font-semibold text-slate-900"
              >
                {titleLabel}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {clienteNombre}
                {inmuebleLabel ? ` · ${inmuebleLabel}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4"
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Título
              </span>
              <input
                type="text"
                required
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600 focus:ring-2 disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Descripción
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={loading}
                rows={3}
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600 focus:ring-2 disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Ubicación
              </span>
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                disabled={loading}
                placeholder="Dirección del inmueble"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600 focus:ring-2 disabled:opacity-60"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block sm:col-span-1">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Fecha
                </span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600 focus:ring-2 disabled:opacity-60"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Hora inicio
                </span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600 focus:ring-2 disabled:opacity-60"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Hora fin
                </span>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600 focus:ring-2 disabled:opacity-60"
                />
              </label>
            </div>

            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Color del evento
              </span>
              <div className="flex flex-wrap gap-2">
                {GOOGLE_CALENDAR_COLORS.map((color) => {
                  const selected = colorId === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      title={color.label}
                      disabled={loading}
                      onClick={() => setColorId(color.id)}
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

            {canCreateEvents ? (
              <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={createInGoogleCalendar}
                  onChange={(event) =>
                    setCreateInGoogleCalendar(event.target.checked)
                  }
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                <span className="text-sm text-slate-700">
                  Crear evento en Google Calendar
                </span>
              </label>
            ) : calendarConnected ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Google Calendar está conectado solo con permiso de lectura. Ve a
                Ajustes → Google Calendar → <strong>Reconectar</strong> y acepta
                los permisos para crear eventos.
              </p>
            ) : (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Google Calendar no está conectado. Se guardará la gestión sin
                crear evento. Conéctalo en Ajustes o Calendario.
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !summary.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar gestión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function toCalendarEventPayload(
  values: GestionCalendarEventFormValues,
): {
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  timeZone: string;
  colorId?: string;
} {
  const start = buildLocalDateTime(values.date, values.startTime);
  const end = buildLocalDateTime(values.date, values.endTime);

  return {
    summary: values.summary,
    description: values.description || undefined,
    location: values.location || undefined,
    start,
    end,
    timeZone: CALENDAR_EVENT_TIME_ZONE,
    colorId: values.colorId,
  };
}

export function toScheduledGestionIso(
  values: GestionCalendarEventFormValues,
): string {
  return new Date(
    buildLocalDateTime(values.date, values.startTime),
  ).toISOString();
}

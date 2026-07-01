'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CoconutBrandedDialog,
  CoconutBrandedDialogCancelButton,
  CoconutBrandedDialogFooter,
  CoconutBrandedDialogPrimaryButton,
  COCONUT_DIALOG_INPUT_CLASS,
  COCONUT_DIALOG_LABEL_CLASS,
} from '@/components/CoconutBrandedDialog';
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
    setLocation(
      gestionEstado === 'videollamada'
        ? ''
        : (inmuebleLabel?.trim() ?? ''),
    );
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
    <CoconutBrandedDialog
      open={open}
      onClose={onCancel}
      blockClose={loading}
      title={titleLabel}
      subtitle="CALENDARIO"
      titleId="gestion-calendar-dialog-title"
      size="md"
      align="left"
      scrollable
      zIndexClass="z-[300]"
      bodyClassName="!pb-4"
      description={
        <>
          {clienteNombre}
          {inmuebleLabel ? ` · ${inmuebleLabel}` : ''}
        </>
      }
      footer={
        <CoconutBrandedDialogFooter align="end">
          <CoconutBrandedDialogCancelButton onClick={onCancel} disabled={loading}>
            Cancelar
          </CoconutBrandedDialogCancelButton>
          <CoconutBrandedDialogPrimaryButton
            type="submit"
            form="gestion-calendar-event-form"
            disabled={loading || !summary.trim()}
            loading={loading}
          >
            Guardar gestión
          </CoconutBrandedDialogPrimaryButton>
        </CoconutBrandedDialogFooter>
      }
    >
      <form
        id="gestion-calendar-event-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
            <label className="block">
              <span className={COCONUT_DIALOG_LABEL_CLASS}>Título</span>
              <input
                type="text"
                required
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                disabled={loading}
                className={COCONUT_DIALOG_INPUT_CLASS}
              />
            </label>

            <label className="block">
              <span className={COCONUT_DIALOG_LABEL_CLASS}>Descripción</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={loading}
                rows={3}
                className={`${COCONUT_DIALOG_INPUT_CLASS} resize-y`}
              />
            </label>

            <label className="block">
              <span className={COCONUT_DIALOG_LABEL_CLASS}>
                {gestionEstado === 'videollamada' ? 'Enlace / notas' : 'Ubicación'}
              </span>
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                disabled={loading}
                placeholder={
                  gestionEstado === 'videollamada'
                    ? 'Enlace Meet, Zoom…'
                    : 'Dirección del inmueble'
                }
                className={COCONUT_DIALOG_INPUT_CLASS}
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block sm:col-span-1">
                <span className={COCONUT_DIALOG_LABEL_CLASS}>Fecha</span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  disabled={loading}
                  className={COCONUT_DIALOG_INPUT_CLASS}
                />
              </label>
              <label className="block">
                <span className={COCONUT_DIALOG_LABEL_CLASS}>Hora inicio</span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  disabled={loading}
                  className={COCONUT_DIALOG_INPUT_CLASS}
                />
              </label>
              <label className="block">
                <span className={COCONUT_DIALOG_LABEL_CLASS}>Hora fin</span>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  disabled={loading}
                  className={COCONUT_DIALOG_INPUT_CLASS}
                />
              </label>
            </div>

            <div>
              <span className={`${COCONUT_DIALOG_LABEL_CLASS} mb-2`}>
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
                  className="mt-0.5 h-4 w-4 rounded border-[#eadfcd] text-[#b8924b]"
                />
                <span className="text-sm text-[#5f574f]">
                  Crear evento en Google Calendar
                </span>
              </label>
            ) : calendarConnected ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                El calendario de la agencia está conectado solo con permiso de
                lectura. Un administrador debe reconectar Google Calendar con
                permiso de escritura.
              </p>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Google Calendar no está conectado. Se guardará la gestión sin
                crear evento. Un administrador debe conectarlo en Ajustes.
              </p>
            )}
      </form>
    </CoconutBrandedDialog>
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

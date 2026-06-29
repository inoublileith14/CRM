export type GoogleCalendarColorId =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11';

export type GoogleCalendarColorOption = {
  id: GoogleCalendarColorId;
  label: string;
  backgroundColor: string;
};

/** Google Calendar event color palette (colorId). */
export const GOOGLE_CALENDAR_COLORS: GoogleCalendarColorOption[] = [
  { id: '1', label: 'Lavanda', backgroundColor: '#7986cb' },
  { id: '2', label: 'Salvia', backgroundColor: '#33b679' },
  { id: '3', label: 'Uva', backgroundColor: '#8e24aa' },
  { id: '4', label: 'Flamingo', backgroundColor: '#e67c73' },
  { id: '5', label: 'Plátano', backgroundColor: '#f6bf26' },
  { id: '6', label: 'Mandarina', backgroundColor: '#f4511e' },
  { id: '7', label: 'Pavo real', backgroundColor: '#039be5' },
  { id: '8', label: 'Grafito', backgroundColor: '#616161' },
  { id: '9', label: 'Arándano', backgroundColor: '#3f51b5' },
  { id: '10', label: 'Albahaca', backgroundColor: '#0b8043' },
  { id: '11', label: 'Tomate', backgroundColor: '#d50000' },
];

export const DEFAULT_VISITA_COLOR_ID: GoogleCalendarColorId = '10';
export const DEFAULT_VIDEOLLAMADA_COLOR_ID: GoogleCalendarColorId = '3';

export const CALENDAR_EVENT_TIME_ZONE = 'Europe/Madrid';

export function getDefaultCalendarColorId(
  gestionEstado: 'visita_concertada' | 'videollamada',
): GoogleCalendarColorId {
  return gestionEstado === 'videollamada'
    ? DEFAULT_VIDEOLLAMADA_COLOR_ID
    : DEFAULT_VISITA_COLOR_ID;
}

export function padTimePart(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${padTimePart(date.getMonth() + 1)}-${padTimePart(date.getDate())}`;
}

export function formatTimeInputValue(date: Date): string {
  return `${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}`;
}

export function getDefaultEventStart(): Date {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  if (date.getHours() >= 20) {
    date.setDate(date.getDate() + 1);
    date.setHours(10, 0, 0, 0);
  }
  return date;
}

export function addMinutesToDate(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function buildLocalDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function buildEventTitle(
  gestionEstado: 'visita_concertada' | 'videollamada',
  clienteNombre: string,
  inmuebleLabel: string | null,
): string {
  const prefix =
    gestionEstado === 'videollamada' ? 'Videollamada' : 'Visita';
  const parts = [prefix, clienteNombre.trim()];
  if (inmuebleLabel?.trim()) {
    parts.push(inmuebleLabel.trim());
  }
  return parts.join(' - ');
}

export function buildEventDescription(input: {
  clienteTelefono: string | null;
  clienteRef: string | null;
  clienteNotas: string | null;
}): string {
  const lines: string[] = [];
  if (input.clienteTelefono?.trim()) {
    lines.push(`Teléfono: ${input.clienteTelefono.trim()}`);
  }
  if (input.clienteRef?.trim()) {
    lines.push(`Referencia: ${input.clienteRef.trim()}`);
  }
  if (input.clienteNotas?.trim()) {
    lines.push(`Notas: ${input.clienteNotas.trim()}`);
  }
  return lines.join('\n');
}

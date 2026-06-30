import { parseApiResponse } from './parse-api-error';
import { ApiError } from './api';
import type { CalendarEventItem } from '@/types/calendar';

export interface CreateCalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  timeZone?: string;
  colorId?: string;
  allDay?: boolean;
}

export interface CreatedCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string | null;
  htmlLink: string | null;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor',
      0,
      'NETWORK_ERROR',
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw parseApiResponse(data, res);
  }

  return data as T;
}

export interface UpdateCalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  timeZone?: string;
  colorId?: string;
  allDay?: boolean;
}

export function createCalendarEvent(
  payload: CreateCalendarEventPayload,
): Promise<CreatedCalendarEvent> {
  return request<CreatedCalendarEvent>('/api/calendar/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateCalendarEvent(
  eventId: string,
  payload: UpdateCalendarEventPayload,
): Promise<CalendarEventItem> {
  return request<CalendarEventItem>(
    `/api/calendar/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

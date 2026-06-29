export interface UserGoogleCalendarRow {
  user_id: string;
  refresh_token: string;
  access_token: string | null;
  token_expires_at: string | null;
  google_email: string | null;
  calendar_id: string;
  connected_at: string;
  updated_at: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface CalendarConnectionStatus {
  connected: boolean;
  googleEmail: string | null;
  calendarId: string | null;
  connectedAt: string | null;
  canCreateEvents: boolean;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  location: string | null;
  htmlLink: string | null;
}

export interface CreateCalendarEventResult {
  id: string;
  title: string;
  start: string;
  end: string | null;
  htmlLink: string | null;
}

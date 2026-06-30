export interface UserGoogleCalendarRow {
  user_id: string;
  refresh_token: string;
  access_token: string | null;
  token_expires_at: string | null;
  google_email: string | null;
  calendar_id: string;
  connected_at: string;
  updated_at: string;
  watch_channel_id: string | null;
  watch_resource_id: string | null;
  watch_expiration_ms: number | null;
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
  pushSyncEnabled: boolean;
  isShared: boolean;
  canManageConnection: boolean;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string | null;
  allDay: boolean;
  location: string | null;
  htmlLink: string | null;
  backgroundColor: string | null;
  foregroundColor: string | null;
  colorId: string | null;
}

export interface CreateCalendarEventResult {
  id: string;
  title: string;
  start: string;
  end: string | null;
  htmlLink: string | null;
}

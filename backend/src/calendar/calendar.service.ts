import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { createOAuthState, verifyOAuthState } from './calendar-oauth.state';
import {
  CalendarConnectionStatus,
  CalendarEventItem,
  CreateCalendarEventResult,
  GoogleTokenResponse,
  UserGoogleCalendarRow,
} from './interfaces/user-google-calendar.interface';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';

const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

const CALENDAR_WRITE_SCOPES = new Set([
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]);

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private config: ConfigService,
    private supabase: SupabaseService,
  ) {}

  getConnectUrl(userId: string): { url: string } {
    const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.config.getOrThrow<string>('GOOGLE_REDIRECT_URI');
    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    const state = createOAuthState(userId, secret);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_OAUTH_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  async handleCallback(
    userId: string,
    code: string,
    state: string,
  ): Promise<{ connected: true; googleEmail: string | null }> {
    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    if (!verifyOAuthState(state, secret, userId)) {
      throw new BadRequestException({
        message: 'Estado OAuth no válido o expirado',
        code: 'CALENDAR_OAUTH_STATE_INVALID',
      });
    }

    const tokens = await this.exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      throw new BadRequestException({
        message:
          'Google no devolvió refresh token. Revoca el acceso en tu cuenta Google y vuelve a conectar.',
        code: 'CALENDAR_NO_REFRESH_TOKEN',
      });
    }

    const googleEmail = await this.fetchGoogleEmail(tokens.access_token);
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000,
    ).toISOString();

    const admin = this.supabase.getAdmin();
    const { error } = await admin.from('user_google_calendar').upsert(
      {
        user_id: userId,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        token_expires_at: expiresAt,
        google_email: googleEmail,
        calendar_id: 'primary',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      this.logger.error(`Error guardando tokens Google: ${error.message}`);
      throw new InternalServerErrorException({
        message: 'No se pudo guardar la conexión con Google Calendar',
        code: 'CALENDAR_STORE_FAILED',
      });
    }

    return { connected: true, googleEmail };
  }

  async getStatus(userId: string): Promise<CalendarConnectionStatus> {
    const row = await this.findByUserId(userId);
    if (!row) {
      return {
        connected: false,
        googleEmail: null,
        calendarId: null,
        connectedAt: null,
        canCreateEvents: false,
      };
    }

    let canCreateEvents = false;
    try {
      const accessToken = await this.getValidAccessToken(userId);
      const scopes = await this.fetchTokenScopes(accessToken);
      canCreateEvents = this.hasCalendarWriteScope(scopes);
    } catch {
      canCreateEvents = false;
    }

    return {
      connected: true,
      googleEmail: row.google_email,
      calendarId: row.calendar_id,
      connectedAt: row.connected_at,
      canCreateEvents,
    };
  }

  async disconnect(userId: string): Promise<{ disconnected: true }> {
    const admin = this.supabase.getAdmin();
    const { error } = await admin
      .from('user_google_calendar')
      .delete()
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Error desconectando Google Calendar: ${error.message}`);
      throw new InternalServerErrorException({
        message: 'No se pudo desconectar Google Calendar',
        code: 'CALENDAR_DISCONNECT_FAILED',
      });
    }

    return { disconnected: true };
  }

  async getValidAccessToken(userId: string): Promise<string> {
    const row = await this.findByUserId(userId);
    if (!row) {
      throw new BadRequestException({
        message: 'Google Calendar no está conectado',
        code: 'CALENDAR_NOT_CONNECTED',
      });
    }

    const expiresAt = row.token_expires_at
      ? new Date(row.token_expires_at).getTime()
      : 0;
    const stillValid = row.access_token && expiresAt > Date.now() + 60_000;

    if (stillValid && row.access_token) {
      return row.access_token;
    }

    const tokens = await this.refreshAccessToken(row.refresh_token);
    const newExpiresAt = new Date(
      Date.now() + tokens.expires_in * 1000,
    ).toISOString();

    const admin = this.supabase.getAdmin();
    await admin
      .from('user_google_calendar')
      .update({
        access_token: tokens.access_token,
        token_expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return tokens.access_token;
  }

  async listUpcomingEvents(
    userId: string,
    maxResults = 25,
  ): Promise<CalendarEventItem[]> {
    const row = await this.findByUserId(userId);
    if (!row) {
      throw new BadRequestException({
        message: 'Google Calendar no está conectado',
        code: 'CALENDAR_NOT_CONNECTED',
      });
    }

    const accessToken = await this.getValidAccessToken(userId);
    const calendarId = row.calendar_id || 'primary';
    const params = new URLSearchParams({
      timeMin: new Date().toISOString(),
      maxResults: String(maxResults),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const data = (await res.json().catch(() => ({}))) as {
      items?: Array<{
        id?: string;
        summary?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
        location?: string;
        htmlLink?: string;
      }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      this.logger.warn(
        `Google events list failed: ${data.error?.message ?? res.status}`,
      );
      throw new BadRequestException({
        message:
          data.error?.message ?? 'No se pudieron cargar los eventos del calendario',
        code: 'CALENDAR_EVENTS_FAILED',
      });
    }

    return (data.items ?? []).map((event) => {
      const startRaw = event.start?.dateTime ?? event.start?.date ?? '';
      const endRaw = event.end?.dateTime ?? event.end?.date ?? null;
      const allDay = Boolean(event.start?.date && !event.start?.dateTime);

      return {
        id: event.id ?? '',
        title: event.summary ?? '(Sin título)',
        start: startRaw,
        end: endRaw,
        allDay,
        location: event.location ?? null,
        htmlLink: event.htmlLink ?? null,
      };
    });
  }

  async createEvent(
    userId: string,
    dto: CreateCalendarEventDto,
  ): Promise<CreateCalendarEventResult> {
    const summary = dto.summary?.trim();
    if (!summary) {
      throw new BadRequestException({
        message: 'El título del evento es obligatorio',
        code: 'CALENDAR_EVENT_TITLE_REQUIRED',
      });
    }

    if (!dto.start?.trim() || !dto.end?.trim()) {
      throw new BadRequestException({
        message: 'La fecha y hora de inicio y fin son obligatorias',
        code: 'CALENDAR_EVENT_DATETIME_REQUIRED',
      });
    }

    const startMs = Date.parse(dto.start);
    const endMs = Date.parse(dto.end);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      throw new BadRequestException({
        message: 'Fecha u hora no válida',
        code: 'CALENDAR_EVENT_DATETIME_INVALID',
      });
    }

    if (endMs <= startMs) {
      throw new BadRequestException({
        message: 'La hora de fin debe ser posterior a la de inicio',
        code: 'CALENDAR_EVENT_END_BEFORE_START',
      });
    }

    const row = await this.findByUserId(userId);
    if (!row) {
      throw new BadRequestException({
        message: 'Google Calendar no está conectado',
        code: 'CALENDAR_NOT_CONNECTED',
      });
    }

    const accessToken = await this.getValidAccessToken(userId);
    const calendarId = row.calendar_id || 'primary';
    const timeZone = dto.timeZone?.trim() || 'Europe/Madrid';

    const body: Record<string, unknown> = {
      summary,
      start: { dateTime: dto.start, timeZone },
      end: { dateTime: dto.end, timeZone },
    };

    if (dto.description?.trim()) {
      body.description = dto.description.trim();
    }
    if (dto.location?.trim()) {
      body.location = dto.location.trim();
    }
    if (dto.colorId?.trim()) {
      body.colorId = dto.colorId.trim();
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      htmlLink?: string;
      error?: { message?: string };
    };

    if (!res.ok) {
      const errorMessage = data.error?.message ?? '';
      this.logger.warn(
        `Google event create failed: ${errorMessage || res.status}`,
      );

      if (this.isInsufficientScopeError(errorMessage)) {
        throw new BadRequestException({
          message:
            'Tu conexión con Google Calendar no tiene permiso para crear eventos. Ve a Ajustes, desconecta Google Calendar y vuelve a conectar.',
          code: 'CALENDAR_SCOPE_INSUFFICIENT',
        });
      }

      throw new BadRequestException({
        message:
          errorMessage || 'No se pudo crear el evento en Google Calendar',
        code: 'CALENDAR_EVENT_CREATE_FAILED',
      });
    }

    return {
      id: data.id ?? '',
      title: data.summary ?? summary,
      start: data.start?.dateTime ?? data.start?.date ?? dto.start,
      end: data.end?.dateTime ?? data.end?.date ?? dto.end,
      htmlLink: data.htmlLink ?? null,
    };
  }

  private async findByUserId(
    userId: string,
  ): Promise<UserGoogleCalendarRow | null> {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('user_google_calendar')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error leyendo tokens Google: ${error.message}`);
      throw new InternalServerErrorException({
        message: 'No se pudo leer la conexión con Google Calendar',
        code: 'CALENDAR_READ_FAILED',
      });
    }

    return data as UserGoogleCalendarRow | null;
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<GoogleTokenResponse> {
    const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>(
      'GOOGLE_CLIENT_SECRET',
    );
    const redirectUri = this.config.getOrThrow<string>('GOOGLE_REDIRECT_URI');

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = (await res.json().catch(() => ({}))) as GoogleTokenResponse & {
      error?: string;
      error_description?: string;
    };

    if (!res.ok) {
      this.logger.warn(
        `Google token exchange failed: ${data.error ?? res.status}`,
      );
      throw new BadRequestException({
        message: data.error_description ?? 'Error al autorizar Google Calendar',
        code: 'CALENDAR_TOKEN_EXCHANGE_FAILED',
      });
    }

    return data;
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<GoogleTokenResponse> {
    const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>(
      'GOOGLE_CLIENT_SECRET',
    );

    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = (await res.json().catch(() => ({}))) as GoogleTokenResponse & {
      error?: string;
      error_description?: string;
    };

    if (!res.ok) {
      this.logger.warn(`Google token refresh failed: ${data.error ?? res.status}`);
      throw new BadRequestException({
        message:
          data.error_description ??
          'La sesión de Google Calendar expiró. Vuelve a conectar.',
        code: 'CALENDAR_TOKEN_REFRESH_FAILED',
      });
    }

    return data;
  }

  private async fetchTokenScopes(accessToken: string): Promise<string | null> {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );

    if (!res.ok) {
      this.logger.warn(`Google tokeninfo failed: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as { scope?: string };
    return data.scope ?? null;
  }

  private hasCalendarWriteScope(scope: string | null): boolean {
    if (!scope) return false;

    return scope
      .split(/\s+/)
      .some((value) => CALENDAR_WRITE_SCOPES.has(value));
  }

  private isInsufficientScopeError(message: string): boolean {
    const normalized = message.toLowerCase();
    return (
      normalized.includes('insufficient authentication scopes') ||
      normalized.includes('insufficientpermissions')
    );
  }

  private async fetchGoogleEmail(accessToken: string): Promise<string | null> {
    const res = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!res.ok) {
      this.logger.warn(`Google userinfo failed: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as { email?: string };
    return data.email ?? null;
  }
}

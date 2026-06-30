"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const supabase_service_1 = require("../supabase/supabase.service");
const auth_roles_1 = require("../auth/auth-roles");
const calendar_sync_service_1 = require("./calendar-sync.service");
const calendar_oauth_state_1 = require("./calendar-oauth.state");
const google_calendar_event_util_1 = require("./google-calendar-event.util");
const GOOGLE_OAUTH_SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
].join(' ');
const CALENDAR_WRITE_SCOPES = new Set([
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
]);
const WATCH_RENEW_BEFORE_MS = 24 * 60 * 60 * 1000;
const WATCH_TTL_MS = 6 * 24 * 60 * 60 * 1000;
const EVENTS_LIST_CACHE_TTL_MS = 20_000;
const WATCH_NOTIFY_DEBOUNCE_MS = 3_000;
let CalendarService = CalendarService_1 = class CalendarService {
    config;
    supabase;
    calendarSync;
    logger = new common_1.Logger(CalendarService_1.name);
    eventsListCache = new Map();
    watchNotifyTimers = new Map();
    constructor(config, supabase, calendarSync) {
        this.config = config;
        this.supabase = supabase;
        this.calendarSync = calendarSync;
    }
    getConnectUrl(userId) {
        const clientId = this.config.getOrThrow('GOOGLE_CLIENT_ID');
        const redirectUri = this.config.getOrThrow('GOOGLE_REDIRECT_URI');
        const secret = this.config.getOrThrow('JWT_SECRET');
        const state = (0, calendar_oauth_state_1.createOAuthState)(userId, secret);
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
    async handleCallback(userId, code, state) {
        const secret = this.config.getOrThrow('JWT_SECRET');
        if (!(0, calendar_oauth_state_1.verifyOAuthState)(state, secret, userId)) {
            throw new common_1.BadRequestException({
                message: 'Estado OAuth no válido o expirado',
                code: 'CALENDAR_OAUTH_STATE_INVALID',
            });
        }
        const tokens = await this.exchangeCodeForTokens(code);
        if (!tokens.refresh_token) {
            throw new common_1.BadRequestException({
                message: 'Google no devolvió refresh token. Revoca el acceso en tu cuenta Google y vuelve a conectar.',
                code: 'CALENDAR_NO_REFRESH_TOKEN',
            });
        }
        const googleEmail = await this.fetchGoogleEmail(tokens.access_token);
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
        const admin = this.supabase.getAdmin();
        const { error } = await admin.from('user_google_calendar').upsert({
            user_id: userId,
            refresh_token: tokens.refresh_token,
            access_token: tokens.access_token,
            token_expires_at: expiresAt,
            google_email: googleEmail,
            calendar_id: 'primary',
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        if (error) {
            this.logger.error(`Error guardando tokens Google: ${error.message}`);
            throw new common_1.InternalServerErrorException({
                message: 'No se pudo guardar la conexión con Google Calendar',
                code: 'CALENDAR_STORE_FAILED',
            });
        }
        await this.ensureWatchChannel(userId).catch((watchError) => {
            this.logger.warn(`No se pudo registrar watch de Google Calendar: ${String(watchError)}`);
        });
        return { connected: true, googleEmail };
    }
    async getStatus(userId, userRol) {
        const ctx = await this.resolveCalendarContext(userId);
        const canManageConnection = (0, auth_roles_1.isAdminUser)(userRol);
        if (!ctx) {
            return {
                connected: false,
                googleEmail: null,
                calendarId: null,
                connectedAt: null,
                canCreateEvents: false,
                pushSyncEnabled: false,
                isShared: false,
                canManageConnection,
            };
        }
        const { ownerUserId, row, isShared } = ctx;
        let canCreateEvents = false;
        try {
            const accessToken = await this.getValidAccessToken(ownerUserId);
            const scopes = await this.fetchTokenScopes(accessToken);
            canCreateEvents = this.hasCalendarWriteScope(scopes);
        }
        catch {
            canCreateEvents = false;
        }
        const watchActive = Boolean(row.watch_channel_id) &&
            Boolean(row.watch_expiration_ms) &&
            row.watch_expiration_ms > Date.now();
        return {
            connected: true,
            googleEmail: row.google_email,
            calendarId: row.calendar_id,
            connectedAt: row.connected_at,
            canCreateEvents,
            pushSyncEnabled: Boolean(this.getWebhookUrl() && watchActive),
            isShared,
            canManageConnection,
        };
    }
    async disconnect(userId) {
        await this.stopWatchChannel(userId).catch((error) => {
            this.logger.warn(`Error deteniendo watch al desconectar: ${String(error)}`);
        });
        const admin = this.supabase.getAdmin();
        const { error } = await admin
            .from('user_google_calendar')
            .delete()
            .eq('user_id', userId);
        if (error) {
            this.logger.error(`Error desconectando Google Calendar: ${error.message}`);
            throw new common_1.InternalServerErrorException({
                message: 'No se pudo desconectar Google Calendar',
                code: 'CALENDAR_DISCONNECT_FAILED',
            });
        }
        return { disconnected: true };
    }
    async getValidAccessToken(userId) {
        const row = await this.findByUserId(userId);
        if (!row) {
            throw new common_1.BadRequestException({
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
        const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
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
    async listEvents(userId, options) {
        const ctx = await this.requireCalendarContext(userId);
        const { ownerUserId, row } = ctx;
        const cacheKey = this.eventsListCacheKey(ownerUserId, options?.from, options?.to, options?.maxResults);
        const cached = this.eventsListCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }
        const accessToken = await this.getValidAccessToken(ownerUserId);
        const calendarId = row.calendar_id || 'primary';
        const calendarColorId = await this.fetchCalendarListColorId(accessToken, calendarId);
        const timeMin = options?.from?.trim() || new Date().toISOString();
        const timeMax = options?.to?.trim();
        const maxResults = options?.maxResults ?? (timeMax ? 250 : 25);
        const params = new URLSearchParams({
            timeMin,
            maxResults: String(maxResults),
            singleEvents: 'true',
            orderBy: 'startTime',
        });
        if (timeMax) {
            params.set('timeMax', timeMax);
        }
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = (await res.json().catch(() => ({})));
        if (!res.ok) {
            this.logger.warn(`Google events list failed: ${data.error?.message ?? res.status}`);
            throw new common_1.BadRequestException({
                message: data.error?.message ?? 'No se pudieron cargar los eventos del calendario',
                code: 'CALENDAR_EVENTS_FAILED',
            });
        }
        const items = (data.items ?? []).map((event) => (0, google_calendar_event_util_1.mapGoogleEventToCalendarItem)(event, calendarColorId));
        this.eventsListCache.set(cacheKey, {
            expiresAt: Date.now() + EVENTS_LIST_CACHE_TTL_MS,
            data: items,
        });
        return items;
    }
    async fetchCalendarListColorId(accessToken, calendarId) {
        try {
            const res = await fetch(`https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(calendarId)}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = (await res.json().catch(() => ({})));
            if (!res.ok)
                return null;
            return data.colorId ?? null;
        }
        catch {
            return null;
        }
    }
    async createEvent(userId, dto) {
        const summary = dto.summary?.trim();
        if (!summary) {
            throw new common_1.BadRequestException({
                message: 'El título del evento es obligatorio',
                code: 'CALENDAR_EVENT_TITLE_REQUIRED',
            });
        }
        if (!dto.start?.trim() || !dto.end?.trim()) {
            throw new common_1.BadRequestException({
                message: 'La fecha y hora de inicio y fin son obligatorias',
                code: 'CALENDAR_EVENT_DATETIME_REQUIRED',
            });
        }
        try {
            (0, google_calendar_event_util_1.validateEventDateTimes)(dto.start, dto.end, dto.allDay);
        }
        catch (error) {
            const code = error instanceof Error
                ? error.message
                : 'CALENDAR_EVENT_DATETIME_INVALID';
            throw new common_1.BadRequestException({
                message: this.eventDateTimeErrorMessage(code),
                code,
            });
        }
        const ctx = await this.requireCalendarContext(userId);
        const { ownerUserId, row } = ctx;
        const accessToken = await this.getValidAccessToken(ownerUserId);
        const calendarId = row.calendar_id || 'primary';
        const body = (0, google_calendar_event_util_1.buildGoogleEventBody)({
            summary,
            description: dto.description?.trim() ?? '',
            location: dto.location?.trim() ?? '',
            start: dto.start,
            end: dto.end,
            timeZone: dto.timeZone,
            colorId: dto.colorId,
            allDay: dto.allDay,
        });
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({})));
        if (!res.ok) {
            const errorMessage = data.error?.message ?? '';
            this.logger.warn(`Google event create failed: ${errorMessage || res.status}`);
            if (this.isInsufficientScopeError(errorMessage)) {
                throw new common_1.BadRequestException({
                    message: 'Tu conexión con Google Calendar no tiene permiso para crear eventos. Ve a Ajustes, desconecta Google Calendar y vuelve a conectar.',
                    code: 'CALENDAR_SCOPE_INSUFFICIENT',
                });
            }
            throw new common_1.BadRequestException({
                message: errorMessage || 'No se pudo crear el evento en Google Calendar',
                code: 'CALENDAR_EVENT_CREATE_FAILED',
            });
        }
        this.notifyCalendarChanged(ownerUserId);
        return {
            id: data.id ?? '',
            title: data.summary ?? summary,
            start: data.start?.dateTime ?? data.start?.date ?? dto.start,
            end: data.end?.dateTime ?? data.end?.date ?? dto.end,
            htmlLink: data.htmlLink ?? null,
        };
    }
    subscribeToStream(userId, res) {
        void this.resolveCalendarContext(userId).then((ctx) => {
            if (!ctx)
                return;
            void this.ensureWatchChannel(ctx.ownerUserId).catch((error) => {
                this.logger.warn(`No se pudo renovar watch al abrir stream: ${String(error)}`);
            });
        });
        return this.calendarSync.addSubscriber(userId, res);
    }
    async handleWatchNotification(headers) {
        const channelId = this.readHeader(headers, 'x-goog-channel-id');
        const resourceId = this.readHeader(headers, 'x-goog-resource-id');
        const state = this.readHeader(headers, 'x-goog-resource-state');
        if (!channelId)
            return;
        const userId = await this.findUserIdByWatchChannel(channelId, resourceId);
        if (!userId) {
            this.logger.warn(`Webhook de calendario desconocido: ${channelId}`);
            return;
        }
        if (state === 'sync') {
            return;
        }
        if (state === 'exists' || state === 'not_exists') {
            this.scheduleWatchNotify(userId);
        }
    }
    getWatchSupport() {
        const webhookUrl = this.getWebhookUrl();
        return {
            pushEnabled: Boolean(webhookUrl),
            webhookUrl,
        };
    }
    async ensureWatchChannel(userId) {
        const webhookUrl = this.getWebhookUrl();
        if (!webhookUrl) {
            this.logger.debug('Google Calendar watch omitido: falta GOOGLE_CALENDAR_WEBHOOK_URL HTTPS pública');
            return;
        }
        const row = await this.findByUserId(userId);
        if (!row)
            return;
        const expirationMs = row.watch_expiration_ms ?? 0;
        const renewNeeded = !row.watch_channel_id ||
            !row.watch_resource_id ||
            expirationMs <= Date.now() + WATCH_RENEW_BEFORE_MS;
        if (!renewNeeded)
            return;
        await this.stopWatchChannel(userId, row);
        const accessToken = await this.getValidAccessToken(userId);
        const calendarId = row.calendar_id || 'primary';
        const channelId = (0, crypto_1.randomUUID)();
        const expiration = Date.now() + WATCH_TTL_MS;
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: channelId,
                type: 'web_hook',
                address: webhookUrl,
                token: userId,
                expiration: String(expiration),
            }),
        });
        const data = (await res.json().catch(() => ({})));
        if (!res.ok) {
            throw new Error(data.error?.message ?? `watch failed: ${res.status}`);
        }
        const admin = this.supabase.getAdmin();
        const { error } = await admin
            .from('user_google_calendar')
            .update({
            watch_channel_id: data.id ?? channelId,
            watch_resource_id: data.resourceId ?? null,
            watch_expiration_ms: Number(data.expiration ?? expiration),
            updated_at: new Date().toISOString(),
        })
            .eq('user_id', userId);
        if (error) {
            throw new Error(error.message);
        }
        this.logger.log(`Google Calendar watch activo para usuario ${userId}`);
    }
    async stopWatchChannel(userId, row) {
        const current = row ?? (await this.findByUserId(userId));
        if (!current?.watch_channel_id || !current.watch_resource_id) {
            return;
        }
        try {
            const accessToken = await this.getValidAccessToken(userId);
            await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: current.watch_channel_id,
                    resourceId: current.watch_resource_id,
                }),
            });
        }
        catch (error) {
            this.logger.warn(`Error deteniendo canal watch: ${String(error)}`);
        }
        const admin = this.supabase.getAdmin();
        await admin
            .from('user_google_calendar')
            .update({
            watch_channel_id: null,
            watch_resource_id: null,
            watch_expiration_ms: null,
            updated_at: new Date().toISOString(),
        })
            .eq('user_id', userId);
    }
    async findUserIdByWatchChannel(channelId, resourceId) {
        const admin = this.supabase.getAdmin();
        const { data, error } = await admin
            .from('user_google_calendar')
            .select('user_id, watch_resource_id')
            .eq('watch_channel_id', channelId)
            .maybeSingle();
        if (error || !data)
            return null;
        if (resourceId && data.watch_resource_id !== resourceId)
            return null;
        return data.user_id;
    }
    getWebhookUrl() {
        const explicit = this.config.get('GOOGLE_CALENDAR_WEBHOOK_URL')?.trim();
        const publicBase = this.config
            .get('BACKEND_PUBLIC_URL')
            ?.trim()
            .replace(/\/+$/, '');
        const url = explicit || (publicBase ? `${publicBase}/calendar/webhook` : null);
        if (!url)
            return null;
        if (!url.startsWith('https://'))
            return null;
        if (/localhost|127\.0\.0\.1/i.test(url))
            return null;
        return url;
    }
    readHeader(headers, name) {
        const value = headers[name];
        if (Array.isArray(value))
            return value[0] ?? '';
        return value ?? '';
    }
    eventsListCacheKey(userId, from, to, maxResults) {
        return `${userId}:${from?.trim() ?? ''}:${to?.trim() ?? ''}:${maxResults ?? ''}`;
    }
    invalidateEventsListCache(userId) {
        const prefix = `${userId}:`;
        for (const key of this.eventsListCache.keys()) {
            if (key.startsWith(prefix)) {
                this.eventsListCache.delete(key);
            }
        }
    }
    scheduleWatchNotify(userId) {
        this.invalidateEventsListCache(userId);
        const existing = this.watchNotifyTimers.get(userId);
        if (existing)
            clearTimeout(existing);
        const timer = setTimeout(() => {
            this.watchNotifyTimers.delete(userId);
            this.calendarSync.notifyAll();
        }, WATCH_NOTIFY_DEBOUNCE_MS);
        this.watchNotifyTimers.set(userId, timer);
    }
    notifyCalendarChanged(ownerUserId) {
        this.invalidateEventsListCache(ownerUserId);
        this.calendarSync.notifyAll();
    }
    async updateEvent(userId, eventId, dto) {
        const summary = dto.summary?.trim();
        if (!summary) {
            throw new common_1.BadRequestException({
                message: 'El título del evento es obligatorio',
                code: 'CALENDAR_EVENT_TITLE_REQUIRED',
            });
        }
        if (!eventId?.trim()) {
            throw new common_1.BadRequestException({
                message: 'Identificador de evento no válido',
                code: 'CALENDAR_EVENT_ID_REQUIRED',
            });
        }
        try {
            (0, google_calendar_event_util_1.validateEventDateTimes)(dto.start, dto.end, dto.allDay);
        }
        catch (error) {
            const code = error instanceof Error
                ? error.message
                : 'CALENDAR_EVENT_DATETIME_INVALID';
            throw new common_1.BadRequestException({
                message: this.eventDateTimeErrorMessage(code),
                code,
            });
        }
        const ctx = await this.requireCalendarContext(userId);
        const { ownerUserId, row } = ctx;
        const accessToken = await this.getValidAccessToken(ownerUserId);
        const calendarId = row.calendar_id || 'primary';
        const calendarColorId = await this.fetchCalendarListColorId(accessToken, calendarId);
        const body = (0, google_calendar_event_util_1.buildGoogleEventBody)({
            summary,
            description: dto.description?.trim() ?? '',
            location: dto.location?.trim() ?? '',
            start: dto.start,
            end: dto.end,
            timeZone: dto.timeZone,
            colorId: dto.colorId,
            allDay: dto.allDay,
        });
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({})));
        if (!res.ok) {
            const errorMessage = data.error?.message ?? '';
            this.logger.warn(`Google event update failed: ${errorMessage || res.status}`);
            if (this.isInsufficientScopeError(errorMessage)) {
                throw new common_1.BadRequestException({
                    message: 'Tu conexión con Google Calendar no tiene permiso para editar eventos. Ve a Ajustes, desconecta Google Calendar y vuelve a conectar.',
                    code: 'CALENDAR_SCOPE_INSUFFICIENT',
                });
            }
            throw new common_1.BadRequestException({
                message: errorMessage || 'No se pudo actualizar el evento en Google Calendar',
                code: 'CALENDAR_EVENT_UPDATE_FAILED',
            });
        }
        this.notifyCalendarChanged(ownerUserId);
        return (0, google_calendar_event_util_1.mapGoogleEventToCalendarItem)(data, calendarColorId);
    }
    eventDateTimeErrorMessage(code) {
        switch (code) {
            case 'CALENDAR_EVENT_DATETIME_REQUIRED':
                return 'La fecha y hora de inicio y fin son obligatorias';
            case 'CALENDAR_EVENT_END_BEFORE_START':
                return 'La hora de fin debe ser posterior a la de inicio';
            default:
                return 'Fecha u hora no válida';
        }
    }
    async resolveCalendarContext(requestingUserId) {
        const personal = await this.findByUserId(requestingUserId);
        if (personal) {
            return {
                ownerUserId: requestingUserId,
                row: personal,
                isShared: false,
            };
        }
        const organization = await this.findOrganizationCalendar();
        if (!organization)
            return null;
        return {
            ownerUserId: organization.user_id,
            row: organization,
            isShared: organization.user_id !== requestingUserId,
        };
    }
    async requireCalendarContext(requestingUserId) {
        const ctx = await this.resolveCalendarContext(requestingUserId);
        if (!ctx) {
            throw new common_1.BadRequestException({
                message: 'Google Calendar no está conectado',
                code: 'CALENDAR_NOT_CONNECTED',
            });
        }
        return ctx;
    }
    async findOrganizationCalendar() {
        const admin = this.supabase.getAdmin();
        const { data: adminProfiles, error: profilesError } = await admin
            .from('profiles')
            .select('id')
            .in('rol', ['admin', 'administracion']);
        if (profilesError) {
            this.logger.error(`Error buscando admins para calendario compartido: ${profilesError.message}`);
            return null;
        }
        const adminIds = (adminProfiles ?? []).map((profile) => profile.id);
        if (adminIds.length === 0)
            return null;
        const { data, error } = await admin
            .from('user_google_calendar')
            .select('*')
            .in('user_id', adminIds)
            .order('updated_at', { ascending: false })
            .limit(1);
        if (error) {
            this.logger.error(`Error leyendo calendario compartido de admin: ${error.message}`);
            return null;
        }
        const row = data?.[0];
        return row ? row : null;
    }
    async findByUserId(userId) {
        const admin = this.supabase.getAdmin();
        const { data, error } = await admin
            .from('user_google_calendar')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error leyendo tokens Google: ${error.message}`);
            throw new common_1.InternalServerErrorException({
                message: 'No se pudo leer la conexión con Google Calendar',
                code: 'CALENDAR_READ_FAILED',
            });
        }
        return data;
    }
    async exchangeCodeForTokens(code) {
        const clientId = this.config.getOrThrow('GOOGLE_CLIENT_ID');
        const clientSecret = this.config.getOrThrow('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.config.getOrThrow('GOOGLE_REDIRECT_URI');
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
        const data = (await res.json().catch(() => ({})));
        if (!res.ok) {
            this.logger.warn(`Google token exchange failed: ${data.error ?? res.status}`);
            throw new common_1.BadRequestException({
                message: data.error_description ?? 'Error al autorizar Google Calendar',
                code: 'CALENDAR_TOKEN_EXCHANGE_FAILED',
            });
        }
        return data;
    }
    async refreshAccessToken(refreshToken) {
        const clientId = this.config.getOrThrow('GOOGLE_CLIENT_ID');
        const clientSecret = this.config.getOrThrow('GOOGLE_CLIENT_SECRET');
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
        const data = (await res.json().catch(() => ({})));
        if (!res.ok) {
            this.logger.warn(`Google token refresh failed: ${data.error ?? res.status}`);
            throw new common_1.BadRequestException({
                message: data.error_description ??
                    'La sesión de Google Calendar expiró. Vuelve a conectar.',
                code: 'CALENDAR_TOKEN_REFRESH_FAILED',
            });
        }
        return data;
    }
    async fetchTokenScopes(accessToken) {
        const res = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
        if (!res.ok) {
            this.logger.warn(`Google tokeninfo failed: ${res.status}`);
            return null;
        }
        const data = (await res.json());
        return data.scope ?? null;
    }
    hasCalendarWriteScope(scope) {
        if (!scope)
            return false;
        return scope
            .split(/\s+/)
            .some((value) => CALENDAR_WRITE_SCOPES.has(value));
    }
    isInsufficientScopeError(message) {
        const normalized = message.toLowerCase();
        return (normalized.includes('insufficient authentication scopes') ||
            normalized.includes('insufficientpermissions'));
    }
    async fetchGoogleEmail(accessToken) {
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
            this.logger.warn(`Google userinfo failed: ${res.status}`);
            return null;
        }
        const data = (await res.json());
        return data.email ?? null;
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = CalendarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        supabase_service_1.SupabaseService,
        calendar_sync_service_1.CalendarSyncService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
import { CalendarSyncService } from './calendar-sync.service';
import { CalendarConnectionStatus, CalendarEventItem, CreateCalendarEventResult } from './interfaces/user-google-calendar.interface';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
export declare class CalendarService {
    private config;
    private supabase;
    private calendarSync;
    private readonly logger;
    constructor(config: ConfigService, supabase: SupabaseService, calendarSync: CalendarSyncService);
    getConnectUrl(userId: string): {
        url: string;
    };
    handleCallback(userId: string, code: string, state: string): Promise<{
        connected: true;
        googleEmail: string | null;
    }>;
    getStatus(userId: string): Promise<CalendarConnectionStatus>;
    disconnect(userId: string): Promise<{
        disconnected: true;
    }>;
    getValidAccessToken(userId: string): Promise<string>;
    listEvents(userId: string, options?: {
        from?: string;
        to?: string;
        maxResults?: number;
    }): Promise<CalendarEventItem[]>;
    private fetchCalendarListColorId;
    createEvent(userId: string, dto: CreateCalendarEventDto): Promise<CreateCalendarEventResult>;
    subscribeToStream(userId: string, res: Response): () => void;
    handleWatchNotification(headers: Record<string, string | string[] | undefined>): Promise<void>;
    getWatchSupport(): {
        pushEnabled: boolean;
        webhookUrl: string | null;
    };
    private ensureWatchChannel;
    private stopWatchChannel;
    private findUserIdByWatchChannel;
    private getWebhookUrl;
    private readHeader;
    private notifyCalendarChanged;
    updateEvent(userId: string, eventId: string, dto: UpdateCalendarEventDto): Promise<CalendarEventItem>;
    private eventDateTimeErrorMessage;
    private findByUserId;
    private exchangeCodeForTokens;
    private refreshAccessToken;
    private fetchTokenScopes;
    private hasCalendarWriteScope;
    private isInsufficientScopeError;
    private fetchGoogleEmail;
}

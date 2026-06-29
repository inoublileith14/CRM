import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { CalendarConnectionStatus, CalendarEventItem, CreateCalendarEventResult } from './interfaces/user-google-calendar.interface';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
export declare class CalendarService {
    private config;
    private supabase;
    private readonly logger;
    constructor(config: ConfigService, supabase: SupabaseService);
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
    listUpcomingEvents(userId: string, maxResults?: number): Promise<CalendarEventItem[]>;
    createEvent(userId: string, dto: CreateCalendarEventDto): Promise<CreateCalendarEventResult>;
    private findByUserId;
    private exchangeCodeForTokens;
    private refreshAccessToken;
    private fetchTokenScopes;
    private hasCalendarWriteScope;
    private isInsufficientScopeError;
    private fetchGoogleEmail;
}

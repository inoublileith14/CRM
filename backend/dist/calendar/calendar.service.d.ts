import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { CalendarConnectionStatus, CalendarEventItem } from './interfaces/user-google-calendar.interface';
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
    private findByUserId;
    private exchangeCodeForTokens;
    private refreshAccessToken;
    private fetchGoogleEmail;
}

import { Request } from 'express';
import { UserProfile } from '../auth/interfaces/user.interface';
import { CalendarService } from './calendar.service';
export declare class CalendarController {
    private calendarService;
    constructor(calendarService: CalendarService);
    connect(req: Request & {
        user: UserProfile;
    }): {
        url: string;
    };
    callback(req: Request & {
        user: UserProfile;
    }, code: string, state: string): Promise<{
        connected: true;
        googleEmail: string | null;
    }> | {
        connected: boolean;
        error: string;
    };
    status(req: Request & {
        user: UserProfile;
    }): Promise<import("./interfaces/user-google-calendar.interface").CalendarConnectionStatus>;
    events(req: Request & {
        user: UserProfile;
    }): Promise<import("./interfaces/user-google-calendar.interface").CalendarEventItem[]>;
    disconnect(req: Request & {
        user: UserProfile;
    }): Promise<{
        disconnected: true;
    }>;
}

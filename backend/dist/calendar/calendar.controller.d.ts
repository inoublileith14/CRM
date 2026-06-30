import { Request } from 'express';
import type { Response } from 'express';
import { UserProfile } from '../auth/interfaces/user.interface';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
export declare class CalendarController {
    private calendarService;
    constructor(calendarService: CalendarService);
    private assertCanManageCalendar;
    handleWebhook(headers: Record<string, string | string[] | undefined>): Promise<{
        received: boolean;
    }>;
    stream(req: Request & {
        user: UserProfile;
    }, res: Response): void;
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
    watchSupport(): {
        pushEnabled: boolean;
        webhookUrl: string | null;
    };
    events(req: Request & {
        user: UserProfile;
    }, from?: string, to?: string): Promise<import("./interfaces/user-google-calendar.interface").CalendarEventItem[]>;
    createEvent(req: Request & {
        user: UserProfile;
    }, dto: CreateCalendarEventDto): Promise<import("./interfaces/user-google-calendar.interface").CreateCalendarEventResult>;
    updateEvent(req: Request & {
        user: UserProfile;
    }, eventId: string, dto: UpdateCalendarEventDto): Promise<import("./interfaces/user-google-calendar.interface").CalendarEventItem>;
    disconnect(req: Request & {
        user: UserProfile;
    }): Promise<{
        disconnected: true;
    }>;
}

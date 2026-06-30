import { CalendarEventItem } from './interfaces/user-google-calendar.interface';
export type GoogleCalendarApiEvent = {
    id?: string;
    summary?: string;
    description?: string;
    colorId?: string;
    start?: {
        dateTime?: string;
        date?: string;
    };
    end?: {
        dateTime?: string;
        date?: string;
    };
    location?: string;
    htmlLink?: string;
};
export declare function mapGoogleEventToCalendarItem(event: GoogleCalendarApiEvent, calendarColorId: string | null): CalendarEventItem;
export declare function buildGoogleEventBody(dto: {
    summary: string;
    description?: string;
    location?: string;
    start: string;
    end: string;
    timeZone?: string;
    colorId?: string;
    allDay?: boolean;
}): Record<string, unknown>;
export declare function validateEventDateTimes(start: string, end: string, allDay?: boolean): void;

export declare const GOOGLE_CALENDAR_EVENT_COLORS: Record<string, {
    background: string;
    foreground: string;
}>;
export declare const GOOGLE_CALENDAR_LIST_COLORS: Record<string, {
    background: string;
    foreground: string;
}>;
export declare function resolveGoogleEventColors(eventColorId: string | null | undefined, calendarColorId: string | null | undefined): {
    backgroundColor: string;
    foregroundColor: string;
};

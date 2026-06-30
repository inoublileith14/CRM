"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapGoogleEventToCalendarItem = mapGoogleEventToCalendarItem;
exports.buildGoogleEventBody = buildGoogleEventBody;
exports.validateEventDateTimes = validateEventDateTimes;
const google_calendar_colors_1 = require("./google-calendar-colors");
function mapGoogleEventToCalendarItem(event, calendarColorId) {
    const startRaw = event.start?.dateTime ?? event.start?.date ?? '';
    const endRaw = event.end?.dateTime ?? event.end?.date ?? null;
    const allDay = Boolean(event.start?.date && !event.start?.dateTime);
    const { backgroundColor, foregroundColor } = (0, google_calendar_colors_1.resolveGoogleEventColors)(event.colorId, calendarColorId);
    return {
        id: event.id ?? '',
        title: event.summary ?? '(Sin título)',
        description: event.description?.trim() ? event.description.trim() : null,
        start: startRaw,
        end: endRaw,
        allDay,
        location: event.location?.trim() ? event.location.trim() : null,
        htmlLink: event.htmlLink ?? null,
        backgroundColor,
        foregroundColor,
        colorId: event.colorId ?? null,
    };
}
function buildGoogleEventBody(dto) {
    const body = {
        summary: dto.summary,
    };
    if (dto.description !== undefined) {
        body.description = dto.description;
    }
    if (dto.location !== undefined) {
        body.location = dto.location;
    }
    if (dto.colorId?.trim()) {
        body.colorId = dto.colorId.trim();
    }
    else {
        body.colorId = null;
    }
    if (dto.allDay) {
        body.start = { date: dto.start.slice(0, 10) };
        body.end = { date: dto.end.slice(0, 10) };
    }
    else {
        const timeZone = dto.timeZone?.trim() || 'Europe/Madrid';
        body.start = { dateTime: dto.start, timeZone };
        body.end = { dateTime: dto.end, timeZone };
    }
    return body;
}
function validateEventDateTimes(start, end, allDay) {
    if (!start?.trim() || !end?.trim()) {
        throw new Error('CALENDAR_EVENT_DATETIME_REQUIRED');
    }
    if (allDay) {
        if (end.slice(0, 10) <= start.slice(0, 10)) {
            throw new Error('CALENDAR_EVENT_END_BEFORE_START');
        }
        return;
    }
    const startMs = Date.parse(start);
    const endMs = Date.parse(end);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
        throw new Error('CALENDAR_EVENT_DATETIME_INVALID');
    }
    if (endMs <= startMs) {
        throw new Error('CALENDAR_EVENT_END_BEFORE_START');
    }
}
//# sourceMappingURL=google-calendar-event.util.js.map
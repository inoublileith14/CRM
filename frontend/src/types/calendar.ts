export interface CalendarEventItem {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string | null;
  allDay: boolean;
  location: string | null;
  htmlLink: string | null;
  backgroundColor: string | null;
  foregroundColor: string | null;
  colorId: string | null;
}

export interface CalendarEventsRange {
  from: string;
  to: string;
}

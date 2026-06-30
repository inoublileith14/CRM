function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatCalendarRangeTitle(
  start: Date,
  end: Date,
  viewType: string,
  localeTag: string,
): string {
  const locale = localeTag.startsWith('es') ? 'es-ES' : localeTag;

  if (viewType === 'dayGridMonth') {
    const formatted = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    }).format(start);
    return capitalizeFirst(formatted);
  }

  if (viewType === 'timeGridDay') {
    const formatted = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(start);
    return capitalizeFirst(formatted);
  }

  const endInclusive = new Date(end);
  endInclusive.setMilliseconds(endInclusive.getMilliseconds() - 1);

  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'short' });
  const dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric' });
  const yearFmt = new Intl.DateTimeFormat(locale, { year: 'numeric' });

  const sameMonth =
    start.getMonth() === endInclusive.getMonth() &&
    start.getFullYear() === endInclusive.getFullYear();

  if (sameMonth) {
    const monthYear = new Intl.DateTimeFormat(locale, {
      month: 'short',
      year: 'numeric',
    }).format(start);
    return `${dayFmt.format(start)} – ${dayFmt.format(endInclusive)} ${capitalizeFirst(monthYear)}`;
  }

  const sameYear = start.getFullYear() === endInclusive.getFullYear();
  const monthStart = capitalizeFirst(monthFmt.format(start));
  const monthEnd = capitalizeFirst(monthFmt.format(endInclusive));
  const year = yearFmt.format(start);

  if (sameYear) {
    if (locale.startsWith('es')) {
      return `${monthStart} – ${monthEnd.toLowerCase()} de ${year}`;
    }
    return `${monthStart} – ${monthEnd} ${year}`;
  }

  return `${monthStart} ${yearFmt.format(start)} – ${monthEnd} ${yearFmt.format(endInclusive)}`;
}

export function formatListRangeTitle(
  from: string,
  to: string,
  localeTag: string,
): string {
  const start = new Date(from);
  const end = new Date(to);
  return formatCalendarRangeTitle(start, end, 'timeGridWeek', localeTag);
}

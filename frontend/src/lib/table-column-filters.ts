/** Google Sheets-style column filters (sort, condition, value checklist). */

export const BLANK_FILTER_VALUE = '(Vacío)';

export type SortDirection = 'asc' | 'desc';

export type TextConditionOp =
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty';

export type NumberConditionOp =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'is_empty'
  | 'is_not_empty';

export type ColumnFilterFieldType = 'text' | 'number' | 'date';

export interface ColumnFilterState {
  allowedValues: string[] | null;
  textCondition?: { op: TextConditionOp; value: string };
  numberCondition?: { op: NumberConditionOp; value: string };
}

export interface TableSort {
  column: string;
  direction: SortDirection;
}

export type ColumnFiltersMap = Record<string, ColumnFilterState | undefined>;

export interface TableColumnDef<T> {
  key: string;
  label: string;
  /** Shorter header text for dense tables (full label kept in tooltip). */
  shortLabel?: string;
  headClassName?: string;
  cellClassName?: string;
  fieldType?: ColumnFilterFieldType;
  getDisplayValue: (row: T) => string;
  getNumberValue?: (row: T) => number | null;
  getDateIso?: (row: T) => string | null;
}

export function toFilterDisplay(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '' || value === '—') {
    return BLANK_FILTER_VALUE;
  }
  return value;
}

export function isColumnFilterActive(
  filter: ColumnFilterState | undefined,
  uniqueValuesCount?: number,
): boolean {
  if (!filter) return false;
  if (filter.textCondition || filter.numberCondition) return true;
  if (filter.allowedValues === null) return false;
  if (filter.allowedValues.length === 0) return true;
  if (
    uniqueValuesCount !== undefined &&
    filter.allowedValues.length >= uniqueValuesCount
  ) {
    return false;
  }
  return true;
}

export function hasAnyColumnFilter(
  filters: ColumnFiltersMap,
  sort: TableSort | null,
): boolean {
  if (sort) return true;
  return Object.values(filters).some((f) => isColumnFilterActive(f));
}

export function getUniqueColumnValues<T>(
  rows: T[],
  column: TableColumnDef<T>,
): string[] {
  const values = new Set<string>();
  for (const row of rows) {
    values.add(column.getDisplayValue(row));
  }
  return sortFilterValues([...values]);
}

function sortFilterValues(values: string[]): string[] {
  return values.sort((a, b) => {
    if (a === BLANK_FILTER_VALUE) return 1;
    if (b === BLANK_FILTER_VALUE) return -1;
    return a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' });
  });
}

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function matchesTextCondition(
  display: string,
  op: TextConditionOp,
  needle: string,
): boolean {
  const isBlank = display === BLANK_FILTER_VALUE;
  const n = normalizeText(needle);

  switch (op) {
    case 'is_empty':
      return isBlank;
    case 'is_not_empty':
      return !isBlank;
    case 'contains':
      return !isBlank && normalizeText(display).includes(n);
    case 'not_contains':
      return isBlank || !normalizeText(display).includes(n);
    case 'equals':
      return !isBlank && normalizeText(display) === n;
    case 'not_equals':
      return isBlank || normalizeText(display) !== n;
    case 'starts_with':
      return !isBlank && normalizeText(display).startsWith(n);
    case 'ends_with':
      return !isBlank && normalizeText(display).endsWith(n);
    default:
      return true;
  }
}

function parseNumber(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n =
    typeof raw === 'number'
      ? raw
      : Number(
          String(raw).replace(/[^\d.,-]/g, '').replace(',', '.'),
        );
  return Number.isFinite(n) ? n : null;
}

function matchesNumberCondition(
  num: number | null,
  op: NumberConditionOp,
  value: string,
): boolean {
  const target = parseNumber(value);

  switch (op) {
    case 'is_empty':
      return num === null;
    case 'is_not_empty':
      return num !== null;
    case 'eq':
      return num !== null && target !== null && num === target;
    case 'neq':
      return num === null || target === null || num !== target;
    case 'gt':
      return num !== null && target !== null && num > target;
    case 'gte':
      return num !== null && target !== null && num >= target;
    case 'lt':
      return num !== null && target !== null && num < target;
    case 'lte':
      return num !== null && target !== null && num <= target;
    default:
      return true;
  }
}

function matchesDateCondition(
  display: string,
  iso: string | null | undefined,
  op: TextConditionOp,
  value: string,
): boolean {
  if (op === 'is_empty' || op === 'is_not_empty') {
    return matchesTextCondition(display, op, value);
  }

  if (!iso) return false;

  const cellDate = new Date(iso);
  const filterDate = new Date(value);
  if (Number.isNaN(cellDate.getTime()) || Number.isNaN(filterDate.getTime())) {
    return matchesTextCondition(display, op, value);
  }

  const cellDay = cellDate.toISOString().slice(0, 10);
  const filterDay = filterDate.toISOString().slice(0, 10);

  switch (op) {
    case 'equals':
      return cellDay === filterDay;
    case 'not_equals':
      return cellDay !== filterDay;
    case 'starts_with':
    case 'contains':
      return cellDay.includes(filterDay) || display.includes(value);
    case 'not_contains':
      return !cellDay.includes(filterDay) && !display.includes(value);
    default:
      return matchesTextCondition(display, op, value);
  }
}

function matchesColumnFilter<T>(
  row: T,
  column: TableColumnDef<T>,
  filter: ColumnFilterState,
): boolean {
  const display = column.getDisplayValue(row);
  const fieldType = column.fieldType ?? 'text';

  if (
    filter.allowedValues !== null &&
    !filter.allowedValues.includes(display)
  ) {
    return false;
  }

  if (filter.numberCondition && fieldType === 'number') {
    const num =
      column.getNumberValue?.(row) ?? parseNumber(display === BLANK_FILTER_VALUE ? null : display);
    if (
      !matchesNumberCondition(
        num,
        filter.numberCondition.op,
        filter.numberCondition.value,
      )
    ) {
      return false;
    }
  }

  if (filter.textCondition) {
    if (fieldType === 'date') {
      if (
        !matchesDateCondition(
          display,
          column.getDateIso?.(row),
          filter.textCondition.op,
          filter.textCondition.value,
        )
      ) {
        return false;
      }
    } else if (
      !matchesTextCondition(
        display,
        filter.textCondition.op,
        filter.textCondition.value,
      )
    ) {
      return false;
    }
  }

  return true;
}

function getCalendarSortKey(iso: string): number {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return (
      Number(match[1]) * 10_000 +
      Number(match[2]) * 100 +
      Number(match[3])
    );
  }
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function compareRows<T>(
  a: T,
  b: T,
  column: TableColumnDef<T>,
  direction: SortDirection,
): number {
  const mult = direction === 'asc' ? 1 : -1;
  const fieldType = column.fieldType ?? 'text';

  if (fieldType === 'date') {
    const isoA = column.getDateIso?.(a);
    const isoB = column.getDateIso?.(b);
    if (!isoA && !isoB) return 0;
    if (!isoA) return 1 * mult;
    if (!isoB) return -1 * mult;
    return (getCalendarSortKey(isoA) - getCalendarSortKey(isoB)) * mult;
  }

  const displayA = column.getDisplayValue(a);
  const displayB = column.getDisplayValue(b);

  if (displayA === BLANK_FILTER_VALUE && displayB !== BLANK_FILTER_VALUE) {
    return 1 * mult;
  }
  if (displayB === BLANK_FILTER_VALUE && displayA !== BLANK_FILTER_VALUE) {
    return -1 * mult;
  }

  if (fieldType === 'number') {
    const na =
      column.getNumberValue?.(a) ??
      parseNumber(displayA === BLANK_FILTER_VALUE ? null : displayA);
    const nb =
      column.getNumberValue?.(b) ??
      parseNumber(displayB === BLANK_FILTER_VALUE ? null : displayB);
    if (na === null && nb === null) return 0;
    if (na === null) return 1 * mult;
    if (nb === null) return -1 * mult;
    return (na - nb) * mult;
  }

  return (
    displayA.localeCompare(displayB, 'es', {
      numeric: true,
      sensitivity: 'base',
    }) * mult
  );
}

export function applyTableColumnFilters<T>(
  rows: T[],
  columns: TableColumnDef<T>[],
  filters: ColumnFiltersMap,
  sort: TableSort | null,
): T[] {
  const columnMap = new Map(columns.map((c) => [c.key, c]));

  let result = rows.filter((row) => {
    for (const [key, filter] of Object.entries(filters)) {
      if (!filter || !isColumnFilterActive(filter)) continue;
      const column = columnMap.get(key);
      if (!column) continue;
      if (!matchesColumnFilter(row, column, filter)) return false;
    }
    return true;
  });

  if (sort) {
    const column = columnMap.get(sort.column);
    if (column) {
      result = [...result].sort((a, b) =>
        compareRows(a, b, column, sort.direction),
      );
    }
  }

  return result;
}

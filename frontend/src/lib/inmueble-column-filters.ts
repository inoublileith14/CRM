import {
  formatInmuebleCell,
  toInmuebleCellValue,
} from '@/lib/inmueble-table-utils';
import {
  applyTableColumnFilters,
  BLANK_FILTER_VALUE,
  getUniqueColumnValues as getUniqueTableColumnValues,
  hasAnyColumnFilter,
  isColumnFilterActive,
  TableColumnDef,
  TableSort,
} from '@/lib/table-column-filters';
import type {
  ColumnFilterFieldType,
  ColumnFilterState,
  ColumnFiltersMap,
  SortDirection,
} from '@/lib/table-column-filters';
import { Inmueble, InmuebleFormData } from '@/types/inmueble';

export type {
  ColumnFilterFieldType,
  ColumnFilterState,
  ColumnFiltersMap,
  SortDirection,
};
export { BLANK_FILTER_VALUE, hasAnyColumnFilter, isColumnFilterActive };

export type InmuebleTableSort = TableSort & { column: keyof InmuebleFormData };

const NUMBER_KEYS = new Set<keyof InmuebleFormData>([
  'precio',
  'hab',
  'banos',
  'metros',
]);

const DATE_KEYS = new Set<keyof InmuebleFormData>([
  'fecha_entrada_inmueble',
  'fecha_visitas',
]);

export function getColumnFilterFieldType(
  key: keyof InmuebleFormData,
): ColumnFilterFieldType {
  if (NUMBER_KEYS.has(key)) return 'number';
  if (DATE_KEYS.has(key)) return 'date';
  return 'text';
}

export function getInmuebleFilterDisplayValue(
  inmueble: Inmueble,
  key: keyof InmuebleFormData,
): string {
  const raw = toInmuebleCellValue(inmueble[key]);
  if (raw === null || raw === '') return BLANK_FILTER_VALUE;
  return formatInmuebleCell(key, raw);
}

export function buildInmuebleTableColumns(
  fields: { key: keyof InmuebleFormData; label: string }[],
): TableColumnDef<Inmueble>[] {
  return fields.map(({ key, label }) => ({
    key,
    label,
    fieldType: getColumnFilterFieldType(key),
    getDisplayValue: (row) => getInmuebleFilterDisplayValue(row, key),
    getNumberValue: (row) => {
      if (!NUMBER_KEYS.has(key)) return null;
      const raw = toInmuebleCellValue(row[key]);
      if (raw === null || raw === '') return null;
      return typeof raw === 'number' ? raw : Number(raw);
    },
    getDateIso: (row) => {
      if (!DATE_KEYS.has(key)) return null;
      const raw = toInmuebleCellValue(row[key]);
      return raw ? String(raw) : null;
    },
  }));
}

export function getUniqueColumnValues(
  inmuebles: Inmueble[],
  key: keyof InmuebleFormData,
): string[] {
  const column: TableColumnDef<Inmueble> = {
    key,
    label: key,
    fieldType: getColumnFilterFieldType(key),
    getDisplayValue: (row) => getInmuebleFilterDisplayValue(row, key),
  };
  return getUniqueTableColumnValues(inmuebles, column);
}

export function applyInmuebleColumnFilters(
  inmuebles: Inmueble[],
  filters: ColumnFiltersMap,
  sort: InmuebleTableSort | null,
  fields: { key: keyof InmuebleFormData; label: string }[],
): Inmueble[] {
  return applyTableColumnFilters(
    inmuebles,
    buildInmuebleTableColumns(fields),
    filters,
    sort,
  );
}

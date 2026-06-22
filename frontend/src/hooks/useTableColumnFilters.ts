'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  applyTableColumnFilters,
  ColumnFilterState,
  ColumnFiltersMap,
  getUniqueColumnValues,
  hasAnyColumnFilter,
  isColumnFilterActive,
  TableColumnDef,
  TableSort,
} from '@/lib/table-column-filters';

export function useTableColumnFilters<T>(rows: T[], columns: TableColumnDef<T>[]) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersMap>({});
  const [tableSort, setTableSort] = useState<TableSort | null>(null);
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);

  const columnUniqueValues = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const column of columns) {
      map.set(column.key, getUniqueColumnValues(rows, column));
    }
    return map;
  }, [rows, columns]);

  const filteredRows = useMemo(
    () => applyTableColumnFilters(rows, columns, columnFilters, tableSort),
    [rows, columns, columnFilters, tableSort],
  );

  const filtersActive = hasAnyColumnFilter(columnFilters, tableSort);

  function clearFilters() {
    setColumnFilters({});
    setTableSort(null);
    setOpenFilterColumn(null);
  }

  function setColumnFilter(key: string, filter: ColumnFilterState | undefined) {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (!filter) delete next[key];
      else next[key] = filter;
      return next;
    });
  }

  function setSort(column: string, direction: TableSort['direction']) {
    setTableSort({ column, direction });
  }

  function clearSort() {
    setTableSort(null);
  }

  function isFilterActiveForColumn(key: string): boolean {
    const unique = columnUniqueValues.get(key);
    return isColumnFilterActive(columnFilters[key], unique?.length);
  }

  return {
    columnFilters,
    tableSort,
    openFilterColumn,
    setOpenFilterColumn,
    columnUniqueValues,
    filteredRows,
    filtersActive,
    clearFilters,
    setColumnFilter,
    setSort,
    clearSort,
    isFilterActiveForColumn,
  };
}

/** Stable sentinel for inactive filter deps (never use inline `{}` in reset deps). */
export const STABLE_EMPTY_COLUMN_FILTERS: ColumnFiltersMap = {};

/** Reset pagination when column filters change (use alongside usePagination). */
export function useResetPageOnFilterChange(
  deps: unknown[],
  setPage: (page: number) => void,
) {
  const depsKey = JSON.stringify(deps);
  useEffect(() => {
    setPage(1);
  }, [depsKey, setPage]);
}

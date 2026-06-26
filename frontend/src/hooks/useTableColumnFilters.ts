'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  buildTableStateKey,
  loadPersistedTableState,
  savePersistedTableState,
} from '@/lib/persisted-table-state';

interface FiltersPersistedState {
  columnFilters: ColumnFiltersMap;
  tableSort: TableSort | null;
}

export interface UseTableColumnFiltersOptions {
  storageScope?: string;
  pathname?: string;
}

export function useTableColumnFilters<T>(
  rows: T[],
  columns: TableColumnDef<T>[],
  options?: UseTableColumnFiltersOptions,
) {
  const storageKey = options?.pathname
    ? `${buildTableStateKey(options.pathname, options.storageScope)}:column-filters`
    : null;

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersMap>({});
  const [tableSort, setTableSort] = useState<TableSort | null>(null);
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    if (!storageKey || hydratedRef.current) return;
    const saved = loadPersistedTableState<FiltersPersistedState>(storageKey, {
      columnFilters: {},
      tableSort: null,
    });
    setColumnFilters(saved.columnFilters ?? {});
    setTableSort(saved.tableSort ?? null);
    hydratedRef.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !hydratedRef.current) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    savePersistedTableState(storageKey, { columnFilters, tableSort });
  }, [storageKey, columnFilters, tableSort]);

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
  const skipFirstRef = useRef(true);
  const setPageRef = useRef(setPage);
  setPageRef.current = setPage;

  useEffect(() => {
    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      return;
    }
    setPageRef.current(1);
  }, [depsKey]);
}

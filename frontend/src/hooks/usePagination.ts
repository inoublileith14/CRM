'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildTableStateKey,
  loadPersistedTableState,
  savePersistedTableState,
} from '@/lib/persisted-table-state';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 'all'] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

/** Global clients list — no "all" (too slow); max 200 per page. */
export const CLIENTES_GENERAL_PAGE_SIZE_OPTIONS = [
  10, 20, 50, 100, 200,
] as const;
export type ClientesGeneralPageSize =
  (typeof CLIENTES_GENERAL_PAGE_SIZE_OPTIONS)[number];

export function resolveClientesGeneralPageSize(value: unknown): ClientesGeneralPageSize {
  if (value === 'all') return 200;
  if (
    value === 10 ||
    value === 20 ||
    value === 50 ||
    value === 100 ||
    value === 200
  ) {
    return value;
  }
  return DEFAULT_PAGE_SIZE === 'all' ? 100 : DEFAULT_PAGE_SIZE;
}

export function parseClientesGeneralPageSize(value: string): ClientesGeneralPageSize {
  const parsed = Number(value);
  if (
    parsed === 10 ||
    parsed === 20 ||
    parsed === 50 ||
    parsed === 100 ||
    parsed === 200
  ) {
    return parsed;
  }
  return 100;
}

export const DEFAULT_PAGE_SIZE: PageSize = 100;

interface PaginationPersistedState {
  page: number;
  pageSize: PageSize;
}

function resolvePageSize(size: PageSize, totalItems: number): number {
  if (size === 'all') {
    return Math.max(totalItems, 1);
  }
  return size;
}

export function parsePageSize(value: string): PageSize {
  if (value === 'all') return 'all';
  const parsed = Number(value);
  if (
    parsed === 10 ||
    parsed === 20 ||
    parsed === 50 ||
    parsed === 100
  ) {
    return parsed;
  }
  return DEFAULT_PAGE_SIZE;
}

export interface UsePaginationOptions {
  /** localStorage key suffix; full key is `{pathname}[:scope]:pagination` */
  storageScope?: string;
  pathname?: string;
}

export function usePagination<T>(
  items: T[],
  defaultPageSize: PageSize = DEFAULT_PAGE_SIZE,
  options?: UsePaginationOptions,
) {
  const storageKey = options?.pathname
    ? `${buildTableStateKey(options.pathname, options.storageScope)}:pagination`
    : null;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(defaultPageSize);
  const hydratedRef = useRef(false);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    if (!storageKey || hydratedRef.current) return;
    const saved = loadPersistedTableState<PaginationPersistedState>(
      storageKey,
      { page: 1, pageSize: defaultPageSize },
    );
    if (saved.page >= 1) setPage(saved.page);
    if (saved.pageSize) setPageSize(saved.pageSize);
    hydratedRef.current = true;
  }, [storageKey, defaultPageSize]);

  useEffect(() => {
    if (!storageKey) return;
    if (!hydratedRef.current) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    savePersistedTableState(storageKey, { page, pageSize });
  }, [storageKey, page, pageSize]);

  const totalItems = items.length;
  const effectivePageSize = resolvePageSize(pageSize, totalItems);
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * effectivePageSize;
    return items.slice(start, start + effectivePageSize);
  }, [items, page, effectivePageSize]);

  function changePageSize(size: PageSize) {
    setPageSize(size);
    setPage(1);
  }

  return {
    page,
    setPage,
    pageSize,
    setPageSize: changePageSize,
    totalItems,
    totalPages,
    paginatedItems,
  };
}

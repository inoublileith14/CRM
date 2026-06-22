import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 'all'] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE: PageSize = 100;

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

export function usePagination<T>(
  items: T[],
  defaultPageSize: PageSize = DEFAULT_PAGE_SIZE,
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(defaultPageSize);

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

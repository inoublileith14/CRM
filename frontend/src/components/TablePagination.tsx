'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  CLIENTES_GENERAL_PAGE_SIZE_OPTIONS,
  PAGE_SIZE_OPTIONS,
  PageSize,
  ClientesGeneralPageSize,
} from '@/hooks/usePagination';

interface TablePaginationProps {
  page: number;
  pageSize: PageSize | ClientesGeneralPageSize;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
  /** Defaults to PAGE_SIZE_OPTIONS (includes "Todas"). */
  pageSizeOptions?: readonly (PageSize | ClientesGeneralPageSize)[];
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const effectivePageSize =
    pageSize === 'all' ? totalItems : pageSize;
  const start = (page - 1) * effectivePageSize + 1;
  const end = Math.min(page * effectivePageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-4">
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <span>
          Mostrando <strong className="text-slate-800">{start}</strong>–
          <strong className="text-slate-800">{end}</strong> de{' '}
          <strong className="text-slate-800">{totalItems}</strong>
        </span>
        <label className="flex items-center gap-2">
          <span>Por página</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === 'all') {
                onPageSizeChange('all');
                return;
              }
              onPageSizeChange(Number(raw) as PageSize);
            }}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={String(size)} value={size}>
                {size === 'all' ? 'Todas' : size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>
        <span className="shrink-0 text-center text-sm text-slate-600">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

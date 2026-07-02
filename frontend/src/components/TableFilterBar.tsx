'use client';

import { CSSProperties } from 'react';
import { FilterX } from 'lucide-react';

interface TableFilterBarProps {
  filteredCount: number;
  totalCount: number;
  entityLabel?: string;
  hasSort?: boolean;
  onClear: () => void;
  className?: string;
  style?: CSSProperties;
  clearButtonClassName?: string;
  clearButtonStyle?: CSSProperties;
}

export function TableFilterBar({
  filteredCount,
  totalCount,
  entityLabel = 'registros',
  hasSort,
  onClear,
  className,
  style,
  clearButtonClassName,
  clearButtonStyle,
}: TableFilterBarProps) {
  return (
    <div
      className={
        className ??
        'flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 sm:px-4'
      }
      style={style}
    >
      <p className="text-xs text-slate-600 sm:text-sm">
        Mostrando{' '}
        <strong className="text-slate-900">{filteredCount}</strong> de{' '}
        <strong className="text-slate-900">{totalCount}</strong> {entityLabel}
        {hasSort ? ' · ordenado' : ''}
      </p>
      <button
        type="button"
        onClick={onClear}
        style={clearButtonStyle}
        className={
          clearButtonClassName ??
          'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 sm:text-sm'
        }
      >
        <FilterX className="h-3.5 w-3.5" />
        Quitar filtros
      </button>
    </div>
  );
}

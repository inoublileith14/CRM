'use client';

import { CSSProperties } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatTableHeaderLabel } from '@/lib/table-header-label';
import { EXCEL_CELL_BORDER, TABLE_HEAD_PADDING_DENSE } from '@/lib/excel-table-styles';

interface InmuebleObservacionesColumnHeadProps {
  allVisible: boolean;
  onToggleAllVisible: () => void;
  style?: CSSProperties;
  className?: string;
  label?: string;
  visibilityEntity?: string;
}

export function InmuebleObservacionesColumnHead({
  allVisible,
  onToggleAllVisible,
  style,
  className = '',
  label = 'OBSERVACIONES',
  visibilityEntity = 'las observaciones',
}: InmuebleObservacionesColumnHeadProps) {
  return (
    <th
      style={style}
      className={`text-center ${TABLE_HEAD_PADDING_DENSE} ${EXCEL_CELL_BORDER} ${className}`}
    >
      <div className="flex min-h-[3.25rem] items-center justify-center gap-1.5 py-1">
        <span className="break-words whitespace-normal text-center leading-tight">
          {formatTableHeaderLabel(label)}
        </span>
        <button
          type="button"
          onClick={onToggleAllVisible}
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-white/15 text-white transition hover:bg-white/25"
          title={
            allVisible
              ? `Ocultar ${visibilityEntity}`
              : `Mostrar ${visibilityEntity}`
          }
          aria-label={
            allVisible
              ? `Ocultar ${visibilityEntity}`
              : `Mostrar ${visibilityEntity}`
          }
          aria-pressed={allVisible}
        >
          {allVisible ? (
            <Eye className="h-3 w-3 shrink-0" strokeWidth={2.25} />
          ) : (
            <EyeOff className="h-3 w-3 shrink-0" strokeWidth={2.25} />
          )}
        </button>
      </div>
    </th>
  );
}

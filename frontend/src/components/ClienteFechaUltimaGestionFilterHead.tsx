'use client';

import { ReactNode, useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { formatTableHeaderLabel } from '@/lib/table-header-label';

interface ClienteFechaUltimaGestionFilterHeadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  accent?: 'alquiler' | 'venta';
  filterAriaLabel?: string;
  filterActiveTitle?: (value: string) => string;
  filterIdleTitle?: string;
  trailing?: ReactNode;
}

export function ClienteFechaUltimaGestionFilterHead({
  label,
  value,
  onChange,
  disabled,
  accent = 'alquiler',
  filterAriaLabel = 'Filtrar por fecha de última gestión',
  filterActiveTitle = (filterValue) =>
    `Filtrando: ${filterValue} — clic para cambiar`,
  filterIdleTitle = 'Filtrar por fecha de última gestión',
  trailing,
}: ClienteFechaUltimaGestionFilterHeadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = (value ?? '').trim().length > 0;

  const activeBtnClass =
    accent === 'alquiler'
      ? 'bg-yellow-300 text-emerald-900 hover:bg-yellow-200'
      : 'bg-yellow-300 text-slate-900 hover:bg-yellow-200';
  const idleBtnClass =
    accent === 'alquiler'
      ? 'text-yellow-300 hover:bg-emerald-700 hover:text-yellow-200'
      : 'text-yellow-300 hover:bg-slate-800 hover:text-yellow-200';

  function openPicker() {
    if (disabled) return;
    inputRef.current?.showPicker?.();
    inputRef.current?.focus();
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-1.5">
      <span className="whitespace-pre-line leading-tight">
        {formatTableHeaderLabel(label)}
      </span>
      <div className="relative flex items-center justify-center">
        <input
          ref={inputRef}
          type="date"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="sr-only"
          aria-label={filterAriaLabel}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={openPicker}
          className={`inline-flex items-center justify-center rounded p-0.5 transition disabled:opacity-60 ${
            isActive ? activeBtnClass : idleBtnClass
          }`}
          title={isActive ? filterActiveTitle(value) : filterIdleTitle}
          aria-label={filterAriaLabel}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </button>
        {isActive ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange('')}
            className={`ml-0.5 inline-flex items-center justify-center rounded p-0.5 transition disabled:opacity-60 ${idleBtnClass}`}
            title="Quitar filtro de fecha"
            aria-label="Quitar filtro de fecha"
          >
            <X className="h-3 w-3 shrink-0" aria-hidden />
          </button>
        ) : null}
        {trailing}
      </div>
    </div>
  );
}

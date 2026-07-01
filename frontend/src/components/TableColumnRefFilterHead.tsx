'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter, Loader2 } from 'lucide-react';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import { useClientesByTipoRefsQuery } from '@/hooks/use-dashboard-queries';
import { formatTableHeaderLabel } from '@/lib/table-header-label';
import {
  EXCEL_CELL_BORDER,
  TABLE_HEAD_PADDING_DENSE,
  TABLE_HEAD_TEXT_CLASS,
} from '@/lib/excel-table-styles';
import { TipoOperacion } from '@/types/inmueble';

type RefFilterAccent = 'emerald' | 'blue';

interface TableColumnRefFilterHeadProps {
  label: string;
  shortLabel?: string;
  value: string;
  tipoOperacion: TipoOperacion;
  isOpen: boolean;
  isFilterActive: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (value: string) => void;
  accent?: RefFilterAccent;
  style?: CSSProperties;
  className?: string;
  labelClassName?: string;
}

const ACCENT_STYLES: Record<
  RefFilterAccent,
  { button: string; filterActive: string; filterIdle: string; focus: string }
> = {
  emerald: {
    button: 'bg-emerald-600 hover:bg-emerald-500',
    filterActive: 'text-emerald-600',
    filterIdle: 'text-slate-400',
    focus: 'focus:border-emerald-500 focus:ring-emerald-500/20',
  },
  blue: {
    button: 'bg-blue-700 hover:bg-blue-600',
    filterActive: 'text-blue-700',
    filterIdle: 'text-slate-400',
    focus: 'focus:border-blue-600 focus:ring-blue-600/20',
  },
};

export function TableColumnRefFilterHead({
  label,
  shortLabel,
  value,
  tipoOperacion,
  isOpen,
  isFilterActive,
  onOpenChange,
  onApply,
  accent = 'emerald',
  style,
  className = '',
  labelClassName = '',
}: TableColumnRefFilterHeadProps) {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const accentStyles = ACCENT_STYLES[accent];
  const refsQuery = useClientesByTipoRefsQuery(tipoOperacion, search, {
    enabled: isOpen,
  });
  const position = useFloatingPanelPosition({
    open: isOpen,
    triggerRef,
    panelRef,
    panelWidth: 320,
    estimatedHeight: 320,
    deps: [refsQuery.data?.refs.length],
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    setSearch(value);
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      onOpenChange(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onOpenChange]);

  const displayLabel = formatTableHeaderLabel(shortLabel ?? label);
  const titleLabel = formatTableHeaderLabel(label);

  const refs = useMemo(() => refsQuery.data?.refs ?? [], [refsQuery.data?.refs]);

  function handleClear() {
    onApply('');
    onOpenChange(false);
  }

  function handleSelect(ref: string) {
    onApply(ref);
    onOpenChange(false);
  }

  const panel =
    isOpen && mounted ? (
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`Filtrar por ${titleLabel}`}
        className="fixed z-[200] flex max-h-[min(24rem,calc(100vh-1rem))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
        }}
      >
        <div className="border-b border-slate-200 px-3 py-2">
          <p className="text-xs font-semibold text-slate-800">{titleLabel}</p>
        </div>

        <div className="border-b border-slate-200 px-3 py-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar referencia…"
            className={`w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 ${accentStyles.focus}`}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {refsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Cargando referencias…
            </div>
          ) : refs.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-500">
              No hay referencias que coincidan.
            </p>
          ) : (
            <ul>
              {refs.map((ref) => (
                <li key={ref}>
                  <button
                    type="button"
                    onClick={() => handleSelect(ref)}
                    className={`block w-full px-3 py-1.5 text-left text-xs leading-snug break-words transition hover:bg-slate-50 ${
                      value === ref
                        ? 'bg-slate-100 font-medium text-slate-900'
                        : 'text-slate-700'
                    }`}
                    title={ref}
                  >
                    {ref}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Borrar filtro
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold text-white transition ${accentStyles.button}`}
          >
            Cerrar
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
      <th
        style={style}
        className={`whitespace-nowrap ${TABLE_HEAD_TEXT_CLASS} text-slate-600 ${TABLE_HEAD_PADDING_DENSE} text-center ${EXCEL_CELL_BORDER} ${className}`}
      >
        <div className="flex w-full items-center justify-center gap-0.5 px-0.5">
          <span
            className={`break-words leading-tight ${labelClassName}`}
            title={titleLabel}
          >
            {displayLabel}
          </span>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => onOpenChange(!isOpen)}
            className="inline-flex shrink-0 items-center justify-center rounded p-0.5 transition hover:bg-slate-200/80"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            title={`Filtrar: ${titleLabel}`}
          >
            <Filter
              className={`h-3 w-3 shrink-0 ${
                isFilterActive
                  ? accentStyles.filterActive
                  : accentStyles.filterIdle
              }`}
              aria-hidden
            />
          </button>
        </div>
      </th>
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}

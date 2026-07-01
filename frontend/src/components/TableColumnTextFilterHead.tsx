'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';
import { formatTableHeaderLabel } from '@/lib/table-header-label';
import {
  EXCEL_CELL_BORDER,
  TABLE_HEAD_PADDING_DENSE,
  TABLE_HEAD_TEXT_CLASS,
} from '@/lib/excel-table-styles';

type TextFilterAccent = 'emerald' | 'blue';

interface TableColumnTextFilterHeadProps {
  label: string;
  shortLabel?: string;
  value: string;
  placeholder?: string;
  isOpen: boolean;
  isFilterActive: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (value: string) => void;
  /** When true, applies filter on each keystroke (debounced). */
  live?: boolean;
  accent?: TextFilterAccent;
  style?: CSSProperties;
  className?: string;
  labelClassName?: string;
}

const ACCENT_STYLES: Record<
  TextFilterAccent,
  { focus: string; button: string; filterActive: string; filterIdle: string }
> = {
  emerald: {
    focus: 'focus:border-emerald-500 focus:ring-emerald-500/20',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    filterActive: 'text-emerald-600',
    filterIdle: 'text-slate-400',
  },
  blue: {
    focus: 'focus:border-blue-600 focus:ring-blue-600/20',
    button: 'bg-blue-700 hover:bg-blue-600',
    filterActive: 'text-blue-700',
    filterIdle: 'text-slate-400',
  },
};

export function TableColumnTextFilterHead({
  label,
  shortLabel,
  value,
  placeholder,
  isOpen,
  isFilterActive,
  onOpenChange,
  onApply,
  live = false,
  accent = 'emerald',
  style,
  className = '',
  labelClassName = '',
}: TableColumnTextFilterHeadProps) {
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState(value);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const position = useFloatingPanelPosition({
    open: isOpen,
    triggerRef,
    panelRef,
    panelWidth: 220,
    estimatedHeight: 140,
  });
  const accentStyles = ACCENT_STYLES[accent];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(value);
  }, [isOpen, value]);

  useEffect(() => {
    if (!live || !isOpen) return;
    const timer = window.setTimeout(() => {
      onApply(draft.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft, isOpen, live, onApply]);

  useEffect(() => {
    if (!isOpen) return;

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);

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
      window.clearTimeout(focusTimer);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onOpenChange]);

  function handleClear() {
    setDraft('');
    onApply('');
    onOpenChange(false);
  }

  function handleApply() {
    onApply(draft.trim());
    onOpenChange(false);
  }

  const displayLabel = formatTableHeaderLabel(shortLabel ?? label);
  const titleLabel = formatTableHeaderLabel(label);

  const panel =
    isOpen && mounted ? (
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`Filtrar por ${titleLabel}`}
        className="fixed z-[200] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
        }}
      >
        <div className="border-b border-slate-200 px-3 py-2">
          <p className="text-xs font-semibold text-slate-800">{titleLabel}</p>
        </div>

        <div className="px-3 py-2">
          <input
            ref={inputRef}
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (!live && e.key === 'Enter') {
                e.preventDefault();
                handleApply();
              }
            }}
            placeholder={placeholder ?? 'Buscar…'}
            className={`w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 ${accentStyles.focus}`}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Borrar filtro
          </button>
          {live ? (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold text-white transition ${accentStyles.button}`}
            >
              Cerrar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold text-white transition ${accentStyles.button}`}
            >
              Aceptar
            </button>
          )}
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

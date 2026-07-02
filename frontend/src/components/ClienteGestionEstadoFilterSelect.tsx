'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import {
  ClienteGestionEstado,
  estimateGestionSelectWidthPx,
  GESTION_SELECT_CHROME_PX,
  GESTION_SELECT_LABEL_CLASS,
  getClienteGestionEstadoOption,
  getClienteGestionEstadoOptions,
  getGestionOptionStyle,
} from '@/lib/cliente-gestion-estado';
import { TipoOperacion } from '@/types/inmueble';

interface ClienteGestionEstadoFilterSelectProps {
  value: ClienteGestionEstado | '';
  onChange: (value: ClienteGestionEstado | '') => void;
  tipoOperacion: TipoOperacion;
  disabled?: boolean;
  compact?: boolean;
}

export function ClienteGestionEstadoFilterSelect({
  value,
  onChange,
  tipoOperacion,
  disabled,
  compact = false,
}: ClienteGestionEstadoFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const options = getClienteGestionEstadoOptions(tipoOperacion);
  const gestionSelectWidth =
    measuredWidth ?? estimateGestionSelectWidthPx(tipoOperacion);
  const selected = value
    ? getClienteGestionEstadoOption(value, tipoOperacion)
    : null;

  const focusRingClass =
    tipoOperacion === 'alquiler'
      ? 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
      : 'focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20';

  const triggerClass = compact
    ? `h-7 min-w-0 shrink-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 outline-none transition disabled:opacity-60 ${focusRingClass}`
    : `min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 disabled:opacity-60 sm:w-56 ${focusRingClass}`;

  const placeholderLabel = compact ? 'Estados' : 'Todos los estados';
  const allOptionLabel = 'Todos los estados';

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!compact || !measureRef.current) return;

    const labels = measureRef.current.querySelectorAll('[data-gestion-label]');
    let maxText = 0;
    labels.forEach((node) => {
      maxText = Math.max(maxText, node.getBoundingClientRect().width);
    });
    if (maxText > 0) {
      setMeasuredWidth(Math.ceil(maxText) + GESTION_SELECT_CHROME_PX);
    }
  }, [compact, options, tipoOperacion]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const margin = 8;
      const estimatedHeight = (options.length + 1) * 36 + 8;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

      let top = openUp ? rect.top - estimatedHeight - 4 : rect.bottom + 4;
      top = Math.max(margin, Math.min(top, window.innerHeight - margin - 48));

      let left = rect.left;
      const panelWidth = compact ? rect.width : Math.max(rect.width, 280);
      if (left + panelWidth > window.innerWidth - margin) {
        left = window.innerWidth - panelWidth - margin;
      }
      if (left < margin) left = margin;

      setPosition({ top, left, width: panelWidth });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, options.length, compact]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function handleSelect(next: ClienteGestionEstado | '') {
    setOpen(false);
    if (next === value) return;
    onChange(next);
  }

  const dropdown =
    open && mounted ? (
      <ul
        ref={panelRef}
        role="listbox"
        className="fixed z-[200] overflow-y-auto overflow-x-hidden rounded border border-slate-200 bg-white shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: 'min(360px, calc(100vh - 1rem))',
        }}
      >
        <li role="option" aria-selected={value === ''}>
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`block w-full px-2 py-1.5 text-center font-bold uppercase leading-tight transition hover:bg-slate-50 ${
              compact ? 'text-[9px] break-words' : 'whitespace-nowrap py-2 text-[10px] sm:text-xs'
            } ${
              value === '' ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-700'
            }`}
          >
            {allOptionLabel}
          </button>
        </li>
        {options.map((option) => (
          <li
            key={option.value}
            role="option"
            aria-selected={option.value === value}
          >
            <button
              type="button"
              onClick={() => handleSelect(option.value)}
              style={getGestionOptionStyle(option)}
              className={`block w-full px-2 py-1.5 text-center font-bold uppercase leading-tight transition hover:brightness-95 ${
                compact ? 'text-[9px] break-words' : 'whitespace-nowrap py-2 text-[10px] sm:text-xs'
              }`}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <>
      {compact ? (
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none fixed -left-[9999px] top-0 opacity-0"
        >
          {options.map((option) => (
            <span
              key={option.value}
              data-gestion-label
              className={`block whitespace-nowrap ${GESTION_SELECT_LABEL_CLASS}`}
            >
              {option.label}
            </span>
          ))}
        </div>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        style={compact ? { width: gestionSelectWidth } : undefined}
        className={`inline-flex items-center justify-between gap-1 font-normal ${triggerClass}`}
        aria-label="Filtrar por estado"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={compact ? 'Filtrar por estado' : undefined}
      >
        <span className="min-w-0 flex-1 truncate text-center">
          {selected ? selected.label : placeholderLabel}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </button>
      {dropdown ? createPortal(dropdown, document.body) : null}
    </>
  );
}

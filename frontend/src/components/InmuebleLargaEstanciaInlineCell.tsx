'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import { formatLargaEstanciaCompact } from '@/lib/inmueble-table-utils';
import { updateInmueble } from '@/lib/inmuebles-api';

type LargaEstanciaValue = 'larga' | 't' | null;

const OPTIONS: { value: LargaEstanciaValue; label: string; title: string }[] = [
  { value: 'larga', label: 'L', title: 'Larga estancia' },
  { value: 't', label: 'T', title: 'Temporada' },
  { value: null, label: '—', title: 'Sin valor' },
];

interface InmuebleLargaEstanciaInlineCellProps {
  inmuebleId: string;
  value: LargaEstanciaValue;
  editable?: boolean;
  disabled?: boolean;
  onUpdated: (value: LargaEstanciaValue) => void;
}

const cellTextClass =
  'block whitespace-nowrap text-center text-sm font-bold leading-none tabular-nums sm:text-base';

export function InmuebleLargaEstanciaInlineCell({
  inmuebleId,
  value,
  editable,
  disabled,
  onUpdated,
}: InmuebleLargaEstanciaInlineCellProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const displayValue = formatLargaEstanciaCompact(value);

  const position = useFloatingPanelPosition({
    open,
    triggerRef,
    panelRef,
    panelWidth: 168,
    estimatedHeight: 96,
  });

  useEffect(() => setMounted(true), []);

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

  async function handleSelect(next: LargaEstanciaValue) {
    if (value === next) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateInmueble(inmuebleId, {
        larga_estancia_temporada: next,
      });
      onUpdated(updated.larga_estancia_temporada ?? null);
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo guardar L/T',
      );
    } finally {
      setSaving(false);
    }
  }

  if (!editable) {
    return (
      <span className={cellTextClass} title={displayValue === '—' ? undefined : displayValue}>
        {displayValue}
      </span>
    );
  }

  const panel =
    open && mounted ? (
      <div
        ref={panelRef}
        role="dialog"
        className="fixed z-[200] w-[10.5rem] rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
        style={{ top: position.top, left: position.left }}
      >
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Larga estancia / Temporada
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              disabled={saving}
              onClick={() => void handleSelect(option.value)}
              className={`rounded border px-2 py-2 text-center text-xs font-bold transition disabled:opacity-60 ${
                option.value === value
                  ? 'border-emerald-600 ring-2 ring-emerald-500 ring-offset-1'
                  : 'border-slate-300 bg-white text-slate-800'
              }`}
              title={option.title}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="relative w-full min-w-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || saving}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="w-full transition hover:opacity-80 disabled:opacity-60"
        aria-haspopup="dialog"
        aria-expanded={open}
        title={
          displayValue === '—'
            ? 'Clic para elegir L/T'
            : `${displayValue} — clic para editar`
        }
      >
        {saving ? (
          <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-slate-400" />
        ) : (
          <span className={cellTextClass}>{displayValue}</span>
        )}
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </div>
  );
}

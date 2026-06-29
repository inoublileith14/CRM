'use client';

import { useEffect, useRef, useState } from 'react';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getInmuebleStatusOption,
  INMUEBLE_ROW_COLOR_PRESETS,
  INMUEBLE_STATUS_OPTIONS,
  normalizeRowColor,
  resolveInmuebleRowColor,
  DEFAULT_DENSE_ROW_COLOR,
  DEFAULT_VENTA_DENSE_ROW_COLOR,
  type InmuebleStatus,
} from '@/lib/inmueble-status';
import { updateInmueble } from '@/lib/inmuebles-api';
import type { Inmueble, TipoOperacion } from '@/types/inmueble';

interface InmuebleStatusRowEditorProps {
  inmuebleId: string;
  status: Inmueble['status'];
  rowColor: string | null;
  tipoOperacion?: TipoOperacion;
  compact?: boolean;
  fillCell?: boolean;
  onAccentBackground?: boolean;
  disabled?: boolean;
  onUpdated: (patch: { status: Inmueble['status']; row_color: string | null }) => void;
}

export function InmuebleStatusRowEditor({
  inmuebleId,
  status,
  rowColor,
  tipoOperacion,
  compact,
  fillCell = false,
  onAccentBackground = false,
  disabled,
  onUpdated,
}: InmuebleStatusRowEditorProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useFloatingPanelPosition({
    open,
    triggerRef,
    panelRef,
    panelWidth: 248,
    estimatedHeight: 320,
  });
  const current = getInmuebleStatusOption(status);
  const effectiveRowColor = resolveInmuebleRowColor(rowColor, tipoOperacion);
  const normalizedRowColor = effectiveRowColor ?? INMUEBLE_ROW_COLOR_PRESETS[0].value;

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

  async function persist(patch: {
    status?: Inmueble['status'];
    row_color?: string | null;
  }) {
    setSaving(true);
    try {
      const updated = await updateInmueble(inmuebleId, patch);
      onUpdated({
        status: updated.status,
        row_color: updated.row_color ?? null,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el estado del inmueble',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusSelect(next: InmuebleStatus | null) {
    if (status === next) return;
    await persist({ status: next });
  }

  async function handleRowColorSelect(next: string | null) {
    const normalized = normalizeRowColor(next);
    let toSave: string | null = normalized;
    if (tipoOperacion === 'alquiler' && normalized === DEFAULT_DENSE_ROW_COLOR) {
      toSave = null;
    }
    if (
      tipoOperacion === 'venta' &&
      normalized === DEFAULT_VENTA_DENSE_ROW_COLOR
    ) {
      toSave = null;
    }

    const currentEffective = resolveInmuebleRowColor(rowColor, tipoOperacion);
    const nextEffective = resolveInmuebleRowColor(toSave, tipoOperacion);
    if (currentEffective === nextEffective) return;

    await persist({ row_color: toSave });
  }

  const labelClass = fillCell
    ? `text-base font-extrabold leading-none sm:text-lg${
        onAccentBackground ? ' text-white' : ' text-slate-900'
      }`
    : compact
      ? 'text-sm font-bold'
      : 'text-sm font-bold';

  const panel = open && mounted ? (
    <div
      ref={panelRef}
      role="dialog"
      className="fixed z-[200] w-[15.5rem] rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
      style={{
        top: position.top,
        left: position.left,
        maxHeight: 'min(360px, calc(100vh - 1rem))',
        overflow: 'auto',
      }}
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Status
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {INMUEBLE_STATUS_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            disabled={saving}
            onClick={() => void handleStatusSelect(option.value)}
            className={`rounded border border-slate-300 bg-transparent px-2 py-1.5 text-center text-xs font-bold text-slate-900 transition hover:border-slate-400 disabled:opacity-60 ${
              option.value === status
                ? 'border-emerald-600 ring-2 ring-emerald-500 ring-offset-1'
                : ''
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Color de fila
      </p>
      <div className="grid grid-cols-4 gap-2">
        {INMUEBLE_ROW_COLOR_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            disabled={saving}
            title={preset.label}
            onClick={() => void handleRowColorSelect(preset.value)}
            className={`h-7 w-full rounded border transition hover:scale-105 disabled:opacity-60 ${
              effectiveRowColor === preset.value
                ? 'border-emerald-600 ring-2 ring-emerald-500 ring-offset-1'
                : 'border-slate-300'
            }`}
            style={{ backgroundColor: preset.value }}
            aria-label={preset.label}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label className="text-xs font-medium text-slate-600">
          Personalizado
          <input
            type="color"
            value={normalizedRowColor}
            disabled={saving}
            onChange={(event) => void handleRowColorSelect(event.target.value)}
            className="mt-1 block h-8 w-full cursor-pointer rounded border border-slate-300 bg-white p-0.5"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={saving || !normalizeRowColor(rowColor)}
        onClick={() => void handleRowColorSelect(null)}
        className="mt-3 w-full rounded border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
      >
        {tipoOperacion === 'alquiler'
          ? 'Restaurar verde por defecto'
          : tipoOperacion === 'venta'
            ? 'Restaurar azul por defecto'
            : 'Quitar color de fila'}
      </button>
    </div>
  ) : null;

  return (
    <div
      ref={rootRef}
      className={
        fillCell ? 'absolute inset-0' : 'relative inline-block h-full w-full'
      }
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || saving}
        onClick={() => setOpen((prev) => !prev)}
        className={
          fillCell
            ? `absolute inset-0 flex cursor-pointer items-center justify-center bg-transparent transition disabled:opacity-60 ${labelClass} ${
                onAccentBackground
                  ? 'hover:bg-white/10'
                  : 'hover:bg-black/5'
              }`
            : `inline-flex items-center justify-center bg-transparent text-slate-900 transition hover:opacity-80 disabled:opacity-60 ${labelClass}`
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Cambiar estado y color de fila"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <span>{current.label}</span>
        )}
      </button>

      {panel ? createPortal(panel, document.body) : null}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import {
  getPisoCodigoLabel,
  INMUEBLE_PISO_CODIGO_OPTIONS,
  type InmueblePisoCodigo,
} from '@/lib/inmueble-status';
import { updateInmueble } from '@/lib/inmuebles-api';
import type { Inmueble } from '@/types/inmueble';

type PisoCodigoField = 'alquilado_codigo' | 'vendido_codigo';

interface InmueblePisosInactivosBcnEditorProps {
  inmuebleId: string;
  codigo: InmueblePisoCodigo | null;
  codigoField: PisoCodigoField;
  codigoSectionLabel: string;
  disabled?: boolean;
  onUpdated: (patch: Partial<Pick<Inmueble, PisoCodigoField>>) => void;
}

export function InmueblePisosInactivosBcnEditor({
  inmuebleId,
  codigo,
  codigoField,
  codigoSectionLabel,
  disabled,
  onUpdated,
}: InmueblePisosInactivosBcnEditorProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const codigoLabel = getPisoCodigoLabel(codigo);

  const position = useFloatingPanelPosition({
    open,
    triggerRef,
    panelRef,
    panelWidth: 220,
    estimatedHeight: 160,
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

  async function handleCodigoSelect(next: InmueblePisoCodigo | null) {
    if (codigo === next) return;
    setSaving(true);
    try {
      const updated = await updateInmueble(inmuebleId, { [codigoField]: next });
      onUpdated({ [codigoField]: updated[codigoField] ?? null });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el estado',
      );
    } finally {
      setSaving(false);
    }
  }

  const emptyCodigoTitle =
    codigoField === 'vendido_codigo'
      ? 'Sin venta status'
      : 'Sin alquiler status';

  const panel =
    open && mounted ? (
      <div
        ref={panelRef}
        role="dialog"
        className="fixed z-[200] w-[13.75rem] rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
        style={{ top: position.top, left: position.left }}
      >
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {codigoSectionLabel}
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {INMUEBLE_PISO_CODIGO_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              disabled={saving}
              onClick={() => void handleCodigoSelect(option.value)}
              className={`rounded border px-2 py-2 text-center text-xs font-bold transition disabled:opacity-60 ${
                option.value === codigo
                  ? 'border-emerald-600 ring-2 ring-emerald-500 ring-offset-1'
                  : 'border-slate-300'
              } ${
                option.value === 'C'
                  ? 'text-slate-900'
                  : option.value === 'O'
                    ? 'text-slate-800'
                    : option.value === 'R'
                      ? 'text-slate-900'
                      : 'bg-white text-slate-500'
              }`}
              style={
                option.rowColor
                  ? { backgroundColor: option.rowColor }
                  : undefined
              }
              title={
                option.value === 'C'
                  ? 'Verde eléctrico — toda la fila'
                  : option.value === 'O'
                    ? 'Gris — toda la fila'
                    : option.value === 'R'
                      ? 'Rosa — toda la fila'
                      : emptyCodigoTitle
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="absolute inset-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || saving}
        onClick={() => setOpen((prev) => !prev)}
        className="absolute inset-0 z-0 flex cursor-pointer items-center justify-center bg-transparent text-slate-900 transition hover:bg-black/5 disabled:opacity-60"
        aria-haspopup="dialog"
        aria-expanded={open}
        title={`${codigoSectionLabel} (C/O/R)`}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="text-sm font-extrabold leading-none sm:text-base">
            {codigoLabel}
          </span>
        )}
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </div>
  );
}

/** @deprecated Use InmueblePisosInactivosBcnEditor */
export function InmuebleAlquiladoBcnEditor({
  inmuebleId,
  alquiladoCodigo,
  disabled,
  onUpdated,
}: {
  inmuebleId: string;
  alquiladoCodigo: Inmueble['alquilado_codigo'];
  disabled?: boolean;
  onUpdated: (patch: {
    alquilado_codigo?: Inmueble['alquilado_codigo'];
  }) => void;
}) {
  return (
    <InmueblePisosInactivosBcnEditor
      inmuebleId={inmuebleId}
      codigo={alquiladoCodigo}
      codigoField="alquilado_codigo"
      codigoSectionLabel="Alquiler status"
      disabled={disabled}
      onUpdated={onUpdated}
    />
  );
}

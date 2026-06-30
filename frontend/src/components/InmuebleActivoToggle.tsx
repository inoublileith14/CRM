'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateInmueble } from '@/lib/inmuebles-api';

interface InmuebleActivoToggleProps {
  inmuebleId: string;
  activo: boolean;
  disabled?: boolean;
  onUpdated: (activo: boolean) => void;
}

export function InmuebleActivoToggle({
  inmuebleId,
  activo,
  disabled,
  onUpdated,
}: InmuebleActivoToggleProps) {
  const [saving, setSaving] = useState(false);

  function handleToggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    void toggleActivo();
  }

  async function toggleActivo() {
    const next = !activo;
    setSaving(true);
    try {
      const updated = await updateInmueble(inmuebleId, { activo: next });
      onUpdated(updated.activo ?? next);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado ON/OFF',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || saving}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={handleToggle}
      aria-pressed={activo}
      aria-label={
        activo
          ? 'Activo (ON) — clic para desactivar'
          : 'Inactivo (OFF) — clic para activar'
      }
      title={activo ? 'ON' : 'OFF'}
      className={`relative mx-auto flex h-5 w-[2.35rem] shrink-0 items-center rounded-full border border-black/10 shadow-sm transition disabled:opacity-60 ${
        activo ? 'bg-emerald-500' : 'bg-red-500'
      }`}
    >
      {saving ? (
        <Loader2 className="mx-auto h-3 w-3 animate-spin text-white" />
      ) : (
        <>
          <span
            className={`pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow transition-all ${
              activo ? 'left-0.5' : 'right-0.5'
            }`}
          />
          <span
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[7px] font-extrabold uppercase leading-none tracking-tight text-white ${
              activo ? 'right-1' : 'left-1'
            }`}
          >
            {activo ? 'ON' : 'OFF'}
          </span>
        </>
      )}
    </button>
  );
}

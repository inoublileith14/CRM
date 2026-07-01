'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { updateInmueble } from '@/lib/inmuebles-api';

interface InmuebleActivoToggleProps {
  inmuebleId: string;
  activo: boolean;
  inmuebleLabel?: string;
  disabled?: boolean;
  onUpdated: (activo: boolean) => void;
}

export function InmuebleActivoToggle({
  inmuebleId,
  activo,
  inmuebleLabel,
  disabled,
  onUpdated,
}: InmuebleActivoToggleProps) {
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localActivo, setLocalActivo] = useState(activo);

  useEffect(() => {
    if (!saving) {
      setLocalActivo(activo);
    }
  }, [activo, saving]);

  function handleToggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || saving) return;
    setConfirmOpen(true);
  }

  async function executeToggle() {
    if (disabled || saving) return;

    const previous = localActivo;
    const next = !previous;
    setConfirmOpen(false);
    setLocalActivo(next);
    onUpdated(next);
    setSaving(true);

    try {
      const updated = await updateInmueble(inmuebleId, { activo: next });
      const persisted = updated.activo ?? next;
      setLocalActivo(persisted);
      onUpdated(persisted);
    } catch (error) {
      setLocalActivo(previous);
      onUpdated(previous);
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado ON/OFF',
      );
    } finally {
      setSaving(false);
    }
  }

  const label = inmuebleLabel?.trim() || 'este piso';
  const confirmCopy = localActivo
    ? {
        title: 'Desactivar piso',
        description: `¿Desactivar ${label}? Dejará de aparecer en el listado de pisos activos.`,
        confirmLabel: 'Desactivar',
        confirmButtonClassName: 'bg-red-600 hover:bg-red-500',
      }
    : {
        title: 'Activar piso',
        description: `¿Activar ${label}? Volverá al listado de pisos activos.`,
        confirmLabel: 'Activar',
        confirmButtonClassName: 'bg-emerald-600 hover:bg-emerald-500',
      };

  return (
    <>
      <button
        type="button"
        disabled={disabled || saving}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={handleToggle}
        aria-pressed={localActivo}
        aria-label={
          localActivo
            ? 'Activo (ON) — clic para desactivar'
            : 'Inactivo (OFF) — clic para activar'
        }
        title={localActivo ? 'ON — clic para desactivar' : 'OFF — clic para activar'}
        className={`relative z-10 mx-auto flex h-5 w-[2.35rem] shrink-0 cursor-pointer items-center rounded-full border border-black/10 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
          localActivo ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      >
        {saving ? (
          <Loader2 className="mx-auto h-3 w-3 animate-spin text-white" />
        ) : (
          <>
            <span
              className={`pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow transition-all ${
                localActivo ? 'right-0.5' : 'left-0.5'
              }`}
            />
            <span
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[7px] font-extrabold uppercase leading-none tracking-tight text-white ${
                localActivo ? 'left-1' : 'right-1'
              }`}
            >
              {localActivo ? 'ON' : 'OFF'}
            </span>
          </>
        )}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        confirmButtonClassName={confirmCopy.confirmButtonClassName}
        loading={saving}
        onConfirm={() => void executeToggle()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

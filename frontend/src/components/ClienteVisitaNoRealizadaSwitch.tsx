'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  CLIENTE_VISITA_CONCERTADA_GREEN,
  isClienteVisitaGestionEstado,
} from '@/lib/cliente-gestion-estado';
import { updateClienteVisitaNoRealizada } from '@/lib/inmuebles-api';

interface ClienteVisitaNoRealizadaSwitchProps {
  inmuebleId: string;
  clienteId: string;
  gestionEstado: string | null | undefined;
  value: boolean | null | undefined;
  disabled?: boolean;
  onUpdated: (visita_no_realizada: boolean) => void;
}

export function ClienteVisitaNoRealizadaSwitch({
  inmuebleId,
  clienteId,
  gestionEstado,
  value,
  disabled,
  onUpdated,
}: ClienteVisitaNoRealizadaSwitchProps) {
  const [saving, setSaving] = useState(false);
  const canToggle = isClienteVisitaGestionEstado(gestionEstado);
  const checked = Boolean(value);
  const fieldDisabled = disabled || saving || !canToggle;

  async function handleToggle() {
    if (fieldDisabled) return;

    const next = !checked;
    setSaving(true);
    try {
      const result = await updateClienteVisitaNoRealizada(
        inmuebleId,
        clienteId,
        next,
      );
      onUpdated(result.visita_no_realizada);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la asistencia a la visita',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex justify-center">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={
          canToggle
            ? checked
              ? 'Cliente no asistió a la visita — clic para desmarcar'
              : 'Marcar que el cliente no asistió a la visita'
            : 'Solo disponible con visita concertada o videollamada'
        }
        disabled={fieldDisabled}
        onClick={() => void handleToggle()}
        style={
          canToggle && checked
            ? {
                backgroundColor: CLIENTE_VISITA_CONCERTADA_GREEN,
                borderColor: CLIENTE_VISITA_CONCERTADA_GREEN,
              }
            : undefined
        }
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition disabled:cursor-not-allowed ${
          canToggle
            ? checked
              ? 'shadow-sm shadow-[#39ff14]/40'
              : 'border-slate-400 bg-slate-300 hover:border-slate-500 hover:bg-slate-400'
            : 'border-slate-300 bg-slate-200 opacity-70'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
        {saving ? (
          <Loader2 className="absolute -right-5 h-3.5 w-3.5 animate-spin text-slate-500" />
        ) : null}
      </button>
    </div>
  );
}

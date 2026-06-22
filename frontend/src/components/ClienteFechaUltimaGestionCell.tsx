'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateCliente } from '@/lib/clientes-api';
import { updateClienteFechaUltimaGestion } from '@/lib/inmuebles-api';

interface ClienteFechaUltimaGestionCellProps {
  clienteId: string;
  inmuebleId?: string;
  value: string | null | undefined;
  disabled?: boolean;
  compact?: boolean;
  onUpdated: (fechaUltimaGestion: string | null) => void;
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromDateInput(value: string): string | null {
  if (!value.trim()) return null;
  return `${value}T00:00:00.000Z`;
}

function formatFecha(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(d);
}

export function ClienteFechaUltimaGestionCell({
  clienteId,
  inmuebleId,
  value,
  disabled,
  compact,
  onUpdated,
}: ClienteFechaUltimaGestionCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(toDateInput(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(toDateInput(value));
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.showPicker?.();
    }
  }, [editing]);

  async function save() {
    const nextIso = fromDateInput(draft);
    const currentDate = toDateInput(value);

    setEditing(false);

    if (draft === currentDate) return;

    setSaving(true);
    try {
      if (inmuebleId) {
        await updateClienteFechaUltimaGestion(
          inmuebleId,
          clienteId,
          nextIso,
        );
      } else {
        await updateCliente(clienteId, { fecha_ultima_gestion: nextIso });
      }
      onUpdated(nextIso);
    } catch (error) {
      setDraft(toDateInput(value));
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la fecha',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setDraft(toDateInput(value));
      setEditing(false);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      void save();
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className={
          compact
            ? 'w-full min-w-0 rounded border border-blue-400 bg-white px-1 py-0.5 text-xs text-slate-900 outline-none ring-2 ring-blue-500/20'
            : 'w-full min-w-[9rem] rounded border border-blue-400 bg-white px-2 py-1 text-sm text-slate-900 outline-none ring-2 ring-blue-500/20'
        }
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || saving}
      onClick={() => setEditing(true)}
      className={
        compact
          ? 'group w-full min-w-0 rounded px-0.5 py-0.5 text-center text-xs text-slate-600 transition hover:bg-slate-100 disabled:opacity-60'
          : 'group w-full min-w-[7rem] rounded px-1 py-0.5 text-left text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-60'
      }
      title="Cambiar fecha de última gestión"
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : (
        <span className={value ? '' : 'text-slate-400 group-hover:text-slate-500'}>
          {value ? formatFecha(value) : compact ? '+ Fecha' : 'Añadir fecha…'}
        </span>
      )}
    </button>
  );
}

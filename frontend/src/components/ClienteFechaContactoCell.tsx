'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateCliente } from '@/lib/clientes-api';
import {
  formatClienteEntradaDate,
  formatEntradaElapsedLabel,
  formatMonthsSinceEntrada,
  getDefaultClienteEntradaIso,
  isDefaultClienteEntradaDate,
  resolveClienteEntradaIso,
} from '@/lib/cliente-date-utils';

interface ClienteFechaContactoCellProps {
  clienteId: string;
  value: string | null;
  disabled?: boolean;
  compact?: boolean;
  onUpdated: (fechaContacto: string | null) => void;
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDateInputOrDefault(value: string | null | undefined): string {
  return value ? toDateInput(value) : toDateInput(getDefaultClienteEntradaIso());
}

function fromDateInput(value: string): string | null {
  if (!value.trim()) return null;
  return `${value}T00:00:00.000Z`;
}

function formatFechaContacto(value: string | null): string {
  return formatClienteEntradaDate(value);
}

export function ClienteFechaContactoCell({
  clienteId,
  value,
  disabled,
  compact,
  onUpdated,
}: ClienteFechaContactoCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(toDateInput(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(toDateInputOrDefault(value));
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
    const currentDate = toDateInputOrDefault(value);

    setEditing(false);

    if (draft === currentDate) return;
    if (!nextIso) {
      setDraft(toDateInputOrDefault(value));
      toast.error('La fecha de contacto es obligatoria');
      return;
    }

    setSaving(true);
    try {
      await updateCliente(clienteId, { fecha_contacto: nextIso });
      onUpdated(nextIso);
    } catch (error) {
      setDraft(toDateInputOrDefault(value));
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
      setDraft(toDateInputOrDefault(value));
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
            ? 'w-full min-w-0 rounded border border-emerald-400 bg-white px-1 py-0.5 text-xs text-slate-900 outline-none ring-2 ring-emerald-500/20'
            : 'w-full min-w-[9rem] rounded border border-emerald-400 bg-white px-2 py-1 text-sm text-slate-900 outline-none ring-2 ring-emerald-500/20'
        }
      />
    );
  }

  const displayIso = resolveClienteEntradaIso(value);
  const isEstimated = isDefaultClienteEntradaDate(value);
  const monthsLabel = formatMonthsSinceEntrada(displayIso, compact);
  const elapsedTitle = formatEntradaElapsedLabel(displayIso);
  const defaultEntradaTitle = `Fecha estimada (hoy − 2 meses): ${formatFechaContacto(displayIso)}`;

  return (
    <button
      type="button"
      disabled={disabled || saving}
      onClick={() => {
        if (!value) {
          setDraft(toDateInput(getDefaultClienteEntradaIso()));
        }
        setEditing(true);
      }}
      className={
        compact
          ? `group w-full min-w-0 rounded px-0.5 py-0.5 text-center text-xs transition hover:bg-slate-100 disabled:opacity-60 ${
              isEstimated ? 'text-slate-500' : 'text-slate-600'
            }`
          : `group w-full min-w-[7rem] rounded px-1 py-0.5 text-left text-sm transition hover:bg-slate-100 disabled:opacity-60 ${
              isEstimated ? 'text-slate-500' : 'text-slate-600'
            }`
      }
      title={
        isEstimated
          ? `${defaultEntradaTitle} — clic para cambiar`
          : elapsedTitle
            ? `${formatFechaContacto(value)} — ${elapsedTitle}`
            : formatFechaContacto(value)
      }
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : (
        <span className="block leading-snug">
          <span className="block">{formatFechaContacto(displayIso)}</span>
          {monthsLabel ? (
            <span className="block text-[10px] font-medium text-slate-400 group-hover:text-slate-500">
              {monthsLabel}
            </span>
          ) : null}
        </span>
      )}
    </button>
  );
}

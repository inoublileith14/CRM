'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateCliente } from '@/lib/clientes-api';

interface ClienteNombreCellProps {
  clienteId: string;
  value: string;
  disabled?: boolean;
  onUpdated: (nombre: string) => void;
}

export function ClienteNombreCell({
  clienteId,
  value,
  disabled,
  onUpdated,
}: ClienteNombreCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function cancel() {
    if (saving) return;
    setDraft(value);
    setEditing(false);
  }

  async function save() {
    const trimmed = draft.trim();
    const current = (value ?? '').trim();

    setEditing(false);

    if (trimmed === current) {
      return;
    }

    if (!trimmed) {
      setDraft(value);
      toast.error('El nombre no puede estar vacío');
      return;
    }

    setSaving(true);
    try {
      await updateCliente(clienteId, { nombre: trimmed });
      onUpdated(trimmed);
    } catch (error) {
      setDraft(value);
      toast.error(
        error instanceof Error ? error.message : 'No se pudo guardar el nombre',
      );
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        disabled={saving}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void save()}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void save();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
          }
        }}
        onClick={(event) => event.stopPropagation()}
        className="w-full min-w-[8rem] rounded border border-emerald-400 bg-white px-2 py-1 text-sm text-slate-900 outline-none ring-2 ring-emerald-500/20"
        placeholder="Nombre…"
      />
    );
  }

  const preview = (value ?? '').trim();

  return (
    <button
      type="button"
      disabled={disabled || saving}
      onClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
      className="group w-full min-w-0 max-w-full rounded px-1 py-0.5 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:opacity-60"
      title={preview ? `${preview} — clic para editar` : 'Clic para editar nombre'}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : preview ? (
        <span className="block line-clamp-3 break-words whitespace-normal leading-snug">
          {preview}
        </span>
      ) : (
        <span className="text-slate-400 group-hover:text-slate-500">
          Sin nombre…
        </span>
      )}
    </button>
  );
}

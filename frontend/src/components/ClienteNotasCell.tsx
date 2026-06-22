'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateCliente } from '@/lib/clientes-api';

interface ClienteNotasCellProps {
  clienteId: string;
  value: string | null;
  disabled?: boolean;
  compact?: boolean;
  onUpdated: (notas: string | null) => void;
}

export function ClienteNotasCell({
  clienteId,
  value,
  disabled,
  compact,
  onUpdated,
}: ClienteNotasCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value ?? '');
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  async function save() {
    const trimmed = draft.trim();
    const next = trimmed || null;
    const current = value?.trim() || null;

    setEditing(false);
    if (next === current) return;

    setSaving(true);
    try {
      await updateCliente(clienteId, { notas: next });
      onUpdated(next);
    } catch (error) {
      setDraft(value ?? '');
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar las notas',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      setDraft(value ?? '');
      setEditing(false);
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void save();
    }
  }

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={handleKeyDown}
        rows={2}
        disabled={saving}
        className={`w-full rounded border border-emerald-400 bg-white px-2 py-1 text-slate-900 outline-none ring-2 ring-emerald-500/20 ${
          compact ? 'min-w-0 max-w-none text-xs' : 'min-w-[10rem] max-w-xs text-sm'
        }`}
        placeholder="Notas…"
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || saving}
      onClick={() => setEditing(true)}
      className={`group w-full rounded px-1 py-0.5 text-left text-slate-600 transition hover:bg-slate-100 disabled:opacity-60 ${
        compact ? 'min-w-0 max-w-none text-xs' : 'min-w-[8rem] max-w-xs text-sm'
      }`}
      title={value?.trim() || 'Añadir notas'}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : value?.trim() ? (
        <span className="line-clamp-2 whitespace-pre-wrap">{value}</span>
      ) : (
        <span className="text-slate-400 group-hover:text-slate-500">
          Añadir notas…
        </span>
      )}
    </button>
  );
}

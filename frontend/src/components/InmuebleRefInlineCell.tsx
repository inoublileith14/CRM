'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateInmueble } from '@/lib/inmuebles-api';

interface InmuebleRefInlineCellProps {
  inmuebleId: string;
  value: string | null;
  disabled?: boolean;
  onUpdated: (ref: string | null) => void;
}

export function InmuebleRefInlineCell({
  inmuebleId,
  value,
  disabled,
  onUpdated,
}: InmuebleRefInlineCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function cancel() {
    if (saving) return;
    setDraft(value ?? '');
    setEditing(false);
  }

  async function save() {
    const trimmed = draft.trim();
    const next = trimmed || null;
    const current = value?.trim() || null;

    if (next === current) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateInmueble(inmuebleId, { ref: next });
      onUpdated(next);
      setEditing(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo guardar la ref',
      );
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex w-full items-center justify-center gap-1">
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
          className="w-full rounded border border-slate-300 bg-white px-1.5 py-0.5 text-center text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60"
          placeholder="Ref."
        />
        {saving ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-slate-400" />
        ) : null}
      </div>
    );
  }

  const preview = value?.trim();

  return (
    <button
      type="button"
      disabled={disabled || saving}
      onClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
      className="mx-auto block w-full break-words whitespace-normal text-center text-sm font-bold leading-snug text-slate-800 transition hover:text-emerald-700 disabled:opacity-60"
      title={preview ? `Ref: ${preview} — clic para editar` : 'Clic para añadir ref'}
    >
      {saving ? (
        <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-slate-400" />
      ) : preview ? (
        preview
      ) : (
        <span className="text-slate-400">—</span>
      )}
    </button>
  );
}

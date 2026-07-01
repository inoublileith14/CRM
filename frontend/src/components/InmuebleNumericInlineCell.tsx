'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatInmuebleCell } from '@/lib/inmueble-table-utils';
import { updateInmueble } from '@/lib/inmuebles-api';
import { InmuebleFormData } from '@/types/inmueble';

export type InmuebleEditableNumericField = 'precio' | 'hab' | 'banos' | 'metros';

export const INMUEBLE_EDITABLE_NUMERIC_FIELDS: readonly InmuebleEditableNumericField[] =
  ['precio', 'hab', 'banos', 'metros'];

interface InmuebleNumericInlineCellProps {
  inmuebleId: string;
  field: InmuebleEditableNumericField;
  value: number | null;
  editable?: boolean;
  disabled?: boolean;
  accent?: 'emerald' | 'blue';
  onUpdated: (value: number | null) => void;
}

const cellTextClass =
  'block whitespace-nowrap text-center text-sm font-bold leading-none tabular-nums sm:text-base';

function valueToDraft(
  field: InmuebleEditableNumericField,
  value: number | null,
): string {
  if (value == null) return '';
  if (field === 'precio') return String(Math.round(value));
  return String(value);
}

function parseIntegerDraft(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function parsePrecioDraft(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function formatDisplay(
  field: InmuebleEditableNumericField,
  value: number | null,
): string {
  return formatInmuebleCell(field as keyof InmuebleFormData, value);
}

export function InmuebleNumericInlineCell({
  inmuebleId,
  field,
  value,
  editable,
  disabled,
  accent = 'emerald',
  onUpdated,
}: InmuebleNumericInlineCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => valueToDraft(field, value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = formatDisplay(field, value);
  const isEmpty = displayValue === '—';

  const focusRingClass =
    accent === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-emerald-500/30'
      : 'focus:border-blue-500 focus:ring-blue-500/30';

  useEffect(() => {
    if (!editing) {
      setDraft(valueToDraft(field, value));
    }
  }, [field, value, editing]);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  function cancel() {
    if (saving) return;
    setDraft(valueToDraft(field, value));
    setEditing(false);
  }

  async function save() {
    const currentDraft = valueToDraft(field, value);
    if (draft.trim() === currentDraft.trim()) {
      setEditing(false);
      return;
    }

    const next =
      field === 'precio' ? parsePrecioDraft(draft) : parseIntegerDraft(draft);

    if (draft.trim() && next === null) {
      toast.error('Introduce un número válido');
      setDraft(currentDraft);
      return;
    }

    if (next === value) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateInmueble(inmuebleId, { [field]: next });
      onUpdated(next);
      setEditing(false);
    } catch (error) {
      setDraft(currentDraft);
      toast.error(
        error instanceof Error ? error.message : 'No se pudo guardar el valor',
      );
    } finally {
      setSaving(false);
    }
  }

  if (editing && editable) {
    return (
      <div className="flex w-full items-center justify-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={draft}
          disabled={disabled || saving}
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
          className={`w-full min-w-0 rounded border border-slate-300 bg-white px-0.5 py-0.5 text-center text-sm font-bold tabular-nums text-slate-900 outline-none focus:ring-1 disabled:opacity-60 ${focusRingClass}`}
          placeholder={field === 'precio' ? 'Precio' : '—'}
          aria-label={field}
        />
        {saving ? (
          <Loader2 className="absolute h-3 w-3 animate-spin text-slate-400" />
        ) : null}
      </div>
    );
  }

  if (!editable) {
    return (
      <span className={cellTextClass} title={isEmpty ? undefined : displayValue}>
        {displayValue}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || saving}
      onClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
      className={`w-full transition hover:opacity-80 disabled:opacity-60 ${cellTextClass}`}
      title={
        isEmpty
          ? `Clic para añadir ${field}`
          : `${displayValue} — clic para editar`
      }
    >
      {saving ? (
        <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-slate-400" />
      ) : (
        displayValue
      )}
    </button>
  );
}

export function isInmuebleEditableNumericField(
  key: string,
): key is InmuebleEditableNumericField {
  return (INMUEBLE_EDITABLE_NUMERIC_FIELDS as readonly string[]).includes(key);
}

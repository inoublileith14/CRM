'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateInmueble } from '@/lib/inmuebles-api';

interface InmuebleObservacionesLineCellProps {
  inmuebleId: string;
  value: string | null;
  disabled?: boolean;
  onUpdated: (observaciones: string | null) => void;
}

export function InmuebleObservacionesLineCell({
  inmuebleId,
  value,
  disabled,
  onUpdated,
}: InmuebleObservacionesLineCellProps) {
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!saving) {
      setDraft(value ?? '');
    }
  }, [value, saving]);

  async function save(nextDraft: string) {
    const trimmed = nextDraft.trim();
    const next = trimmed || null;
    const current = value?.trim() || null;

    if (next === current) {
      return;
    }

    setSaving(true);
    try {
      await updateInmueble(inmuebleId, { observaciones: next });
      onUpdated(next);
    } catch (error) {
      setDraft(value ?? '');
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar las observaciones',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative w-full min-w-0">
      <textarea
        ref={textareaRef}
        value={draft}
        disabled={disabled || saving}
        rows={2}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void save(draft)}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setDraft(value ?? '');
            textareaRef.current?.blur();
          }
        }}
        placeholder=""
        className="block w-full min-h-[2.5rem] resize-y rounded border border-transparent bg-transparent px-1 py-0.5 text-left text-sm font-bold leading-snug text-red-600 outline-none transition placeholder:text-red-300/70 focus:border-red-300/60 focus:bg-white/80 disabled:opacity-60"
      />
      {saving ? (
        <Loader2 className="pointer-events-none absolute right-0.5 top-0.5 h-3 w-3 animate-spin text-red-400" />
      ) : null}
    </div>
  );
}

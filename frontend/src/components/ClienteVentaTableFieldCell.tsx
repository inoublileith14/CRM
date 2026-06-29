'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateCliente } from '@/lib/clientes-api';
import { parseRefCliente, setParsedRefField } from '@/lib/parse-ref-cliente';
import { clienteDenseTextClass } from '@/components/ClienteRefValue';

export type ClienteVentaTableFieldKind =
  | 'presupuesto_maximo'
  | 'presupuesto_peticion'
  | 'habitaciones'
  | 'banos'
  | 'metros'
  | 'barrio'
  | 'distrito'
  | 'tipo_nomina';

interface ClienteVentaTableFieldCellProps {
  clienteId: string;
  kind: ClienteVentaTableFieldKind;
  refCliente: string | null;
  presupuestoMaximo?: string | null;
  banos?: number | null;
  barrio?: string | null;
  distrito?: string | null;
  tipoNomina?: string | null;
  disabled?: boolean;
  compact?: boolean;
  onUpdated: (patch: {
    presupuesto_maximo?: string | null;
    banos?: number | null;
    ref_cliente?: string | null;
    barrio?: string | null;
    distrito?: string | null;
    tipo_nomina?: string | null;
  }) => void;
}

function getFieldValue(
  kind: ClienteVentaTableFieldKind,
  refCliente: string | null,
  presupuestoMaximo: string | null | undefined,
  banos: number | null | undefined,
  barrio: string | null | undefined,
  distrito: string | null | undefined,
  tipoNomina: string | null | undefined,
): string {
  const parsed = parseRefCliente(refCliente);

  switch (kind) {
    case 'presupuesto_maximo':
      return presupuestoMaximo ?? '';
    case 'presupuesto_peticion':
      return parsed.presupuesto ?? '';
    case 'habitaciones':
      return parsed.habitaciones != null ? String(parsed.habitaciones) : '';
    case 'banos':
      return banos != null ? String(banos) : '';
    case 'metros':
      return parsed.metros != null ? String(parsed.metros) : '';
    case 'barrio':
      return barrio ?? parsed.zona ?? '';
    case 'distrito':
      return distrito ?? '';
    case 'tipo_nomina':
      return tipoNomina ?? '';
  }
}

function formatDisplayValue(
  kind: ClienteVentaTableFieldKind,
  refCliente: string | null,
  presupuestoMaximo: string | null | undefined,
  banos: number | null | undefined,
  barrio: string | null | undefined,
  distrito: string | null | undefined,
  tipoNomina: string | null | undefined,
): string {
  const value = getFieldValue(
    kind,
    refCliente,
    presupuestoMaximo,
    banos,
    barrio,
    distrito,
    tipoNomina,
  );
  return value.trim() ? value : '—';
}

function parseNumberDraft(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function ClienteVentaTableFieldCell({
  clienteId,
  kind,
  refCliente,
  presupuestoMaximo,
  banos,
  barrio,
  distrito,
  tipoNomina,
  disabled,
  compact,
  onUpdated,
}: ClienteVentaTableFieldCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = formatDisplayValue(
    kind,
    refCliente,
    presupuestoMaximo,
    banos,
    barrio,
    distrito,
    tipoNomina,
  );
  const isEmpty = displayValue === '—';
  const isNumberField =
    kind === 'habitaciones' || kind === 'banos' || kind === 'metros';
  const isWrapTextField =
    kind === 'barrio' || kind === 'distrito' || kind === 'tipo_nomina';

  useEffect(() => {
    if (!editing) {
      setDraft(
        getFieldValue(
          kind,
          refCliente,
          presupuestoMaximo,
          banos,
          barrio,
          distrito,
          tipoNomina,
        ),
      );
    }
  }, [kind, refCliente, presupuestoMaximo, banos, barrio, distrito, tipoNomina, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  async function save() {
    const current = getFieldValue(
      kind,
      refCliente,
      presupuestoMaximo,
      banos,
      barrio,
      distrito,
      tipoNomina,
    );
    setEditing(false);

    if (draft.trim() === current.trim()) return;

    setSaving(true);
    try {
      if (kind === 'barrio') {
        const next = draft.trim() || null;
        await updateCliente(clienteId, { barrio: next });
        onUpdated({ barrio: next });
        return;
      }

      if (kind === 'distrito') {
        const next = draft.trim() || null;
        await updateCliente(clienteId, { distrito: next });
        onUpdated({ distrito: next });
        return;
      }

      if (kind === 'tipo_nomina') {
        const next = draft.trim() || null;
        await updateCliente(clienteId, { tipo_nomina: next });
        onUpdated({ tipo_nomina: next });
        return;
      }

      if (kind === 'presupuesto_maximo') {
        const next = draft.trim() || null;
        await updateCliente(clienteId, { presupuesto_maximo: next });
        onUpdated({ presupuesto_maximo: next });
        return;
      }

      if (kind === 'banos') {
        const next = parseNumberDraft(draft);
        if (draft.trim() && next === null) {
          toast.error('Introduce un número válido');
          setDraft(current);
          return;
        }
        await updateCliente(clienteId, { banos: next });
        onUpdated({ banos: next });
        return;
      }

      if (kind === 'presupuesto_peticion') {
        const nextRef = setParsedRefField(
          refCliente,
          'presupuesto',
          draft.trim() || null,
        );
        await updateCliente(clienteId, { ref_cliente: nextRef });
        onUpdated({ ref_cliente: nextRef });
        return;
      }

      if (kind === 'habitaciones') {
        const next = parseNumberDraft(draft);
        if (draft.trim() && next === null) {
          toast.error('Introduce un número válido');
          setDraft(current);
          return;
        }
        const nextRef = setParsedRefField(refCliente, 'habitaciones', next);
        await updateCliente(clienteId, { ref_cliente: nextRef });
        onUpdated({ ref_cliente: nextRef });
        return;
      }

      const next = parseNumberDraft(draft);
      if (draft.trim() && next === null) {
        toast.error('Introduce un número válido');
        setDraft(current);
        return;
      }
      const nextRef = setParsedRefField(refCliente, 'metros', next);
      await updateCliente(clienteId, { ref_cliente: nextRef });
      onUpdated({ ref_cliente: nextRef });
    } catch (error) {
      setDraft(current);
      toast.error(
        error instanceof Error ? error.message : 'No se pudo guardar el valor',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setDraft(
        getFieldValue(
          kind,
          refCliente,
          presupuestoMaximo,
          banos,
          barrio,
          distrito,
          tipoNomina,
        ),
      );
      setEditing(false);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      void save();
    }
  }

  const inputClass = compact
    ? 'w-full min-w-0 rounded border border-blue-400 bg-white px-1 py-0.5 text-xs text-slate-900 outline-none ring-2 ring-blue-500/20'
    : 'w-full min-w-[4rem] rounded border border-blue-400 bg-white px-2 py-1 text-sm text-slate-900 outline-none ring-2 ring-blue-500/20';

  const buttonClass = compact
    ? `group w-full min-w-0 rounded px-0.5 py-0.5 text-center text-xs text-slate-600 transition hover:bg-slate-100 disabled:opacity-60${
        isWrapTextField ? ' flex items-center justify-center' : ''
      }`
    : 'group w-full min-w-[3rem] rounded px-1 py-0.5 text-left text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-60';

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode={isNumberField ? 'numeric' : 'text'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className={inputClass}
        placeholder={kind === 'presupuesto_peticion' ? '390k' : undefined}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || saving}
      onClick={() => setEditing(true)}
      className={buttonClass}
      title={isEmpty ? 'Clic para editar' : displayValue}
    >
      {saving ? (
        <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-slate-400" />
      ) : (
        <span
          className={
            isEmpty
              ? 'text-slate-400 group-hover:text-slate-500'
              : isWrapTextField
                ? clienteDenseTextClass
                : undefined
          }
        >
          {isEmpty ? '+' : displayValue}
        </span>
      )}
    </button>
  );
}

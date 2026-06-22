'use client';

import { FormEvent } from 'react';
import { PropietarioFormData } from '@/types/propietario';
import { TIPO_OPERACION_LABELS, TipoOperacion } from '@/types/inmueble';

interface PropietarioFormProps {
  initial?: PropietarioFormData;
  onSubmit: (data: PropietarioFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
  fixedTipoOperacion?: TipoOperacion;
}

function toValue(value: string | null | undefined): string {
  return value ?? '';
}

export function PropietarioForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
  fixedTipoOperacion,
}: PropietarioFormProps) {
  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const tipoFromForm = form.get('tipo_operacion') as TipoOperacion | '';
    const tipoOperacion =
      fixedTipoOperacion ||
      (tipoFromForm === 'alquiler' || tipoFromForm === 'venta'
        ? tipoFromForm
        : null);

    await onSubmit({
      nombre: (form.get('nombre') as string).trim(),
      telf: (form.get('telf') as string) || null,
      email: (form.get('email') as string) || null,
      notas: (form.get('notas') as string) || null,
      tipo_operacion: tipoOperacion,
    });
  }

  const defaultTipo =
    fixedTipoOperacion ?? initial?.tipo_operacion ?? 'alquiler';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!fixedTipoOperacion ? (
        <div>
          <label
            htmlFor="tipo_operacion"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Tipo
          </label>
          <select
            id="tipo_operacion"
            name="tipo_operacion"
            defaultValue={defaultTipo}
            disabled={loading}
            className={inputClass}
            required
          >
            <option value="alquiler">{TIPO_OPERACION_LABELS.alquiler}</option>
            <option value="venta">{TIPO_OPERACION_LABELS.venta}</option>
          </select>
        </div>
      ) : (
        <input
          type="hidden"
          name="tipo_operacion"
          value={fixedTipoOperacion}
        />
      )}

      <div>
        <label
          htmlFor="nombre"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
        >
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          defaultValue={toValue(initial?.nombre)}
          disabled={loading}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="telf"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Teléfono
          </label>
          <input
            id="telf"
            name="telf"
            type="text"
            defaultValue={toValue(initial?.telf)}
            disabled={loading}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={toValue(initial?.email)}
            disabled={loading}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="notas"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
        >
          Notas
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={3}
          defaultValue={toValue(initial?.notas)}
          disabled={loading}
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

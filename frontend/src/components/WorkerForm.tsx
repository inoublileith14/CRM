'use client';

import { FormEvent } from 'react';
import {
  WorkerFormData,
  WORKER_ROL_LABELS,
  WorkerRol,
  normalizeWorkerRol,
} from '@/types/worker';

interface WorkerFormProps {
  initial?: WorkerFormData;
  hasLinkedProfile?: boolean;
  onSubmit: (data: WorkerFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
  wide?: boolean;
}

function toValue(value: string | null | undefined): string {
  return value ?? '';
}

export function WorkerForm({
  initial,
  hasLinkedProfile = false,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
  wide = false,
}: WorkerFormProps) {
  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60';
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    await onSubmit({
      nombre: (form.get('nombre') as string).trim(),
      telf: (form.get('telf') as string) || null,
      email: (form.get('email') as string) || null,
      rol: (form.get('rol') as WorkerRol) || 'asesor',
      activo: form.get('activo') === 'on',
      notas: (form.get('notas') as string) || null,
    });
  }

  const fieldsGrid = wide
    ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-4'
    : 'space-y-4';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={fieldsGrid}>
        <div className={wide ? 'sm:col-span-2 xl:col-span-1' : undefined}>
          <label htmlFor="nombre" className={labelClass}>
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

        <div>
          <label htmlFor="telf" className={labelClass}>
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

        <div className={wide ? 'sm:col-span-2 xl:col-span-1' : undefined}>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={toValue(initial?.email)}
            disabled={loading}
            className={inputClass}
          />
          {!hasLinkedProfile && (
            <p className="mt-1 text-xs text-slate-500">
              Se enviará invitación para crear su cuenta.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="rol" className={labelClass}>
            Rol
          </label>
          <select
            id="rol"
            name="rol"
            defaultValue={
              initial?.rol ? normalizeWorkerRol(initial.rol) : 'asesor'
            }
            disabled={loading}
            className={inputClass}
          >
            {(Object.keys(WORKER_ROL_LABELS) as WorkerRol[]).map((rol) => (
              <option key={rol} value={rol}>
                {WORKER_ROL_LABELS[rol]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={initial?.activo ?? true}
              disabled={loading}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Activo
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="notas" className={labelClass}>
          Notas
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={wide ? 4 : 3}
          defaultValue={toValue(initial?.notas)}
          disabled={loading}
          className={inputClass}
          placeholder="Opcional"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

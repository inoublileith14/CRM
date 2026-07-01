'use client';

import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { MultiSelectField } from '@/components/MultiSelectField';
import {
  formatClienteZonasLabel,
  normalizeClienteZonas,
} from '@/lib/cliente-zonas';
import { useFormOptionsQuery } from '@/hooks/use-dashboard-queries';
import {
  CLIENTE_ESTADO_LABELS,
  CLIENTE_ORIGEN_LABELS,
  ClienteEstado,
  ClienteFormData,
  ClienteOrigen,
} from '@/types/cliente';
import { TIPO_OPERACION_LABELS, TipoOperacion } from '@/types/inmueble';
import { getWorkerRolLabel } from '@/types/worker';

interface ClienteFormProps {
  initial?: ClienteFormData;
  onSubmit: (data: ClienteFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
}

function toValue(value: string | null | undefined): string {
  return value ?? '';
}

function zonasToInputValue(value: string[] | null | undefined): string {
  return formatClienteZonasLabel(value, '');
}

function parseZonasInput(value: string): string[] {
  return normalizeClienteZonas(
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ClienteForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
}: ClienteFormProps) {
  const [inmuebleIds, setInmuebleIds] = useState<string[]>(
    initial?.inmueble_ids ?? [],
  );
  const [workerIds, setWorkerIds] = useState<string[]>(
    initial?.worker_ids ?? [],
  );
  const { inmuebles, workers, isPending: optionsLoading } = useFormOptionsQuery();

  const inmuebleOptions = useMemo(
    () =>
      inmuebles.map((i) => ({
        id: i.id,
        label: i.direccion_piso_real || 'Sin dirección',
        sublabel: [
          i.barrio_distrito,
          i.tipo_operacion ? TIPO_OPERACION_LABELS[i.tipo_operacion] : null,
        ]
          .filter(Boolean)
          .join(' · '),
      })),
    [inmuebles],
  );

  const workerOptions = useMemo(
    () =>
      workers.map((w) => ({
        id: w.id,
        label: w.nombre,
        sublabel: getWorkerRolLabel(w.rol),
      })),
    [workers],
  );

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fechaRaw = form.get('fecha_contacto') as string;
    const tipoRaw = (form.get('tipo_operacion') as string) || null;

    if (inmuebleIds.length === 0 && !tipoRaw) {
      toast.error('Selecciona el tipo de cliente (alquiler o venta)');
      return;
    }

    await onSubmit({
      nombre: (form.get('nombre') as string).trim(),
      email: (form.get('email') as string) || null,
      telefono: (form.get('telefono') as string) || null,
      ciudad: (form.get('ciudad') as string) || null,
      barrio: parseZonasInput((form.get('barrio') as string) || ''),
      distrito: parseZonasInput((form.get('distrito') as string) || ''),
      tipo_nomina: initial?.tipo_nomina ?? null,
      tipo_cliente: initial?.tipo_cliente ?? null,
      estado: (form.get('estado') as ClienteEstado) || 'pendiente',
      origen: ((form.get('origen') as string) || null) as ClienteOrigen | null,
      estado_contacto: (form.get('estado_contacto') as string) || null,
      descripcion: (form.get('descripcion') as string) || null,
      ref_cliente: (form.get('ref_cliente') as string) || null,
      mensaje: (form.get('mensaje') as string) || null,
      fecha_contacto: fechaRaw ? `${fechaRaw}T00:00:00.000Z` : null,
      fecha_entrada_inmueble: initial?.fecha_entrada_inmueble ?? null,
      presupuesto_maximo: initial?.presupuesto_maximo ?? null,
      banos: initial?.banos ?? null,
      fecha_ultima_gestion: initial?.fecha_ultima_gestion ?? null,
      notas: (form.get('notas') as string) || null,
      tipo_operacion: tipoRaw as TipoOperacion,
      inmueble_ids: inmuebleIds,
      worker_ids: workerIds,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Tipo</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="tipo_operacion"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Alquiler o venta
            </label>
            <select
              id="tipo_operacion"
              name="tipo_operacion"
              defaultValue={toValue(initial?.tipo_operacion ?? undefined)}
              disabled={loading}
              className={inputClass}
            >
              <option value="">— Seleccionar —</option>
              {(['alquiler', 'venta'] as const).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {TIPO_OPERACION_LABELS[tipo]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Obligatorio si el cliente aún no está vinculado a un inmueble.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Estadísticas por anuncio
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="origen"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Origen
            </label>
            <select
              id="origen"
              name="origen"
              defaultValue={toValue(initial?.origen ?? undefined)}
              disabled={loading}
              className={inputClass}
            >
              <option value="">—</option>
              {(Object.keys(CLIENTE_ORIGEN_LABELS) as ClienteOrigen[]).map(
                (o) => (
                  <option key={o} value={o}>
                    {CLIENTE_ORIGEN_LABELS[o]}
                  </option>
                ),
              )}
            </select>
          </div>
          <div>
            <label
              htmlFor="estado_contacto"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Estado contacto
            </label>
            <input
              id="estado_contacto"
              name="estado_contacto"
              type="text"
              placeholder="Ej. No contestada"
              defaultValue={toValue(initial?.estado_contacto)}
              disabled={loading}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="descripcion"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Descripción
            </label>
            <input
              id="descripcion"
              name="descripcion"
              type="text"
              placeholder="Piso en venta en..."
              defaultValue={toValue(initial?.descripcion)}
              disabled={loading}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="ref_cliente"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Ref. cliente
            </label>
            <input
              id="ref_cliente"
              name="ref_cliente"
              type="text"
              defaultValue={toValue(initial?.ref_cliente)}
              disabled={loading}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="nombre"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Usuario
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
            <label
              htmlFor="fecha_contacto"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Fecha
            </label>
            <input
              id="fecha_contacto"
              name="fecha_contacto"
              type="date"
              defaultValue={toDateInput(initial?.fecha_contacto)}
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
          <div>
            <label
              htmlFor="telefono"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              type="text"
              defaultValue={toValue(initial?.telefono)}
              disabled={loading}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="mensaje"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Mensaje
            </label>
            <textarea
              id="mensaje"
              name="mensaje"
              rows={4}
              defaultValue={toValue(initial?.mensaje)}
              disabled={loading}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">CRM</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="ciudad"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Ciudad
            </label>
            <input
              id="ciudad"
              name="ciudad"
              type="text"
              defaultValue={toValue(initial?.ciudad)}
              disabled={loading}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="barrio"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Barrio
            </label>
            <input
              id="barrio"
              name="barrio"
              type="text"
              defaultValue={zonasToInputValue(initial?.barrio)}
              disabled={loading}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="distrito"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Distrito
            </label>
            <input
              id="distrito"
              name="distrito"
              type="text"
              defaultValue={zonasToInputValue(initial?.distrito)}
              disabled={loading}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="estado"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Estado CRM
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={initial?.estado ?? 'pendiente'}
              disabled={loading}
              className={inputClass}
            >
              {(Object.keys(CLIENTE_ESTADO_LABELS) as ClienteEstado[]).map(
                (estado) => (
                  <option key={estado} value={estado}>
                    {CLIENTE_ESTADO_LABELS[estado]}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="notas"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Notas internas
            </label>
            <textarea
              id="notas"
              name="notas"
              rows={2}
              defaultValue={toValue(initial?.notas)}
              disabled={loading}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Inmuebles y trabajadores
        </h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <MultiSelectField
            label="Inmuebles"
            options={inmuebleOptions}
            selected={inmuebleIds}
            onChange={setInmuebleIds}
            disabled={loading}
            emptyMessage="No hay inmuebles registrados"
          />
          <MultiSelectField
            label="Trabajadores"
            options={workerOptions}
            selected={workerIds}
            onChange={setWorkerIds}
            disabled={loading}
            emptyMessage="No hay trabajadores registrados"
          />
        </div>
      </section>

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

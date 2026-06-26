'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { createCliente } from '@/lib/clientes-api';
import { getDefaultClienteEntradaIso } from '@/lib/cliente-date-utils';
import {
  ClienteGestionEstado,
  getClienteGestionEstadoOptions,
  getDefaultClienteGestionEstado,
} from '@/lib/cliente-gestion-estado';
import {
  updateClienteFechaUltimaGestion,
  updateClienteGestionEstado,
} from '@/lib/inmuebles-api';
import { TipoOperacion } from '@/types/inmueble';
import { Worker, getWorkerRolLabel } from '@/types/worker';

interface InmuebleClienteManualAddButtonProps {
  inmuebleId: string;
  inmuebleRef: string | null | undefined;
  tipoOperacion: TipoOperacion;
  workers: Worker[];
  onComplete: () => void;
  disabled?: boolean;
  compact?: boolean;
}

function isoToDateInput(iso: string): string {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function dateInputToIso(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? `${trimmed}T00:00:00.000Z` : null;
}

export function InmuebleClienteManualAddButton({
  inmuebleId,
  inmuebleRef,
  tipoOperacion,
  workers,
  onComplete,
  disabled,
  compact = false,
}: InmuebleClienteManualAddButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultGestion = getDefaultClienteGestionEstado(tipoOperacion);
  const gestionOptions = useMemo(
    () => getClienteGestionEstadoOptions(tipoOperacion),
    [tipoOperacion],
  );

  const focusRingClass =
    tipoOperacion === 'alquiler'
      ? 'focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'focus:border-blue-600 focus:ring-blue-600/20';
  const accentButtonClass =
    tipoOperacion === 'alquiler'
      ? 'bg-emerald-600 hover:bg-emerald-500'
      : 'bg-blue-700 hover:bg-blue-600';
  const inputClass = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 disabled:opacity-60 ${focusRingClass}`;

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ref = inmuebleRef?.trim();
    if (!ref) {
      toast.error('Este inmueble no tiene referencia. Añádela antes de crear clientes.');
      return;
    }

    const form = new FormData(event.currentTarget);
    const nombre = (form.get('nombre') as string).trim();
    if (!nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const telefono = ((form.get('telefono') as string) || '').trim() || null;
    const fechaContactoRaw = (form.get('fecha_contacto') as string) || '';
    const fechaUltimaRaw = (form.get('fecha_ultima_gestion') as string) || '';
    const gestionEstado = (form.get('gestion_estado') as ClienteGestionEstado) || defaultGestion;
    const notas = ((form.get('notas') as string) || '').trim() || null;
    const workerId = (form.get('worker_id') as string) || '';

    setSaving(true);
    try {
      const created = await createCliente({
        nombre,
        email: null,
        telefono,
        ciudad: null,
        estado: 'pendiente',
        origen: null,
        estado_contacto: null,
        descripcion: null,
        ref_cliente: ref,
        mensaje: null,
        fecha_contacto: dateInputToIso(fechaContactoRaw),
        fecha_ultima_gestion: null,
        presupuesto_maximo: null,
        banos: null,
        notas,
        tipo_operacion: tipoOperacion,
        inmueble_ids: [inmuebleId],
        worker_ids: workerId ? [workerId] : [],
      });

      if (gestionEstado !== defaultGestion) {
        await updateClienteGestionEstado(inmuebleId, created.id, gestionEstado);
      }

      const fechaUltimaIso = dateInputToIso(fechaUltimaRaw);
      if (fechaUltimaIso) {
        await updateClienteFechaUltimaGestion(
          inmuebleId,
          created.id,
          fechaUltimaIso,
        );
      }

      toast.success('Cliente añadido');
      setOpen(false);
      onComplete();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo crear el cliente',
      );
    } finally {
      setSaving(false);
    }
  }

  const defaultEntradaDate = isoToDateInput(getDefaultClienteEntradaIso());

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled || saving}
        className={
          compact
            ? `inline-flex shrink-0 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60`
            : `inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto`
        }
      >
        <Plus className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        {compact ? 'Añadir' : 'Añadir cliente'}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-slate-900/50"
            onClick={closeModal}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Nuevo cliente
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Se vincula a este inmueble
                  {inmuebleRef?.trim() ? (
                    <>
                      {' '}
                      · ref.{' '}
                      <span className="font-medium text-slate-700">
                        {inmuebleRef.trim()}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <div>
                <label
                  htmlFor="manual-cliente-nombre"
                  className="mb-1 block text-xs font-medium text-slate-600"
                >
                  Nombre *
                </label>
                <input
                  id="manual-cliente-nombre"
                  name="nombre"
                  type="text"
                  required
                  autoFocus
                  disabled={saving}
                  className={inputClass}
                  placeholder="Nombre del cliente"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="manual-cliente-telefono"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Teléfono
                  </label>
                  <input
                    id="manual-cliente-telefono"
                    name="telefono"
                    type="tel"
                    disabled={saving}
                    className={inputClass}
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div>
                  <label
                    htmlFor="manual-cliente-fecha-entrada"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Fecha entrada
                  </label>
                  <input
                    id="manual-cliente-fecha-entrada"
                    name="fecha_contacto"
                    type="date"
                    defaultValue={defaultEntradaDate}
                    disabled={saving}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="manual-cliente-gestion"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Gestión
                  </label>
                  <select
                    id="manual-cliente-gestion"
                    name="gestion_estado"
                    defaultValue={defaultGestion}
                    disabled={saving}
                    className={inputClass}
                  >
                    {gestionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="manual-cliente-fecha-gestion"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Última gestión
                  </label>
                  <input
                    id="manual-cliente-fecha-gestion"
                    name="fecha_ultima_gestion"
                    type="date"
                    disabled={saving}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="manual-cliente-trabajador"
                  className="mb-1 block text-xs font-medium text-slate-600"
                >
                  Trabajador
                </label>
                <select
                  id="manual-cliente-trabajador"
                  name="worker_id"
                  defaultValue=""
                  disabled={saving}
                  className={inputClass}
                >
                  <option value="">Sin asignar</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.nombre} ({getWorkerRolLabel(worker.rol)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="manual-cliente-notas"
                  className="mb-1 block text-xs font-medium text-slate-600"
                >
                  Notas
                </label>
                <textarea
                  id="manual-cliente-notas"
                  name="notas"
                  rows={3}
                  disabled={saving}
                  className={`${inputClass} resize-y`}
                  placeholder="Notas internas…"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${accentButtonClass}`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    'Crear cliente'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

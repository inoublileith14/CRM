'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  CoconutBrandedDialog,
  CoconutBrandedDialogCancelButton,
  CoconutBrandedDialogFooter,
  CoconutBrandedDialogPrimaryButton,
  COCONUT_DIALOG_INPUT_CLASS,
  COCONUT_DIALOG_LABEL_CLASS,
} from '@/components/CoconutBrandedDialog';
import {
  GestionCalendarEventDialog,
  GestionCalendarEventFormValues,
} from '@/components/GestionCalendarEventDialog';
import { createCliente } from '@/lib/clientes-api';
import { getDefaultClienteEntradaIso } from '@/lib/cliente-date-utils';
import {
  ClienteGestionEstado,
  getClienteGestionEstadoOptions,
  getDefaultClienteGestionEstado,
  requiresCalendarEventDialog,
} from '@/lib/cliente-gestion-estado';
import {
  handleGestionCalendarError,
  saveGestionWithCalendar,
} from '@/lib/save-gestion-with-calendar';
import {
  updateClienteFechaUltimaGestion,
  updateClienteGestionEstado,
} from '@/lib/inmuebles-api';
import { useCalendarStatusQuery } from '@/hooks/use-dashboard-queries';
import { TipoOperacion } from '@/types/inmueble';
import { Worker, getWorkerRolLabel } from '@/types/worker';

interface InmuebleClienteManualAddButtonProps {
  inmuebleId: string;
  inmuebleRef: string | null | undefined;
  inmuebleLabel?: string | null;
  tipoOperacion: TipoOperacion;
  workers: Worker[];
  onComplete: () => void;
  disabled?: boolean;
  compact?: boolean;
}

type PendingManualCliente = {
  nombre: string;
  telefono: string | null;
  fechaContactoRaw: string;
  fechaUltimaRaw: string;
  gestionEstado: Extract<ClienteGestionEstado, 'visita_concertada' | 'videollamada'>;
  notas: string | null;
  workerId: string;
};

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
  inmuebleLabel = null,
  tipoOperacion,
  workers,
  onComplete,
  disabled,
  compact = false,
}: InmuebleClienteManualAddButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [pendingCalendarCliente, setPendingCalendarCliente] =
    useState<PendingManualCliente | null>(null);

  const calendarStatusQuery = useCalendarStatusQuery(calendarDialogOpen);
  const calendarConnected = calendarStatusQuery.data?.connected ?? false;
  const canCreateEvents = calendarStatusQuery.data?.canCreateEvents ?? false;

  const defaultGestion = getDefaultClienteGestionEstado(tipoOperacion);
  const gestionOptions = useMemo(
    () => getClienteGestionEstadoOptions(tipoOperacion),
    [tipoOperacion],
  );

  const primaryTone = tipoOperacion === 'alquiler' ? 'success' : 'info';
  const inputClass = COCONUT_DIALOG_INPUT_CLASS;

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  async function createClienteRecord(form: PendingManualCliente | FormData) {
    const ref = inmuebleRef?.trim();
    if (!ref) {
      throw new Error(
        'Este inmueble no tiene referencia. Añádela antes de crear clientes.',
      );
    }

    const nombre =
      form instanceof FormData
        ? (form.get('nombre') as string).trim()
        : form.nombre.trim();
    if (!nombre) {
      throw new Error('El nombre es obligatorio');
    }

    const telefono =
      form instanceof FormData
        ? ((form.get('telefono') as string) || '').trim() || null
        : form.telefono;
    const fechaContactoRaw =
      form instanceof FormData
        ? (form.get('fecha_contacto') as string) || ''
        : form.fechaContactoRaw;
    const notas =
      form instanceof FormData
        ? ((form.get('notas') as string) || '').trim() || null
        : form.notas;
    const workerId =
      form instanceof FormData ? (form.get('worker_id') as string) || '' : form.workerId;

    return createCliente({
      nombre,
      email: null,
      telefono,
      ciudad: null,
      barrio: [],
      distrito: [],
      tipo_nomina: null,
      tipo_ingreso: null,
      tipo_cliente: null,
      estado: 'pendiente',
      origen: null,
      estado_contacto: null,
      descripcion: null,
      ref_cliente: ref,
      mensaje: null,
      fecha_contacto: dateInputToIso(fechaContactoRaw),
      fecha_entrada_inmueble: null,
      fecha_ultima_gestion: null,
      presupuesto_maximo: null,
      banos: null,
      notas,
      tipo_operacion: tipoOperacion,
      inmueble_ids: [inmuebleId],
      worker_ids: workerId ? [workerId] : [],
    });
  }

  async function finalizeClienteGestion(
    createdId: string,
    gestionEstado: ClienteGestionEstado,
    formValues?: GestionCalendarEventFormValues,
    fechaUltimaRaw?: string,
  ) {
    if (requiresCalendarEventDialog(gestionEstado)) {
      await saveGestionWithCalendar({
        inmuebleId,
        clienteId: createdId,
        next: gestionEstado,
        formValues,
        queryClient,
      });
      return;
    }

    if (gestionEstado !== defaultGestion) {
      await updateClienteGestionEstado(inmuebleId, createdId, gestionEstado);
    }

    const fechaUltimaIso = dateInputToIso(fechaUltimaRaw ?? '');
    if (fechaUltimaIso) {
      await updateClienteFechaUltimaGestion(
        inmuebleId,
        createdId,
        fechaUltimaIso,
      );
    }

    toast.success('Cliente añadido');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const nombre = (form.get('nombre') as string).trim();
    if (!nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const gestionEstado =
      (form.get('gestion_estado') as ClienteGestionEstado) || defaultGestion;

    if (requiresCalendarEventDialog(gestionEstado)) {
      setPendingCalendarCliente({
        nombre,
        telefono: ((form.get('telefono') as string) || '').trim() || null,
        fechaContactoRaw: (form.get('fecha_contacto') as string) || '',
        fechaUltimaRaw: (form.get('fecha_ultima_gestion') as string) || '',
        gestionEstado,
        notas: ((form.get('notas') as string) || '').trim() || null,
        workerId: (form.get('worker_id') as string) || '',
      });
      setCalendarDialogOpen(true);
      return;
    }

    setSaving(true);
    try {
      const created = await createClienteRecord(form);
      await finalizeClienteGestion(
        created.id,
        gestionEstado,
        undefined,
        (form.get('fecha_ultima_gestion') as string) || '',
      );
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

  async function handleCalendarConfirm(formValues: GestionCalendarEventFormValues) {
    if (!pendingCalendarCliente) return;

    setSaving(true);
    try {
      const created = await createClienteRecord(pendingCalendarCliente);
      await finalizeClienteGestion(
        created.id,
        pendingCalendarCliente.gestionEstado,
        formValues,
      );
      setCalendarDialogOpen(false);
      setPendingCalendarCliente(null);
      setOpen(false);
      onComplete();
    } catch (error) {
      handleGestionCalendarError(error);
    } finally {
      setSaving(false);
    }
  }

  function handleCalendarCancel() {
    if (saving) return;
    setCalendarDialogOpen(false);
    setPendingCalendarCliente(null);
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
        <CoconutBrandedDialog
          open={open}
          onClose={closeModal}
          blockClose={saving}
          title="Nuevo cliente"
          subtitle="CLIENTES"
          size="lg"
          align="left"
          scrollable
          description={
            <>
              Se vincula a este inmueble
              {inmuebleRef?.trim() ? (
                <>
                  {' '}
                  · ref.{' '}
                  <span className="font-medium text-[#24211f]">
                    {inmuebleRef.trim()}
                  </span>
                </>
              ) : null}
            </>
          }
          footer={
            <CoconutBrandedDialogFooter align="end">
              <CoconutBrandedDialogCancelButton onClick={closeModal} disabled={saving}>
                Cancelar
              </CoconutBrandedDialogCancelButton>
              <CoconutBrandedDialogPrimaryButton
                type="submit"
                form="manual-cliente-form"
                disabled={saving}
                loading={saving}
                tone={primaryTone}
              >
                {saving ? 'Guardando…' : 'Crear cliente'}
              </CoconutBrandedDialogPrimaryButton>
            </CoconutBrandedDialogFooter>
          }
        >
            <form
              id="manual-cliente-form"
              onSubmit={(event) => void handleSubmit(event)}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="manual-cliente-nombre"
                  className={COCONUT_DIALOG_LABEL_CLASS}
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
                    className={COCONUT_DIALOG_LABEL_CLASS}
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
                    className={COCONUT_DIALOG_LABEL_CLASS}
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
                    className={COCONUT_DIALOG_LABEL_CLASS}
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
                    className={COCONUT_DIALOG_LABEL_CLASS}
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
                  className={COCONUT_DIALOG_LABEL_CLASS}
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
                  className={COCONUT_DIALOG_LABEL_CLASS}
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

            </form>
        </CoconutBrandedDialog>
      ) : null}

      {pendingCalendarCliente ? (
        <GestionCalendarEventDialog
          open={calendarDialogOpen}
          gestionEstado={pendingCalendarCliente.gestionEstado}
          clienteNombre={pendingCalendarCliente.nombre}
          clienteTelefono={pendingCalendarCliente.telefono}
          clienteRef={inmuebleRef?.trim() ?? null}
          clienteNotas={pendingCalendarCliente.notas}
          inmuebleLabel={inmuebleLabel}
          calendarConnected={calendarConnected}
          canCreateEvents={canCreateEvents}
          loading={saving}
          onConfirm={(formValues) => void handleCalendarConfirm(formValues)}
          onCancel={handleCalendarCancel}
        />
      ) : null}
    </>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ClienteCopyContactsButton } from '@/components/ClienteCopyContactsButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ClienteExcelImportButton } from '@/components/ClienteExcelImportButton';
import { InmuebleClienteManualAddButton } from '@/components/InmuebleClienteManualAddButton';
import { ClienteWhatsAppButton } from '@/components/ClienteWhatsAppButton';
import { ClienteFechaUltimaGestionCell } from '@/components/ClienteFechaUltimaGestionCell';
import { ClienteFechaUltimaGestionFilterHead } from '@/components/ClienteFechaUltimaGestionFilterHead';
import { ClienteGestionEstadoSelect } from '@/components/ClienteGestionEstadoSelect';
import { ClienteVisitaNoRealizadaSwitch } from '@/components/ClienteVisitaNoRealizadaSwitch';
import type { ClienteGestionEventContext } from '@/components/ClienteGestionEstadoSelect';
import {
  GestionCalendarEventDialog,
  GestionCalendarEventFormValues,
} from '@/components/GestionCalendarEventDialog';
import { ClienteTrabajadorCell } from '@/components/ClienteTrabajadorCell';
import { ClienteNotasCell } from '@/components/ClienteNotasCell';
import { ClienteNombreCell } from '@/components/ClienteNombreCell';
import { clienteRefTextClass } from '@/components/ClienteRefValue';
import { ClienteTelefonosCell } from '@/components/ClienteTelefonosCell';
import { InmuebleClienteFiltersBar } from '@/components/InmuebleClienteFiltersBar';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';
import { TableFilterEmptyState } from '@/components/TableFilterEmptyState';
import {
  useCalendarStatusQuery,
  useInmuebleQuery,
  useInvalidateDashboardQueries,
  useWorkersQuery,
} from '@/hooks/use-dashboard-queries';
import { useInmuebleClientesRealtime } from '@/hooks/use-inmueble-clientes-realtime';
import { useQueryUiState } from '@/hooks/use-query-ui';
import {
  ClienteGestionEstado,
  getClienteGestionEstadoOption,
  getClienteGestionEstadoOptions,
  getGestionOptionStyle,
  requiresCalendarEventDialog,
} from '@/lib/cliente-gestion-estado';
import {
  handleGestionCalendarError,
  saveGestionWithCalendar,
} from '@/lib/save-gestion-with-calendar';
import {
  bulkAssignWorker,
  bulkDeleteClientes,
  bulkUnassignWorker,
} from '@/lib/clientes-api';
import { updateClienteGestionEstado } from '@/lib/inmuebles-api';
import {
  applyInmuebleClienteListFilters,
  EMPTY_INMUEBLE_CLIENTE_FILTERS,
  hasActiveInmuebleClienteFilters,
  INMUEBLE_CLIENTE_UNASSIGNED_WORKER,
  InmuebleClienteFechaSort,
  InmuebleClienteFilters,
  normalizeInmuebleClienteFilters,
} from '@/lib/inmueble-cliente-filters';
import { buildInmuebleClienteTableColumns } from '@/lib/table-columns';
import { formatTableHeaderLabel } from '@/lib/table-header-label';
import { usePersistedState } from '@/hooks/usePersistedState';
import { buildTableStateKey } from '@/lib/persisted-table-state';
import { formatClienteEntradaDate } from '@/lib/cliente-date-utils';
import { InmuebleInfoCard } from '@/components/InmuebleInfoCard';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { isAdminUser } from '@/lib/auth-roles';
import { queryKeys } from '@/lib/query-keys';
import {
  Cliente,
} from '@/types/cliente';
import { Inmueble, TipoOperacion } from '@/types/inmueble';
import { getWorkerRolLabel } from '@/types/worker';
import {
  INMUEBLE_CLIENTES_TABLE_CLASS,
  INMUEBLE_CLIENTES_TABLE_HEAD_X_SCROLL_CLASS,
  INMUEBLE_CLIENTES_TABLE_X_SCROLL_CLASS,
  INMUEBLE_CLIENTE_ACTIONS_TD_CLASS,
  INMUEBLE_CLIENTE_ACTIONS_TH_CLASS,
  INMUEBLE_CLIENTE_CHECKBOX_TD_CLASS,
  INMUEBLE_CLIENTE_CHECKBOX_TH_CLASS,
  InmuebleClienteTableColgroup,
  inmuebleClienteBodyClass,
  inmuebleClienteHeadClass,
} from '@/lib/inmueble-cliente-table-layout';

interface InmuebleDetailPageContentProps {
  listPath: string;
  listLabel: string;
  expectedTipo: TipoOperacion;
}

export function InmuebleDetailPageContent({
  listPath,
  listLabel,
  expectedTipo,
}: InmuebleDetailPageContentProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const id = params.id as string;

  const queryClient = useQueryClient();
  const { invalidateInmueble, invalidateClientesByTipo } =
    useInvalidateDashboardQueries();
  const inmuebleQuery = useInmuebleQuery(id);
  useInmuebleClientesRealtime(id);
  const { user } = useCurrentUser();
  const canManageInmuebles = isAdminUser(user?.rol);
  const workersQuery = useWorkersQuery(true);
  const {
    data: inmueble,
    showInitialLoading,
    isRefreshing,
    showError,
  } = useQueryUiState(inmuebleQuery);
  const workers = workersQuery.data ?? [];

  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [selectedClienteIds, setSelectedClienteIds] = useState<Set<string>>(
    new Set(),
  );
  const [assigning, setAssigning] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [deletingClientes, setDeletingClientes] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkCalendarDialogOpen, setBulkCalendarDialogOpen] = useState(false);
  const [bulkCalendarPending, setBulkCalendarPending] = useState<{
    clienteId: string;
    estado: Extract<ClienteGestionEstado, 'visita_concertada' | 'videollamada'>;
    context: ClienteGestionEventContext;
  } | null>(null);
  const bulkBusy = assigning || updatingEstado || deletingClientes;
  const tableHeadScrollRef = useRef<HTMLDivElement>(null);
  const tableBodyScrollRef = useRef<HTMLDivElement>(null);
  const syncTableHorizontalScroll = useCallback((source: 'head' | 'body') => {
    const head = tableHeadScrollRef.current;
    const body = tableBodyScrollRef.current;
    if (!head || !body) return;
    if (source === 'head') {
      body.scrollLeft = head.scrollLeft;
    } else {
      head.scrollLeft = body.scrollLeft;
    }
  }, []);
  const calendarStatusQuery = useCalendarStatusQuery(bulkCalendarDialogOpen);
  const calendarConnected = calendarStatusQuery.data?.connected ?? false;
  const canCreateEvents = calendarStatusQuery.data?.canCreateEvents ?? false;
  const [clienteListState, setClienteListState] = usePersistedState(
    `${buildTableStateKey(pathname)}:clientes`,
    {
      clienteFilters: EMPTY_INMUEBLE_CLIENTE_FILTERS,
      fechaContactoSort: null as InmuebleClienteFechaSort,
      fechaUltimaGestionSort: null as InmuebleClienteFechaSort,
    },
  );
  const {
    clienteFilters: rawClienteFilters,
    fechaContactoSort,
    fechaUltimaGestionSort,
  } = clienteListState;
  const clienteFilters = useMemo(
    () => normalizeInmuebleClienteFilters(rawClienteFilters),
    [rawClienteFilters],
  );
  const setClienteFilters = (
    value:
      | InmuebleClienteFilters
      | ((prev: InmuebleClienteFilters) => InmuebleClienteFilters),
  ) =>
    setClienteListState((prev) => ({
      ...prev,
      clienteFilters:
        typeof value === 'function' ? value(prev.clienteFilters) : value,
    }));
  const setFechaContactoSort = (
    value:
      | InmuebleClienteFechaSort
      | ((prev: InmuebleClienteFechaSort) => InmuebleClienteFechaSort),
  ) =>
    setClienteListState((prev) => ({
      ...prev,
      fechaContactoSort:
        typeof value === 'function'
          ? value(prev.fechaContactoSort)
          : value,
    }));

  const setFechaUltimaGestionSort = (
    value:
      | InmuebleClienteFechaSort
      | ((prev: InmuebleClienteFechaSort) => InmuebleClienteFechaSort),
  ) =>
    setClienteListState((prev) => ({
      ...prev,
      fechaUltimaGestionSort:
        typeof value === 'function'
          ? value(prev.fechaUltimaGestionSort)
          : value,
    }));

  useEffect(() => {
    if (!inmueble) return;
    if (inmueble.tipo_operacion !== expectedTipo) {
      toast.error('Este inmueble no pertenece a esta sección');
      router.push(listPath);
    }
  }, [inmueble, expectedTipo, listPath, router]);

  const refreshInmueble = useCallback(async () => {
    await invalidateInmueble(id);
    if (expectedTipo) {
      await invalidateClientesByTipo(expectedTipo);
    }
  }, [id, expectedTipo, invalidateInmueble, invalidateClientesByTipo]);

  function patchInmuebleClientes(
    updater: (clientes: Cliente[]) => Cliente[],
  ) {
    queryClient.setQueryData<Inmueble>(
      queryKeys.inmuebles.detail(id),
      (prev) => {
        if (!prev?.clientes) return prev;
        return { ...prev, clientes: updater(prev.clientes) };
      },
    );
  }

  function patchInmuebleDetail(next: Partial<Inmueble>) {
    queryClient.setQueryData<Inmueble>(
      queryKeys.inmuebles.detail(id),
      (prev) => (prev ? { ...prev, ...next } : prev),
    );
  }

  const clientes = inmueble?.clientes ?? [];

  function workerLabel(cliente: Cliente): string {
    const names =
      cliente.workers?.map((worker) => worker.nombre).filter(Boolean) ?? [];
    return names.length > 0 ? names.join(', ') : 'Sin asignar';
  }

  const clienteTableColumns = useMemo(
    () => buildInmuebleClienteTableColumns(workerLabel, expectedTipo),
    [expectedTipo],
  );

  const accentLink =
    expectedTipo === 'alquiler'
      ? 'text-emerald-600 hover:text-emerald-500'
      : 'text-blue-600 hover:text-blue-500';
  const accentCheckbox =
    expectedTipo === 'alquiler'
      ? 'text-emerald-600 focus:ring-emerald-500'
      : 'text-blue-700 focus:ring-blue-600';
  const selectedRowClass =
    expectedTipo === 'alquiler' ? 'bg-emerald-50/60' : 'bg-blue-50/70';

  const selectedClientes = useMemo(
    () => clientes.filter((cliente) => selectedClienteIds.has(cliente.id)),
    [clientes, selectedClienteIds],
  );

  function handleClientePatch(clienteId: string, patch: Partial<Cliente>) {
    patchInmuebleClientes((clientes) =>
      clientes.map((cliente) =>
        cliente.id === clienteId ? { ...cliente, ...patch } : cliente,
      ),
    );
  }

  const filteredClientes = useMemo(
    () =>
      applyInmuebleClienteListFilters(
        clientes,
        clienteFilters,
        expectedTipo,
        fechaContactoSort,
        fechaUltimaGestionSort,
      ),
    [clientes, clienteFilters, expectedTipo, fechaContactoSort, fechaUltimaGestionSort],
  );

  const clienteFiltersActive = hasActiveInmuebleClienteFilters(
    clienteFilters,
    fechaContactoSort,
    fechaUltimaGestionSort,
  );

  function toggleFechaContactoSort() {
    setFechaContactoSort((prev) => {
      if (prev === null || prev === 'desc') return 'asc';
      return 'desc';
    });
  }

  function toggleFechaUltimaGestionSort() {
    setFechaUltimaGestionSort((prev) => {
      if (prev === null || prev === 'desc') return 'asc';
      return 'desc';
    });
  }

  function clearAllFilters() {
    setClienteFilters(EMPTY_INMUEBLE_CLIENTE_FILTERS);
    setFechaContactoSort(null);
    setFechaUltimaGestionSort(null);
  }

  function toggleClienteSelection(clienteId: string) {
    setSelectedClienteIds((prev) => {
      const next = new Set(prev);
      if (next.has(clienteId)) {
        next.delete(clienteId);
      } else {
        next.add(clienteId);
      }
      return next;
    });
  }

  function toggleSelectAllClientes(rows: Cliente[]) {
    setSelectedClienteIds((prev) => {
      const allSelected =
        rows.length > 0 && rows.every((c) => prev.has(c.id));
      const next = new Set(prev);
      if (allSelected) {
        for (const c of rows) next.delete(c.id);
      } else {
        for (const c of rows) next.add(c.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedClienteIds(new Set());
  }

  function openDeleteConfirm() {
    if (selectedClienteIds.size === 0) {
      toast.error('Selecciona al menos un cliente');
      return;
    }

    setDeleteConfirmOpen(true);
  }

  async function executeDeleteClientes() {
    const clienteIds = [...selectedClienteIds];

    setDeletingClientes(true);

    try {
      const result = await bulkDeleteClientes({ cliente_ids: clienteIds });
      toast.success(
        `${result.deleted} cliente${result.deleted !== 1 ? 's' : ''} eliminado${result.deleted !== 1 ? 's' : ''}`,
      );
      setDeleteConfirmOpen(false);
      clearSelection();
      await refreshInmueble();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudieron eliminar los clientes',
      );
    } finally {
      setDeletingClientes(false);
    }
  }

  async function handleAssignWorkerSelect(inmuebleId: string, workerId: string) {
    if (!workerId) return;

    if (selectedClienteIds.size === 0) {
      toast.error('Selecciona al menos un cliente');
      return;
    }

    const clienteIds = [...selectedClienteIds];
    const isUnassign = workerId === INMUEBLE_CLIENTE_UNASSIGNED_WORKER;

    setAssigning(true);

    try {
      if (isUnassign) {
        const result = await bulkUnassignWorker({ cliente_ids: clienteIds });
        toast.success(
          `${result.unassigned} cliente${result.unassigned !== 1 ? 's' : ''} sin asignar`,
        );
      } else {
        const result = await bulkAssignWorker({
          worker_id: workerId,
          assignments: clienteIds.map((clienteId) => ({
            cliente_id: clienteId,
            inmueble_id: inmuebleId,
          })),
        });

        toast.success(
          `${result.assigned} cliente${result.assigned !== 1 ? 's' : ''} asignado${result.assigned !== 1 ? 's' : ''}`,
        );
      }

      clearSelection();
      await refreshInmueble();
    } catch (error) {
      const defaultMessage = isUnassign
        ? 'No se pudieron quitar las asignaciones'
        : 'No se pudieron asignar los clientes';
      toast.error(
        error instanceof Error ? error.message : defaultMessage,
      );
    } finally {
      setAssigning(false);
    }
  }

  async function handleBulkGestionEstadoSelect(gestionEstado: string) {
    if (!gestionEstado || !inmueble) return;

    if (selectedClienteIds.size === 0) {
      toast.error('Selecciona al menos un cliente');
      return;
    }

    const next = gestionEstado as ClienteGestionEstado;

    if (requiresCalendarEventDialog(next)) {
      if (selectedClienteIds.size !== 1) {
        toast.error(
          'Para programar visita o videollamada en Google Calendar, selecciona un solo cliente',
        );
        return;
      }

      const clienteId = [...selectedClienteIds][0];
      const cliente = clientes.find((item) => item.id === clienteId);
      if (!cliente) return;

      setBulkCalendarPending({
        clienteId,
        estado: next,
        context: {
          clienteNombre: cliente.nombre,
          clienteTelefono: cliente.telefono,
          clienteRef: cliente.ref_cliente,
          clienteNotas: cliente.notas,
          inmuebleLabel:
            inmueble.direccion_piso_real ??
            inmueble.espejo_direccion ??
            inmueble.ref,
        },
      });
      setBulkCalendarDialogOpen(true);
      return;
    }

    const clienteIds = [...selectedClienteIds];
    setUpdatingEstado(true);

    try {
      const results = await Promise.all(
        clienteIds.map((clienteId) =>
          updateClienteGestionEstado(inmueble.id, clienteId, next),
        ),
      );

      for (let i = 0; i < clienteIds.length; i++) {
        handleClientePatch(clienteIds[i], {
          gestion_estado: results[i].gestion_estado,
          fecha_ultima_gestion: results[i].fecha_ultima_gestion,
        });
      }

      toast.success(
        `${clienteIds.length} cliente${clienteIds.length !== 1 ? 's' : ''} actualizado${clienteIds.length !== 1 ? 's' : ''}`,
      );
      clearSelection();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudieron actualizar los estados',
      );
      await refreshInmueble();
    } finally {
      setUpdatingEstado(false);
    }
  }

  async function handleBulkCalendarConfirm(
    formValues: GestionCalendarEventFormValues,
  ) {
    if (!bulkCalendarPending || !inmueble) return;

    setUpdatingEstado(true);
    try {
      const result = await saveGestionWithCalendar({
        inmuebleId: inmueble.id,
        clienteId: bulkCalendarPending.clienteId,
        next: bulkCalendarPending.estado,
        formValues,
        queryClient,
      });
      handleClientePatch(bulkCalendarPending.clienteId, result);
      clearSelection();
    } catch (error) {
      handleGestionCalendarError(error);
    } finally {
      setUpdatingEstado(false);
      setBulkCalendarPending(null);
      setBulkCalendarDialogOpen(false);
    }
  }

  function handleBulkCalendarCancel() {
    if (updatingEstado) return;
    setBulkCalendarPending(null);
    setBulkCalendarDialogOpen(false);
  }

  const gestionEstadoOptions = getClienteGestionEstadoOptions(expectedTipo);

  const selectClass = `h-7 shrink-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 outline-none transition ${
    expectedTipo === 'alquiler'
      ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
      : 'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
  } disabled:opacity-60`;

  if (showInitialLoading) {
    return (
      <div>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando inmueble…
        </div>
      </div>
    );
  }

  if (showError || !inmueble) {
    return (
      <div>
        <Link
          href={listPath}
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-emerald-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {listLabel}
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center sm:p-8">
          <p className="font-medium text-red-800">
            {inmuebleQuery.error instanceof Error
              ? inmuebleQuery.error.message
              : 'No se pudo cargar el inmueble'}
          </p>
          <button
            type="button"
            onClick={() => inmuebleQuery.refetch()}
            className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-500"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (inmueble.tipo_operacion !== expectedTipo) {
    return null;
  }

  const allClientesSelected =
    filteredClientes.length > 0 &&
    filteredClientes.every((c) => selectedClienteIds.has(c.id));
  const someClientesSelected =
    filteredClientes.some((c) => selectedClienteIds.has(c.id)) &&
    !allClientesSelected;
  const tipoAccentClass =
    expectedTipo === 'alquiler' ? 'text-emerald-600' : 'text-blue-600';
  const clienteTableHeadBg =
    expectedTipo === 'alquiler' ? 'bg-emerald-800' : 'bg-slate-900';

  return (
    <div>
      <InmuebleInfoCard
        inmueble={inmueble}
        onPreviewImage={(src, alt) => setPreviewImage({ src, alt })}
        onUpdated={canManageInmuebles ? (updated) => patchInmuebleDetail(updated) : undefined}
        listPath={listPath}
        listLabel={listLabel}
        editHref={
          canManageInmuebles ? `${listPath}/${inmueble.id}/edit` : undefined
        }
        readOnly={!canManageInmuebles}
        isRefreshing={isRefreshing}
        tipoAccentClass={tipoAccentClass}
      />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="sticky top-0 z-40 bg-white shadow-[0_1px_0_0_rgb(226,232,240)]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 px-2 py-1.5 sm:px-3">
            <h2 className="shrink-0 text-xs font-semibold whitespace-nowrap text-slate-900">
              Clientes ({clientes.length})
            </h2>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <InmuebleClienteManualAddButton
                inmuebleId={inmueble.id}
                inmuebleRef={inmueble.ref}
                inmuebleLabel={
                  inmueble.direccion_piso_real ??
                  inmueble.espejo_direccion ??
                  inmueble.ref
                }
                tipoOperacion={expectedTipo}
                workers={workers}
                onComplete={refreshInmueble}
                compact
              />
              <ClienteExcelImportButton
                inmuebleId={inmueble.id}
                tipoOperacion={expectedTipo}
                onComplete={refreshInmueble}
                compact
              />
            </div>
          </div>

          {clientes.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-3">
              <span className="shrink-0 text-xs text-slate-600">
                {selectedClienteIds.size > 0
                  ? `${selectedClienteIds.size} sel.`
                  : '0 sel.'}
              </span>
              <InmuebleClienteFiltersBar
                filters={clienteFilters}
                onChange={setClienteFilters}
                onClear={clearAllFilters}
                tipoOperacion={expectedTipo}
                workers={workers}
                hasActiveFilters={clienteFiltersActive}
                disabled={bulkBusy}
                compact
              />
              <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
                <ClienteWhatsAppButton
                  inmuebleId={inmueble.id}
                  clienteIds={[...selectedClienteIds]}
                  disabled={bulkBusy}
                  compact
                  onSent={(updates) => {
                    for (const update of updates) {
                      handleClientePatch(update.clienteId, {
                        gestion_estado: update.gestionEstado as Cliente['gestion_estado'],
                        fecha_ultima_gestion: update.fechaUltimaGestion,
                      });
                    }
                  }}
                />
                <ClienteCopyContactsButton
                  clientes={selectedClientes}
                  disabled={bulkBusy}
                  compact
                />
                <select
                  value=""
                  onChange={(e) => void handleBulkGestionEstadoSelect(e.target.value)}
                  disabled={bulkBusy || selectedClienteIds.size === 0}
                  className={`w-full sm:w-auto ${selectClass}`}
                  aria-label="Estado de gestión para asignar"
                >
                  <option value="" disabled>
                    {updatingEstado ? 'Actualizando…' : 'Cambiar estado…'}
                  </option>
                  {gestionEstadoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value=""
                  onChange={(e) =>
                    void handleAssignWorkerSelect(inmueble.id, e.target.value)
                  }
                  disabled={bulkBusy || selectedClienteIds.size === 0}
                  className={`w-full sm:w-auto ${selectClass}`}
                  aria-label="Trabajador para asignar"
                >
                  <option value="" disabled>
                    {assigning ? 'Asignando…' : 'Asignar a trabajador…'}
                  </option>
                  <option value={INMUEBLE_CLIENTE_UNASSIGNED_WORKER}>
                    Sin asignar
                  </option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.nombre} ({getWorkerRolLabel(worker.rol)})
                    </option>
                  ))}
                </select>
                {canManageInmuebles ? (
                  <button
                    type="button"
                    onClick={openDeleteConfirm}
                    disabled={bulkBusy || selectedClienteIds.size === 0}
                    className="inline-flex h-7 w-[11.25rem] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-red-200 bg-white px-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    title="Eliminar los clientes seleccionados"
                  >
                    {deletingClientes ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Eliminar seleccionados
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {filteredClientes.length > 0 && (
            <div
              ref={tableHeadScrollRef}
              className={INMUEBLE_CLIENTES_TABLE_HEAD_X_SCROLL_CLASS}
              onScroll={() => syncTableHorizontalScroll('head')}
            >
              <table className={INMUEBLE_CLIENTES_TABLE_CLASS}>
                <InmuebleClienteTableColgroup tipoOperacion={expectedTipo} />
                <thead className="border-b border-black">
                  <tr>
                    <th className={INMUEBLE_CLIENTE_CHECKBOX_TH_CLASS + ` ${clienteTableHeadBg}`}>
                      <input
                        type="checkbox"
                        checked={allClientesSelected}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = someClientesSelected;
                          }
                        }}
                        onChange={() =>
                          toggleSelectAllClientes(filteredClientes)
                        }
                        disabled={bulkBusy}
                        className={`h-4 w-4 rounded border-slate-300 ${accentCheckbox}`}
                        aria-label="Seleccionar todos los clientes"
                      />
                    </th>
                    {clienteTableColumns.map((col) =>
                      col.key === 'fecha_contacto' ? (
                        <th
                          key={col.key}
                          className={inmuebleClienteHeadClass(col.key, clienteTableHeadBg)}
                        >
                          <button
                            type="button"
                            onClick={toggleFechaContactoSort}
                            className="inline-flex w-full flex-col items-center justify-center gap-0.5 uppercase transition hover:text-yellow-200"
                            title={
                              fechaContactoSort === 'asc'
                                ? 'Más antigua primero — clic para más reciente'
                                : fechaContactoSort === 'desc'
                                  ? 'Más reciente primero — clic para más antigua'
                                  : 'Ordenar por fecha de petición'
                            }
                            aria-label="Ordenar por fecha de petición"
                          >
                            <span className="whitespace-pre-line leading-tight">
                              {formatTableHeaderLabel(col.shortLabel ?? col.label)}
                            </span>
                            {fechaContactoSort === 'asc' ? (
                              <ArrowUp
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden
                              />
                            ) : fechaContactoSort === 'desc' ? (
                              <ArrowDown
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden
                              />
                            ) : (
                              <ArrowUpDown
                                className="h-3.5 w-3.5 shrink-0 opacity-60"
                                aria-hidden
                              />
                            )}
                          </button>
                        </th>
                      ) : col.key === 'fecha_ultima_gestion' ? (
                        <th
                          key={col.key}
                          className={inmuebleClienteHeadClass(col.key, clienteTableHeadBg)}
                        >
                          <ClienteFechaUltimaGestionFilterHead
                            label={col.shortLabel ?? col.label}
                            value={clienteFilters.fecha_ultima_gestion ?? ''}
                            onChange={(fecha_ultima_gestion) =>
                              setClienteFilters((prev) => ({
                                ...prev,
                                fecha_ultima_gestion,
                              }))
                            }
                            disabled={bulkBusy}
                            accent={expectedTipo === 'alquiler' ? 'alquiler' : 'venta'}
                            trailing={
                              <button
                                type="button"
                                onClick={toggleFechaUltimaGestionSort}
                                className="ml-0.5 inline-flex items-center justify-center rounded p-0.5 text-yellow-300 transition hover:bg-emerald-700 hover:text-yellow-200 disabled:opacity-60"
                                title={
                                  fechaUltimaGestionSort === 'asc'
                                    ? 'Más antigua primero — clic para más reciente'
                                    : fechaUltimaGestionSort === 'desc'
                                      ? 'Más reciente primero — clic para más antigua'
                                      : 'Ordenar por última gestión'
                                }
                                aria-label="Ordenar por última gestión"
                              >
                                {fechaUltimaGestionSort === 'asc' ? (
                                  <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                ) : fechaUltimaGestionSort === 'desc' ? (
                                  <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                ) : (
                                  <ArrowUpDown
                                    className="h-3.5 w-3.5 shrink-0 opacity-60"
                                    aria-hidden
                                  />
                                )}
                              </button>
                            }
                          />
                        </th>
                      ) : (
                        <th
                          key={col.key}
                          className={inmuebleClienteHeadClass(col.key, clienteTableHeadBg)}
                        >
                          <span className="block whitespace-pre-line leading-tight">
                            {formatTableHeaderLabel(col.shortLabel ?? col.label)}
                          </span>
                        </th>
                      ),
                    )}
                    <th className={INMUEBLE_CLIENTE_ACTIONS_TH_CLASS + ` ${clienteTableHeadBg}`}>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
          )}
        </div>

        {clientes.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay clientes vinculados a este inmueble. Usa Añadir o Importar
            para añadirlos.
          </p>
        ) : filteredClientes.length === 0 ? (
          <TableFilterEmptyState onClear={clearAllFilters} />
        ) : (
          <div
            ref={tableBodyScrollRef}
            className={INMUEBLE_CLIENTES_TABLE_X_SCROLL_CLASS}
            onScroll={() => syncTableHorizontalScroll('body')}
          >
            <table className={INMUEBLE_CLIENTES_TABLE_CLASS}>
              <InmuebleClienteTableColgroup tipoOperacion={expectedTipo} />
              <tbody>
                {filteredClientes.map((cliente) => {
                  const isSelected = selectedClienteIds.has(cliente.id);

                  return (
                  <tr
                    key={cliente.id}
                    className={`${isSelected ? selectedRowClass : ''} hover:bg-slate-50`}
                  >
                    <td className={INMUEBLE_CLIENTE_CHECKBOX_TD_CLASS}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleClienteSelection(cliente.id)}
                        disabled={bulkBusy}
                        className={`h-4 w-4 rounded border-slate-300 ${accentCheckbox}`}
                        aria-label={`Seleccionar ${cliente.nombre}`}
                      />
                    </td>
                    {clienteTableColumns.map((col) => {
                      if (col.key === 'fecha_contacto') {
                        return (
                          <td
                            key={col.key}
                            className={inmuebleClienteBodyClass(col.key)}
                          >
                            {formatClienteEntradaDate(cliente.fecha_contacto)}
                          </td>
                        );
                      }

                      if (col.key === 'visita_no_realizada') {
                        return (
                          <td
                            key={col.key}
                            className={inmuebleClienteBodyClass(col.key)}
                          >
                            <ClienteVisitaNoRealizadaSwitch
                              inmuebleId={inmueble.id}
                              clienteId={cliente.id}
                              gestionEstado={cliente.gestion_estado}
                              value={cliente.visita_no_realizada}
                              disabled={bulkBusy}
                              onUpdated={(visita_no_realizada) =>
                                handleClientePatch(cliente.id, {
                                  visita_no_realizada,
                                })
                              }
                            />
                          </td>
                        );
                      }

                      if (col.key === 'gestion_estado') {
                        return (
                          <td
                            key={col.key}
                            className={inmuebleClienteBodyClass(col.key)}
                          >
                            <ClienteGestionEstadoSelect
                              inmuebleId={inmueble.id}
                              clienteId={cliente.id}
                              tipoOperacion={expectedTipo}
                              value={cliente.gestion_estado}
                              disabled={bulkBusy}
                              tableLayout
                              eventContext={{
                                clienteNombre: cliente.nombre,
                                clienteTelefono: cliente.telefono,
                                clienteRef: cliente.ref_cliente,
                                clienteNotas: cliente.notas,
                                inmuebleLabel:
                                  inmueble.direccion_piso_real ??
                                  inmueble.espejo_direccion ??
                                  inmueble.ref,
                              }}
                              onUpdated={(result) =>
                                handleClientePatch(cliente.id, {
                                  gestion_estado: result.gestion_estado,
                                  fecha_ultima_gestion: result.fecha_ultima_gestion,
                                  ...(result.gestion_estado === 'visita_concertada' ||
                                  result.gestion_estado === 'videollamada'
                                    ? {}
                                    : { visita_no_realizada: false }),
                                })
                              }
                            />
                          </td>
                        );
                      }

                      if (col.key === 'fecha_ultima_gestion') {
                        const gestionStyle = getGestionOptionStyle(
                          getClienteGestionEstadoOption(
                            cliente.gestion_estado,
                            expectedTipo,
                          ),
                        );
                        return (
                          <td
                            key={col.key}
                            className={inmuebleClienteBodyClass(col.key)}
                            style={{
                              backgroundColor: gestionStyle.backgroundColor,
                              color: gestionStyle.color,
                            }}
                          >
                            <ClienteFechaUltimaGestionCell
                              inmuebleId={inmueble.id}
                              clienteId={cliente.id}
                              value={cliente.fecha_ultima_gestion}
                              disabled={bulkBusy}
                              compact
                              gestionStyle={gestionStyle}
                              onUpdated={(fechaUltimaGestion) =>
                                handleClientePatch(cliente.id, {
                                  fecha_ultima_gestion: fechaUltimaGestion,
                                })
                              }
                            />
                          </td>
                        );
                      }

                      if (col.key === 'telefono') {
                        return (
                          <td
                            key={col.key}
                            className={inmuebleClienteBodyClass(col.key)}
                          >
                            <ClienteTelefonosCell
                              clienteId={cliente.id}
                              telefono={cliente.telefono}
                              telefonosExtra={cliente.telefonos_extra}
                              disabled={bulkBusy}
                              onUpdated={(patch) =>
                                handleClientePatch(cliente.id, patch)
                              }
                            />
                          </td>
                        );
                      }

                      if (col.key === 'nombre') {
                        return (
                          <td
                            key={col.key}
                            className={inmuebleClienteBodyClass(col.key)}
                          >
                            <ClienteNombreCell
                              clienteId={cliente.id}
                              value={cliente.nombre}
                              disabled={bulkBusy}
                              onUpdated={(nombre) =>
                                handleClientePatch(cliente.id, { nombre })
                              }
                            />
                          </td>
                        );
                      }

                      if (col.key === 'notas') {
                        return (
                          <td key={col.key} className={inmuebleClienteBodyClass(col.key)}>
                            <ClienteNotasCell
                              clienteId={cliente.id}
                              value={cliente.notas}
                              disabled={bulkBusy}
                              onUpdated={(notas) =>
                                handleClientePatch(cliente.id, { notas })
                              }
                            />
                          </td>
                        );
                      }

                      if (col.key === 'ref_cliente') {
                        const refText = cliente.ref_cliente?.trim() || '—';
                        return (
                          <td
                            key={col.key}
                            className={inmuebleClienteBodyClass(col.key)}
                            title={refText !== '—' ? refText : undefined}
                          >
                            <span
                              className={clienteRefTextClass}
                              title={refText !== '—' ? refText : undefined}
                            >
                              {refText}
                            </span>
                          </td>
                        );
                      }

                      if (col.key === 'trabajador') {
                        return (
                          <td key={col.key} className={inmuebleClienteBodyClass(col.key)}>
                            <ClienteTrabajadorCell
                              inmuebleId={inmueble.id}
                              clienteId={cliente.id}
                              workers={workers}
                              assignedWorkers={cliente.workers}
                              tipoOperacion={expectedTipo}
                              disabled={bulkBusy}
                              onUpdated={(nextWorkers) =>
                                handleClientePatch(cliente.id, {
                                  workers: nextWorkers,
                                  worker_ids: nextWorkers.map((w) => w.id),
                                  workers_count: nextWorkers.length,
                                })
                              }
                            />
                          </td>
                        );
                      }

                      const display = col.getDisplayValue(cliente);
                      return (
                        <td
                          key={col.key}
                          className={`${inmuebleClienteBodyClass(col.key)} truncate`}
                          title={display}
                        >
                          {display}
                        </td>
                      );
                    })}
                    <td className={INMUEBLE_CLIENTE_ACTIONS_TD_CLASS}>
                      <div className="flex items-center justify-center gap-0.5">
                        <Link
                          href={`/dashboard/clientes/${cliente.id}`}
                          className={`inline-flex items-center justify-center rounded p-1 transition hover:bg-slate-100 ${accentLink}`}
                          title="Ver cliente"
                          aria-label="Ver cliente"
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        </Link>
                        <Link
                          href={`/dashboard/clientes/${cliente.id}/edit`}
                          className={`inline-flex items-center justify-center rounded p-1 transition hover:bg-slate-100 ${accentLink}`}
                          title="Editar cliente"
                          aria-label="Editar cliente"
                        >
                          <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        </Link>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {bulkCalendarPending ? (
        <GestionCalendarEventDialog
          open={bulkCalendarDialogOpen}
          gestionEstado={bulkCalendarPending.estado}
          clienteNombre={bulkCalendarPending.context.clienteNombre}
          clienteTelefono={bulkCalendarPending.context.clienteTelefono}
          clienteRef={bulkCalendarPending.context.clienteRef}
          clienteNotas={bulkCalendarPending.context.clienteNotas}
          inmuebleLabel={bulkCalendarPending.context.inmuebleLabel}
          calendarConnected={calendarConnected}
          canCreateEvents={canCreateEvents}
          loading={updatingEstado}
          onConfirm={(formValues) => void handleBulkCalendarConfirm(formValues)}
          onCancel={handleBulkCalendarCancel}
        />
      ) : null}

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Eliminar clientes"
        description={`¿Eliminar ${selectedClienteIds.size} cliente${selectedClienteIds.size !== 1 ? 's' : ''} seleccionado${selectedClienteIds.size !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmButtonClassName="bg-red-600 hover:bg-red-500"
        loading={deletingClientes}
        onConfirm={() => void executeDeleteClientes()}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}

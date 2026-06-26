'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowDown, ArrowUp, ArrowUpDown, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { ClienteCopyContactsButton } from '@/components/ClienteCopyContactsButton';
import { ClienteExcelImportButton } from '@/components/ClienteExcelImportButton';
import { InmuebleClienteManualAddButton } from '@/components/InmuebleClienteManualAddButton';
import { ClienteWhatsAppButton } from '@/components/ClienteWhatsAppButton';
import { ClienteFechaUltimaGestionCell } from '@/components/ClienteFechaUltimaGestionCell';
import { ClienteFechaUltimaGestionFilterHead } from '@/components/ClienteFechaUltimaGestionFilterHead';
import { ClienteGestionEstadoSelect } from '@/components/ClienteGestionEstadoSelect';
import { ClienteTrabajadorCell } from '@/components/ClienteTrabajadorCell';
import { ClienteNotasCell } from '@/components/ClienteNotasCell';
import { ClienteNombreCell } from '@/components/ClienteNombreCell';
import { InmuebleClienteFiltersBar } from '@/components/InmuebleClienteFiltersBar';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';
import { TableFilterEmptyState } from '@/components/TableFilterEmptyState';
import {
  useInmuebleQuery,
  useInvalidateDashboardQueries,
  useWorkersQuery,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import {
  ClienteGestionEstado,
  getClienteGestionEstadoOption,
  getClienteGestionEstadoOptions,
  getGestionOptionStyle,
} from '@/lib/cliente-gestion-estado';
import { bulkAssignWorker, bulkUnassignWorker } from '@/lib/clientes-api';
import { updateClienteGestionEstado } from '@/lib/inmuebles-api';
import {
  applyInmuebleClienteListFilters,
  EMPTY_INMUEBLE_CLIENTE_FILTERS,
  hasActiveInmuebleClienteFilters,
  INMUEBLE_CLIENTE_UNASSIGNED_WORKER,
  InmuebleClienteFechaSort,
  InmuebleClienteFilters,
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
  const bulkBusy = assigning || updatingEstado;
  const [clienteListState, setClienteListState] = usePersistedState(
    `${buildTableStateKey(pathname)}:clientes`,
    {
      clienteFilters: EMPTY_INMUEBLE_CLIENTE_FILTERS,
      fechaContactoSort: null as InmuebleClienteFechaSort,
    },
  );
  const { clienteFilters, fechaContactoSort } = clienteListState;
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
      ),
    [clientes, clienteFilters, expectedTipo, fechaContactoSort],
  );

  const clienteFiltersActive = hasActiveInmuebleClienteFilters(
    clienteFilters,
    fechaContactoSort,
  );

  function toggleFechaContactoSort() {
    setFechaContactoSort((prev) => {
      if (prev === null || prev === 'desc') return 'asc';
      return 'desc';
    });
  }

  function clearAllFilters() {
    setClienteFilters(EMPTY_INMUEBLE_CLIENTE_FILTERS);
    setFechaContactoSort(null);
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

    const clienteIds = [...selectedClienteIds];
    setUpdatingEstado(true);

    try {
      const results = await Promise.all(
        clienteIds.map((clienteId) =>
          updateClienteGestionEstado(
            inmueble.id,
            clienteId,
            gestionEstado as ClienteGestionEstado,
          ),
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 px-2 py-1.5 sm:px-3">
          <h2 className="shrink-0 text-xs font-semibold whitespace-nowrap text-slate-900">
            Clientes ({clientes.length})
          </h2>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <InmuebleClienteManualAddButton
              inmuebleId={inmueble.id}
              inmuebleRef={inmueble.ref}
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
            </div>
          </div>
        )}

        {clientes.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay clientes vinculados a este inmueble. Usa Añadir o Importar
            para añadirlos.
          </p>
        ) : filteredClientes.length === 0 ? (
          <TableFilterEmptyState onClear={clearAllFilters} />
        ) : (
          <>
          <div className="w-full">
            <table className="table-fixed min-w-[56rem] w-full border-collapse border border-black text-left text-sm">
              <thead className="border-b border-black">
                <tr>
                  <th
                    className={`sticky top-14 z-30 w-10 border border-black px-3 py-4 sm:top-16 ${
                      expectedTipo === 'alquiler' ? 'bg-emerald-800' : 'bg-slate-900'
                    }`}
                  >
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
                        className={`sticky top-14 z-30 w-[5.5rem] min-w-[5.5rem] border border-black px-2 py-4 text-center text-xs font-semibold uppercase tracking-wide text-yellow-300 sm:top-16 ${
                          expectedTipo === 'alquiler' ? 'bg-emerald-800' : 'bg-slate-900'
                        }`}
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
                                : 'Clic para ordenar por fecha de entrada'
                          }
                        >
                          <span className="whitespace-pre-line leading-tight">
                            {formatTableHeaderLabel(
                              col.shortLabel ?? col.label,
                            )}
                          </span>
                          {fechaContactoSort === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          ) : fechaContactoSort === 'desc' ? (
                            <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
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
                        className={`sticky top-14 z-30 w-[5.5rem] min-w-[5.5rem] border border-black px-1 py-3 text-center text-xs font-semibold uppercase tracking-wide text-yellow-300 sm:top-16 ${
                          expectedTipo === 'alquiler' ? 'bg-emerald-800' : 'bg-slate-900'
                        }`}
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
                        />
                      </th>
                    ) : col.key === 'nombre' ? (
                      <th
                        key={col.key}
                        className={`sticky top-14 z-30 w-[11rem] max-w-[11rem] border border-black px-4 py-4 text-xs font-semibold uppercase tracking-wide text-yellow-300 sm:top-16 ${
                          expectedTipo === 'alquiler' ? 'bg-emerald-800' : 'bg-slate-900'
                        }`}
                      >
                        {formatTableHeaderLabel(col.label)}
                      </th>
                    ) : col.key === 'ref_cliente' ? (
                      <th
                        key={col.key}
                        className={`sticky top-14 z-30 w-[11rem] max-w-[11rem] border border-black px-4 py-4 text-xs font-semibold uppercase tracking-wide text-yellow-300 sm:top-16 ${
                          expectedTipo === 'alquiler' ? 'bg-emerald-800' : 'bg-slate-900'
                        }`}
                      >
                        {formatTableHeaderLabel(col.label)}
                      </th>
                    ) : col.key === 'gestion_estado' ? (
                      <th
                        key={col.key}
                        className={`sticky top-14 z-30 w-[14rem] max-w-[14rem] border border-black px-3 py-4 text-xs font-semibold uppercase tracking-wide text-yellow-300 sm:top-16 ${
                          expectedTipo === 'alquiler' ? 'bg-emerald-800' : 'bg-slate-900'
                        }`}
                      >
                        {formatTableHeaderLabel(col.label)}
                      </th>
                    ) : (
                      <th
                        key={col.key}
                        className={`sticky top-14 z-30 border border-black px-4 py-4 text-xs font-semibold uppercase tracking-wide text-yellow-300 sm:top-16 ${
                          expectedTipo === 'alquiler' ? 'bg-emerald-800' : 'bg-slate-900'
                        }`}
                      >
                        {formatTableHeaderLabel(col.label)}
                      </th>
                    ),
                  )}
                  <th
                    className={`sticky top-14 z-30 w-11 max-w-[2.75rem] border border-black px-1 py-3 text-center text-xs font-semibold uppercase tracking-wide text-yellow-300 sm:top-16 ${
                      expectedTipo === 'alquiler' ? 'bg-emerald-800' : 'bg-slate-900'
                    }`}
                  >
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cliente) => {
                  const isSelected = selectedClienteIds.has(cliente.id);

                  return (
                  <tr
                    key={cliente.id}
                    className={`${isSelected ? selectedRowClass : ''} hover:bg-slate-50`}
                  >
                    <td className="w-10 border border-black px-3 py-3">
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
                            className="w-[5.5rem] min-w-[5.5rem] whitespace-nowrap border border-black px-2 py-3 text-center text-slate-700"
                          >
                            {formatClienteEntradaDate(cliente.fecha_contacto)}
                          </td>
                        );
                      }

                      if (col.key === 'gestion_estado') {
                        return (
                          <td
                            key={col.key}
                            className="w-[14rem] max-w-[14rem] align-top border border-black px-2 py-3"
                          >
                            <ClienteGestionEstadoSelect
                              inmuebleId={inmueble.id}
                              clienteId={cliente.id}
                              tipoOperacion={expectedTipo}
                              value={cliente.gestion_estado}
                              disabled={bulkBusy}
                              tableLayout
                              onUpdated={(result) =>
                                handleClientePatch(cliente.id, {
                                  gestion_estado: result.gestion_estado,
                                  fecha_ultima_gestion: result.fecha_ultima_gestion,
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
                            className="w-[5.5rem] min-w-[5.5rem] align-top border border-black px-1 py-3"
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

                      if (col.key === 'nombre') {
                        return (
                          <td
                            key={col.key}
                            className="w-[11rem] max-w-[11rem] align-top border border-black px-4 py-3"
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
                          <td key={col.key} className="border border-black px-4 py-3">
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
                            className="w-[11rem] max-w-[11rem] align-top border border-black px-4 py-3 text-slate-700"
                            title={refText !== '—' ? refText : undefined}
                          >
                            <span className="block line-clamp-3 break-words whitespace-normal leading-snug">
                              {refText}
                            </span>
                          </td>
                        );
                      }

                      if (col.key === 'trabajador') {
                        return (
                          <td key={col.key} className="border border-black px-4 py-3">
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
                          className="max-w-[200px] truncate border border-black px-4 py-3 text-slate-700"
                          title={display}
                        >
                          {display}
                        </td>
                      );
                    })}
                    <td className="w-11 max-w-[2.75rem] border border-black px-1 py-3 text-center align-middle">
                      <Link
                        href={`/dashboard/clientes/${cliente.id}`}
                        className={`inline-flex items-center justify-center rounded p-1.5 transition hover:bg-slate-100 ${accentLink}`}
                        title="Ver cliente"
                        aria-label="Ver cliente"
                      >
                        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}

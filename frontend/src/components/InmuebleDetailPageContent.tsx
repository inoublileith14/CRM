'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowDown, ArrowUp, ArrowUpDown, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { ClienteCopyContactsButton } from '@/components/ClienteCopyContactsButton';
import { ClienteExcelImportButton } from '@/components/ClienteExcelImportButton';
import { ClienteWhatsAppButton } from '@/components/ClienteWhatsAppButton';
import { ClienteFechaUltimaGestionCell } from '@/components/ClienteFechaUltimaGestionCell';
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
import { bulkAssignWorker } from '@/lib/clientes-api';
import {
  applyInmuebleClienteListFilters,
  EMPTY_INMUEBLE_CLIENTE_FILTERS,
  hasActiveInmuebleClienteFilters,
  InmuebleClienteFechaSort,
  InmuebleClienteFilters,
} from '@/lib/inmueble-cliente-filters';
import { buildInmuebleClienteTableColumns } from '@/lib/table-columns';
import { formatClienteEntradaDate } from '@/lib/cliente-date-utils';
import { InmuebleInfoCard } from '@/components/InmuebleInfoCard';
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
  const router = useRouter();
  const id = params.id as string;

  const queryClient = useQueryClient();
  const { invalidateInmueble, invalidateClientesByTipo } =
    useInvalidateDashboardQueries();
  const inmuebleQuery = useInmuebleQuery(id);
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
  const [assignWorkerId, setAssignWorkerId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [clienteFilters, setClienteFilters] = useState<InmuebleClienteFilters>(
    EMPTY_INMUEBLE_CLIENTE_FILTERS,
  );
  const [fechaContactoSort, setFechaContactoSort] =
    useState<InmuebleClienteFechaSort>(null);

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

  async function handleAssignWorker(inmuebleId: string) {
    if (selectedClienteIds.size === 0) {
      toast.error('Selecciona al menos un cliente');
      return;
    }
    if (!assignWorkerId) {
      toast.error('Selecciona el trabajador al que asignar');
      return;
    }

    const worker = workers.find((w) => w.id === assignWorkerId);
    const count = selectedClienteIds.size;

    if (
      !confirm(
        `¿Asignar ${count} cliente${count !== 1 ? 's' : ''} a ${worker?.nombre ?? 'el trabajador seleccionado'}?`,
      )
    ) {
      return;
    }

    setAssigning(true);

    try {
      const result = await bulkAssignWorker({
        worker_id: assignWorkerId,
        assignments: [...selectedClienteIds].map((clienteId) => ({
          cliente_id: clienteId,
          inmueble_id: inmuebleId,
        })),
      });

      toast.success(
        `${result.assigned} cliente${result.assigned !== 1 ? 's' : ''} asignado${result.assigned !== 1 ? 's' : ''}`,
      );
      clearSelection();
      await refreshInmueble();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron asignar los clientes';
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  }

  const selectClass = `h-7 shrink-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 outline-none transition ${
    expectedTipo === 'alquiler'
      ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
      : 'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
  } disabled:opacity-60`;
  const assignButtonClass =
    expectedTipo === 'alquiler'
      ? 'bg-emerald-600 hover:bg-emerald-500'
      : 'bg-blue-700 hover:bg-blue-600';

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
        listPath={listPath}
        listLabel={listLabel}
        editHref={`${listPath}/${inmueble.id}/edit`}
        isRefreshing={isRefreshing}
        tipoAccentClass={tipoAccentClass}
      />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 px-2 py-1.5 sm:px-3">
          <h2 className="shrink-0 text-xs font-semibold whitespace-nowrap text-slate-900">
            Clientes ({clientes.length})
          </h2>
          <div className="ml-auto">
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
              disabled={assigning}
              compact
            />
            <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
              <ClienteWhatsAppButton
                inmuebleId={inmueble.id}
                clienteIds={[...selectedClienteIds]}
                disabled={assigning}
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
                disabled={assigning}
                compact
              />
              <select
                value={assignWorkerId}
                onChange={(e) => setAssignWorkerId(e.target.value)}
                disabled={assigning}
                className={`w-full sm:w-auto ${selectClass}`}
                aria-label="Trabajador para asignar"
              >
                <option value="">Asignar a trabajador…</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.nombre} ({getWorkerRolLabel(worker.rol)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleAssignWorker(inmueble.id)}
                disabled={
                  assigning ||
                  selectedClienteIds.size === 0 ||
                  !assignWorkerId
                }
                className={`inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-md px-2.5 text-xs font-semibold text-white transition disabled:opacity-60 ${assignButtonClass}`}
              >
                {assigning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                Asignar
              </button>
            </div>
          </div>
        )}

        {clientes.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay clientes vinculados a este inmueble. Usa Importar Excel para
            añadirlos.
          </p>
        ) : filteredClientes.length === 0 ? (
          <TableFilterEmptyState onClear={clearAllFilters} />
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="min-w-[56rem] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="w-10 px-3 py-3">
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
                      disabled={assigning}
                      className={`h-4 w-4 rounded border-slate-300 ${accentCheckbox}`}
                      aria-label="Seleccionar todos los clientes"
                    />
                  </th>
                  {clienteTableColumns.map((col) =>
                    col.key === 'fecha_contacto' ? (
                      <th
                        key={col.key}
                        className="whitespace-nowrap px-4 py-3 text-xs font-semibold normal-case text-slate-600"
                      >
                        <button
                          type="button"
                          onClick={toggleFechaContactoSort}
                          className="inline-flex items-center gap-1 transition hover:text-slate-900"
                          title={
                            fechaContactoSort === 'asc'
                              ? 'Más antigua primero — clic para más reciente'
                              : fechaContactoSort === 'desc'
                                ? 'Más reciente primero — clic para más antigua'
                                : 'Clic para ordenar por fecha de entrada'
                          }
                        >
                          {col.label}
                          {fechaContactoSort === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                          ) : fechaContactoSort === 'desc' ? (
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <ArrowUpDown
                              className="h-3.5 w-3.5 opacity-60"
                              aria-hidden
                            />
                          )}
                        </button>
                      </th>
                    ) : col.key === 'fecha_ultima_gestion' ? (
                      <th
                        key={col.key}
                        className="min-w-[7.5rem] whitespace-nowrap px-4 py-3 text-xs font-semibold normal-case text-slate-600"
                      >
                        {col.label}
                      </th>
                    ) : (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-xs font-semibold normal-case text-slate-600"
                      >
                        {col.label}
                      </th>
                    ),
                  )}
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.map((cliente) => {
                  const isSelected = selectedClienteIds.has(cliente.id);

                  return (
                  <tr
                    key={cliente.id}
                    className={`hover:bg-slate-50 ${isSelected ? selectedRowClass : ''}`}
                  >
                    <td className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleClienteSelection(cliente.id)}
                        disabled={assigning}
                        className={`h-4 w-4 rounded border-slate-300 ${accentCheckbox}`}
                        aria-label={`Seleccionar ${cliente.nombre}`}
                      />
                    </td>
                    {clienteTableColumns.map((col) => {
                      if (col.key === 'fecha_contacto') {
                        return (
                          <td
                            key={col.key}
                            className="whitespace-nowrap px-4 py-3 text-slate-600"
                          >
                            {formatClienteEntradaDate(cliente.fecha_contacto)}
                          </td>
                        );
                      }

                      if (col.key === 'gestion_estado') {
                        return (
                          <td key={col.key} className="px-4 py-3">
                            <ClienteGestionEstadoSelect
                              inmuebleId={inmueble.id}
                              clienteId={cliente.id}
                              tipoOperacion={expectedTipo}
                              value={cliente.gestion_estado}
                              disabled={assigning}
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
                        return (
                          <td
                            key={col.key}
                            className="min-w-[8.5rem] whitespace-nowrap px-4 py-3"
                          >
                            <ClienteFechaUltimaGestionCell
                              inmuebleId={inmueble.id}
                              clienteId={cliente.id}
                              value={cliente.fecha_ultima_gestion}
                              disabled={assigning}
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
                          <td key={col.key} className="px-4 py-3">
                            <ClienteNombreCell
                              clienteId={cliente.id}
                              value={cliente.nombre}
                              disabled={assigning}
                              onUpdated={(nombre) =>
                                handleClientePatch(cliente.id, { nombre })
                              }
                            />
                          </td>
                        );
                      }

                      if (col.key === 'notas') {
                        return (
                          <td key={col.key} className="px-4 py-3">
                            <ClienteNotasCell
                              clienteId={cliente.id}
                              value={cliente.notas}
                              disabled={assigning}
                              onUpdated={(notas) =>
                                handleClientePatch(cliente.id, { notas })
                              }
                            />
                          </td>
                        );
                      }

                      if (col.key === 'ref_cliente') {
                        return (
                          <td
                            key={col.key}
                            className="max-w-[14rem] px-4 py-3 text-slate-600"
                          >
                            <span className="block break-words whitespace-normal leading-snug">
                              {cliente.ref_cliente?.trim() || '—'}
                            </span>
                          </td>
                        );
                      }

                      if (col.key === 'trabajador') {
                        return (
                          <td key={col.key} className="px-4 py-3">
                            <ClienteTrabajadorCell
                              inmuebleId={inmueble.id}
                              clienteId={cliente.id}
                              workers={workers}
                              assignedWorkers={cliente.workers}
                              tipoOperacion={expectedTipo}
                              disabled={assigning}
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
                          className="max-w-[200px] truncate px-4 py-3 text-slate-700"
                          title={display}
                        >
                          {display}
                        </td>
                      );
                    })}
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/dashboard/clientes/${cliente.id}`}
                        className={`text-sm font-medium ${accentLink}`}
                      >
                        Ver cliente
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

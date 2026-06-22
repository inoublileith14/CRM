'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Loader2,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { ClienteCopyContactsButton } from '@/components/ClienteCopyContactsButton';
import { ClienteExcelImportButton } from '@/components/ClienteExcelImportButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { InmuebleAssignSearchSelect } from '@/components/InmuebleAssignSearchSelect';
import { ClienteVentaRangeFiltersBar } from '@/components/ClienteVentaRangeFiltersBar';
import { ClienteVentaTableFieldCell } from '@/components/ClienteVentaTableFieldCell';
import { ClienteFechaContactoCell } from '@/components/ClienteFechaContactoCell';
import { ClienteFechaUltimaGestionCell } from '@/components/ClienteFechaUltimaGestionCell';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import { TableColumnFilterHead } from '@/components/TableColumnFilterHead';
import { TableFilterBar } from '@/components/TableFilterBar';
import { TableFilterEmptyState } from '@/components/TableFilterEmptyState';
import { TablePagination } from '@/components/TablePagination';
import {
  useClientesByTipoQuery,
  useInvalidateDashboardQueries,
  useInmueblesQuery,
  useWorkersQuery,
} from '@/hooks/use-dashboard-queries';
import { usePagination } from '@/hooks/usePagination';
import {
  STABLE_EMPTY_COLUMN_FILTERS,
  useResetPageOnFilterChange,
  useTableColumnFilters,
} from '@/hooks/useTableColumnFilters';
import { applyTableColumnFilters } from '@/lib/table-column-filters';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { buildVentaGlobalClienteTableColumns } from '@/lib/table-columns';
import { EXCEL_CELL_ALIGN, EXCEL_CELL_BORDER, EXCEL_TABLE_CLASS } from '@/lib/excel-table-styles';
import { parseRefCliente } from '@/lib/parse-ref-cliente';
import {
  EMPTY_VENTA_RANGE_FILTERS,
  filterRowsByVentaRange,
  hasActiveVentaRangeFilters,
} from '@/lib/cliente-venta-range-filters';
import { bulkAssignInmueble, bulkAssignWorker, bulkDeleteClientes } from '@/lib/clientes-api';
import { getAssignableInmuebles, getInmuebleAssignLabel } from '@/lib/inmueble-assign-utils';
import { queryKeys } from '@/lib/query-keys';
import {
  Cliente,
} from '@/types/cliente';
import { InmuebleClienteLinkRow } from '@/types/inmueble-cliente-link';
import { TIPO_OPERACION_LABELS, TipoOperacion } from '@/types/inmueble';
import { ClienteRefValue, clienteDenseTextClass } from '@/components/ClienteRefValue';
import { getWorkerRolLabel } from '@/types/worker';

const PAGE_THEMES = {
  alquiler: {
    background: '#065f46',
    border: '#064e3b',
    text: '#ffffff',
    muted: '#a7f3d0',
    accentLink: 'text-emerald-600 hover:text-emerald-500',
    accentButton: 'bg-emerald-600 hover:bg-emerald-500',
    accentCheckbox: 'text-emerald-600 focus:ring-emerald-500',
    accentSelectFocus:
      'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
    selectedRow: 'bg-emerald-50/60',
    retryLink: 'text-emerald-600 hover:text-emerald-500',
  },
  venta: {
    background: '#1e3a8a',
    border: '#172554',
    text: '#ffffff',
    muted: '#bfdbfe',
    accentLink: 'text-blue-600 hover:text-blue-500',
    accentButton: 'bg-blue-700 hover:bg-blue-600',
    accentCheckbox: 'text-blue-700 focus:ring-blue-600',
    accentSelectFocus: 'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20',
    selectedRow: 'bg-blue-50/70',
    retryLink: 'text-blue-700 hover:text-blue-600',
  },
} as const;

interface InmuebleClientesGeneralPageContentProps {
  expectedTipo: TipoOperacion;
  inmuebleListPath: string;
}

export function InmuebleClientesGeneralPageContent({
  expectedTipo,
  inmuebleListPath,
}: InmuebleClientesGeneralPageContentProps) {
  const queryClient = useQueryClient();
  const { invalidateClientesByTipo, invalidateAllInmuebles } =
    useInvalidateDashboardQueries();
  const rowsQuery = useClientesByTipoQuery(expectedTipo);
  const workersQuery = useWorkersQuery(true);
  const inmueblesQuery = useInmueblesQuery({ tipo_operacion: expectedTipo });
  const {
    data: rows = [],
    showInitialLoading,
    isRefreshing,
    showError,
  } = useQueryUiState(rowsQuery);
  const workers = workersQuery.data ?? [];
  const inmuebles = inmueblesQuery.data ?? [];
  const assignableInmuebles = useMemo(
    () => getAssignableInmuebles(inmuebles),
    [inmuebles],
  );

  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set());
  const [assignWorkerId, setAssignWorkerId] = useState('');
  const [assignInmuebleId, setAssignInmuebleId] = useState('');
  const [assigningWorker, setAssigningWorker] = useState(false);
  const [assigningInmueble, setAssigningInmueble] = useState(false);
  const [deletingClientes, setDeletingClientes] = useState(false);
  const [assignConfirm, setAssignConfirm] = useState<
    'worker' | 'inmueble' | 'delete' | null
  >(null);
  const assigningBusy = assigningWorker || assigningInmueble || deletingClientes;
  const [ventaRangeFilters, setVentaRangeFilters] = useState(
    EMPTY_VENTA_RANGE_FILTERS,
  );

  const rowsAfterRangeFilters = useMemo(() => {
    return filterRowsByVentaRange(rows, ventaRangeFilters);
  }, [rows, ventaRangeFilters]);

  const ventaRangeFiltersActive = hasActiveVentaRangeFilters(ventaRangeFilters);

  const selectedClientes = useMemo(() => {
    const seen = new Set<string>();
    const clientes: Cliente[] = [];
    for (const row of rows) {
      if (!selectedRowKeys.has(row.row_key)) continue;
      if (seen.has(row.cliente.id)) continue;
      seen.add(row.cliente.id);
      clientes.push(row.cliente);
    }
    return clientes;
  }, [rows, selectedRowKeys]);

  const tableColumns = useMemo(
    () => buildVentaGlobalClienteTableColumns(),
    [],
  );

  const isDenseClienteTable = true;

  const denseCellClassByKey = useMemo(() => {
    return new Map(
      tableColumns.map((col) => [col.key, col.cellClassName ?? '']),
    );
  }, [tableColumns]);

  function denseCellClass(key: string, extra = '') {
    const base = denseCellClassByKey.get(key) ?? '';
    return ['px-3 py-2.5', EXCEL_CELL_BORDER, EXCEL_CELL_ALIGN, base, extra].filter(Boolean).join(' ');
  }

  function updateClienteById(clienteId: string, patch: Partial<Cliente>) {
    queryClient.setQueryData<InmuebleClienteLinkRow[]>(
      queryKeys.clientes.byTipo(expectedTipo),
      (prev) =>
        prev?.map((row) =>
          row.cliente.id === clienteId
            ? { ...row, cliente: { ...row.cliente, ...patch } }
            : row,
        ) ?? [],
    );
  }

  const enableExcelColumnFilters = false;

  const {
    columnFilters,
    tableSort,
    openFilterColumn,
    setOpenFilterColumn,
    columnUniqueValues,
    filteredRows,
    filtersActive,
    clearFilters,
    setColumnFilter,
    clearSort,
    setSort,
    isFilterActiveForColumn,
  } = useTableColumnFilters(rowsAfterRangeFilters, tableColumns);

  function toggleEntradaSort() {
    if (
      tableSort?.column !== 'fecha_entrada_peticion' ||
      tableSort.direction === 'desc'
    ) {
      setSort('fecha_entrada_peticion', 'asc');
    } else {
      setSort('fecha_entrada_peticion', 'desc');
    }
  }

  const effectiveFilteredRows = useMemo(() => {
    if (enableExcelColumnFilters) return filteredRows;
    if (tableSort?.column === 'fecha_entrada_peticion') {
      return applyTableColumnFilters(
        rowsAfterRangeFilters,
        tableColumns,
        {},
        tableSort,
      );
    }
    return rowsAfterRangeFilters;
  }, [
    enableExcelColumnFilters,
    filteredRows,
    rowsAfterRangeFilters,
    tableColumns,
    tableSort,
  ]);
  const effectiveFiltersActive = enableExcelColumnFilters ? filtersActive : false;

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedRows,
  } = usePagination(effectiveFilteredRows, 50);

  useResetPageOnFilterChange(
    [
      enableExcelColumnFilters ? columnFilters : STABLE_EMPTY_COLUMN_FILTERS,
      tableSort,
      ventaRangeFilters,
    ],
    setPage,
  );

  function clearAllFilters() {
    if (enableExcelColumnFilters) clearFilters();
    else clearSort();
    setVentaRangeFilters(EMPTY_VENTA_RANGE_FILTERS);
  }

  function toggleRowSelection(rowKey: string) {
    setSelectedRowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  }

  function toggleSelectAllFiltered(filteredRows: InmuebleClienteLinkRow[]) {
    setSelectedRowKeys((prev) => {
      const allSelected =
        filteredRows.length > 0 &&
        filteredRows.every((row) => prev.has(row.row_key));
      const next = new Set(prev);
      if (allSelected) {
        for (const row of filteredRows) next.delete(row.row_key);
      } else {
        for (const row of filteredRows) next.add(row.row_key);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedRowKeys(new Set());
  }

  function openAssignWorkerConfirm() {
    if (selectedRowKeys.size === 0) {
      toast.error('Selecciona al menos un cliente');
      return;
    }
    if (!assignWorkerId) {
      toast.error('Selecciona el trabajador al que asignar');
      return;
    }

    const selectedRows = rows.filter((row) => selectedRowKeys.has(row.row_key));
    const assignableRows = selectedRows.filter((row) => Boolean(row.inmueble_id));

    if (assignableRows.length === 0) {
      toast.error('Los clientes sin inmueble no se pueden asignar desde aquí');
      return;
    }

    setAssignConfirm('worker');
  }

  async function executeAssignWorker() {
    const selectedRows = rows.filter((row) => selectedRowKeys.has(row.row_key));
    const assignableRows = selectedRows.filter((row) => Boolean(row.inmueble_id));
    const skippedUnlinked = selectedRows.length - assignableRows.length;

    setAssigningWorker(true);

    try {
      const result = await bulkAssignWorker({
        worker_id: assignWorkerId,
        assignments: assignableRows.map((row) => ({
          cliente_id: row.cliente.id,
          inmueble_id: row.inmueble_id as string,
        })),
      });

      toast.success(
        `${result.assigned} fila${result.assigned !== 1 ? 's' : ''} asignada${result.assigned !== 1 ? 's' : ''}`,
      );
      if (skippedUnlinked > 0) {
        toast.message(
          `${skippedUnlinked} cliente${skippedUnlinked !== 1 ? 's' : ''} sin inmueble se omitió${skippedUnlinked !== 1 ? 'n' : ''}`,
        );
      }
      setAssignConfirm(null);
      clearSelection();
      await invalidateClientesByTipo(expectedTipo);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron asignar los clientes';
      toast.error(message);
    } finally {
      setAssigningWorker(false);
    }
  }

  function openAssignInmuebleConfirm() {
    if (selectedRowKeys.size === 0) {
      toast.error('Selecciona al menos un cliente');
      return;
    }
    if (!assignInmuebleId) {
      toast.error('Selecciona el piso al que asignar');
      return;
    }

    setAssignConfirm('inmueble');
  }

  function openDeleteConfirm() {
    if (selectedRowKeys.size === 0) {
      toast.error('Selecciona al menos un cliente');
      return;
    }

    setAssignConfirm('delete');
  }

  async function executeDeleteClientes() {
    const selectedRows = rows.filter((row) => selectedRowKeys.has(row.row_key));
    const clienteIds = [...new Set(selectedRows.map((row) => row.cliente.id))];

    setDeletingClientes(true);

    try {
      const result = await bulkDeleteClientes({ cliente_ids: clienteIds });
      toast.success(
        `${result.deleted} cliente${result.deleted !== 1 ? 's' : ''} eliminado${result.deleted !== 1 ? 's' : ''}`,
      );
      setAssignConfirm(null);
      clearSelection();
      await invalidateClientesByTipo(expectedTipo);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron eliminar los clientes';
      toast.error(message);
    } finally {
      setDeletingClientes(false);
    }
  }

  async function executeAssignInmueble() {
    const selectedRows = rows.filter((row) => selectedRowKeys.has(row.row_key));
    const clienteIds = [...new Set(selectedRows.map((row) => row.cliente.id))];
    const count = clienteIds.length;

    setAssigningInmueble(true);

    try {
      const result = await bulkAssignInmueble({
        inmueble_id: assignInmuebleId,
        cliente_ids: clienteIds,
      });

      if (result.assigned === 0) {
        toast.success(
          `Referencia actualizada para ${count} cliente${count !== 1 ? 's' : ''} (ya estaban vinculados al piso)`,
        );
      } else {
        toast.success(
          `${result.assigned} cliente${result.assigned !== 1 ? 's' : ''} asignado${result.assigned !== 1 ? 's' : ''} al piso`,
        );
      }

      if (result.skipped > 0 && result.assigned > 0) {
        toast.message(
          `${result.skipped} ya estaban vinculados; referencia actualizada igualmente`,
        );
      }

      setAssignConfirm(null);
      clearSelection();
      setAssignInmuebleId('');
      await Promise.all([
        invalidateClientesByTipo(expectedTipo),
        invalidateAllInmuebles(),
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron asignar los clientes al piso';
      toast.error(message);
    } finally {
      setAssigningInmueble(false);
    }
  }

  const pageTheme = PAGE_THEMES[expectedTipo];

  const workerAssignConfirmCopy = useMemo(() => {
    const selectedRows = rows.filter((row) => selectedRowKeys.has(row.row_key));
    const assignableRows = selectedRows.filter((row) => Boolean(row.inmueble_id));
    const worker = workers.find((w) => w.id === assignWorkerId);
    const count = assignableRows.length;

    return {
      title: 'Asignar a trabajador',
      description: `¿Asignar ${count} fila${count !== 1 ? 's' : ''} a ${worker?.nombre ?? 'el trabajador seleccionado'}?`,
    };
  }, [rows, selectedRowKeys, assignWorkerId, workers]);

  const inmuebleAssignConfirmCopy = useMemo(() => {
    const selectedRows = rows.filter((row) => selectedRowKeys.has(row.row_key));
    const clienteIds = [...new Set(selectedRows.map((row) => row.cliente.id))];
    const inmueble = assignableInmuebles.find((item) => item.id === assignInmuebleId);
    const label = inmueble ? getInmuebleAssignLabel(inmueble) : 'el piso seleccionado';

    return {
      title: 'Asignar a piso',
      description: `¿Asignar ${clienteIds.length} cliente${clienteIds.length !== 1 ? 's' : ''} al piso ${label}? La referencia del cliente se actualizará.`,
    };
  }, [rows, selectedRowKeys, assignInmuebleId, assignableInmuebles]);

  const deleteConfirmCopy = useMemo(() => {
    const selectedRows = rows.filter((row) => selectedRowKeys.has(row.row_key));
    const clienteIds = [...new Set(selectedRows.map((row) => row.cliente.id))];
    const count = clienteIds.length;

    return {
      title: 'Eliminar clientes',
      description: `¿Eliminar ${count} cliente${count !== 1 ? 's' : ''} seleccionado${count !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`,
    };
  }, [rows, selectedRowKeys]);

  const selectClass = `rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition ${pageTheme.accentSelectFocus} disabled:opacity-60`;

  if (showInitialLoading) {
    return (
      <div
        className="-mx-4 -mt-5 rounded-b-xl p-12 text-center sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8"
        style={{
          backgroundColor: pageTheme.background,
          borderColor: pageTheme.border,
          color: pageTheme.muted,
        }}
      >
        Cargando clientes…
      </div>
    );
  }

  if (showError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center sm:p-8">
        <p className="font-medium text-red-800">
          {rowsQuery.error instanceof Error
            ? rowsQuery.error.message
            : 'Error al cargar clientes'}
        </p>
        <button
          type="button"
          onClick={() => rowsQuery.refetch()}
          className={`mt-4 text-sm font-medium ${pageTheme.retryLink}`}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const allRowsSelected =
    effectiveFilteredRows.length > 0 &&
    effectiveFilteredRows.every((row) => selectedRowKeys.has(row.row_key));
  const someRowsSelected =
    effectiveFilteredRows.some((row) => selectedRowKeys.has(row.row_key)) &&
    !allRowsSelected;

  const title =
    expectedTipo === 'alquiler'
      ? 'CLIENTES GENERAL ALQUILER'
      : 'CLIENTES GENERAL VENTA';

  return (
    <div
      className="-mx-4 -mt-5 rounded-b-xl px-4 pb-5 pt-5 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pb-6 sm:pt-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pb-8 lg:pt-8"
      style={{
        backgroundColor: pageTheme.background,
        borderColor: pageTheme.border,
      }}
    >
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: pageTheme.text }}
          >
            {TIPO_OPERACION_LABELS[expectedTipo]}
          </p>
          {isRefreshing ? <QueryRefreshingBadge /> : null}
        </div>
        <h1
          className="mt-1 text-xl font-bold sm:text-2xl"
          style={{ color: pageTheme.text }}
        >
          {title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: pageTheme.muted }}>
          Todos los clientes vinculados a inmuebles de{' '}
          {expectedTipo === 'alquiler' ? 'alquiler' : 'venta'}. Importa Excel,
          selecciona filas y asígnalas a cada trabajador.
        </p>
        <div className="mt-4 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <ClienteExcelImportButton
            tipoOperacion={expectedTipo}
            onComplete={() => invalidateClientesByTipo(expectedTipo)}
            disabled={showInitialLoading}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">
              Clientes ({rows.length})
            </h2>
          </div>
        </div>

        {rows.length > 0 && (
          <ClienteVentaRangeFiltersBar
            filters={ventaRangeFilters}
            onChange={setVentaRangeFilters}
            onClear={() => setVentaRangeFilters(EMPTY_VENTA_RANGE_FILTERS)}
            disabled={assigningBusy}
            hasActiveFilters={ventaRangeFiltersActive}
            accent={expectedTipo === 'alquiler' ? 'emerald' : 'blue'}
          />
        )}

        {rows.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:px-6">
            <span className="text-sm text-slate-600">
              {selectedRowKeys.size > 0
                ? `${selectedRowKeys.size} seleccionado${selectedRowKeys.size !== 1 ? 's' : ''}`
                : 'Ninguno seleccionado'}
            </span>
            <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <ClienteCopyContactsButton
                clientes={selectedClientes}
                disabled={assigningBusy}
              />
              <select
                value={assignWorkerId}
                onChange={(e) => setAssignWorkerId(e.target.value)}
                disabled={assigningBusy}
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
                onClick={openAssignWorkerConfirm}
                disabled={
                  assigningBusy ||
                  selectedRowKeys.size === 0 ||
                  !assignWorkerId
                }
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 sm:w-auto ${pageTheme.accentButton}`}
              >
                {assigningWorker ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Asignar seleccionados
              </button>
              <InmuebleAssignSearchSelect
                inmuebles={assignableInmuebles}
                value={assignInmuebleId}
                onChange={setAssignInmuebleId}
                disabled={assigningBusy || inmueblesQuery.isLoading}
              />
              <button
                type="button"
                onClick={openAssignInmuebleConfirm}
                disabled={
                  assigningBusy ||
                  selectedRowKeys.size === 0 ||
                  !assignInmuebleId
                }
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto`}
              >
                {assigningInmueble ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                Asignar a piso
              </button>
              <button
                type="button"
                onClick={openDeleteConfirm}
                disabled={assigningBusy || selectedRowKeys.size === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 sm:w-auto"
              >
                {deletingClientes ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Eliminar seleccionados
              </button>
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay clientes vinculados a inmuebles de{' '}
            {expectedTipo === 'alquiler' ? 'alquiler' : 'venta'}.
          </p>
        ) : filteredRows.length === 0 ? (
          <TableFilterEmptyState
            onClear={ventaRangeFiltersActive ? clearAllFilters : clearFilters}
          />
        ) : (
          <>
            {(effectiveFiltersActive || ventaRangeFiltersActive) && (
              <TableFilterBar
                filteredCount={effectiveFilteredRows.length}
                totalCount={rowsAfterRangeFilters.length}
                entityLabel="clientes"
                hasSort={enableExcelColumnFilters ? !!tableSort : false}
                onClear={clearAllFilters}
              />
            )}
            <div
              className={
                isDenseClienteTable
                  ? 'overflow-x-auto xl:overflow-x-visible'
                  : 'overflow-x-auto'
              }
            >
              <table
                className={
                  isDenseClienteTable ? EXCEL_TABLE_CLASS : 'min-w-[56rem] w-full text-left text-sm'
                }
              >
                {isDenseClienteTable ? (
                  <colgroup>
                    <col className="w-8" />
                    {tableColumns.map((col) => (
                      <col key={col.key} className={col.headClassName} />
                    ))}
                    <col className="w-[3.75rem]" />
                  </colgroup>
                ) : null}
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th
                      className={
                        isDenseClienteTable
                          ? `w-8 px-3 py-2.5 text-center ${EXCEL_CELL_BORDER}`
                          : 'w-10 px-3 py-3'
                      }
                    >
                      <input
                        type="checkbox"
                        checked={allRowsSelected}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = someRowsSelected;
                          }
                        }}
                        onChange={() => toggleSelectAllFiltered(effectiveFilteredRows)}
                        disabled={assigningBusy}
                        className={`h-4 w-4 rounded border-slate-300 ${pageTheme.accentCheckbox}`}
                        aria-label="Seleccionar todos los clientes (todas las páginas)"
                      />
                    </th>
                    {tableColumns.map((col) =>
                      enableExcelColumnFilters ? (
                        <TableColumnFilterHead
                          key={col.key}
                          label={col.label}
                          shortLabel={col.shortLabel}
                          fieldType={col.fieldType ?? 'text'}
                          uniqueValues={columnUniqueValues.get(col.key) ?? []}
                          filter={columnFilters[col.key]}
                          sortDirection={
                            tableSort?.column === col.key
                              ? tableSort.direction
                              : null
                          }
                          isSortColumn={tableSort?.column === col.key}
                          isOpen={openFilterColumn === col.key}
                          isFilterActive={isFilterActiveForColumn(col.key)}
                          onOpenChange={(open) =>
                            setOpenFilterColumn(open ? col.key : null)
                          }
                          onApply={(next) => setColumnFilter(col.key, next)}
                          onSort={(direction) => setSort(col.key, direction)}
                          variant="slate"
                          className={
                            isDenseClienteTable
                              ? `px-3 py-2.5 normal-case text-center ${EXCEL_CELL_BORDER} ${col.headClassName ?? ''}`
                              : 'px-4 normal-case'
                          }
                        />
                      ) : col.key === 'fecha_entrada_peticion' ? (
                        <th
                          key={col.key}
                          className={`whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-600 ${
                            isDenseClienteTable
                              ? `px-3 py-2.5 normal-case text-center ${EXCEL_CELL_BORDER} ${col.headClassName ?? ''}`
                              : 'px-4 py-3'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={toggleEntradaSort}
                            className="inline-flex w-full items-center justify-center gap-0.5 leading-tight text-slate-600 transition hover:text-slate-900"
                            title={
                              tableSort?.column === 'fecha_entrada_peticion'
                                ? tableSort.direction === 'asc'
                                  ? 'Más antigua primero — clic para más reciente'
                                  : 'Más reciente primero — clic para más antigua'
                                : 'Clic para ordenar por fecha de entrada'
                            }
                          >
                            <span className="break-words whitespace-normal">
                              {isDenseClienteTable
                                ? col.shortLabel ?? col.label
                                : col.label}
                            </span>
                            {tableSort?.column === 'fecha_entrada_peticion' ? (
                              tableSort.direction === 'asc' ? (
                                <ArrowUp className="h-3 w-3 shrink-0" aria-hidden />
                              ) : (
                                <ArrowDown className="h-3 w-3 shrink-0" aria-hidden />
                              )
                            ) : (
                              <ArrowUpDown
                                className="h-3 w-3 shrink-0 opacity-70"
                                aria-hidden
                              />
                            )}
                          </button>
                        </th>
                      ) : (
                        <th
                          key={col.key}
                          className={`whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-600 ${
                            isDenseClienteTable
                              ? `px-3 py-2.5 normal-case text-center ${EXCEL_CELL_BORDER} ${col.headClassName ?? ''}`
                              : 'px-4 py-3'
                          }`}
                          title={col.label}
                        >
                          <span className="inline-flex max-w-[10rem] items-center">
                            <span className="break-words">
                              {isDenseClienteTable
                                ? col.shortLabel ?? col.label
                                : col.label}
                            </span>
                          </span>
                        </th>
                      ),
                    )}
                    <th
                      className={
                        isDenseClienteTable
                          ? `w-[3.75rem] px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-600 ${EXCEL_CELL_BORDER}`
                          : 'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600'
                      }
                    >
                      {isDenseClienteTable ? 'Ver' : 'Acciones'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => {
                    const { cliente } = row;
                    const isSelected = selectedRowKeys.has(row.row_key);
                    const parsedRef = parseRefCliente(cliente.ref_cliente);

                    return (
                      <tr
                        key={row.row_key}
                        className={`hover:bg-slate-50 ${isSelected ? pageTheme.selectedRow : ''}`}
                      >
                        <td className={isDenseClienteTable ? `w-8 px-3 py-2.5 text-center ${EXCEL_CELL_BORDER}` : 'w-10 px-3 py-3'}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelection(row.row_key)}
                            disabled={assigningBusy}
                            className={`h-4 w-4 rounded border-slate-300 ${pageTheme.accentCheckbox}`}
                            aria-label={`Seleccionar ${cliente.nombre}`}
                          />
                        </td>
                        <td className={denseCellClass('fecha_ultima_gestion')}>
                          <ClienteFechaUltimaGestionCell
                            clienteId={cliente.id}
                            value={cliente.fecha_ultima_gestion}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(fechaUltimaGestion) =>
                              updateClienteById(cliente.id, {
                                fecha_ultima_gestion: fechaUltimaGestion,
                              })
                            }
                          />
                        </td>
                        <td className={denseCellClass('fecha_entrada_peticion')}>
                          <ClienteFechaContactoCell
                            clienteId={cliente.id}
                            value={cliente.fecha_contacto}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(fechaContacto) =>
                              updateClienteById(cliente.id, {
                                fecha_contacto: fechaContacto,
                              })
                            }
                          />
                        </td>
                        <td className={denseCellClass('ref_cliente', 'text-slate-600')}>
                          <ClienteRefValue ref={cliente.ref_cliente} />
                        </td>
                        <td
                          className={denseCellClass(
                            'nombre',
                            'font-medium text-slate-900',
                          )}
                          title={cliente.nombre}
                        >
                          {cliente.nombre}
                        </td>
                        <td
                          className={denseCellClass('telefono', 'text-slate-600')}
                        >
                          {cliente.telefono || '—'}
                        </td>
                        <td
                          className={denseCellClass(
                            'presupuesto_maximo',
                            'text-slate-600',
                          )}
                        >
                          <ClienteVentaTableFieldCell
                            clienteId={cliente.id}
                            kind="presupuesto_maximo"
                            refCliente={cliente.ref_cliente}
                            presupuestoMaximo={cliente.presupuesto_maximo}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(patch) =>
                              updateClienteById(cliente.id, patch)
                            }
                          />
                        </td>
                        <td
                          className={denseCellClass(
                            'presupuesto_peticion',
                            'text-slate-600',
                          )}
                        >
                          <ClienteVentaTableFieldCell
                            clienteId={cliente.id}
                            kind="presupuesto_peticion"
                            refCliente={cliente.ref_cliente}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(patch) =>
                              updateClienteById(cliente.id, patch)
                            }
                          />
                        </td>
                        <td
                          className={denseCellClass(
                            'habitaciones',
                            'text-slate-600',
                          )}
                        >
                          <ClienteVentaTableFieldCell
                            clienteId={cliente.id}
                            kind="habitaciones"
                            refCliente={cliente.ref_cliente}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(patch) =>
                              updateClienteById(cliente.id, patch)
                            }
                          />
                        </td>
                        <td className={denseCellClass('banos', 'text-slate-600')}>
                          <ClienteVentaTableFieldCell
                            clienteId={cliente.id}
                            kind="banos"
                            refCliente={cliente.ref_cliente}
                            banos={cliente.banos}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(patch) =>
                              updateClienteById(cliente.id, patch)
                            }
                          />
                        </td>
                        <td className={denseCellClass('metros', 'text-slate-600')}>
                          <ClienteVentaTableFieldCell
                            clienteId={cliente.id}
                            kind="metros"
                            refCliente={cliente.ref_cliente}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(patch) =>
                              updateClienteById(cliente.id, patch)
                            }
                          />
                        </td>
                        <td
                          className={denseCellClass('zona', 'text-slate-600')}
                          title={parsedRef.zona ?? undefined}
                        >
                          <span className={clienteDenseTextClass}>
                            {parsedRef.zona || '—'}
                          </span>
                        </td>
                        <td className={`px-3 py-2.5 text-center ${EXCEL_CELL_BORDER}`}>
                          <Link
                            href={`/dashboard/clientes/${cliente.id}`}
                            className={`text-xs font-medium md:text-sm ${pageTheme.accentLink}`}
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </section>

      <ConfirmDialog
        open={assignConfirm === 'worker'}
        title={workerAssignConfirmCopy.title}
        description={workerAssignConfirmCopy.description}
        confirmLabel="Asignar"
        confirmButtonClassName={pageTheme.accentButton}
        loading={assigningWorker}
        onConfirm={() => void executeAssignWorker()}
        onCancel={() => setAssignConfirm(null)}
      />

      <ConfirmDialog
        open={assignConfirm === 'inmueble'}
        title={inmuebleAssignConfirmCopy.title}
        description={inmuebleAssignConfirmCopy.description}
        confirmLabel="Asignar a piso"
        confirmButtonClassName={pageTheme.accentButton}
        loading={assigningInmueble}
        onConfirm={() => void executeAssignInmueble()}
        onCancel={() => setAssignConfirm(null)}
      />

      <ConfirmDialog
        open={assignConfirm === 'delete'}
        title={deleteConfirmCopy.title}
        description={deleteConfirmCopy.description}
        confirmLabel="Eliminar"
        confirmButtonClassName="bg-red-600 hover:bg-red-500"
        loading={deletingClientes}
        onConfirm={() => void executeDeleteClientes()}
        onCancel={() => setAssignConfirm(null)}
      />
    </div>
  );
}

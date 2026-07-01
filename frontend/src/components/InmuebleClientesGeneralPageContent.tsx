'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Eye,
  Loader2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ClienteCopyContactsButton } from '@/components/ClienteCopyContactsButton';
import { ClienteExcelImportButton } from '@/components/ClienteExcelImportButton';
import {
  getClienteGestionEstadoOption,
  getGestionOptionStyle,
} from '@/lib/cliente-gestion-estado';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { InmuebleAssignSearchSelect } from '@/components/InmuebleAssignSearchSelect';
import { ClienteVentaRangeFiltersBar } from '@/components/ClienteVentaRangeFiltersBar';
import { ClienteTipoClienteSelect } from '@/components/ClienteTipoClienteSelect';
import { ClienteVentaTableFieldCell } from '@/components/ClienteVentaTableFieldCell';
import { ClienteFechaContactoCell } from '@/components/ClienteFechaContactoCell';
import { ClienteFechaEntradaInmuebleCell } from '@/components/ClienteFechaEntradaInmuebleCell';
import { ClienteFechaUltimaGestionCell } from '@/components/ClienteFechaUltimaGestionCell';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import { TableColumnTextFilterHead } from '@/components/TableColumnTextFilterHead';
import { TableFilterBar } from '@/components/TableFilterBar';
import { TableFilterEmptyState } from '@/components/TableFilterEmptyState';
import { TablePagination } from '@/components/TablePagination';
import {
  useClientesByTipoQuery,
  useInvalidateDashboardQueries,
  useInmueblesQuery,
  useWorkersQuery,
} from '@/hooks/use-dashboard-queries';
import { useClientesByTipoRealtime } from '@/hooks/use-clientes-by-tipo-realtime';
import {
  CLIENTES_GENERAL_DEFAULT_PAGE_SIZE,
  CLIENTES_GENERAL_PAGE_SIZE_OPTIONS,
  ClientesGeneralPageSize,
  parseClientesGeneralPageSize,
  resolveClientesGeneralPageSize,
} from '@/hooks/usePagination';
import { usePersistedState } from '@/hooks/usePersistedState';
import { buildTableStateKey } from '@/lib/persisted-table-state';
import { useResetPageOnFilterChange } from '@/hooks/useTableColumnFilters';
import { TableSort } from '@/lib/table-column-filters';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { buildVentaGlobalClienteTableColumns } from '@/lib/table-columns';
import { formatTableHeaderLabel } from '@/lib/table-header-label';
import { EXCEL_CELL_ALIGN, EXCEL_CELL_BORDER, EXCEL_STICKY_TABLE_CLASS, TABLE_HEAD_PADDING_DENSE, TABLE_HEAD_TEXT_CLASS } from '@/lib/excel-table-styles';
import {
  EMPTY_CLIENTE_GLOBAL_TEXT_FILTERS,
  filterClienteLinkRowsByText,
  hasActiveClienteGlobalTextFilters,
} from '@/lib/cliente-global-text-filters';
import {
  EMPTY_VENTA_RANGE_FILTERS,
  filterRowsByVentaRange,
  hasActiveVentaRangeFilters,
} from '@/lib/cliente-venta-range-filters';
import { bulkAssignInmueble, bulkAssignWorker, bulkDeleteClientes, bulkUnassignWorker } from '@/lib/clientes-api';
import { INMUEBLE_CLIENTE_UNASSIGNED_WORKER } from '@/lib/inmueble-cliente-filters';
import { getAssignableInmuebles, getInmuebleAssignLabel } from '@/lib/inmueble-assign-utils';
import { queryKeys } from '@/lib/query-keys';
import {
  Cliente,
} from '@/types/cliente';
import { InmuebleClienteLinkRow } from '@/types/inmueble-cliente-link';
import { ClientesByTipoListParams } from '@/types/clientes-by-tipo-page';
import { TIPO_OPERACION_LABELS, TipoOperacion } from '@/types/inmueble';
import { ClienteRefValue, clienteDenseTextClass } from '@/components/ClienteRefValue';
import { getWorkerRolLabel } from '@/types/worker';
import { normalizeClienteEntradaPrevista } from '@/lib/cliente-entrada-prevista';

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
    selectedRow: 'bg-emerald-100',
    stickyAccCellBg: 'bg-emerald-50',
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
    selectedRow: 'bg-blue-100',
    stickyAccCellBg: 'bg-blue-50',
    retryLink: 'text-blue-700 hover:text-blue-600',
  },
} as const;

/** Header cells in the synced horizontal scroll area (vertical stick is on the wrapper). */
const CLIENTES_TABLE_HEAD_CELL_CLASS = 'bg-slate-50';
const CLIENTES_DENSE_TABLE_CLASS = `${EXCEL_STICKY_TABLE_CLASS} min-w-[100rem] bg-white`;
const CLIENTES_TABLE_HEAD_STICKY_CLASS =
  'sticky top-0 z-30 isolate border-b border-slate-200 bg-white shadow-[0_1px_0_0_rgb(203,213,225)]';
/** Horizontal scroll only inside the table; hide scrollbar on the synced header track. */
const CLIENTES_TABLE_X_SCROLL_CLASS = 'max-w-full min-w-0 overflow-x-auto';
const CLIENTES_TABLE_HEAD_X_SCROLL_CLASS = `${CLIENTES_TABLE_X_SCROLL_CLASS} [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`;
const CLIENTES_TABLE_BODY_WRAPPER_CLASS = 'relative max-w-full min-w-0 bg-white pr-px';
/** ACC column: pinned right on horizontal scroll; header also sticks on vertical scroll. */
const CLIENTES_ACC_HEAD_SHADOW =
  'shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.12),inset_1px_0_0_0_#000]';
const CLIENTES_DENSE_ACTIONS_HEAD_CLASS = `sticky right-0 z-40 border-y border-black bg-slate-50 ${CLIENTES_ACC_HEAD_SHADOW} ${EXCEL_CELL_BORDER}`;
const CLIENTES_DENSE_ACTIONS_CELL_CLASS = `sticky right-0 z-20 border-y border-black bg-white ${CLIENTES_ACC_HEAD_SHADOW} ${EXCEL_CELL_BORDER}`;
const DENSE_NARROW_HEAD_LABEL_CLASS =
  'text-[9px] font-semibold uppercase leading-tight text-slate-600 sm:text-[10px]';
const DENSE_ENTRADA_PREVISTA_HEAD_LABEL_CLASS =
  'text-[9px] font-semibold uppercase leading-tight text-slate-600 sm:text-[10px]';

interface InmuebleClientesGeneralPageContentProps {
  expectedTipo: TipoOperacion;
  inmuebleListPath: string;
}

const DEFAULT_CLIENTES_GENERAL_LIST_STATE = {
  page: 1,
  pageSize: CLIENTES_GENERAL_DEFAULT_PAGE_SIZE,
  tableSort: {
    column: 'fecha_peticion',
    direction: 'desc',
  } as TableSort | null,
  ventaRangeFilters: EMPTY_VENTA_RANGE_FILTERS,
  textFilters: EMPTY_CLIENTE_GLOBAL_TEXT_FILTERS,
};

type ClienteGlobalTextFilterColumn = keyof typeof EMPTY_CLIENTE_GLOBAL_TEXT_FILTERS;

export function InmuebleClientesGeneralPageContent({
  expectedTipo,
  inmuebleListPath,
}: InmuebleClientesGeneralPageContentProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { invalidateClientesByTipo, invalidateAllInmuebles } =
    useInvalidateDashboardQueries();

  const [listState, setListState, , isListStateHydrated] = usePersistedState(
    `${buildTableStateKey(pathname, expectedTipo)}:clientes-general:v2`,
    DEFAULT_CLIENTES_GENERAL_LIST_STATE,
  );
  const { page, tableSort } = listState;
  const ventaRangeFilters = {
    ...EMPTY_VENTA_RANGE_FILTERS,
    ...(listState.ventaRangeFilters ?? {}),
  };
  const textFilters = {
    ...EMPTY_CLIENTE_GLOBAL_TEXT_FILTERS,
    ...(listState.textFilters ?? {}),
  };
  const pageSize = resolveClientesGeneralPageSize(listState.pageSize);

  const setPage = useCallback((value: number) => {
    setListState((prev) => {
      if (prev.page === value) return prev;
      return { ...prev, page: value };
    });
  }, [setListState]);
  const setTableSort = (value: TableSort | null) =>
    setListState((prev) => ({ ...prev, tableSort: value }));
  const setVentaRangeFilters = (
    value:
      | typeof EMPTY_VENTA_RANGE_FILTERS
      | ((
          prev: typeof EMPTY_VENTA_RANGE_FILTERS,
        ) => typeof EMPTY_VENTA_RANGE_FILTERS),
  ) =>
    setListState((prev) => ({
      ...prev,
      ventaRangeFilters:
        typeof value === 'function' ? value(prev.ventaRangeFilters) : value,
    }));
  const setTextFilters = (
    value:
      | typeof EMPTY_CLIENTE_GLOBAL_TEXT_FILTERS
      | ((
          prev: typeof EMPTY_CLIENTE_GLOBAL_TEXT_FILTERS,
        ) => typeof EMPTY_CLIENTE_GLOBAL_TEXT_FILTERS),
  ) =>
    setListState((prev) => ({
      ...prev,
      textFilters:
        typeof value === 'function' ? value(prev.textFilters) : value,
    }));
  const effectiveLimit = pageSize;

  const listParams = useMemo((): ClientesByTipoListParams => {
    const params: ClientesByTipoListParams = {
      page,
      limit: effectiveLimit,
    };
    if (tableSort?.column === 'fecha_peticion') {
      params.sort = 'fecha_entrada';
      params.dir = tableSort.direction;
    }
    return params;
  }, [page, effectiveLimit, tableSort]);

  const rowsQuery = useClientesByTipoQuery(expectedTipo, listParams, {
    enabled: isListStateHydrated,
  });
  useClientesByTipoRealtime(expectedTipo);
  const workersQuery = useWorkersQuery(true);
  const inmueblesQuery = useInmueblesQuery({ tipo_operacion: expectedTipo });
  const {
    showInitialLoading,
    isRefreshing,
    showError,
  } = useQueryUiState(rowsQuery);
  const pageData = rowsQuery.data;
  const rows = pageData?.rows ?? [];
  const totalItems = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectiveLimit));
  const workers = workersQuery.data ?? [];
  const inmuebles = inmueblesQuery.data ?? [];
  const assignableInmuebles = useMemo(
    () => getAssignableInmuebles(inmuebles),
    [inmuebles],
  );

  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set());
  const [assignInmuebleId, setAssignInmuebleId] = useState('');
  const [assigningWorker, setAssigningWorker] = useState(false);
  const [assigningInmueble, setAssigningInmueble] = useState(false);
  const [deletingClientes, setDeletingClientes] = useState(false);
  const [assignConfirm, setAssignConfirm] = useState<
    'inmueble' | 'delete' | null
  >(null);
  const [openTextFilterColumn, setOpenTextFilterColumn] =
    useState<ClienteGlobalTextFilterColumn | null>(null);
  const assigningBusy = assigningWorker || assigningInmueble || deletingClientes;
  const tableAnchorRef = useRef<HTMLElement>(null);
  const tableHeadScrollRef = useRef<HTMLDivElement>(null);
  const tableBodyScrollRef = useRef<HTMLDivElement>(null);
  const syncingTableScrollRef = useRef(false);
  const skipScrollOnPageRef = useRef(true);
  const isPageFetching = rowsQuery.isFetching && !rowsQuery.isLoading;

  const rowsAfterRangeFilters = useMemo(() => {
    return filterRowsByVentaRange(rows, ventaRangeFilters);
  }, [rows, ventaRangeFilters]);

  const rowsAfterTextFilters = useMemo(() => {
    return filterClienteLinkRowsByText(rowsAfterRangeFilters, textFilters);
  }, [rowsAfterRangeFilters, textFilters]);

  const ventaRangeFiltersActive = hasActiveVentaRangeFilters(ventaRangeFilters);
  const textFiltersActive = hasActiveClienteGlobalTextFilters(textFilters);
  const columnFiltersActive = ventaRangeFiltersActive || textFiltersActive;

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
    () => buildVentaGlobalClienteTableColumns(expectedTipo),
    [expectedTipo],
  );

  const isDenseClienteTable = true;

  const denseCellClassByKey = useMemo(() => {
    return new Map(
      tableColumns.map((col) => [col.key, col.cellClassName ?? '']),
    );
  }, [tableColumns]);

  function denseCellClass(key: string, extra = '') {
    const base = denseCellClassByKey.get(key) ?? '';
    return ['bg-white px-3 py-2.5', EXCEL_CELL_BORDER, EXCEL_CELL_ALIGN, base, extra].filter(Boolean).join(' ');
  }

  function updateClienteById(clienteId: string, patch: Partial<Cliente>) {
    queryClient.setQueryData(
      queryKeys.clientes.byTipo(expectedTipo, listParams),
      (prev: typeof pageData) =>
        prev
          ? {
              ...prev,
              rows: prev.rows.map((row) =>
                row.cliente.id === clienteId
                  ? { ...row, cliente: { ...row.cliente, ...patch } }
                  : row,
              ),
            }
          : prev,
    );
  }

  const displayRows = rowsAfterTextFilters;

  function clearSort() {
    setTableSort(null);
    setPage(1);
  }

  function toggleEntradaSort() {
    setPage(1);
    if (
      tableSort?.column !== 'fecha_peticion' ||
      tableSort.direction === 'desc'
    ) {
      setTableSort({ column: 'fecha_peticion', direction: 'asc' });
    } else {
      setTableSort({ column: 'fecha_peticion', direction: 'desc' });
    }
  }

  function changePageSize(size: ClientesGeneralPageSize) {
    setListState((prev) => ({ ...prev, pageSize: size, page: 1 }));
  }

  useResetPageOnFilterChange([ventaRangeFilters, textFilters], setPage);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);

  useEffect(() => {
    setSelectedRowKeys(new Set());
  }, [listParams]);

  useEffect(() => {
    if (skipScrollOnPageRef.current) {
      skipScrollOnPageRef.current = false;
      return;
    }
    tableAnchorRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [page]);

  function clearAllFilters() {
    clearSort();
    setVentaRangeFilters(EMPTY_VENTA_RANGE_FILTERS);
    setTextFilters(EMPTY_CLIENTE_GLOBAL_TEXT_FILTERS);
  }

  const syncTableHorizontalScroll = useCallback((source: 'head' | 'body') => {
    if (syncingTableScrollRef.current) return;

    const head = tableHeadScrollRef.current;
    const body = tableBodyScrollRef.current;
    if (!head || !body) return;

    syncingTableScrollRef.current = true;
    const nextLeft = source === 'body' ? body.scrollLeft : head.scrollLeft;
    head.scrollLeft = nextLeft;
    body.scrollLeft = nextLeft;
    syncingTableScrollRef.current = false;
  }, []);

  function setTextFilter(
    column: ClienteGlobalTextFilterColumn,
    value: string,
  ) {
    setPage(1);
    setTextFilters((prev) => ({ ...prev, [column]: value }));
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

  async function handleAssignWorkerSelect(workerId: string) {
    if (!workerId) return;

    if (selectedRowKeys.size === 0) {
      toast.error('Selecciona al menos un cliente');
      return;
    }

    const selectedRows = rows.filter((row) => selectedRowKeys.has(row.row_key));
    const uniqueClienteIds = [
      ...new Set(selectedRows.map((row) => row.cliente.id)),
    ];
    const isUnassign = workerId === INMUEBLE_CLIENTE_UNASSIGNED_WORKER;

    setAssigningWorker(true);

    try {
      if (isUnassign) {
        const result = await bulkUnassignWorker({ cliente_ids: uniqueClienteIds });
        toast.success(
          `${result.unassigned} cliente${result.unassigned !== 1 ? 's' : ''} sin asignar`,
        );
      } else {
        const assignableRows = selectedRows.filter((row) =>
          Boolean(row.inmueble_id),
        );
        const skippedUnlinked = selectedRows.length - assignableRows.length;

        if (assignableRows.length === 0) {
          toast.error('Los clientes sin inmueble no se pueden asignar desde aquí');
          return;
        }

        const result = await bulkAssignWorker({
          worker_id: workerId,
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
      }

      clearSelection();
      await invalidateClientesByTipo(expectedTipo);
    } catch (error) {
      const defaultMessage = isUnassign
        ? 'No se pudieron quitar las asignaciones'
        : 'No se pudieron asignar los clientes';
      toast.error(
        error instanceof Error ? error.message : defaultMessage,
      );
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
  const filterAccent = expectedTipo === 'alquiler' ? 'emerald' : 'blue';

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

  const allRowsSelected =
    displayRows.length > 0 &&
    displayRows.every((row) => selectedRowKeys.has(row.row_key));
  const someRowsSelected =
    displayRows.some((row) => selectedRowKeys.has(row.row_key)) &&
    !allRowsSelected;

  const clientesDenseColgroup = (
    <colgroup>
      <col className="w-8" />
      {tableColumns.map((col) => (
        <col key={col.key} className={col.headClassName} />
      ))}
      <col className="w-10 min-w-[2.5rem]" />
    </colgroup>
  );

  const clientesTableHead = (
    <thead className="bg-slate-50">
      <tr className="bg-slate-50">
        <th
          className={`w-8 ${CLIENTES_TABLE_HEAD_CELL_CLASS} ${TABLE_HEAD_PADDING_DENSE} text-center ${EXCEL_CELL_BORDER}`}
        >
          <input
            type="checkbox"
            checked={allRowsSelected}
            ref={(el) => {
              if (el) {
                el.indeterminate = someRowsSelected;
              }
            }}
            onChange={() => toggleSelectAllFiltered(displayRows)}
            disabled={assigningBusy}
            className={`h-4 w-4 rounded border-slate-300 ${pageTheme.accentCheckbox}`}
            aria-label="Seleccionar todos los clientes (todas las páginas)"
          />
        </th>
        {tableColumns.map((col) => {
          if (col.key === 'fecha_peticion') {
            return (
              <th
                key={col.key}
                className={`whitespace-nowrap ${CLIENTES_TABLE_HEAD_CELL_CLASS} ${TABLE_HEAD_TEXT_CLASS} text-slate-600 ${TABLE_HEAD_PADDING_DENSE} text-center ${EXCEL_CELL_BORDER} ${col.headClassName ?? ''}`}
              >
                <button
                  type="button"
                  onClick={toggleEntradaSort}
                  className={`inline-flex w-full flex-col items-center justify-center gap-0.5 uppercase transition hover:text-slate-900 ${DENSE_NARROW_HEAD_LABEL_CLASS}`}
                  title={
                    tableSort?.column === 'fecha_peticion'
                      ? tableSort.direction === 'asc'
                        ? 'Más antigua primero — clic para más reciente'
                        : 'Más reciente primero — clic para más antigua'
                      : 'Clic para ordenar por fecha de petición'
                  }
                >
                  <span className="text-center whitespace-pre-line break-words leading-tight">
                    {formatTableHeaderLabel(col.shortLabel ?? col.label)}
                  </span>
                  {tableSort?.column === 'fecha_peticion' ? (
                    tableSort.direction === 'asc' ? (
                      <ArrowUp className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    ) : (
                      <ArrowDown className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    )
                  ) : (
                    <ArrowUpDown
                      className="h-2.5 w-2.5 shrink-0 opacity-70"
                      aria-hidden
                    />
                  )}
                </button>
              </th>
            );
          }

          if (col.key === 'nombre' || col.key === 'telefono') {
            const filterKey = col.key as ClienteGlobalTextFilterColumn;
            return (
              <TableColumnTextFilterHead
                key={col.key}
                label={col.label}
                shortLabel={col.shortLabel}
                value={textFilters[filterKey] ?? ''}
                placeholder={
                  col.key === 'nombre' ? 'Buscar nombre…' : 'Buscar teléfono…'
                }
                isOpen={openTextFilterColumn === filterKey}
                isFilterActive={(textFilters[filterKey] ?? '').trim() !== ''}
                onOpenChange={(open) =>
                  setOpenTextFilterColumn(open ? filterKey : null)
                }
                onApply={(value) => setTextFilter(filterKey, value)}
                accent={filterAccent}
                className={`${CLIENTES_TABLE_HEAD_CELL_CLASS} ${col.headClassName ?? ''}`}
              />
            );
          }

          return (
            <th
              key={col.key}
              className={`${
                col.key === 'fecha_entrada_inmueble'
                  ? 'whitespace-normal'
                  : 'whitespace-nowrap'
              } ${CLIENTES_TABLE_HEAD_CELL_CLASS} ${TABLE_HEAD_TEXT_CLASS} text-slate-600 ${TABLE_HEAD_PADDING_DENSE} text-center ${EXCEL_CELL_BORDER} ${col.headClassName ?? ''}`}
              title={formatTableHeaderLabel(col.label)}
            >
              <span
                className={`flex w-full items-center justify-center ${
                  col.key === 'fecha_entrada_inmueble'
                    ? DENSE_ENTRADA_PREVISTA_HEAD_LABEL_CLASS
                    : ''
                }`}
              >
                <span
                  className={`text-center break-words ${
                    col.key === 'fecha_entrada_inmueble'
                      ? 'whitespace-pre-line leading-tight'
                      : ''
                  }`}
                >
                  {formatTableHeaderLabel(col.shortLabel ?? col.label)}
                </span>
              </span>
            </th>
          );
        })}
        <th
          className={`w-10 min-w-[2.5rem] ${TABLE_HEAD_PADDING_DENSE} ${DENSE_NARROW_HEAD_LABEL_CLASS} text-center ${CLIENTES_DENSE_ACTIONS_HEAD_CLASS}`}
        >
          <span className="flex w-full items-center justify-center">ACC</span>
        </th>
      </tr>
    </thead>
  );

  const selectClass = `rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition ${pageTheme.accentSelectFocus} disabled:opacity-60`;

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

  const title =
    expectedTipo === 'alquiler'
      ? 'CLIENTES GENERAL ALQUILER'
      : 'CLIENTES GENERAL VENTA';

  return (
    <div
      className="-mx-4 min-w-0 rounded-b-xl px-4 pb-5 pt-5 sm:-mx-6 sm:px-6 sm:pb-6 sm:pt-6 lg:-mx-8 lg:px-8 lg:pb-8 lg:pt-8"
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

      <section
        ref={tableAnchorRef}
        className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm scroll-mt-20 sm:scroll-mt-24"
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">
              Clientes ({totalItems})
            </h2>
          </div>
        </div>

        {totalItems > 0 && (
          <ClienteVentaRangeFiltersBar
            filters={ventaRangeFilters}
            onChange={setVentaRangeFilters}
            onClear={() => setVentaRangeFilters(EMPTY_VENTA_RANGE_FILTERS)}
            disabled={assigningBusy}
            hasActiveFilters={ventaRangeFiltersActive}
            accent={expectedTipo === 'alquiler' ? 'emerald' : 'blue'}
          />
        )}

        {totalItems > 0 && (
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
                value=""
                onChange={(e) => void handleAssignWorkerSelect(e.target.value)}
                disabled={
                  assigningBusy || selectedRowKeys.size === 0
                }
                className={`w-full sm:w-auto ${selectClass}`}
                aria-label="Trabajador para asignar"
              >
                <option value="" disabled>
                  {assigningWorker ? 'Asignando…' : 'Asignar a trabajador…'}
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

        {showInitialLoading ? (
          <p className="py-10 text-center text-slate-500">Cargando clientes…</p>
        ) : totalItems === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay clientes vinculados a inmuebles de{' '}
            {expectedTipo === 'alquiler' ? 'alquiler' : 'venta'}.
          </p>
        ) : displayRows.length === 0 ? (
          <TableFilterEmptyState
            onClear={columnFiltersActive ? clearAllFilters : clearSort}
          />
        ) : (
          <>
            {columnFiltersActive && (
              <TableFilterBar
                filteredCount={displayRows.length}
                totalCount={rows.length}
                entityLabel="clientes"
                hasSort={!!tableSort}
                onClear={clearAllFilters}
              />
            )}
            <div className={CLIENTES_TABLE_HEAD_STICKY_CLASS}>
              <div
                ref={tableHeadScrollRef}
                className={CLIENTES_TABLE_HEAD_X_SCROLL_CLASS}
                onScroll={() => syncTableHorizontalScroll('head')}
              >
                <table className={CLIENTES_DENSE_TABLE_CLASS}>
                  {clientesDenseColgroup}
                  {clientesTableHead}
                </table>
              </div>
            </div>
            <div className={CLIENTES_TABLE_BODY_WRAPPER_CLASS}>
              {isPageFetching ? (
                <div className="pointer-events-none absolute inset-0 z-50 flex items-start justify-center bg-white/50 pt-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                </div>
              ) : null}
              <div
                ref={tableBodyScrollRef}
                className={CLIENTES_TABLE_X_SCROLL_CLASS}
                onScroll={() => syncTableHorizontalScroll('body')}
              >
                <table className={CLIENTES_DENSE_TABLE_CLASS}>
                  {clientesDenseColgroup}
                  <tbody>
                  {displayRows.map((row) => {
                    const { cliente } = row;
                    const isSelected = selectedRowKeys.has(row.row_key);

                    return (
                      <tr
                        key={row.row_key}
                        className={`hover:bg-slate-50 ${isSelected ? pageTheme.selectedRow : ''}`}
                      >
                        <td className={isDenseClienteTable ? `w-8 bg-white px-3 py-2.5 text-center ${EXCEL_CELL_BORDER}` : 'w-10 px-3 py-3'}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelection(row.row_key)}
                            disabled={assigningBusy}
                            className={`h-4 w-4 rounded border-slate-300 ${pageTheme.accentCheckbox}`}
                            aria-label={`Seleccionar ${cliente.nombre}`}
                          />
                        </td>
                        <td
                          className={denseCellClass('fecha_ultima_gestion')}
                          style={getGestionOptionStyle(
                            getClienteGestionEstadoOption(
                              cliente.gestion_estado,
                              expectedTipo,
                            ),
                          )}
                        >
                          <ClienteFechaUltimaGestionCell
                            clienteId={cliente.id}
                            value={cliente.fecha_ultima_gestion}
                            disabled={assigningBusy}
                            compact
                            gestionStyle={getGestionOptionStyle(
                              getClienteGestionEstadoOption(
                                cliente.gestion_estado,
                                expectedTipo,
                              ),
                            )}
                            onUpdated={(fechaUltimaGestion) =>
                              updateClienteById(cliente.id, {
                                fecha_ultima_gestion: fechaUltimaGestion,
                              })
                            }
                          />
                        </td>
                        <td className={denseCellClass('fecha_peticion')}>
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
                        <td
                          className={denseCellClass(
                            'fecha_entrada_inmueble',
                            normalizeClienteEntradaPrevista(
                              cliente.fecha_entrada_inmueble,
                            ) === 'ya'
                              ? 'bg-yellow-300'
                              : '',
                          )}
                        >
                          <ClienteFechaEntradaInmuebleCell
                            clienteId={cliente.id}
                            value={cliente.fecha_entrada_inmueble}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(fechaEntradaInmueble) =>
                              updateClienteById(cliente.id, {
                                fecha_entrada_inmueble: fechaEntradaInmueble,
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
                        <td className={denseCellClass('telefono', 'text-slate-600')}>
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
                        <td className={denseCellClass('barrio', 'text-slate-600')}>
                          <ClienteVentaTableFieldCell
                            clienteId={cliente.id}
                            kind="barrio"
                            refCliente={cliente.ref_cliente}
                            barrio={cliente.barrio}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(patch) =>
                              updateClienteById(cliente.id, patch)
                            }
                          />
                        </td>
                        <td className={denseCellClass('distrito', 'text-slate-600')}>
                          <ClienteVentaTableFieldCell
                            clienteId={cliente.id}
                            kind="distrito"
                            refCliente={cliente.ref_cliente}
                            distrito={cliente.distrito}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(patch) =>
                              updateClienteById(cliente.id, patch)
                            }
                          />
                        </td>
                        <td className={denseCellClass('tipo_nomina', 'text-slate-600')}>
                          <ClienteVentaTableFieldCell
                            clienteId={cliente.id}
                            kind="tipo_nomina"
                            refCliente={cliente.ref_cliente}
                            tipoNomina={cliente.tipo_nomina}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(patch) =>
                              updateClienteById(cliente.id, patch)
                            }
                          />
                        </td>
                        <td className={denseCellClass('tipo_cliente')}>
                          <ClienteTipoClienteSelect
                            clienteId={cliente.id}
                            value={cliente.tipo_cliente}
                            disabled={assigningBusy}
                            compact
                            onUpdated={(tipoCliente) =>
                              updateClienteById(cliente.id, {
                                tipo_cliente: tipoCliente,
                              })
                            }
                          />
                        </td>
                        <td
                          className={`${CLIENTES_DENSE_ACTIONS_CELL_CLASS} w-10 min-w-[2.5rem] max-w-[2.5rem] px-0 py-2.5 align-middle ${
                            isSelected ? pageTheme.stickyAccCellBg : ''
                          }`}
                        >
                          <div className="flex w-full items-center justify-center">
                            <Link
                              href={`/dashboard/clientes/${cliente.id}`}
                              className={`inline-flex items-center justify-center rounded p-1 text-slate-500 transition hover:bg-slate-100 ${pageTheme.accentLink}`}
                              title="Ver cliente"
                              aria-label="Ver cliente"
                            >
                              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          </>
        )}

        {totalItems > 0 ? (
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={(size) =>
              changePageSize(parseClientesGeneralPageSize(String(size)))
            }
            pageSizeOptions={CLIENTES_GENERAL_PAGE_SIZE_OPTIONS}
          />
        ) : null}
      </section>

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

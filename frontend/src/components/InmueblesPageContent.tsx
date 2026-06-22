'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Minus, Pencil, Plus, Trash2, X, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { ExcelImportButton } from '@/components/ExcelImportButton';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';
import { InmuebleAlquilerFiltersBar } from '@/components/InmuebleAlquilerFiltersBar';
import { InmuebleDenseImageCell } from '@/components/InmuebleDenseImageCell';
import { InmuebleForm } from '@/components/InmuebleForm';
import { InmuebleObservacionesLineCell } from '@/components/InmuebleObservacionesLineCell';
import { InmuebleRefInlineCell } from '@/components/InmuebleRefInlineCell';
import { InmuebleStatusRowEditor } from '@/components/InmuebleStatusRowEditor';
import { TableColumnFilterHead } from '@/components/TableColumnFilterHead';
import { TableFilterBar } from '@/components/TableFilterBar';
import { TableFilterEmptyState } from '@/components/TableFilterEmptyState';
import { TablePagination } from '@/components/TablePagination';
import {
  STABLE_EMPTY_COLUMN_FILTERS,
  useResetPageOnFilterChange,
  useTableColumnFilters,
} from '@/hooks/useTableColumnFilters';
import { usePagination } from '@/hooks/usePagination';
import { buildInmuebleTableColumns } from '@/lib/inmueble-column-filters';
import { getColumnFilterFieldType } from '@/lib/inmueble-column-filters';
import {
  getInmuebleDisplayedTableFields,
  getInmuebleDenseColClass,
  getInmuebleTableFields,
  getInmuebleTableHeaderClass,
  getInmuebleStickyHeadActionsClass,
  getInmuebleStickyHeadClass,
  INMUEBLE_DENSE_TABLE_WRAPPER_CLASS,
  INMUEBLE_DENSE_HEAD_CELL_CLASS,
  INMUEBLE_DENSE_ACTIONS_COL_CLASS,
  isDenseInmuebleTable,
  isInmuebleCompactHeadKey,
} from '@/lib/inmueble-table-layout';
import {
  EXCEL_CELL_ALIGN,
  EXCEL_CELL_BORDER,
  EXCEL_TABLE_CLASS,
} from '@/lib/excel-table-styles';
import {
  useInmueblesQuery,
  useInvalidateDashboardQueries,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import {
  createInmueble,
  deleteInmueble,
} from '@/lib/inmuebles-api';
import { getInmuebleRowStyle, resolveInmuebleRowColor } from '@/lib/inmueble-status';
import { InmueblePropiCell } from '@/components/InmueblePropiCell';
import { getInmueblePropietarios } from '@/lib/inmueble-propietarios';
import {
  EMPTY_INMUEBLE_ALQUILER_FILTERS,
  filterInmueblesByAlquilerFilters,
  hasActiveInmuebleAlquilerFilters,
} from '@/lib/inmueble-alquiler-filters';
import { queryKeys } from '@/lib/query-keys';
import {
  buildInmuebleDenseImageOverlays,
  formatInmuebleCell,
  formatInmuebleEntradaDate,
  formatLargaEstanciaCompact,
  isUrl,
  STATUS_STYLES,
  TIPO_OPERACION_STYLES,
  toInmuebleCellValue,
} from '@/lib/inmueble-table-utils';
import {
  Inmueble,
  InmuebleFormData,
  TIPO_OPERACION_LABELS,
  TipoOperacion,
} from '@/types/inmueble';

const PAGE_THEMES = {
  alquiler: {
    background: '#065f46',
    border: '#064e3b',
    text: '#fde047',
    muted: '#a7f3d0',
  },
  venta: {
    background: '#1e3a8a',
    border: '#1e40af',
    text: '#fde047',
    muted: '#bfdbfe',
  },
} as const;

const DENSE_PAGE_COPY: Record<
  TipoOperacion,
  { title: string; description: string }
> = {
  venta: {
    title: 'EXCEL PROPIETARIOS VENTA',
    description:
      'Listado tipo Excel de propietarios e inmuebles en venta.',
  },
  alquiler: {
    title: 'EXCEL PROPIETARIOS ALQUILER',
    description:
      'Listado tipo Excel de propietarios e inmuebles en alquiler.',
  },
};

interface InmueblesPageContentProps {
  tipoOperacion: TipoOperacion;
  title: string;
  description: string;
  basePath: string;
}

export function InmueblesPageContent({
  tipoOperacion,
  title,
  description,
  basePath,
}: InmueblesPageContentProps) {
  const { invalidateInmuebles } = useInvalidateDashboardQueries();
  const queryClient = useQueryClient();
  const inmueblesQueryKey = queryKeys.inmuebles.all({
    tipo_operacion: tipoOperacion,
  });
  const inmueblesQuery = useInmueblesQuery({ tipo_operacion: tipoOperacion });
  const {
    data: inmuebles = [],
    showInitialLoading,
    isRefreshing,
  } = useQueryUiState(inmueblesQuery);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [alquilerFilters, setAlquilerFilters] = useState(
    EMPTY_INMUEBLE_ALQUILER_FILTERS,
  );
  const [extraColumnsVisible, setExtraColumnsVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [stickyTableHeadTop, setStickyTableHeadTop] = useState(56);
  const tableFields = useMemo(
    () => getInmuebleTableFields(tipoOperacion),
    [tipoOperacion],
  );
  const displayedTableFields = useMemo(
    () =>
      getInmuebleDisplayedTableFields(tipoOperacion, {
        includeExtraColumns: extraColumnsVisible,
      }),
    [tipoOperacion, extraColumnsVisible],
  );
  const isDenseTable = isDenseInmuebleTable(tipoOperacion);
  const tableHeaderClass = getInmuebleTableHeaderClass(tipoOperacion);
  const stickyHeadClass = isDenseTable
    ? getInmuebleStickyHeadClass(tipoOperacion)
    : '';
  const stickyHeadActionsClass = isDenseTable
    ? getInmuebleStickyHeadActionsClass(tipoOperacion)
    : `sticky right-0 z-10 ${tableHeaderClass}`;
  const isVentaTable = tipoOperacion === 'venta';
  const pageTheme = isDenseTable ? PAGE_THEMES[tipoOperacion] : null;
  const pageTitle = isDenseTable ? DENSE_PAGE_COPY[tipoOperacion].title : title;
  const pageDescription = isDenseTable
    ? DENSE_PAGE_COPY[tipoOperacion].description
    : description;
  const enableExcelColumnFilters = !isDenseTable;
  const enablePrecioColumnSort = isDenseTable;

  useLayoutEffect(() => {
    if (!isDenseTable) return;

    function computeStickyHeadTop() {
      const navPx = window.matchMedia('(min-width: 640px)').matches ? 64 : 56;
      const filtersPx =
        filtersVisible && filterBarRef.current
          ? filterBarRef.current.getBoundingClientRect().height
          : 0;
      setStickyTableHeadTop(navPx + filtersPx);
    }

    computeStickyHeadTop();
    window.addEventListener('resize', computeStickyHeadTop);

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(computeStickyHeadTop)
        : null;
    if (filterBarRef.current && observer) {
      observer.observe(filterBarRef.current);
    }

    return () => {
      window.removeEventListener('resize', computeStickyHeadTop);
      observer?.disconnect();
    };
  }, [isDenseTable, filtersVisible, alquilerFilters]);

  const stickyHeadStyle = isDenseTable ? { top: stickyTableHeadTop } : undefined;

  function inmuebleCellClass(
    field: (typeof tableFields)[number],
    extra = '',
  ) {
    if (!isDenseTable) {
      return ['max-w-[180px] truncate px-3 py-2 text-slate-700', extra]
        .filter(Boolean)
        .join(' ');
    }

    const isFlushCell = field.cellClassName?.includes('p-0');

    return [
      'min-w-0 text-sm font-bold text-slate-700',
      isFlushCell ? field.cellClassName : 'px-2 py-1.5',
      !isFlushCell ? field.cellClassName : null,
      EXCEL_CELL_BORDER,
      isFlushCell ? 'align-middle' : EXCEL_CELL_ALIGN,
      extra,
    ]
      .filter(Boolean)
      .join(' ');
  }

  const tableColumns = useMemo(
    () => buildInmuebleTableColumns(tableFields),
    [tableFields],
  );

  const {
    columnFilters,
    tableSort,
    openFilterColumn,
    setOpenFilterColumn,
    columnUniqueValues,
    filteredRows: filteredInmuebles,
    filtersActive,
    clearFilters,
    setColumnFilter,
    setSort,
    clearSort,
    isFilterActiveForColumn,
  } = useTableColumnFilters(inmuebles, tableColumns);

  function togglePrecioSort() {
    if (tableSort?.column !== 'precio' || tableSort.direction === 'desc') {
      setSort('precio', 'asc');
    } else {
      setSort('precio', 'desc');
    }
  }

  const rowsAfterAlquilerFilters = useMemo(() => {
    if (!isDenseTable) return inmuebles;
    return filterInmueblesByAlquilerFilters(inmuebles, alquilerFilters);
  }, [inmuebles, alquilerFilters, isDenseTable]);

  const sortedDenseRows = useMemo(() => {
    if (!enablePrecioColumnSort || tableSort?.column !== 'precio') {
      return rowsAfterAlquilerFilters;
    }

    const mult = tableSort.direction === 'asc' ? 1 : -1;
    return [...rowsAfterAlquilerFilters].sort((a, b) => {
      const pa = a.precio;
      const pb = b.precio;
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return (pa - pb) * mult;
    });
  }, [enablePrecioColumnSort, tableSort, rowsAfterAlquilerFilters]);

  const alquilerFiltersActive = isDenseTable
    ? hasActiveInmuebleAlquilerFilters(alquilerFilters)
    : false;

  const effectiveFilteredInmuebles = enableExcelColumnFilters
    ? filteredInmuebles
    : sortedDenseRows;
  const effectiveFiltersActive = enableExcelColumnFilters
    ? filtersActive
    : alquilerFiltersActive;

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems,
  } = usePagination(effectiveFilteredInmuebles);

  useResetPageOnFilterChange(
    [
      enableExcelColumnFilters ? columnFilters : STABLE_EMPTY_COLUMN_FILTERS,
      tableSort,
      isDenseTable ? alquilerFilters : STABLE_EMPTY_COLUMN_FILTERS,
    ],
    setPage,
  );

  function clearAllFilters() {
    if (enableExcelColumnFilters) clearFilters();
    if (isDenseTable) {
      clearSort();
      setAlquilerFilters(EMPTY_INMUEBLE_ALQUILER_FILTERS);
    }
  }

  function patchInmuebleInCache(
    inmuebleId: string,
    patch: Partial<Pick<Inmueble, 'status' | 'row_color' | 'observaciones' | 'ref'>>,
  ) {
    queryClient.setQueryData<Inmueble[]>(inmueblesQueryKey, (prev) =>
      prev?.map((row) =>
        row.id === inmuebleId ? { ...row, ...patch } : row,
      ) ?? [],
    );
  }

  function closeModal() {
    if (!saving) {
      setModalOpen(false);
    }
  }

  async function handleSubmit(data: InmuebleFormData) {
    setSaving(true);
    try {
      await createInmueble({ ...data, tipo_operacion: tipoOperacion });
      toast.success('Inmueble creado');
      setModalOpen(false);
      await invalidateInmuebles({ tipo_operacion: tipoOperacion });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar inmueble',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este inmueble? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteInmueble(id);
      toast.success('Inmueble eliminado');
      await invalidateInmuebles({ tipo_operacion: tipoOperacion });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar inmueble',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      className={
        isDenseTable
          ? '-mx-4 -mt-5 rounded-b-xl px-4 pb-5 pt-5 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pb-6 sm:pt-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pb-8 lg:pt-8'
          : undefined
      }
      style={
        pageTheme
          ? {
              backgroundColor: pageTheme.background,
              borderColor: pageTheme.border,
            }
          : undefined
      }
    >
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          {isDenseTable ? (
            <>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1
                  className="text-xl font-bold sm:text-2xl"
                  style={{ color: pageTheme?.text }}
                >
                  {pageTitle}
                </h1>
                <button
                  type="button"
                  onClick={() => setFiltersVisible((prev) => !prev)}
                  className={`rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                    filtersVisible
                      ? 'border-white bg-white text-slate-900 hover:bg-slate-100'
                      : 'border-white/40 bg-white/15 text-white hover:bg-white/25'
                  }`}
                  aria-expanded={filtersVisible}
                >
                  Filter
                </button>
                {isRefreshing ? <QueryRefreshingBadge /> : null}
              </div>
              <p className="mt-2 text-sm" style={{ color: pageTheme?.muted }}>
                {pageDescription}
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {pageTitle}
                </h1>
                {isRefreshing ? <QueryRefreshingBadge /> : null}
              </div>
              <p className="mt-1 text-slate-500">{pageDescription}</p>
            </>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <ExcelImportButton
            onComplete={() =>
              invalidateInmuebles({ tipo_operacion: tipoOperacion })
            }
            disabled={showInitialLoading}
            fixedTipo={tipoOperacion}
          />
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:w-auto ${
              isDenseTable
                ? 'bg-white text-slate-900 hover:bg-slate-100'
                : isVentaTable
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            <Plus className="h-4 w-4" />
            Añadir inmueble
          </button>
        </div>
      </header>

      {isDenseTable && filtersVisible ? (
        <div
          ref={filterBarRef}
          className="sticky top-14 z-30 mb-4 rounded-xl border border-slate-200 bg-gray-200 shadow-sm sm:top-16"
        >
          <InmuebleAlquilerFiltersBar
            inmuebles={inmuebles}
            filters={alquilerFilters}
            onChange={setAlquilerFilters}
            onClear={() =>
              setAlquilerFilters(EMPTY_INMUEBLE_ALQUILER_FILTERS)
            }
            disabled={showInitialLoading}
            hasActiveFilters={alquilerFiltersActive}
            tipoOperacion={tipoOperacion}
          />
        </div>
      ) : null}

      {showInitialLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando inmuebles…
        </div>
      ) : inmuebles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">No hay inmuebles registrados</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={`mt-4 text-sm font-medium ${
              isVentaTable
                ? 'text-slate-900 hover:text-slate-700'
                : 'text-emerald-600 hover:text-emerald-500'
            }`}
          >
            Añadir el primero
          </button>
        </div>
      ) : (
        <div className="overflow-x-clip rounded-xl border border-slate-200 bg-white shadow-sm">
          {effectiveFiltersActive && (
            <TableFilterBar
              filteredCount={effectiveFilteredInmuebles.length}
              totalCount={inmuebles.length}
              entityLabel="inmuebles"
              hasSort={enableExcelColumnFilters ? !!tableSort : false}
              onClear={clearAllFilters}
            />
          )}
          {effectiveFilteredInmuebles.length === 0 ? (
            <TableFilterEmptyState onClear={clearAllFilters} />
          ) : (
          <div
            className={
              isDenseTable ? INMUEBLE_DENSE_TABLE_WRAPPER_CLASS : 'overflow-x-auto'
            }
          >
            <table
              className={
                isDenseTable
                  ? EXCEL_TABLE_CLASS
                  : 'min-w-max w-full text-left text-sm'
              }
            >
              {isDenseTable ? (
                <colgroup>
                  {displayedTableFields.map((field) => (
                    <col
                      key={field.key}
                      className={getInmuebleDenseColClass(field.key, {
                        extraColumnsVisible,
                      })}
                    />
                  ))}
                  <col className={INMUEBLE_DENSE_ACTIONS_COL_CLASS} />
                </colgroup>
              ) : null}
              <thead>
                <tr className={`${tableHeaderClass} text-white`}>
                    {displayedTableFields.map((field) => {
                    const isPrecioSortable =
                      enablePrecioColumnSort && field.key === 'precio';
                    const precioSortActive =
                      isPrecioSortable && tableSort?.column === 'precio';

                    if (isPrecioSortable) {
                      return (
                        <th
                          key={field.key}
                          style={stickyHeadStyle}
                          className={`${stickyHeadClass} ${INMUEBLE_DENSE_HEAD_CELL_CLASS} uppercase text-center ${EXCEL_CELL_BORDER} ${field.headClassName ?? ''}`}
                        >
                          <button
                            type="button"
                            onClick={togglePrecioSort}
                            className={`inline-flex w-full items-center justify-center gap-0.5 transition hover:opacity-90 text-yellow-300`}
                            title={
                              precioSortActive
                                ? tableSort.direction === 'asc'
                                  ? 'Más barato primero — clic para más caro'
                                  : 'Más caro primero — clic para más barato'
                                : 'Clic para ordenar por precio'
                            }
                          >
                            <span className="whitespace-nowrap leading-none">
                              {field.shortLabel ?? field.label}
                            </span>
                            {precioSortActive ? (
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
                      );
                    }

                    if (enableExcelColumnFilters) {
                      return (
                        <TableColumnFilterHead
                          key={field.key}
                          label={field.label}
                          shortLabel={field.shortLabel}
                          fieldType={getColumnFilterFieldType(field.key)}
                          uniqueValues={columnUniqueValues.get(field.key) ?? []}
                          filter={columnFilters[field.key]}
                          sortDirection={
                            tableSort?.column === field.key
                              ? tableSort.direction
                              : null
                          }
                          isSortColumn={tableSort?.column === field.key}
                          isOpen={openFilterColumn === field.key}
                          isFilterActive={isFilterActiveForColumn(field.key)}
                          onOpenChange={(open) =>
                            setOpenFilterColumn(open ? field.key : null)
                          }
                          onApply={(next) => setColumnFilter(field.key, next)}
                          onSort={(direction) => setSort(field.key, direction)}
                        />
                      );
                    }

                    const compactHead = isInmuebleCompactHeadKey(field.key);

                    return (
                      <th
                        key={field.key}
                        style={stickyHeadStyle}
                        className={`${
                          isDenseTable
                            ? `${stickyHeadClass} ${INMUEBLE_DENSE_HEAD_CELL_CLASS} uppercase text-yellow-300 ${compactHead ? 'px-0' : ''} text-center ${EXCEL_CELL_BORDER} ${field.headClassName ?? ''}`
                            : 'px-3 py-3 text-xs font-semibold uppercase'
                        }`}
                        title={field.label}
                      >
                        <span
                          className={
                            compactHead
                              ? 'whitespace-nowrap leading-none'
                              : 'break-words whitespace-normal leading-tight'
                          }
                        >
                          {isDenseTable
                            ? field.shortLabel ?? field.label
                            : field.label}
                        </span>
                      </th>
                    );
                  })}
                  <th
                    style={stickyHeadStyle}
                    className={`${
                      isDenseTable
                        ? `${stickyHeadClass} ${INMUEBLE_DENSE_HEAD_CELL_CLASS} px-0.5 text-yellow-300 ${EXCEL_CELL_BORDER}`
                        : `${stickyHeadActionsClass} px-3 py-3 text-xs font-semibold`
                    } ${INMUEBLE_DENSE_ACTIONS_COL_CLASS} shrink-0 text-center uppercase`}
                  >
                    {isDenseTable ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="whitespace-nowrap text-[9px] font-semibold leading-none text-yellow-300 sm:text-[10px]">
                          ACC
                        </span>
                        <button
                          type="button"
                          onClick={() => setExtraColumnsVisible((prev) => !prev)}
                          className={`flex h-5 w-5 items-center justify-center rounded-sm shadow-sm transition ${
                            extraColumnsVisible
                              ? isVentaTable
                                ? 'bg-sky-300 text-sky-900'
                                : 'bg-emerald-300 text-emerald-900'
                              : isVentaTable
                                ? 'bg-sky-600 text-white hover:bg-sky-500'
                                : 'bg-emerald-600 text-white hover:bg-emerald-500'
                          }`}
                          title={
                            extraColumnsVisible
                              ? 'Ocultar Ref, Visitas y Capt'
                              : 'Mostrar Ref, Visitas y Capt'
                          }
                        >
                          {extraColumnsVisible ? (
                            <Minus className="h-3 w-3" strokeWidth={2.5} />
                          ) : (
                            <Plus className="h-3 w-3" strokeWidth={2.5} />
                          )}
                        </button>
                      </div>
                    ) : (
                      'Ficha / Acciones'
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className={isDenseTable ? undefined : 'divide-y divide-slate-100'}>
                {paginatedItems.map((inmueble) => {
                  const rowStyle = getInmuebleRowStyle(
                    inmueble.row_color,
                    tipoOperacion,
                  );
                  const hasRowBackground = Boolean(
                    resolveInmuebleRowColor(inmueble.row_color, tipoOperacion),
                  );

                  return (
                  <tr
                    key={inmueble.id}
                    className={hasRowBackground ? '' : 'hover:bg-slate-50'}
                    style={rowStyle}
                  >
                    {displayedTableFields.map((field) => {
                      const value = toInmuebleCellValue(inmueble[field.key]);
                      const display =
                        isDenseTable && field.key === 'larga_estancia_temporada'
                          ? formatLargaEstanciaCompact(value)
                          : formatInmuebleCell(field.key, value);

                      if (field.key === 'ref' && isDenseTable) {
                        return (
                          <td key={field.key} className={inmuebleCellClass(field)}>
                            <InmuebleRefInlineCell
                              inmuebleId={inmueble.id}
                              value={inmueble.ref}
                              disabled={saving || deletingId === inmueble.id}
                              onUpdated={(ref) =>
                                patchInmuebleInCache(inmueble.id, { ref })
                              }
                            />
                          </td>
                        );
                      }

                      if (field.key === 'status' && isDenseTable) {
                        return (
                          <td
                            key={field.key}
                            className={`${inmuebleCellClass(field)} relative`}
                          >
                            <InmuebleStatusRowEditor
                              inmuebleId={inmueble.id}
                              status={inmueble.status}
                              rowColor={inmueble.row_color}
                              tipoOperacion={tipoOperacion}
                              compact
                              fillCell
                              onUpdated={(patch) =>
                                patchInmuebleInCache(inmueble.id, patch)
                              }
                            />
                          </td>
                        );
                      }

                      if (field.key === 'nombre_propi' && isDenseTable) {
                        const propietarios = getInmueblePropietarios(inmueble);

                        return (
                          <td key={field.key} className={inmuebleCellClass(field)}>
                            <span className="block min-w-0 text-center leading-snug">
                              <InmueblePropiCell
                                propietarios={propietarios}
                                tipoOperacion={tipoOperacion}
                                entradaDate={formatInmuebleEntradaDate(
                                  inmueble.fecha_entrada_inmueble,
                                )}
                                centered
                              />
                            </span>
                          </td>
                        );
                      }

                      if (field.key === 'observaciones' && isDenseTable) {
                        return (
                          <td key={field.key} className={inmuebleCellClass(field)}>
                            <InmuebleObservacionesLineCell
                              inmuebleId={inmueble.id}
                              value={inmueble.observaciones}
                              disabled={saving || deletingId === inmueble.id}
                              onUpdated={(observaciones) =>
                                patchInmuebleInCache(inmueble.id, {
                                  observaciones,
                                })
                              }
                            />
                          </td>
                        );
                      }

                      if (field.key === 'fecha_entrada_inmueble' && isDenseTable) {
                        const overlays = buildInmuebleDenseImageOverlays(
                          inmueble,
                          'entrada',
                        );

                        return (
                          <td key={field.key} className={inmuebleCellClass(field)}>
                            <InmuebleDenseImageCell
                              imageUrl={inmueble.imagen_real}
                              topOverlayText={overlays.top}
                              bottomOverlayText={overlays.bottom}
                              alt="Imagen real"
                              hoverRingClass={
                                isVentaTable
                                  ? 'hover:ring-2 hover:ring-inset hover:ring-sky-300/60'
                                  : 'hover:ring-2 hover:ring-inset hover:ring-emerald-300/60'
                              }
                              onPreview={
                                inmueble.imagen_real?.trim() &&
                                isUrl(inmueble.imagen_real.trim())
                                  ? () =>
                                      setPreviewImage({
                                        src: inmueble.imagen_real!.trim(),
                                        alt: 'Imagen real',
                                      })
                                  : undefined
                              }
                            />
                          </td>
                        );
                      }

                      if (field.key === 'foto_espejo' && isDenseTable) {
                        const overlays = buildInmuebleDenseImageOverlays(
                          inmueble,
                          'espejo',
                        );

                        return (
                          <td key={field.key} className={inmuebleCellClass(field)}>
                            <InmuebleDenseImageCell
                              imageUrl={inmueble.foto_espejo}
                              topOverlayText={overlays.top}
                              bottomOverlayText={overlays.bottom}
                              alt="Foto espejo"
                              hoverRingClass={
                                isVentaTable
                                  ? 'hover:ring-2 hover:ring-inset hover:ring-sky-300/60'
                                  : 'hover:ring-2 hover:ring-inset hover:ring-emerald-300/60'
                              }
                              onPreview={
                                inmueble.foto_espejo?.trim() &&
                                isUrl(inmueble.foto_espejo.trim())
                                  ? () =>
                                      setPreviewImage({
                                        src: inmueble.foto_espejo!.trim(),
                                        alt: 'Foto espejo',
                                      })
                                  : undefined
                              }
                            />
                          </td>
                        );
                      }

                      if (
                        (field.key === 'imagen_real' || field.key === 'foto_espejo') &&
                        !isDenseTable &&
                        typeof value === 'string' &&
                        isUrl(value)
                      ) {
                        return (
                          <td key={field.key} className={inmuebleCellClass(field)}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage({ src: value, alt: field.label });
                              }}
                              className={`cursor-zoom-in rounded ring-1 ring-slate-200 transition ${
                                isVentaTable
                                  ? 'hover:ring-sky-400'
                                  : 'hover:ring-emerald-400'
                              }`}
                              title="Ver imagen"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={value}
                                alt={field.label}
                                className={
                                  isDenseTable
                                    ? 'h-20 w-28 rounded object-cover'
                                    : 'h-28 w-40 rounded-md object-cover sm:h-32 sm:w-44'
                                }
                              />
                            </button>
                          </td>
                        );
                      }

                      if (
                        field.key === 'tipo_operacion' &&
                        typeof value === 'string' &&
                        TIPO_OPERACION_STYLES[value]
                      ) {
                        return (
                          <td key={field.key} className={inmuebleCellClass(field)}>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIPO_OPERACION_STYLES[value]}`}
                            >
                              {TIPO_OPERACION_LABELS[value as keyof typeof TIPO_OPERACION_LABELS]}
                            </span>
                          </td>
                        );
                      }

                      if (
                        field.key === 'status' &&
                        typeof value === 'string' &&
                        STATUS_STYLES[value]
                      ) {
                        return (
                          <td key={field.key} className={inmuebleCellClass(field)}>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[value]}`}
                            >
                              {value}
                            </span>
                          </td>
                        );
                      }

                      if (
                        (field.key === 'ficha_del_piso_real' ||
                          field.key === 'link_idealista_espejo' ||
                          field.key === 'fecha_visitas_entrada') &&
                        typeof value === 'string' &&
                        value.trim()
                      ) {
                        return (
                          <td key={field.key} className={inmuebleCellClass(field)}>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await navigator.clipboard.writeText(value);
                                  toast.success('Enlace copiado');
                                } catch {
                                  toast.error('No se pudo copiar el enlace');
                                }
                              }}
                              className={`w-full break-words whitespace-normal text-center font-bold hover:underline ${
                                isVentaTable
                                  ? 'text-sky-700'
                                  : 'text-emerald-600'
                              }`}
                              title={`Copiar: ${value}`}
                            >
                              {isDenseTable
                                ? field.key === 'fecha_visitas_entrada'
                                  ? isVentaTable
                                    ? 'Video'
                                    : 'Visitas'
                                  : 'Link'
                                : value}
                            </button>
                          </td>
                        );
                      }

                      return (
                        <td key={field.key} className={inmuebleCellClass(field)}>
                          <span className="block break-words whitespace-normal text-center leading-snug">
                            {display}
                          </span>
                        </td>
                      );
                    })}
                    <td
                      className={`${
                        isDenseTable ? '' : 'sticky right-0 z-10 '
                      } ${INMUEBLE_DENSE_ACTIONS_COL_CLASS} shrink-0 text-center align-middle font-bold ${
                        isDenseTable ? `px-0.5 py-1 ${EXCEL_CELL_BORDER}` : 'px-3 py-2'
                      } ${hasRowBackground ? '' : 'bg-white'}`}
                      style={rowStyle}
                    >
                      <div className="flex flex-col items-stretch gap-0.5">
                        {isDenseTable ? (
                          <Link
                            href={`${basePath}/${inmueble.id}`}
                            className="inline-flex w-full items-center justify-center rounded bg-slate-500 px-0.5 py-1 text-center text-[8px] font-bold leading-tight text-yellow-300 transition hover:bg-slate-600 sm:text-[9px]"
                          >
                            Ver clientes
                          </Link>
                        ) : (
                          <Link
                            href={`${basePath}/${inmueble.id}`}
                            className={`rounded p-0.5 text-slate-500 transition hover:bg-slate-100 ${
                              isVentaTable
                                ? 'hover:text-sky-600'
                                : 'hover:text-emerald-600'
                            }`}
                            title="Ver clientes"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        <div className="flex items-center justify-center gap-0.5">
                          <Link
                            href={`${basePath}/${inmueble.id}/edit`}
                            className={`rounded p-0.5 text-slate-500 transition hover:bg-slate-100 ${
                              isVentaTable
                                ? 'hover:text-sky-600'
                                : 'hover:text-emerald-600'
                            }`}
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(inmueble.id)}
                            disabled={deletingId === inmueble.id}
                            className="rounded p-0.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
          {effectiveFilteredInmuebles.length > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
          )}
        </div>
      )}

      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-slate-900/50"
            onClick={closeModal}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Nuevo inmueble
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <InmuebleForm
              onSubmit={handleSubmit}
              onCancel={closeModal}
              submitLabel="Crear inmueble"
              loading={saving}
              fixedTipoOperacion={tipoOperacion}
            />
          </div>
        </div>
      )}
    </div>
  );
}

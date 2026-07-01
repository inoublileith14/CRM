'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { PropietarioForm } from '@/components/PropietarioForm';
import { CoconutBrandedDialog } from '@/components/CoconutBrandedDialog';
import { TableColumnFilterHead } from '@/components/TableColumnFilterHead';
import { TableFilterBar } from '@/components/TableFilterBar';
import { TableFilterEmptyState } from '@/components/TableFilterEmptyState';
import { TablePagination } from '@/components/TablePagination';
import {
  useResetPageOnFilterChange,
  useTableColumnFilters,
} from '@/hooks/useTableColumnFilters';
import { usePagination } from '@/hooks/usePagination';
import { PROPIETARIO_TABLE_COLUMNS } from '@/lib/table-columns';
import {
  useInvalidateDashboardQueries,
  usePropietariosQuery,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import {
  createPropietario,
  deletePropietario,
} from '@/lib/propietarios-api';
import { PropietarioFormData } from '@/types/propietario';
import { TIPO_OPERACION_LABELS, TipoOperacion } from '@/types/inmueble';

const PAGE_THEMES = {
  alquiler: {
    header: 'bg-emerald-800',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800',
    emptyLink: 'text-emerald-600 hover:text-emerald-500',
  },
  venta: {
    header: 'bg-blue-800',
    button: 'bg-blue-700 hover:bg-blue-600',
    badge: 'bg-blue-100 text-blue-800',
    emptyLink: 'text-blue-700 hover:text-blue-600',
  },
} as const;

interface PropietariosPageContentProps {
  expectedTipo: TipoOperacion;
}

export function PropietariosPageContent({
  expectedTipo,
}: PropietariosPageContentProps) {
  const pathname = usePathname();
  const { invalidatePropietarios } = useInvalidateDashboardQueries();
  const propietariosQuery = usePropietariosQuery();
  const {
    data: propietarios = [],
    showInitialLoading,
    isRefreshing,
  } = useQueryUiState(propietariosQuery);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const theme = PAGE_THEMES[expectedTipo];

  const propietariosByTipo = useMemo(
    () => propietarios.filter((p) => p.tipo_operacion === expectedTipo),
    [propietarios, expectedTipo],
  );

  const tableColumns = useMemo(() => PROPIETARIO_TABLE_COLUMNS, []);

  const {
    columnFilters,
    tableSort,
    openFilterColumn,
    setOpenFilterColumn,
    columnUniqueValues,
    filteredRows: filteredPropietarios,
    filtersActive,
    clearFilters,
    setColumnFilter,
    setSort,
    isFilterActiveForColumn,
  } = useTableColumnFilters(propietariosByTipo, tableColumns, {
    pathname,
    storageScope: expectedTipo,
  });

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems,
  } = usePagination(filteredPropietarios, undefined, {
    pathname,
    storageScope: expectedTipo,
  });

  useResetPageOnFilterChange([columnFilters, tableSort], setPage);

  function closeModal() {
    if (!saving) {
      setModalOpen(false);
    }
  }

  async function handleSubmit(data: PropietarioFormData) {
    setSaving(true);
    try {
      await createPropietario({
        ...data,
        tipo_operacion: expectedTipo,
      });
      toast.success('Propietario creado');
      setModalOpen(false);
      await invalidatePropietarios();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar propietario',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        '¿Eliminar este propietario? Los inmuebles asociados quedarán sin propietario.',
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await deletePropietario(id);
      toast.success('Propietario eliminado');
      await invalidatePropietarios();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar propietario',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Propietarios — {TIPO_OPERACION_LABELS[expectedTipo]}
            </h1>
            {isRefreshing ? <QueryRefreshingBadge /> : null}
          </div>
          <p className="mt-1 text-slate-500">
            Gestión de propietarios de {TIPO_OPERACION_LABELS[expectedTipo].toLowerCase()}.
            Cada propietario puede tener varios inmuebles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition sm:w-auto ${theme.button}`}
        >
          <Plus className="h-4 w-4" />
          Añadir propietario
        </button>
      </header>

      {showInitialLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando propietarios…
        </div>
      ) : propietariosByTipo.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">
            No hay propietarios de {TIPO_OPERACION_LABELS[expectedTipo].toLowerCase()}
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={`mt-4 text-sm font-medium ${theme.emptyLink}`}
          >
            Añadir el primero
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {filtersActive && (
            <TableFilterBar
              filteredCount={filteredPropietarios.length}
              totalCount={propietariosByTipo.length}
              entityLabel="propietarios"
              hasSort={!!tableSort}
              onClear={clearFilters}
            />
          )}
          {filteredPropietarios.length === 0 ? (
            <TableFilterEmptyState onClear={clearFilters} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className={`${theme.header} text-white`}>
                    {PROPIETARIO_TABLE_COLUMNS.map((col) => (
                      <TableColumnFilterHead
                        key={col.key}
                        label={col.label}
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
                        className="px-4"
                      />
                    ))}
                    <th className="px-4 py-4 text-xs font-semibold uppercase">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map((propietario) => (
                    <tr key={propietario.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {propietario.nombre}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${theme.badge}`}
                        >
                          {propietario.tipo_operacion
                            ? TIPO_OPERACION_LABELS[propietario.tipo_operacion]
                            : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {propietario.telf || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {propietario.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {propietario.inmuebles_count ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/dashboard/propietarios/${propietario.id}`}
                            className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                            title="Ver inmuebles"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/dashboard/propietarios/${propietario.id}/edit`}
                            className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(propietario.id)}
                            disabled={deletingId === propietario.id}
                            className="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filteredPropietarios.length > 0 && (
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

      {modalOpen && (
        <CoconutBrandedDialog
          open={modalOpen}
          onClose={closeModal}
          blockClose={saving}
          title={`Nuevo propietario — ${TIPO_OPERACION_LABELS[expectedTipo]}`}
          subtitle="PROPIETARIOS"
          size="lg"
          align="left"
          scrollable
        >
          <PropietarioForm
            onSubmit={handleSubmit}
            onCancel={closeModal}
            submitLabel="Crear propietario"
            loading={saving}
            fixedTipoOperacion={expectedTipo}
          />
        </CoconutBrandedDialog>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { TableColumnFilterHead } from '@/components/TableColumnFilterHead';
import { TableFilterBar } from '@/components/TableFilterBar';
import { TableFilterEmptyState } from '@/components/TableFilterEmptyState';
import { WorkerForm } from '@/components/WorkerForm';
import { WorkerListToolbar } from '@/components/WorkerListToolbar';
import { TablePagination } from '@/components/TablePagination';
import {
  useResetPageOnFilterChange,
  useTableColumnFilters,
} from '@/hooks/useTableColumnFilters';
import { usePagination } from '@/hooks/usePagination';
import { usePersistedState } from '@/hooks/usePersistedState';
import { buildTableStateKey } from '@/lib/persisted-table-state';
import { WORKER_TABLE_COLUMNS } from '@/lib/table-columns';
import {
  useInvalidateDashboardQueries,
  useWorkersQuery,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import {
  createWorker,
  deleteWorker,
} from '@/lib/workers-api';
import {
  filterWorkers,
  WorkerListFilter,
} from '@/lib/worker-search';
import {
  Worker,
  WorkerFormData,
  getWorkerRolLabel,
  normalizeWorkerRol,
  WorkerRol,
  workerAccountStatus,
} from '@/types/worker';

const ROL_STYLES: Record<WorkerRol, string> = {
  admin: 'bg-slate-200 text-slate-700',
  asesor: 'bg-violet-100 text-violet-800',
};

export default function WorkersPage() {
  const pathname = usePathname();
  const toolbarKey = `${buildTableStateKey(pathname)}:toolbar`;
  const { invalidateWorkers } = useInvalidateDashboardQueries();
  const workersQuery = useWorkersQuery(false);
  const {
    data: workers = [],
    showInitialLoading,
    isRefreshing,
  } = useQueryUiState(workersQuery);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toolbar, setToolbar] = usePersistedState(toolbarKey, {
    search: '',
    listFilter: 'all' as WorkerListFilter,
  });
  const search = toolbar.search;
  const listFilter = toolbar.listFilter;
  const setSearch = (value: string) =>
    setToolbar((prev) => ({ ...prev, search: value }));
  const setListFilter = (value: WorkerListFilter) =>
    setToolbar((prev) => ({ ...prev, listFilter: value }));

  const searchedWorkers = useMemo(
    () => filterWorkers(workers, search, listFilter),
    [workers, search, listFilter],
  );

  const {
    columnFilters,
    tableSort,
    openFilterColumn,
    setOpenFilterColumn,
    columnUniqueValues,
    filteredRows: filteredWorkers,
    filtersActive,
    clearFilters,
    setColumnFilter,
    setSort,
    isFilterActiveForColumn,
  } = useTableColumnFilters(searchedWorkers, WORKER_TABLE_COLUMNS, {
    pathname,
  });

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems,
  } = usePagination(filteredWorkers, undefined, { pathname });

  const skipToolbarPageResetRef = useRef(true);
  useEffect(() => {
    if (skipToolbarPageResetRef.current) {
      skipToolbarPageResetRef.current = false;
      return;
    }
    setPage(1);
  }, [search, listFilter, setPage]);

  useResetPageOnFilterChange([columnFilters, tableSort], setPage);

  function closeModal() {
    if (!saving) {
      setModalOpen(false);
    }
  }

  async function handleSubmit(data: WorkerFormData) {
    setSaving(true);
    try {
      const created = await createWorker(data);
      if (created.invitation_sent_at) {
        toast.success(
          'Trabajador creado. Se ha enviado la invitación por correo.',
        );
      } else if (created.profile_id) {
        toast.success(
          'Trabajador creado con cuenta de usuario. Si no llega el correo, usa «Reenviar invitación».',
        );
      } else {
        toast.success('Trabajador creado');
      }
      setModalOpen(false);
      await invalidateWorkers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar trabajador',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        '¿Eliminar este trabajador? Se desvinculará de los clientes asociados.',
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteWorker(id);
      toast.success('Trabajador eliminado');
      await invalidateWorkers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar trabajador',
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
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Trabajadores</h1>
            {isRefreshing ? <QueryRefreshingBadge /> : null}
          </div>
          <p className="mt-1 text-slate-500">
            Usuarios del sistema (admin o asesor). Cada trabajador tiene cuenta y se asigna a clientes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Añadir trabajador
        </button>
      </header>

      {showInitialLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando trabajadores…
        </div>
      ) : workers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">No hay trabajadores registrados</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-500"
          >
            Añadir el primero
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <WorkerListToolbar
            search={search}
            onSearchChange={setSearch}
            filter={listFilter}
            onFilterChange={setListFilter}
            resultCount={filteredWorkers.length}
            totalCount={workers.length}
          />
          {searchedWorkers.length === 0 ? (
            <p className="p-10 text-center text-slate-500">
              Ningún trabajador coincide con la búsqueda.
            </p>
          ) : filteredWorkers.length === 0 ? (
            <TableFilterEmptyState onClear={clearFilters} />
          ) : (
          <>
          {filtersActive && (
            <TableFilterBar
              filteredCount={filteredWorkers.length}
              totalCount={searchedWorkers.length}
              entityLabel="trabajadores"
              hasSort={!!tableSort}
              onClear={clearFilters}
            />
          )}
          <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead>
              <tr className="bg-emerald-800 text-white">
                {WORKER_TABLE_COLUMNS.map((col) => (
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
              {paginatedItems.map((worker) => (
                <tr key={worker.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {worker.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {worker.telf || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {worker.email || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROL_STYLES[normalizeWorkerRol(worker.rol)]}`}
                    >
                      {getWorkerRolLabel(worker.rol)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        worker.activo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {worker.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const account = workerAccountStatus(worker);
                      const styles = {
                        linked: 'bg-emerald-100 text-emerald-800',
                        pending: 'bg-amber-100 text-amber-800',
                        none: 'bg-slate-100 text-slate-600',
                      };
                      return (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[account.tone]}`}
                        >
                          {account.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {worker.clientes_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/dashboard/workers/${worker.id}`}
                        className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                        title="Ver clientes"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/dashboard/workers/${worker.id}/edit`}
                        className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(worker.id)}
                        disabled={deletingId === worker.id}
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
          </>
          )}
          {filteredWorkers.length > 0 && (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-slate-900/50"
            onClick={closeModal}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Nuevo trabajador
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

            <WorkerForm
              onSubmit={handleSubmit}
              onCancel={closeModal}
              submitLabel="Crear trabajador"
              loading={saving}
              wide
            />
          </div>
        </div>
      )}
    </div>
  );
}

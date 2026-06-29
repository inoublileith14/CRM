'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { TableColumnFilterHead } from '@/components/TableColumnFilterHead';
import { TableFilterBar } from '@/components/TableFilterBar';
import { TableFilterEmptyState } from '@/components/TableFilterEmptyState';
import { WorkerForm } from '@/components/WorkerForm';
import { UserListToolbar } from '@/components/users/UserListToolbar';
import { TablePagination } from '@/components/TablePagination';
import { UserAvatar } from '@/components/UserAvatar';
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
import { createWorker, deleteWorker } from '@/lib/workers-api';
import {
  filterUsers,
  filterUsersByRole,
  UserListFilter,
} from '@/lib/user-search';
import {
  getUserEditHref,
  getUserStatsHref,
  USER_LIST_META,
} from '@/lib/user-routes';
import {
  Worker,
  WorkerFormData,
  workerAccountStatus,
  WorkerRol,
} from '@/types/worker';

const ACCOUNT_STYLES = {
  linked: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  pending: 'bg-amber-50 text-amber-800 ring-amber-600/10',
  none: 'bg-slate-100 text-slate-600 ring-slate-500/10',
} as const;

const LIST_COLUMNS = WORKER_TABLE_COLUMNS.filter((col) => col.key !== 'rol');

type UsersPageContentProps = {
  rol: WorkerRol;
};

export function UsersPageContent({ rol }: UsersPageContentProps) {
  const meta = USER_LIST_META[rol];
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
    listFilter: 'all' as UserListFilter,
  });
  const search = toolbar.search;
  const listFilter = toolbar.listFilter;
  const setSearch = (value: string) =>
    setToolbar((prev) => ({ ...prev, search: value }));
  const setListFilter = (value: UserListFilter) =>
    setToolbar((prev) => ({ ...prev, listFilter: value }));

  const roleWorkers = useMemo(
    () => filterUsersByRole(workers, rol),
    [workers, rol],
  );

  const searchedWorkers = useMemo(
    () => filterUsers(roleWorkers, search, listFilter),
    [roleWorkers, search, listFilter],
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
  } = useTableColumnFilters(searchedWorkers, LIST_COLUMNS, {
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
      const created = await createWorker({ ...data, rol });
      if (created.invitation_sent_at) {
        toast.success(
          'Usuario creado. Se ha enviado la invitación por correo.',
        );
      } else if (created.profile_id) {
        toast.success(
          'Usuario creado con cuenta. Si no llega el correo, usa «Reenviar invitación».',
        );
      } else {
        toast.success('Usuario creado');
      }
      setModalOpen(false);
      await invalidateWorkers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar usuario',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        '¿Eliminar este usuario? Se desvinculará de los clientes asociados.',
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteWorker(id);
      toast.success('Usuario eliminado');
      await invalidateWorkers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar usuario',
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
              {meta.title}
            </h1>
            {isRefreshing ? <QueryRefreshingBadge /> : null}
          </div>
          <p className="mt-1 text-slate-500">{meta.description}</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {meta.addLabel}
        </button>
      </header>

      {showInitialLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando usuarios…
        </div>
      ) : roleWorkers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">No hay {meta.entityLabel} registrados</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-500"
          >
            Añadir el primero
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <UserListToolbar
            search={search}
            onSearchChange={setSearch}
            filter={listFilter}
            onFilterChange={setListFilter}
            resultCount={filteredWorkers.length}
            totalCount={roleWorkers.length}
            entityLabel={meta.entityLabel}
          />
          {searchedWorkers.length === 0 ? (
            <p className="p-10 text-center text-slate-500">
              Ningún usuario coincide con la búsqueda.
            </p>
          ) : filteredWorkers.length === 0 ? (
            <TableFilterEmptyState onClear={clearFilters} />
          ) : (
            <>
              {filtersActive && (
                <TableFilterBar
                  filteredCount={filteredWorkers.length}
                  totalCount={searchedWorkers.length}
                  entityLabel={meta.entityLabel}
                  hasSort={!!tableSort}
                  onClear={clearFilters}
                />
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90">
                      {LIST_COLUMNS.map((col) => (
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
                          variant="slate"
                          className="px-4"
                        />
                      ))}
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedItems.map((worker) => {
                      const account = workerAccountStatus(worker);
                      return (
                        <tr
                          key={worker.id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <UserAvatar name={worker.nombre} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">
                                  {worker.nombre}
                                </p>
                                {worker.notas ? (
                                  <p className="truncate text-xs text-slate-400">
                                    {worker.notas}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {worker.telf || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {worker.email || '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                worker.activo
                                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
                                  : 'bg-slate-100 text-slate-600 ring-slate-500/10'
                              }`}
                            >
                              {worker.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${ACCOUNT_STYLES[account.tone]}`}
                            >
                              {account.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                              {worker.clientes_count ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              <Link
                                href={getUserStatsHref(worker.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                title="Ver estadísticas"
                              >
                                <BarChart3 className="h-3.5 w-3.5" />
                                Ver
                              </Link>
                              <Link
                                href={getUserEditHref(worker.id)}
                                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDelete(worker.id)}
                                disabled={deletingId === worker.id}
                                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                {meta.addLabel}
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
              initial={{ ...emptyWorkerFormForRol(rol) }}
              onSubmit={handleSubmit}
              onCancel={closeModal}
              submitLabel={`Crear ${rol === 'admin' ? 'admin' : 'asesor'}`}
              loading={saving}
              wide
              lockRol={rol}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function emptyWorkerFormForRol(rol: WorkerRol): WorkerFormData {
  return {
    nombre: '',
    telf: null,
    email: null,
    rol,
    activo: true,
    notas: null,
  };
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ArrowLeft, BarChart3, Mail, Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';
import { resendWorkerInvitation } from '@/lib/workers-api';
import { StatusBadge } from '@/components/StatusBadge';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import { TableColumnFilterHead } from '@/components/TableColumnFilterHead';
import { TableFilterBar } from '@/components/TableFilterBar';
import { TableFilterEmptyState } from '@/components/TableFilterEmptyState';
import { useWorkerQuery } from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { useTableColumnFilters } from '@/hooks/useTableColumnFilters';
import { usePersistedState } from '@/hooks/usePersistedState';
import { buildTableStateKey } from '@/lib/persisted-table-state';
import { WORKER_CLIENTE_TABLE_COLUMNS } from '@/lib/table-columns';
import {
  getUserEditHref,
  getUserStatsHref,
} from '@/lib/user-routes';
import { getWorkerRolLabel, workerAccountStatus } from '@/types/worker';

export default function UserClientesPage() {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const workerQuery = useWorkerQuery(id);
  const {
    data: worker,
    showInitialLoading,
    isRefreshing,
    showError,
  } = useQueryUiState(workerQuery);
  const [resending, setResending] = useState(false);
  const [clientSearch, setClientSearch] = usePersistedState(
    `${buildTableStateKey(pathname)}:client-search`,
    '',
  );

  const clientes = useMemo(() => worker?.clientes ?? [], [worker?.clientes]);
  const clientQuery = clientSearch.trim().toLowerCase();

  const searchedClientes = useMemo(() => {
    if (!clientQuery) return clientes;
    return clientes.filter((cliente) => {
      const haystack = [
        cliente.nombre,
        cliente.email,
        cliente.telefono,
        cliente.estado,
        cliente.ref_cliente,
        cliente.mensaje,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return clientQuery
        .split(/\s+/)
        .filter(Boolean)
        .every((token) => haystack.includes(token));
    });
  }, [clientes, clientQuery]);

  const tableColumns = useMemo(() => WORKER_CLIENTE_TABLE_COLUMNS, []);

  const {
    columnFilters,
    tableSort,
    openFilterColumn,
    setOpenFilterColumn,
    columnUniqueValues,
    filteredRows: filteredClientes,
    filtersActive,
    clearFilters,
    setColumnFilter,
    setSort,
    isFilterActiveForColumn,
  } = useTableColumnFilters(searchedClientes, tableColumns, { pathname });

  if (showInitialLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        Cargando clientes…
      </div>
    );
  }

  if (showError || !worker) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-800">No se pudo cargar el usuario</p>
        <button
          type="button"
          onClick={() => workerQuery.refetch()}
          className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const account = workerAccountStatus(worker);

  async function handleResendInvitation() {
    setResending(true);
    try {
      const { mensaje } = await resendWorkerInvitation(id);
      toast.success(mensaje);
      await workerQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo reenviar la invitación',
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <Link
          href={getUserStatsHref(worker.id)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a estadísticas
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Clientes · {worker.nombre}
              </h1>
              {isRefreshing ? <QueryRefreshingBadge /> : null}
            </div>
            <p className="mt-1 break-words text-slate-500">
              {getWorkerRolLabel(worker.rol)}
              {worker.telf ? ` · ${worker.telf}` : ''}
              {worker.email ? ` · ${worker.email}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  worker.activo
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {worker.activo ? 'Activo' : 'Inactivo'}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  account.tone === 'linked'
                    ? 'bg-emerald-100 text-emerald-800'
                    : account.tone === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {account.label}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={getUserStatsHref(worker.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <BarChart3 className="h-4 w-4" />
              Estadísticas
            </Link>
            {worker.profile_id && worker.email ? (
              <button
                type="button"
                onClick={handleResendInvitation}
                disabled={resending}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                {resending ? 'Enviando…' : 'Reenviar invitación'}
              </button>
            ) : null}
            <Link
              href={getUserEditHref(worker.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </div>
        </div>
      </div>

      <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="font-semibold text-slate-900">
            Clientes asignados ({clientes.length})
          </h2>
          {clientes.length > 0 && (
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar cliente…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}
        </div>

        {clientes.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            Este usuario no tiene clientes asignados. Asigna usuarios desde la
            ficha de cada cliente.
          </p>
        ) : searchedClientes.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            Ningún cliente coincide con la búsqueda.
          </p>
        ) : filteredClientes.length === 0 ? (
          <TableFilterEmptyState onClear={clearFilters} />
        ) : (
          <>
            {filtersActive && (
              <TableFilterBar
                filteredCount={filteredClientes.length}
                totalCount={searchedClientes.length}
                entityLabel="clientes"
                hasSort={!!tableSort}
                onClear={clearFilters}
              />
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/90">
                  <tr>
                    {WORKER_CLIENTE_TABLE_COLUMNS.map((col) => (
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
                  {filteredClientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        {cliente.nombre}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {cliente.email || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {cliente.telefono || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge estado={cliente.estado} />
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/clientes/${cliente.id}`}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                        >
                          Ver cliente
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

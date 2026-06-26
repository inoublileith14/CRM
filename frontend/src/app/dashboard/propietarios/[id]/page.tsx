'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import { TableColumnFilterHead } from '@/components/TableColumnFilterHead';
import { TableFilterBar } from '@/components/TableFilterBar';
import { TableFilterEmptyState } from '@/components/TableFilterEmptyState';
import { usePropietarioQuery } from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { useTableColumnFilters } from '@/hooks/useTableColumnFilters';
import { PROPIETARIO_INMUEBLE_TABLE_COLUMNS } from '@/lib/table-columns';
import { getPropietariosListPath } from '@/lib/propietarios-paths';
import { TIPO_OPERACION_LABELS } from '@/types/inmueble';

export default function PropietarioDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const propietarioQuery = usePropietarioQuery(id);
  const {
    data: propietario,
    showInitialLoading,
    isRefreshing,
    showError,
  } = useQueryUiState(propietarioQuery);

  const inmuebles = propietario?.inmuebles ?? [];
  const tableColumns = useMemo(() => PROPIETARIO_INMUEBLE_TABLE_COLUMNS, []);

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
    isFilterActiveForColumn,
  } = useTableColumnFilters(inmuebles, tableColumns, { pathname });

  if (showInitialLoading) {
    return (
      <div>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando propietario…
        </div>
      </div>
    );
  }

  if (showError || !propietario) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-800">No se pudo cargar el propietario</p>
        <button
          type="button"
          onClick={() => propietarioQuery.refetch()}
          className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <Link
          href={getPropietariosListPath(propietario.tipo_operacion)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a propietarios
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {propietario.nombre}
              </h1>
              {propietario.tipo_operacion ? (
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    propietario.tipo_operacion === 'venta'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {TIPO_OPERACION_LABELS[propietario.tipo_operacion]}
                </span>
              ) : null}
              {isRefreshing ? <QueryRefreshingBadge /> : null}
            </div>
            <p className="mt-1 break-words text-slate-500">
              {propietario.telf || 'Sin teléfono'}
              {propietario.email ? ` · ${propietario.email}` : ''}
            </p>
            {propietario.notas && (
              <p className="mt-2 text-sm text-slate-600">{propietario.notas}</p>
            )}
          </div>
          <Link
            href={`/dashboard/propietarios/${propietario.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Editar propietario
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            Inmuebles ({inmuebles.length})
          </h2>
        </div>

        {inmuebles.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            Este propietario no tiene inmuebles asignados.
          </p>
        ) : filteredInmuebles.length === 0 ? (
          <TableFilterEmptyState onClear={clearFilters} />
        ) : (
          <>
          {filtersActive && (
            <TableFilterBar
              filteredCount={filteredInmuebles.length}
              totalCount={inmuebles.length}
              entityLabel="inmuebles"
              hasSort={!!tableSort}
              onClear={clearFilters}
            />
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {PROPIETARIO_INMUEBLE_TABLE_COLUMNS.map((col) => (
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
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInmuebles.map((inmueble) => {
                  const editPath =
                    inmueble.tipo_operacion === 'venta'
                      ? `/dashboard/casas-venta/${inmueble.id}/edit`
                      : `/dashboard/casas-alquiler/${inmueble.id}/edit`;

                  return (
                    <tr key={inmueble.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">
                        {inmueble.direccion_piso_real || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {inmueble.barrio_distrito || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {inmueble.tipo_operacion
                          ? TIPO_OPERACION_LABELS[inmueble.tipo_operacion]
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {inmueble.precio != null
                          ? new Intl.NumberFormat('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(inmueble.precio)
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={editPath}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                        >
                          Editar inmueble
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
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ClienteExcelImportButton } from '@/components/ClienteExcelImportButton';
import { ClienteForm } from '@/components/ClienteForm';
import { StatusBadge } from '@/components/StatusBadge';
import { TableColumnFilterHead } from '@/components/TableColumnFilterHead';
import { TableFilterBar } from '@/components/TableFilterBar';
import { TableFilterEmptyState } from '@/components/TableFilterEmptyState';
import { TablePagination } from '@/components/TablePagination';
import {
  useResetPageOnFilterChange,
  useTableColumnFilters,
} from '@/hooks/useTableColumnFilters';
import { usePagination } from '@/hooks/usePagination';
import { buildClienteTableColumns } from '@/lib/table-columns';
import {
  useClientesQuery,
  useInvalidateDashboardQueries,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import {
  createCliente,
  deleteCliente,
} from '@/lib/clientes-api';
import {
  CLIENTE_ORIGEN_LABELS,
  CLIENTE_TABLE_FIELDS,
  Cliente,
  ClienteFormData,
} from '@/types/cliente';
import { TIPO_OPERACION_LABELS, TipoOperacion } from '@/types/inmueble';

function formatCell(cliente: Cliente, key: string): string {
  if (key === 'inmuebles_count') {
    return String(cliente.inmuebles_count ?? 0);
  }
  if (key === 'workers_count') {
    return String(cliente.workers_count ?? 0);
  }
  const value = cliente[key as keyof Cliente];
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'origen' && typeof value === 'string') {
    return CLIENTE_ORIGEN_LABELS[value as keyof typeof CLIENTE_ORIGEN_LABELS] ?? value;
  }
  if (key === 'tipo_operacion' && typeof value === 'string') {
    return TIPO_OPERACION_LABELS[value as TipoOperacion] ?? value;
  }
  if (key === 'fecha_contacto' && typeof value === 'string') {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
    }).format(new Date(value));
  }
  if (key === 'mensaje' && typeof value === 'string') {
    return value.length > 60 ? `${value.slice(0, 60)}…` : value;
  }
  return String(value);
}

export default function ClientesPage() {
  const { invalidateClientes } = useInvalidateDashboardQueries();
  const clientesQuery = useClientesQuery();
  const {
    data: clientes = [],
    showInitialLoading,
    isRefreshing,
  } = useQueryUiState(clientesQuery);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const tableColumns = useMemo(
    () => buildClienteTableColumns(CLIENTE_TABLE_FIELDS),
    [],
  );

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
  } = useTableColumnFilters(clientes, tableColumns);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems,
  } = usePagination(filteredClientes);

  useResetPageOnFilterChange([columnFilters, tableSort], setPage);

  function closeModal() {
    if (!saving) {
      setModalOpen(false);
    }
  }

  async function handleSubmit(data: ClienteFormData) {
    setSaving(true);
    try {
      await createCliente(data);
      toast.success('Cliente creado');
      setModalOpen(false);
      await invalidateClientes();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar cliente',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteCliente(id);
      toast.success('Cliente eliminado');
      await invalidateClientes();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar cliente',
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
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Clientes</h1>
            {isRefreshing ? <QueryRefreshingBadge /> : null}
          </div>
          <p className="mt-1 text-slate-500">
            Campos de estadísticas por anuncio (Idealista). Cada cliente puede tener varios inmuebles y trabajadores.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <ClienteExcelImportButton
            onComplete={invalidateClientes}
            disabled={showInitialLoading}
            requireTipoSelection
          />
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Añadir cliente
          </button>
        </div>
      </header>

      {showInitialLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando clientes…
        </div>
      ) : clientes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">No hay clientes registrados</p>
          <p className="mt-2 text-sm text-slate-500">
            Importa tu Excel de estadísticas por anuncio o añade uno manualmente.
          </p>
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
          {filtersActive && (
            <TableFilterBar
              filteredCount={filteredClientes.length}
              totalCount={clientes.length}
              entityLabel="clientes"
              hasSort={!!tableSort}
              onClear={clearFilters}
            />
          )}
          {filteredClientes.length === 0 ? (
            <TableFilterEmptyState onClear={clearFilters} />
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-max w-full text-left text-sm">
              <thead>
                <tr className="bg-emerald-800 text-white">
                  {CLIENTE_TABLE_FIELDS.map((field) => (
                    <TableColumnFilterHead
                      key={field.key}
                      label={field.label}
                      fieldType={
                        field.key === 'inmuebles_count' ||
                        field.key === 'workers_count'
                          ? 'number'
                          : field.key === 'fecha_contacto'
                            ? 'date'
                            : 'text'
                      }
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
                  ))}
                  <th className="sticky right-0 bg-emerald-800 px-3 py-3 text-xs font-semibold uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50">
                    {CLIENTE_TABLE_FIELDS.map((field) => {
                      if (field.key === 'estado') {
                        return (
                          <td key={field.key} className="px-3 py-2">
                            <StatusBadge estado={cliente.estado} />
                          </td>
                        );
                      }

                      const display = formatCell(cliente, field.key);
                      const fullValue =
                        field.key === 'mensaje'
                          ? cliente.mensaje ?? undefined
                          : undefined;

                      return (
                        <td
                          key={field.key}
                          className="max-w-[200px] truncate px-3 py-2 text-slate-700"
                          title={fullValue ?? display}
                        >
                          {display}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 bg-white px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/clientes/${cliente.id}`}
                          className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/clientes/${cliente.id}/edit`}
                          className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(cliente.id)}
                          disabled={deletingId === cliente.id}
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
          {filteredClientes.length > 0 && (
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
          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Nuevo cliente
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

            <ClienteForm
              onSubmit={handleSubmit}
              onCancel={closeModal}
              submitLabel="Crear cliente"
              loading={saving}
            />
          </div>
        </div>
      )}
    </div>
  );
}

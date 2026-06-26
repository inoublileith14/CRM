'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import { useClienteQuery } from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { isAdminUser } from '@/lib/auth-roles';
import { CLIENTE_ORIGEN_LABELS } from '@/types/cliente';
import { TIPO_OPERACION_LABELS } from '@/types/inmueble';
import { getWorkerRolLabel } from '@/types/worker';

function formatFecha(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export default function ClienteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const clienteQuery = useClienteQuery(id);
  const { user } = useCurrentUser();
  const canManageWorkers = isAdminUser(user?.rol);
  const {
    data: cliente,
    showInitialLoading,
    isRefreshing,
    showError,
  } = useQueryUiState(clienteQuery);

  const inmuebles = useMemo(() => cliente?.inmuebles ?? [], [cliente?.inmuebles]);

  if (showInitialLoading) {
    return (
      <div>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando cliente…
        </div>
      </div>
    );
  }

  if (showError || !cliente) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-800">No se pudo cargar el cliente</p>
        <button
          type="button"
          onClick={() => clienteQuery.refetch()}
          className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const fields = [
    { label: 'Usuario', value: cliente.nombre },
    { label: 'Email', value: cliente.email || '—' },
    { label: 'Teléfono', value: cliente.telefono || '—' },
    { label: 'Ciudad', value: cliente.ciudad || '—' },
    { label: 'Origen', value: cliente.origen ? CLIENTE_ORIGEN_LABELS[cliente.origen] : '—' },
    { label: 'Estado contacto', value: cliente.estado_contacto || '—' },
    { label: 'Descripción', value: cliente.descripcion || '—' },
    { label: 'Ref. cliente', value: cliente.ref_cliente || '—' },
    { label: 'Fecha contacto', value: formatFecha(cliente.fecha_contacto) },
    {
      label: 'Tipo',
      value: cliente.tipo_operacion
        ? TIPO_OPERACION_LABELS[cliente.tipo_operacion]
        : '—',
    },
    { label: 'Mensaje', value: cliente.mensaje || '—' },
    { label: 'Notas', value: cliente.notas || '—' },
  ];

  const workers = cliente.workers ?? [];

  return (
    <div>
      <Link
        href="/dashboard/clientes"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{cliente.nombre}</h1>
            {isRefreshing ? <QueryRefreshingBadge /> : null}
          </div>
          <div className="mt-2">
            <StatusBadge estado={cliente.estado} />
          </div>
        </div>
        <Link
          href={`/dashboard/clientes/${cliente.id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Datos del cliente</h2>
          <dl className="space-y-3 text-sm">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className="text-slate-500">{field.label}</dt>
                <dd className="mt-0.5 text-slate-900">{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">
              Inmuebles ({inmuebles.length})
            </h2>
            {inmuebles.length === 0 ? (
              <p className="text-sm text-slate-500">Sin inmuebles vinculados</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {inmuebles.map((inmueble) => (
                  <li key={inmueble.id}>
                    <Link
                      href={`/dashboard/casas-${inmueble.tipo_operacion ?? 'venta'}/${inmueble.id}`}
                      className="font-medium text-emerald-600 hover:text-emerald-500"
                    >
                      {inmueble.direccion_piso_real || inmueble.barrio_distrito || 'Inmueble'}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">
              Trabajadores ({workers.length})
            </h2>
            {workers.length === 0 ? (
              <p className="text-sm text-slate-500">Sin trabajadores asignados</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {workers.map((worker) => (
                  <li key={worker.id}>
                    {canManageWorkers ? (
                      <Link
                        href={`/dashboard/workers/${worker.id}`}
                        className="font-medium text-emerald-600 hover:text-emerald-500"
                      >
                        {worker.nombre} ({getWorkerRolLabel(worker.rol)})
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-800">
                        {worker.nombre} ({getWorkerRolLabel(worker.rol)})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

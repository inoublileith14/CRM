'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ClienteForm } from '@/components/ClienteForm';
import {
  useClienteQuery,
  useInvalidateDashboardQueries,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { updateCliente } from '@/lib/clientes-api';
import { ClienteFormData } from '@/types/cliente';

export default function EditClientePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { invalidateClientes, invalidateCliente } = useInvalidateDashboardQueries();
  const clienteQuery = useClienteQuery(id);
  const { data: cliente, showInitialLoading } = useQueryUiState(clienteQuery);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clienteQuery.isError) {
      toast.error('Error al cargar cliente');
      router.push('/dashboard/clientes');
    }
  }, [clienteQuery.isError, router]);

  async function handleSubmit(data: ClienteFormData) {
    setSaving(true);
    try {
      await updateCliente(id, data);
      await invalidateCliente(id);
      await invalidateClientes();
      toast.success('Cliente actualizado');
      router.push('/dashboard/clientes');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar cliente',
      );
    } finally {
      setSaving(false);
    }
  }

  if (showInitialLoading) {
    return (
      <div>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando cliente…
        </div>
      </div>
    );
  }

  if (!cliente) {
    return null;
  }

  const initial: ClienteFormData = {
    nombre: cliente.nombre,
    email: cliente.email,
    telefono: cliente.telefono,
    ciudad: cliente.ciudad,
    barrio: cliente.barrio,
    distrito: cliente.distrito,
    tipo_nomina: cliente.tipo_nomina,
    tipo_cliente: cliente.tipo_cliente,
    estado: cliente.estado,
    origen: cliente.origen,
    estado_contacto: cliente.estado_contacto,
    descripcion: cliente.descripcion,
    ref_cliente: cliente.ref_cliente,
    mensaje: cliente.mensaje,
    fecha_contacto: cliente.fecha_contacto,
    fecha_entrada_inmueble: cliente.fecha_entrada_inmueble,
    presupuesto_maximo: cliente.presupuesto_maximo,
    banos: cliente.banos,
    fecha_ultima_gestion: cliente.fecha_ultima_gestion,
    notas: cliente.notas,
    tipo_operacion: cliente.tipo_operacion,
    inmueble_ids: cliente.inmueble_ids ?? [],
    worker_ids: cliente.worker_ids ?? [],
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/clientes"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a clientes
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar cliente</h1>
        <p className="mt-1 text-slate-500">{cliente.nombre}</p>
      </div>

      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ClienteForm
          initial={initial}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/dashboard/clientes')}
          submitLabel="Guardar cambios"
          loading={saving}
        />
      </div>
    </div>
  );
}

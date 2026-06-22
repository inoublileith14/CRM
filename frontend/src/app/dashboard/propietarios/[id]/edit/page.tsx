'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PropietarioForm } from '@/components/PropietarioForm';
import {
  useInvalidateDashboardQueries,
  usePropietarioQuery,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { updatePropietario } from '@/lib/propietarios-api';
import { getPropietariosListPath } from '@/lib/propietarios-paths';
import { PropietarioFormData } from '@/types/propietario';

export default function EditPropietarioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { invalidatePropietarios, invalidatePropietario } =
    useInvalidateDashboardQueries();
  const propietarioQuery = usePropietarioQuery(id);
  const { data: propietario, showInitialLoading } =
    useQueryUiState(propietarioQuery);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (propietarioQuery.isError) {
      toast.error('Error al cargar propietario');
      router.push(getPropietariosListPath(propietario?.tipo_operacion));
    }
  }, [propietarioQuery.isError, propietario?.tipo_operacion, router]);

  async function handleSubmit(data: PropietarioFormData) {
    setSaving(true);
    try {
      await updatePropietario(id, data);
      await invalidatePropietario(id);
      await invalidatePropietarios();
      toast.success('Propietario actualizado');
      router.push(getPropietariosListPath(propietario?.tipo_operacion));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar propietario',
      );
    } finally {
      setSaving(false);
    }
  }

  if (showInitialLoading) {
    return (
      <div>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando propietario…
        </div>
      </div>
    );
  }

  if (!propietario) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={getPropietariosListPath(propietario.tipo_operacion)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a propietarios
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar propietario</h1>
        <p className="mt-1 text-slate-500">{propietario.nombre}</p>
      </div>

      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <PropietarioForm
          initial={propietario}
          onSubmit={handleSubmit}
          onCancel={() =>
            router.push(getPropietariosListPath(propietario.tipo_operacion))
          }
          submitLabel="Guardar cambios"
          loading={saving}
        />
      </div>
    </div>
  );
}

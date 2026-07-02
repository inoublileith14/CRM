'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { InmuebleForm } from '@/components/InmuebleForm';
import { AdminOnlyGate } from '@/components/AdminOnlyGate';
import {
  useInmuebleQuery,
  useInvalidateDashboardQueries,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { updateInmueble } from '@/lib/inmuebles-api';
import { InmuebleFormData, TipoOperacion } from '@/types/inmueble';

interface EditInmueblePageContentProps {
  listPath: string;
  listLabel: string;
  expectedTipo?: TipoOperacion;
}

export function EditInmueblePageContent({
  listPath,
  listLabel,
  expectedTipo,
}: EditInmueblePageContentProps) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { invalidateInmueble, invalidateAllInmuebles } =
    useInvalidateDashboardQueries();
  const inmuebleQuery = useInmuebleQuery(id);
  const { data: inmueble, showInitialLoading } = useQueryUiState(inmuebleQuery);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!inmueble || !expectedTipo) return;
    if (inmueble.tipo_operacion !== expectedTipo) {
      toast.error('Este inmueble no pertenece a esta sección');
      router.push(listPath);
    }
  }, [inmueble, expectedTipo, listPath, router]);

  useEffect(() => {
    if (inmuebleQuery.isError) {
      toast.error('Error al cargar inmueble');
      router.push(listPath);
    }
  }, [inmuebleQuery.isError, listPath, router]);

  async function handleSubmit(data: InmuebleFormData) {
    setSaving(true);
    try {
      const { fecha_entrada_inmueble: _omit, ...updateData } = data;
      await updateInmueble(id, updateData);
      await invalidateInmueble(id);
      await invalidateAllInmuebles();
      toast.success('Inmueble actualizado');
      router.push(listPath);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar inmueble',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminOnlyGate>
      {showInitialLoading ? (
        <div>
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            Cargando inmueble…
          </div>
        </div>
      ) : !inmueble ? null : (
        <div>
          <div className="mb-6 sm:mb-8">
            <Link
              href={listPath}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a {listLabel}
            </Link>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Editar inmueble
            </h1>
            <p className="mt-1 text-slate-500">
              {inmueble.nombre_propi ||
                inmueble.direccion_piso_real ||
                'Sin nombre'}
            </p>
          </div>

          <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <InmuebleForm
              initial={inmueble}
              onSubmit={handleSubmit}
              onCancel={() => router.push(listPath)}
              submitLabel="Guardar cambios"
              loading={saving}
              fixedTipoOperacion={
                expectedTipo ?? inmueble.tipo_operacion ?? undefined
              }
            />
          </div>
        </div>
      )}
    </AdminOnlyGate>
  );
}

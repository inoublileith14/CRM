'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { WorkerForm } from '@/components/WorkerForm';
import {
  useInvalidateDashboardQueries,
  useWorkerQuery,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { updateWorker } from '@/lib/workers-api';
import { WorkerFormData } from '@/types/worker';

export default function EditWorkerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { invalidateWorkers, invalidateWorker } = useInvalidateDashboardQueries();
  const workerQuery = useWorkerQuery(id);
  const { data: worker, showInitialLoading } = useQueryUiState(workerQuery);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workerQuery.isError) {
      toast.error('Error al cargar trabajador');
      router.push('/dashboard/workers');
    }
  }, [workerQuery.isError, router]);

  async function handleSubmit(data: WorkerFormData) {
    setSaving(true);
    try {
      const updated = await updateWorker(id, data);
      await invalidateWorker(id);
      await invalidateWorkers();
      if (!worker?.profile_id && updated.profile_id) {
        toast.success(
          updated.invitation_sent_at
            ? 'Trabajador actualizado. Se ha enviado la invitación por correo.'
            : 'Trabajador vinculado a su cuenta. Si no llega el correo, usa «Reenviar invitación».',
        );
      } else {
        toast.success('Trabajador actualizado');
      }
      router.push('/dashboard/workers');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar trabajador',
      );
    } finally {
      setSaving(false);
    }
  }

  if (showInitialLoading) {
    return (
      <div>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando trabajador…
        </div>
      </div>
    );
  }

  if (!worker) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/workers"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a trabajadores
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar trabajador</h1>
        <p className="mt-1 text-slate-500">{worker.nombre}</p>
      </div>

      <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <WorkerForm
          initial={worker}
          hasLinkedProfile={Boolean(worker.profile_id)}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/dashboard/workers')}
          submitLabel="Guardar cambios"
          loading={saving}
          wide
        />
      </div>
    </div>
  );
}

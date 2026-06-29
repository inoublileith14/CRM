'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Pencil, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { UserAnalyticsPanel } from '@/components/users/UserAnalyticsPanel';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import { useWorkerQuery } from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import {
  getUserClientesHref,
  getUserEditHref,
  getUsersListHref,
} from '@/lib/user-routes';
import { resendWorkerInvitation } from '@/lib/workers-api';
import {
  getWorkerRolLabel,
  workerAccountStatus,
} from '@/types/worker';

export default function UserStatsPage() {
  const params = useParams();
  const id = params.id as string;
  const workerQuery = useWorkerQuery(id);
  const {
    data: worker,
    showInitialLoading,
    isRefreshing,
    showError,
  } = useQueryUiState(workerQuery);
  const [resending, setResending] = useState(false);

  if (showInitialLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        Cargando estadísticas…
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
  const clientes = worker.clientes ?? [];

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
          href={getUsersListHref(worker.rol)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a {getWorkerRolLabel(worker.rol).toLowerCase()}s
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Estadísticas · {worker.nombre}
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
              href={getUserClientesHref(worker.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Users className="h-4 w-4" />
              Clientes ({clientes.length})
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

      <UserAnalyticsPanel
        userId={worker.id}
        userName={worker.nombre}
        clientes={clientes}
      />
    </div>
  );
}

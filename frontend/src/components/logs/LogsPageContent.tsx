'use client';

import { ScrollText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '@/lib/audit-logs-api';
import { queryKeys } from '@/lib/query-keys';
import { useAuditLogsRealtime } from '@/hooks/use-audit-logs-realtime';

export function LogsPageContent() {
  const { t } = useLanguage();
  useAuditLogsRealtime();

  const logsQuery = useQuery({
    queryKey: queryKeys.auditLogs.all,
    queryFn: () => getAuditLogs(200),
    staleTime: 10_000,
  });

  const logs = logsQuery.data ?? [];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {t('logs.title')}
        </h1>
        <p className="mt-1 text-slate-500">{t('logs.subtitle')}</p>
      </div>

      {logsQuery.isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">Cargando…</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <ScrollText className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
          <p className="mt-4 text-sm text-slate-500">{t('logs.empty')}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {logs.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                <span className="shrink-0 text-xs text-slate-400">
                  {new Intl.DateTimeFormat('es-ES', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(row.created_at))}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                  {row.action}
                </span>
                <span className="shrink-0 text-xs font-semibold text-slate-600">
                  {row.actor_nombre ?? row.actor_id ?? '—'}
                </span>
                {row.entity_type ? (
                  <span className="shrink-0 rounded bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                    {row.entity_type}{row.entity_id ? `:${row.entity_id}` : ''}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
